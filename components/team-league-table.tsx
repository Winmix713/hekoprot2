"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, TrendingDown, Minus, Loader2, AlertCircle } from "lucide-react"
import { useLeagueTable } from "@/hooks/use-api"

export function TeamLeagueTable() {
  const { data: leagueData, loading, error, refetch } = useLeagueTable()
  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            League Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <span className="ml-2">Loading league table...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            League Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-red-400">
            <AlertCircle className="h-8 w-8" />
            <span className="ml-2">Failed to load league table: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const teams = leagueData || []

  const getFormBadge = (result: string) => {
    switch (result) {
      case "W":
        return <Badge className="w-6 h-6 p-0 bg-green-500/20 text-green-400 border-green-500/30">W</Badge>
      case "D":
        return <Badge className="w-6 h-6 p-0 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">D</Badge>
      case "L":
        return <Badge className="w-6 h-6 p-0 bg-red-500/20 text-red-400 border-red-500/30">L</Badge>
      default:
        return null
    }
  }

  const parseForm = (formString: string) => {
    if (!formString || formString === 'N/A') return []
    // Handle various form formats: "WWDLW", "W,W,D,L,W", etc.
    return formString.replace(/,/g, '').split('').slice(0, 5)
  }

  const getPositionColor = (position: number) => {
    if (position <= 4) return "text-green-400" // Champions League
    if (position <= 6) return "text-blue-400" // Europa League
    if (position >= 18) return "text-red-400" // Relegation
    return "text-white"
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          League Table
        </CardTitle>
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No league data available
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Pos</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Team</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">P</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">W</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">D</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">L</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">GF</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">GA</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">GD</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">Pts</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">Form</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team: any, index: number) => {
                  const formArray = parseForm(team.form)
                  return (
                    <tr
                      key={team.team_id || team.team_name || index}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="p-3">
                        <div className={`font-bold ${getPositionColor(team.position)}`}>{team.position}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold">
                            {(team.team_name || 'Team').substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium">{team.team_name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">{team.matches_played}</td>
                      <td className="p-3 text-center text-green-400">{team.wins}</td>
                      <td className="p-3 text-center text-yellow-400">{team.draws}</td>
                      <td className="p-3 text-center text-red-400">{team.losses}</td>
                      <td className="p-3 text-center">{team.goals_for}</td>
                      <td className="p-3 text-center">{team.goals_against}</td>
                      <td className="p-3 text-center">
                        <span
                          className={
                            team.goal_difference > 0
                              ? "text-green-400"
                              : team.goal_difference < 0
                                ? "text-red-400"
                                : "text-gray-400"
                          }
                        >
                          {team.goal_difference > 0 ? "+" : ""}
                          {team.goal_difference}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-bold text-blue-400">{team.points}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          {formArray.length > 0 ? (
                            formArray.map((result: string, idx: number) => (
                              <div key={idx}>{getFormBadge(result)}</div>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">N/A</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {teams.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full" />
              <span className="text-muted-foreground">Champions League</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full" />
              <span className="text-muted-foreground">Europa League</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full" />
              <span className="text-muted-foreground">Relegation</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
