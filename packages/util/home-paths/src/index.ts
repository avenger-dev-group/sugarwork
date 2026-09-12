/**
 * Shared filesystem path helpers for SugarWork user data.
 *
 * @module @deepseek-ai/dsh-home-paths
 */

import { opendir, realpath } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'

/** Directory name for the default SugarWork home under the OS home. */
export const SW_HOME_DIR_NAME = '.sw'

/** Compatibility export for callers that have not adopted the SugarWork name. */
export const DSH_HOME_DIR_NAME = SW_HOME_DIR_NAME

/** Stable user-facing display form for the default SugarWork home. */
export const DEFAULT_SW_HOME_DISPLAY = `~/${SW_HOME_DIR_NAME}`

/** Compatibility export for callers that have not adopted the SugarWork name. */
export const DEFAULT_DSH_HOME_DISPLAY = DEFAULT_SW_HOME_DISPLAY

/** Environment variable that overrides the default SugarWork home. */
export const SW_HOME_ENV = 'SW_HOME'

/** Legacy environment variable accepted as a fallback SugarWork-home override. */
export const DSH_HOME_ENV = 'DSH_HOME'

/**
 * Give a native filesystem watcher one canonical spelling of a path, even
 * when its final components do not exist yet. The deepest existing ancestor
 * is resolved through {@link realpath}; when a suffix is missing, that
 * ancestor is also proved to be an enumerable directory before the suffix is
 * restored. This prevents Windows from treating a regular-file ancestor as
 * ordinary absence, and prevents short-name aliases from being mixed with
 * long paths emitted by the native watcher backend.
 * @param path - Watch target or root, resolved against the current directory.
 * @returns the target with its existing ancestor canonicalized.
 * @throws when ancestor traversal encounters an error other than absence, or
 * the existing ancestor of a missing suffix is not an enumerable directory.
 */
export async function canonicalizeWatchPath(path: string): Promise<string> {
  let current = resolve(path)
  const missing: string[] = []
  while (true) {
    try {
      const canonical = await realpath(current)
      if (missing.length > 0) {
        // A Windows file-as-parent probe reports ENOENT. Opening the resolved
        // ancestor preserves the cross-platform directory requirement.
        const directory = await opendir(canonical)
        await directory.close()
      }
      return join(canonical, ...missing.reverse())
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      const parent = dirname(current)
      /* v8 ignore next -- a filesystem root exists, so traversal resolves before this guard */
      if (parent === current) throw error
      missing.push(basename(current))
      current = parent
    }
  }
}

/**
 * Resolve the default SugarWork home using Node's platform path rules.
 * @returns the absolute default harness home path.
 */
export function defaultDshHome(): string {
  return join(homedir(), SW_HOME_DIR_NAME)
}

/**
 * Expand supported tilde prefixes against the operating-system home.
 * @param path - configured path that may begin with `~`, `~/`, or `~\`.
 * @returns the expanded path, or the original value when no supported prefix is present.
 */
export function expandHomePath(path: string): string {
  if (path === '~') return homedir()
  if (path.startsWith('~/') || path.startsWith('~\\')) return join(homedir(), path.slice(2))
  return path
}

/**
 * Resolve the single-root SugarWork home.
 *
 * Precedence, highest first: an explicit configured path, `$SW_HOME`, the
 * compatibility `$DSH_HOME`, then `~/.sw`. Empty or whitespace-only overrides
 * are treated as unset, so a blank value never resolves the home to the current
 * working directory.
 * @param configured - explicit harness-home override, which has highest precedence.
 * @param env - environment mapping used to read `SW_HOME` and its compatibility alias.
 * @returns the normalized absolute harness home path.
 */
export function resolveDshHome(configured?: string, env: Record<string, string | undefined> = process.env): string {
  const swHome = env[SW_HOME_ENV]
  const legacyHome = env[DSH_HOME_ENV]
  const fromEnv = swHome !== undefined && swHome.trim().length > 0
    ? swHome
    : legacyHome !== undefined && legacyHome.trim().length > 0 ? legacyHome : undefined
  const selected = configured ?? fromEnv ?? defaultDshHome()
  return resolve(expandHomePath(selected))
}

/**
 * Join path segments onto the resolved SugarWork home.
 * @param segments - path segments appended to the Harness home; an empty list returns the home itself.
 * @returns the normalized absolute joined path.
 */
export function dshHomePath(...segments: string[]): string {
  return join(resolveDshHome(), ...segments)
}

/**
 * Join path segments onto the resolved Harness home's `cache` directory without creating it; no arguments returns the directory itself.
 * @param optionsOrSegment - explicit home override, or the first path segment; omission uses the default home resolution.
 * @param segments - additional path segments after the first child, if any.
 * @returns the normalized absolute cache path.
 */
export function dshCachePath(
  optionsOrSegment: { swHome?: string; dshHome?: string } | string = {},
  ...segments: string[]
): string {
  if (typeof optionsOrSegment === 'string') return dshHomePath('cache', optionsOrSegment, ...segments)
  return join(resolveDshHome(optionsOrSegment.swHome ?? optionsOrSegment.dshHome), 'cache', ...segments)
}

/**
 * Describe a resolved harness home symbolically for user-facing display.
 *
 * It never returns an absolute machine path: the default home is labelled
 * `~/.sw`, and any configured home is labelled `$SW_HOME`.
 * @param resolvedHome - the absolute path returned by {@link resolveDshHome}.
 * @returns `~/.sw` for the default home, otherwise `$SW_HOME`.
 */
export function dshHomeDisplay(resolvedHome: string): string {
  return resolvedHome === resolve(defaultDshHome()) ? DEFAULT_SW_HOME_DISPLAY : `$${SW_HOME_ENV}`
}
