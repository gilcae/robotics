(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  let lang = localStorage.getItem("lang") || ((navigator.language || "en").startsWith("pt") ? "pt" : "en");

  const t = (key) => I18N[lang][key] ?? I18N.en[key] ?? key;
  const fmt = (n) => n.toLocaleString(lang === "pt" ? "pt-BR" : "en-US");
  const fmtDate = (iso, opts = { month: "short", year: "numeric" }) =>
    new Date(iso + (iso.length === 7 ? "-01" : "") + "T12:00:00").toLocaleDateString(lang === "pt" ? "pt-BR" : "en-US", opts);
  const thumb = (id, q = "hqdefault") => `https://i.ytimg.com/vi/${id}/${q}.jpg`;
  const playIcon = `<span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>`;

  /* ---------- Render ---------- */
  function renderStats() {
    $("#stats").innerHTML = STATS.map(
      (s) => `<li><strong data-count="${s.value}" data-suffix="${s.suffix}">0${s.suffix}</strong><span>${t(s.key)}</span></li>`
    ).join("");
    animateCounters();
  }

  function renderProjects(filter = "all") {
    $("#projectGrid").innerHTML = PROJECTS.filter((p) => filter === "all" || p.category === filter)
      .map(
        (p) => `
      <article class="project reveal" data-video="${p.video}">
        <div class="project-media">
          <img src="${p.image}" alt="${p.title[lang]}" loading="lazy" onerror="this.src='${thumb(p.video)}'">
          ${playIcon}
          <span class="status ${p.status}">${t("status." + p.status)}</span>
        </div>
        <div class="project-body">
          <p class="mono project-year">${p.year} · ${t("projects." + p.category)}</p>
          <h3>${p.title[lang]}</h3>
          <p>${p.desc[lang]}</p>
          <ul class="tags">${p.tags.map((tag) => `<li>${tag}</li>`).join("")}</ul>
        </div>
      </article>`
      )
      .join("");
    observeReveal();
  }

  function renderTimeline() {
    $("#timeline").innerHTML = TIMELINE.map(
      (item) => `
      <li class="reveal">
        <button class="tl-card" data-video="${item.video}">
          <div class="tl-thumb"><img src="${thumb(item.video)}" alt="" loading="lazy">${playIcon}</div>
          <div class="tl-info">
            <span class="mono">${fmtDate(item.date)}</span>
            <strong>${item.title[lang]}</strong>
          </div>
        </button>
      </li>`
    ).join("");
    observeReveal();
  }

  function renderVideos(filter = "all") {
    $("#videoGrid").innerHTML = VIDEOS.filter((v) => filter === "all" || v.type === filter)
      .map(
        (v) => `
      <button class="video reveal" data-video="${v.id}" data-type="${v.type}">
        <div class="video-thumb ${v.type}">
          <img src="${thumb(v.id, v.thumb || "hqdefault")}" alt="" loading="lazy">
          ${playIcon}
          <span class="badge mono">${v.type === "short" ? "SHORT" : "VIDEO"}</span>
        </div>
        <div class="video-info">
          <strong>${v.title}</strong>
          <span class="mono">${fmtDate(v.date, { day: "2-digit", month: "short", year: "numeric" })} · ${fmt(v.views)} ${t("videos.views")}</span>
        </div>
      </button>`
      )
      .join("");
    observeReveal();
  }

  function renderReels() {
    $("#reelGrid").innerHTML = REELS.map(
      (r) => `
      <a class="reel reveal" href="https://www.instagram.com/reel/${r.id}/" target="_blank" rel="noopener">
        <img src="assets/img/reel-${r.id}.jpg" alt="${r.caption}" loading="lazy">
        ${r.pinned ? `<span class="badge mono pinned">${t("reels.pinned")}</span>` : ""}
        <div class="reel-overlay">
          <span class="mono">▶ ${fmt(r.plays)} ${t("reels.plays")}</span>
          <strong>${r.caption}</strong>
        </div>
      </a>`
    ).join("");
    observeReveal();
  }

  function applyI18n() {
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
    $$("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    $$("[data-i18n-html]").forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
    $("#langBtn").textContent = lang === "pt" ? "EN" : "PT";
  }

  function renderAll() {
    applyI18n();
    renderStats();
    renderProjects($("#projectFilters .active").dataset.filter);
    renderTimeline();
    renderVideos($("#videoFilters .active").dataset.filter);
    renderReels();
  }

  /* ---------- Interactions ---------- */
  function setupFilters(containerId, render) {
    $(containerId).addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      $$(".chip", e.currentTarget).forEach((c) => c.classList.toggle("active", c === btn));
      render(btn.dataset.filter);
    });
  }

  const modal = $("#modal");
  function openVideo(id) {
    const v = VIDEOS.find((x) => x.id === id);
    $("#modalBody").classList.toggle("vertical", v?.type === "short");
    $("#modalPlayer").innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeVideo() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    $("#modalPlayer").innerHTML = "";
    document.body.style.overflow = "";
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) return closeVideo();
    const trigger = e.target.closest("[data-video]");
    if (trigger) openVideo(trigger.dataset.video);
  });
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeVideo());

  $("#langBtn").addEventListener("click", () => {
    lang = lang === "pt" ? "en" : "pt";
    localStorage.setItem("lang", lang);
    renderAll();
  });

  $("#menuBtn").addEventListener("click", () => $("#nav").classList.toggle("menu-open"));
  $$("#navLinks a").forEach((a) => a.addEventListener("click", () => $("#nav").classList.remove("menu-open")));

  window.addEventListener("scroll", () => $("#nav").classList.toggle("scrolled", scrollY > 20), { passive: true });

  /* ---------- Animations ---------- */
  const revealObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("visible");
          revealObserver.unobserve(en.target);
        }
      }),
    { threshold: 0.1 }
  );
  function observeReveal() {
    $$(".reveal:not(.visible)").forEach((el) => revealObserver.observe(el));
  }

  function animateCounters() {
    $$("[data-count]").forEach((el) => {
      const target = +el.dataset.count;
      const suffix = el.dataset.suffix;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / 1400, 1);
        el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3)))) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  $("#year").textContent = new Date().getFullYear();
  setupFilters("#projectFilters", renderProjects);
  setupFilters("#videoFilters", renderVideos);
  renderAll();
})();
