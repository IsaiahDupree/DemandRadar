import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

/**
 * Skeleton for card components
 * Displays a skeleton for a typical card with title and content
 */
function SkeletonCard() {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      {/* Card header/title */}
      <Skeleton className="h-6 w-3/4" />

      {/* Card content lines */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      {/* Card footer/action */}
      <Skeleton className="h-10 w-24" />
    </div>
  )
}

/**
 * Skeleton for list items
 * Displays a skeleton for a list with configurable number of items
 */
function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          {/* Avatar/Icon */}
          <Skeleton className="h-12 w-12 rounded-full" />

          {/* Content */}
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton for report sections
 * Displays a skeleton for a report with header, stats, and content sections
 */
function SkeletonReport() {
  return (
    <div className="space-y-6">
      {/* Report header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>

      {/* Stats/metrics section */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      {/* Content sections */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-2/3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-1/2" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonList, SkeletonReport }
