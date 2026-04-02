# Social Media Automation (v1)

A terminal-based AI pipeline that generates branded social media content and auto-posts to Instagram or Facebook - from idea to publish, in one run.

## Features
1. **Collects brand profile** interactively via the terminal
2. **Asks for brand's content goal** - Branding, Product Promotion, Audience Engagement, or Talent Acquisition
3. **Fetches context** - any upcoming Indian event (via GPT-4o) or a live news headline (via GNews API)
4. **Generates 3 post ideas** tailored to the goal, post type, and selected topic
5. **Generates 3 images** using OpenAI's image generation tool for the chosen idea
6. **Generates 3 captions** by reading the images with GPT-4o vision
7. **Saves everything** - all ideas, images, and captions - to a `.docx` summary file
8. **Posts to Instagram or Facebook** automatically using the Meta Graph API

## Project Structure

```
social-media-automation/
│
├── main.py              # Full pipeline
├── config.json          # Image layout config (logo/text position, aspect ratio)
├── requirements.txt     # Python dependencies
├── .env.example         # Template for your secret keys
├── .gitignore
└── README.md
```

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/arihercodes/PostPilot.git
cd PostPilot
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Set up your environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

Then open `.env` and add your actual keys:

```env
OPENAI_API_KEY=your_openai_api_key_here
GNEWS_API_KEY=your_gnews_api_key_here
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token_here
```

### 4. Configure image layout

Edit `config.json` to customize logo/text placement and aspect ratio:

```json
{
  "logo_position": "bottom-left corner",
  "text_position": "bottom-center",
  "aspect_ratio": "1:1"
}
```

## Running the Pipeline

```bash
python main.py
```

You'll be guided through the full flow step by step in the terminal.


## API Keys You'll Need

| Key | Where to Get It |
|---|---|
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com/api-keys) |
| `GNEWS_API_KEY` | [gnews.io](https://gnews.io/) |
| `INSTAGRAM_ACCESS_TOKEN` | [Meta for Developers](https://developers.facebook.com/) — requires an Instagram Business account linked to a Facebook Page |
| `FACEBOOK_ACCESS_TOKEN` | Same as above - Page Access Token from Meta Graph API Explorer |


## Notes
- Generated images will be saved to `images_generated/`
- The `.docx` summary will be saved in the root directory
- Image hosting for publishing uses [Catbox.moe](https://catbox.moe/) - no account needed
- This pipeline uses `gpt-4o` for text and `gpt-4o` with image generation tool for visuals


## Built With

- [OpenAI API](https://platform.openai.com/) — GPT-4o for text + image generation
- [GNews API](https://gnews.io/) — Real-time Indian news headlines
- [Meta Graph API](https://developers.facebook.com/docs/graph-api/) — Instagram & Facebook publishing
- [python-docx](https://python-docx.readthedocs.io/) — Word document generation
- [Catbox.moe](https://catbox.moe/) — Temporary public image hosting for Meta API


## Author
**Ariana** · [@arihercodes](https://github.com/arihercodes)