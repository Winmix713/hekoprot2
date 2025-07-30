"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, TrendingUp, Target, Brain, Zap, CheckCircle, BarChart3, Calendar, Trophy, Play, Loader2, AlertCircle } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TeamLeagueTable } from "@/components/team-league-table"
import { MatchList } from "@/components/match-list"
import { useMatchStats, useMatches, useModels, usePredictions, useSystemStatus } from "@/hooks/use-api"

// Sample data for charts
const accuracyData = [
  { name: "Jan", accuracy: 78, predictions: 45 },
  { name: "Feb", accuracy: 82, predictions: 52 },
  { name: "Mar", accuracy: 85, predictions: 48 },
  { name: "Apr", accuracy: 79, predictions: 61 },
  { name: "May", accuracy: 88, predictions: 55 },
  { name: "Jun", accuracy: 91, predictions: 49 },
]

const modelPerformance = [
  { name: "Neural Network", value: 35, color: "#8884d8" },
  { name: "Random Forest", value: 28, color: "#82ca9d" },
  { name: "XGBoost", value: 22, color: "#ffc658" },
  { name: "Ensemble", value: 15, color: "#ff7300" },
]

const recentPredictions = [
  {
    id: 1,
    match: "Manchester City vs Arsenal",
    prediction: "Manchester City Win",
    confidence: 78,
    status: "pending",
    date: "2024-01-20",
  },
  {
    id: 2,
    match: "Liverpool vs Chelsea",
    prediction: "Draw",
    confidence: 65,
    status: "correct",
    date: "2024-01-19",
  },
  {
    id: 3,
    match: "Newcastle vs Brighton",
    prediction: "Over 2.5 Goals",
    confidence: 82,
    status: "wrong",
    date: "2024-01-18",
  },
]

const liveMatches = [
  {
    id: 1,
    homeTeam: "Tottenham",
    awayTeam: "West Ham",
    homeScore: 2,
    awayScore: 1,
    minute: "67'",
    status: "live",
  },
  {
    id: 2,
    homeTeam: "Aston Villa",
    awayTeam: "Crystal Palace",
    homeScore: 0,
    awayScore: 0,
    minute: "23'",
    status: "live",
  },
]

