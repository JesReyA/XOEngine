import type { CurrentView } from '../../types/api'
import MainLayout from '../shared/MainLayout'
import Challenge from './Challenge'
import MyTeam from './MyTeam'
import NflAcademy from './NflAcademy'
import Rankings from './Rankings'
import StatsExplorer from './StatsExplorer'

interface FanViewProps {
  currentView: CurrentView
  onNavigate: (view: CurrentView) => void
  onAsk: (text: string, autoSend?: boolean) => void
}

export default function FanView({ currentView, onNavigate, onAsk }: FanViewProps) {
  return (
    <MainLayout mode="fan" currentView={currentView} onNavigate={onNavigate}>
      {currentView === 'team' ? (
        <MyTeam />
      ) : currentView === 'challenge' ? (
        <Challenge onNavigate={onNavigate} />
      ) : currentView === 'rankings' ? (
        <Rankings />
      ) : currentView === 'academy' ? (
        <NflAcademy onAsk={onAsk} />
      ) : (
        <StatsExplorer onAsk={onAsk} />
      )}
    </MainLayout>
  )
}
