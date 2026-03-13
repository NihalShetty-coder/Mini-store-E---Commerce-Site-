/**
 * Optimized Loading UI for product detail pages
 * Includes Navbar skeleton to prevent layout shift
 */
export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar Skeleton - prevents layout shift */}
      <header className="sticky top-0 z-50 w-full bg-surface border-b border-border-custom px-4 lg:px-0">
        <div className="container mx-auto">
          <div className="flex h-20 items-center justify-between gap-4 px-6 md:px-10 lg:px-16">
            <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
            <div className="hidden md:flex flex-1 max-w-md">
              <div className="h-10 w-full bg-gray-100 animate-pulse rounded" />
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
              <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
              <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 md:px-10 lg:px-16 py-4 md:py-6">
        {/* Back button skeleton */}
        <div className="h-4 w-32 bg-gray-200 animate-pulse rounded mb-6" />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 max-w-7xl mx-auto">
          {/* Gallery Skeleton */}
          <div className="w-full lg:w-5/12 flex flex-col gap-4">
            <div className="aspect-square bg-surface animate-pulse border border-border-custom" />
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-surface animate-pulse border border-border-custom" />
              ))}
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="w-full lg:w-7/12 space-y-6 pt-0 lg:pt-2">
            {/* Category */}
            <div className="h-3 w-20 bg-primary/30 animate-pulse rounded" />
            
            {/* Title */}
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 animate-pulse w-3/4 rounded" />
              <div className="h-10 bg-gray-200 animate-pulse w-1/2 rounded" />
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-4 h-4 bg-gray-200 animate-pulse rounded" />
              ))}
              <div className="h-3 w-16 bg-gray-200 animate-pulse rounded ml-2" />
            </div>

            {/* Price */}
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
            
            {/* Description */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-100 animate-pulse w-full rounded" />
              <div className="h-4 bg-gray-100 animate-pulse w-full rounded" />
              <div className="h-4 bg-gray-100 animate-pulse w-2/3 rounded" />
            </div>

            {/* Size selector */}
            <div className="space-y-2">
              <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-12 h-12 bg-gray-100 border border-border-custom animate-pulse" />
                ))}
              </div>
            </div>

            {/* Add to cart */}
            <div className="flex gap-3">
              <div className="w-32 h-12 bg-gray-100 border border-border-custom animate-pulse" />
              <div className="flex-1 h-12 bg-secondary/30 animate-pulse" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer Skeleton */}
      <footer className="bg-secondary text-[#ccc] pt-20 pb-12 mt-20">
        <div className="container mx-auto px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-4">
                <div className="h-6 w-24 bg-white/10 animate-pulse rounded" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-white/5 animate-pulse rounded" />
                  <div className="h-4 w-3/4 bg-white/5 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
