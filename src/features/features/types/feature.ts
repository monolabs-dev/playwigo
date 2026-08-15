export type Feature = {
  id: string
  projectId: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export type FeatureSummary = Feature & {
  testCaseCount: number
  passingTestCaseCount: number
  runnableTestCaseCount: number
}
