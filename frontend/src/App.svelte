<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Canvas } from '@threlte/core';
  import Scene from './Scene.svelte';
  import CalendarGrid from './components/CalendarGrid.svelte';
  import EventScheduler from './components/EventScheduler.svelte';
  import { calendar } from './lib/stores/calendar';
  import './app.css';

  const { monthData, flipState, navigate, events } = calendar;

  let canNavigateBack = true;
  let canNavigateForward = true;

  $: canNavigateBack = $monthData.id > 1 || $monthData.year > 2020;
  $: canNavigateForward = $monthData.id < 12 || $monthData.year < 2030;

  function handleKeydown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === 'ArrowRight' || e.key === 'l') navigate(1);
    if (e.key === 'ArrowLeft' || e.key === 'h') navigate(-1);
    if (e.key === 'Home') calendar.jumpTo($monthData.year, 1);
    if (e.key === 'End') calendar.jumpTo($monthData.year, 12);
  }

  onMount(() => window.addEventListener('keydown', handleKeydown));
  onDestroy(() => window.removeEventListener('keydown', handleKeydown));

  $: totalEvents = $events.length;
  $: monthEvents = $events.filter(e => {
    const d = new Date(e.start);
    return d.getFullYear() === $monthData.year && d.getMonth() + 1 === $monthData.id;
  }).length;
</script>

<svelte:head>
  <title>Chronos — {$monthData.name} {$monthData.year}</title>
  <meta name="description" content="Chronos interactive calendar — {$monthData.name} {$monthData.year}" />
</svelte:head>

<div
  id="app"
  style="--accent: {$monthData.accent}; --bg: {$monthData.bg}; --text: {$monthData.textColor};"
  role="application"
  aria-label="Chronos Wall Calendar"
>
  <Canvas>
    <Scene />
  </Canvas>

  <div class="ui-layer">
    <header class="top-bar">
      <div class="brand-block">
        <span class="brand-dot" style="background: {$monthData.accent}" aria-hidden="true"></span>
        <span class="brand-name">Chronos</span>
      </div>

      <nav class="month-nav" aria-label="Month navigation">
        <button
          class="nav-btn"
          on:click={() => navigate(-1)}
          disabled={!canNavigateBack || $flipState !== 'idle'}
          aria-label="Previous month"
        >
          ←
        </button>

        <div class="month-display">
          <span class="month-name">{$monthData.name}</span>
          <span class="year-label">{$monthData.year}</span>
        </div>

        <button
          class="nav-btn"
          on:click={() => navigate(1)}
          disabled={!canNavigateForward || $flipState !== 'idle'}
          aria-label="Next month"
        >
          →
        </button>
      </nav>

      <div class="stats-block" aria-label="Event statistics">
        <span class="stat">
          <span class="stat-value">{monthEvents}</span>
          <span class="stat-label">this month</span>
        </span>
        <span class="stat">
          <span class="stat-value">{totalEvents}</span>
          <span class="stat-label">total</span>
        </span>
      </div>
    </header>

    <div class="calendar-pane" aria-label="{$monthData.name} {$monthData.year} calendar">
      <div class="month-hero">
        <h1 class="hero-month">{$monthData.name}</h1>
        <blockquote class="hero-quote">
          <p>{$monthData.quote}</p>
          <footer>— <cite>{$monthData.author}</cite></footer>
        </blockquote>
      </div>

      <div class="grid-wrapper">
        <CalendarGrid />
      </div>
    </div>

    <footer class="bottom-bar">
      <button
        class="add-btn"
        on:click={() => calendar.schedulerOpen.set(true)}
        aria-label="Add new event"
      >
        <span aria-hidden="true">+</span> New Event
      </button>
      <p class="keyboard-hint" aria-hidden="true">← → to navigate &nbsp;·&nbsp; Home / End to jump</p>
    </footer>
  </div>

  <EventScheduler />
</div>

<style>
  #app {
    width: 100vw;
    height: 100vh;
    position: relative;
    overflow: hidden;
    background: var(--bg);
  }

  .ui-layer {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    pointer-events: none;
    z-index: 10;
  }

  .ui-layer > * {
    pointer-events: auto;
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 28px;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .brand-block {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .brand-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    transition: background 0.4s ease;
  }

  .brand-name {
    font-size: 0.88rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.7);
  }

  .month-nav {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .nav-btn {
    background: none;
    border: 1px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.7);
    width: 36px;
    height: 36px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-btn:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
  }

  .nav-btn:disabled {
    opacity: 0.25;
    cursor: default;
  }

  .month-display {
    text-align: center;
    min-width: 140px;
  }

  .month-name {
    display: block;
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
    letter-spacing: -0.01em;
  }

  .year-label {
    display: block;
    font-size: 0.72rem;
    color: rgba(255,255,255,0.35);
    letter-spacing: 0.06em;
    margin-top: 2px;
  }

  .stats-block {
    display: flex;
    gap: 20px;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  .stat-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--accent);
    line-height: 1;
  }

  .stat-label {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .calendar-pane {
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    padding: 28px;
    gap: 24px;
    pointer-events: none;
  }

  .calendar-pane > * {
    pointer-events: auto;
  }

  .month-hero {
    width: 220px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding-bottom: 8px;
  }

  .hero-month {
    font-size: 3rem;
    font-weight: 700;
    color: var(--accent);
    letter-spacing: -0.03em;
    line-height: 1;
    margin-bottom: 16px;
  }

  .hero-quote {
    font-style: italic;
    color: rgba(255,255,255,0.4);
    font-size: 0.8rem;
    line-height: 1.6;
    border-left: 2px solid rgba(255,255,255,0.1);
    padding-left: 12px;
  }

  .hero-quote footer {
    margin-top: 6px;
    font-style: normal;
    font-size: 0.7rem;
    color: rgba(255,255,255,0.25);
  }

  .grid-wrapper {
    flex: 1;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .bottom-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 28px;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  .add-btn {
    background: var(--accent);
    color: #000;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    letter-spacing: 0.03em;
    transition: opacity 0.15s, transform 0.1s;
  }

  .add-btn:hover {
    opacity: 0.88;
    transform: translateY(-1px);
  }

  .keyboard-hint {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.2);
    letter-spacing: 0.04em;
  }

  @media (max-width: 680px) {
    .month-hero { display: none; }
    .stats-block { display: none; }
    .top-bar { padding: 14px 16px; }
    .calendar-pane { padding: 16px; }
    .bottom-bar { padding: 12px 16px; }
    .keyboard-hint { display: none; }
  }
</style>
