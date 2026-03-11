import { useState, useEffect } from 'react'

export interface WalletConnection {
  publicKey: string
  walletType: 'phantom' | 'solflare' | 'backpack' | 'unknown'
  connected: boolean
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletConnection | null>(null)

  useEffect(() => {
    const savedConnection = localStorage.getItem('vinylvault_wallet')
    if (savedConnection) {
      try {
        const parsed = JSON.parse(savedConnection) as WalletConnection
        setWallet(parsed)
      } catch (error) {
        console.error('Failed to restore wallet:', error)
        localStorage.removeItem('vinylvault_wallet')
      }
    }
  }, [])

  const connect = (connection: WalletConnection) => {
    setWallet(connection)
    localStorage.setItem('vinylvault_wallet', JSON.stringify(connection))
  }

  const disconnect = () => {
    setWallet(null)
    localStorage.removeItem('vinylvault_wallet')
  }

  return {
    wallet,
    isConnected: !!wallet?.connected,
    connect,
    disconnect,
  }
}
