import { useCallback, useEffect, useState } from 'react'
import { FolderKanban, Plus } from 'lucide-react'
import { useRouterState } from '@tanstack/react-router'
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
import { useActiveProject } from '#/features/dashboard/hooks/active-project.tsx'
import { DeleteFeatureDialog } from '#/features/features/components/delete-feature-dialog.tsx'
import { FeatureCard } from '#/features/features/components/feature-card.tsx'
import { FeatureDialog } from '#/features/features/components/feature-dialog.tsx'
import { listFeatures } from '#/features/features/server/features.ts'
import type { FeatureSummary } from '#/features/features/types/feature.ts'

export function FeaturesPage() {
  const { project } = useActiveProject()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const listFn = useServerFn(listFeatures)
  const [features, setFeatures] = useState<FeatureSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedFeature, setSelectedFeature] = useState<FeatureSummary | null>(
    null,
  )
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [featureToDelete, setFeatureToDelete] = useState<FeatureSummary | null>(
    null,
  )

  const loadFeatures = useCallback(async () => {
    setLoading(true)

    try {
      const next = await listFn({ data: { projectId: project.id } })
      setFeatures(next)
    } catch {
      toast.error('Unable to load features')
    } finally {
      setLoading(false)
    }
  }, [listFn, project.id])

  useEffect(() => {
    if (pathname === '/features' || pathname === '/features/') {
      void loadFeatures()
    }
  }, [loadFeatures, pathname])

  function openCreateDialog() {
    setDialogMode('create')
    setSelectedFeature(null)
    setDialogOpen(true)
  }

  function openEditDialog(feature: FeatureSummary) {
    setDialogMode('edit')
    setSelectedFeature(feature)
    setDialogOpen(true)
  }

  function openDeleteDialog(feature: FeatureSummary) {
    setFeatureToDelete(feature)
    setDeleteOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Features
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Group test cases by product area for{' '}
            <span className="text-foreground">{project.name}</span>.
          </p>
        </div>
        <Button
          className="self-start transition-transform duration-150 ease-out-strong active:scale-[0.97]"
          onClick={openCreateDialog}
        >
          <Plus />
          Add feature
        </Button>
      </section>

      {loading ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-xl" />
          ))}
        </section>
      ) : features.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted">
              <FolderKanban className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <CardTitle className="font-display text-xl">
                No features yet
              </CardTitle>
              <CardDescription className="mx-auto max-w-md">
                Create your first feature to organize test cases by checkout,
                onboarding, settings, or any part of the product.
              </CardDescription>
            </div>
            <Button
              className="transition-transform duration-150 ease-out-strong active:scale-[0.97]"
              onClick={openCreateDialog}
            >
              <Plus />
              Add your first feature
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              index={index}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
              onRunComplete={() => void loadFeatures()}
            />
          ))}
        </section>
      )}

      <FeatureDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        projectId={project.id}
        feature={selectedFeature ?? undefined}
        onSubmitted={(saved) => {
          setFeatures((current) => {
            const existing = current.find((item) => item.id === saved.id)
            if (existing) {
              return current.map((item) =>
                item.id === saved.id ? saved : item,
              )
            }
            return [saved, ...current]
          })
          toast.success(
            dialogMode === 'create' ? 'Feature added' : 'Feature updated',
            { description: saved.name },
          )
        }}
      />

      <DeleteFeatureDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        feature={featureToDelete}
        onDeleted={(deleted) => {
          setFeatures((current) =>
            current.filter((item) => item.id !== deleted.id),
          )
          toast.success('Feature deleted', {
            description: deleted.name,
          })
        }}
      />
    </div>
  )
}
