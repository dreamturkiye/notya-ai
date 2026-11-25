'use client'
/** HASTA-PORTALI-GUNLUK — the demo home is Bugün, like the live portal (synthetic data). */
import { DemoSaglikEvi } from '../_components/saglikEvi/DemoSayfasi'
import { BugunSayfasi } from '../_components/saglikEvi/Sayfalar'

export default function DemoHomePage() {
  return <DemoSaglikEvi><BugunSayfasi /></DemoSaglikEvi>
}
