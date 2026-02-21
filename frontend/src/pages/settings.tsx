import { useState, useEffect } from "react"
import {
  Settings,
  Calendar,
  Target,
  Palette,
  Sparkles,
  Loader2,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { cn, formatDate } from "@/lib/utils"
import { useAppStore } from "@/stores/app-store"
import api from "@/lib/api"
import type { Sprint, Quarter, QuarterCreate, SprintCreate } from "@/types"

export function SettingsPage() {
  const { currentYear, setCurrentYear, theme, toggleTheme, addNotification } = useAppStore()
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [quarters, setQuarters] = useState<Quarter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [generateYear, setGenerateYear] = useState(currentYear)
  const [generateStartDate, setGenerateStartDate] = useState(`${currentYear}-01-01`)
  
  // Sprint editing states
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null)
  const [sprintForm, setSprintForm] = useState<SprintCreate>({
    name: "",
    quarter_id: undefined,
    start_date: "",
    end_date: "",
    status: "planned",
    goal: "",
    working_days: 10,
  })
  const [showSprintDialog, setShowSprintDialog] = useState(false)
  const [showDeleteSprintDialog, setShowDeleteSprintDialog] = useState(false)
  const [sprintToDelete, setSprintToDelete] = useState<Sprint | null>(null)
  
  // Quarter editing states
  const [editingQuarter, setEditingQuarter] = useState<Quarter | null>(null)
  const [quarterForm, setQuarterForm] = useState<QuarterCreate>({
    name: "",
    start_date: "",
    end_date: "",
    year: currentYear,
  })
  const [showQuarterDialog, setShowQuarterDialog] = useState(false)
  const [showDeleteQuarterDialog, setShowDeleteQuarterDialog] = useState(false)
  const [quarterToDelete, setQuarterToDelete] = useState<Quarter | null>(null)
  
  // Jira sync states
  const [jiraCookie, setJiraCookie] = useState("")
  const [jiraRapidViewId, setJiraRapidViewId] = useState(27928)
  const [jiraQuickFilterId, setJiraQuickFilterId] = useState(399097)
  const [jiraProjectKey, setJiraProjectKey] = useState("SECENGDEV")
  const [jiraSyncYear, setJiraSyncYear] = useState(currentYear)
  const [jiraSyncQuarter, setJiraSyncQuarter] = useState<string>("")
  const [jiraSyncSprint, setJiraSyncSprint] = useState<string>("")
  const [isSyncing, setIsSyncing] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [syncResult, setSyncResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  useEffect(() => {
    loadData()
  }, [currentYear])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [sprintList, quarterList] = await Promise.all([
        api.getSprints({ year: currentYear }),
        api.getQuarters(currentYear),
      ])
      setSprints(sprintList)
      setQuarters(quarterList)
    } catch (error) {
      console.error("Failed to load settings:", error)
      addNotification("error", "Failed to load settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateSprints = async () => {
    setIsSaving(true)
    try {
      const newSprints = await api.generateSprints(generateYear, generateStartDate)
      addNotification("success", `Generated ${newSprints.length} sprints for ${generateYear}`)
      setShowGenerateDialog(false)
      loadData()
    } catch (error: any) {
      addNotification("error", `Failed to generate sprints: ${error.message || 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const openSprintDialog = (sprint?: Sprint) => {
    if (sprint) {
      setEditingSprint(sprint)
      setSprintForm({
        name: sprint.name,
        quarter_id: sprint.quarter_id,
        start_date: sprint.start_date,
        end_date: sprint.end_date,
        status: sprint.status,
        goal: sprint.goal || "",
        working_days: sprint.working_days,
      })
    } else {
      setEditingSprint(null)
      setSprintForm({
        name: "",
        quarter_id: undefined,
        start_date: "",
        end_date: "",
        status: "planned",
        goal: "",
        working_days: 10,
      })
    }
    setShowSprintDialog(true)
  }

  const handleSaveSprint = async () => {
    setIsSaving(true)
    try {
      if (editingSprint) {
        await api.updateSprint(editingSprint.id, sprintForm)
        addNotification("success", "Sprint updated successfully")
      } else {
        await api.createSprint(sprintForm)
        addNotification("success", "Sprint created successfully")
      }
      setShowSprintDialog(false)
      loadData()
    } catch (error) {
      addNotification("error", editingSprint ? "Failed to update sprint" : "Failed to create sprint")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSprint = async () => {
    if (!sprintToDelete) return
    setIsSaving(true)
    try {
      await api.deleteSprint(sprintToDelete.id)
      addNotification("success", "Sprint deleted successfully")
      setShowDeleteSprintDialog(false)
      setSprintToDelete(null)
      loadData()
    } catch (error) {
      addNotification("error", "Failed to delete sprint")
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerateQuarters = async () => {
    setIsSaving(true)
    try {
      const newQuarters = await api.generateQuarters(currentYear)
      addNotification("success", `Generated ${newQuarters.length} quarters for ${currentYear}`)
      loadData()
    } catch (error) {
      addNotification("error", "Failed to generate quarters")
    } finally {
      setIsSaving(false)
    }
  }

  const openQuarterDialog = (quarter?: Quarter) => {
    if (quarter) {
      setEditingQuarter(quarter)
      setQuarterForm({
        name: quarter.name,
        start_date: quarter.start_date,
        end_date: quarter.end_date,
        year: quarter.year,
      })
    } else {
      setEditingQuarter(null)
      setQuarterForm({
        name: "",
        start_date: "",
        end_date: "",
        year: currentYear,
      })
    }
    setShowQuarterDialog(true)
  }

  const handleSaveQuarter = async () => {
    setIsSaving(true)
    try {
      if (editingQuarter) {
        await api.updateQuarter(editingQuarter.id, quarterForm)
        addNotification("success", "Quarter updated successfully")
      } else {
        await api.createQuarter(quarterForm)
        addNotification("success", "Quarter created successfully")
      }
      setShowQuarterDialog(false)
      loadData()
    } catch (error) {
      addNotification("error", editingQuarter ? "Failed to update quarter" : "Failed to create quarter")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteQuarter = async () => {
    if (!quarterToDelete) return
    setIsSaving(true)
    try {
      await api.deleteQuarter(quarterToDelete.id)
      addNotification("success", "Quarter deleted successfully")
      setShowDeleteQuarterDialog(false)
      setQuarterToDelete(null)
      loadData()
    } catch (error) {
      addNotification("error", "Failed to delete quarter")
    } finally {
      setIsSaving(false)
    }
  }

  const getSprintStatus = (sprint: Sprint) => {
    const now = new Date()
    const start = new Date(sprint.start_date)
    const end = new Date(sprint.end_date)

    if (now < start) return "upcoming"
    if (now > end) return "completed"
    return "active"
  }

  const handleTestJiraConnection = async () => {
    if (!jiraCookie.trim()) {
      addNotification("error", "Please provide a Jira cookie")
      return
    }
    
    setIsTestingConnection(true)
    setSyncResult(null)
    
    try {
      const result = await api.testJiraConnection(jiraCookie, jiraRapidViewId)
      setSyncResult({
        success: true,
        message: `✅ Connected! Found ${result.total_issues} issues on board ${result.board_id}`,
      })
      addNotification("success", "Jira connection successful")
    } catch (error: any) {
      setSyncResult({
        success: false,
        message: `❌ Connection failed: ${error.message}`,
      })
      addNotification("error", "Failed to connect to Jira")
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleSyncJiraTasks = async () => {
    if (!jiraCookie.trim()) {
      addNotification("error", "Please provide a Jira cookie")
      return
    }
    
    if (!jiraSyncQuarter || !jiraSyncSprint) {
      addNotification("error", "Please select both Quarter and Sprint for task assignment")
      return
    }
    
    setIsSyncing(true)
    setSyncResult(null)
    
    try {
      const result = await api.syncJiraTasks({
        cookie: jiraCookie,
        rapid_view_id: jiraRapidViewId,
        quick_filter_id: jiraQuickFilterId,
        selected_project_key: jiraProjectKey,
        year: jiraSyncYear,
        quarter_id: jiraSyncQuarter || undefined,
        sprint_id: jiraSyncSprint || undefined,
      })
      
      setSyncResult({
        success: result.success,
        message: `${result.message}\n\nGo to Planned Tasks page to view synced tasks.`,
        details: result.results,
      })
      
      addNotification("success", `${result.message} - View them in Planned Tasks page`)
      
      // Clear cookie for security
      setJiraCookie("")
    } catch (error: any) {
      setSyncResult({
        success: false,
        message: `Sync failed: ${error.message}`,
      })
      addNotification("error", "Failed to sync Jira tasks")
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Settings
        </h2>
        <p className="text-muted-foreground">Configure your workspace</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">
            <Palette className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="sprints">
            <Target className="mr-2 h-4 w-4" />
            Sprints
          </TabsTrigger>
          <TabsTrigger value="quarters">
            <Calendar className="mr-2 h-4 w-4" />
            Quarters
          </TabsTrigger>
          <TabsTrigger value="jira">
            <ExternalLink className="mr-2 h-4 w-4" />
            Jira Integration
          </TabsTrigger>
        </TabsList>

        {/* General settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    Switch between dark and light mode
                  </p>
                </div>
                <Button variant="outline" onClick={toggleTheme}>
                  {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fiscal Year</CardTitle>
              <CardDescription>Set your current working year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select
                  value={currentYear.toString()}
                  onValueChange={(v) => setCurrentYear(parseInt(v))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Current fiscal year for filtering and reports
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Configuration
              </CardTitle>
              <CardDescription>Configure AI features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">AI Model</p>
                    <p className="text-sm text-muted-foreground">
                      Ollama gpt-oss:20b
                    </p>
                  </div>
                  <Badge variant="success">Connected</Badge>
                </div>
                <Separator />
                <div className="text-sm text-muted-foreground">
                  AI is used for generating summaries, insights, and powering the chat assistant.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sprints settings */}
        <TabsContent value="sprints" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sprint Management</CardTitle>
                  <CardDescription>
                    Configure and manage sprints - customize duration and dates for your workflow
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openSprintDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Sprint
                  </Button>
                  <Button onClick={() => setShowGenerateDialog(true)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Auto-Generate
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : sprints.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No sprints configured</h3>
                  <p className="text-muted-foreground mb-4">
                    Add custom sprints or auto-generate standard 2-week sprints
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => openSprintDialog()}>
                      Add Custom Sprint
                    </Button>
                    <Button onClick={() => setShowGenerateDialog(true)}>
                      Auto-Generate
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {sprints.map((sprint) => {
                    const status = getSprintStatus(sprint)
                    return (
                      <div
                        key={sprint.id}
                        className={cn(
                          "group flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-md",
                          status === "active" && "border-primary bg-primary/5 ring-1 ring-primary/20"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Target
                            className={cn(
                              "h-4 w-4",
                              status === "active" && "text-primary"
                            )}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{sprint.name}</p>
                              {sprint.quarter_id && (
                                <Badge variant="outline" className="text-xs">
                                  {quarters.find(q => q.id === sprint.quarter_id)?.name || "Q?"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}
                              <span className="ml-2 text-xs">({sprint.working_days} working days)</span>
                            </p>
                            {sprint.goal && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                Goal: {sprint.goal}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openSprintDialog(sprint)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setSprintToDelete(sprint)
                                setShowDeleteSprintDialog(true)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <Badge
                            variant={
                              status === "active"
                                ? "success"
                                : status === "completed"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {status}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quarters settings */}
        <TabsContent value="quarters" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quarter Management</CardTitle>
                  <CardDescription>
                    Configure fiscal quarters - customize based on your organization's fiscal year
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openQuarterDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Quarter
                  </Button>
                  <Button onClick={handleGenerateQuarters} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Auto-Generate
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : quarters.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No quarters configured</h3>
                  <p className="text-muted-foreground mb-4">
                    Add custom quarters or auto-generate standard quarters
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => openQuarterDialog()}>
                      Add Custom Quarter
                    </Button>
                    <Button onClick={handleGenerateQuarters}>Auto-Generate</Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {quarters.map((quarter) => {
                    const now = new Date()
                    const start = new Date(quarter.start_date)
                    const end = new Date(quarter.end_date)
                    const isActive = now >= start && now <= end

                    return (
                      <Card
                        key={quarter.id}
                        className={cn(
                          "group relative overflow-hidden transition-all hover:shadow-lg",
                          isActive && "border-primary ring-1 ring-primary/20"
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{quarter.name}</h4>
                            {isActive && <Badge variant="success">Active</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {formatDate(quarter.start_date)} - {formatDate(quarter.end_date)}
                          </p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openQuarterDialog(quarter)}
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setQuarterToDelete(quarter)
                                setShowDeleteQuarterDialog(true)
                              }}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jira Integration settings */}
        <TabsContent value="jira" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Jira Task Sync
              </CardTitle>
              <CardDescription>
                Sync your assigned Jira tasks automatically to avoid manual entry. Your cookie is never stored.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Configuration inputs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Jira Cookie (Required)</label>
                  <Input
                    type="password"
                    placeholder="Paste your Jira authentication cookie here"
                    value={jiraCookie}
                    onChange={(e) => setJiraCookie(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get this from your browser's Developer Tools → Network tab → Any Jira request → Copy 'Cookie' header
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">RapidView ID</label>
                    <Input
                      type="number"
                      value={jiraRapidViewId}
                      onChange={(e) => setJiraRapidViewId(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quick Filter ID</label>
                    <Input
                      type="number"
                      value={jiraQuickFilterId}
                      onChange={(e) => setJiraQuickFilterId(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Project Key</label>
                    <Input
                      type="text"
                      value={jiraProjectKey}
                      onChange={(e) => setJiraProjectKey(e.target.value)}
                      placeholder="SECENGDEV"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sync Year</label>
                    <Input
                      type="number"
                      value={jiraSyncYear}
                      onChange={(e) => setJiraSyncYear(parseInt(e.target.value) || currentYear)}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <h4 className="font-medium">Task Assignment (Required)</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Synced tasks will be assigned to the selected Quarter → Sprint hierarchy
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Quarter *</label>
                      <Select
                        value={jiraSyncQuarter}
                        onValueChange={setJiraSyncQuarter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select quarter" />
                        </SelectTrigger>
                        <SelectContent>
                          {quarters.map((q) => (
                            <SelectItem key={q.id} value={q.id}>
                              {q.name} ({q.year})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sprint *</label>
                      <Select
                        value={jiraSyncSprint}
                        onValueChange={setJiraSyncSprint}
                        disabled={!jiraSyncQuarter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sprint" />
                        </SelectTrigger>
                        <SelectContent>
                          {sprints
                            .filter((s) => s.quarter_id === jiraSyncQuarter)
                            .map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {jiraSyncQuarter && jiraSyncSprint && (
                    <div className="rounded-lg bg-primary/10 p-3 text-sm">
                      <p className="font-medium text-primary">Selected Assignment</p>
                      <p className="text-muted-foreground mt-1">
                        Tasks will be assigned to:{" "}
                        <strong>
                          {quarters.find((q) => q.id === jiraSyncQuarter)?.name} → {sprints.find((s) => s.id === jiraSyncSprint)?.name}
                        </strong>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleTestJiraConnection}
                  disabled={!jiraCookie.trim() || isTestingConnection}
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSyncJiraTasks}
                  disabled={!jiraCookie.trim() || isSyncing}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Tasks Now
                    </>
                  )}
                </Button>
              </div>

              {/* Sync result */}
              {syncResult && (
                <div
                  className={cn(
                    "rounded-lg p-4",
                    syncResult.success
                      ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {syncResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={cn(
                        "font-medium",
                        syncResult.success ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100"
                      )}>
                        {syncResult.message}
                      </p>
                      {syncResult.details && (
                        <div className="mt-2 text-sm space-y-1">
                          <p>• Created: {syncResult.details.created} tasks</p>
                          <p>• Updated: {syncResult.details.updated} tasks</p>
                          <p>• Skipped: {syncResult.details.skipped} tasks</p>
                          {syncResult.details.errors && syncResult.details.errors.length > 0 && (
                            <details className="mt-2">
                              <summary className="cursor-pointer font-medium">
                                View {syncResult.details.errors.length} errors
                              </summary>
                              <ul className="mt-2 ml-4 space-y-1 list-disc">
                                {syncResult.details.errors.slice(0, 5).map((error: string, idx: number) => (
                                  <li key={idx} className="text-xs">{error}</li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Information */}
              <Separator />
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  How it works
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">1.</span>
                    <span>Fetches your assigned Jira tasks using your Quick Filter ID</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">2.</span>
                    <span>Maps Jira fields to Planned Tasks (title, story points, status, etc.)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">3.</span>
                    <span>Matches or creates sprints based on Jira sprint data</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">4.</span>
                    <span>Prevents duplicates using Jira issue keys (e.g., SECENGDEV-9562)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">5.</span>
                    <span>Updates existing tasks if they were previously synced</span>
                  </li>
                </ul>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">🔒 Security</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Your Jira cookie is <strong>never stored</strong> - only used for this request</li>
                    <li>• Cookie is cleared immediately after sync completes</li>
                    <li>• All communication happens over HTTPS</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate sprints dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Sprints</DialogTitle>
            <DialogDescription>
              Auto-generate 26 sprints (2-week periods) for the selected year
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <Input
                  type="number"
                  min="2020"
                  max="2100"
                  value={generateYear}
                  onChange={(e) => {
                    const year = parseInt(e.target.value)
                    setGenerateYear(year)
                    setGenerateStartDate(`${year}-01-01`)
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={generateStartDate}
                  onChange={(e) => setGenerateStartDate(e.target.value)}
                />
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <p><strong>ℹ️ Generation Details:</strong></p>
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Creates 26 two-week sprints for the year</li>
                <li>Each sprint has 10 working days + 4 weekend days</li>
                <li>Sprints are automatically assigned to quarters</li>
                <li>First sprint starts on the selected date</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateSprints} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quarter edit/create dialog */}
      <Dialog open={showQuarterDialog} onOpenChange={setShowQuarterDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingQuarter ? "Edit Quarter" : "Add New Quarter"}
            </DialogTitle>
            <DialogDescription>
              {editingQuarter
                ? "Update the quarter details to match your organization's fiscal calendar"
                : "Create a custom quarter for your organization's fiscal year"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quarter Name</label>
              <Input
                placeholder="e.g., Q1, Q2, Q3, Q4"
                value={quarterForm.name}
                onChange={(e) =>
                  setQuarterForm({ ...quarterForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={quarterForm.start_date}
                  onChange={(e) =>
                    setQuarterForm({ ...quarterForm, start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={quarterForm.end_date}
                  onChange={(e) =>
                    setQuarterForm({ ...quarterForm, end_date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Input
                type="number"
                min="2020"
                max="2100"
                value={quarterForm.year}
                onChange={(e) =>
                  setQuarterForm({ ...quarterForm, year: parseInt(e.target.value) })
                }
              />
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">💡 Tip</p>
              <p>
                Different organizations have different fiscal years. For example:
              </p>
              <ul className="mt-1 ml-4 list-disc space-y-1">
                <li>Calendar year: Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec</li>
                <li>Apr fiscal year: Apr-Jun, Jul-Sep, Oct-Dec, Jan-Mar</li>
                <li>Jul fiscal year: Jul-Sep, Oct-Dec, Jan-Mar, Apr-Jun</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuarterDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveQuarter}
              disabled={isSaving || !quarterForm.name || !quarterForm.start_date || !quarterForm.end_date}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                editingQuarter ? "Update Quarter" : "Create Quarter"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete quarter confirmation dialog */}
      <Dialog open={showDeleteQuarterDialog} onOpenChange={setShowDeleteQuarterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quarter</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{quarterToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteQuarterDialog(false)
                setQuarterToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteQuarter} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sprint edit/create dialog */}
      <Dialog open={showSprintDialog} onOpenChange={setShowSprintDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSprint ? "Edit Sprint" : "Add New Sprint"}
            </DialogTitle>
            <DialogDescription>
              {editingSprint
                ? "Update the sprint details to match your project timeline"
                : "Create a custom sprint for your project. Sprints belong to quarters."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sprint Name</label>
                <Input
                  placeholder="e.g., Sprint 1"
                  value={sprintForm.name}
                  onChange={(e) =>
                    setSprintForm({ ...sprintForm, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quarter *</label>
                <Select
                  value={sprintForm.quarter_id || "_none"}
                  onValueChange={(v) => setSprintForm({ ...sprintForm, quarter_id: v === "_none" ? undefined : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select quarter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No Quarter</SelectItem>
                    {quarters.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.name} ({q.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={sprintForm.start_date}
                  onChange={(e) =>
                    setSprintForm({ ...sprintForm, start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={sprintForm.end_date}
                  onChange={(e) =>
                    setSprintForm({ ...sprintForm, end_date: e.target.value })
                  }
                />
              </div>
            </div>
            {sprintForm.quarter_id && quarters.find(q => q.id === sprintForm.quarter_id) && (
              <div className="rounded-lg bg-primary/10 p-3 text-sm">
                <p className="font-medium text-primary">Selected Quarter Range</p>
                <p className="text-muted-foreground">
                  {formatDate(quarters.find(q => q.id === sprintForm.quarter_id)!.start_date)} - {formatDate(quarters.find(q => q.id === sprintForm.quarter_id)!.end_date)}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Working Days</label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={sprintForm.working_days}
                  onChange={(e) =>
                    setSprintForm({ ...sprintForm, working_days: parseInt(e.target.value) || 10 })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={sprintForm.status}
                  onValueChange={(v) => setSprintForm({ ...sprintForm, status: v as Sprint["status"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sprint Goal (Optional)</label>
              <Input
                placeholder="What do you want to achieve in this sprint?"
                value={sprintForm.goal || ""}
                onChange={(e) =>
                  setSprintForm({ ...sprintForm, goal: e.target.value })
                }
              />
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">💡 Hierarchy: FY → Quarter → Sprint</p>
              <p className="mb-2">
                Sprints belong to quarters. Ensure sprint dates fall within the selected quarter's range.
              </p>
              <p>Common sprint durations:</p>
              <ul className="mt-1 ml-4 list-disc space-y-1">
                <li>2 weeks (10 working days) - most common</li>
                <li>1 week (5 working days) - for fast iterations</li>
                <li>3 weeks (15 working days) - for larger projects</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSprintDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveSprint}
              disabled={isSaving || !sprintForm.name || !sprintForm.start_date || !sprintForm.end_date}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                editingSprint ? "Update Sprint" : "Create Sprint"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete sprint confirmation dialog */}
      <Dialog open={showDeleteSprintDialog} onOpenChange={setShowDeleteSprintDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sprint</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{sprintToDelete?.name}"? This action cannot be undone.
              Any tasks associated with this sprint will need to be reassigned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteSprintDialog(false)
                setSprintToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSprint} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
