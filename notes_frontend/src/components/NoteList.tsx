import { component$, event$, useSignal, useTask$, type QRL } from "@builder.io/qwik";
import type { Note } from "~/hooks/useNotes";

export type NoteListProps = {
  notes: Note[];
  selectedId: string | null;
  // QRL callback props (can be optionally used directly by parents)
  onCreate$?: QRL<() => void | Promise<void>>;
  onSelect$?: QRL<(id: string) => void | Promise<void>>;
  searchQuery: string;
  onSearchChange$?: QRL<(val: string) => void | Promise<void>>;
};

function timeAgo(ts: number) {
  const delta = Math.floor((Date.now() - ts) / 1000);
  if (delta < 60) return "just now";
  const minutes = Math.floor(delta / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** 
 * PUBLIC_INTERFACE
 * NoteList renders a searchable, selectable list of notes.
 * Props accept QRL callbacks (onCreate$, onSelect$, onSearchChange$) allowing parents to pass serializable handlers.
 */
export const NoteList = component$<NoteListProps>((props) => {
  const selectedSig = useSignal<string | null>(props.selectedId);
  const searchSig = useSignal<string>(props.searchQuery);

  // Mirror props to signals during render
  selectedSig.value = props.selectedId;
  searchSig.value = props.searchQuery;

  // Only track signals
  useTask$(({ track }) => {
    track(() => selectedSig.value);
  });

  useTask$(({ track }) => {
    track(() => searchSig.value);
  });

  const createHandler = event$(async () => {
    // Prefer direct QRL call if provided
    if (props.onCreate$) {
      await props.onCreate$();
    } else {
      // Fallback: use a custom event to avoid capturing parent functions
      window.dispatchEvent(new CustomEvent("note:create"));
    }
  });

  // Use direct signature, not a factory
  const searchHandler = event$(async (_: InputEvent, el: HTMLInputElement) => {
    if (props.onSearchChange$) {
      await props.onSearchChange$(el.value);
    } else {
      window.dispatchEvent(
        new CustomEvent("note:search", { detail: { q: el.value } }),
      );
    }
  });

  return (
    <aside class="sidebar" aria-label="Notes list">
      <div class="sidebar-header">
        <h1 class="app-title">Notes</h1>
        <button class="btn btn-primary" onClick$={createHandler} aria-label="Create new note">
          + New Note
        </button>
      </div>

      <div class="search-wrap">
        <label for="search" class="sr-only">
          Search notes
        </label>
        <input
          id="search"
          class="input"
          type="text"
          placeholder="Search notes..."
          value={searchSig.value}
          onInput$={searchHandler}
        />
      </div>

      <ul role="listbox" class="note-list">
        {props.notes.map((n) => {
          const isActive = selectedSig.value === n.id;

          const clickHandler = event$(async () => {
            if (props.onSelect$) {
              await props.onSelect$(n.id);
            } else {
              window.dispatchEvent(new CustomEvent("note:select", { detail: { id: n.id } }));
            }
          });

          const keyHandler = event$(async (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (props.onSelect$) {
                await props.onSelect$(n.id);
              } else {
                window.dispatchEvent(new CustomEvent("note:select", { detail: { id: n.id } }));
              }
            }
          });

          return (
            <li
              key={n.id}
              role="option"
              aria-selected={isActive}
              class={{
                "note-item": true,
                active: isActive,
              }}
              tabIndex={0}
              onClick$={clickHandler}
              onKeyDown$={keyHandler}
            >
              <div class="note-item-title">{n.title || "Untitled"}</div>
              <div class="note-item-meta">Updated {timeAgo(n.updatedAt)}</div>
            </li>
          );
        })}
        {props.notes.length === 0 && <li class="note-empty">No notes found.</li>}
      </ul>
    </aside>
  );
});
