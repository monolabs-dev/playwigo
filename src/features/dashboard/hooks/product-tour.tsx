import { createContext, use, useCallback, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'

type ProductTourContextValue = {
  startTour: () => void
  registerStartTour: (startTour: () => void) => void
}

const ProductTourContext = createContext<ProductTourContextValue | null>(null)

export function ProductTourProvider({ children }: { children: ReactNode }) {
  const startTourRef = useRef<() => void>(() => {})

  const registerStartTour = useCallback((startTour: () => void) => {
    startTourRef.current = startTour
  }, [])

  const startTour = useCallback(() => {
    startTourRef.current()
  }, [])

  const value = useMemo(
    () => ({ startTour, registerStartTour }),
    [startTour, registerStartTour],
  )

  return <ProductTourContext value={value}>{children}</ProductTourContext>
}

export function useProductTour() {
  const context = use(ProductTourContext)

  if (!context) {
    throw new Error('useProductTour must be used within a ProductTourProvider')
  }

  return context
}
