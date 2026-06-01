const overviewCards = document.getElementById("overview-cards");
const categoryCards = document.getElementById("category-cards");
const signMetricsBody = document.getElementById("sign-metrics-body");
const refreshButton = document.getElementById("refresh-dashboard");
const runtimeConfig = getRuntimeConfig();

refreshButton.addEventListener("click", loadDashboard);
loadDashboard().catch((error) => {
  console.error(error);
});

async function loadDashboard() {
  if (!runtimeConfig.dashboardEnabled) {
    renderStaticMessage();
    return;
  }

  const [overview, signMetrics] = await Promise.all([
    fetch(getApiUrl("metrics/overview"), { cache: "no-store" }).then((res) => res.json()),
    fetch(getApiUrl("metrics/signs"), { cache: "no-store" }).then((res) => res.json())
  ]);

  renderOverview(overview);
  renderCategories(overview.category_clicks);
  renderSigns(signMetrics.signs);
}

function renderOverview(overview) {
  const cards = [
    { label: "总访问量", value: overview.total_page_views },
    { label: "独立会话数", value: overview.total_sessions },
    { label: "结果页到达", value: overview.result_views },
    { label: "保存这句签", value: overview.save_sign_clicks },
    { label: "首页访问", value: overview.home_views },
    { label: "开始抽签", value: overview.draw_starts },
    { label: "分享弹层打开", value: overview.share_modal_opens },
    { label: "保存率", value: formatRate(overview.save_sign_clicks, overview.result_views) }
  ];

  overviewCards.innerHTML = cards.map((card) => `
    <article class="metric-card">
      <span>${card.label}</span>
      <strong>${card.value}</strong>
    </article>
  `).join("");
}

function renderCategories(categoryClicks) {
  const items = [
    { label: "关系", value: categoryClicks.relationship || 0 },
    { label: "选择", value: categoryClicks.choice || 0 },
    { label: "心境", value: categoryClicks.mood || 0 }
  ];

  categoryCards.innerHTML = items.map((item) => `
    <article class="category-metric">
      <span>${item.label}</span>
      <strong>${item.value}</strong>
    </article>
  `).join("");
}

function renderSigns(signs) {
  if (!signs.length) {
    signMetricsBody.innerHTML = `<tr><td colspan="4" class="empty-state">还没有试玩数据，先发给朋友点一点。</td></tr>`;
    return;
  }

  signMetricsBody.innerHTML = signs.map((sign) => `
    <tr>
      <td>第 ${sign.sign_no || "-" } 签</td>
      <td>${sign.sign_id}</td>
      <td>${sign.views}</td>
      <td>${sign.saves}</td>
    </tr>
  `).join("");
}

function formatRate(part, total) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function renderStaticMessage() {
  overviewCards.innerHTML = `
    <article class="metric-card">
      <span>当前模式</span>
      <strong>静态部署</strong>
    </article>
    <article class="metric-card">
      <span>统计状态</span>
      <strong>未接入</strong>
    </article>
  `;

  categoryCards.innerHTML = `
    <article class="category-metric">
      <span>说明</span>
      <strong>线上试玩版不记录数据</strong>
    </article>
  `;

  signMetricsBody.innerHTML = `
    <tr>
      <td colspan="4" class="empty-state">这版是给朋友试玩的静态部署，后台统计暂时未接入。</td>
    </tr>
  `;
}

function getRuntimeConfig() {
  const localHosts = new Set(["localhost", "127.0.0.1"]);
  return {
    dashboardEnabled: localHosts.has(window.location.hostname)
  };
}

function getApiUrl(path) {
  return new URL(`./api/${path}`, window.location.origin).toString();
}
