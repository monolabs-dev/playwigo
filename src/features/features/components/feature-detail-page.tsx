import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, CirclePlay, ListChecks, Plus } from 'lucide-react'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '#/components/ui/card.tsx'
import { Skeleton } from '#/components/ui/skeleton.tsx'
import { getFeature } from '#/features/features/server/features.ts'
import type { FeatureSummary } from '#/features/features/types/feature.ts'
import { TestCaseRow } from '#/features/test-cases/components/test-case-row.tsx'
import { listTestCases } from '#/features/test-cases/server/test-cases.ts'
import type { TestCaseSummary } from '#/features/test-cases/types/test-case.ts'
import { cn } from '#/lib/utils.ts'

function passPercent(feature: FeatureSummary) {
  if (feature.testCaseCount === 0) {
    return 0
  }

  return Math.round(
    (feature.passingTestCaseCount / feature.testCaseCount) * 100,
  )
}

export function FeatureDetailPage() {
  const { featureId } = useParams({ from: '/_app/_shell/features/$featureId' })
  const getFeatureFn = useServerFn(getFeature)
  const listFn = useServerFn(listTestCases)
  const [feature, setFeature] = useState<FeatureSummary | null>(null)
  const [testCases, setTestCases] = useState<TestCaseSummary[]>([])
  const [loading, setLoading] = useState(true)

  const loadPage = useCallback(async () => {
    setLoading(true)

    try {
      const [nextFeature, nextCases] = await Promise.all([
        getFeatureFn({ data: { featureId } }),
        listFn({ data: { featureId } }),
      ])
      setFeature(nextFeature)
      setTestCases(nextCases)
    } catch {
      toast.error('Unable to load feature')
    } finally {
      setLoading(false)
    }
  }, [featureId, getFeatureFn, listFn])

  useEffect(() => {
    void loadPage()
  }, [loadPage])

  function handleRunAll() {
    if (!feature) {
      return
    }

    toast.info('Run queued', {
      description: `All test cases in “${feature.name}” will run here soon.`,
    })
  }

  function handleAddTestCase() {
    toast.info('Coming soon', {
      description: 'Test case creation is on the way.',
    })
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!feature) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          asChild
        >
          <Link to="/features">
            <ArrowLeft />
            Back to features
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Feature not found.</p>
      </div>
    )
  }

  const percent = passPercent(feature)
  const hasCases = feature.testCaseCount > 0

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit transition-transform duration-150 ease-out-strong active:scale-[0.97]"
          asChild
        >
          <Link to="/features">
            <ArrowLeft />
            Features
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {feature.name}
            </h1>
            {feature.description ? (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {feature.description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            <Button
              variant="outline"
              className="transition-transform duration-150 ease-out-strong active:scale-[0.97]"
              disabled={!hasCases}
              onClick={handleRunAll}
            >
              <CirclePlay />
              Run all
            </Button>
            <Button
              className="transition-transform duration-150 ease-out-strong active:scale-[0.97]"
              onClick={handleAddTestCase}
            >
              <Plus />
              Add test case
            </Button>
          </div>
        </div>

        <Card size="sm">
          <CardContent className="space-y-2 pt-4">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Pass rate</span>
              <span className="font-medium tabular-nums">
                {hasCases ? `${percent}%` : '—'}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full origin-left rounded-full transition-transform duration-300 ease-out-strong motion-reduce:transition-none',
                  percent === 100
                    ? 'bg-emerald-500'
                    : percent > 0
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30',
                )}
                style={{
                  transform: `scaleX(${hasCases ? percent / 100 : 0})`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {hasCases
                ? `${feature.passingTestCaseCount} of ${feature.testCaseCount} test cases passing`
                : 'No test cases yet.'}
            </p>
          </CardContent>
        </Card>
      </section>

      {testCases.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted">
              <ListChecks className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <CardTitle className="font-display text-xl">
                No test cases yet
              </CardTitle>
              <CardDescription className="mx-auto max-w-md">
                Add the first test case for {feature.name}. Steps and runs will
                live here.
              </CardDescription>
            </div>
            <Button
              className="transition-transform duration-150 ease-out-strong active:scale-[0.97]"
              onClick={handleAddTestCase}
            >
              <Plus />
              Add your first test case
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-3">
          {testCases.map((testCase, index) => (
            <TestCaseRow key={testCase.id} testCase={testCase} index={index} />
          ))}
        </section>
      )}
    </div>
  )
}
