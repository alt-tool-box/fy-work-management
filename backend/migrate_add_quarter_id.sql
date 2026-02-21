-- ============================================
-- Migration: Add quarter_id to sprints table
-- Run with: psql -d fy_work_management -f migrate_add_quarter_id.sql
-- ============================================

-- Add quarter_id column to sprints table
ALTER TABLE sprints 
ADD COLUMN IF NOT EXISTS quarter_id UUID;

-- Add foreign key constraint
ALTER TABLE sprints
ADD CONSTRAINT fk_sprints_quarter_id 
FOREIGN KEY (quarter_id) REFERENCES quarters(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_sprints_quarter_id ON sprints(quarter_id);

-- Update existing sprints to link them to the appropriate quarter based on their start_date
-- This automatically assigns sprints to quarters based on date overlap
UPDATE sprints s
SET quarter_id = q.id
FROM quarters q
WHERE s.start_date >= q.start_date 
  AND s.start_date <= q.end_date
  AND s.quarter_id IS NULL;

-- Verify the migration
SELECT 
    'Total sprints' as metric, 
    COUNT(*) as count 
FROM sprints
UNION ALL
SELECT 
    'Sprints with quarter', 
    COUNT(*) 
FROM sprints 
WHERE quarter_id IS NOT NULL
UNION ALL
SELECT 
    'Sprints without quarter', 
    COUNT(*) 
FROM sprints 
WHERE quarter_id IS NULL;

-- Show sprint-quarter relationship
SELECT 
    q.name as quarter,
    q.year,
    COUNT(s.id) as sprint_count,
    STRING_AGG(s.name, ', ' ORDER BY s.start_date) as sprints
FROM quarters q
LEFT JOIN sprints s ON s.quarter_id = q.id
GROUP BY q.id, q.name, q.year, q.start_date
ORDER BY q.start_date;

COMMIT;
