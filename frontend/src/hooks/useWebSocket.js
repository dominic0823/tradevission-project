import { useEffect, useRef } from 'react'
import { usePriceStore } from '../store'

export function useWebSocket() {
  const ws = useRef(null)
  const updatePrices = usePriceStore((s) => s.updatePrices)

  useEffect(() => {
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
    ws.current = new WebSocket(`${WS_URL}/ws/prices`)
    const connect = () => {
      try {
        ws.current = new WebSocket(`${WS_URL}/ws/prices`)
        ws.current.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data)
            updatePrices(data.prices ?? data)
          } catch {}
        }
        ws.current.onclose = () => setTimeout(connect, 3000)
        ws.current.onerror = () => setTimeout(connect, 3000)
      } catch {
        setTimeout(connect, 3000)
      }
    }
    connect()
    return () => ws.current?.close()
  }, [updatePrices])
}
