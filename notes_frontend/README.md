# Qwik Notes App ⚡️

A simple web-based notes app built with Qwik and Qwik City.

## Features
- Sidebar with search and note list
- Create new notes, edit title and content, delete with confirmation
- Auto-save to localStorage with last-saved indicator
- Notes sorted by last updated; search filters on titles
- Modern Ocean Professional theme (primary blue, amber accents, subtle gradients, rounded corners)

## Run locally
- Dev (SSR, port 3000):
  npm start

- Preview production build:
  npm run preview

Navigate to http://localhost:3000 (or the provided URL). Changes persist across refresh via localStorage.

## Project Structure
- src/hooks/useNotes.ts: Notes state and localStorage persistence
- src/components/NoteList.tsx: Sidebar list and search
- src/components/NoteEditor.tsx: Main editor/view
- src/routes/index.tsx: Layout composing sidebar + editor
- src/styles/theme.css and src/global.css: Theme and base styles
