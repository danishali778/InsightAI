# InsightAI 🧠📊

A Text-to-SQL Business Intelligence Dashboard powered by Multi-Agent AI.

**Ask questions in plain English → Get SQL queries → See visualizations**

![Python](https://img.shields.io/badge/Python-3.11+-blue)
![React](https://img.shields.io/badge/React-18+-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6)

## ✨ Features

- 🤖 **Multi-Agent System**: Specialized AI agents for SQL generation, data analysis, and chart selection
- 📊 **15+ Chart Types**: Bar, Line, Pie, Radar, Scatter, Waterfall, Funnel, Stacked, Clustered, and more
- 🎨 **Smart Recommendations**: AI suggests best chart types based on your data
- 🔄 **Real-time Processing**: Stream-based updates with step-by-step logging
- 💡 **Natural Language**: Just ask questions like "Show revenue by category"

## 🏗️ Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | FastAPI, LangGraph, CrewAI |
| Frontend | React, Vite, TypeScript, Recharts |
| LLM | Groq (DeepSeek/Llama models) |
| Database | PostgreSQL |

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL database
- Groq API key

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys and database URL

# Run server
python main.py
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

### Access the App
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📝 Example Queries

```
Show total revenue by product category
Compare monthly sales and order count
Top 10 customers by total spending
Show order status distribution
```

## 📊 Supported Chart Types

| Chart | Best For |
|-------|----------|
| Bar / Clustered | Category comparison |
| Line / Area | Time series trends |
| Pie | Distribution/composition |
| Radar | Multi-metric comparison |
| Scatter | Correlation analysis |
| Stacked / 100% Stacked | Part-to-whole |
| Combo (Dual Y-Axis) | Two metrics, different scales |
| Waterfall | Cumulative changes |
| Funnel | Pipeline/conversion |
| Table | Detailed data view |

## 🔧 Configuration

Edit `backend/.env`:

```env
GROQ_API_KEY=your_key_here
GROQ_MODEL=deepseek-r1-distill-llama-70b
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

## 📁 Project Structure

```
P9/
├── backend/
│   ├── agents/           # AI agents (SQL, Chart, Data)
│   ├── services/         # LangGraph workflow
│   ├── business_logic/   # Database connections
│   └── main.py          # FastAPI server
├── frontend/
│   ├── src/components/   # React components
│   ├── src/services/     # API client
│   └── index.html
└── README.md
```

## 📄 License

MIT License
