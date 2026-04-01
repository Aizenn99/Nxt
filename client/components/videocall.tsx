'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  StreamVideo, StreamCall, StreamVideoClient,
  CallControls, SpeakerLayout
} from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'
import { X } from 'lucide-react'

interface VideoCallProps {
  callId: string
  onClose?: () => void
}

export default function VideoCall({ callId, onClose }: VideoCallProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null)
  const [call, setCall] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const cleanup = useCallback(async () => {
    if (call) {
      try { await call.leave() } catch (e) { /* ignore */ }
    }
    if (client) {
      try { await client.disconnectUser() } catch (e) { /* ignore */ }
    }
  }, [call, client])

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const res = await fetch('/api/agent/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 'user-1' })
        })
        
        if (!res.ok) throw new Error('Failed to get token')
        const { token, apiKey } = await res.json()

        if (cancelled) return

        const c = new StreamVideoClient({ apiKey, user: { id: 'user-1' }, token })
        const activeCall = c.call('default', callId)
        await activeCall.join({ create: true })

        if (cancelled) {
          await activeCall.leave()
          await c.disconnectUser()
          return
        }

        // Start the AI agent
        await fetch('/api/agent/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callId })
        })

        if (cancelled) {
          await activeCall.leave()
          await c.disconnectUser()
          return
        }

        setClient(c)
        setCall(activeCall)
      } catch (err: any) {
        console.error('VideoCall init error:', err)
        if (!cancelled) setError(err.message || 'Connection failed')
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [callId])

  const handleClose = async () => {
    await cleanup()
    onClose?.()
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-red-400 text-lg font-medium">Connection Error</div>
        <p className="text-muted-foreground text-sm">{error}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm transition-colors"
          >
            Close
          </button>
        )}
      </div>
    )
  }

  if (!client || !call) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400 border-r-purple-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-orange-400 border-l-green-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <p className="text-muted-foreground text-sm animate-pulse">Connecting to NxtAi Agent...</p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm transition-colors mt-2"
          >
            Cancel
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {onClose && (
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/60 backdrop-blur-sm hover:bg-red-500/80 transition-all duration-200 group"
          title="End Call"
        >
          <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
        </button>
      )}
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <SpeakerLayout />
          <CallControls onLeave={handleClose} />
        </StreamCall>
      </StreamVideo>
    </div>
  )
}