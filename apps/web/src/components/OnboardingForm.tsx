import { useState, type SubmitEvent } from 'react'
import type { TripPreferences } from '@reel2route/contracts'

type Props = { initialPreferences: TripPreferences; error: string | null; onSubmit: (url: string, preferences: TripPreferences) => Promise<void> }
const budgets = [['budget','Budget','Value-first stays and local finds'],['moderate','Comfort','A practical balance of ease and cost'],['premium','Premium','Privacy and standout experiences']] as const
const groups = [['solo','Solo'],['couple','Couple'],['friends','Friends'],['family','Family']] as const
const paces = [['relaxed','Relaxed'],['balanced','Balanced'],['packed','Packed']] as const

export function OnboardingForm({ initialPreferences, error, onSubmit }: Props) {
  const [url, setUrl] = useState('')
  const [preferences, setPreferences] = useState(initialPreferences)
  const submit = (event: SubmitEvent<HTMLFormElement>) => { event.preventDefault(); void onSubmit(url.trim(), preferences) }

  return <div className="create-view">
    <section className="hero-copy"><span className="eyebrow">Saved it. Loved it. Now go.</span><h1>Turn a travel reel into a trip you can actually take.</h1><p>Drop a YouTube video or public Instagram Reel. We trace every place to its source, validate it, then shape three plans around you.</p><div className="trust-row"><span>✓ Source evidence</span><span>✓ Real place validation</span><span>✓ Transparent costs</span></div></section>
    <form className="planner-card" onSubmit={submit}>
      <div className="form-heading"><span className="step-number">01</span><div><h2>Start with the inspiration</h2><p>Public links only. We never download the video.</p></div></div>
      <label className="field-label" htmlFor="content-url">YouTube or Instagram Reel URL</label><div className="url-field"><span>↗</span><input id="content-url" type="url" required placeholder="https://youtube.com/watch?v=..." value={url} onChange={(event) => setUrl(event.target.value)} /></div>
      <div className="form-divider" />
      <div className="form-heading"><span className="step-number">02</span><div><h2>Make it yours</h2><p>Five answers. Three genuinely different plans.</p></div></div>
      <div className="form-grid"><label className="input-group"><span>Travelling from</span><input required minLength={2} placeholder="Mumbai, India" value={preferences.origin} onChange={(event) => setPreferences({...preferences,origin:event.target.value})} /></label><label className="input-group"><span>Trip length</span><span className="number-input"><input type="number" min={1} max={14} value={preferences.days} onChange={(event) => setPreferences({...preferences,days:Number(event.target.value)})} /><small>days</small></span></label></div>
      <fieldset><legend>Budget style</legend><div className="choice-grid">{budgets.map(([value,label,note]) => <label className="choice-card" key={value}><input type="radio" name="budget" checked={preferences.budgetRange===value} onChange={() => setPreferences({...preferences,budgetRange:value})}/><strong>{label}</strong><small>{note}</small></label>)}</div></fieldset>
      <div className="form-grid"><fieldset><legend>Travelling with</legend><div className="segmented">{groups.map(([value,label]) => <label key={value}><input type="radio" name="group" checked={preferences.groupType===value} onChange={() => setPreferences({...preferences,groupType:value})}/><span>{label}</span></label>)}</div></fieldset><fieldset><legend>Preferred pace</legend><div className="segmented">{paces.map(([value,label]) => <label key={value}><input type="radio" name="pace" checked={preferences.pace===value} onChange={() => setPreferences({...preferences,pace:value})}/><span>{label}</span></label>)}</div></fieldset></div>
      {error !== null && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button" type="submit">Build my three trip plans <span>→</span></button><p className="submit-note">Usually takes under a minute · Costs are indicative</p>
    </form>
  </div>
}
