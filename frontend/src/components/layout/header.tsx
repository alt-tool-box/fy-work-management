import { Bell, Search, Plus, MessageSquare } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { useAppStore } from "@/stores/app-store"

const pageTitles: Record<string, { title: string; description: string }> = {
  "/": { title: "Dashboard", description: "Overview of your work management" },
  "/calendar": { title: "FY Calendar", description: "Manage your calendar and holidays" },
  "/work": { title: "Work Entries", description: "Track your daily work" },
  "/work/new": { title: "New Work Entry", description: "Log your work" },
  "/planned": { title: "Planned Tasks", description: "Manage sprint and weekly tasks" },
  "/planned/new": { title: "New Planned Task", description: "Plan your upcoming work" },
  "/sprint": { title: "Sprint Board", description: "Current sprint progress" },
  "/summary": { title: "Summary", description: "Analytics and reports" },
  "/settings": { title: "Settings", description: "Configure your workspace" },
}

export function Header() {
  const location = useLocation()
  const { currentYear, notifications } = useAppStore()
  
  const pageInfo = pageTitles[location.pathname] || { 
    title: "FY Work Management", 
    description: "Manage your work" 
  }

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Page title */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{pageInfo.title}</h1>
          <p className="text-sm text-muted-foreground">{pageInfo.description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:block">
            <Input
              placeholder="Search..."
              className="w-64"
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          {/* Year badge */}
          <div className="hidden rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary sm:block">
            FY {currentYear}
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/work/new">
                    <Plus className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Work Entry</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/#chat">
                    <MessageSquare className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>AI Chat</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>
    </TooltipProvider>
  )
}
