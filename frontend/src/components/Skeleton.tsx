/** Reusable skeleton building blocks for loading states */

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />;
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3 animate-pulse ${className}`}>
      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

export function SkeletonItem() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 sm:p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="flex gap-1">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** Dashboard skeleton matching the actual dashboard layout */
export function DashboardSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6 animate-pulse">
      {/* Greeting */}
      <div>
        <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <div className="col-span-2">
          <SkeletonCard />
        </div>
      </div>
      {/* Spending bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-2">
        <div className="flex justify-between">
          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 w-44 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 w-44 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Kitchen skeleton matching the kitchen items layout */
export function KitchenSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mt-1" />
        </div>
        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
      {/* Search */}
      <div className="h-11 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      {/* Category chips */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
        ))}
      </div>
      {/* Items */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonItem key={i} />
        ))}
      </div>
    </div>
  );
}
