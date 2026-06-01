const state = {
  screen: "home",
  category: null,
  question: null,
  mood: null,
  result: null,
  shareOpen: false,
  drawTimer: null,
  sessionId: getSessionId(),
  data: {
    categories: [],
    moods: [],
    signs: []
  }
};

const app = document.getElementById("app");
const runtimeConfig = getRuntimeConfig();
const assetBase = getAssetBase();

const themeMeta = {
  relationship: {
    tone: "relation",
    label: "没说出口的话",
    sticker: "hearts"
  },
  choice: {
    tone: "choice",
    label: "卡在两个答案之间",
    sticker: "signpost"
  },
  mood: {
    tone: "mood",
    label: "先把自己安顿一下",
    sticker: "cloud"
  }
};

const moodMeta = {
  overthinking: { sticker: "fire", step: "01" },
  hesitating: { sticker: "scale", step: "02" },
  tired: { sticker: "sleepyCup", step: "03" },
  steady: { sticker: "sprout", step: "04" }
};

initialize().catch((error) => {
  console.error(error);
  app.innerHTML = `<div class="empty-state">加载失败了，先刷新试试。</div>`;
});

async function initialize() {
  state.data = await loadContent();
  track("page_view", { page: "app" });
  track("home_view", { page: "home" });
  render();
}

async function loadContent() {
  const [categories, moods, signs] = await Promise.all([
    fetchJson(getAssetUrl("data/categories.json")),
    fetchJson(getAssetUrl("data/moods.json")),
    fetchJson(getAssetUrl("data/signs.json"))
  ]);

  return { categories, moods, signs };
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return response.json();
}

function getSessionId() {
  const key = "jinri_lingqian_session_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const created = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(key, created);
  return created;
}

function track(event, payload = {}) {
  if (!runtimeConfig.trackingEnabled) return;

  const body = {
    event,
    session_id: state.sessionId,
    timestamp: new Date().toISOString(),
    category: state.category?.key,
    question_id: state.question?.id,
    mood: state.mood?.key,
    sign_id: state.result?.id,
    sign_no: state.result?.no,
    ...payload
  };

  fetch(getApiUrl("track"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).catch(() => {});
}

function getRuntimeConfig() {
  const localHosts = new Set(["localhost", "127.0.0.1"]);
  return {
    trackingEnabled: localHosts.has(window.location.hostname)
  };
}

function getAssetBase() {
  return "./";
}

function getAssetUrl(path) {
  return new URL(`${assetBase}${path}`, window.location.href).toString();
}

function getApiUrl(path) {
  return new URL(`./api/${path}`, window.location.origin).toString();
}

function showScreen(screen) {
  if (state.drawTimer) {
    window.clearTimeout(state.drawTimer);
    state.drawTimer = null;
  }
  state.screen = screen;
  render();
}

function getCurrentDateText() {
  const now = new Date();
  const week = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][now.getDay()];
  return `${now.getMonth() + 1}月${now.getDate()}日 ${week}`;
}

function render() {
  app.innerHTML = `
    ${renderScreen("home", renderHome())}
    ${renderScreen("question", renderQuestions())}
    ${renderScreen("state", renderMoods())}
    ${renderScreen("draw", renderDraw())}
    ${renderScreen("drawing", renderDrawing())}
    ${renderScreen("result", renderResult())}
    ${renderShareModal()}
  `;

  bindEvents();
}

function renderScreen(screen, content) {
  const activeClass = state.screen === screen ? "screen active" : "screen";
  return `<section class="${activeClass}" data-screen="${screen}">${content}</section>`;
}

function renderHome() {
  return `
    ${renderMiniTopBar({ center: "今日灵签", right: "记录" })}
    <div class="home-hero">
      <div class="postmark postmark-home">LUCKY DAY</div>
      <div class="brand-title">
        <span class="brand-stamp">灵签</span>
        <h1>今日灵签</h1>
        <p>${getCurrentDateText()}</p>
      </div>
      <div class="headline-block">
        <h2>今天想先聊哪一块？</h2>
        <p>不替你拿主意，只想在你有点乱的时候，给你一句能听进去的话。</p>
      </div>
    </div>

    <div class="theme-grid">
      ${state.data.categories.map((category) => renderThemeCard(category)).join("")}
    </div>

    <div class="paper-speech">
      <span>不一定替你解答什么，<br>但也许能让你心里顺一点。</span>
      ${stickerSvg("dog", "speech-dog")}
    </div>
  `;
}

