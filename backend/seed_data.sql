-- ============================================
-- FY Work Management - Seed Data
-- Run with: psql -d fy_work_management -f seed_data.sql
-- ============================================

-- Clear existing data (optional - comment out if you want to keep existing data)
TRUNCATE TABLE attachments, chat_history, planned_tasks, work_entries, holidays, sprints, quarters, configuration CASCADE;

-- ============================================
-- QUARTERS (2026)
-- Hierarchy: FY → Quarter → Sprint
-- ============================================
INSERT INTO quarters (id, name, start_date, end_date, year, created_at) VALUES
('a1000000-0000-0000-0000-000000000001', 'Q1', '2026-01-01', '2026-03-31', 2026, NOW()),
('a1000000-0000-0000-0000-000000000002', 'Q2', '2026-04-01', '2026-06-30', 2026, NOW()),
('a1000000-0000-0000-0000-000000000003', 'Q3', '2026-07-01', '2026-09-30', 2026, NOW()),
('a1000000-0000-0000-0000-000000000004', 'Q4', '2026-10-01', '2026-12-31', 2026, NOW());

-- ============================================
-- SPRINTS (26 sprints for 2026, 2-week each)
-- Hierarchy: FY → Quarter → Sprint
-- Sprint assigned to quarter based on START date
-- ============================================
INSERT INTO sprints (id, name, quarter_id, start_date, end_date, status, goal, working_days, created_at) VALUES
-- Q1 Sprints (Jan 1 - Mar 31) - ~7 sprints
('b1000000-0000-0000-0000-000000000001', 'Sprint 1', 'a1000000-0000-0000-0000-000000000001', '2026-01-05', '2026-01-18', 'completed', 'Project kickoff and setup', 10, NOW()),
('b1000000-0000-0000-0000-000000000002', 'Sprint 2', 'a1000000-0000-0000-0000-000000000001', '2026-01-19', '2026-02-01', 'active', 'Core feature development', 10, NOW()),
('b1000000-0000-0000-0000-000000000003', 'Sprint 3', 'a1000000-0000-0000-0000-000000000001', '2026-02-02', '2026-02-15', 'planned', 'API integration', 10, NOW()),
('b1000000-0000-0000-0000-000000000004', 'Sprint 4', 'a1000000-0000-0000-0000-000000000001', '2026-02-16', '2026-03-01', 'planned', 'Testing and bug fixes', 10, NOW()),
('b1000000-0000-0000-0000-000000000005', 'Sprint 5', 'a1000000-0000-0000-0000-000000000001', '2026-03-02', '2026-03-15', 'planned', 'Performance optimization', 10, NOW()),
('b1000000-0000-0000-0000-000000000006', 'Sprint 6', 'a1000000-0000-0000-0000-000000000001', '2026-03-16', '2026-03-29', 'planned', 'Q1 deliverables', 10, NOW()),
('b1000000-0000-0000-0000-000000000007', 'Sprint 7', 'a1000000-0000-0000-0000-000000000001', '2026-03-30', '2026-04-12', 'planned', 'Q1 wrap-up & Q2 planning', 10, NOW()),

-- Q2 Sprints (Apr 1 - Jun 30) - ~7 sprints
('b1000000-0000-0000-0000-000000000008', 'Sprint 8', 'a1000000-0000-0000-0000-000000000002', '2026-04-13', '2026-04-26', 'planned', 'Feature development', 10, NOW()),
('b1000000-0000-0000-0000-000000000009', 'Sprint 9', 'a1000000-0000-0000-0000-000000000002', '2026-04-27', '2026-05-10', 'planned', 'Integration work', 10, NOW()),
('b1000000-0000-0000-0000-000000000010', 'Sprint 10', 'a1000000-0000-0000-0000-000000000002', '2026-05-11', '2026-05-24', 'planned', 'UI/UX improvements', 10, NOW()),
('b1000000-0000-0000-0000-000000000011', 'Sprint 11', 'a1000000-0000-0000-0000-000000000002', '2026-05-25', '2026-06-07', 'planned', 'Testing phase', 10, NOW()),
('b1000000-0000-0000-0000-000000000012', 'Sprint 12', 'a1000000-0000-0000-0000-000000000002', '2026-06-08', '2026-06-21', 'planned', 'Q2 deliverables', 10, NOW()),
('b1000000-0000-0000-0000-000000000013', 'Sprint 13', 'a1000000-0000-0000-0000-000000000002', '2026-06-22', '2026-07-05', 'planned', 'Mid-year review', 10, NOW()),

