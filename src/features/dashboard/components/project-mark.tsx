import { cn } from '#/lib/utils.ts'
import {
  projectInitials,
  projectMarkTone,
} from '#/features/dashboard/utils/project-display.ts'

export function ProjectMark({
  id,
  name,
  className,
}: {
  id: string
  name: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold',
        projectMarkTone(id),
        className,
      )}
    >
      {projectInitials(name)}
    </span>
  )
}
