import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_SW_HOME_DISPLAY,
  SW_HOME_DIR_NAME,
  canonicalizeWatchPath,
  defaultDshHome,
  dshCachePath,
  dshHomeDisplay,
  dshHomePath,
  expandHomePath,
  resolveDshHome,
} from '@deepseek-ai/dsh-home-paths'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('SugarWork path helpers', () => {
  it('owns the shared default SugarWork home directory name', () => {
    expect(SW_HOME_DIR_NAME).toBe('.sw')
    expect(DEFAULT_SW_HOME_DISPLAY).toBe('~/.sw')
    expect(defaultDshHome()).toBe(join(homedir(), '.sw'))
  })

  it('expands tilde paths without changing non-tilde paths', () => {
    expect(expandHomePath('~')).toBe(homedir())
    expect(expandHomePath('~/.sw')).toBe(join(homedir(), '.sw'))
    expect(expandHomePath('~\\.sw')).toBe(join(homedir(), '.sw'))
    expect(expandHomePath('/tmp/.sw')).toBe('/tmp/.sw')
    expect(expandHomePath('~other/.sw')).toBe('~other/.sw')
  })

  it('resolves explicit path before SW_HOME, its compatibility alias, and the default', () => {
    const envHome = join(homedir(), 'env-sw')

    expect(resolveDshHome('/tmp/explicit-sw', { SW_HOME: '~/env-sw' })).toBe(resolve('/tmp/explicit-sw'))
    expect(resolveDshHome(undefined, { SW_HOME: '~/env-sw', DSH_HOME: '~/legacy' })).toBe(envHome)
    expect(resolveDshHome(undefined, { DSH_HOME: '~/legacy' })).toBe(join(homedir(), 'legacy'))
    expect(resolveDshHome(undefined, {})).toBe(defaultDshHome())
  })

  it('treats an empty or whitespace-only SW_HOME as unset', () => {
    expect(resolveDshHome(undefined, { SW_HOME: '' })).toBe(defaultDshHome())
    expect(resolveDshHome(undefined, { SW_HOME: '   ' })).toBe(defaultDshHome())
  })

  it('joins child segments onto the resolved SW_HOME', () => {
    vi.stubEnv('SW_HOME', '~/env-sw')
    expect(dshHomePath()).toBe(join(homedir(), 'env-sw'))
    expect(dshHomePath('storages', 'cache')).toBe(join(homedir(), 'env-sw', 'storages', 'cache'))
  })

  it('labels a resolved home by whether it is the default root', () => {
    expect(dshHomeDisplay(resolve(defaultDshHome()))).toBe('~/.sw')
    expect(dshHomeDisplay('/some/other/root')).toBe('$SW_HOME')
  })

  it.each([
    [undefined, join(homedir(), '.sw')],
    ['', join(homedir(), '.sw')],
    ['   ', join(homedir(), '.sw')],
    ['~/env-sw', join(homedir(), 'env-sw')],
    ['./relative-sw', resolve('./relative-sw')],
  ] as const)('resolves cache paths with SW_HOME=%j', (home, expectedHome) => {
    vi.stubEnv('SW_HOME', home)
    try {
      expect(dshCachePath()).toBe(join(expectedHome, 'cache'))
      expect(dshCachePath('models', 'index.json')).toBe(join(expectedHome, 'cache', 'models', 'index.json'))
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('resolves configured cache homes before the environment', () => {
    vi.stubEnv('SW_HOME', '~/env-sw')
    try {
      expect(dshCachePath({ dshHome: '~/explicit-sw' })).toBe(join(homedir(), 'explicit-sw', 'cache'))
      expect(dshCachePath({ dshHome: './explicit-sw' }, 'attachments', 'request-images'))
        .toBe(resolve('./explicit-sw/cache/attachments/request-images'))
      expect(dshCachePath({}, 'attachments')).toBe(join(homedir(), 'env-sw', 'cache', 'attachments'))
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('canonicalizes a watcher ancestor while preserving a missing suffix', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-watch-path-'))
    const target = join(root, 'target')
    const alias = join(root, 'alias')
    try {
      await mkdir(target)
      await symlink(target, alias, process.platform === 'win32' ? 'junction' : 'dir')
      await expect(canonicalizeWatchPath(alias)).resolves.toBe(await realpath(target))
      await expect(canonicalizeWatchPath(join(alias, 'later', 'config.yml'))).resolves.toBe(
        join(await realpath(target), 'later', 'config.yml'),
      )
      const file = join(root, 'file')
      await writeFile(file, 'not a directory')
      await expect(canonicalizeWatchPath(join(file, 'child'))).rejects.toMatchObject({ code: 'ENOTDIR' })
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
