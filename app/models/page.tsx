"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  Play,
  Pause,
  RefreshCw,
  Settings,
  Activity,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  Plus,
  Download,
  Trash2,
  Eye,
} from "lucide-react"
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

// Enhanced sample data
const modelsData = [
  {
    id: 1,
    name: "Random Forest v2.1",
    type: "Random Forest",
    status: "Active",
    accuracy: 87.2,
    lastTrained: "2024-01-28",
    trainingTime: "45 minutes",
    features: 28,
    predictions: 1247,
    confidence: 0.85,
    memoryUsage: 2.4,
    cpuUsage: 15,
  },
  {
    id: 2,
    name: "Neural Network v1.3",
    type: "Neural Network",
    status: "Training",
    accuracy: 84.1,
    lastTrained: "2024-01-25",
    trainingTime: "2h 15min",
    features: 32,
    predictions: 892,
    confidence: 0.82,
    memoryUsage: 4.8,
    cpuUsage: 45,
  },
  {
    id: 3,
    name: "Ensemble v1.0",
    type: "Ensemble",
    status: "Inactive",
    accuracy: 89.5,
    lastTrained: "2024-01-23",
    trainingTime: "1h 30min",
    features: 35,
    predictions: 654,
    confidence: 0.88,
    memoryUsage: 3.2,
    cpuUsage: 8,
  },
  {
    id: 4,
    name: "Logistic Regression v2.0",
    type: "Logistic Regression",
    status: "Error",
    accuracy: 76.8,
    lastTrained: "2024-01-20",
    trainingTime: "12 minutes",
    features: 18,
    predictions: 423,
    confidence: 0.74,
    memoryUsage: 1.1,
    cpuUsage: 5,
  },
]

const accuracyHistory = [
  { version: "v1.0", accuracy: 68, precision: 65, recall: 70, f1Score: 67 },
  { version: "v1.1", accuracy: 72, precision: 69, recall: 74, f1Score: 71 },
  { version: "v1.2", accuracy: 76, precision: 73, recall: 78, f1Score: 75 },
  { version: "v2.0", accuracy: 83, precision: 80, recall: 85, f1Score: 82 },
  { version: "v2.1", accuracy: 87, precision: 84, recall: 89, f1Score: 86 },
]

const trainingHistory = [
  {
    id: 1,
    model: "Random Forest v2.1",
    date: "2024-01-28 14:30",
    duration: "45 min",
    accuracy: 87,
    status: "completed",
    samples: 1247,
    loss: 0.23,
  },
  {
    id: 2,
    model: "Neural Network v1.3",
    date: "2024-01-25 09:15",
    duration: "2h 15min",
    accuracy: 84,
    status: "completed",
    samples: 1156,
    loss: 0.31,
  },
  {
    id: 3,
    model: "Ensemble v1.0",
    date: "2024-01-23 16:45",
    duration: "12 min",
    accuracy: null,
    status: "failed",
    samples: 0,
    loss: null,
  },
  {
    id: 4,
    model: "Random Forest v2.0",
    date: "2024-01-20 11:20",
    duration: "38 min",
    accuracy: 82,
    status: "completed",
    samples: 1089,
    loss: 0.28,
  },
]

const performanceMetrics = [
  { metric: "Accuracy", current: 87, target: 90, trend: "+2.3%" },
  { metric: "Precision", current: 84, target: 88, trend: "+1.8%" },
  { metric: "Recall", current: 89, target: 92, trend: "+3.1%" },
  { metric: "F1-Score", current: 86, target: 90, trend: "+2.5%" },
]

