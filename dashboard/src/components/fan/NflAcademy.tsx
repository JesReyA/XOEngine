import { useState } from 'react'
import Tabs from '../shared/Tabs'
import AcademyAnatomy from './AcademyAnatomy'
import AcademyDictionary from './AcademyDictionary'
import AcademyPlays from './AcademyPlays'

type AcademyTab = 'anatomy' | 'plays' | 'dictionary'

const TABS: Array<{ id: AcademyTab; label: string }> = [
  { id: 'anatomy', label: 'Anatomía del juego' },
  { id: 'plays', label: 'Jugadas básicas' },
  { id: 'dictionary', label: 'Diccionario' },
]

interface NflAcademyProps {
  onAsk: (text: string, autoSend?: boolean) => void
}

export default function NflAcademy({ onAsk }: NflAcademyProps) {
  const [tab, setTab] = useState<AcademyTab>('anatomy')

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="text-3xl font-bold">Academia NFL</h1>
        <p className="mt-1 text-sm text-xo-text-secondary">Lo esencial para disfrutar tu primer partido.</p>
      </header>
      <Tabs tabs={TABS} active={tab} onChange={setTab} label="Secciones de la academia" />
      <div key={tab} className="animate-panel-enter">
        {tab === 'anatomy' && <AcademyAnatomy />}
        {tab === 'plays' && <AcademyPlays />}
        {tab === 'dictionary' && <AcademyDictionary onAsk={onAsk} />}
      </div>
    </div>
  )
}