function renderThemeCard(category) {
  const meta = themeMeta[category.key] || themeMeta.mood;
  return `
    <button class="theme-card theme-${meta.tone} ghost-button" data-category="${category.key}">
      <div class="theme-sticker">${stickerSvg(meta.sticker)}</div>
      <strong>${category.title}</strong>
      <span>${meta.label}</span>
    </button>
  `;
}

function renderQuestions() {
  if (!state.category) return "";
  const meta = themeMeta[state.category.key] || themeMeta.mood;

  return `
    ${renderMiniTopBar({ back: "home", center: `${state.category.title}`, right: "1/3" })}
    <div class="section-head section-head-loose">
      <div class="page-sticker">${stickerSvg(meta.sticker)}</div>
      <p class="page-kicker">${state.category.eyebrow}</p>
      <h2>${state.category.title}</h2>
      <p>${state.category.subtitle}</p>
    </div>

    <div class="choice-list">
      ${state.category.questions.map((question, index) => `
        <button class="note-card ghost-button" data-question="${question.id}">
          <span class="note-index">0${index + 1}</span>
          <div>
            <strong>${question.title}</strong>
            <p>${question.hint}</p>
          </div>
          <span class="select-dot"></span>
        </button>
      `).join("")}
    </div>

    <div class="page-foot">选一句最像你现在的话。</div>
  `;
}

function renderMoods() {
  if (!state.category || !state.question) return "";

  return `
    ${renderMiniTopBar({ back: "question", center: "此刻状态", right: "2/3" })}
    <div class="section-head">
      <p class="page-kicker">STEP 2</p>
      <h2>这件事，<br>让你现在更像哪种状态？</h2>
      <p>别选应该的，选你现在真实的样子。</p>
    </div>

    <div class="state-list">
      ${state.data.moods.map((mood) => {
        const meta = moodMeta[mood.key] || moodMeta.steady;
        return `
          <button class="state-option ghost-button" data-mood="${mood.key}">
            <div class="state-illustration">${stickerSvg(meta.sticker)}</div>
            <div>
              <strong>${mood.label}</strong>
              <span>${mood.desc}</span>
            </div>
            <i>${meta.step}</i>
          </button>
        `;
      }).join("")}
    </div>

    <div class="paper-speech small">
      <span>这一步只是帮签文更像在对你说话。</span>
    </div>
  `;
}

function renderDraw() {
  if (!state.category || !state.question || !state.mood) return "";

  return `
    ${renderMiniTopBar({ back: "state", center: "抽签", right: "3/3" })}
    <div class="draw-stage">
      <div class="sparkle sparkle-a"></div>
      <div class="sparkle sparkle-b"></div>
      <div class="section-head draw-title">
        <h2>静一下，<br>抽出今天这支签</h2>
        <p>${state.category.title} · ${state.mood.label}</p>
      </div>
      ${renderSignTube()}
      <button id="draw-button" class="primary-button">抽这一签</button>
      <p class="page-foot">相信第一直觉。</p>
    </div>
  `;
}

function renderDrawing() {
  return `
    ${renderMiniTopBar({ center: "签正在落下" })}
    <div class="falling-stage">
      <div class="falling-paper"><span>今日<br>运势</span></div>
      <h2>签正在落下来</h2>
      <p>别急，再等一下。</p>
    </div>
  `;
}

function renderResult() {
  if (!state.result || !state.category || !state.question || !state.mood) return "";

  const moodAdvice = state.result.advice?.[state.mood.key] || state.result.reminder;
  return `
    ${renderMiniTopBar({ back: "home", center: "今日签文", right: "保存" })}
    <div class="result-header">
      <div class="postmark mini">第 ${state.result.no} 签</div>
      <p>第 ${state.result.no} 签</p>
      <h2>${state.result.title}</h2>
    </div>

    <article class="quote-card">
      <div class="tape tape-left"></div>
      <div class="tape tape-right"></div>
      <p>${formatQuote(state.result.main)}</p>
      <span class="round-seal">今日<br>灵签</span>
    </article>

    <div class="result-list">
      ${renderResultItem("这支签想说", state.result.reading, "flower")}
      ${renderResultItem("提醒你", state.result.reminder, "star")}
      ${renderResultItem("你可以试试", moodAdvice, "cup")}
    </div>

    <div class="action-list sticky-actions">
      <button class="secondary-button" data-restart="1">换个问题再抽一次</button>
      <button class="primary-button" data-open-share="1">保存这句签</button>
    </div>
  `;
}