export default function ModelsPage() {
  const [models, setModels] = useState(modelsData)
  const [isRetraining, setIsRetraining] = useState(false)
  const [selectedModel, setSelectedModel] = useState(models[0])
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        )
      case "Training":
        return (
          <Badge className="bg-blue-500">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            {status}
          </Badge>
        )
      case "Inactive":
        return (
          <Badge variant="secondary">
            <Pause className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        )
      case "Error":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleRetrain = (modelId: number) => {
    setIsRetraining(true)
    setTrainingProgress(0)

    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsRetraining(false)
          // Update model status
          setModels((prevModels) =>
            prevModels.map((model) =>
              model.id === modelId
                ? { ...model, status: "Active", lastTrained: new Date().toISOString().split("T")[0] }
                : model,
            ),
          )
          return 100
        }
        return prev + Math.random() * 10
      })
    }, 500)
  }

  const handleModelAction = (modelId: number, action: string) => {
    setModels((prevModels) =>
      prevModels.map((model) =>
        model.id === modelId ? { ...model, status: action === "activate" ? "Active" : "Inactive" } : model,
      ),
    )
  }

  const activeModel = models.find((m) => m.status === "Active")

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
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
          <h1 className="text-3xl font-bold">Model Management</h1>
          <p className="text-muted-foreground">Manage and monitor your machine learning models</p>
        </div>
        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                New Model
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Model</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="modelName">Model Name</Label>
                  <Input id="modelName" placeholder="Enter model name" />
                </div>
                <div>
                  <Label htmlFor="modelType">Model Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random-forest">Random Forest</SelectItem>
                      <SelectItem value="neural-network">Neural Network</SelectItem>
                      <SelectItem value="ensemble">Ensemble</SelectItem>
                      <SelectItem value="logistic-regression">Logistic Regression</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Model description..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Create Model</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Models
          </Button>
        </div>
      </div>

      {/* Active Model Overview */}
      {activeModel && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-green-600" />
              Active Model: {activeModel.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">{activeModel.accuracy}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold">{activeModel.lastTrained}</div>
                <div className="text-sm text-muted-foreground">Last Trained</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold">{activeModel.predictions.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Predictions</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold">{(activeModel.confidence * 100).toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">Confidence</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold">{activeModel.memoryUsage}GB</div>
                <div className="text-sm text-muted-foreground">Memory Usage</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => handleRetrain(activeModel.id)} disabled={isRetraining}>
                {isRetraining ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Retraining... {trainingProgress.toFixed(0)}%
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retrain Model
                  </>
                )}
              </Button>
              <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Model Configuration</DialogTitle>
                  </DialogHeader>
                  <Tabs defaultValue="parameters">
                    <TabsList>
                      <TabsTrigger value="parameters">Parameters</TabsTrigger>
                      <TabsTrigger value="features">Features</TabsTrigger>
                      <TabsTrigger value="training">Training</TabsTrigger>
                    </TabsList>
                    <TabsContent value="parameters" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Learning Rate</Label>
                          <Input defaultValue="0.001" />
                        </div>
                        <div>
                          <Label>Batch Size</Label>
                          <Input defaultValue="32" />
                        </div>
                        <div>
                          <Label>Max Depth</Label>
                          <Input defaultValue="10" />
                        </div>
                        <div>
                          <Label>N Estimators</Label>
                          <Input defaultValue="100" />
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="features" className="space-y-4">
                      <div>
                        <Label>Selected Features ({activeModel.features})</Label>
                        <Textarea
                          defaultValue="team_form, head_to_head, home_advantage, player_injuries, weather_conditions, recent_transfers, goal_difference, possession_stats"
                          rows={4}
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="training" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Training Split</Label>
                          <Select defaultValue="80">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="70">70/30</SelectItem>
                              <SelectItem value="80">80/20</SelectItem>
                              <SelectItem value="90">90/10</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Validation Method</Label>
                          <Select defaultValue="kfold">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kfold">K-Fold</SelectItem>
                              <SelectItem value="holdout">Hold-out</SelectItem>
                              <SelectItem value="bootstrap">Bootstrap</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsConfigModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsConfigModalOpen(false)}>Save Configuration</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
            {isRetraining && (
              <div className="mt-4">
                <Progress value={trainingProgress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {performanceMetrics.map((metric) => (
          <Card key={metric.metric}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.metric}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.current}%</div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Target: {metric.target}%</span>
                <span className="text-green-600">{metric.trend}</span>
              </div>
              <Progress value={(metric.current / metric.target) * 100} className="mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Accuracy Over Versions */}
        <Card>
          <CardHeader>
            <CardTitle>Model Performance Evolution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={accuracyHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="version" />
                  <YAxis domain={[60, 100]} />
                  <Tooltip content={CustomTooltip} />
                  <Area
                    type="monotone"
                    dataKey="accuracy"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={3}
                  />
                  <Line
                    type="monotone"
                    dataKey="precision"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Line
                    type="monotone"
                    dataKey="recall"
                    stroke="hsl(var(--warning))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Model Comparison Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Model Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={accuracyHistory.slice(-3)}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="version" />
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
                  <Tooltip content={CustomTooltip} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Models */}
      <Card>
        <CardHeader>
          <CardTitle>All Models</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {models.map((model) => (
              <div key={model.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{model.name}</h3>
                    <p className="text-muted-foreground">{model.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(model.status)}
                    {model.status === "Training" && (
                      <div className="flex items-center gap-2">
                        <Progress value={65} className="w-20" />
                        <span className="text-sm">65%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Accuracy</div>
                    <div className="font-semibold">{model.accuracy}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Last Trained</div>
                    <div className="font-semibold">{model.lastTrained}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Training Time</div>
                    <div className="font-semibold">{model.trainingTime}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Features</div>
                    <div className="font-semibold">{model.features}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Memory</div>
                    <div className="font-semibold">{model.memoryUsage}GB</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">CPU Usage</div>
                    <div className="font-semibold">{model.cpuUsage}%</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {model.status === "Inactive" && (
                    <Button size="sm" onClick={() => handleModelAction(model.id, "activate")}>
                      <Play className="h-4 w-4 mr-2" />
                      Activate
                    </Button>
                  )}
                  {model.status === "Active" && (
                    <Button size="sm" variant="outline" onClick={() => handleModelAction(model.id, "deactivate")}>
                      <Pause className="h-4 w-4 mr-2" />
                      Deactivate
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetrain(model.id)}
                    disabled={isRetraining || model.status === "Training"}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retrain
                  </Button>
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                  <Button size="sm" variant="outline">
                    <Activity className="h-4 w-4 mr-2" />
                    View Logs
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  {model.status === "Error" && (
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Training History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Training History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Model</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Duration</th>
                  <th className="text-left p-2">Accuracy</th>
                  <th className="text-left p-2">Loss</th>
                  <th className="text-left p-2">Samples</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trainingHistory.map((training) => (
                  <tr key={training.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{training.model}</td>
                    <td className="p-2 text-muted-foreground">{training.date}</td>
                    <td className="p-2">{training.duration}</td>
                    <td className="p-2">{training.accuracy ? `${training.accuracy}%` : "N/A"}</td>
                    <td className="p-2">{training.loss ? training.loss.toFixed(3) : "N/A"}</td>
                    <td className="p-2">{training.samples.toLocaleString()}</td>
                    <td className="p-2">
                      <Badge
                        className={
                          training.status === "completed"
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }
                      >
                        {training.status}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
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
