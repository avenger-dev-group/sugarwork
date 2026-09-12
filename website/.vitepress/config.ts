/** VitePress configuration for the locally projected documentation site. */

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { DefaultTheme, PageData, SiteConfig } from 'vitepress'
import type { ViteDevServer } from 'vite'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { docsSourceFiles, emitRawMarkdownPages, llmsTxt, projectDocs, rawMarkdownRoute } from '../../scripts/project-doc-site.ts'

projectDocs()

function watchCanonicalDocs(server: ViteDevServer): void {
  const sources = docsSourceFiles()
  server.watcher.add(sources)
  server.watcher.on('change', (changed) => {
    if (!sources.includes(changed)) return
    projectDocs()
  })
}

/**
 * Serve the raw-Markdown twin of each route and llms.txt during development,
 * matching what `buildEnd` emits into the static build. Pages project from
 * their canonical sources per request, so an edit shows without a rebuild.
 */
function serveRawMarkdown(server: ViteDevServer): void {
  server.middlewares.use((req, res, next) => {
    if (req.url === undefined || (req.method !== 'GET' && req.method !== 'HEAD')) {
      next()
      return
    }
    // The dev client imports page modules at these same `.md` URLs, and a
    // module script must reach Vite's transform. Browsers declare the purpose:
    // `script` for module imports, `document` for address-bar navigation.
    // Header-less clients (curl, agents) read the raw twin. In-page fetch()
    // (`empty`) also passes to Vite — a deliberate dev-only divergence that
    // keeps Vite's own requests unbroken, while production static hosting
    // answers such a fetch with the raw file.
    const fetchDest = req.headers['sec-fetch-dest']
    if (fetchDest !== undefined && fetchDest !== 'document') {
      next()
      return
    }
    const pathname = req.url.split(/[?#]/, 1)[0] ?? ''
    const sitePath = pathname.startsWith(base) ? pathname.slice(base.length) : pathname.replace(/^\//, '')
    if (sitePath === 'llms.txt') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end(llmsTxt({ base, ...siteIdentity }))
      return
    }
    const content = sitePath.endsWith('.md') ? rawMarkdownRoute(sitePath) : undefined
    if (content === undefined) {
      next()
      return
    }
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
    res.end(content)
  })
}

function escapeVueInterpolation(html: string): string {
  return html.replaceAll('{{', '&#123;&#123;').replaceAll('}}', '&#125;&#125;')
}

const sharedTheme: Pick<DefaultTheme.Config, 'search' | 'socialLinks' | 'editLink'> = {
  search: {
    provider: 'local',
    options: {
      locales: {
        root: {
          translations: {
            button: {
              buttonText: '搜索文档',
              buttonAriaLabel: '搜索文档',
            },
            modal: {
              displayDetails: '显示详细列表',
              resetButtonTitle: '清除搜索',
              backButtonTitle: '关闭搜索',
              noResultsText: '未找到相关结果',
              footer: {
                selectText: '选择',
                selectKeyAriaLabel: '回车键',
                navigateText: '切换',
                navigateUpKeyAriaLabel: '上方向键',
                navigateDownKeyAriaLabel: '下方向键',
                closeText: '关闭',
                closeKeyAriaLabel: 'Esc 键',
              },
            },
          },
        },
      },
    },
  },
  socialLinks: [
    { icon: 'github', link: 'https://github.com/avenger-dev-group/sugarwork' },
  ],
  editLink: {
    pattern: ({ frontmatter }: PageData) => {
      const data: unknown = frontmatter
      const editSource: unknown = typeof data === 'object' && data !== null ? Reflect.get(data, 'editSource') : undefined
      if (typeof editSource !== 'string') throw new Error('Projected documentation page has no editSource frontmatter.')
      return `https://github.com/avenger-dev-group/sugarwork/edit/main/${editSource}`
    },
    text: '在 GitHub 上编辑此页',
  },
}

/** Site base path, carrying the leading and trailing slashes VitePress requires. */
const base = process.env.DOCS_BASE ?? '/'

/** Site identity shared by the VitePress configuration and the llms.txt index. */
const siteIdentity = {
  title: 'SugarWork',
  description: '用于构建 Agent Harness 的插件化 SDK',
}

/**
 * Styles the default theme does not provide, carried inline because the site
 * runs the stock theme with no theme directory of its own.
 *
 * The navigation-bar lockup pairs with `siteTitle`. The scrollbar rules replace
 * the sidebar's platform bar, which reserves 15px of a 265px column and draws a
 * track the rest of the navigation has no border for; `scrollbarScript` supplies
 * the marker that reveals the thumb. Chrome drops `::-webkit-scrollbar` once
 * `scrollbar-width` is set to anything but `auto`, so the standard properties
 * stay behind a query only Firefox answers.
 */
const siteStyle = `
:root {
  --vp-c-brand-1: #246bfe;
  --vp-c-brand-2: #315bff;
  --vp-c-brand-3: #174fd6;
  --vp-c-brand-soft: rgb(36 107 254 / 14%);
}
.sugarwork-lockup { display: inline-flex; align-items: center; gap: 8px; min-width: 0; }
.sugarwork-mark { display: block; width: 24px; height: 24px; object-fit: contain; }
.sugarwork-wordmark { color: var(--vp-c-brand-1); font-size: 17px; font-weight: 700; letter-spacing: -0.04em; }
.sugarwork-tag {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--vp-c-brand-soft);
  border-radius: 999px;
  padding: 1px 9px;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  white-space: nowrap;
  color: var(--vp-c-brand-1);
}

.VPSidebar::-webkit-scrollbar { width: 6px; }
.VPSidebar::-webkit-scrollbar-track { background: transparent; }
.VPSidebar::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 3px;
  transition: background-color 0.3s;
}
.VPSidebar[data-scrolling]::-webkit-scrollbar-thumb { background-color: var(--vp-c-text-3); }
@supports not selector(::-webkit-scrollbar) {
  .VPSidebar { scrollbar-width: thin; scrollbar-color: transparent transparent; }
  .VPSidebar[data-scrolling] { scrollbar-color: var(--vp-c-text-3) transparent; }
}
`

/**
 * Mark the sidebar while it scrolls, so its scrollbar rests invisible.
 *
 * A sized `::-webkit-scrollbar` opts the element out of the platform's
 * self-hiding overlay bar, leaving one painted at all times; nothing in CSS
 * reports that an element is scrolling. The listener captures instead of
 * bubbling because scroll events do not bubble, and marks a `data-` attribute
 * rather than a class because Vue rewrites `class` wholesale when it patches
 * the element.
 */
const scrollbarScript = `
(() => {
  let idle
  addEventListener('scroll', (event) => {
    const target = event.target
    if (!(target instanceof Element) || !target.classList.contains('VPSidebar')) return
    target.dataset.scrolling = ''
    clearTimeout(idle)
    idle = setTimeout(() => delete target.dataset.scrolling, 800)
  }, true)
})()
`

/**
 * Navigation-bar title: the SugarWork mark, name, and release-stage tag.
 * VitePress renders `siteTitle` as HTML.
 *
 * @param previewTag - Localized release-stage label.
 * @returns Markup placed beside the navigation-bar home link.
 */
function siteTitle(previewTag: string): string {
  return `<span class="sugarwork-lockup"><img class="sugarwork-mark" src="${base}favicon.png" alt=""><span class="sugarwork-wordmark">SugarWork</span><span class="sugarwork-tag">${previewTag}</span></span>`
}

export default withMermaid({
  title: siteIdentity.title,
  description: siteIdentity.description,
  base,
  /** Emit the raw-Markdown twin of every route plus llms.txt beside the rendered site. */
  buildEnd(siteConfig: SiteConfig) {
    emitRawMarkdownPages(siteConfig.outDir)
    writeFileSync(resolve(siteConfig.outDir, 'llms.txt'), llmsTxt({ base, ...siteIdentity }))
  },
  head: [
    // VitePress leaves head hrefs untouched, so the base belongs here explicitly.
    ['link', { rel: 'icon', type: 'image/png', href: `${base}favicon.png` }],
    ['style', {}, siteStyle],
    ['script', {}, scrollbarScript],
  ],
  cleanUrls: true,
  srcDir: '.generated',
  cacheDir: '.cache',
  outDir: '.dist',
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      themeConfig: {
        siteTitle: siteTitle('技术预览'),
        nav: [],
        outline: { label: '本页目录' },
        docFooter: { prev: '上一篇', next: '下一篇' },
        darkModeSwitchLabel: '外观',
        lightModeSwitchTitle: '切换到浅色主题',
        darkModeSwitchTitle: '切换到深色主题',
        sidebarMenuLabel: '菜单',
        returnToTopLabel: '返回顶部',
        langMenuLabel: '切换语言',
        skipToContentLabel: '跳至内容',
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      themeConfig: {
        siteTitle: siteTitle('Preview'),
        nav: [],
        editLink: {
          pattern: ({ frontmatter }: PageData) => {
            const data: unknown = frontmatter
            const editSource: unknown = typeof data === 'object' && data !== null ? Reflect.get(data, 'editSource') : undefined
            if (typeof editSource !== 'string') throw new Error('Projected documentation page has no editSource frontmatter.')
            return `https://github.com/avenger-dev-group/sugarwork/edit/main/${editSource}`
          },
          text: 'Edit this page on GitHub',
        },
        outline: { label: 'On this page' },
        docFooter: { prev: 'Previous', next: 'Next' },
      },
    },
  },
  vite: {
    // `srcDir` puts the Vite root inside the disposable generated tree, whose
    // own `public/` no tracked asset can live in.
    publicDir: resolve(import.meta.dirname, '../public'),
    plugins: [
      {
        name: 'sugarwork-doc-projector',
        configureServer(server) {
          watchCanonicalDocs(server)
          serveRawMarkdown(server)
        },
      },
    ],
  },
  markdown: {
    config(md) {
      const renderText = md.renderer.rules.text
      const renderCode = md.renderer.rules.code_inline
      const renderFence = md.renderer.rules.fence
      if (renderText === undefined) throw new Error('VitePress Markdown renderer is missing the text rendering rule.')
      if (renderCode === undefined) throw new Error('VitePress Markdown renderer is missing the inline-code rendering rule.')
      if (renderFence === undefined) throw new Error('VitePress Markdown renderer is missing the fence rendering rule.')
      md.renderer.rules.text = (...args) => escapeVueInterpolation(renderText(...args))
      md.renderer.rules.code_inline = (...args) => escapeVueInterpolation(renderCode(...args))
      const renderedFences = new Map<string, string>()
      md.renderer.rules.fence = (...args) => {
        const [tokens, index] = args
        const token = tokens[index]
        if (token === undefined) throw new Error('VitePress code-fence renderer received no token.')
        // Mermaid output embeds the token position, and VitePress snippets resolve source files during rendering.
        if (['mermaid', 'mmd'].includes(token.info.trim().split(/\s+/, 1)[0] ?? '')) return renderFence(...args)
        if (Reflect.get(token, 'src') !== undefined) return renderFence(...args)
        // Keep the cache build-local; a dev renderer can survive many HMR updates.
        if (process.env.NODE_ENV !== 'production') return renderFence(...args)
        const key = JSON.stringify([token.content, token.info, token.markup, token.attrs])
        const cached = renderedFences.get(key)
        if (cached !== undefined) return cached
        const html = renderFence(...args)
        renderedFences.set(key, html)
        return html
      }
    },
  },
  mermaid: {},
  themeConfig: sharedTheme,
})
