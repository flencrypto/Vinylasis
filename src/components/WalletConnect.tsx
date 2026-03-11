import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Wallet, CheckCircle, Warning, Copy, ArrowSquareOut, SignOut } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface WalletConnection {
  publicKey: string
  walletType: 'phantom' | 'solflare' | 'backpack' | 'unknown'
  connected: boolean
}

interface WalletConnectProps {
  onConnect?: (connection: WalletConnection) => void
  onDisconnect?: () => void
  className?: string
}

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean
      connect: () => Promise<{ publicKey: { toString: () => string } }>
      disconnect: () => Promise<void>
      on: (event: string, callback: () => void) => void
      off: (event: string, callback: () => void) => void
      publicKey?: { toString: () => string }
    }
    solflare?: {
      isSolflare?: boolean
      connect: () => Promise<{ publicKey: { toString: () => string } }>
      disconnect: () => Promise<void>
      on: (event: string, callback: () => void) => void
      off: (event: string, callback: () => void) => void
      publicKey?: { toString: () => string }
    }
    backpack?: {
      isBackpack?: boolean
      connect: () => Promise<{ publicKey: { toString: () => string } }>
      disconnect: () => Promise<void>
      on: (event: string, callback: () => void) => void
      off: (event: string, callback: () => void) => void
      publicKey?: { toString: () => string }
    }
  }
}

export function WalletConnect({ onConnect, onDisconnect, className }: WalletConnectProps) {
  const [connection, setConnection] = useState<WalletConnection | null>(null)
  const [showWalletDialog, setShowWalletDialog] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const detectWallets = () => {
    const wallets: Array<{ type: WalletConnection['walletType']; name: string; available: boolean }> = []

    if (window.solana?.isPhantom) {
      wallets.push({ type: 'phantom', name: 'Phantom', available: true })
    }
    if (window.solflare?.isSolflare) {
      wallets.push({ type: 'solflare', name: 'Solflare', available: true })
    }
    if (window.backpack?.isBackpack) {
      wallets.push({ type: 'backpack', name: 'Backpack', available: true })
    }

    return wallets
  }

  const connectWallet = async (walletType: WalletConnection['walletType']) => {
    setIsConnecting(true)
    
    try {
      let wallet: any
      let walletName = 'Wallet'

      switch (walletType) {
        case 'phantom':
          if (!window.solana) {
            toast.error('Phantom wallet not detected', {
              description: 'Please install Phantom from phantom.app',
            })
            setIsConnecting(false)
            return
          }
          wallet = window.solana
          walletName = 'Phantom'
          break

        case 'solflare':
          if (!window.solflare) {
            toast.error('Solflare wallet not detected', {
              description: 'Please install Solflare from solflare.com',
            })
            setIsConnecting(false)
            return
          }
          wallet = window.solflare
          walletName = 'Solflare'
          break

        case 'backpack':
          if (!window.backpack) {
            toast.error('Backpack wallet not detected', {
              description: 'Please install Backpack from backpack.app',
            })
            setIsConnecting(false)
            return
          }
          wallet = window.backpack
          walletName = 'Backpack'
          break

        default:
          toast.error('Unsupported wallet type')
          setIsConnecting(false)
          return
      }

      const response = await wallet.connect()
      const publicKey = response.publicKey.toString()

      const newConnection: WalletConnection = {
        publicKey,
        walletType,
        connected: true,
      }

      setConnection(newConnection)
      setShowWalletDialog(false)
      
      localStorage.setItem('vinylvault_wallet', JSON.stringify(newConnection))
      
      toast.success(`${walletName} connected`, {
        description: `Address: ${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`,
      })

      if (onConnect) {
        onConnect(newConnection)
      }
    } catch (error) {
      console.error('Wallet connection error:', error)
      toast.error('Failed to connect wallet', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = async () => {
    if (!connection) return

    try {
      let wallet: any

      switch (connection.walletType) {
        case 'phantom':
          wallet = window.solana
          break
        case 'solflare':
          wallet = window.solflare
          break
        case 'backpack':
          wallet = window.backpack
          break
      }

      if (wallet?.disconnect) {
        await wallet.disconnect()
      }

      setConnection(null)
      localStorage.removeItem('vinylvault_wallet')
      
      toast.success('Wallet disconnected')

      if (onDisconnect) {
        onDisconnect()
      }
    } catch (error) {
      console.error('Disconnect error:', error)
      toast.error('Failed to disconnect wallet')
    }
  }

  const copyAddress = () => {
    if (connection?.publicKey) {
      navigator.clipboard.writeText(connection.publicKey)
      toast.success('Address copied to clipboard')
    }
  }

  const viewOnExplorer = () => {
    if (connection?.publicKey) {
      window.open(`https://explorer.solana.com/address/${connection.publicKey}?cluster=devnet`, '_blank')
    }
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  useEffect(() => {
    const savedConnection = localStorage.getItem('vinylvault_wallet')
    if (savedConnection) {
      try {
        const parsed = JSON.parse(savedConnection) as WalletConnection
        
        let wallet: any
        switch (parsed.walletType) {
          case 'phantom':
            wallet = window.solana
            break
          case 'solflare':
            wallet = window.solflare
            break
          case 'backpack':
            wallet = window.backpack
            break
        }

        if (wallet?.publicKey) {
          setConnection({
            ...parsed,
            publicKey: wallet.publicKey.toString(),
          })
          
          if (onConnect) {
            onConnect({
              ...parsed,
              publicKey: wallet.publicKey.toString(),
            })
          }
        } else {
          localStorage.removeItem('vinylvault_wallet')
        }
      } catch (error) {
        console.error('Failed to restore wallet connection:', error)
        localStorage.removeItem('vinylvault_wallet')
      }
    }
  }, [])

  if (connection?.connected) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-2 px-3 py-1.5 bg-accent/10 border-accent/30">
            <CheckCircle size={16} weight="fill" className="text-accent" />
            <span className="font-mono text-sm">{shortenAddress(connection.publicKey)}</span>
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyAddress}
            title="Copy address"
            className="h-8 w-8"
          >
            <Copy size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={viewOnExplorer}
            title="View on explorer"
            className="h-8 w-8"
          >
            <ArrowSquareOut size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={disconnectWallet}
            title="Disconnect wallet"
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <SignOut size={16} />
          </Button>
        </div>
      </div>
    )
  }

  const availableWallets = detectWallets()

  return (
    <>
      <Button onClick={() => setShowWalletDialog(true)} className={`gap-2 ${className}`}>
        <Wallet size={20} />
        Connect Wallet
      </Button>

      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet size={24} />
              Connect Solana Wallet
            </DialogTitle>
            <DialogDescription>
              Choose a wallet to connect to VinylVault for NFT minting
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {availableWallets.length > 0 ? (
              <div className="space-y-2">
                {availableWallets.map((wallet) => (
                  <Button
                    key={wallet.type}
                    onClick={() => connectWallet(wallet.type)}
                    disabled={isConnecting}
                    className="w-full justify-start gap-3 h-auto py-4"
                    variant="outline"
                  >
                    <Wallet size={24} weight="fill" />
                    <div className="text-left">
                      <div className="font-semibold">{wallet.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {isConnecting ? 'Connecting...' : 'Click to connect'}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <Alert>
                <Warning size={20} />
                <AlertDescription className="ml-2">
                  No Solana wallet detected. Please install one of the following:
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>
                      <a
                        href="https://phantom.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Phantom Wallet
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://solflare.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Solflare Wallet
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://backpack.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Backpack Wallet
                      </a>
                    </li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
