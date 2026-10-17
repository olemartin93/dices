import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps & { children: ReactNode }): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const SoundOnIcon = (p: IconProps): ReactNode => (
  <Icon {...p}>
    <path d="M11 5 6 9H2v6h4l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
  </Icon>
)

export const SoundOffIcon = (p: IconProps): ReactNode => (
  <Icon {...p}>
    <path d="M11 5 6 9H2v6h4l5 4V5z" />
    <path d="m22 9-6 6M16 9l6 6" />
  </Icon>
)

export const ShakeIcon = (p: IconProps): ReactNode => (
  <Icon {...p}>
    <rect x="7" y="3" width="10" height="18" rx="2" />
    <path d="M3 8v8M21 8v8" />
  </Icon>
)

export const HistoryIcon = (p: IconProps): ReactNode => (
  <Icon {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5M12 7v5l3 2" />
  </Icon>
)

export const InstallIcon = (p: IconProps): ReactNode => (
  <Icon {...p}>
    <path d="M12 3v12M7 10l5 5 5-5" />
    <path d="M5 21h14" />
  </Icon>
)

export const CloseIcon = (p: IconProps): ReactNode => (
  <Icon {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
)

export const MinusIcon = (p: IconProps): ReactNode => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
)

export const PlusIcon = (p: IconProps): ReactNode => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)
