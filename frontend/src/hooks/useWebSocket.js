import { useEffect, useRef } from 'react'
import { usePriceStore } from '../store'

export function useWebSocket() {
  const ws = useRef(null)
  const updatePrices = usePriceStore((s) => s.updatePrices)

  useEffect(() => {
    const connect = () => {
      try {
        ws.current = new WebSocket('ws://localhost:8000/ws/prices')
        ws.current.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data)
            if (data.prices) {
              updatePrices(data.prices)
            } else {
              updatePrices(data)
            }
          } catch { }
        }
        ws.current.onclose = () => setTimeout(connect, 3000)
        ws.current.onerror = () => setTimeout(connect, 3000)
      } catch {
        setTimeout(connect, 3000)
      }
    }
    connect()
    return () => {
      if (ws.current) ws.current.close()
    }
  }, [updatePrices])
}