"""
AI Service - Integration with Ollama for AI-powered features
"""
import httpx
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.chat_history import ChatHistory
from app.schemas.chat import ChatMessage, ChatResponse, ChatHistoryItem

settings = get_settings()


class AIService:
    """Service class for AI/LLM operations using Ollama"""
    
    def __init__(self, db: Session):
        self.db = db
        self.base_url = settings.ollama_base_url
        self.model = settings.ollama_model
        self.timeout = settings.ollama_timeout
        self.ai_enabled = settings.ai_enabled
    
    async def _call_ollama(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Make a request to Ollama API"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                messages = []
                
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                
                messages.append({"role": "user", "content": prompt})
                
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": messages,
                        "stream": False
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("message", {}).get("content", "")
                else:
                    return f"Error: Unable to get AI response (status {response.status_code})"
                    
        except httpx.TimeoutException:
            return "Error: AI request timed out. Please try again."
        except httpx.ConnectError:
            return "Error: Unable to connect to AI service. Please ensure Ollama is running."
        except Exception as e:
            return f"Error: {str(e)}"
    
    def _call_ollama_sync(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Synchronous version of Ollama call"""
        try:
            with httpx.Client(timeout=self.timeout) as client:
                messages = []
                
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                
                messages.append({"role": "user", "content": prompt})
                
                response = client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": messages,
                        "stream": False
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("message", {}).get("content", "")
                else:
                    return f"Error: Unable to get AI response (status {response.status_code})"
                    
        except httpx.TimeoutException:
            return "Error: AI request timed out. Please try again."
        except httpx.ConnectError:
            return "Error: Unable to connect to AI service. Please ensure Ollama is running."
        except Exception as e:
            return f"Error: {str(e)}"
    
    def generate_summary(self, work_data: List[Dict[str, Any]], period: str) -> str:
        """Generate an AI summary for work entries"""
        if not work_data:
            return "No work entries found for this period."
        
        # Prepare work data for the prompt
        work_text = "\n".join([
            f"- {w.get('title', 'Untitled')}: {w.get('description', 'No description')[:200]}"
            for w in work_data[:20]  # Limit to 20 entries
        ])
        
        system_prompt = """You are a helpful work management assistant. 
        Analyze the provided work entries and generate a concise, professional summary.
        Focus on key accomplishments, patterns, and insights."""
        
        prompt = f"""Please analyze the following work entries for {period} and provide:
1. A brief summary (2-3 sentences)
2. Key accomplishments
3. Any notable patterns

Work Entries:
{work_text}"""
        
        return self._call_ollama_sync(prompt, system_prompt)
    
    def generate_insights(self, stats: Dict[str, Any]) -> List[str]:
        """Generate AI insights from statistics"""
        system_prompt = """You are a productivity analyst. 
        Provide 3-5 brief, actionable insights based on the work statistics provided.
        Each insight should be one sentence."""
        
        prompt = f"""Based on these work statistics, provide insights:
- Total tasks: {stats.get('total', 0)}
- Completed: {stats.get('completed', 0)}
- Completion rate: {stats.get('completion_rate', 0)}%
- Time spent: {stats.get('total_time', 0)} minutes
- Most common category: {stats.get('top_category', 'N/A')}

Provide 3-5 brief insights."""
        
        response = self._call_ollama_sync(prompt, system_prompt)
        
        # Parse response into list of insights
        if response.startswith("Error:"):
            return [response]
        
        insights = [line.strip() for line in response.split('\n') if line.strip()]
        return insights[:5]  # Return max 5 insights
    
    def generate_recommendations(self, context: Dict[str, Any]) -> List[str]:
        """Generate AI recommendations for productivity improvement"""
        system_prompt = """You are a productivity coach. 
        Provide 3-5 specific, actionable recommendations based on the work patterns provided.
        Each recommendation should be practical and concise."""
        
        prompt = f"""Based on this work context, provide recommendations:
- Average tasks per day: {context.get('avg_tasks', 0)}
- Deferred tasks: {context.get('deferred', 0)}
- Completion rate: {context.get('completion_rate', 0)}%
- Working pattern: {context.get('pattern', 'N/A')}

Provide 3-5 actionable recommendations."""
        
        response = self._call_ollama_sync(prompt, system_prompt)
        
        if response.startswith("Error:"):
            return [response]
        
        recommendations = [line.strip() for line in response.split('\n') if line.strip()]
        return recommendations[:5]
    
    def chat(self, message: str, session_id: Optional[UUID] = None, context: Optional[str] = None) -> ChatResponse:
        """Process a chat message and return AI response"""
        # Create or use existing session
        if not session_id:
            session_id = uuid.uuid4()
        
        # Get chat history for context
        history = self.get_chat_history(session_id, limit=10)
        
        # Check if this is a help request
        is_help_request = message.startswith("[HELP REQUEST]")
        if is_help_request:
            message = message.replace("[HELP REQUEST]", "").strip()
        
        # Build comprehensive system prompt
        system_prompt = """You are an AI assistant for the FY Work Management application.
        
**Application Overview:**
FY Work Management helps users track and manage their work on a fiscal year basis with quarters, sprints, and daily work entries.

**Key Features:**

1. **Quarters**: The fiscal year is divided into 4 quarters (Q1-Q4). Each quarter spans 3 months.

2. **Sprints**: 
   - 2-week work periods (14 calendar days = 10 working days + 4 weekend days)
   - Each year has 26 sprints
   - Sprints belong to quarters (Hierarchy: FY → Quarter → Sprint)
   - Can set sprint goals and track working days

3. **Work Entries**:
   - Daily logs of actual work completed
   - Must select: Quarter → Sprint → Date (hierarchical workflow)
   - Include: title, description, category, tags, time spent, priority, status
   - Date must be within the selected sprint's date range
   - Can attach files and add notes

4. **Planned Tasks**:
   - Tasks planned for sprints or specific weeks
   - Must select: Quarter → Sprint → Target Date
   - Include: title, description, estimated hours, story points, priority, status
   - Target date must be within sprint dates
   - Can track: planned, in_progress, completed, deferred, cancelled

5. **Holidays**: Mark national holidays and days off on the calendar

6. **Summaries**:
   - AI-generated summaries (daily, weekly, monthly, quarterly, sprint-wise, yearly)
   - Shows planned vs actual work metrics
   - Category breakdowns and insights
   - Beautifully rendered in markdown format

7. **Calendar View**: Visual representation of work, holidays, and planned tasks

8. **Dashboard**: 
   - Stats overview (total entries, time logged, completion rate)
   - Sprint progress
   - Recent tasks
   - AI chat for questions

**Validation Rules:**
- Sprint dates must be within quarter dates
- Work entry dates must be within sprint dates
- Planned task target dates must be within sprint dates
- Titles: minimum 3 characters
- Descriptions: minimum 10 characters
- Time spent: maximum 24 hours (1440 minutes)
- Story points: maximum 100
- Estimated hours: maximum 200

**How to Use:**
1. Start by viewing the Dashboard to see your current status
2. Configure Quarters and Sprints in Settings
3. Create Work Entries for completed work (follow Quarter → Sprint → Date flow)
4. Plan Tasks for upcoming sprints
5. View Summaries to get AI insights
6. Use Calendar to visualize your work timeline

Be helpful, friendly, and provide step-by-step guidance when needed. Use markdown formatting for better readability."""
        
        if context:
            system_prompt += f"\n\n**Additional Context:**\n{context}"
        
        if is_help_request:
            system_prompt += "\n\n**Note:** The user needs help understanding or using the application. Provide clear, step-by-step guidance."
        
        # Build conversation history for context
        conversation = ""
        for msg in history:
            role = "User" if msg.role == "user" else "Assistant"
            conversation += f"{role}: {msg.message}\n"
        
        prompt = f"{conversation}User: {message}\nAssistant:"
        
        # Get AI response
        ai_response = self._call_ollama_sync(prompt, system_prompt)
        
        # Save user message to history (without the [HELP REQUEST] marker)
        user_chat = ChatHistory(
            session_id=session_id,
            role="user",
            message=message
        )
        self.db.add(user_chat)
        
        # Save AI response to history
        assistant_chat = ChatHistory(
            session_id=session_id,
            role="assistant",
            message=ai_response
        )
        self.db.add(assistant_chat)
        
        self.db.commit()
        
        return ChatResponse(
            session_id=session_id,
            message=message,
            response=ai_response,
            created_at=datetime.utcnow()
        )
    
    def get_chat_history(self, session_id: UUID, limit: int = 50) -> List[ChatHistory]:
        """Get chat history for a session"""
        return self.db.query(ChatHistory)\
            .filter(ChatHistory.session_id == session_id)\
            .order_by(ChatHistory.created_at)\
            .limit(limit)\
            .all()
    
    def get_all_sessions(self) -> List[UUID]:
        """Get all unique chat session IDs"""
        results = self.db.query(ChatHistory.session_id)\
            .distinct()\
            .all()
        return [r[0] for r in results]
    
    def delete_chat_history(self, session_id: UUID) -> bool:
        """Delete chat history for a session"""
        deleted = self.db.query(ChatHistory)\
            .filter(ChatHistory.session_id == session_id)\
            .delete()
        self.db.commit()
        return deleted > 0
