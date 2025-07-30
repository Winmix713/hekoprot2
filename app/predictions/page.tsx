"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Search,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Zap,
  Plus,
  Brain,
  Calendar,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts"

// Enhanced sample predictions data
const predictionsData = [
  {
    id: 1,
    homeTeam: "Manchester City",
    awayTeam: "Liverpool",
    date: "2024-01-28",
    kickoff: "15:30",
    league: "Premier League",
    prediction: "Man City",
    actual: "Draw",
    confidence: 0.78,
    model: "RandomForest v2.1",
    status: "Wrong",
    odds: { home: 1.85, draw: 3.4, away: 4.2 },
    expectedGoals: { home: 1.8, away: 1.2 },
    riskLevel: "Medium",
    profitLoss: -100,
    betAmount: 100,
  },
  {
    id: 2,
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    date: "2024-01-27",
    kickoff: "17:30",
    league: "Premier League",
    prediction: "Arsenal",
    actual: "Arsenal",
    confidence: 0.82,
    model: "RandomForest v2.1",
    status: "Correct",
    odds: { home: 2.1, draw: 3.2, away: 3.8 },
    expectedGoals: { home: 2.1, away: 1.4 },
    riskLevel: "Low",
    profitLoss: 110,
    betAmount: 100,
  },
  {
    id: 3,
    homeTeam: "Barcelona",
    awayTeam: "Real Madrid",
    date: "2024-01-29",
    kickoff: "20:00",
    league: "La Liga",
    prediction: "Barcelona",
    actual: "-",
    confidence: 0.71,
    model: "Poisson v1.8",
    status: "Pending",
    odds: { home: 2.45, draw: 3.1, away: 3.25 },
    expectedGoals: { home: 1.6, away: 1.3 },
    riskLevel: "High",
    profitLoss: 0,
    betAmount: 150,
  },
  {
    id: 4,
    homeTeam: "Bayern Munich",
    awayTeam: "Dortmund",
    date: "2024-01-26",
    kickoff: "18:30",
    league: "Bundesliga",
    prediction: "Bayern",
    actual: "Bayern",
    confidence: 0.89,
    model: "Elo v3.0",
    status: "Correct",
    odds: { home: 1.65, draw: 3.8, away: 5.5 },
    expectedGoals: { home: 2.3, away: 1.1 },
    riskLevel: "Low",
    profitLoss: 65,
    betAmount: 100,
  },
  {
    id: 5,
    homeTeam: "PSG",
    awayTeam: "Marseille",
    date: "2024-01-30",
    kickoff: "21:00",
    league: "Ligue 1",
    prediction: "PSG",
    actual: "-",
    confidence: 0.76,
    model: "RandomForest v2.1",
    status: "Pending",
    odds: { home: 1.55, draw: 4.2, away: 6.0 },
    expectedGoals: { home: 2.0, away: 0.9 },
    riskLevel: "Medium",
    profitLoss: 0,
    betAmount: 200,
  },
  {
    id: 6,
    homeTeam: "Juventus",
    awayTeam: "AC Milan",
    date: "2024-01-25",
    kickoff: "20:45",
    league: "Serie A",
    prediction: "Juventus",
    actual: "AC Milan",
    confidence: 0.65,
    model: "Poisson v1.8",
    status: "Wrong",
    odds: { home: 2.8, draw: 3.0, away: 2.9 },
    expectedGoals: { home: 1.4, away: 1.7 },
    riskLevel: "High",
    profitLoss: -120,
    betAmount: 120,
  },
]

// Performance data for charts
const confidenceAccuracy = [
  { range: "50-60%", predictions: 45, correct: 32, accuracy: 71 },
  { range: "60-70%", predictions: 78, correct: 56, accuracy: 72 },
  { range: "70-80%", predictions: 124, correct: 98, accuracy: 79 },
  { range: "80-90%", predictions: 89, correct: 78, accuracy: 88 },
  { range: "90-100%", predictions: 34, correct: 31, accuracy: 91 },
]

const dailyPredictions = [
  { date: "Jan 20", predictions: 12, correct: 8, accuracy: 67 },
  { date: "Jan 21", predictions: 15, correct: 11, accuracy: 73 },
  { date: "Jan 22", predictions: 18, correct: 14, accuracy: 78 },
  { date: "Jan 23", predictions: 14, correct: 10, accuracy: 71 },
  { date: "Jan 24", predictions: 16, correct: 13, accuracy: 81 },
  { date: "Jan 25", predictions: 20, correct: 15, accuracy: 75 },
  { date: "Jan 26", predictions: 22, correct: 17, accuracy: 77 },
]

