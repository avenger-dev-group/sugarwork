// Keyless assembled-browser coverage for the workspace welcome screen.
// The Host authentication cookie is established separately so this scenario
// exercises the client gate without weakening the real Web transport guard.
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import type { Browser, Page } from 'playwright'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it, onTestFailed } from 'vitest'
import {
  assertFixtureInventory, captureStableAria, compareOrRefreshGolden,
  launchWebScaffold, watchConsole, webSnapshotMode, type WebScaffold,
} from './scaffold.ts'
import { newEnglishPage, saveFailureShot } from './support.ts'

const SNAPSHOT_DIR = fileURLToPath(new URL('./expected/login-gate', import.meta.url))
const FORM_EXPECTED = join(SNAPSHOT_DIR, 'form.expected.md')
const MODE = webSnapshotMode()

describe('web e2e: workspace welcome screen', () => {
  let scaffold: WebScaffold
  let browser: Browser
  let page: Page
  let tripwire: ReturnType<typeof watchConsole>

  beforeAll(async () => {
    scaffold = await launchWebScaffold({})
    browser = await chromium.launch()
    page = await newEnglishPage(browser)
    tripwire = watchConsole(page)

    const login = await page.context().request.get(scaffold.authenticatedUrl, { maxRedirects: 0 })
    expect(login.status()).toBe(303)
    await page.goto(scaffold.baseUrl, { waitUntil: 'load' })
  }, 120_000)

  afterAll(async () => {
    await browser?.close()
    await scaffold?.close()
  })

  it('enters without credentials and retains entry after reload', async () => {
    onTestFailed(() => saveFailureShot(page, 'web-e2e-login-gate'))
    const form = page.getByRole('main')
    await page.getByRole('heading', { name: 'Make room for your next idea' }).waitFor({ timeout: 30_000 })
    expect(await page.locator('[class*="frame"]').count()).toBe(0)

    const snapshot = await captureStableAria(page, 'main', scaffold.workspaceCwd)
    await compareOrRefreshGolden(FORM_EXPECTED, snapshot, MODE)

    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
      await page.setViewportSize(viewport)
      const button = await page.getByRole('button', { name: 'Enter workspace' }).boundingBox()
      expect(button).not.toBeNull()
      expect(button!.x).toBeGreaterThanOrEqual(0)
      expect(button!.x + button!.width).toBeLessThanOrEqual(viewport.width)
      expect(button!.y + button!.height).toBeLessThanOrEqual(viewport.height)
    }

    expect(await form.locator('input').count()).toBe(2)
    await page.getByLabel('Account', { exact: true }).fill('any-account')
    await page.getByLabel('Password', { exact: true }).fill('demo-password')
    await page.keyboard.press('Enter')
    await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
    await page.reload()
    await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
    expect(await page.getByRole('button', { name: 'Enter workspace' }).count()).toBe(0)
    expect(tripwire.pageErrors).toEqual([])
    expect(tripwire.warnings).toEqual([])
  }, 60_000)

  it.skipIf(MODE === 'record')('keeps the fixture inventory closed', async () => {
    await assertFixtureInventory(SNAPSHOT_DIR, ['form.expected.md'])
  })
})
