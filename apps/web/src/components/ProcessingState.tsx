import { useEffect, useState } from 'react'

type Props = { contentLabel: 'video' | 'Reel' }

export function ProcessingState({contentLabel}:Props) {
  const stages = [[`Reading the ${contentLabel}`,contentLabel==='Reel'?'Collecting caption, metadata, and available location tags':'Collecting title, description, transcript, and metadata'],['Finding the places','Separating real mentions from travel vibes'],['Validating every stop','Checking coordinates, categories, ratings, and price tier'],['Shaping your routes','Balancing pace, proximity, persona, and cost']] as const
  const [active,setActive] = useState(0)
  useEffect(() => { const id=window.setInterval(() => setActive((value)=>Math.min(value+1,3)),3500); return ()=>window.clearInterval(id) },[])
  return <section className="processing-view" aria-live="polite"><div className="processing-orbit"><span>R</span><i/><i/><i/></div><span className="eyebrow">Building your route</span><h1>{stages[active]?.[0]}</h1><p>{stages[active]?.[1]}</p><ol className="progress-list">{stages.map(([label],index)=><li className={index<active?'done':index===active?'active':''} key={label}><span>{index<active?'✓':index+1}</span>{label}</li>)}</ol></section>
}