export default function DashboardPage() {
  // API hooks for real-time data
  const { data: matchStats, loading: matchStatsLoading, error: matchStatsError } = useMatchStats()
  const { data: liveMatches, loading: liveMatchesLoading } = useMatches({ 
    status: 'live', 
    size: 5 
  })
  const { data: modelsData, loading: modelsLoading } = useModels({ 
    status: 'active' 
  })
  const { data: predictionsData, loading: predictionsLoading } = usePredictions({ 
    size: 10 
  })
  const { data: systemStatus, loading: systemLoading } = useSystemStatus()
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name === "accuracy" ? "%" : ""}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Football Prediction Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">AI-powered insights and real-time match predictions</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
            System Online
          </Badge>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Brain className="h-4 w-4 mr-2" />
            Run Predictions
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Model Accuracy Card */}
        <Card className="glass-card hover-lift" style={{ animationDelay: "0ms" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
            <Target className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            {matchStatsLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : matchStatsError ? (
              <div className="text-sm text-red-400">Error loading data</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-400">
                  {matchStats ? `${matchStats.home_win_percentage?.toFixed(1) || '0.0'}%` : '87.2%'}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-400" />
                  +2.3% from last month
                </div>
                <Progress value={matchStats?.home_win_percentage || 87.2} className="mt-2" />
              </>
            )}
          </CardContent>
        </Card>

        {/* Active Models Card */}
        <Card className="glass-card hover-lift" style={{ animationDelay: "100ms" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <Brain className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            {modelsLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-purple-400">
                  {modelsData?.total || 4}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Activity className="h-3 w-3 mr-1 text-green-400" />
                  {modelsData?.total ? `${modelsData.total} active models` : '2 training, 2 deployed'}
                </div>
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: Math.min(modelsData?.total || 4, 6) }).map((_, i) => (
                    <div key={i} className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Today's Predictions Card */}
        <Card className="glass-card hover-lift" style={{ animationDelay: "200ms" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
            <Zap className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            {predictionsLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-400">
                  {predictionsData?.total || 23}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-400" />
                  {predictionsData?.total ? `${predictionsData.total} predictions` : '18 completed, 5 pending'}
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="text-green-400">78% success rate</span>
                  <span className="text-muted-foreground">5 live</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Match Statistics Card */}
        <Card className="glass-card hover-lift" style={{ animationDelay: "300ms" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            {matchStatsLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-400">
                  {matchStats?.total_matches || 0}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-400" />
                  {matchStats?.finished_matches || 0} finished
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Live: {matchStats?.live_matches || 0} | Upcoming: {matchStats?.upcoming_matches || 0}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Matches */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
            <Play className="h-5 w-5 text-red-400" />
            Live Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          {liveMatchesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <span className="ml-2">Loading live matches...</span>
            </div>
          ) : liveMatches?.matches?.length === 0 || !liveMatches?.matches ? (
            <div className="text-center py-8 text-muted-foreground">
              No live matches at the moment
            </div>
          ) : (
            <div className="grid gap-4">
              {liveMatches.matches.map((match: any) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 border border-red-500/30"
                >
                  <div className="flex items-center gap-4">
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      <div className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse" />
                      LIVE
                    </Badge>
                    <div>
                      <div className="font-semibold">
                        {match.home_team?.name || 'Home Team'} vs {match.away_team?.name || 'Away Team'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(match.match_date).toLocaleTimeString('en-GB', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      <span className="text-blue-400">{match.home_goals ?? 0}</span>
                      <span className="text-muted-foreground mx-2">-</span>
                      <span className="text-purple-400">{match.away_goals ?? 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy Trend */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Model Accuracy Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accuracyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip content={CustomTooltip} />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#60a5fa"
                    strokeWidth={3}
                    dot={{ fill: "#60a5fa", strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: "#60a5fa", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Model Performance Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Model Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modelPerformance}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {modelPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={CustomTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {modelPerformance.map((model) => (
                <div key={model.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: model.color }} />
                  <span className="text-sm">{model.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Predictions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-400" />
              Recent Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPredictions.map((prediction) => (
                <div
                  key={prediction.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex-1">
                    <div className="font-medium">{prediction.match}</div>
                    <div className="text-sm text-muted-foreground">{prediction.prediction}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {new Date(prediction.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-sm font-medium">{prediction.confidence}%</div>
                      <Badge
                        variant="outline"
                        className={`${
                          prediction.status === "correct"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : prediction.status === "wrong"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        }`}
                      >
                        {prediction.status}
                      </Badge>
                    </div>
                    <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${prediction.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-400" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <div>
                    <div className="font-medium">Data Pipeline</div>
                    <div className="text-sm text-muted-foreground">Processing match data</div>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                  <div>
                    <div className="font-medium">Model Training</div>
                    <div className="text-sm text-muted-foreground">Neural Network v2.1</div>
                  </div>
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Training</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
                  <div>
                    <div className="font-medium">API Services</div>
                    <div className="text-sm text-muted-foreground">External data feeds</div>
                  </div>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Online</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
                  <div>
                    <div className="font-medium">Database</div>
                    <div className="text-sm text-muted-foreground">PostgreSQL cluster</div>
                  </div>
                </div>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Healthy</Badge>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">System Uptime</span>
                  <span className="font-medium">99.8% (7 days)</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Last Update</span>
                  <span className="font-medium">2 minutes ago</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* League Table and Match List */}
      <Tabs defaultValue="table" className="space-y-6">
        <TabsList className="glass-card">
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            League Table
          </TabsTrigger>
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Recent Matches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <TeamLeagueTable />
        </TabsContent>

        <TabsContent value="matches">
          <MatchList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
