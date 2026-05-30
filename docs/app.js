const state = {
  screen: "home",
  category: null,
  question: null,
  mood: null,
  result: null,
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
  const currentPath = window.location.pathname;
  if (currentPath.endsWith("/admin") || currentPath.endsWith("/admin.html")) {
    return "./";
  }
  return currentPath.endsWith("/") ? "./" : currentPath.split("/").slice(0, -1).length ? "./" : "./";
}

function getAssetUrl(path) {
  return new URL(`${assetBase}${path}`, window.location.href).toString();
}

function getApiUrl(path) {
  return new URL(`./api/${path}`, window.location.origin).toString();
}

function showScreen(screen) {
  state.screen = screen;
  render();
}

function getCurrentDateText() {
  const now = new Date();
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
}

function render() {
  app.innerHTML = `
    ${renderScreen("home", renderHome())}
    ${renderScreen("question", renderQuestions())}
    ${renderScreen("state", renderMoods())}
    ${renderScreen("draw", renderDraw())}
    ${renderScreen("result", renderResult())}
    ${renderTransition()}
    ${renderShareModal()}
  `;

  bindEvents();
}

function renderScreen(screen, content) {
  const activeClass = state.screen === screen ? "screen active" : "screen";
  return `<section class="${activeClass}" data-screen="${screen}">${content}</section>`;
}

function renderHome() {
  const summaryItems = [
    { title: "关系签", text: "关于靠近、留白和回应" },
    { title: "选择签", text: "关于犹豫、迈步和时机" },
    { title: "心境签", text: "关于回温、安顿和松一口气" }
  ];

  return `
    <div class="top-bar">
      <span>09:41</span>
      <span>签铺试玩版</span>
      <span>100%</span>
    </div>
    <div class="brand-block">
      <h1>今日灵签</h1>
      <div class="date-pill">${getCurrentDateText()}</div>
    </div>
    <div class="panel hero-panel">
      <div class="eyebrow-pill">朱印签铺 · 今日开签</div>
      <h2>今天想先聊哪一块？</h2>
      <p>不替你拿主意，只想在你有点乱的时候，给你一句能听进去的话。</p>
      <div class="hero-subcopy">先选一个最像你此刻心事的方向，再慢慢抽出今天这支签。</div>
      <div class="seal-note">今日宜慢一点，先问己心</div>
    </div>
    <div class="category-summary">
      ${summaryItems.map((item) => `
        <div class="summary-card">
          <strong>${item.title}</strong>
          <span>${item.text}</span>
        </div>
      `).join("")}
    </div>
    <div class="option-list">
      ${state.data.categories.map((category) => `
        <button class="category-card ghost-button" data-category="${category.key}">
          <span class="category-tag">${category.eyebrow}</span>
          <div class="sub-copy">
            <strong>${category.title}</strong>
            <div>${category.subtitle}</div>
          </div>
        </button>
      `).join("")}
    </div>
    <div class="footer-note">不一定替你解答什么，但也许能让你心里顺一点。</div>
  `;
}

function renderQuestions() {
  if (!state.category) return "";
  return `
    <div class="top-bar">
      <button class="ghost-button" data-back="home">返回</button>
      <span>${state.category.title}</span>
      <span></span>
    </div>
    <div class="section-head">
      <h2 class="section-title">哪句话更像你现在的处境？</h2>
      <p class="section-desc">在${state.category.title}里，点一句现在最像你的话。</p>
    </div>
    <div class="option-list">
      ${state.category.questions.map((question) => `
        <button class="question-card ghost-button" data-question="${question.id}">
          <strong>${question.title}</strong>
          <div class="sub-copy">${question.hint}</div>
        </button>
      `).join("")}
    </div>
    <div class="footer-note">点到哪句，就先从哪句开始。</div>
  `;
}

function renderMoods() {
  if (!state.category || !state.question) return "";
  return `
    <div class="top-bar">
      <button class="ghost-button" data-back="question">返回</button>
      <span>此刻状态</span>
      <span></span>
    </div>
    <div class="section-head">
      <h2 class="section-title">这件事，让你现在更像哪种状态？</h2>
      <p class="section-desc">选一个最贴近你的，后面的签意才会更像在对你说话。</p>
    </div>
    <div class="state-grid">
      ${state.data.moods.map((mood) => `
        <button class="state-card ghost-button" data-mood="${mood.key}">
          <strong>${mood.label}</strong>
          <span>${mood.desc}</span>
        </button>
      `).join("")}
    </div>
    <div class="footer-note">别选应该的，选你现在真实的样子。</div>
  `;
}

