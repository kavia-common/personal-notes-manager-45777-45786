import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useNotes } from "~/hooks/useNotes";
import { NoteList } from "~/components/NoteList";
import { NoteEditor } from "~/components/NoteEditor";

// PUBLIC_INTERFACE
export default component$(() => {
  const { store, createNote, updateNote, deleteNote, selectNote, filteredAndSorted } = useNotes();
  const filtered = useSignal(store.notes);

  useVisibleTask$(async ({ track, cleanup }) => {
    track(() => store.searchQuery);
    track(() => store.notes);
    filtered.value = await filteredAndSorted();

    // Bridge child custom events to store actions
    const onUpdate = (e: any) => {
      const { id, patch } = e.detail || {};
      if (id) updateNote(id, patch || {});
    };
    const onDelete = (e: any) => {
      const { id } = e.detail || {};
      if (id) deleteNote(id);
    };
    const onCreate = () => createNote();
    const onSelect = (e: any) => {
      const { id } = e.detail || {};
      if (id) selectNote(id);
    };
    const onSearch = (e: any) => {
      const { q } = e.detail || {};
      store.searchQuery = q ?? "";
    };

    window.addEventListener("note:update", onUpdate as EventListener);
    window.addEventListener("note:delete", onDelete as EventListener);
    window.addEventListener("note:create", onCreate as EventListener);
    window.addEventListener("note:select", onSelect as EventListener);
    window.addEventListener("note:search", onSearch as EventListener);

    cleanup(() => {
      window.removeEventListener("note:update", onUpdate as EventListener);
      window.removeEventListener("note:delete", onDelete as EventListener);
      window.removeEventListener("note:create", onCreate as EventListener);
      window.removeEventListener("note:select", onSelect as EventListener);
      window.removeEventListener("note:search", onSearch as EventListener);
    });
  });

  const onSearchChange = $((val: string) => {
    store.searchQuery = val;
  });

  const selected = () => store.notes.find((n) => n.id === store.selectedId) ?? null;

  return (
    <div class="app-layout">
      <NoteList
        notes={filtered.value}
        selectedId={store.selectedId}
        onCreate={createNote}
        onSelect={(id) => selectNote(id)}
        searchQuery={store.searchQuery}
        onSearchChange={onSearchChange}
      />
      <NoteEditor
        note={selected()}
        onUpdate={$(() => {})}
        onDelete={$(() => {})}
        lastSavedAt={store.lastSavedAt}
      />
    </div>
  );
});

export const head: DocumentHead = {
  title: "Personal Notes",
  meta: [
    {
      name: "description",
      content: "Create, edit, and manage your notes with a clean, modern Qwik UI.",
    },
  ],
};
