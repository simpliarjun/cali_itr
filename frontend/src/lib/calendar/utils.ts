import type { CalendarEvent, MonthData } from './types';

interface MonthMeta {
  name: string;
  accent: string;
  bg: string;
  text: string;
  quote: string;
  author: string;
}

const MONTHS: MonthMeta[] = [
  { name: 'January',   accent: '#7eb8f7', bg: '#0d1f3c', text: '#dce9fc',
    quote: 'Every moment is a fresh beginning.',                                         author: 'T.S. Eliot' },
  { name: 'February',  accent: '#f0a7c0', bg: '#1f0d1a', text: '#fce4ee',
    quote: 'The day is what you make it.',                                                author: 'Josie Bisset' },
  { name: 'March',     accent: '#7df5b0', bg: '#0d1f16', text: '#d5fce7',
    quote: 'In like a lion, out like a lamb.',                                            author: 'Proverb' },
  { name: 'April',     accent: '#f7e07e', bg: '#1f1a0d', text: '#fdf5d5',
    quote: 'April showers bring May flowers.',                                            author: 'Proverb' },
  { name: 'May',       accent: '#b3f77e', bg: '#141f0d', text: '#e5fdd5',
    quote: 'The world is charged with the grandeur of God.',                             author: 'G.M. Hopkins' },
  { name: 'June',      accent: '#f7c37e', bg: '#1f140d', text: '#fdecd5',
    quote: 'Summer afternoon — to me those have always been the two most beautiful words.', author: 'Henry James' },
  { name: 'July',      accent: '#f77e7e', bg: '#1f0d0d', text: '#fdd5d5',
    quote: 'Deep summer is when laziness finds respectability.',                         author: 'Sam Keen' },
  { name: 'August',    accent: '#f7b27e', bg: '#1f130d', text: '#fde8d5',
    quote: 'Autumn is a second spring when every leaf is a flower.',                    author: 'Albert Camus' },
  { name: 'September', accent: '#d4a574', bg: '#1a1108', text: '#f5e6d3',
    quote: 'Listen! the wind is rising.',                                                 author: 'Humbert Wolfe' },
  { name: 'October',   accent: '#a87e7e', bg: '#1a0f0f', text: '#ead5d5',
    quote: 'October is the fallen leaf.',                                                 author: 'Hal Borland' },
  { name: 'November',  accent: '#8fa8c8', bg: '#0f1826', text: '#d5e3f5',
    quote: 'No spring beauty hath such grace as I have seen in one autumnal face.',     author: 'John Donne' },
  { name: 'December',  accent: '#c8d4e8', bg: '#0f1220', text: '#e8edf8',
    quote: 'In the depth of winter I finally learned that within me lay an invincible summer.', author: 'Albert Camus' },
];

export function getMonthData(year: number, month: number): MonthData {
  const m = MONTHS[month - 1];
  const first = new Date(year, month - 1, 1);
  return {
    id: month,
    name: m.name,
    year,
    days: new Date(year, month, 0).getDate(),
    startDay: first.getDay(),
    accent: m.accent,
    bg: m.bg,
    textColor: m.text,
    quote: m.quote,
    author: m.author,
  };
}

export function buildGridCells(month: MonthData): Array<number | null> {
  const cells: Array<number | null> = [];
  for (let i = 0; i < month.startDay; i++) cells.push(null);
  for (let d = 1; d <= month.days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function resolveDate(input: string, ref: Date): Date {
  const s = input.toLowerCase();
  if (s.includes('today')) return new Date(ref);
  if (s.includes('tomorrow')) {
    const d = new Date(ref);
    d.setDate(d.getDate() + 1);
    return d;
  }
  const dow = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  for (let i = 0; i < dow.length; i++) {
    if (s.includes(dow[i])) {
      const d = new Date(ref);
      const gap = (i - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + gap);
      return d;
    }
  }
  const hit = s.match(/(\d{1,2})(?:st|nd|rd|th)?(?:\s+(?:of\s+)?([a-z]+))?/);
  if (hit) {
    const day = parseInt(hit[1], 10);
    if (day >= 1 && day <= 31) {
      const mi = hit[2]
        ? MONTHS.findIndex(m => m.name.toLowerCase().startsWith(hit[2]))
        : ref.getMonth();
      if (mi !== -1) return new Date(ref.getFullYear(), mi >= 0 ? mi : ref.getMonth(), day);
    }
  }
  return new Date(ref);
}

function resolveHour(input: string): { hour: number; minute: number } {
  const m = input.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return { hour: 9, minute: 0 };
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const mer = m[3]?.toLowerCase();
  if (mer === 'pm' && h < 12) h += 12;
  if (mer === 'am' && h === 12) h = 0;
  return { hour: h, minute: min };
}

export function parseEventFromText(raw: string): Partial<CalendarEvent> {
  const ref = new Date();
  const date = resolveDate(raw, ref);
  const { hour, minute } = resolveHour(raw);

  const title = raw
    .replace(/\b(at|on|next|this|tomorrow|today)\b/gi, '')
    .replace(/\d{1,2}(?::\d{2})?\s*(?:am|pm)/gi, '')
    .replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
  const end   = new Date(start.getTime() + 60 * 60 * 1000);

  return {
    title: title || 'Untitled event',
    start: start.toISOString(),
    end:   end.toISOString(),
    color: '#7eb8f7',
  };
}
