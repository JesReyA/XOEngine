import type { ReactNode } from 'react'
import type { CurrentView, Mode } from '../../types/api'
import {
  IconAcademy,
  IconBoard,
  IconRankings,
  IconScouting,
  IconStats,
  IconTeam,
  IconTrophy,
} from './icons'

export interface NavItem {
  view: CurrentView
  label: string
  icon: ReactNode
}

const COACH_ITEMS: NavItem[] = [
  { view: 'board', label: 'Sala Táctica', icon: <IconBoard /> },
  { view: 'scouting', label: 'Scouting', icon: <IconScouting /> },
]

const FAN_ITEMS: NavItem[] = [
  { view: 'stats', label: 'Estadísticas', icon: <IconStats /> },
  { view: 'team', label: 'Mi Equipo', icon: <IconTeam /> },
  { view: 'challenge', label: 'Juega a ser el Entrenador', icon: <IconTrophy /> },
  { view: 'rankings', label: 'Rankings', icon: <IconRankings /> },
  { view: 'academy', label: 'Academia NFL', icon: <IconAcademy /> },
]

export const navItemsFor = (mode: Mode): NavItem[] =>
  mode === 'coach' ? COACH_ITEMS : FAN_ITEMS
