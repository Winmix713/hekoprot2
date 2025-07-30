import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function PredictionsLoading() {
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
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Model Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Predictions List Skeleton */}
      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 rounded-lg bg-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div>
                        <Skeleton className="h-5 w-48 mb-2" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Skeleton className="h-3 w-16 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div>
                        <Skeleton className="h-3 w-12 mb-1" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div>
                        <Skeleton className="h-3 w-20 mb-1" />
                        <div className="flex gap-1">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-12" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 ml-6">
                    <div className="text-center">
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-2 w-20" />
                    </div>
                    <div className="text-center">
                      <Skeleton className="h-3 w-8 mb-1" />
                      <Skeleton className="h-5 w-8" />
                    </div>
                    <div className="text-center">
                      <Skeleton className="h-3 w-20 mb-1" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
