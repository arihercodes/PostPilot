# PostPilot - Social Media Automation (v2)

A FastAPI-powered web app for AI-generated Instagram/Facebook content.

## Project Structure

```
socialmedia/
├── main.py                  # FastAPI backend + all API routes
├── config.json              # Image layout config (logo position, aspect ratio)
├── requirements.txt
├── .env                     # Your API keys (copy from .env.example)
├── .env.example
├── static/
│   ├── index.html           # Single-page multi-step UI
│   ├── css/style.css
│   └── js/app.js
├── images_generated/        # Auto-created — stores generated images
└── uploaded_logos/          # Auto-created — stores uploaded logos
```

## Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Copy and fill in your API keys
cp .env.example .env

# 3. Run the app
uvicorn main:app --reload --port 8000
```

Then open http://localhost:8000 in your browser.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Serves the frontend |
| POST | `/api/upload-logo` | Upload brand logo |
| GET | `/api/topics` | Fetch live event + news headline |
| POST | `/api/post-ideas` | Generate 3 post idea titles |
| POST | `/api/generate-images` | Generate 3 images via OpenAI |
| POST | `/api/generate-captions` | Generate captions from images |
| POST | `/api/publish` | Upload to Catbox + post to IG/FB |

## Environment Variables

| Key | Required | Description |
|-----|----------|-------------|
| `OPENAI_API_KEY` | Yes | For text + image generation |
| `GNEWS_API_KEY` | Optional | Live news headlines |
| `INSTAGRAM_ACCESS_TOKEN` | Optional | For Instagram publishing |
| `FACEBOOK_ACCESS_TOKEN` | Optional | For Facebook publishing |
