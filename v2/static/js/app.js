const state = {
  brandData: {},
  userGoal: null,
  brandDescription: "",
  postType: "",
  selectedTopic: null,
  topicData: { event: "", news: "" },
  ideas: [],
  systemPrompt: "",
  relevantInfo: "",
  selectedIdeaIndex: null,
  imagePaths: [],
  selectedImagePath: null,
  captions: [],
  selectedCaption: null,
  selectedPlatform: null,
};

const tagData = {
  uvp:             { wrap: "uvp-wrap",             input: "uvp-input",             items: [] },
  values:          { wrap: "values-wrap",           input: "values-input",          items: [] },
  accomplishments: { wrap: "accomplishments-wrap",  input: "accomplishments-input", items: [] },
  products:        { wrap: "products-wrap",         input: "products-input",        items: [] },
  services:        { wrap: "services-wrap",         input: "services-input",        items: [] },
};

Object.entries(tagData).forEach(([key, cfg]) => {
  const wrap = document.getElementById(cfg.wrap);
  const inp  = document.getElementById(cfg.input);

  wrap.addEventListener("click", () => inp.focus());

  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && inp.value.trim()) {
      e.preventDefault();
      cfg.items.push(inp.value.trim());
      inp.value = "";
      renderTags(key);
    }
    if (e.key === "Backspace" && !inp.value && cfg.items.length) {
      cfg.items.pop();
      renderTags(key);
    }
  });
});

function renderTags(key) {
  const cfg  = tagData[key];
  const wrap = document.getElementById(cfg.wrap);
  const inp  = document.getElementById(cfg.input);
  wrap.querySelectorAll(".tag").forEach(t => t.remove());
  cfg.items.forEach((item, i) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.innerHTML = `${item} <button onclick="removeTag('${key}', ${i})">×</button>`;
    wrap.insertBefore(tag, inp);
  });
}

function removeTag(key, idx) {
  tagData[key].items.splice(idx, 1);
  renderTags(key);
}

const logoZone = document.getElementById("logo-drop-zone");
const logoFile = document.getElementById("logo-file");
const logoName = document.getElementById("logo-name");

logoZone.addEventListener("click", () => logoFile.click());
logoFile.addEventListener("change", () => {
  if (logoFile.files[0]) logoName.textContent = logoFile.files[0].name;
});
logoZone.addEventListener("dragover",  e => { e.preventDefault(); logoZone.classList.add("dragging"); });
logoZone.addEventListener("dragleave", ()  => logoZone.classList.remove("dragging"));
logoZone.addEventListener("drop",      e => {
  e.preventDefault();
  logoZone.classList.remove("dragging");
  logoFile.files = e.dataTransfer.files;
  if (logoFile.files[0]) logoName.textContent = logoFile.files[0].name;
});

function goToStep(n) {
  document.querySelectorAll(".step-panel").forEach(p => p.classList.remove("active"));
  document.getElementById(`step-${n}`).classList.add("active");

  document.querySelectorAll(".step-item").forEach(item => {
    const s = parseInt(item.dataset.step);
    item.classList.remove("active", "done");
    if (s === n)   item.classList.add("active");
    if (s < n)     item.classList.add("done");
  });

  document.querySelector(".main").scrollTo({ top: 0, behavior: "smooth" });
}

async function goToStep2() {
  const brandName = document.getElementById("brand_name").value.trim();
  if (!brandName) { alert("Brand name is required."); return; }

  let logoPath = null;
  if (logoFile.files[0]) {
    const form = new FormData();
    form.append("file", logoFile.files[0]);
    const res = await fetch("/api/upload-logo", { method: "POST", body: form });
    if (res.ok) {
      const data = await res.json();
      logoPath = data.logo_path;
    }
  }

  state.brandData = {
    brand_name:               brandName,
    tagline:                  document.getElementById("tagline").value.trim(),
    brand_story:              document.getElementById("brand_story").value.trim(),
    founder_info:             document.getElementById("founder_info").value.trim(),
    unique_value_proposition: [...tagData.uvp.items],
    brand_values:             [...tagData.values.items],
    brand_accomplishments:    [...tagData.accomplishments.items],
    products:                 [...tagData.products.items],
    services:                 [...tagData.services.items],
    logo_path:                logoPath,
  };

  goToStep(2);
}

