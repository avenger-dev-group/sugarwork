// Keyless assembled-browser coverage for the temporary application login.
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

describe('web e2e: mock login gate', () => {
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

  it('keeps the application unmounted until simon signs in', async () => {
    onTestFailed(() => saveFailureShot(page, 'web-e2e-login-gate'))
    const form = page.getByRole('main')
    await page.getByRole('heading', { name: 'Sign in to SugarWork' }).waitFor({ timeout: 30_000 })
    expect(await page.locator('[class*="frame"]').count()).toBe(0)

    const snapshot = await captureStableAria(page, 'main', scaffold.workspaceCwd)
    await compareOrRefreshGolden(FORM_EXPECTED, snapshot, MODE)

    await page.getByRole('textbox', { name: 'Username' }).fill('someone-else')
    await page.getByRole('button', { name: 'Enter workspace' }).click()
    await page.getByRole('alert').waitFor()
    expect(await form.getByText('That username is not recognized. Use simon.').count()).toBe(1)
    expect(await page.locator('[class*="frame"]').count()).toBe(0)

    await page.getByRole('textbox', { name: 'Username' }).fill('simon')
    await page.getByRole('button', { name: 'Enter workspace' }).click()
    await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
    expect(await page.getByRole('heading', { name: 'Sign in to SugarWork' }).count()).toBe(0)
    expect(tripwire.pageErrors).toEqual([])
    expect(tripwire.warnings).toEqual([])
  }, 60_000)

  it.skipIf(MODE === 'record')('keeps the fixture inventory closed', async () => {
    await assertFixtureInventory(SNAPSHOT_DIR, ['form.expected.md'])
  })
})
