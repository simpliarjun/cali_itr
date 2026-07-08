<script lang="ts">
  import { calendar } from '../lib/stores/calendar';
  import { buildGridCells } from '../lib/calendar/utils';
  import DayCell from './DayCell.svelte';

  const { monthData, selectedDay, eventsForDay } = calendar;

  $: cells = buildGridCells($monthData);
  $: today = new Date();

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function isToday(day: number): boolean {
    return (
      today.getDate() === day &&
      today.getMonth() + 1 === $monthData.id &&
      today.getFullYear() === $monthData.year
    );
  }

  function isWeekend(colIndex: number): boolean {
    return colIndex === 0 || colIndex === 6;
  }

  function selectDay(day: number | null) {
    if (day === null) return;
    selectedDay.set(day);
    calendar.schedulerOpen.set(true);
  }
</script>

<div
  class="calendar-grid-root"
  style="--accent: {$monthData.accent}; --bg: {$monthData.bg}; --text: {$monthData.textColor};"
  role="grid"
  aria-label="{$monthData.name} {$monthData.year}"
>
  <div class="weekday-row" role="row">
    {#each weekdays as day, i}
      <div
        class="weekday-label"
        class:weekend={isWeekend(i)}
        role="columnheader"
        aria-label={day}
      >
        {day}
      </div>
    {/each}
  </div>

  <div class="day-grid" role="rowgroup">
    {#each cells as cell, idx}
      <DayCell
        day={cell}
        isToday={cell !== null && isToday(cell)}
        isWeekend={isWeekend(idx % 7)}
        isSelected={cell === $selectedDay}
        hasEvents={cell !== null && eventsForDay($monthData.year, $monthData.id, cell).length > 0}
        eventCount={cell !== null ? eventsForDay($monthData.year, $monthData.id, cell).length : 0}
        on:select={() => selectDay(cell)}
      />
    {/each}
  </div>
</div>

<style>
  .calendar-grid-root {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0 16px 16px;
  }

  .weekday-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 4px;
  }

  .weekday-label {
    text-align: center;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--text);
    opacity: 0.45;
    padding: 4px 0;
    text-transform: uppercase;
  }

  .weekday-label.weekend {
    opacity: 0.25;
  }

  .day-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    flex: 1;
  }
</style>
