export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color: string;
  description?: string;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface MonthData {
  id: number;
  name: string;
  year: number;
  days: number;
  startDay: number;
  accent: string;
  bg: string;
  textColor: string;
  quote: string;
  author: string;
}

export type FlipState = 'idle' | 'forward' | 'backward';

export interface WsMessage {
  type: 'event:create' | 'event:delete' | 'event:update' | 'cursor';
  payload: unknown;
}