document.querySelectorAll(".goal-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".goal-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    state.userGoal = card.dataset.goal;
    renderSubForm(state.userGoal);
  });
});

function renderSubForm(goal) {
  const el = document.getElementById("sub-form");
  el.classList.remove("hidden");

  const fields = {
    "branding": [
      { id: "s_audience",   label: "Primary audience",  ph: "e.g. urban millennials" },
      { id: "s_tone",       label: "Brand tone",        ph: "e.g. Empathetic, Funny, Professional" },
      { id: "s_mission",    label: "Mission / vision",  ph: "Your long-term mission" },
      { id: "s_img_style",  label: "Post type",         ph: "Brand story post, Founder intro, Unique Value Post…", full: true },
    ],
    "product promotion": [
      { id: "s_product",    label: "Product name",      ph: "Name of the product" },
      { id: "s_benefits",   label: "Top benefits",      ph: "Key benefits of this product" },
      { id: "s_aud",        label: "Target audience",   ph: "Who is this mainly for?" },
      { id: "s_usage",      label: "Daily usage",       ph: "How is it used daily?" },
      { id: "s_value",      label: "Why buy?",          ph: "Unique reason to purchase" },
      { id: "s_tone",       label: "Tone",              ph: "e.g. Funny, Professional" },
      { id: "s_img_style",  label: "Post type",         ph: "Product selling post, How-to-use post…", full: true },
    ],
    "audience engagement": [
      { id: "s_aud_type",   label: "Audience type",     ph: "e.g. stressed professionals, fitness lovers" },
      { id: "s_aud_age",    label: "Age group",         ph: "e.g. 25–35" },
      { id: "s_tone",       label: "Tone",              ph: "e.g. Funny, Empathetic" },
      { id: "s_img_style",  label: "Post format",       ph: "Poll, Question post, Meme, Giveaway…", full: true },
      { id: "s_eng_type",   label: "Engagement goal",   ph: "likes, comments, shares, DMs, saves" },
    ],
    "talent acquisition": [
      { id: "s_position",   label: "Position",          ph: "e.g. Senior Designer" },
      { id: "s_team",       label: "Team / department", ph: "e.g. Marketing" },
      { id: "s_skills",     label: "Key skills",        ph: "Skills or experience required" },
      { id: "s_tone",       label: "Tone",              ph: "e.g. Inspiring, Friendly, Professional" },
      { id: "s_img_style",  label: "Post type",         ph: "Join Us post, We Are Hiring banner…", full: true },
    ],
  };

  el.innerHTML = fields[goal].map(f => `
    <div class="field ${f.full ? "full" : ""}">
      <label>${f.label}</label>
      <input type="text" id="${f.id}" placeholder="${f.ph}" />
    </div>
  `).join("");
}

function buildBrandDescription() {
  const g = state.userGoal;
  if (g === "branding") {
    const audience    = v("s_audience");
    const tone        = v("s_tone");
    const mission     = v("s_mission");
    const image_style = v("s_img_style");
    state.postType    = image_style;
    return `Audience: ${audience} Tone: ${tone}. Mission: ${mission}. post_type: ${image_style}.`;
  }
  if (g === "product promotion") {
    const product     = v("s_product");
    const benefits    = v("s_benefits");
    const audience    = v("s_aud");
    const usage       = v("s_usage");
    const value       = v("s_value");
    const tone        = v("s_tone");
    const image_style = v("s_img_style");
    state.postType    = image_style;
    return `Product: ${product}. Benefits: ${benefits}. Audience: ${audience}. Usage: ${usage}. Value: ${value}. Tone: ${tone}. post_type: ${image_style}.`;
  }
  if (g === "audience engagement") {
    const aud_type    = v("s_aud_type");
    const aud_age     = v("s_aud_age");
    const tone        = v("s_tone");
    const image_style = v("s_img_style");
    const eng_type    = v("s_eng_type");
    state.postType    = image_style;
    return `Audience_Type: ${aud_type}. Audience_Age: ${aud_age}. Tone: ${tone}. post_type: ${image_style}. Engagement_Type: ${eng_type}`;
  }
  if (g === "talent acquisition") {
    const position    = v("s_position");
    const team        = v("s_team");
    const skills      = v("s_skills");
    const tone        = v("s_tone");
    const image_style = v("s_img_style");
    state.postType    = image_style;
    return `Hiring for: ${position} in ${team} team. Required: ${skills}. Tone: ${tone}. Post Type: ${image_style}`;
  }
  return "";
}

