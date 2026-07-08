<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let day: number | null;
  export let isToday = false;
  export let isWeekend = false;
  export let isSelected = false;
  export let hasEvents = false;
  export let eventCount = 0;

  const dispatch = createEventDispatcher<{ select: void }>();
</script>

<div
  class="day-cell"
  class:today={isToday}
  class:weekend={isWeekend}
  class:selected={isSelected}
  class:empty={day === null}
  class:has-events={hasEvents}
  role="gridcell"
  aria-current={isToday ? 'date' : undefined}
  aria-selected={isSelected}
  aria-label={day ? `Day ${day}${hasEvents ? `, ${eventCount} event${eventCount > 1 ? 's' : ''}` : ''}` : undefined}
  tabindex={day !== null ? 0 : -1}
  on:click={() => day !== null && dispatch('select')}
  on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && day !== null && dispatch('select')}
>
  {#if day !== null}
    <span class="day-number">{day}</span>
    {#if hasEvents}
      <div class="event-pips" aria-hidden="true">
        {#each Array(Math.min(eventCount, 3)) as _}
          <span class="pip"></span>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .day-cell {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding-top: 6px;
    border-radius: 8px;
    cursor: pointer;
    min-height: 52px;
    transition: background 0.15s ease, transform 0.1s ease;
    border: 1px solid transparent;
  }

  .day-cell:not(.empty):hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateY(-1px);
  }

  .day-cell:not(.empty):focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .day-cell.empty {
    cursor: default;
    pointer-events: none;
  }

  .day-cell.today {
    background: var(--accent);
    border-color: transparent;
  }

  .day-cell.today .day-number {
    color: #000;
    font-weight: 700;
  }

  .day-cell.selected:not(.today) {
    border-color: var(--accent);
    background: rgba(255,255,255,0.04);
  }

  .day-cell.weekend:not(.today) .day-number {
    opacity: 0.45;
  }

  .day-number {
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--text);
    line-height: 1;
  }

  .event-pips {
    display: flex;
    gap: 3px;
    margin-top: 4px;
  }

  .pip {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--accent);
    opacity: 0.75;
  }

  .day-cell.today .pip {
    background: #000;
  }
</style>
