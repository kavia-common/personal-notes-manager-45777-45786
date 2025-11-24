/**
 * This is the base config for vite.
 * When building, the adapter config is used which loads this file and extends it.
 */
import { defineConfig, type UserConfig } from "vite";
import { qwikVite } from "@builder.io/qwik/optimizer";
import { qwikCity } from "@builder.io/qwik-city/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import pkg from "./package.json";

type PkgDep = Record<string, string>;
const { dependencies = {}, devDependencies = {} } = pkg as any as {
  dependencies: PkgDep;
  devDependencies: PkgDep;
  [key: string]: unknown;
};
// Change strict error to warning for preview environments to avoid failing builds
warnOnDuplicatesPkgDeps(devDependencies, dependencies);

/**
 * Note that Vite normally starts from `index.html` but the qwikCity plugin makes start at `src/entry.ssr.tsx` instead.
 */
export default defineConfig(({ command, mode }): UserConfig => {
  return {
    plugins: [qwikCity(), qwikVite(), tsconfigPaths()],
    // This tells Vite which dependencies to pre-build in dev mode.
    optimizeDeps: {
      // Put problematic deps that break bundling here, mostly those with binaries.
      // For example ['better-sqlite3'] if you use that in server functions.
      exclude: [],
    },

    /**
     * This is an advanced setting. It improves the bundling of your server code. To use it, make sure you understand when your consumed packages are dependencies or dev dependencies. (otherwise things will break in production)
     */
    // Keep default SSR bundling behavior; adapters add their specifics.

    server: {
      headers: {
        // Don't cache the server response in dev mode
        "Cache-Control": "public, max-age=0",
      },
      port: 3000,
      host: "0.0.0.0",
    },
    preview: {
      headers: {
        // Do cache the server response in preview (non-adapter production build)
        "Cache-Control": "public, max-age=600",
      },
      host: "0.0.0.0",
      port: 3000,
    },
  };
});

// *** utils ***

/**
 * Function to identify duplicate dependencies and warn instead of throwing
 * @param {Object} devDependencies - List of development dependencies
 * @param {Object} dependencies - List of production dependencies
 */
function warnOnDuplicatesPkgDeps(
  devDependencies: PkgDep,
  dependencies: PkgDep,
) {
  // Warn about qwik packages in dependencies; in this template they belong in devDependencies
  const qwikPkg = Object.keys(dependencies).filter((value) =>
    /@builder\.io\/qwik|@builder\.io\/qwik-city|qwik/i.test(value),
  );
  if (qwikPkg.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `Advisory: Move qwik packages to devDependencies: ${qwikPkg.join(", ")}`,
    );
  }

  const duplicateDeps = Object.keys(devDependencies).filter(
    (dep) => dependencies[dep],
  );
  if (duplicateDeps.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `Advisory: "${duplicateDeps.join(
        ", ",
      )}" exists in both devDependencies and dependencies. Prefer devDependencies only.`,
    );
  }
}