function v(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

async function goToStep3() {
  if (!state.userGoal) { alert("Please select a content goal."); return; }
  state.brandDescription = buildBrandDescription();
  if (!state.postType)   { alert("Please fill in the post type field."); return; }

  goToStep(3);
  fetchTopics();
}

async function fetchTopics() {
  document.getElementById("topics-loading").classList.remove("hidden");
  document.getElementById("topic-cards").classList.add("hidden");

  try {
    const res  = await fetch("/api/topics");
    const data = await res.json();
    state.topicData.event = data.event;
    state.topicData.news  = data.news;

    document.getElementById("topic-event-text").textContent = data.event;
    document.getElementById("topic-news-text").textContent  = data.news;
  } catch (e) {
    console.error(e);
  } finally {
    document.getElementById("topics-loading").classList.add("hidden");
    document.getElementById("topic-cards").classList.remove("hidden");
  }
}

document.querySelectorAll(".topic-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".topic-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    const type = card.dataset.type;
    if (type === "event")  state.selectedTopic = state.topicData.event;
    if (type === "news")   state.selectedTopic = state.topicData.news;
    if (type === "custom") {
      document.getElementById("custom-topic-input").focus();
      state.selectedTopic = null;
    }
  });
});

document.getElementById("custom-topic-input").addEventListener("input", e => {
  state.selectedTopic = e.target.value.trim() || null;
});

async function goToStep4() {
  if (!state.selectedTopic) {
    const custom = document.getElementById("custom-topic-input").value.trim();
    if (!custom) { alert("Please select or enter a topic."); return; }
    state.selectedTopic = custom;
  }

  goToStep(4);

  const loading   = document.getElementById("ideas-loading");
  const ideasList = document.getElementById("ideas-list");
  loading.classList.remove("hidden");
  ideasList.innerHTML = "";

  try {
    const res = await fetch("/api/post-ideas", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand_data:        state.brandData,
        user_goal:         state.userGoal,
        brand_description: state.brandDescription,
        post_type:         state.postType,
        selected_topic:    state.selectedTopic,
      }),
    });
    const data = await res.json();
    state.ideas        = data.ideas;
    state.systemPrompt = data.system_prompt;
    state.relevantInfo = data.relevant_info;
    renderIdeas();
  } catch (e) {
    ideasList.innerHTML = `<p style="color:var(--error)">Failed to generate ideas. Check your API key and try again.</p>`;
  } finally {
    loading.classList.add("hidden");
  }
}

function renderIdeas() {
  const list = document.getElementById("ideas-list");
  list.innerHTML = "";
  state.ideas.forEach((idea, i) => {
    const card = document.createElement("div");
    card.className = "idea-card";
    card.innerHTML = `<div class="idea-num">0${i + 1}</div><div class="idea-text">${idea}</div>`;
    card.addEventListener("click", () => {
      document.querySelectorAll(".idea-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      state.selectedIdeaIndex = i;
    });
    list.appendChild(card);
  });
}

async function goToStep5() {
  if (state.selectedIdeaIndex === null) { alert("Please select a post idea."); return; }

  goToStep(5);

  const loading    = document.getElementById("images-loading");
  const grid       = document.getElementById("images-grid");
  const captionSec = document.getElementById("caption-section");
  loading.classList.remove("hidden");
  grid.innerHTML = "";
  captionSec.classList.add("hidden");
  document.getElementById("captions-list").innerHTML = "";
  state.imagePaths = [];
  state.captions   = [];

  try {
    const res = await fetch("/api/generate-images", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand_data:    state.brandData,
        system_prompt: state.systemPrompt,
        selected_idea: state.ideas[state.selectedIdeaIndex],
        post_type:     state.postType,
        relevant_info: state.relevantInfo,
      }),
    });
    const data = await res.json();
    state.imagePaths = data.image_paths;
    renderImages();
    captionSec.classList.remove("hidden");
  } catch (e) {
    grid.innerHTML = `<p style="color:var(--error)">Image generation failed. Check API keys.</p>`;
  } finally {
    loading.classList.add("hidden");
  }
}

