import os
import base64
import datetime
import time
import json
import requests
import shutil
from openai import OpenAI
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv
from database import Base, engine
from routes import auth_routes
Base.metadata.create_all(bind=engine)

app.include_router(auth_routes.router, prefix="/auth")
load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI(title="Social Media Automation")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

IMAGES_DIR = "images_generated"
LOGOS_DIR = "uploaded_logos"
os.makedirs(IMAGES_DIR, exist_ok=True)
os.makedirs(LOGOS_DIR, exist_ok=True)

app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")
app.mount("/static", StaticFiles(directory="static"), name="static")

def load_config():
    with open("config.json") as f:
        return json.load(f)

class BrandData(BaseModel):
    brand_name: str
    tagline: str
    brand_story: str
    founder_info: Optional[str] = ""
    unique_value_proposition: List[str] = []
    brand_values: List[str] = []
    brand_accomplishments: List[str] = []
    products: List[str] = []
    services: List[str] = []
    logo_path: Optional[str] = None

class PostIdeasRequest(BaseModel):
    brand_data: BrandData
    user_goal: str
    brand_description: str
    post_type: str
    selected_topic: str

class GenerateImagesRequest(BaseModel):
    brand_data: BrandData
    system_prompt: str
    selected_idea: str
    post_type: str
    relevant_info: str

class GenerateCaptionsRequest(BaseModel):
    image_paths: List[str]
    selected_idea: str
    brand_name: str

class PublishRequest(BaseModel):
    image_path: str
    caption: str
    platform: str

def extract_post_specific_info(post_type: str, brand_data: BrandData) -> str:
    pt = post_type.lower()
    if "unique selling" in pt or "unique value" in pt:
        return "Unique Selling Points: " + "; ".join(brand_data.unique_value_proposition)
    elif "brand story" in pt:
        return "Brand Story: " + brand_data.brand_story
    elif "founder" in pt:
        return "Founder Insight: " + (brand_data.founder_info or "")
    elif "milestone" in pt:
        return "Brand Milestones: " + "; ".join(brand_data.brand_accomplishments)
    elif "brand value" in pt:
        return "Brand Values: " + "; ".join(brand_data.brand_values)
    elif "product selling" in pt:
        return "Products we offer: " + "; ".join(brand_data.products)
    elif "services" in pt:
        return "Services we offer: " + "; ".join(brand_data.services)
    else:
        return "Key Info: " + brand_data.tagline


def upload_to_catbox(image_path: str) -> Optional[str]:
    try:
        with open(image_path, "rb") as f:
            response = requests.post(
                "https://catbox.moe/user/api.php",
                data={"reqtype": "fileupload"},
                files={"fileToUpload": f},
                timeout=30,
            )
            if response.status_code == 200:
                return response.text.strip()
    except Exception as e:
        print(f"[Catbox Error] {e}")
    return None


@app.get("/")
def index():
    return FileResponse("static/index.html")

@app.post("/api/upload-logo")
async def upload_logo(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in (".png", ".jpg", ".jpeg"):
        raise HTTPException(400, "Only PNG/JPG logos are accepted.")
    save_path = os.path.join(LOGOS_DIR, f"logo{ext}")
    with open(save_path, "wb") as out:
        shutil.copyfileobj(file.file, out)
    return {"logo_path": save_path}

@app.get("/api/topics")
def get_topics():
    today = datetime.date.today().strftime("%B %d, %Y")

    news_headline = "No news headline found"
    api_key = os.getenv("GNEWS_API_KEY")
    if api_key:
        try:
            resp = requests.get(
                f"https://gnews.io/api/v4/top-headlines?lang=en&country=in&max=1&apikey={api_key}",
                timeout=10,
            )
            if resp.status_code == 200:
                articles = resp.json().get("articles", [])
                if articles:
                    news_headline = articles[0]["title"]
        except Exception:
            pass

    upcoming_event = "No event found"
    try:
        prompt = (
            f"Today is {today}. Suggest one upcoming Indian event or holiday that is on or after today "
            f"(not before). It must occur within the next 14 days. Format: 'Event Name' only."
        )
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
        )
        upcoming_event = resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"[Event Error] {e}")

    return {"event": upcoming_event, "news": news_headline}


@app.post("/api/post-ideas")
def post_ideas(req: PostIdeasRequest):
    relevant_info = extract_post_specific_info(req.post_type, req.brand_data)

    system_prompt = (
        f"You are a creative director for a wellness brand called '{req.brand_data.brand_name}'.\n"
        f"The brand offers: {', '.join(req.brand_data.services)} and products like: {', '.join(req.brand_data.products)}.\n\n"
        f"Your job is to create **static Instagram post ideas** (not reels or stories).\n"
        f"Each idea must be suitable for a '{req.post_type}' format.\n"
        f"Here is more context based on post_type '{req.post_type}':\n{relevant_info}\n"
        f"The goal of this content is: '{req.user_goal}'.\n"
        f"The post must relate to this event/topic: {req.selected_topic}.\n"
        f"Use the brand description and tone given in {req.brand_description} to guide your suggestions:\n\n"
        f"ONLY return 3 short Instagram post **titles** (do not describe the image or explain anything).\n"
        f"Make sure each idea fits both the topic AND the post type.\n"
        f"Return the titles as a simple numbered list of strings.\n"
    )

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": system_prompt}],
    )
    post_text = response.choices[0].message.content.strip()
    ideas = [line.strip() for line in post_text.split("\n") if line.strip().startswith(("1.", "2.", "3."))]

    return {"ideas": ideas, "system_prompt": system_prompt, "relevant_info": relevant_info}


