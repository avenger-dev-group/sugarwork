const BRAND_ICON_URL = './favicon.png'

interface BrandMarkProps {
  readonly size: number
  readonly className?: string | undefined
}

/**
 * Render the SugarWork mark with the presentation requested by its host surface.
 * @param props - Host-supplied mark presentation.
 * @returns the SugarWork mark.
 */
export function SugarWorkBrandMark({ size, className }: BrandMarkProps) {
  return <img src={BRAND_ICON_URL} width={size} height={size} className={className} alt="" aria-hidden="true" />
}

/**
 * Render the SugarWork name without its independently slotted mark.
 * @param props - Localized product-name presentation.
 * @returns the SugarWork wordmark text.
 */
export function SugarWorkBrandName({ name }: { readonly name: string }) {
  return <span style={{ color: 'var(--dsw-alias-state-business-primary, #246bfe)' }} aria-hidden="true">{name}</span>
}
