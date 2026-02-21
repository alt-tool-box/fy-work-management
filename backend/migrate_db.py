#!/usr/bin/env python3
"""
Database Migration Script
Adds quarter_id column to sprints table and establishes relationships
"""
import sys
from sqlalchemy import create_engine, text
from app.config import get_settings

def run_migration():
    """Run the database migration"""
    settings = get_settings()
    
    # Create engine
    engine = create_engine(settings.database_url_with_driver)
    
    print("🔄 Starting migration...")
    
    try:
        with engine.begin() as conn:
            # Add quarter_id column
            print("📝 Adding quarter_id column to sprints table...")
            conn.execute(text("""
                ALTER TABLE sprints 
                ADD COLUMN IF NOT EXISTS quarter_id UUID
            """))
            
            # Add foreign key constraint
            print("🔗 Adding foreign key constraint...")
            try:
                conn.execute(text("""
                    ALTER TABLE sprints
                    ADD CONSTRAINT fk_sprints_quarter_id 
                    FOREIGN KEY (quarter_id) REFERENCES quarters(id) ON DELETE SET NULL
                """))
            except Exception as e:
                if "already exists" in str(e):
                    print("   ⚠️  Foreign key constraint already exists, skipping...")
                else:
                    raise
            
            # Create index
            print("📇 Creating index for better performance...")
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_sprints_quarter_id ON sprints(quarter_id)
            """))
            
            # Update existing sprints
            print("🔄 Linking existing sprints to quarters...")
            result = conn.execute(text("""
                UPDATE sprints s
                SET quarter_id = q.id
                FROM quarters q
                WHERE s.start_date >= q.start_date 
                  AND s.start_date <= q.end_date
                  AND s.quarter_id IS NULL
            """))
            print(f"   ✅ Updated {result.rowcount} sprints")
            
            # Verify migration
            print("\n📊 Verification:")
            result = conn.execute(text("""
                SELECT 
                    COUNT(*) as total,
                    COUNT(quarter_id) as with_quarter,
                    COUNT(*) - COUNT(quarter_id) as without_quarter
                FROM sprints
            """))
            row = result.fetchone()
            print(f"   Total sprints: {row[0]}")
            print(f"   Sprints with quarter: {row[1]}")
            print(f"   Sprints without quarter: {row[2]}")
            
            # Show sprint-quarter relationship
            print("\n🗂️  Sprint-Quarter Relationship:")
            result = conn.execute(text("""
                SELECT 
                    q.name as quarter,
                    q.year,
                    COUNT(s.id) as sprint_count
                FROM quarters q
                LEFT JOIN sprints s ON s.quarter_id = q.id
                GROUP BY q.id, q.name, q.year, q.start_date
                ORDER BY q.start_date
            """))
            for row in result:
                print(f"   {row[0]} {row[1]}: {row[2]} sprints")
        
        print("\n✅ Migration completed successfully!")
        return 0
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(run_migration())