function renderResultItem(title, body, icon) {
  return `
    <article class="result-note">
      <div class="result-icon">${stickerSvg(icon)}</div>
      <div>
        <strong>${title}</strong>
        <p>${body}</p>
      </div>
    </article>
  `;
}

function renderShareModal() {
  if (!state.result) {
    return `<div class="share-modal"></div>`;
  }

  const shareText = `今日灵签｜第 ${state.result.no} 签《${state.result.title}》\n${state.result.main}`;
  return `
    <div class="share-modal" ${state.shareOpen ? "data-open=\"true\"" : ""}>
      <div class="share-sheet">
        <button class="sheet-close ghost-button" data-close-share="1">×</button>
        <h3>保存这句签</h3>
        <div class="share-preview">
          <div class="share-preview-top">今日灵签</div>
          <div class="share-postmark">第 ${state.result.no} 签</div>
          <h4>${state.result.title}</h4>
          <p>${formatQuote(state.result.main)}</p>
          <small>${state.result.reminder}</small>
          ${stickerSvg("flower", "share-flower")}
        </div>
        <div class="share-actions">
          <button class="secondary-button" data-copy-share="${escapeAttribute(shareText)}">复制文案</button>
          <button class="primary-button" data-save-sign="1">存到本地</button>
        </div>
      </div>
    </div>
  `;
}

function renderMiniTopBar({ back, center = "", right = "" }) {
  return `
    <div class="mini-topbar">
      <div>
        ${back ? `<button class="circle-button ghost-button" data-back="${back}" aria-label="返回">‹</button>` : `<span class="circle-button muted">${stickerSvg("grid")}</span>`}
      </div>
      <span>${center}</span>
      <div>
        ${right ? `<span class="top-pill">${right}</span>` : `<span class="circle-button muted">${stickerSvg("stampTiny")}</span>`}
      </div>
    </div>
  `;
}

function renderSignTube() {
  return `
    <div class="sign-tube-illustration" aria-hidden="true">
      <div class="tube-sticks"><i>灵</i><i>签</i><i>心</i></div>
      <div class="tube-body"><span>今日<br>灵签</span></div>
    </div>
  `;
}

function bindEvents() {
  app.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      const category = state.data.categories.find((item) => item.key === button.dataset.category);
      if (!category) return;

      state.category = category;
      state.question = null;
      state.mood = null;
      state.result = null;
      state.shareOpen = false;
      track("category_click", { category: category.key });
      showScreen("question");
    });
  });

  app.querySelectorAll("[data-question]").forEach((button) => {
    button.addEventListener("click", () => {
      const question = state.category?.questions.find((item) => item.id === button.dataset.question);
      if (!question) return;
      state.question = question;
      showScreen("state");
    });
  });

  app.querySelectorAll("[data-mood]").forEach((button) => {
    button.addEventListener("click", () => {
      const mood = state.data.moods.find((item) => item.key === button.dataset.mood);
      if (!mood) return;
      state.mood = mood;
      showScreen("draw");
    });
  });

  app.querySelectorAll("[data-back]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.back === "home") state.shareOpen = false;
      showScreen(button.dataset.back);
    });
  });

  document.getElementById("draw-button")?.addEventListener("click", () => {
    if (!state.category || !state.question || !state.mood) return;

    state.result = pickSign(state.category.key);
    state.shareOpen = false;
    track("draw_start", { category: state.category.key });
    state.screen = "drawing";
    render();

    state.drawTimer = window.setTimeout(() => {
      track("result_view", { sign_id: state.result.id, sign_no: state.result.no });
      state.drawTimer = null;
      showScreen("result");
    }, 1150);
  });

  app.querySelector("[data-open-share]")?.addEventListener("click", () => {
    state.shareOpen = true;
    track("share_modal_open");
    render();
  });

  app.querySelector("[data-close-share]")?.addEventListener("click", () => {
    state.shareOpen = false;
    render();
  });

  app.querySelector("[data-copy-share]")?.addEventListener("click", async (event) => {
    const text = event.currentTarget.dataset.copyShare || "";
    try {
      await navigator.clipboard.writeText(text);
      toast("已复制这句签");
    } catch {
      toast("复制失败，可以长按预览图保存");
    }
  });

  app.querySelector("[data-save-sign]")?.addEventListener("click", () => {
    if (!state.result) return;
    track("save_sign_click", { sign_id: state.result.id, sign_no: state.result.no });
    window.localStorage.setItem("jinri_lingqian_saved_sign", JSON.stringify(state.result));
    toast("已存到本地");
  });

  app.querySelector("[data-restart]")?.addEventListener("click", () => {
    state.category = null;
    state.question = null;
    state.mood = null;
    state.result = null;
    state.shareOpen = false;
    track("home_view", { page: "home" });
    showScreen("home");
  });
}

