#!/usr/bin/env python3
"""
Database Seed Script
Loads seed data from seed_data.sql
"""
import sys
from sqlalchemy import create_engine, text
from app.config import get_settings

def run_seed():
    """Run the database seed"""
    settings = get_settings()
    
    # Create engine
    engine = create_engine(settings.database_url_with_driver)
    
    print("🌱 Starting database seeding...")
    
    try:
        # Read the SQL file
        print("📖 Reading seed_data.sql...")
        with open('seed_data.sql', 'r') as f:
            sql_content = f.read()
        
        # Split into individual statements (basic split on semicolon)
        # Filter out comments and empty statements
        statements = []
        for stmt in sql_content.split(';'):
            stmt = stmt.strip()
            # Skip empty statements and pure comment lines
            if stmt and not stmt.startswith('--') and 'SELECT' in stmt.upper():
                statements.append(stmt)
        
        with engine.begin() as conn:
            # Execute the entire SQL content as one block (it handles transactions internally)
            print("🔄 Executing seed data...")
            conn.execute(text(sql_content))
        
        print("\n✅ Database seeded successfully!")
        
        # Verify the seed
        print("\n📊 Verification:")
        with engine.begin() as conn:
            tables = ['quarters', 'sprints', 'holidays', 'work_entries', 'planned_tasks', 'configuration']
            for table in tables:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"   {table}: {count} records")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(run_seed())