const modelPerformance = [
  { name: "RandomForest", value: 45, accuracy: 78, color: "#22c55e" },
  { name: "Neural Network", value: 30, accuracy: 74, color: "#3b82f6" },
  { name: "Ensemble", value: 15, accuracy: 82, color: "#f59e0b" },
  { name: "Poisson", value: 10, accuracy: 69, color: "#ef4444" },
]

const predictions = [
  {
    id: 1,
    match: "Manchester City vs Arsenal",
    prediction: "Manchester City Win",
    confidence: 78,
    odds: "2.1",
    expectedValue: "+15.2%",
    status: "pending",
    date: "2024-01-20",
    time: "16:30",
    model: "Neural Network v2.1",
    factors: ["Home advantage", "Recent form", "Head-to-head"],
  },
  {
    id: 2,
    match: "Liverpool vs Chelsea",
    prediction: "Draw",
    confidence: 65,
    odds: "3.2",
    expectedValue: "+8.7%",
    status: "won",
    date: "2024-01-19",
    time: "14:00",
    model: "Ensemble Model",
    factors: ["Defensive stats", "Injury reports", "Weather"],
  },
  {
    id: 3,
    match: "Newcastle vs Brighton",
    prediction: "Over 2.5 Goals",
    confidence: 82,
    odds: "1.8",
    expectedValue: "+12.4%",
    status: "lost",
    date: "2024-01-18",
    time: "18:00",
    model: "XGBoost v3.0",
    factors: ["Attack efficiency", "Goal trends", "Player form"],
  },
  {
    id: 4,
    match: "Tottenham vs West Ham",
    prediction: "Tottenham Win",
    confidence: 71,
    odds: "1.9",
    expectedValue: "+6.3%",
    status: "won",
    date: "2024-01-17",
    time: "20:30",
    model: "Random Forest",
    factors: ["Squad depth", "Tactical analysis", "Motivation"],
  },
]

const modelStats = [
  {
    name: "Neural Network v2.1",
    accuracy: 87.2,
    predictions: 1247,
    profit: "+23.4%",
    status: "active",
  },
  {
    name: "Ensemble Model",
    accuracy: 84.6,
    predictions: 892,
    profit: "+18.7%",
    status: "active",
  },
  {
    name: "XGBoost v3.0",
    accuracy: 89.1,
    predictions: 634,
    profit: "+31.2%",
    status: "training",
  },
  {
    name: "Random Forest",
    accuracy: 82.3,
    predictions: 1456,
    profit: "+15.8%",
    status: "active",
  },
]

