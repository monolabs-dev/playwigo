export type RunStatus = 'passed' | 'failed' | 'running' | 'queued'

export type ProjectHealth = 'passing' | 'failing' | 'running' | 'idle'

export type RecentRun = {
  id: string
  name: string
  feature: string
  status: RunStatus
  duration: string
  at: string
}

export type FeatureCoverage = {
  name: string
  cases: number
  passing: number
}

export type DashboardProject = {
  id: string
  name: string
  website: string
  health: ProjectHealth
  features: number
  testCases: number
  testAccounts: number
  passRate: number
  lastRunLabel: string
  recentRuns: RecentRun[]
  featureCoverage: FeatureCoverage[]
}
