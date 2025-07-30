import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function MatchesLoading() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />

        {/* Match Cards Skeleton */}
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <Skeleton className="h-4 w-12 mb-2" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Skeleton className="h-6 w-32 mb-1" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-8 w-8" />
                      <div className="text-left">
                        <Skeleton className="h-6 w-32 mb-1" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Skeleton className="h-6 w-24 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-4 w-28 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
