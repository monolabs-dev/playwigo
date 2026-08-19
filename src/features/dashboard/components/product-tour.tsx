import { useEffect, useRef } from 'react'
import type { DriveStep, Driver } from 'driver.js'

import { useSidebar } from '#/components/ui/sidebar.tsx'
import { useProductTour } from '#/features/dashboard/hooks/product-tour.tsx'
import {
  isProductTourDone,
  markProductTourDone,
} from '#/features/dashboard/utils/product-tour.ts'

const TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: 'Welcome to Playwigo',
      description:
        "You created your first project. This is your workspace — let's take a quick look around.",
    },
  },
  {
    element: '[data-tour="project-switcher"]',
    popover: {
      title: 'Your projects',
      description:
        'Switch between sites or create another project. You can also press ⌘K anywhere.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-features"]',
    popover: {
      title: 'Features',
      description:
        'Group test cases by product area — auth, checkout, settings, and so on.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-authentication"]',
    popover: {
      title: 'Authentication',
      description:
        'Set up a login flow and test accounts so runs can sign in like a real user.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="nav-test-runs"]',
    popover: {
      title: 'Test runs',
      description: 'See the history and status of every execution for this project.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="run"]',
    popover: {
      title: 'Run a test',
      description:
        'Pick a test case and execute it in a cloud browser. Results show up under Test runs.',
      side: 'bottom',
      align: 'end',
    },
  },
]

export function ProductTour({ userId }: { userId: string }) {
  const { isMobile, setOpen, setOpenMobile } = useSidebar()
  const { registerStartTour } = useProductTour()
  const driverRef = useRef<Driver | null>(null)
  const startingRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    const destroyTour = () => {
      driverRef.current?.destroy()
      driverRef.current = null
      startingRef.current = false
    }

    const prepareSidebar = () => {
      setOpen(true)
      if (isMobile) {
        setOpenMobile(true)
      }
    }

    const startTour = async (force = false) => {
      if (startingRef.current || driverRef.current?.isActive()) {
        return
      }

      if (!force && isProductTourDone(userId)) {
        return
      }

      startingRef.current = true
      prepareSidebar()

      // Let the sidebar expand / mobile sheet open before measuring targets.
      await new Promise((resolve) => window.setTimeout(resolve, 150))

      if (cancelled) {
        startingRef.current = false
        return
      }

      const [{ driver }] = await Promise.all([
        import('driver.js'),
        import('driver.js/dist/driver.css'),
      ])

      if (cancelled) {
        startingRef.current = false
        return
      }

      destroyTour()
      startingRef.current = true

      const completeTour = () => {
        markProductTourDone(userId)
        if (isMobile) {
          setOpenMobile(false)
        }
      }

      const instance = driver({
        showProgress: true,
        allowClose: true,
        animate: true,
        overlayOpacity: 0.55,
        stagePadding: 8,
        stageRadius: 10,
        popoverClass: 'playwigo-driver-popover',
        nextBtnText: 'Next',
        prevBtnText: 'Previous',
        doneBtnText: 'Done',
        progressText: '{{current}} of {{total}}',
        steps: TOUR_STEPS,
        onDestroyStarted: () => {
          // Skip, Done, Escape, and overlay close all mark the tour complete.
          completeTour()
          instance.destroy()
        },
        onDestroyed: () => {
          driverRef.current = null
          startingRef.current = false
        },
      })

      driverRef.current = instance
      instance.drive()
      startingRef.current = false
    }

    registerStartTour(() => {
      void startTour(true)
    })

    if (!isProductTourDone(userId)) {
      void startTour(false)
    }

    return () => {
      cancelled = true
      destroyTour()
    }
  }, [
    userId,
    isMobile,
    setOpen,
    setOpenMobile,
    registerStartTour,
  ])

  return null
}
