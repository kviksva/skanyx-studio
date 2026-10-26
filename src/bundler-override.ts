/**
 * One bundler override shared by remotion.config.ts (Studio/CLI) and
 * scripts/render.ts (Node API): the `@/` -> `src/` alias that tsconfig and
 * vitest already know. Rspack does not read tsconfig paths. The config file
 * is evaluated as CommonJS by the CLI, so the caller passes the src path
 * instead of this module deriving it from import.meta.
 */
import type { BundlerConfiguration, BundlerOverrideFn } from "@remotion/bundler";

export const makeBundlerOverride =
  (srcDir: string): BundlerOverrideFn =>
  <C extends BundlerConfiguration>(config: C): C => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: { ...(config.resolve?.alias ?? {}), "@": srcDir },
    },
  });
