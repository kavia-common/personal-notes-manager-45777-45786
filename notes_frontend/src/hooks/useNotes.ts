import { $, useStore, useVisibleTask$ } from "@builder.io/qwik";

/**
 * Note model type
 */
export type Note = {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
};

type NotesStore = {
  notes: Note[];
  selectedId: string | null;
  searchQuery: string;
  lastSavedAt: number | null;
};

const STORAGE_KEY = "notes_store_v1";

/**
 * Generate a simple unique id using timestamp and random suffix
 */
const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * PUBLIC_INTERFACE
 * useNotes provides a Qwik store for managing notes with localStorage persistence.
 * - notes: array of Note
 * - selectedId: currently selected note id
 * - searchQuery: for filtering note titles
 * - lastSavedAt: timestamp of last save to localStorage
 * 
 * Methods:
 * - createNote(): creates a new note and selects it
 * - updateNote(id, patch): updates fields and refreshes updatedAt
 * - deleteNote(id): deletes note and updates selection
 * - selectNote(id): selects a note id
 * - filteredAndSorted(): returns notes filtered by search and sorted by updatedAt desc
 * 
 * Persistence:
 * - Loads from localStorage on mount
 * - Saves to localStorage whenever notes change (debounced via visible task tick)
 */
export const useNotes = () => {
  const store = useStore<NotesStore>({
    notes: [],
    selectedId: null,
    searchQuery: "",
    lastSavedAt: null,
  });

  // Load from localStorage on first visible run
  useVisibleTask$(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as NotesStore;
        // Only restore notes and selectedId; initialize other fields
        store.notes = Array.isArray(parsed.notes) ? parsed.notes : [];
        store.selectedId = parsed.selectedId ?? (store.notes[0]?.id ?? null);
      } else {
        // Seed with a welcome note for empty state
        const welcome: Note = {
          id: genId(),
          title: "Welcome to Notes",
          content:
            "Start typing your ideas here. Use the + New Note button to create more notes.",
          updatedAt: Date.now(),
        };
        store.notes = [welcome];
        store.selectedId = welcome.id;
      }
    } catch {
      // If parsing fails, start fresh
      store.notes = [];
      store.selectedId = null;
    }
  });

  // Persist to localStorage whenever notes change
  useVisibleTask$(({ track }) => {
    track(() => store.notes);
    const data: NotesStore = {
      notes: store.notes,
      selectedId: store.selectedId,
      searchQuery: "", // not persisted to avoid confusing UX
      lastSavedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    store.lastSavedAt = data.lastSavedAt;
  });

  // PUBLIC_INTERFACE
  const createNote = $(() => {
    const newNote: Note = {
      id: genId(),
      title: "Untitled Note",
      content: "",
      updatedAt: Date.now(),
    };
    store.notes = [newNote, ...store.notes];
    store.selectedId = newNote.id;
  });

  // PUBLIC_INTERFACE
  const updateNote = $((id: string, patch: Partial<Pick<Note, "title" | "content">>) => {
    const idx = store.notes.findIndex((n) => n.id === id);
    if (idx !== -1) {
      const existing = store.notes[idx];
      const updated: Note = {
        ...existing,
        ...patch,
        updatedAt: Date.now(),
      };
      // Replace and keep immutability to trigger tracking
      const updatedList = [...store.notes];
      updatedList[idx] = updated;
      store.notes = updatedList;
    }
  });

  // PUBLIC_INTERFACE
  const deleteNote = $((id: string) => {
    const newList = store.notes.filter((n) => n.id !== id);
    store.notes = newList;
    if (store.selectedId === id) {
      store.selectedId = newList[0]?.id ?? null;
    }
  });

  // PUBLIC_INTERFACE
  const selectNote = $((id: string) => {
    store.selectedId = id;
  });

  // PUBLIC_INTERFACE
  const filteredAndSorted = $(() => {
    const q = store.searchQuery.trim().toLowerCase();
    let list = store.notes;
    if (q) {
      list = list.filter((n) => n.title.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  });

  return {
    store,
    createNote,
    updateNote,
    deleteNote,
    selectNote,
    filteredAndSorted,
  };
};
