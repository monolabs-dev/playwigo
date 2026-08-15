export type TestAccount = {
  id: string
  projectId: string
  name: string
  description: string | null
  email: string | null
  password: string | null
  url: string | null
  createdAt: Date
  updatedAt: Date
}

export type TestAccountSummary = Omit<TestAccount, 'password'>
