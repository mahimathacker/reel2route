import { useState } from 'react'
import type { TripPlanningResponse, TripPreferences } from '@reel2route/contracts'
import { OnboardingForm } from './components/OnboardingForm'
import { ProcessingState } from './components/ProcessingState'
import { TripResults } from './components/TripResults'
import { createTrip } from './lib/api'
import './App.css'

type View = 'create' | 'processing' | 'results'
type ContentLabel = 'video' | 'Reel'
const initialPreferences: TripPreferences = { origin: '', days: 4, budgetRange: 'moderate', groupType: 'couple', pace: 'balanced' }

function App() {
  const [view, setView] = useState<View>('create')
  const [trip, setTrip] = useState<TripPlanningResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [contentLabel, setContentLabel] = useState<ContentLabel>('video')

  const handleSubmit = async (url: string, preferences: TripPreferences) => {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    setContentLabel(hostname === 'instagram.com' ? 'Reel' : 'video')
    setError(null); setView('processing')
    try { setTrip(await createTrip(url, preferences)); setView('results') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'We could not build this trip. Please try again.'); setView('create') }
  }

  return <div className="app-shell">
    <header className="site-header"><button className="brand" type="button" onClick={() => setView('create')}><span className="brand-mark">R</span><span>Reel2Route</span></button><span className="header-note">Evidence-backed travel plans</span></header>
    <main>
      {view === 'create' && <OnboardingForm initialPreferences={initialPreferences} error={error} onSubmit={handleSubmit} />}
      {view === 'processing' && <ProcessingState contentLabel={contentLabel} />}
      {view === 'results' && trip !== null && <TripResults trip={trip} onStartOver={() => setView('create')} />}
    </main>
  </div>
}

export default App
