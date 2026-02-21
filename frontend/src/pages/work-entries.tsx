import { useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"
import {
  Plus,
  Search,
  FileText,
  Clock,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChatMarkdown } from "@/components/ui/markdown"
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
import { formatDate, formatTime } from "@/lib/utils"
import { useAppStore } from "@/stores/app-store"
import api from "@/lib/api"
import type { WorkEntry } from "@/types"

const statusColors = {
  completed: "success",
  in_progress: "info",
  on_hold: "warning",
} as const

const priorityColors = {
  low: "secondary",
  medium: "default",
  high: "warning",
  critical: "destructive",
} as const

export function WorkEntriesPage() {
  useSearchParams()
  const { addNotification } = useAppStore()
  const [entries, setEntries] = useState<WorkEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [deleteEntry, setDeleteEntry] = useState<WorkEntry | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadEntries()
  }, [statusFilter, categoryFilter, page])

  const loadEntries = async () => {
    setIsLoading(true)
    try {
      const params: Record<string, unknown> = {
        page,
        page_size: 10,
      }
      if (statusFilter !== "all") params.status = statusFilter
      if (categoryFilter !== "all") params.category = categoryFilter

      const response = await api.getWorkEntries(params)
      setEntries(response.items)
      setTotalPages(response.total_pages)
    } catch (error) {
      console.error("Failed to load entries:", error)
      addNotification("error", "Failed to load work entries")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteEntry) return

    try {
      await api.deleteWorkEntry(deleteEntry.id)
      addNotification("success", "Work entry deleted")
      setDeleteEntry(null)
      loadEntries()
    } catch {
      addNotification("error", "Failed to delete entry")
    }
  }

  const filteredEntries = entries.filter((entry) =>
    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const categories = [...new Set(entries.map((e) => e.category).filter(Boolean))]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Work Entries
          </h2>
          <p className="text-muted-foreground">Track and manage your daily work</p>
        </div>
        <Button asChild>
          <Link to="/work/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat!}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Entries list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No work entries found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Start logging your work to track progress"}
              </p>
              <Button asChild>
                <Link to="/work/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Entry
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Link
                        to={`/work/${entry.id}`}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        {entry.title}
                      </Link>
                      <Badge variant={statusColors[entry.status || "completed"]}>
                        {entry.status || "completed"}
                      </Badge>
                      {entry.priority && (
                        <Badge variant={priorityColors[entry.priority]}>
                          {entry.priority}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-2 mb-3 prose prose-sm max-w-none [&>*]:my-0 [&>*]:leading-tight">
                      <ChatMarkdown content={entry.description} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(entry.date)}
                      </span>
                      {entry.time_spent && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(entry.time_spent)}
                        </span>
                      )}
                      {entry.category && (
                        <Badge variant="outline" className="text-xs">
                          {entry.category}
                        </Badge>
                      )}
                      {entry.tags && entry.tags.length > 0 && (
                        <span className="text-xs">
                          {entry.tags.slice(0, 3).join(", ")}
                          {entry.tags.length > 3 && ` +${entry.tags.length - 3}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/work/${entry.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteEntry(entry)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteEntry} onOpenChange={() => setDeleteEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Work Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteEntry?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteEntry(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
