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
  // Initialize from incoming props only once per render; avoid referencing props inside tasks
  const noteIdSig = useSignal<string | null>(props.note?.id ?? null);
  const lastSavedSig = useSignal<number | null>(props.lastSavedAt ?? null);

  // Mirror props into signals immediately during render; avoid reading props in tasks
  noteIdSig.value = props.note?.id ?? null;
  lastSavedSig.value = props.lastSavedAt ?? null;

  // Track signal values only
  useTask$(({ track }) => {
    track(() => noteIdSig.value);
  });

  useTask$(({ track }) => {
    track(() => lastSavedSig.value);
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

  // Qwik event$ handlers should accept the event and element directly
  const handleTitle = event$((_: InputEvent, el: HTMLInputElement) => {
    const id = noteIdSig.value;
    if (!id) return;
    window.dispatchEvent(
      new CustomEvent("note:update", { detail: { id, patch: { title: el.value } } }),
    );
  });

  const handleContent = event$((_: InputEvent, el: HTMLTextAreaElement) => {
    const id = noteIdSig.value;
    if (!id) return;
    window.dispatchEvent(
      new CustomEvent("note:update", { detail: { id, patch: { content: el.value } } }),
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
