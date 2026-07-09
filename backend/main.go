package main

import (
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/websocket/v2"
)

type Event struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Start       string `json:"start"`
	End         string `json:"end"`
	Color       string `json:"color"`
	Description string `json:"description,omitempty"`
}

type WsMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

var (
	mu      sync.RWMutex
	events  = make([]Event, 0, 64)
	clients = make(map[string]*websocket.Conn)
	clientsMu sync.RWMutex
)

func main() {
	app := fiber.New(fiber.Config{
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		BodyLimit:    32 * 1024,
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal error"})
		},
	})

	app.Use(logger.New())

	corsOrigin := os.Getenv("CORS_ORIGIN")
	if corsOrigin == "" {
		corsOrigin = "http://localhost:5173"
	}
	app.Use(cors.New(cors.Config{
		AllowOrigins: corsOrigin,
		AllowMethods: "GET,POST,DELETE",
		AllowHeaders: "Content-Type",
	}))

	app.Use(limiter.New(limiter.Config{
		Max:        60,
		Expiration: time.Minute,
	}))

	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	api := app.Group("/api")

	api.Get("/events", func(c *fiber.Ctx) error {
		mu.RLock()
		defer mu.RUnlock()
		return c.JSON(events)
	})

	api.Post("/events", func(c *fiber.Ctx) error {
		var body Event
		if err := c.BodyParser(&body); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
		}
		if err := validateEvent(&body); err != nil {
			return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
		}
		body.ID = fmt.Sprintf("evt-%d", time.Now().UnixNano())
		mu.Lock()
		events = append(events, body)
		mu.Unlock()
		broadcast(WsMessage{Type: "event:create", Payload: body})
		return c.Status(fiber.StatusCreated).JSON(body)
	})

	api.Delete("/events/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		mu.Lock()
		defer mu.Unlock()
		idx := -1
		for i, e := range events {
			if e.ID == id {
				idx = i
				break
			}
		}
		if idx == -1 {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "not found"})
		}
		events = append(events[:idx], events[idx+1:]...)
		broadcast(WsMessage{Type: "event:delete", Payload: fiber.Map{"id": id}})
		return c.SendStatus(fiber.StatusNoContent)
	})

	api.Post("/schedule", func(c *fiber.Ctx) error {
		var body struct {
			Input string `json:"input"`
		}
		if err := c.BodyParser(&body); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
		}
		body.Input = strings.TrimSpace(body.Input)
		if body.Input == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "input required"})
		}
		parsed := parseNLInput(body.Input)
		return c.JSON(parsed)
	})

	app.Get("/ws/:clientID", websocket.New(func(c *websocket.Conn) {
		id := c.Params("clientID")
		if id == "" || len(id) > 64 {
			c.Close()
			return
		}
		clientsMu.Lock()
		clients[id] = c
		clientsMu.Unlock()

		defer func() {
			clientsMu.Lock()
			delete(clients, id)
			clientsMu.Unlock()
			c.Close()
		}()

		for {
			if _, _, err := c.ReadMessage(); err != nil {
				break
			}
		}
	}))

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}
	addr := os.Getenv("HOST")
	if addr == "" {
		addr = "127.0.0.1"
	}
	log.Fatal(app.Listen(addr + ":" + port))
}

func validateEvent(e *Event) error {
	e.Title = strings.TrimSpace(e.Title)
	if e.Title == "" {
		return fmt.Errorf("title required")
	}
	if len(e.Title) > 200 {
		return fmt.Errorf("title too long")
	}
	if _, err := time.Parse(time.RFC3339, e.Start); err != nil {
		return fmt.Errorf("invalid start time")
	}
	if _, err := time.Parse(time.RFC3339, e.End); err != nil {
		return fmt.Errorf("invalid end time")
	}
	if e.Color == "" {
		e.Color = "#7eb8f7"
	}
	return nil
}

func parseNLInput(input string) fiber.Map {
	lower := strings.ToLower(input)
	title := input

	ref := time.Now()
	var date time.Time

	switch {
	case strings.Contains(lower, "today"):
		date = ref
	case strings.Contains(lower, "tomorrow"):
		date = ref.AddDate(0, 0, 1)
	default:
		date = ref.AddDate(0, 0, 7)
	}

	dow := []string{"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"}
	for i, day := range dow {
		if strings.Contains(lower, day) {
			offset := (i + 1 - int(ref.Weekday()) + 7) % 7
			if offset == 0 {
				offset = 7
			}
			date = ref.AddDate(0, 0, offset)
			break
		}
	}

	hour := 9
	for h := 1; h <= 12; h++ {
		suffix := ""
		if strings.Contains(lower, fmt.Sprintf("%dam", h)) || strings.Contains(lower, fmt.Sprintf("%d am", h)) {
			suffix = "am"
		} else if strings.Contains(lower, fmt.Sprintf("%dpm", h)) || strings.Contains(lower, fmt.Sprintf("%d pm", h)) {
			suffix = "pm"
		}
		if suffix == "am" {
			hour = h
		} else if suffix == "pm" {
			hour = h + 12
		}
	}

	start := time.Date(date.Year(), date.Month(), date.Day(), hour, 0, 0, 0, time.Local)
	end := start.Add(time.Hour)

	stopWords := []string{"at", "on", "next", "this", "tomorrow", "today"}
	for _, kw := range stopWords {
		title = strings.ReplaceAll(title, " "+kw+" ", " ")
	}
	title = strings.Join(strings.Fields(title), " ")

	return fiber.Map{
		"title": title,
		"start": start.Format(time.RFC3339),
		"end":   end.Format(time.RFC3339),
		"color": "#7eb8f7",
	}
}

func broadcast(msg WsMessage) {
	clientsMu.RLock()
	defer clientsMu.RUnlock()
	for _, conn := range clients {
		_ = conn.WriteJSON(msg)
	}
}
