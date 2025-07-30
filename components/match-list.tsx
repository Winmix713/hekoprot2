"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Loader2, AlertCircle } from "lucide-react"
import { useMatches } from "@/hooks/use-api"

export function MatchList() {
  const { data: matchesData, loading, error, refetch } = useMatches({
    size: 5,
    status: 'finished'
  })
  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-400" />
            Recent Match Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <span className="ml-2">Loading matches...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-400" />
            Recent Match Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-red-400">
            <AlertCircle className="h-8 w-8" />
            <span className="ml-2">Failed to load matches: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const matches = matchesData?.matches || []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finished':
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">FT</Badge>
      case 'live':
        return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">LIVE</Badge>
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">Scheduled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }),
      time: date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-400" />
          Recent Match Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No matches found
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match: any, index: number) => {
              const { date, time } = formatDateTime(match.match_date)
              return (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 hover-lift"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-6">
                    <div className="text-center min-w-[80px]">
                      <div className="text-sm text-muted-foreground mb-1">
                        {date}
                      </div>
                      <div className="flex items-center gap-1 text-sm justify-center">
                        <Clock className="h-3 w-3" />
                        {time}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right min-w-[120px]">
                        <div className="font-semibold">{match.home_team?.name || 'Home Team'}</div>
                        <div className="text-sm text-muted-foreground">Home</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-blue-400">{match.home_goals ?? 0}</div>
                        <div className="text-xl font-bold text-muted-foreground">-</div>
                        <div className="text-2xl font-bold text-purple-400">{match.away_goals ?? 0}</div>
                      </div>

                      <div className="text-left min-w-[120px]">
                        <div className="font-semibold">{match.away_team?.name || 'Away Team'}</div>
                        <div className="text-sm text-muted-foreground">Away</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <MapPin className="h-3 w-3" />
                        {match.venue || 'Stadium'}
                      </div>
                      {getStatusBadge(match.status)}
                    </div>

                    <div className="text-right min-w-[140px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {match.winner === 'home' ? 'Home Win' : 
                           match.winner === 'away' ? 'Away Win' : 
                           match.winner === 'draw' ? 'Draw' : 'N/A'}
                        </span>
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          Result
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Season: {match.season?.name || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