-- Q3 Sprints (Jul 1 - Sep 30) - ~7 sprints
('b1000000-0000-0000-0000-000000000014', 'Sprint 14', 'a1000000-0000-0000-0000-000000000003', '2026-07-06', '2026-07-19', 'planned', 'H2 kickoff', 10, NOW()),
('b1000000-0000-0000-0000-000000000015', 'Sprint 15', 'a1000000-0000-0000-0000-000000000003', '2026-07-20', '2026-08-02', 'planned', 'New feature development', 10, NOW()),
('b1000000-0000-0000-0000-000000000016', 'Sprint 16', 'a1000000-0000-0000-0000-000000000003', '2026-08-03', '2026-08-16', 'planned', 'Backend optimization', 10, NOW()),
('b1000000-0000-0000-0000-000000000017', 'Sprint 17', 'a1000000-0000-0000-0000-000000000003', '2026-08-17', '2026-08-30', 'planned', 'Security enhancements', 10, NOW()),
('b1000000-0000-0000-0000-000000000018', 'Sprint 18', 'a1000000-0000-0000-0000-000000000003', '2026-08-31', '2026-09-13', 'planned', 'Integration testing', 10, NOW()),
('b1000000-0000-0000-0000-000000000019', 'Sprint 19', 'a1000000-0000-0000-0000-000000000003', '2026-09-14', '2026-09-27', 'planned', 'Q3 deliverables', 10, NOW()),

-- Q4 Sprints (Oct 1 - Dec 31) - ~6 sprints
('b1000000-0000-0000-0000-000000000020', 'Sprint 20', 'a1000000-0000-0000-0000-000000000004', '2026-09-28', '2026-10-11', 'planned', 'Q4 planning', 10, NOW()),
('b1000000-0000-0000-0000-000000000021', 'Sprint 21', 'a1000000-0000-0000-0000-000000000004', '2026-10-12', '2026-10-25', 'planned', 'Feature polish', 10, NOW()),
('b1000000-0000-0000-0000-000000000022', 'Sprint 22', 'a1000000-0000-0000-0000-000000000004', '2026-10-26', '2026-11-08', 'planned', 'Documentation update', 10, NOW()),
('b1000000-0000-0000-0000-000000000023', 'Sprint 23', 'a1000000-0000-0000-0000-000000000004', '2026-11-09', '2026-11-22', 'planned', 'Performance tuning', 10, NOW()),
('b1000000-0000-0000-0000-000000000024', 'Sprint 24', 'a1000000-0000-0000-0000-000000000004', '2026-11-23', '2026-12-06', 'planned', 'Year-end features', 10, NOW()),
('b1000000-0000-0000-0000-000000000025', 'Sprint 25', 'a1000000-0000-0000-0000-000000000004', '2026-12-07', '2026-12-20', 'planned', 'Final testing', 10, NOW()),
('b1000000-0000-0000-0000-000000000026', 'Sprint 26', 'a1000000-0000-0000-0000-000000000004', '2026-12-21', '2027-01-03', 'planned', 'Year-end wrap-up', 10, NOW());

-- ============================================
-- HOLIDAYS (2026)
-- ============================================
INSERT INTO holidays (id, name, date, is_recurring, description, holiday_type, created_at) VALUES
('c1000000-0000-0000-0000-000000000001', 'New Year''s Day', '2026-01-01', true, 'New Year celebration', 'holiday', NOW()),
('c1000000-0000-0000-0000-000000000002', 'Republic Day', '2026-01-26', true, 'National holiday - India', 'holiday', NOW()),
('c1000000-0000-0000-0000-000000000003', 'Holi', '2026-03-10', false, 'Festival of colors', 'holiday', NOW()),
('c1000000-0000-0000-0000-000000000004', 'Good Friday', '2026-04-03', false, 'Christian holiday', 'holiday', NOW()),
('c1000000-0000-0000-0000-000000000005', 'Independence Day', '2026-08-15', true, 'National holiday - India', 'holiday', NOW()),
('c1000000-0000-0000-0000-000000000006', 'Gandhi Jayanti', '2026-10-02', true, 'National holiday', 'holiday', NOW()),
('c1000000-0000-0000-0000-000000000007', 'Diwali', '2026-11-14', false, 'Festival of lights', 'holiday', NOW()),
('c1000000-0000-0000-0000-000000000008', 'Christmas Day', '2026-12-25', true, 'Christmas celebration', 'holiday', NOW());

