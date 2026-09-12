/** Canonical publication manifest for the SugarWork documentation website. */

/** Locale key used by the VitePress site. */
export type DocsLocale = 'root' | 'en'

/** Sidebar identifiers retained by the projection utilities and their fixtures. */
export type DocsSidebar =
  | 'zh-guide'
  | 'zh-develop'
  | 'zh-reference'
  | 'en-guide'
  | 'en-develop'
  | 'en-reference'

/** A page projected into the VitePress source tree. */
export interface DocsPage {
  /** VitePress locale whose route tree owns this projection. */
  locale: DocsLocale
  /** Language of the canonical source currently projected at this route. */
  contentLocale: 'zh-CN' | 'en-US'
  /** Repository-relative canonical Markdown source. */
  source: string
  /** VitePress route, including the `.md` suffix. */
  route: string
  /** Navigation label shown in the sidebar. */
  label: string
  /** Sidebar collection that owns the page, or null for a locale home page. */
  sidebar: DocsSidebar | null
  /** Section label within the sidebar. */
  section: string
  /** Stable order within the section. */
  order: number
  /** Heading levels included in this page's VitePress outline. */
  outline?: number | readonly [number, number] | 'deep' | false
  /** Additional repository paths that resolve to this page. */
  sourceAliases?: string[]
}

/** The product site currently publishes only its two localized home pages. */
export const docsPages: DocsPage[] = [
  {
    locale: 'root',
    contentLocale: 'zh-CN',
    source: 'docs/user/index.zh.md',
    sourceAliases: ['docs/user/index.md'],
    route: 'index.md',
    label: 'SugarWork',
    sidebar: null,
    section: '首页',
    order: 0,
  },
  {
    locale: 'en',
    contentLocale: 'en-US',
    source: 'docs/user/index.md',
    sourceAliases: ['docs/user/index.zh.md'],
    route: 'en/index.md',
    label: 'SugarWork',
    sidebar: null,
    section: 'Home',
    order: 0,
  },
]

/** No legacy documentation collections are published by the SugarWork site. */
export const localeCollections = {
  root: [],
  en: [],
} as const satisfies Record<DocsLocale, readonly DocsSidebar[]>

/** A sidebar group, matched to pages by `label`. */
export interface DocsSection {
  /** Group heading, equal to the `section` field of every page it holds. */
  label: string
  /** Render the group collapsed until it holds the page being read. */
  collapsed?: boolean
}

const sections: Record<DocsLocale, readonly DocsSection[]> = {
  root: [{ label: '首页' }],
  en: [{ label: 'Home' }],
}

/**
 * Resolve a declared sidebar section.
 * @param locale - route tree whose sidebar is being built.
 * @param label - section label carried by a page.
 * @returns the declared group and its zero-based position.
 */
export function sectionSpec(locale: DocsLocale, label: string): DocsSection & { index: number } {
  const declared = sections[locale]
  const section = declared.find(candidate => candidate.label === label)
  if (section === undefined) throw new Error(`Sidebar section "${label}" has no placement in the ${locale} locale.`)
  return { ...section, index: declared.indexOf(section) }
}

/**
 * Return pages in one sidebar collection.
 * @param locale - route tree whose pages are selected.
 * @param collection - sidebar collection to select.
 * @returns pages ordered by section and page position.
 */
export function orderedPages(locale: DocsLocale, collection: DocsSidebar): DocsPage[] {
  return docsPages
    .filter(page => page.locale === locale && page.sidebar === collection)
    .sort((left, right) => (
      sectionSpec(locale, left.section).index - sectionSpec(locale, right.section).index
      || left.order - right.order
    ))
}

/**
 * Convert a manifest route to the clean site link VitePress serves.
 * @param route - manifest route including its Markdown suffix.
 * @returns the clean site-relative link.
 */
export function routeLink(route: string): string {
  return `/${route.replace(/(?:index)?\.md$/, '')}`
}

/**
 * Return the first page link of a non-empty sidebar collection.
 * @param locale - route tree whose collection is selected.
 * @param collection - sidebar collection to select.
 * @returns the first page's clean site link.
 * @throws when the collection publishes no page.
 */
export function landingLink(locale: DocsLocale, collection: DocsSidebar): string {
  const first = orderedPages(locale, collection)[0]
  if (first === undefined) throw new Error(`Sidebar collection "${collection}" publishes no page.`)
  return routeLink(first.route)
}
