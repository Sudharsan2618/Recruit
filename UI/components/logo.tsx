import Image from "next/image"
import { cn } from "@/lib/utils"

const LOGO_SRC = "/logo-horizontal.png"
const LOGO_W = 1445
const LOGO_H = 358
const ASPECT = LOGO_W / LOGO_H

interface LogoFullProps {
  /** Rendered height in px; width scales to preserve the horizontal lockup. */
  height?: number
  className?: string
  priority?: boolean
}

/** Full horizontal CompanionLMS lockup (mascot + wordmark). */
export function LogoFull({ height = 32, className, priority }: LogoFullProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt="CompanionLMS"
      width={Math.round(ASPECT * height)}
      height={height}
      priority={priority}
      className={cn("object-contain", className)}
    />
  )
}

interface LogoProps {
  size?: number
  className?: string
}

/**
 * Icon-only mark — crops the mascot from the left of the horizontal lockup so
 * tight square spaces (e.g. the collapsed sidebar) get a recognizable brand
 * icon without a separate asset.
 */
export function Logo({ size = 32, className }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="CompanionLMS"
      className={cn("relative inline-block shrink-0 overflow-hidden", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={LOGO_SRC}
        alt="CompanionLMS"
        width={Math.round(ASPECT * size)}
        height={size}
        className="max-w-none object-cover object-left"
      />
    </span>
  )
}
