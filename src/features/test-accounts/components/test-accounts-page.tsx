import { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { LogIn, Plus, Users } from 'lucide-react'
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
import { DeleteTestAccountDialog } from '#/features/test-accounts/components/delete-test-account-dialog.tsx'
import { TestAccountCard } from '#/features/test-accounts/components/test-account-card.tsx'
import { TestAccountDialog } from '#/features/test-accounts/components/test-account-dialog.tsx'
import { listTestAccounts } from '#/features/test-accounts/server/test-accounts.ts'
import type { TestAccountSummary } from '#/features/test-accounts/types/test-account.ts'

export function TestAccountsPage() {
  const { project } = useActiveProject()
  const listFn = useServerFn(listTestAccounts)
  const [accounts, setAccounts] = useState<TestAccountSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedAccount, setSelectedAccount] =
    useState<TestAccountSummary | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] =
    useState<TestAccountSummary | null>(null)

  const loadAccounts = useCallback(async () => {
    setLoading(true)

    try {
      const next = await listFn({ data: { projectId: project.id } })
      setAccounts(next)
    } catch {
      toast.error('Unable to load test accounts')
    } finally {
      setLoading(false)
    }
  }, [listFn, project.id])

  useEffect(() => {
    void loadAccounts()
  }, [loadAccounts])

  function openCreateDialog() {
    setDialogMode('create')
    setSelectedAccount(null)
    setDialogOpen(true)
  }

  function openEditDialog(account: TestAccountSummary) {
    setDialogMode('edit')
    setSelectedAccount(account)
    setDialogOpen(true)
  }

  function openDeleteDialog(account: TestAccountSummary) {
    setAccountToDelete(account)
    setDeleteOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex justify-start">
        <Button
          className="transition-transform duration-150 ease-out-strong active:scale-[0.97]"
          onClick={openCreateDialog}
        >
          <Plus />
          Add account
        </Button>
      </div>

      {loading ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-xl" />
          ))}
        </section>
      ) : accounts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted">
              <Users className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <CardTitle className="font-display text-xl">
                No test accounts yet
              </CardTitle>
              <CardDescription className="mx-auto max-w-md">
                Add the credentials Playwright should use for sign-in. Pair them
                with your{' '}
                <Link
                  to="/authentication/login-flow"
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  login flow
                </Link>{' '}
                so test cases can sign in automatically before runs.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button variant="outline" asChild>
                <Link to="/authentication/login-flow">
                  <LogIn />
                  Set up login flow
                </Link>
              </Button>
              <Button
                className="transition-transform duration-150 ease-out-strong active:scale-[0.97]"
                onClick={openCreateDialog}
              >
                <Plus />
                Add your first account
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account, index) => (
            <TestAccountCard
              key={account.id}
              account={account}
              index={index}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
            />
          ))}
        </section>
      )}

      <TestAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        projectId={project.id}
        projectWebsite={project.website}
        account={selectedAccount ?? undefined}
        onSubmitted={(saved) => {
          setAccounts((current) => {
            const existing = current.find((item) => item.id === saved.id)
            if (existing) {
              return current.map((item) =>
                item.id === saved.id ? saved : item,
              )
            }
            return [saved, ...current]
          })
          toast.success(
            dialogMode === 'create' ? 'Test account added' : 'Test account updated',
            { description: saved.name },
          )
        }}
      />

      <DeleteTestAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        account={accountToDelete}
        onDeleted={(deleted) => {
          setAccounts((current) =>
            current.filter((item) => item.id !== deleted.id),
          )
          toast.success('Test account deleted', {
            description: deleted.name,
          })
        }}
      />
    </div>
  )
}