@app.post("/api/generate-images")
def generate_images(req: GenerateImagesRequest):
    config = load_config()
    brand_data = req.brand_data
    image_paths = []
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

    logo_path = brand_data.logo_path
    logo_base64 = None
    logo_media_type = "image/png"

    if logo_path and os.path.exists(logo_path):
        ext = os.path.splitext(logo_path)[1].lower()
        logo_media_type = "image/jpeg" if ext in (".jpg", ".jpeg") else "image/png"
        with open(logo_path, "rb") as f:
            logo_base64 = base64.b64encode(f.read()).decode("utf-8")
        logo_instruction = f"- Place the brand logo (shown in the reference image) at the {config['logo_position']}. Reproduce it faithfully — do not alter its shape or design."
    else:
        logo_instruction = f"- The brand has no logo uploaded. Leave the {config['logo_position']} clean or add a simple minimal placeholder that fits the brand aesthetic."

    for i in range(3):
        filename = f"{brand_data.brand_name.lower().replace(' ', '_')}_image_{timestamp}_{i+1}.png"
        image_path = os.path.join(IMAGES_DIR, filename)

        prompt_text = (
            f"{req.system_prompt}\n\n"
            f"You are designing a static Instagram image for the brand '{brand_data.brand_name}'.\n"
            f"Post Type: {req.post_type}\n"
            f"Post Idea Title: '{req.selected_idea}'\n"
            f"Base your image ONLY on this info:\n{req.relevant_info}\n\n"
            f"Use relevant colours to make the image eye-catching.\n"
            f"{logo_instruction}\n"
            f"- Add the brand name '{brand_data.brand_name}' at {config['text_position']}.\n"
            f"- Style must match the theme: {req.post_type}.\n"
            f"- Maintain an aspect ratio of {config['aspect_ratio']}.\n"
            f"- Avoid listing generic services or all products unless that is the post type.\n"
        )

        if logo_base64:
            api_input = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_image",
                            "source": {
                                "type": "base64",
                                "media_type": logo_media_type,
                                "data": logo_base64,
                            },
                        },
                        {"type": "input_text", "text": prompt_text},
                    ],
                }
            ]
        else:
            api_input = prompt_text

        try:
            response = client.responses.create(
                model="gpt-4o",
                input=api_input,
                tools=[{"type": "image_generation"}],
            )
            image_data = [output.result for output in response.output if output.type == "image_generation_call"]
            if image_data:
                with open(image_path, "wb") as f:
                    f.write(base64.b64decode(image_data[0]))
                image_paths.append(f"/images/{filename}")
        except Exception as e:
            print(f"[Image Gen Error] {e}")

    return {"image_paths": image_paths}


@app.post("/api/generate-captions")
def generate_captions(req: GenerateCaptionsRequest):
    captions = []
    for path in req.image_paths:
        fs_path = path.replace("/images/", f"{IMAGES_DIR}/")
        if not os.path.exists(fs_path):
            captions.append("Caption generation failed — image not found.")
            continue

        with open(fs_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")

        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
                            {
                                "type": "text",
                                "text": (
                                    f"This is an Instagram image for a brand called {req.brand_name}. "
                                    f"Topic: {req.selected_idea}. Generate a creative, relatable caption "
                                    f"in max 20 words, suitable for this image. Add 3-4 popular and relevant hashtags."
                                ),
                            },
                        ],
                    }
                ],
            )
            captions.append(response.choices[0].message.content.strip())
        except Exception as e:
            captions.append(f"Caption error: {e}")

    return {"captions": captions}


@app.post("/api/publish")
def publish(req: PublishRequest):
    fs_path = req.image_path.replace("/images/", f"{IMAGES_DIR}/")
    if not os.path.exists(fs_path):
        raise HTTPException(404, "Image file not found.")

    image_url = upload_to_catbox(fs_path)
    if not image_url:
        raise HTTPException(500, "Failed to upload image to Catbox.")

    if req.platform == "instagram":
        token = os.getenv("INSTAGRAM_ACCESS_TOKEN")
        if not token:
            raise HTTPException(400, "INSTAGRAM_ACCESS_TOKEN not set in .env")
        _publish_instagram(image_url, req.caption, token)

    elif req.platform == "facebook":
        token = os.getenv("FACEBOOK_ACCESS_TOKEN")
        if not token:
            raise HTTPException(400, "FACEBOOK_ACCESS_TOKEN not set in .env")
        _publish_facebook(image_url, req.caption, token)

    else:
        raise HTTPException(400, "Invalid platform. Use 'instagram' or 'facebook'.")

    return {"success": True, "image_url": image_url}


def _publish_instagram(image_url, caption, access_token):
    accounts = requests.get(
        "https://graph.facebook.com/v23.0/me/accounts",
        params={"access_token": access_token},
    ).json()
    page_id = accounts["data"][0]["id"]
    ig_data = requests.get(
        f"https://graph.facebook.com/v23.0/{page_id}",
        params={"fields": "instagram_business_account", "access_token": access_token},
    ).json()
    ig_id = ig_data["instagram_business_account"]["id"]
    creation_res = requests.post(
        f"https://graph.facebook.com/v23.0/{ig_id}/media",
        data={"image_url": image_url, "caption": caption, "access_token": access_token},
    ).json()
    creation_id = creation_res.get("id")
    if creation_id:
        time.sleep(3)
        requests.post(
            f"https://graph.facebook.com/v23.0/{ig_id}/media_publish",
            data={"creation_id": creation_id, "access_token": access_token},
        )


def _publish_facebook(image_url, caption, access_token):
    accounts = requests.get(
        "https://graph.facebook.com/v23.0/me/accounts",
        params={"access_token": access_token},
    ).json()
    page_id = accounts["data"][0]["id"]
    requests.post(
        f"https://graph.facebook.com/v23.0/{page_id}/photos",
        data={"url": image_url, "caption": caption, "access_token": access_token},
    )
