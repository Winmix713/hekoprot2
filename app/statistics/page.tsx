"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Trophy,
  Target,
  Users,
  Brain,
  Activity,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Area,
  AreaChart,
} from "recharts"

// Enhanced sample data
const summaryStats = {
  totalPredictions: 3216,
  overallAccuracy: 73.2,
  bestModel: "RandomForest",
  avgConfidence: 0.78,
  trendsUp: 2.1,
}

const predictionDistribution = [
  { name: "Correct", value: 73, color: "#22c55e", count: 2348 },
  { name: "Wrong", value: 27, color: "#ef4444", count: 868 },
]

const difficultyDistribution = [
  { name: "Predictable", value: 45, color: "#10b981" },
  { name: "Moderate", value: 35, color: "#f59e0b" },
  { name: "Unpredictable", value: 20, color: "#ef4444" },
]

const modelPerformanceRadar = [
  { model: "Random Forest", accuracy: 85, precision: 82, recall: 88, f1Score: 85 },
  { model: "Neural Network", accuracy: 78, precision: 75, recall: 82, f1Score: 78 },
  { model: "Ensemble", accuracy: 88, precision: 85, recall: 90, f1Score: 87 },
  { model: "Logistic Reg.", accuracy: 72, precision: 70, recall: 75, f1Score: 72 },
]

const teamPredictability = [
  { team: "Manchester City", predictable: 89, matches: 45, winRate: 78, avgOdds: 1.65 },
  { team: "Bayern Munich", predictable: 87, matches: 42, winRate: 76, avgOdds: 1.72 },
  { team: "Barcelona", predictable: 82, matches: 38, winRate: 71, avgOdds: 1.89 },
  { team: "Liverpool", predictable: 78, matches: 41, winRate: 68, avgOdds: 2.1 },
  { team: "Arsenal", predictable: 75, matches: 39, winRate: 65, avgOdds: 2.3 },
  { team: "Chelsea", predictable: 72, matches: 37, winRate: 62, avgOdds: 2.5 },
  { team: "Real Madrid", predictable: 71, matches: 40, winRate: 70, avgOdds: 1.95 },
  { team: "PSG", predictable: 69, matches: 35, winRate: 67, avgOdds: 2.0 },
]

const confidenceAccuracy = [
  { confidence: "50-60%", predicted: 45, actualCorrect: 32, accuracy: 71 },
  { confidence: "60-70%", predicted: 78, actualCorrect: 56, accuracy: 72 },
  { confidence: "70-80%", predicted: 124, actualCorrect: 98, accuracy: 79 },
  { confidence: "80-90%", predicted: 89, actualCorrect: 78, accuracy: 88 },
  { confidence: "90-100%", predicted: 34, actualCorrect: 31, accuracy: 91 },
]

const monthlyTrends = [
  { month: "Jan", predictions: 245, accuracy: 71, confidence: 0.75 },
  { month: "Feb", predictions: 289, accuracy: 73, confidence: 0.77 },
  { month: "Mar", predictions: 312, accuracy: 75, confidence: 0.78 },
  { month: "Apr", predictions: 298, accuracy: 72, confidence: 0.76 },
  { month: "May", predictions: 334, accuracy: 74, confidence: 0.79 },
  { month: "Jun", predictions: 267, accuracy: 76, confidence: 0.81 },
  { month: "Jul", predictions: 298, accuracy: 73, confidence: 0.78 },
]

const leaguePerformance = [
  { league: "Premier League", accuracy: 78, predictions: 892, avgConfidence: 0.82 },
  { league: "La Liga", accuracy: 75, predictions: 756, avgConfidence: 0.79 },
  { league: "Bundesliga", accuracy: 73, predictions: 634, avgConfidence: 0.77 },
  { league: "Serie A", accuracy: 71, predictions: 567, avgConfidence: 0.75 },
  { league: "Ligue 1", accuracy: 69, predictions: 445, avgConfidence: 0.73 },
]