-- ============================================
-- WORK ENTRIES (Sample work done)
-- ============================================
INSERT INTO work_entries (id, title, description, date, category, tags, time_spent, priority, status, sprint_id, notes, created_at, updated_at) VALUES
-- Sprint 1 completed work (Q1)
('d1000000-0000-0000-0000-000000000001', 'Project Setup', 'Set up the development environment including IDE, Git, and project structure', '2026-01-06', 'Development', ARRAY['setup', 'infrastructure'], 240, 'high', 'completed', 'b1000000-0000-0000-0000-000000000001', 'Initial project configuration complete', NOW(), NOW()),
('d1000000-0000-0000-0000-000000000002', 'Database Schema Design', 'Designed and documented the database schema for all entities', '2026-01-07', 'Planning', ARRAY['database', 'design'], 180, 'high', 'completed', 'b1000000-0000-0000-0000-000000000001', 'Schema reviewed by team', NOW(), NOW()),
('d1000000-0000-0000-0000-000000000003', 'API Architecture Planning', 'Defined REST API endpoints and data models', '2026-01-08', 'Planning', ARRAY['api', 'architecture'], 300, 'high', 'completed', 'b1000000-0000-0000-0000-000000000001', NULL, NOW(), NOW()),
('d1000000-0000-0000-0000-000000000004', 'Sprint Planning Meeting', 'Conducted sprint planning with the team, estimated stories', '2026-01-09', 'Meeting', ARRAY['sprint', 'planning'], 120, 'medium', 'completed', 'b1000000-0000-0000-0000-000000000001', '12 story points committed', NOW(), NOW()),
('d1000000-0000-0000-0000-000000000005', 'User Authentication Module', 'Implemented user authentication with JWT tokens', '2026-01-12', 'Development', ARRAY['auth', 'security', 'backend'], 360, 'critical', 'completed', 'b1000000-0000-0000-0000-000000000001', 'Added refresh token support', NOW(), NOW()),
('d1000000-0000-0000-0000-000000000006', 'Code Review Session', 'Reviewed PRs for authentication and database modules', '2026-01-13', 'Review', ARRAY['code-review'], 90, 'medium', 'completed', 'b1000000-0000-0000-0000-000000000001', '3 PRs reviewed and approved', NOW(), NOW()),
('d1000000-0000-0000-0000-000000000007', 'Documentation Update', 'Updated README and API documentation', '2026-01-14', 'Documentation', ARRAY['docs', 'readme'], 120, 'low', 'completed', 'b1000000-0000-0000-0000-000000000001', NULL, NOW(), NOW()),
('d1000000-0000-0000-0000-000000000008', 'Bug Fix: Login Issue', 'Fixed critical bug where login would fail on certain edge cases', '2026-01-15', 'Bug Fix', ARRAY['bug', 'urgent', 'auth'], 90, 'critical', 'completed', 'b1000000-0000-0000-0000-000000000001', 'Root cause: token expiry not handled', NOW(), NOW()),

