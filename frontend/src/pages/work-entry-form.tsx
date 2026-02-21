import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Save, Loader2, Plus, X, AlertCircle, CheckCircle2, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAppStore } from "@/stores/app-store"
import api from "@/lib/api"
import { cn, formatDate } from "@/lib/utils"
import type { WorkEntryCreate, WorkEntryUpdate, Sprint, Quarter } from "@/types"

const CATEGORIES = [
  "Development",
  "Meeting",
  "Documentation",
  "Planning",
  "Review",
  "Bug Fix",
  "Research",
  "Other",
]

const PRIORITIES = ["low", "medium", "high", "critical"] as const
const STATUSES = ["in_progress", "completed", "on_hold"] as const

interface FormErrors {
  title?: string
  description?: string
  date?: string
  quarter?: string
  sprint?: string
  time_spent?: string
  category?: string
}

export function WorkEntryFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addNotification, currentYear } = useAppStore()
  const isEdit = !!id

  // Form state
  const [formData, setFormData] = useState<WorkEntryCreate>({
    title: "",
    description: "",
    date: searchParams.get("date") || new Date().toISOString().split("T")[0],
    category: "",
    tags: [],
    time_spent: undefined,
    priority: "medium",
    status: "completed",
    notes: "",
  })
  
  // Hierarchy state: Quarter → Sprint → Date
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>("")
  const [quarters, setQuarters] = useState<Quarter[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  
  // UI state
  const [tagInput, setTagInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Filter sprints by selected quarter
  const filteredSprints = useMemo(() => {
    if (!selectedQuarterId) return []
    return sprints.filter(s => s.quarter_id === selectedQuarterId)
  }, [sprints, selectedQuarterId])

  // Get selected sprint details
  const selectedSprint = useMemo(() => {
    if (!formData.sprint_id) return null
    return sprints.find(s => s.id === formData.sprint_id)
  }, [sprints, formData.sprint_id])

  // Get selected quarter details
  const selectedQuarter = useMemo(() => {
    if (!selectedQuarterId) return null
    return quarters.find(q => q.id === selectedQuarterId)
  }, [quarters, selectedQuarterId])

  // Calculate valid date range based on sprint
  const dateConstraints = useMemo(() => {
    if (selectedSprint) {
      return {
        min: selectedSprint.start_date,
        max: selectedSprint.end_date,
        label: `${formatDate(selectedSprint.start_date)} - ${formatDate(selectedSprint.end_date)}`,
      }
    }
    if (selectedQuarter) {
      return {
        min: selectedQuarter.start_date,
        max: selectedQuarter.end_date,
        label: `${formatDate(selectedQuarter.start_date)} - ${formatDate(selectedQuarter.end_date)}`,
      }
    }
    return null
  }, [selectedSprint, selectedQuarter])

  useEffect(() => {
    loadData()
  }, [id, currentYear])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [quarterList, sprintList] = await Promise.all([
        api.getQuarters(currentYear),
        api.getSprints({ year: currentYear }),
      ])
      setQuarters(quarterList || [])
      setSprints(sprintList || [])

      if (isEdit) {
        const entry = await api.getWorkEntry(id)
        setFormData({
          title: entry.title,
          description: entry.description,
          date: entry.date,
          category: entry.category || "",
          tags: entry.tags || [],
          time_spent: entry.time_spent,
          priority: entry.priority || "medium",
          status: entry.status || "completed",
          sprint_id: entry.sprint_id,
          notes: entry.notes || "",
        })
        
        // Set quarter based on sprint
        if (entry.sprint_id) {
          const sprint = sprintList?.find((s: Sprint) => s.id === entry.sprint_id)
          if (sprint?.quarter_id) {
            setSelectedQuarterId(sprint.quarter_id)
          }
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error)
      addNotification("error", "Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  // Validation functions
  const validateField = (field: string, value: any): string | undefined => {
    switch (field) {
      case "title":
        if (!value || !value.trim()) return "Title is required"
        if (value.trim().length < 3) return "Title must be at least 3 characters"
        if (value.trim().length > 255) return "Title must be less than 255 characters"
        return undefined
        
      case "description":
        if (!value || !value.trim()) return "Description is required"
        if (value.trim().length < 10) return "Description must be at least 10 characters"
        return undefined
        
      case "date":
        if (!value) return "Date is required"
        if (dateConstraints) {
          const date = new Date(value)
          const minDate = new Date(dateConstraints.min)
          const maxDate = new Date(dateConstraints.max)
          if (date < minDate || date > maxDate) {
            return `Date must be within ${dateConstraints.label}`
          }
        }
        return undefined
        
      case "quarter":
        // Quarter is optional but recommended
        return undefined
        
      case "sprint":
        // Sprint is optional but if selected, validate date is within sprint
        return undefined
        
      case "time_spent":
        if (value !== undefined && value !== null && value !== "") {
          const num = parseInt(value)
          if (isNaN(num) || num < 0) return "Time spent must be a positive number"
          if (num > 1440) return "Time spent cannot exceed 24 hours (1440 minutes)"
        }
        return undefined
        
      case "category":
        // Category is optional
        return undefined
        
      default:
        return undefined
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      title: validateField("title", formData.title),
      description: validateField("description", formData.description),
      date: validateField("date", formData.date),
      time_spent: validateField("time_spent", formData.time_spent),
    }
    
    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== undefined)
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: error }))
    }
  }

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, (formData as any)[field])
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const handleQuarterChange = (quarterId: string) => {
    setSelectedQuarterId(quarterId === "_none" ? "" : quarterId)
    // Reset sprint when quarter changes
    setFormData(prev => ({ ...prev, sprint_id: undefined }))
    
    // If a quarter is selected, validate current date against it
    if (quarterId && quarterId !== "_none") {
      const quarter = quarters.find(q => q.id === quarterId)
      if (quarter && formData.date) {
        const date = new Date(formData.date)
        const startDate = new Date(quarter.start_date)
        const endDate = new Date(quarter.end_date)
        if (date < startDate || date > endDate) {
          // Reset date if it's outside the quarter
          setFormData(prev => ({ ...prev, date: quarter.start_date }))
        }
      }
    }
  }

  const handleSprintChange = (sprintId: string) => {
    const newSprintId = sprintId === "_none" ? undefined : sprintId
    setFormData(prev => ({ ...prev, sprint_id: newSprintId }))
    
    // If a sprint is selected, validate and adjust the date
    if (newSprintId) {
      const sprint = sprints.find(s => s.id === newSprintId)
      if (sprint && formData.date) {
        const date = new Date(formData.date)
        const startDate = new Date(sprint.start_date)
        const endDate = new Date(sprint.end_date)
        if (date < startDate || date > endDate) {
          // Reset date to sprint start if current date is outside sprint
          setFormData(prev => ({ ...prev, date: sprint.start_date }))
        }
      }
    }
    
    // Revalidate date
    if (touched.date) {
      setTimeout(() => {
        const error = validateField("date", formData.date)
        setErrors(prev => ({ ...prev, date: error }))
      }, 0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouched({
      title: true,
      description: true,
      date: true,
      time_spent: true,
      category: true,
    })

    if (!validateForm()) {
      addNotification("error", "Please fix the validation errors")
      return
    }

    setIsSaving(true)
    try {
      if (isEdit) {
        await api.updateWorkEntry(id, formData as WorkEntryUpdate)
        addNotification("success", "Work entry updated successfully")
      } else {
        await api.createWorkEntry(formData)
        addNotification("success", "Work entry created successfully")
      }
      navigate("/work")
    } catch (error: any) {
      const message = error.response?.data?.detail || `Failed to ${isEdit ? "update" : "create"} work entry`
      addNotification("error", message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags?.includes(tag)) {
      if (tag.length > 30) {
        addNotification("error", "Tag must be less than 30 characters")
        return
      }
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }))
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || [],
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">
            {isEdit ? "Edit Work Entry" : "New Work Entry"}
          </h2>
          <p className="text-muted-foreground">
            {isEdit ? "Update your work log" : "Log your daily work - Select Quarter → Sprint → Date"}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Step 1: Time Context - Quarter, Sprint, Date */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">1</span>
              Time Context
            </CardTitle>
            <CardDescription>
              Select when this work was done (Quarter → Sprint → Date)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quarter Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Quarter
                <span className="text-xs text-muted-foreground">(Recommended)</span>
              </label>
              <Select
                value={selectedQuarterId || "_none"}
                onValueChange={handleQuarterChange}
              >
                <SelectTrigger className={cn(selectedQuarterId && "border-primary/50")}>
                  <SelectValue placeholder="Select quarter first" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">
                    <span className="text-muted-foreground">No quarter selected</span>
                  </SelectItem>
                  {quarters.map((quarter) => (
                    <SelectItem key={quarter.id} value={quarter.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{quarter.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatDate(quarter.start_date)} - {formatDate(quarter.end_date)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedQuarter && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  {selectedQuarter.name} ({selectedQuarter.year}): {formatDate(selectedQuarter.start_date)} - {formatDate(selectedQuarter.end_date)}
                </p>
              )}
            </div>

            {/* Sprint Selection - Only show if quarter is selected */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Sprint
                {!selectedQuarterId && (
                  <span className="text-xs text-warning">(Select quarter first)</span>
                )}
              </label>
              <Select
                value={formData.sprint_id || "_none"}
                onValueChange={handleSprintChange}
                disabled={!selectedQuarterId}
              >
                <SelectTrigger className={cn(
                  !selectedQuarterId && "opacity-50",
                  formData.sprint_id && "border-primary/50"
                )}>
                  <SelectValue placeholder={selectedQuarterId ? "Select sprint" : "Select quarter first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">
                    <span className="text-muted-foreground">No sprint</span>
                  </SelectItem>
                  {filteredSprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{sprint.name}</span>
                        <Badge variant={sprint.status === "active" ? "success" : "outline"} className="text-xs">
                          {sprint.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ({formatDate(sprint.start_date)} - {formatDate(sprint.end_date)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                  {filteredSprints.length === 0 && selectedQuarterId && (
                    <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                      No sprints in this quarter
                    </div>
                  )}
                </SelectContent>
              </Select>
              {selectedSprint && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  {selectedSprint.name}: {formatDate(selectedSprint.start_date)} - {formatDate(selectedSprint.end_date)}
                  {selectedSprint.goal && (
                    <span className="ml-2 italic">Goal: {selectedSprint.goal}</span>
                  )}
                </p>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Date <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleFieldChange("date", e.target.value)}
                  onBlur={() => handleFieldBlur("date")}
                  min={dateConstraints?.min}
                  max={dateConstraints?.max}
                  className={cn(errors.date && touched.date && "border-destructive")}
                />
                {errors.date && touched.date ? (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.date}
                  </p>
                ) : dateConstraints ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Valid range: {dateConstraints.label}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Spent (minutes)</label>
                <Input
                  type="number"
                  min="0"
                  max="1440"
                  value={formData.time_spent || ""}
                  onChange={(e) => handleFieldChange("time_spent", e.target.value ? parseInt(e.target.value) : undefined)}
                  onBlur={() => handleFieldBlur("time_spent")}
                  placeholder="e.g., 120 (2 hours)"
                  className={cn(errors.time_spent && touched.time_spent && "border-destructive")}
                />
                {errors.time_spent && touched.time_spent && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.time_spent}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Work Details */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">2</span>
              Work Details
            </CardTitle>
            <CardDescription>
              Describe what you worked on
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                onBlur={() => handleFieldBlur("title")}
                placeholder="What did you work on? (e.g., Implemented user authentication)"
                className={cn(errors.title && touched.title && "border-destructive")}
              />
              {errors.title && touched.title && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Description <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                onBlur={() => handleFieldBlur("description")}
                placeholder="Describe what you did in detail... (minimum 10 characters)"
                className={cn(
                  "min-h-[150px]",
                  errors.description && touched.description && "border-destructive"
                )}
              />
              {errors.description && touched.description ? (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.description}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/10 characters minimum
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={formData.category || "_none"}
                onValueChange={(v) => handleFieldChange("category", v === "_none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">
                    <span className="text-muted-foreground">No category</span>
                  </SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Status & Tags */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">3</span>
              Status & Tags
            </CardTitle>
            <CardDescription>
              Set priority, status, and add tags
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Priority & Status */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => handleFieldChange("priority", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "h-2 w-2 rounded-full",
                            p === "critical" && "bg-destructive",
                            p === "high" && "bg-warning",
                            p === "medium" && "bg-primary",
                            p === "low" && "bg-muted-foreground"
                          )} />
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => handleFieldChange("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "h-2 w-2 rounded-full",
                            s === "completed" && "bg-success",
                            s === "in_progress" && "bg-warning",
                            s === "on_hold" && "bg-muted-foreground"
                          )} />
                          {s.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  placeholder="Add a tag (press Enter)..."
                  maxLength={30}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="pr-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Tags help you categorize and search your work entries
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Notes</label>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
                placeholder="Any additional notes, memories, or context..."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Validation Summary */}
        {Object.values(errors).some(e => e) && Object.values(touched).some(t => t) && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Please fix the following errors:</p>
                  <ul className="mt-1 text-sm text-destructive list-disc list-inside">
                    {Object.entries(errors)
                      .filter(([_, error]) => error)
                      .map(([field, error]) => (
                        <li key={field}>{error}</li>
                      ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEdit ? "Update Entry" : "Create Entry"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