export default function PredictionsPage() {
  const [predictionsList, setPredictionsList] = useState(predictionsData)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [confidenceFilter, setConfidenceFilter] = useState("all")
  const [leagueFilter, setLeagueFilter] = useState("all")
  const [riskFilter, setRiskFilter] = useState("all")
  const [selectedPrediction, setSelectedPrediction] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Correct":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        )
      case "Wrong":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        )
      case "Pending":
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "Low":
        return <Badge className="bg-green-100 text-green-800">{risk}</Badge>
      case "Medium":
        return <Badge className="bg-yellow-100 text-yellow-800">{risk}</Badge>
      case "High":
        return <Badge className="bg-red-100 text-red-800">{risk}</Badge>
      default:
        return <Badge variant="outline">{risk}</Badge>
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600"
    if (confidence >= 0.7) return "text-yellow-600"
    return "text-red-600"
  }

  const filteredPredictions = useMemo(() => {
    return predictionsList.filter((prediction) => {
      const matchesSearch =
        prediction.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prediction.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prediction.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prediction.league.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || prediction.status.toLowerCase() === statusFilter.toLowerCase()
      const matchesLeague = leagueFilter === "all" || prediction.league === leagueFilter
      const matchesRisk = riskFilter === "all" || prediction.riskLevel === riskFilter

      const matchesConfidence =
        confidenceFilter === "all" ||
        (confidenceFilter === "high" && prediction.confidence >= 0.8) ||
        (confidenceFilter === "medium" && prediction.confidence >= 0.6 && prediction.confidence < 0.8) ||
        (confidenceFilter === "low" && prediction.confidence < 0.6)

      return matchesSearch && matchesStatus && matchesConfidence && matchesLeague && matchesRisk
    })
  }, [predictionsList, searchTerm, statusFilter, confidenceFilter, leagueFilter, riskFilter])

  const accuracyStats = useMemo(() => {
    const total = predictionsList.filter((p) => p.status !== "Pending").length
    const correct = predictionsList.filter((p) => p.status === "Correct").length
    const wrong = predictionsList.filter((p) => p.status === "Wrong").length
    const pending = predictionsList.filter((p) => p.status === "Pending").length
    const totalProfitLoss = predictionsList.reduce((sum, p) => sum + p.profitLoss, 0)

    return {
      total,
      correct,
      wrong,
      pending,
      accuracy: total > 0 ? ((correct / total) * 100).toFixed(1) : 0,
      totalProfitLoss,
      avgConfidence: predictionsList.reduce((sum, p) => sum + p.confidence, 0) / predictionsList.length,
    }
  }, [predictionsList])

  const handlePredictionClick = (prediction: any) => {
    setSelectedPrediction(prediction)
    setIsDetailModalOpen(true)
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Predictions
          </h1>
          <p className="text-muted-foreground mt-2">Machine learning powered football predictions and analysis</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search predictions..."
              className="pl-10 w-64 glass-card border-white/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="glass-button bg-transparent">
            <Brain className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            New Prediction
          </Button>
        </div>
      </div>

      {/* Model Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modelStats.map((model, index) => (
          <Card key={model.name} className="glass-card hover-lift" style={{ animationDelay: `${index * 100}ms` }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{model.name}</CardTitle>
                <Badge
                  variant="outline"
                  className={`${
                    model.status === "active"
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : model.status === "training"
                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                  }`}
                >
                  {model.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Accuracy</span>
                    <span className="font-medium">{model.accuracy}%</span>
                  </div>
                  <Progress value={model.accuracy} className="h-2" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Predictions</span>
                  <span className="font-medium">{model.predictions.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Profit</span>
                  <span className="font-medium text-green-400">{model.profit}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Predictions List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <Target className="h-5 w-5" />
            Recent Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <div
                key={prediction.id}
                className="flex items-center justify-between p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 hover-lift"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{prediction.match}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(prediction.date).toLocaleDateString("en-GB")}
                        <Clock className="h-3 w-3 ml-2" />
                        {prediction.time}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${
                        prediction.status === "won"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : prediction.status === "lost"
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      }`}
                    >
                      {prediction.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Prediction</div>
                      <div className="font-medium">{prediction.prediction}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Model</div>
                      <div className="font-medium text-purple-400">{prediction.model}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Key Factors</div>
                      <div className="flex flex-wrap gap-1">
                        {prediction.factors.slice(0, 2).map((factor, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                        {prediction.factors.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{prediction.factors.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 ml-6">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Confidence</div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${prediction.confidence}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold">{prediction.confidence}%</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Odds</div>
                    <div className="text-lg font-bold">{prediction.odds}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Expected Value</div>
                    <div className="text-lg font-bold text-green-400">{prediction.expectedValue}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accuracyStats.accuracy}%</div>
            <p className="text-xs text-muted-foreground">
              {accuracyStats.correct}/{accuracyStats.total} correct
            </p>
            <Progress value={Number(accuracyStats.accuracy)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Correct Predictions</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{accuracyStats.correct}</div>
            <p className="text-xs text-muted-foreground">Successful predictions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wrong Predictions</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{accuracyStats.wrong}</div>
            <p className="text-xs text-muted-foreground">Failed predictions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accuracyStats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting results</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit/Loss</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${accuracyStats.totalProfitLoss >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {accuracyStats.totalProfitLoss >= 0 ? "+" : ""}${accuracyStats.totalProfitLoss}
            </div>
            <p className="text-xs text-muted-foreground">Total return</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="predictions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="predictions">All Predictions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search predictions, teams, or models..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="correct">Correct</SelectItem>
                    <SelectItem value="wrong">Wrong</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={leagueFilter} onValueChange={setLeagueFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="League" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leagues</SelectItem>
                    <SelectItem value="Premier League">Premier League</SelectItem>
                    <SelectItem value="La Liga">La Liga</SelectItem>
                    <SelectItem value="Bundesliga">Bundesliga</SelectItem>
                    <SelectItem value="Serie A">Serie A</SelectItem>
                    <SelectItem value="Ligue 1">Ligue 1</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Confidence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Confidence</SelectItem>
                    <SelectItem value="high">High (≥80%)</SelectItem>
                    <SelectItem value="medium">Medium (60-79%)</SelectItem>
                    <SelectItem value="low">Low (&lt;60%)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk</SelectItem>
                    <SelectItem value="Low">Low Risk</SelectItem>
                    <SelectItem value="Medium">Medium Risk</SelectItem>
                    <SelectItem value="High">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Predictions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Predictions ({filteredPredictions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPredictions.map((prediction) => (
                  <div
                    key={prediction.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handlePredictionClick(prediction)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-medium text-lg">
                            {prediction.homeTeam} vs {prediction.awayTeam}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Badge variant="outline">{prediction.league}</Badge>
                            <span>
                              {prediction.date} • {prediction.kickoff}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(prediction.status)}
                        {getRiskBadge(prediction.riskLevel)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Prediction</div>
                        <div className="font-medium">{prediction.prediction}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Actual</div>
                        <div className="font-medium">{prediction.actual === "-" ? "TBD" : prediction.actual}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Confidence</div>
                        <div className={`font-medium ${getConfidenceColor(prediction.confidence)}`}>
                          {(prediction.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Model</div>
                        <div className="font-medium text-xs">{prediction.model}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Expected Goals</div>
                        <div className="font-medium">
                          {prediction.expectedGoals.home} - {prediction.expectedGoals.away}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">P&L</div>
                        <div
                          className={`font-medium ${prediction.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {prediction.profitLoss >= 0 ? "+" : ""}${prediction.profitLoss}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confidence vs Accuracy */}
            <Card>
              <CardHeader>
                <CardTitle>Confidence vs Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={confidenceAccuracy}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip content={CustomTooltip} />
                      <Bar dataKey="predictions" fill="hsl(var(--primary))" name="Predictions" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="correct" fill="hsl(var(--success))" name="Correct" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Model Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Model Performance Distribution</CardTitle>
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
                      <div className="text-sm">
                        <div className="font-medium">{model.name}</div>
                        <div className="text-muted-foreground">{model.accuracy}% accuracy</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Prediction Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyPredictions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
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
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  High Confidence Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictionsList
                    .filter((p) => p.confidence >= 0.8)
                    .slice(0, 3)
                    .map((prediction) => (
                      <div key={prediction.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm">
                            {prediction.homeTeam} vs {prediction.awayTeam}
                          </div>
                          <div className="text-xs text-muted-foreground">{prediction.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            {(prediction.confidence * 100).toFixed(0)}%
                          </div>
                          {getStatusBadge(prediction.status)}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  High Risk Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictionsList
                    .filter((p) => p.riskLevel === "High")
                    .slice(0, 3)
                    .map((prediction) => (
                      <div key={prediction.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm">
                            {prediction.homeTeam} vs {prediction.awayTeam}
                          </div>
                          <div className="text-xs text-muted-foreground">{prediction.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">${prediction.betAmount}</div>
                          {getRiskBadge(prediction.riskLevel)}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Best Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictionsList
                    .filter((p) => p.profitLoss > 0)
                    .sort((a, b) => b.profitLoss - a.profitLoss)
                    .slice(0, 3)
                    .map((prediction) => (
                      <div key={prediction.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm">
                            {prediction.homeTeam} vs {prediction.awayTeam}
                          </div>
                          <div className="text-xs text-muted-foreground">{prediction.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">+${prediction.profitLoss}</div>
                          {getStatusBadge(prediction.status)}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Prediction Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPrediction?.homeTeam} vs {selectedPrediction?.awayTeam}
            </DialogTitle>
          </DialogHeader>
          {selectedPrediction && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">League</Label>
                  <div className="font-medium">{selectedPrediction.league}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Date & Time</Label>
                  <div className="font-medium">
                    {selectedPrediction.date} • {selectedPrediction.kickoff}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Model Used</Label>
                  <div className="font-medium">{selectedPrediction.model}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div>{getStatusBadge(selectedPrediction.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Prediction Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Predicted Outcome:</span>
                      <Badge variant="outline">{selectedPrediction.prediction}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Actual Outcome:</span>
                      <span className="font-medium">
                        {selectedPrediction.actual === "-" ? "TBD" : selectedPrediction.actual}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span className={`font-medium ${getConfidenceColor(selectedPrediction.confidence)}`}>
                        {(selectedPrediction.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk Level:</span>
                      {getRiskBadge(selectedPrediction.riskLevel)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Financial Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Bet Amount:</span>
                      <span className="font-medium">${selectedPrediction.betAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit/Loss:</span>
                      <span
                        className={`font-medium ${
                          selectedPrediction.profitLoss >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {selectedPrediction.profitLoss >= 0 ? "+" : ""}${selectedPrediction.profitLoss}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected Goals (Home):</span>
                      <span className="font-medium">{selectedPrediction.expectedGoals.home}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected Goals (Away):</span>
                      <span className="font-medium">{selectedPrediction.expectedGoals.away}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Betting Odds</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Home Win</div>
                      <div className="text-2xl font-bold">{selectedPrediction.odds.home}</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Draw</div>
                      <div className="text-2xl font-bold">{selectedPrediction.odds.draw}</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Away Win</div>
                      <div className="text-2xl font-bold">{selectedPrediction.odds.away}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
