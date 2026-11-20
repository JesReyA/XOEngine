import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { title?: string }

// Todos los iconos: viewBox 24, trazo 1.5, currentColor. Decorativos salvo que lleven `title`.
function Icon({ title, children, ...rest }: IconProps & { children: ReactNode }) {
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true }
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...a11y}
      {...rest}
    >
      {children}
    </svg>
  )
}

export const IconBoard = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M12 5v14M3 12h18" /></Icon>
)
export const IconScouting = (p: IconProps) => (
  <Icon {...p}><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15l5.5 5.5" /><circle cx="10.5" cy="10.5" r="1.5" /></Icon>
)
export const IconStats = (p: IconProps) => (
  <Icon {...p}><path d="M4 20V13M10 20V8M16 20v-9M22 20H2" /></Icon>
)
export const IconCopilot = (p: IconProps) => (
  <Icon {...p}><path d="M4 5h16v11H9l-5 4V5z" /></Icon>
)
export const IconBell = (p: IconProps) => (
  <Icon {...p}><path d="M6 17V11a6 6 0 0112 0v6l1.5 2h-15L6 17zM10 21h4" /></Icon>
)
export const IconChevronDown = (p: IconProps) => (
  <Icon {...p}><path d="M6 9l6 6 6-6" /></Icon>
)
export const IconPlay = (p: IconProps) => (
  <Icon {...p} fill="currentColor"><path d="M7 4.5v15l12-7.5-12-7.5z" /></Icon>
)
export const IconPause = (p: IconProps) => (
  <Icon {...p} fill="currentColor"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></Icon>
)
export const IconReset = (p: IconProps) => (
  <Icon {...p}><path d="M4 12a8 8 0 108-8H7M7 1.5L4 4.5 7 7.5" /></Icon>
)
export const IconTrophy = (p: IconProps) => (
  <Icon {...p}><path d="M8 4h8v6a4 4 0 01-8 0V4zM8 6H4v1a4 4 0 004 4M16 6h4v1a4 4 0 01-4 4M12 14v4M8 20h8" /></Icon>
)
export const IconBriefcase = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M3 13h18" /></Icon>
)
export const IconAlert = (p: IconProps) => (
  <Icon {...p}><path d="M12 4l9 16H3L12 4zM12 10v4M12 17v.5" /></Icon>
)
export const IconTeam = (p: IconProps) => (
  <Icon {...p}><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.5a3 3 0 010 5.5M18 14.5c1.7.8 3 2.6 3 5.5" /></Icon>
)
export const IconRankings = (p: IconProps) => (
  <Icon {...p}><path d="M3 20v-6h5v6M8 20V8h8v12M16 20v-9h5v9M2 20h20" /></Icon>
)
export const IconAcademy = (p: IconProps) => (
  <Icon {...p}><path d="M2 9l10-5 10 5-10 5L2 9zM6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v6" /></Icon>
)
export const IconExpand = (p: IconProps) => (
  <Icon {...p}><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" /></Icon>
)
export const IconClose = (p: IconProps) => (
  <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>
)
export const IconCheck = (p: IconProps) => (
  <Icon {...p}><path d="M5 12.5l4.5 4.5L19 7" /></Icon>
)
export const IconX = (p: IconProps) => (
  <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>
)
export const IconSend = (p: IconProps) => (
  <Icon {...p}><path d="M4 12L20 4l-5 16-3.5-6.5L4 12zM11.5 13.5L20 4" /></Icon>
)
