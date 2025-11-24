import { component$, Slot, useStyles$ } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import styles from "./styles.css?inline";

export const onGet: RequestHandler = async ({ cacheControl }) => {
  cacheControl({
    staleWhileRevalidate: 60 * 60 * 24 * 7,
    maxAge: 5,
  });
};

// PUBLIC_INTERFACE
export default component$(() => {
  useStyles$(styles);
  return (
    <div class="app-root">
      <header class="app-header" role="banner" style="padding: .75rem 1rem;">
        <span style="font-weight:700;color:#0f172a">Personal Notes</span>
      </header>
      <main>
        <Slot />
      </main>
    </div>
  );
});