function pickSign(categoryKey) {
  const items = state.data.signs.filter((item) => item.category === categoryKey);
  if (!items.length) return state.data.signs[0];
  return items[Math.floor(Math.random() * items.length)];
}

function formatQuote(text) {
  return String(text).replace(/，/g, "，<br>").replace(/。/g, "。");
}

function escapeAttribute(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "&#10;");
}

function toast(message) {
  document.querySelector(".toast")?.remove();
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.appendChild(node);
  window.setTimeout(() => node.remove(), 1400);
}

function stickerSvg(name, extraClass = "") {
  const className = `sticker-svg ${extraClass}`.trim();
  const common = `class="${className}" viewBox="0 0 120 120" aria-hidden="true"`;
  const stroke = `stroke="#4a3428" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"`;

  const svgs = {
    dog: `<svg ${common}><path d="M31 47c-9-3-15 4-14 15 1 14 13 29 34 29s36-13 37-30c1-12-6-19-15-15-5-10-12-15-21-15s-16 5-21 16z" fill="#e9c28c" ${stroke}/><path d="M28 47c-8 8-9 23-2 31M77 47c8 7 9 22 3 31" fill="none" ${stroke}/><circle cx="46" cy="62" r="4" fill="#2f2722"/><circle cx="66" cy="62" r="4" fill="#2f2722"/><path d="M54 73c3 3 6 3 9 0" fill="none" ${stroke}/><path d="M73 39c12-8 22 3 13 15" fill="#d6a96f" ${stroke}/><circle cx="36" cy="70" r="7" fill="#e89b86" opacity=".65"/><circle cx="76" cy="70" r="7" fill="#e89b86" opacity=".65"/></svg>`,
    cloud: `<svg ${common}><path d="M28 76c-12 0-20-8-20-19s9-19 20-19c5-13 17-21 32-18 13 2 23 12 25 25 13 1 23 9 23 21 0 13-10 22-25 22H30" fill="#fff9ee" ${stroke}/><circle cx="50" cy="61" r="4" fill="#2f2722"/><circle cx="72" cy="61" r="4" fill="#2f2722"/><path d="M55 73c5 4 11 4 16 0" fill="none" ${stroke}/><circle cx="38" cy="69" r="7" fill="#e89b86" opacity=".6"/><circle cx="84" cy="69" r="7" fill="#e89b86" opacity=".6"/></svg>`,
    flower: `<svg ${common}><path d="M61 92V65" fill="none" ${stroke}/><path d="M60 76c-9-11-20-10-27-5 6 11 17 13 27 5zM62 75c9-12 21-13 28-8-6 12-18 14-28 8z" fill="#9baa80" ${stroke}/><path d="M60 26c7-12 24-6 22 8 14-1 21 15 9 23 10 11-2 25-15 19-5 13-22 13-27 0-13 7-25-8-15-19-12-8-4-24 10-23-2-14 14-20 22-8z" fill="#fff6df" ${stroke}/><circle cx="61" cy="51" r="13" fill="#e0a650" ${stroke}/></svg>`,
    star: `<svg ${common}><path d="M59 17l11 30 31 11-31 11-11 31-11-31-31-11 31-11 11-30z" fill="#f2c46f" ${stroke}/><circle cx="33" cy="32" r="4" fill="#d65f47"/><circle cx="90" cy="87" r="5" fill="#9fb6c8"/><path d="M23 82h10M28 77v10M89 24h10M94 19v10" fill="none" ${stroke}/></svg>`,
    hearts: `<svg ${common}><path d="M41 38c-11-16-35-4-27 17 5 13 27 27 31 29 4-4 22-23 21-36-1-16-17-20-25-10z" fill="#df8069" ${stroke}/><path d="M78 47c-8-12-25-3-20 13 4 10 20 20 23 22 3-3 17-17 16-27-1-12-13-14-19-8z" fill="#f0a06f" ${stroke}/><circle cx="34" cy="55" r="3" fill="#2f2722"/><circle cx="47" cy="55" r="3" fill="#2f2722"/><path d="M36 66c4 3 8 3 12 0" fill="none" ${stroke}/></svg>`,
    signpost: `<svg ${common}><path d="M57 28v70" fill="none" ${stroke}/><path d="M29 28h47l12 10-12 10H29z" fill="#d9e6ec" ${stroke}/><path d="M88 57H41L29 67l12 10h47z" fill="#fff5df" ${stroke}/><circle cx="57" cy="98" r="8" fill="#c78a45" ${stroke}/></svg>`,
    fire: `<svg ${common}><path d="M64 18c8 16-3 20 9 31 7-7 8-15 8-15 13 14 19 32 7 49-12 17-44 20-59-1-13-18-4-42 10-53 0 11 6 18 10 21 3-14 4-23 15-32z" fill="#e97856" ${stroke}/><path d="M57 83c-10-8-5-21 4-30 2 9 9 12 8 21-1 8-5 12-12 9z" fill="#f6c36c" ${stroke}/></svg>`,
    scale: `<svg ${common}><path d="M60 22v70M35 37h50M60 37l-20 28h40z" fill="none" ${stroke}/><path d="M20 65c5 17 32 17 38 0H20zM62 65c5 17 32 17 38 0H62z" fill="#fff6df" ${stroke}/><path d="M38 37L20 65M38 37l20 28M82 37L62 65M82 37l18 28" fill="none" ${stroke}/></svg>`,
    sleepyCup: `<svg ${common}><path d="M33 42h49l-6 48H39z" fill="#fff6df" ${stroke}/><path d="M82 53h10c10 0 10 21-2 21h-10" fill="none" ${stroke}/><path d="M44 57c3 4 8 4 11 0M63 57c3 4 8 4 11 0M50 73c8 5 14 5 22 0" fill="none" ${stroke}/><path d="M38 33c7-5 14-5 21 0 8 5 16 5 23 0" fill="none" stroke="#9fb6c8" stroke-width="4" stroke-linecap="round"/></svg>`,
    sprout: `<svg ${common}><path d="M60 94V57" fill="none" ${stroke}/><path d="M58 61c-21 1-32-11-34-29 20 0 34 10 34 29zM62 61c20-1 32-13 34-31-20 1-34 12-34 31z" fill="#9baa80" ${stroke}/><path d="M45 94h30" fill="none" ${stroke}/></svg>`,
    cup: `<svg ${common}><path d="M31 40h48l-6 46H37z" fill="#fff5df" ${stroke}/><path d="M79 50h9c12 0 12 22-2 22h-9" fill="none" ${stroke}/><path d="M37 48c11 6 24 6 36 0" fill="none" stroke="#c47a3c" stroke-width="4"/><path d="M45 66c5-7 12-2 8 5-2 4-8 8-9 9-3-3-8-8-9-12-2-8 7-10 10-2z" fill="#d98572"/></svg>`,
    grid: `<svg ${common}><rect x="24" y="24" width="22" height="22" rx="5" fill="none" ${stroke}/><rect x="74" y="24" width="22" height="22" rx="5" fill="none" ${stroke}/><rect x="24" y="74" width="22" height="22" rx="5" fill="none" ${stroke}/><rect x="74" y="74" width="22" height="22" rx="5" fill="none" ${stroke}/></svg>`,
    stampTiny: `<svg ${common}><circle cx="60" cy="60" r="34" fill="none" stroke="#c47a3c" stroke-width="5"/><path d="M35 60h50M60 35v50" stroke="#c47a3c" stroke-width="5" stroke-linecap="round"/></svg>`
  };

  return svgs[name] || svgs.star;
}