function renderDraw() {
  if (!state.category || !state.question || !state.mood) return "";
  return `
    <div class="top-bar">
      <button class="ghost-button" data-back="state">返回</button>
      <span>抽签</span>
      <span></span>
    </div>
    <div id="draw-card" class="draw-card">
      <h2 class="section-title">静一下，抽出今天这支签</h2>
      <p class="section-desc">${state.category.title} · ${state.question.title} · ${state.mood.label}</p>
      <div class="sign-tube" aria-hidden="true">
        <div class="sticks"><i></i><i></i><i></i><i></i><i></i></div>
      </div>
      <p class="section-desc" id="draw-helper">先想一下刚刚那件事，再点一下。它未必替你定答案，但也许会让你心里松一点。</p>
    </div>
    <div class="action-list">
      <button id="draw-button" class="primary-button">抽这一签</button>
    </div>
  `;
}

function renderResult() {
  if (!state.result) return "";
  const moodAdvice = state.result.advice?.[state.mood.key] || state.result.reminder;
  return `
    <div class="top-bar">
      <button class="ghost-button" data-back="home">首页</button>
      <span>结果</span>
      <span></span>
    </div>
    <div class="result-card">
      <div class="result-tag">今日${state.category.title}签 · 第 ${state.result.no} 签</div>
      <div class="result-signline">
        <p class="result-title">【${state.result.title}】</p>
        <small>第 ${state.result.no} 签</small>
      </div>
      <h2 class="result-main">${state.result.main}</h2>
      <p class="result-context">${state.category.title} · ${state.question.title} · ${state.mood.label}</p>
      <div class="seal-corner">今日<br>灵签</div>
    </div>
    <div class="result-list">
      <article class="action-card">
        <strong>签意</strong>
        <span>${state.result.reading}</span>
      </article>
      <article class="action-card">
        <strong>提一句</strong>
        <span>${state.result.reminder}</span>
      </article>
      <article class="action-card">
        <strong>此刻更适合你</strong>
        <span>${moodAdvice}</span>
      </article>
    </div>
    <div class="action-list">
      <button class="primary-button" data-open-share="1">分享这句签</button>
      <button class="secondary-button" data-save-sign="1">存下这句</button>
      <button class="ghost-action" data-restart="1">再抽一次</button>
    </div>
  `;
}

function renderTransition() {
  return `<div class="screen-transition" aria-hidden="true"></div>`;
}

function renderShareModal() {
  const resultText = state.result ? `今日灵签：${state.result.main}` : "";
  return `
    <div class="share-modal" ${state.shareOpen ? "data-open=\"true\"" : ""}>
      <div class="share-card">
        <h3>分享给朋友</h3>
        <p>可以直接把这句发出去，也可以截图保存。</p>
        <textarea readonly>${resultText}</textarea>
        <div class="action-list">
          <button class="primary-button" data-copy-share="1">复制文案</button>
          <button class="ghost-action" data-close-share="1">先收起</button>
        </div>
      </div>
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
      showScreen(button.dataset.back);
    });
  });

  document.getElementById("draw-button")?.addEventListener("click", () => {
    if (!state.category || !state.question || !state.mood) return;
    state.result = pickSign(state.category.key);
    state.shareOpen = false;
    track("draw_start", { category: state.category.key });
    track("result_view", {
      sign_id: state.result.id,
      sign_no: state.result.no
    });
    showScreen("result");
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

  app.querySelector("[data-copy-share]")?.addEventListener("click", async () => {
    const text = state.result ? `今日灵签：${state.result.main}` : "";
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  });

  app.querySelector("[data-save-sign]")?.addEventListener("click", () => {
    if (!state.result) return;
    track("save_sign_click", {
      sign_id: state.result.id,
      sign_no: state.result.no
    });
    window.localStorage.setItem("jinri_lingqian_saved_sign", JSON.stringify(state.result));
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
  return items[Math.floor(Math.random() * items.length)];
}
