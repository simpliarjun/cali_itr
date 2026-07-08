import { writable, derived, get } from 'svelte/store';
import type { CalendarEvent, FlipState } from '../calendar/types';
import { getMonthData } from '../calendar/utils';

function snapshot(): { year: number; month: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function createCalendarStore() {
  const now = snapshot();
  const current = writable<{ year: number; month: number }>(now);
  const flipState = writable<FlipState>('idle');
  const events = writable<CalendarEvent[]>(readStorage());
  const selectedDay = writable<number | null>(null);
  const schedulerOpen = writable(false);

  const monthData = derived(current, ($c) => getMonthData($c.year, $c.month));

  function readStorage(): CalendarEvent[] {
    try {
      const raw = localStorage.getItem('chronos:events');
      return raw ? (JSON.parse(raw) as CalendarEvent[]) : [];
    } catch {
      return [];
    }
  }

  events.subscribe((evts) => {
    try {
      localStorage.setItem('chronos:events', JSON.stringify(evts));
    } catch { /* quota exceeded */ }
  });

  function navigate(delta: 1 | -1) {
    if (get(flipState) !== 'idle') return;
    current.update(({ year, month }) => {
      let m = month + delta;
      let y = year;
      if (m > 12) { m = 1; y++; }
      if (m < 1)  { m = 12; y--; }
      return { year: y, month: m };
    });
    flipState.set(delta === 1 ? 'forward' : 'backward');
  }

  function jumpTo(year: number, month: number) {
    if (get(flipState) !== 'idle') return;
    const c = get(current);
    const dir = (year * 12 + month) > (c.year * 12 + c.month) ? 1 : -1;
    current.set({ year, month });
    flipState.set(dir === 1 ? 'forward' : 'backward');
  }

  function commitFlip() {
    flipState.set('idle');
  }

  function addEvent(evt: Omit<CalendarEvent, 'id'>) {
    const id = crypto.randomUUID();
    events.update((evts) => [...evts, { ...evt, id }]);
    return id;
  }

  function removeEvent(id: string) {
    events.update((evts) => evts.filter((e) => e.id !== id));
  }

  function eventsForDay(year: number, month: number, day: number): CalendarEvent[] {
    const evts = get(events);
    const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return evts.filter((e) => e.start.startsWith(key));
  }

  return {
    current,
    flipState,
    events,
    monthData,
    selectedDay,
    schedulerOpen,
    navigate,
    jumpTo,
    commitFlip,
    addEvent,
    removeEvent,
    eventsForDay,
  };
}

export const calendar = createCalendarStore();