-- Sprint 2 work (current sprint - Q1 - mix of completed and in progress)
('d1000000-0000-0000-0000-000000000009', 'Dashboard Component Design', 'Designed and implemented the main dashboard UI components', '2026-01-19', 'Development', ARRAY['frontend', 'ui', 'dashboard'], 300, 'high', 'completed', 'b1000000-0000-0000-0000-000000000002', 'Using shadcn/ui components', NOW(), NOW()),
('d1000000-0000-0000-0000-000000000010', 'Calendar Integration', 'Integrated calendar view with work entry display', '2026-01-20', 'Development', ARRAY['frontend', 'calendar'], 240, 'high', 'completed', 'b1000000-0000-0000-0000-000000000002', NULL, NOW(), NOW()),
('d1000000-0000-0000-0000-000000000011', 'API Endpoint Testing', 'Wrote and executed tests for all CRUD endpoints', '2026-01-21', 'Development', ARRAY['testing', 'api'], 180, 'medium', 'completed', 'b1000000-0000-0000-0000-000000000002', '95% code coverage achieved', NOW(), NOW()),
('d1000000-0000-0000-0000-000000000012', 'Team Standup', 'Daily standup meeting with development team', '2026-01-22', 'Meeting', ARRAY['standup', 'daily'], 30, 'low', 'completed', 'b1000000-0000-0000-0000-000000000002', 'Discussed blockers', NOW(), NOW()),
('d1000000-0000-0000-0000-000000000013', 'AI Chat Integration', 'Working on integrating Ollama for AI chat feature', '2026-01-22', 'Development', ARRAY['ai', 'ollama', 'chat'], 240, 'high', 'in_progress', 'b1000000-0000-0000-0000-000000000002', 'Streaming responses implemented', NOW(), NOW()),
('d1000000-0000-0000-0000-000000000014', 'Performance Profiling', 'Profiled API endpoints for performance bottlenecks', '2026-01-23', 'Development', ARRAY['performance', 'optimization'], 150, 'medium', 'in_progress', 'b1000000-0000-0000-0000-000000000002', 'Found N+1 query issues', NOW(), NOW());

-- ============================================
-- PLANNED TASKS (Sprint backlog)
-- ============================================
INSERT INTO planned_tasks (id, title, description, sprint_id, week_number, year, target_date, estimated_hours, story_points, priority, status, category, tags, work_entry_id, created_at, updated_at) VALUES
-- Sprint 1 completed tasks (Q1)
('e1000000-0000-0000-0000-000000000001', 'Project Initialization', 'Set up project repository and initial structure', 'b1000000-0000-0000-0000-000000000001', 2, 2026, '2026-01-06', 4.0, 3, 'high', 'completed', 'Development', ARRAY['setup'], 'd1000000-0000-0000-0000-000000000001', NOW(), NOW()),
('e1000000-0000-0000-0000-000000000002', 'Database Design', 'Design and create database schema', 'b1000000-0000-0000-0000-000000000001', 2, 2026, '2026-01-07', 3.0, 5, 'high', 'completed', 'Planning', ARRAY['database'], 'd1000000-0000-0000-0000-000000000002', NOW(), NOW()),
('e1000000-0000-0000-0000-000000000003', 'API Design Document', 'Create API specification document', 'b1000000-0000-0000-0000-000000000001', 2, 2026, '2026-01-08', 5.0, 5, 'high', 'completed', 'Documentation', ARRAY['api'], 'd1000000-0000-0000-0000-000000000003', NOW(), NOW()),
('e1000000-0000-0000-0000-000000000004', 'Authentication System', 'Implement JWT-based auth', 'b1000000-0000-0000-0000-000000000001', 3, 2026, '2026-01-12', 6.0, 8, 'critical', 'completed', 'Development', ARRAY['auth', 'security'], 'd1000000-0000-0000-0000-000000000005', NOW(), NOW()),

-- Sprint 2 tasks (current - Q1) - COMPLETED
('e1000000-0000-0000-0000-000000000005', 'Dashboard UI', 'Build main dashboard with stats and metrics visualization', 'b1000000-0000-0000-0000-000000000002', 4, 2026, '2026-01-19', 5.0, 5, 'high', 'completed', 'Development', ARRAY['frontend', 'ui'], 'd1000000-0000-0000-0000-000000000009', NOW(), NOW()),
('e1000000-0000-0000-0000-000000000006', 'Calendar Component', 'Implement FY calendar view with holiday markers', 'b1000000-0000-0000-0000-000000000002', 4, 2026, '2026-01-20', 4.0, 5, 'high', 'completed', 'Development', ARRAY['frontend', 'calendar'], 'd1000000-0000-0000-0000-000000000010', NOW(), NOW()),
('e1000000-0000-0000-0000-000000000015', 'Work Entry CRUD', 'Complete work entry create/read/update/delete operations', 'b1000000-0000-0000-0000-000000000002', 4, 2026, '2026-01-21', 6.0, 8, 'high', 'completed', 'Development', ARRAY['backend', 'api'], 'd1000000-0000-0000-0000-000000000011', NOW(), NOW()),
('e1000000-0000-0000-0000-000000000016', 'Sprint Settings Page', 'Admin page for configuring sprints and quarters', 'b1000000-0000-0000-0000-000000000002', 4, 2026, '2026-01-22', 4.0, 5, 'medium', 'completed', 'Development', ARRAY['frontend', 'admin'], NULL, NOW(), NOW()),