export default function StatisticsPage() {
  const [timeRange, setTimeRange] = useState("30days")
  const [selectedMetric, setSelectedMetric] = useState("accuracy")

  const topTeams = teamPredictability.slice(0, 5)
  const leastPredictable = teamPredictability.slice(-3).reverse()

  const handleExport = () => {
    // Export functionality
    console.log("Exporting statistics...")
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name.includes("Accuracy") ? "%" : ""}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Statistics & Reports</h1>
          <p className="text-muted-foreground">Comprehensive analytics and performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.overallAccuracy}%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" />+{summaryStats.trendsUp}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalPredictions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Model</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.bestModel}</div>
            <p className="text-xs text-muted-foreground">85% accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(summaryStats.avgConfidence * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Prediction confidence</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prediction Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Prediction Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={predictionDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {predictionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={CustomTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {predictionDistribution.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm">
                    {entry.name}: {entry.value}% ({entry.count})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Difficulty Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Prediction Difficulty Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={difficultyDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {difficultyDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={CustomTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {difficultyDistribution.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm">
                    {entry.name}: {entry.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Performance Radar */}
      <Card>
        <CardHeader>
          <CardTitle>Model Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={modelPerformanceRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="model" />
                <PolarRadiusAxis domain={[60, 100]} />
                <Radar
                  name="Accuracy"
                  dataKey="accuracy"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Radar
                  name="Precision"
                  dataKey="precision"
                  stroke="hsl(var(--success))"
                  fill="hsl(var(--success))"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Radar
                  name="Recall"
                  dataKey="recall"
                  stroke="hsl(var(--warning))"
                  fill="hsl(var(--warning))"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Tooltip content={CustomTooltip} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Team Predictability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Most Predictable Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topTeams.map((team, index) => (
                <div key={team.team} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{team.team}</div>
                      <div className="text-sm text-muted-foreground">
                        {team.matches} matches • {team.winRate}% win rate
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-500">{team.predictable}%</Badge>
                    <div className="text-xs text-muted-foreground mt-1">Avg odds: {team.avgOdds}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-red-500" />
              Least Predictable Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leastPredictable.map((team, index) => (
                <div key={team.team} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{team.team}</div>
                      <div className="text-sm text-muted-foreground">
                        {team.matches} matches • {team.winRate}% win rate
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">{team.predictable}%</Badge>
                    <div className="text-xs text-muted-foreground mt-1">Avg odds: {team.avgOdds}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confidence vs Accuracy */}
      <Card>
        <CardHeader>
          <CardTitle>Confidence vs Actual Accuracy</CardTitle>
          <p className="text-sm text-muted-foreground">
            How well prediction confidence correlates with actual accuracy
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confidenceAccuracy}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="confidence" />
                <YAxis />
                <Tooltip content={CustomTooltip} />
                <Bar dataKey="predicted" fill="hsl(var(--primary))" name="Predicted" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actualCorrect" fill="hsl(var(--success))" name="Actual Correct" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={CustomTooltip} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="predictions"
                  stackId="1"
                  stroke="hsl(var(--muted))"
                  fill="hsl(var(--muted))"
                  fillOpacity={0.3}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="accuracy"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* League Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by League</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaguePerformance.map((league) => (
              <div key={league.league} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{league.league}</div>
                  <div className="text-sm text-muted-foreground">
                    {league.predictions} predictions • Avg confidence: {(league.avgConfidence * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold">{league.accuracy}%</div>
                    <div className="text-xs text-muted-foreground">Accuracy</div>
                  </div>
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${league.accuracy}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Team Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Team</th>
                  <th className="text-left p-2">Matches</th>
                  <th className="text-left p-2">Predictability</th>
                  <th className="text-left p-2">Win Rate</th>
                  <th className="text-left p-2">Avg Odds</th>
                  <th className="text-left p-2">Trend</th>
                </tr>
              </thead>
              <tbody>
                {teamPredictability.map((team) => (
                  <tr key={team.team} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{team.team}</td>
                    <td className="p-2">{team.matches}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span>{team.predictable}%</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${team.predictable}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-2">{team.winRate}%</td>
                    <td className="p-2">{team.avgOdds}</td>
                    <td className="p-2">
                      {team.predictable > 75 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
