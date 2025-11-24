import { component$, event$, useSignal, useTask$ } from "@builder.io/qwik";
import type { Note } from "~/hooks/useNotes";

export type NoteEditorProps = {
  note: Note | null;
  onUpdate: (id: string, patch: Partial<Pick<Note, "title" | "content">>) => void;
  onDelete: (id: string) => void;
  lastSavedAt: number | null;
};

/**
 * PUBLIC_INTERFACE
 * NoteEditor renders the main editor panel for the selected note.
 */
export const NoteEditor = component$<NoteEditorProps>((props) => {
  const noteIdSig = useSignal<string | null>(props.note?.id ?? null);
  const lastSavedSig = useSignal<number | null>(props.lastSavedAt ?? null);

  useTask$(({ track }) => {
    // Read current values into locals first, then track those primitives
    const currentId = props.note ? props.note.id : null;
    track(() => currentId);
    noteIdSig.value = currentId;
  });

  useTask$(({ track }) => {
    const saved = props.lastSavedAt ?? null;
    track(() => saved);
    lastSavedSig.value = saved;
  });

  if (!props.note) {
    return (
      <section class="editor empty-state" aria-label="Note editor">
        <div class="empty-card">
          <h2>No note selected</h2>
          <p>Select a note from the left or create a new one to get started.</p>
        </div>
      </section>
    );
  }

  const handleTitle = event$<InputEvent>((_, el) => {
    const id = noteIdSig.value;
    if (!id) return;
    const input = el as HTMLInputElement;
    // Dispatch a custom event; parent passes function via attribute on element dataset is avoided
    window.dispatchEvent(
      new CustomEvent("note:update", { detail: { id, patch: { title: input.value } } }),
    );
  });

  const handleContent = event$<InputEvent>((_, el) => {
    const id = noteIdSig.value;
    if (!id) return;
    const ta = el as HTMLTextAreaElement;
    window.dispatchEvent(
      new CustomEvent("note:update", { detail: { id, patch: { content: ta.value } } }),
    );
  });

  const handleDelete = event$(() => {
    const id = noteIdSig.value;
    if (!id) return;
    const confirmDelete = window.confirm("Delete this note? This cannot be undone.");
    if (confirmDelete) {
      window.dispatchEvent(new CustomEvent("note:delete", { detail: { id } }));
    }
  });

  // Bridge: listen at parent to perform actions. Since this is child component,
  // parent index.tsx will register global listeners to call its callbacks.

  return (
    <section class="editor" aria-label="Note editor">
      <div class="editor-header">
        <label for="title" class="input-label">
          Title
        </label>
        <input
          id="title"
          class="input title-input"
          type="text"
          value={props.note.title}
          placeholder="Note title..."
          onInput$={handleTitle}
        />
        <div class="save-indicator" aria-live="polite">
          {lastSavedSig.value
            ? `Last saved ${new Date(lastSavedSig.value).toLocaleTimeString()}`
            : "Not saved yet"}
        </div>
      </div>

      <div class="editor-body">
        <label for="content" class="input-label">
          Content
        </label>
        <textarea
          id="content"
          class="textarea"
          placeholder="Start typing..."
          value={props.note.content}
          onInput$={handleContent}
        />
      </div>

      <div class="editor-footer">
        <button class="btn btn-danger" onClick$={handleDelete} aria-label="Delete note">
          Delete
        </button>
      </div>
    </section>
  );
});
