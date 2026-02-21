# FY Work Management - Backend

FastAPI backend for the FY Work Management application.

## Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **AI/LLM**: Ollama (gpt-oss:20b)
- **File Storage**: MinIO (S3-compatible)
- **Python**: 3.11+

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration management
│   ├── database.py          # Database connection
│   ├── models/              # SQLAlchemy models
│   │   ├── sprint.py
│   │   ├── quarter.py
│   │   ├── holiday.py
│   │   ├── work_entry.py
│   │   ├── planned_task.py
│   │   ├── attachment.py
│   │   ├── configuration.py
│   │   └── chat_history.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── sprint.py
│   │   ├── quarter.py
│   │   ├── holiday.py
│   │   ├── work_entry.py
│   │   ├── planned_task.py
│   │   ├── attachment.py
│   │   ├── configuration.py
│   │   ├── chat.py
│   │   ├── dashboard.py
│   │   └── summary.py
│   ├── services/            # Business logic
│   │   ├── sprint_service.py
│   │   ├── quarter_service.py
│   │   ├── holiday_service.py
│   │   ├── work_entry_service.py
│   │   ├── planned_task_service.py
│   │   ├── file_service.py
│   │   ├── config_service.py
│   │   ├── ai_service.py
│   │   ├── dashboard_service.py
│   │   └── summary_service.py
│   ├── routers/             # API endpoints
│   │   ├── sprints.py
│   │   ├── quarters.py
│   │   ├── holidays.py
│   │   ├── calendar.py
│   │   ├── work_entries.py
│   │   ├── planned_tasks.py
│   │   ├── files.py
│   │   ├── config.py
│   │   ├── chat.py
│   │   ├── dashboard.py
│   │   └── summary.py
│   └── utils/               # Utility functions
│       └── helpers.py
├── requirements.txt
└── README.md
```

## Setup

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Create a `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fy_work_management

# MinIO Configuration
MINIO_ENDPOINT=127.0.0.1:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=fy-work-management
MINIO_SECURE=false

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gpt-oss:20b

# Application Settings
APP_NAME=FY Work Management
APP_VERSION=1.0.0
DEBUG=true
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
```

### 4. Create Database

```bash
# Create PostgreSQL database
createdb fy_work_management
```

### 5. Run the Application

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once the server is running, access:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## API Endpoints

### Sprints (`/api/v1/config/sprints`)
- `GET /` - List all sprints
- `GET /active` - Get active sprint
- `GET /current` - Get current or next sprint
- `GET /{id}` - Get sprint by ID
- `POST /` - Create sprint
- `PUT /{id}` - Update sprint
- `DELETE /{id}` - Delete sprint
- `POST /generate` - Auto-generate 26 sprints for a year
- `POST /{id}/activate` - Activate a sprint

### Quarters (`/api/v1/config/quarters`)
- `GET /` - List all quarters
- `GET /current` - Get current quarter
- `GET /{id}` - Get quarter by ID
- `POST /` - Create quarter
- `PUT /{id}` - Update quarter
- `DELETE /{id}` - Delete quarter
- `POST /generate/{year}` - Generate quarters for a year

### Holidays (`/api/v1/calendar/holidays`)
- `GET /` - List holidays
- `GET /upcoming` - Get upcoming holidays
- `GET /check/{date}` - Check if date is holiday
- `GET /{id}` - Get holiday by ID
- `POST /` - Create holiday
- `PUT /{id}` - Update holiday
- `DELETE /{id}` - Delete holiday

### Calendar (`/api/v1/calendar`)
- `GET /events` - Get calendar events for date range
- `GET /work-intensity` - Get work intensity per day

### Work Entries (`/api/v1/work`)
- `GET /` - List work entries (paginated, filterable)
- `GET /today` - Get today's entries
- `GET /date/{date}` - Get entries for date
- `GET /sprint/{id}` - Get entries for sprint
- `GET /{id}` - Get entry by ID
- `POST /` - Create entry
- `PUT /{id}` - Update entry
- `DELETE /{id}` - Delete entry
- `GET /stats/by-status` - Count by status
- `GET /stats/by-category` - Count by category
- `GET /stats/time-spent` - Total time spent

### Planned Tasks (`/api/v1/planned-tasks`)
- `GET /` - List planned tasks
- `GET /sprint/{id}` - Get tasks for sprint
- `GET /week/{year}/{week}` - Get tasks for week
- `GET /stats` - Get task statistics
- `GET /pending` - Get pending tasks
- `GET /deferred` - Get deferred tasks
- `GET /{id}` - Get task by ID
- `POST /` - Create task
- `PUT /{id}` - Update task
- `DELETE /{id}` - Delete task
- `POST /{id}/complete` - Mark task complete
- `POST /{id}/defer` - Defer task

### Files (`/api/v1/files`)
- `POST /upload` - Upload file
- `GET /work-entry/{id}` - Get attachments for work entry
- `GET /{id}` - Get attachment
- `GET /{id}/download-url` - Get download URL
- `DELETE /{id}` - Delete attachment

### Configuration (`/api/v1/config`)
- `GET /` - Get all config
- `GET /app` - Get app configuration
- `GET /{key}` - Get config value
- `PUT /` - Update config
- `PUT /bulk` - Bulk update config
- `DELETE /{key}` - Delete config
- `POST /initialize` - Initialize defaults
- `GET /categories` - Get work categories
- `POST /categories/{name}` - Add category
- `DELETE /categories/{name}` - Remove category

### AI Chat (`/api/v1/chat`)
- `POST /` - Send chat message
- `GET /history` - Get chat history
- `GET /sessions` - Get all sessions
- `DELETE /history/{session_id}` - Delete chat history

### Dashboard (`/api/v1/dashboard`)
- `GET /stats` - Get dashboard statistics
- `GET /sprint-progress` - Get sprint progress
- `GET /summary` - Get AI-enhanced summary

### Summary (`/api/v1/summary`)
- `GET /daily` - Daily summary
- `GET /weekly` - Weekly summary
- `GET /monthly` - Monthly summary
- `GET /quarterly` - Quarterly summary
- `GET /sprint/{id}` - Sprint summary
- `GET /yearly` - Yearly summary

## External Dependencies

### PostgreSQL
The application requires PostgreSQL 15+. Create the database before running:
```bash
createdb fy_work_management
```

### MinIO
MinIO is required for file storage. Start MinIO:
```bash
minio server /data --console-address ":9001"
```
Access MinIO console at http://localhost:9001

### Ollama
Ollama is required for AI features. Install and run:
```bash
ollama run gpt-oss:20b
```
Make sure Ollama is running at http://localhost:11434

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black app/
isort app/
```

### Type Checking
```bash
mypy app/
```

## License

MIT License