-- Sprint 2 tasks (current - Q1) - IN PROGRESS
('e1000000-0000-0000-0000-000000000007', 'AI Chat Feature', 'Integrate Ollama for AI-powered chat assistant', 'b1000000-0000-0000-0000-000000000002', 4, 2026, '2026-01-23', 8.0, 8, 'high', 'in_progress', 'Development', ARRAY['ai', 'chat'], NULL, NOW(), NOW()),
('e1000000-0000-0000-0000-000000000017', 'Summary Generation', 'AI-powered work summary generation with insights', 'b1000000-0000-0000-0000-000000000002', 4, 2026, '2026-01-24', 6.0, 8, 'high', 'in_progress', 'Development', ARRAY['ai', 'summary'], NULL, NOW(), NOW()),
('e1000000-0000-0000-0000-000000000018', 'Markdown Renderer', 'Beautiful markdown rendering for AI responses', 'b1000000-0000-0000-0000-000000000002', 4, 2026, '2026-01-24', 3.0, 3, 'medium', 'in_progress', 'Development', ARRAY['frontend', 'ui'], NULL, NOW(), NOW()),

-- Sprint 2 tasks (current - Q1) - PLANNED (backlog)
('e1000000-0000-0000-0000-000000000008', 'Summary Reports', 'Generate daily/weekly/monthly work summaries', 'b1000000-0000-0000-0000-000000000002', 5, 2026, '2026-01-28', 6.0, 5, 'medium', 'planned', 'Development', ARRAY['reports', 'ai'], NULL, NOW(), NOW()),
('e1000000-0000-0000-0000-000000000009', 'File Upload Feature', 'MinIO integration for file attachments', 'b1000000-0000-0000-0000-000000000002', 5, 2026, '2026-01-29', 4.0, 5, 'medium', 'planned', 'Development', ARRAY['minio', 'upload'], NULL, NOW(), NOW()),
('e1000000-0000-0000-0000-000000000010', 'Sprint Board View', 'Kanban-style sprint board with drag-and-drop', 'b1000000-0000-0000-0000-000000000002', 5, 2026, '2026-01-30', 5.0, 5, 'medium', 'planned', 'Development', ARRAY['frontend', 'kanban'], NULL, NOW(), NOW()),
('e1000000-0000-0000-0000-000000000019', 'Dark Mode Toggle', 'Implement dark/light theme switching', 'b1000000-0000-0000-0000-000000000002', 5, 2026, '2026-01-30', 2.0, 2, 'low', 'planned', 'Development', ARRAY['frontend', 'theme'], NULL, NOW(), NOW()),
('e1000000-0000-0000-0000-000000000020', 'Export to CSV', 'Export work entries and summaries to CSV', 'b1000000-0000-0000-0000-000000000002', 5, 2026, '2026-01-31', 3.0, 3, 'low', 'planned', 'Development', ARRAY['export', 'data'], NULL, NOW(), NOW()),
('e1000000-0000-0000-0000-000000000021', 'Unit Tests', 'Write unit tests for backend services', 'b1000000-0000-0000-0000-000000000002', 5, 2026, '2026-01-31', 8.0, 8, 'high', 'planned', 'Development', ARRAY['testing', 'backend'], NULL, NOW(), NOW()),

-- Sprint 2 tasks (current - Q1) - DEFERRED
('e1000000-0000-0000-0000-000000000022', 'Mobile Responsive', 'Make UI fully mobile responsive', 'b1000000-0000-0000-0000-000000000002', 4, 2026, '2026-01-22', 6.0, 5, 'medium', 'deferred', 'Development', ARRAY['frontend', 'mobile'], NULL, NOW(), NOW()),
('e1000000-0000-0000-0000-000000000023', 'Keyboard Shortcuts', 'Add keyboard shortcuts for power users', 'b1000000-0000-0000-0000-000000000002', 4, 2026, '2026-01-23', 3.0, 2, 'low', 'deferred', 'Development', ARRAY['frontend', 'ux'], NULL, NOW(), NOW()),

