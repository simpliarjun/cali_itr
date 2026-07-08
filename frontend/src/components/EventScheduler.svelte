<script lang="ts">
  import { calendar } from '../lib/stores/calendar';
  import { parseEventFromText } from '../lib/calendar/utils';

  const { schedulerOpen, selectedDay, monthData, addEvent } = calendar;

  let inputValue = '';
  let errorMsg = '';
  let successMsg = '';

  function close() {
    schedulerOpen.set(false);
    selectedDay.set(null);
    inputValue = '';
    errorMsg = '';
    successMsg = '';
  }

  function submit(e: SubmitEvent) {
    e.preventDefault();
    errorMsg = '';
    successMsg = '';

    const trimmed = inputValue.trim();
    if (!trimmed) {
      errorMsg = 'Please describe your event.';
      return;
    }

    const parsed = parseEventFromText(trimmed);

    if ($selectedDay !== null) {
      const d = new Date($monthData.year, $monthData.id - 1, $selectedDay, 9, 0);
      parsed.start = d.toISOString();
      parsed.end = new Date(d.getTime() + 60 * 60 * 1000).toISOString();
    }

    addEvent({
      title: parsed.title ?? 'Untitled',
      start: parsed.start ?? new Date().toISOString(),
      end: parsed.end ?? new Date().toISOString(),
      color: parsed.color ?? '#7eb8f7',
    });

    successMsg = `"${parsed.title}" added`;
    inputValue = '';
    setTimeout(close, 900);
  }

  function deleteEvent(id: string) {
    calendar.removeEvent(id);
  }

  $: dayEvents = $selectedDay !== null
    ? calendar.eventsForDay($monthData.year, $monthData.id, $selectedDay)
    : [];
</script>

{#if $schedulerOpen}
  <div
    class="backdrop"
    role="dialog"
    aria-modal="true"
    aria-label="Event scheduler"
    tabindex="-1"
    on:keydown={(e) => e.key === 'Escape' && close()}
  >
    <div
      class="panel"
      role="document"
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <header class="panel-header">
        <div>
          <p class="panel-sub">{$monthData.name} {$monthData.year}</p>
          {#if $selectedDay}
            <h2 class="panel-title">Day {$selectedDay}</h2>
          {:else}
            <h2 class="panel-title">New Event</h2>
          {/if}
        </div>
        <button class="close-btn" on:click={close} aria-label="Close">✕</button>
      </header>

      {#if dayEvents.length > 0}
        <ul class="event-list" aria-label="Events on this day">
          {#each dayEvents as evt (evt.id)}
            <li class="event-item">
              <span class="event-dot" style="background: {evt.color}" aria-hidden="true"></span>
              <div class="event-info">
                <span class="event-title">{evt.title}</span>
                <span class="event-time">
                  {new Date(evt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <button
                class="delete-btn"
                on:click={() => deleteEvent(evt.id)}
                aria-label="Delete {evt.title}"
              >✕</button>
            </li>
          {/each}
        </ul>
      {/if}

      <form class="event-form" on:submit={submit}>
        <label class="form-label" for="event-input">
          Describe your event
        </label>
        <input
          id="event-input"
          class="event-input"
          bind:value={inputValue}
          placeholder="e.g. Dentist next Thursday at 3pm"
          autocomplete="off"
          spellcheck="false"
        />
        {#if errorMsg}
          <p class="form-error" role="alert">{errorMsg}</p>
        {/if}
        {#if successMsg}
          <p class="form-success" role="status">{successMsg}</p>
        {/if}
        <button type="submit" class="submit-btn">Add Event</button>
      </form>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
  }

  .panel {
    background: #111118;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 28px;
    width: min(420px, 92vw);
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.7);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .panel-sub {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.35);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .panel-title {
    font-size: 1.4rem;
    font-weight: 600;
    color: #fff;
  }

  .close-btn {
    background: none;
    border: none;
    color: rgba(255,255,255,0.4);
    cursor: pointer;
    font-size: 1rem;
    padding: 4px;
    transition: color 0.15s;
    line-height: 1;
  }
  .close-btn:hover { color: #fff; }

  .event-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    padding-bottom: 16px;
  }

  .event-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: rgba(255,255,255,0.04);
    border-radius: 8px;
  }

  .event-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .event-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .event-title {
    font-size: 0.85rem;
    color: #f0f0f0;
    font-weight: 500;
  }

  .event-time {
    font-size: 0.72rem;
    color: rgba(255,255,255,0.4);
  }

  .delete-btn {
    background: none;
    border: none;
    color: rgba(255,255,255,0.25);
    cursor: pointer;
    font-size: 0.75rem;
    padding: 4px;
    transition: color 0.15s;
  }
  .delete-btn:hover { color: #f77; }

  .event-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .form-label {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.4);
    letter-spacing: 0.05em;
  }

  .event-input {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px;
    padding: 12px 14px;
    color: #fff;
    font-size: 0.9rem;
    width: 100%;
    transition: border-color 0.2s;
  }
  .event-input:focus {
    outline: none;
    border-color: rgba(255,255,255,0.3);
  }
  .event-input::placeholder { color: rgba(255,255,255,0.2); }

  .form-error {
    font-size: 0.78rem;
    color: #f87;
  }

  .form-success {
    font-size: 0.78rem;
    color: #7f8;
  }

  .submit-btn {
    background: #fff;
    color: #000;
    border: none;
    border-radius: 8px;
    padding: 12px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .submit-btn:hover { opacity: 0.85; }
</style>
