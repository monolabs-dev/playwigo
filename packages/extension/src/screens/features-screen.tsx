import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'

import { createClient, listFeatures } from '@/api/client'
import type { FeatureSummary } from '@/api/types'
import { AppHeader } from '@/components/app-header'
import { Badge } from '@/components/ui/badge'
import { getAuth } from '@/lib/storage'

type FeaturesScreenProps = {
  projectId: string
  projectName: string
  onBack: () => void
  onSelect: (feature: FeatureSummary) => void
}

export function FeaturesScreen({
  projectId,
  projectName,
  onBack,
  onSelect,
}: FeaturesScreenProps) {
  const query = useQuery({
    queryKey: ['features', projectId],
    queryFn: async () => {
      const auth = await getAuth()
      if (!auth) throw new Error('Not signed in')
      return listFeatures(createClient(auth.apiKey, auth.apiUrl), projectId)
    },
  })

  return (
    <div className="flex h-full flex-col">
      <AppHeader
        title="Features"
        subtitle={projectName}
        onBack={onBack}
      />
      <div className="flex-1 overflow-y-auto">
        {query.isLoading ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            Loading features…
          </p>
        ) : query.isError ? (
          <p className="px-3 py-6 text-center text-xs text-destructive">
            {(query.error as Error).message}
          </p>
        ) : query.data?.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            No features in this project. Create them in the web app.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {query.data?.map((feature) => (
              <li key={feature.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/60"
                  onClick={() => onSelect(feature)}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {feature.name}
                    </span>
                    {feature.description ? (
                      <span className="line-clamp-2 text-[11px] text-muted-foreground">
                        {feature.description}
                      </span>
                    ) : null}
                  </span>
                  <Badge>{feature.testCaseCount} cases</Badge>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