-- Sprint 3 planned tasks (upcoming - Q1)
('e1000000-0000-0000-0000-000000000011', 'API Rate Limiting', 'Implement rate limiting for APIs', 'b1000000-0000-0000-0000-000000000003', 6, 2026, '2026-02-05', 4.0, 3, 'medium', 'planned', 'Development', ARRAY['security', 'api'], NULL, NOW(), NOW()),
('e1000000-0000-0000-0000-000000000012', 'User Preferences', 'Add user settings page', 'b1000000-0000-0000-0000-000000000003', 6, 2026, '2026-02-06', 3.0, 3, 'low', 'planned', 'Development', ARRAY['frontend', 'settings'], NULL, NOW(), NOW()),
('e1000000-0000-0000-0000-000000000013', 'Export to PDF', 'Export work summaries to PDF', 'b1000000-0000-0000-0000-000000000003', 7, 2026, '2026-02-10', 5.0, 5, 'medium', 'planned', 'Development', ARRAY['export', 'pdf'], NULL, NOW(), NOW()),
('e1000000-0000-0000-0000-000000000014', 'Email Notifications', 'Setup email notification system', 'b1000000-0000-0000-0000-000000000003', 7, 2026, '2026-02-12', 6.0, 5, 'low', 'planned', 'Development', ARRAY['email', 'notifications'], NULL, NOW(), NOW()),

-- Sprint 8 planned tasks (Q2)
('e1000000-0000-0000-0000-000000000024', 'Advanced Analytics', 'Build advanced analytics dashboard', 'b1000000-0000-0000-0000-000000000008', 16, 2026, '2026-04-15', 8.0, 8, 'high', 'planned', 'Development', ARRAY['analytics', 'dashboard'], NULL, NOW(), NOW()),
('e1000000-0000-0000-0000-000000000025', 'Team Collaboration', 'Add team collaboration features', 'b1000000-0000-0000-0000-000000000008', 17, 2026, '2026-04-22', 6.0, 5, 'medium', 'planned', 'Development', ARRAY['team', 'collaboration'], NULL, NOW(), NOW());

-- ============================================
-- CONFIGURATION
-- ============================================
INSERT INTO configuration (id, key, value, updated_at) VALUES
('f1000000-0000-0000-0000-000000000001', 'work_categories', '["Development", "Meeting", "Documentation", "Planning", "Review", "Bug Fix", "Research", "Other"]', NOW()),
('f1000000-0000-0000-0000-000000000002', 'sprint_settings', '{"duration_days": 14, "working_days": 10, "start_day": "Monday"}', NOW()),
('f1000000-0000-0000-0000-000000000003', 'fy_settings', '{"start_month": 1, "year": 2026}', NOW()),
('f1000000-0000-0000-0000-000000000004', 'default_values', '{"priority": "medium", "status": "completed"}', NOW());

-- ============================================
-- Verify data
-- ============================================
SELECT 'Quarters:' as table_name, COUNT(*) as count FROM quarters
UNION ALL
SELECT 'Sprints:', COUNT(*) FROM sprints
UNION ALL
SELECT 'Holidays:', COUNT(*) FROM holidays
UNION ALL
SELECT 'Work Entries:', COUNT(*) FROM work_entries
UNION ALL
SELECT 'Planned Tasks:', COUNT(*) FROM planned_tasks
UNION ALL
SELECT 'Configuration:', COUNT(*) FROM configuration;

-- ============================================
-- Show Sprint-Quarter relationship summary
-- ============================================
SELECT 
    q.name as quarter,
    q.start_date as quarter_start,
    q.end_date as quarter_end,
    COUNT(s.id) as sprint_count,
    STRING_AGG(s.name, ', ' ORDER BY s.start_date) as sprints
FROM quarters q
LEFT JOIN sprints s ON s.quarter_id = q.id
WHERE q.year = 2026
GROUP BY q.id, q.name, q.start_date, q.end_date
ORDER BY q.start_date;
