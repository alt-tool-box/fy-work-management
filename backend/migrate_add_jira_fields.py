"""
Database migration script to add Jira integration fields to planned_tasks table
"""
from sqlalchemy import create_engine, text, inspect
from app.config import get_settings

settings = get_settings()


def run_migration():
    """Add external_id, external_source, and last_synced_at to planned_tasks"""
    print("🔄 Starting Jira fields migration...")
    
    # Create engine
    engine = create_engine(settings.database_url_with_driver)
    
    with engine.connect() as conn:
        # Check if columns already exist
        inspector = inspect(engine)
        existing_columns = [col['name'] for col in inspector.get_columns('planned_tasks')]
        
        migrations_needed = []
        if 'external_id' not in existing_columns:
            migrations_needed.append('external_id')
        if 'external_source' not in existing_columns:
            migrations_needed.append('external_source')
        if 'last_synced_at' not in existing_columns:
            migrations_needed.append('last_synced_at')
        
        if not migrations_needed:
            print("✅ All Jira fields already exist. No migration needed.")
            return
        
        print(f"📝 Adding columns: {', '.join(migrations_needed)}")
        
        # Add external_id column (unique, indexed)
        if 'external_id' in migrations_needed:
            print("  → Adding external_id column...")
            conn.execute(text("""
                ALTER TABLE planned_tasks
                ADD COLUMN external_id VARCHAR(100)
            """))
            conn.commit()
            
            print("  → Creating unique constraint on external_id...")
            conn.execute(text("""
                ALTER TABLE planned_tasks
                ADD CONSTRAINT uq_planned_tasks_external_id UNIQUE (external_id)
            """))
            conn.commit()
            
            print("  → Creating index on external_id...")
            conn.execute(text("""
                CREATE INDEX idx_planned_tasks_external_id 
                ON planned_tasks(external_id)
                WHERE external_id IS NOT NULL
            """))
            conn.commit()
        
        # Add external_source column
        if 'external_source' in migrations_needed:
            print("  → Adding external_source column...")
            conn.execute(text("""
                ALTER TABLE planned_tasks
                ADD COLUMN external_source VARCHAR(50)
            """))
            conn.commit()
        
        # Add last_synced_at column
        if 'last_synced_at' in migrations_needed:
            print("  → Adding last_synced_at column...")
            conn.execute(text("""
                ALTER TABLE planned_tasks
                ADD COLUMN last_synced_at TIMESTAMP
            """))
            conn.commit()
        
        print("✅ Migration completed successfully!")
        print("\n📊 Updated table structure:")
        
        # Show updated columns
        inspector = inspect(engine)
        columns = inspector.get_columns('planned_tasks')
        for col in columns:
            if col['name'] in ['external_id', 'external_source', 'last_synced_at']:
                print(f"  ✓ {col['name']}: {col['type']}")


if __name__ == "__main__":
    try:
        run_migration()
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        raise
