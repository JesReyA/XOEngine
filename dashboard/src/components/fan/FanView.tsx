import type { CurrentView } from '../../types/api'
import ComingSoon from '../shared/ComingSoon'
import MainLayout from '../shared/MainLayout'
import MyTeam from './MyTeam'
import StatsExplorer from './StatsExplorer'

interface FanViewProps {
  currentView: CurrentView
  onNavigate: (view: CurrentView) => void
  onDictionaryTerm?: (term: string) => void
}

const PENDING: Partial<Record<CurrentView, { title: string; description: string }>> = {
  challenge: {
    title: 'Juega a ser el entrenador',
    description: 'El reto de 5 jugadas llega en el siguiente checkpoint.',
  },
  rankings: {
    title: 'Rankings',
    description: 'La tabla de líderes y la liga de aficiones llegan en el siguiente checkpoint.',
  },
  academy: {
    title: 'Academia NFL',
    description: 'La anatomía del juego, las jugadas animadas y el diccionario llegan en el siguiente checkpoint.',
  },
}

export default function FanView({ currentView, onNavigate }: FanViewProps) {
  const pending = PENDING[currentView]

  return (
    <MainLayout mode="fan" currentView={currentView} onNavigate={onNavigate}>
      {currentView === 'team' ? (
        <MyTeam />
      ) : pending ? (
        <ComingSoon {...pending} />
      ) : (
        <StatsExplorer />
      )}
    </MainLayout>
  )
}
