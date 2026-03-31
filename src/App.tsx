import { useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import VinylalyisApp from '@/components/VinylVaultApp'
import SplashScreen from '@/components/SplashScreen'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <>
      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      ) : (
        <VinylalyisApp />
      )}
      <Analytics />
    </>
  )
}

export default App
