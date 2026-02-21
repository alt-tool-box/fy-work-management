import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MainLayout } from "@/components/layout/main-layout"
import {
  DashboardPage,
  CalendarPage,
  WorkEntriesPage,
  WorkEntryFormPage,
  PlannedTasksPage,
  PlannedTaskFormPage,
  SummaryPage,
  SettingsPage,
} from "@/pages"
import { TooltipProvider } from "@/components/ui/tooltip"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="work" element={<WorkEntriesPage />} />
              <Route path="work/new" element={<WorkEntryFormPage />} />
              <Route path="work/:id" element={<WorkEntryFormPage />} />
              <Route path="work/:id/edit" element={<WorkEntryFormPage />} />
              <Route path="planned" element={<PlannedTasksPage />} />
              <Route path="planned/new" element={<PlannedTaskFormPage />} />
              <Route path="planned/:id" element={<PlannedTaskFormPage />} />
              <Route path="planned/:id/edit" element={<PlannedTaskFormPage />} />
              <Route path="summary" element={<SummaryPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
