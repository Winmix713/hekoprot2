"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Settings,
  Key,
  Download,
  Upload,
  Save,
  RefreshCw,
  Bell,
  Shield,
  Database,
  Activity,
  Trash2,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Model Configuration
    autoRetrain: true,
    retrainInterval: 24, // hours
    confidenceThreshold: 75, // percentage
    defaultModel: "randomforest",

    // API & Security
    apiKey: "sk-1234567890abcdef...",
    twoFactorAuth: false,
    apiLogging: true,

    // Notifications
    emailNotifications: true,
    trainingAlerts: true,
    accuracyWarnings: true,
    weeklyReports: false,
    emailAddress: "admin@example.com",

    // Data Management
    dataRetention: "1year",
    autoBackup: true,
    compressionEnabled: true,
  })

  const [apiKeys, setApiKeys] = useState({
    footballApi: "sk-1234567890abcdef",
    oddsApi: "odds-api-key-here",
    webhookUrl: "https://api.example.com/webhook",
  })

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleApiKeyChange = (key: string, value: string) => {
    setApiKeys((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = () => {
    // Save settings logic
    console.log("Settings saved:", settings)
    // You could add a toast notification here
    alert("Settings saved successfully!")
  }

  const handleExportData = (format: "json" | "csv") => {
    // Export data logic
    console.log(`Exporting data as ${format}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your prediction system settings</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="model">Model</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-retrain Models</Label>
                    <p className="text-sm text-muted-foreground">Automatically retrain models based on schedule</p>
                  </div>
                  <Switch
                    checked={settings.autoRetrain}
                    onCheckedChange={(checked) => handleSettingChange("autoRetrain", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retrainInterval">Retrain Interval (hours)</Label>
                  <Input
                    id="retrainInterval"
                    type="number"
                    value={settings.retrainInterval}
                    onChange={(e) => handleSettingChange("retrainInterval", Number.parseInt(e.target.value))}
                    className="w-32"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPredictions">Max Predictions per Day</Label>
                  <Input
                    id="maxPredictions"
                    type="number"
                    value={settings.maxPredictions}
                    onChange={(e) => handleSettingChange("maxPredictions", Number.parseInt(e.target.value))}
                    className="w-32"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiTimeout">API Timeout (seconds)</Label>
                  <Input
                    id="apiTimeout"
                    type="number"
                    value={settings.apiTimeout}
                    onChange={(e) => handleSettingChange("apiTimeout", Number.parseInt(e.target.value))}
                    className="w-32"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive alerts for model updates and predictions</p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => handleSettingChange("notifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Logging</Label>
                    <p className="text-sm text-muted-foreground">Log system activities and predictions</p>
                  </div>
                  <Switch
                    checked={settings.enableLogging}
                    onCheckedChange={(checked) => handleSettingChange("enableLogging", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Switch to dark theme</p>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => handleSettingChange("darkMode", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Model Settings */}
        <TabsContent value="model">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Model Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Minimum Prediction Confidence: {settings.confidenceThreshold}%</Label>
                <div className="px-2">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={settings.confidenceThreshold}
                    onChange={(e) => handleSettingChange("confidenceThreshold", Number.parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Predictions below this threshold will be marked as low confidence
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultModel">Default Prediction Model</Label>
                <Select
                  value={settings.defaultModel}
                  onValueChange={(value) => handleSettingChange("defaultModel", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="randomforest">Random Forest v2.1</SelectItem>
                    <SelectItem value="poisson">Poisson Regression v1.8</SelectItem>
                    <SelectItem value="elo">Elo Rating v3.0</SelectItem>
                    <SelectItem value="neural">Neural Network v1.2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Feature Selection</Label>
                <Textarea
                  id="features"
                  placeholder="Enter features separated by commas..."
                  className="min-h-[100px]"
                  defaultValue="team_form, head_to_head, home_advantage, player_injuries, weather_conditions, recent_transfers"
                />
                <p className="text-sm text-muted-foreground">
                  Comma-separated list of features to use in model training
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Key Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="footballApi">Football Data API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="footballApi"
                    type="password"
                    value={apiKeys.footballApi}
                    onChange={(e) => handleApiKeyChange("footballApi", e.target.value)}
                    placeholder="Enter your football API key"
                  />
                  <Button variant="outline" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="oddsApi">Odds API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="oddsApi"
                    type="password"
                    value={apiKeys.oddsApi}
                    onChange={(e) => handleApiKeyChange("oddsApi", e.target.value)}
                    placeholder="Enter your odds API key"
                  />
                  <Button variant="outline" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={apiKeys.webhookUrl}
                  onChange={(e) => handleApiKeyChange("webhookUrl", e.target.value)}
                  placeholder="https://your-webhook-url.com"
                />
                <p className="text-sm text-muted-foreground">URL to receive prediction notifications</p>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full bg-transparent">
                  <Shield className="h-4 w-4 mr-2" />
                  Test API Connections
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export/Import */}
        <TabsContent value="export">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleExportData("json")}
                    className="h-20 flex flex-col gap-2"
                  >
                    <Database className="h-6 w-6" />
                    Export as JSON
                    <span className="text-xs text-muted-foreground">Complete data with metadata</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExportData("csv")}
                    className="h-20 flex flex-col gap-2"
                  >
                    <Download className="h-6 w-6" />
                    Export as CSV
                    <span className="text-xs text-muted-foreground">Spreadsheet compatible format</span>
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Export Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="includeMatches" defaultChecked />
                      <Label htmlFor="includeMatches">Include match data</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="includePredictions" defaultChecked />
                      <Label htmlFor="includePredictions">Include predictions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="includeModels" />
                      <Label htmlFor="includeModels">Include model configurations</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="includeLogs" />
                      <Label htmlFor="includeLogs">Include system logs</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium">Drop files here or click to browse</p>
                  <p className="text-sm text-muted-foreground">Supports JSON and CSV files up to 10MB</p>
                  <Button variant="outline" className="mt-4 bg-transparent">
                    Choose Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="account">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="2fa">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Enable 2FA for enhanced security</p>
                  </div>
                  <Switch
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => handleSettingChange("twoFactorAuth", checked)}
                    id="2fa"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="api-logs">API Logging</Label>
                    <p className="text-sm text-muted-foreground">Log all API requests for auditing</p>
                  </div>
                  <Switch
                    checked={settings.apiLogging}
                    onCheckedChange={(checked) => handleSettingChange("apiLogging", checked)}
                    id="api-logs"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive updates and alerts via email</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                    id="email-notifications"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="training-alerts">Training Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when model training completes</p>
                  </div>
                  <Switch
                    checked={settings.trainingAlerts}
                    onCheckedChange={(checked) => handleSettingChange("trainingAlerts", checked)}
                    id="training-alerts"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="accuracy-alerts">Accuracy Warnings</Label>
                    <p className="text-sm text-muted-foreground">Receive warnings for low prediction accuracy</p>
                  </div>
                  <Switch
                    checked={settings.accuracyWarnings}
                    onCheckedChange={(checked) => handleSettingChange("accuracyWarnings", checked)}
                    id="accuracy-alerts"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-reports">Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">Receive weekly performance reports</p>
                  </div>
                  <Switch
                    checked={settings.weeklyReports}
                    onCheckedChange={(checked) => handleSettingChange("weeklyReports", checked)}
                    id="weekly-reports"
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    type="email"
                    id="email"
                    placeholder="admin@example.com"
                    value={settings.emailAddress}
                    onChange={(e) => handleSettingChange("emailAddress", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="dataRetention">Data Retention Policy</Label>
                  <Select
                    value={settings.dataRetention}
                    onValueChange={(value) => handleSettingChange("dataRetention", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6months">6 Months</SelectItem>
                      <SelectItem value="1year">1 Year</SelectItem>
                      <SelectItem value="2years">2 Years</SelectItem>
                      <SelectItem value="5years">5 Years</SelectItem>
                      <SelectItem value="forever">Forever</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-backup">Automatic Backups</Label>
                    <p className="text-sm text-muted-foreground">Schedule daily backups of your data</p>
                  </div>
                  <Switch
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => handleSettingChange("autoBackup", checked)}
                    id="auto-backup"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="compression">Enable Compression</Label>
                    <p className="text-sm text-muted-foreground">Compress data to reduce storage space</p>
                  </div>
                  <Switch
                    checked={settings.compressionEnabled}
                    onCheckedChange={(checked) => handleSettingChange("compressionEnabled", checked)}
                    id="compression"
                  />
                </div>
              </CardContent>
            </Card>

            {/* System Performance Card */}
            <Card className="bg-gradient-card border-0 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  System Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-backup">Automatic Backups</Label>
                      <p className="text-xs text-muted-foreground">Automatically backup data and models</p>
                    </div>
                    <Switch
                      checked={settings.autoBackup}
                      onCheckedChange={(checked) => handleSettingChange("autoBackup", checked)}
                      id="auto-backup"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="compression">Data Compression</Label>
                      <p className="text-xs text-muted-foreground">Compress stored data to save space</p>
                    </div>
                    <Switch
                      checked={settings.compressionEnabled}
                      onCheckedChange={(checked) => handleSettingChange("compressionEnabled", checked)}
                      id="compression"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Cache Settings</Label>
                  <p className="text-xs text-muted-foreground mb-3">Manage system cache and temporary files</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Clear Cache
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear Logs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} className="w-32">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}
