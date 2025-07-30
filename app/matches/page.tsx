"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Search, Plus, Play, Trophy, Target } from "lucide-react"

const upcomingMatches = [
  {
    id: 1,
    homeTeam: "Manchester City",
    awayTeam: "Arsenal",
    date: "2024-01-20",
    time: "16:30",
    competition: "Premier League",
    venue: "Etihad Stadium",
    prediction: { result: "Manchester City Win", confidence: 78 },
  },
  {
    id: 2,
    homeTeam: "Liverpool",
    awayTeam: "Chelsea",
    date: "2024-01-21",
    time: "14:00",
    competition: "Premier League",
    venue: "Anfield",
    prediction: { result: "Draw", confidence: 65 },
  },
]

const liveMatches = [
  {
    id: 1,
    homeTeam: "Newcastle",
    awayTeam: "Brighton",
    homeScore: 1,
    awayScore: 0,
    minute: "67'",
    competition: "Premier League",
    events: ["Goal", "Yellow Card", "Substitution"],
  },
  {
    id: 2,
    homeTeam: "Tottenham",
    awayTeam: "West Ham",
    homeScore: 2,
    awayScore: 1,
    minute: "45+2'",
    competition: "Premier League",
    events: ["Goal", "Goal", "Red Card"],
  },
]

const completedMatches = [
  {
    id: 1,
    homeTeam: "Manchester United",
    awayTeam: "Everton",
    homeScore: 3,
    awayScore: 1,
    date: "2024-01-15",
    competition: "Premier League",
    prediction: { result: "Manchester United Win", confidence: 82, actual: "correct" },
  },
  {
    id: 2,
    homeTeam: "Aston Villa",
    awayTeam: "Sheffield United",
    homeScore: 1,
    awayScore: 1,
    date: "2024-01-14",
    competition: "Premier League",
    prediction: { result: "Aston Villa Win", confidence: 71, actual: "incorrect" },
  },
]

export default function MatchesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Match Management
          </h1>
          <p className="text-muted-foreground mt-2">Monitor live matches, upcoming fixtures, and historical results</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search matches..." className="pl-10 w-64 glass-card border-white/20" />
          </div>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            Add Match
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="glass-card">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Live
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 ml-1">{liveMatches.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Matches */}
        <TabsContent value="upcoming">
          <div className="grid gap-6">
            {upcomingMatches.map((match) => (
              <Card key={match.id} className="glass-card hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">
                          {new Date(match.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {match.time}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold">{match.homeTeam}</div>
                          <div className="text-sm text-muted-foreground">Home</div>
                        </div>

                        <div className="text-2xl font-bold text-muted-foreground">vs</div>

                        <div className="text-left">
                          <div className="font-semibold">{match.awayTeam}</div>
                          <div className="text-sm text-muted-foreground">Away</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {match.competition}
                        </Badge>
                        <div className="text-sm text-muted-foreground">{match.venue}</div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="h-4 w-4 text-blue-400" />
                          <span className="text-sm font-medium">{match.prediction.result}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{match.prediction.confidence}% confidence</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Live Matches */}
        <TabsContent value="live">
          <div className="grid gap-6">
            {liveMatches.map((match) => (
              <Card key={match.id} className="glass-card hover-lift border-red-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 mb-2">
                          <div className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse" />
                          LIVE
                        </Badge>
                        <div className="text-lg font-bold">{match.minute}</div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold">{match.homeTeam}</div>
                          <div className="text-3xl font-bold text-blue-400">{match.homeScore}</div>
                        </div>

                        <div className="text-2xl font-bold text-muted-foreground">-</div>

                        <div className="text-left">
                          <div className="font-semibold">{match.awayTeam}</div>
                          <div className="text-3xl font-bold text-purple-400">{match.awayScore}</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge variant="outline" className="mb-2">
                        {match.competition}
                      </Badge>
                      <div className="flex flex-wrap gap-1">
                        {match.events.map((event, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Results */}
        <TabsContent value="results">
          <div className="grid gap-6">
            {completedMatches.map((match) => (
              <Card key={match.id} className="glass-card hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">
                          {new Date(match.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </div>
                        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                          FT
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold">{match.homeTeam}</div>
                          <div className="text-3xl font-bold text-blue-400">{match.homeScore}</div>
                        </div>

                        <div className="text-2xl font-bold text-muted-foreground">-</div>

                        <div className="text-left">
                          <div className="font-semibold">{match.awayTeam}</div>
                          <div className="text-3xl font-bold text-purple-400">{match.awayScore}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {match.competition}
                        </Badge>
                        <div className="text-sm text-muted-foreground">{match.date}</div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="h-4 w-4 text-blue-400" />
                          <span className="text-sm font-medium">{match.prediction.result}</span>
                          <Badge
                            className={`${
                              match.prediction.actual === "correct"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-red-500/20 text-red-400 border-red-500/30"
                            }`}
                          >
                            {match.prediction.actual}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{match.prediction.confidence}% confidence</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