function renderImages() {
  const grid = document.getElementById("images-grid");
  grid.innerHTML = "";
  state.imagePaths.forEach((path, i) => {
    const card = document.createElement("div");
    card.className = "image-card";
    card.innerHTML = `
      <img src="${path}?t=${Date.now()}" alt="Generated image ${i + 1}" loading="lazy" />
      <div class="image-card-label">
        <span>Image ${i + 1}</span>
        <span class="check-icon">✓</span>
      </div>
    `;
    card.addEventListener("click", () => {
      document.querySelectorAll(".image-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      state.selectedImagePath = path;
    });
    grid.appendChild(card);
  });
}

async function generateCaptions() {
  const btn = document.getElementById("gen-captions-btn");
  btn.disabled = true;

  const loading = document.getElementById("captions-loading");
  loading.classList.remove("hidden");

  try {
    const res = await fetch("/api/generate-captions", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_paths:   state.imagePaths,
        selected_idea: state.ideas[state.selectedIdeaIndex],
        brand_name:    state.brandData.brand_name,
      }),
    });
    const data = await res.json();
    state.captions = data.captions;
    renderCaptions();
  } catch (e) {
    document.getElementById("captions-list").innerHTML = `<p style="color:var(--error)">Caption generation failed.</p>`;
  } finally {
    loading.classList.add("hidden");
  }
}

function renderCaptions() {
  const list = document.getElementById("captions-list");
  list.innerHTML = "";
  state.captions.forEach((cap, i) => {
    const item = document.createElement("div");
    item.className = "caption-item";
    item.innerHTML = `<div class="caption-num">${i + 1}</div><div class="caption-text">${cap}</div>`;
    item.addEventListener("click", () => {
      document.querySelectorAll(".caption-item").forEach(c => c.classList.remove("selected"));
      item.classList.add("selected");
      state.selectedCaption = cap;
    });
    list.appendChild(item);
  });
}

function goToStep6() {
  if (!state.selectedImagePath) { alert("Please select an image."); return; }

  goToStep(6);

  document.getElementById("publish-image-preview").src = state.selectedImagePath;
  document.getElementById("publish-caption").value     = state.selectedCaption || "";
  document.getElementById("publish-result").classList.add("hidden");
}

document.querySelectorAll(".platform-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".platform-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.selectedPlatform = btn.dataset.platform;
  });
});

async function publish() {
  if (!state.selectedPlatform) { alert("Please select a platform."); return; }
  const caption = document.getElementById("publish-caption").value.trim();
  if (!caption) { alert("Please enter or generate a caption."); return; }

  const loading = document.getElementById("publish-loading");
  const result  = document.getElementById("publish-result");
  loading.classList.remove("hidden");
  result.classList.add("hidden");

  try {
    const res = await fetch("/api/publish", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_path: state.selectedImagePath,
        caption,
        platform:   state.selectedPlatform,
      }),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      result.className = "publish-result success";
      result.innerHTML = `✅ Published successfully to ${state.selectedPlatform}!<br><small style="opacity:0.7">Image URL: ${data.image_url}</small>`;
    } else {
      throw new Error(data.detail || "Publish failed");
    }
  } catch (e) {
    result.className = "publish-result error";
    result.textContent = `❌ ${e.message}`;
  } finally {
    loading.classList.add("hidden");
    result.classList.remove("hidden");
  }
}

function startOver() {
  location.reload();
}
