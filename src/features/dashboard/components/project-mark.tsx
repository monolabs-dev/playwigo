import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '#/components/ui/avatar.tsx'
import { cn } from '#/lib/utils.ts'
import {
  projectFaviconUrl,
  projectInitials,
  projectMarkTone,
} from '#/features/dashboard/utils/project-display.ts'

export function ProjectMark({
  id,
  name,
  website,
  className,
}: {
  id: string
  name: string
  website: string
  className?: string
}) {
  const faviconUrl = projectFaviconUrl(website)

  return (
    <Avatar
      size="sm"
      className={cn('size-6 rounded-md after:rounded-md', className)}
    >
      {faviconUrl ? (
        <AvatarImage
          src={faviconUrl}
          alt=""
          className="rounded-md bg-background object-contain p-0.5"
        />
      ) : null}
      <AvatarFallback
        className={cn(
          'rounded-md text-[11px] font-semibold',
          projectMarkTone(id),
        )}
      >
        {projectInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
