/* מרכז העזרה של WHITEBOARD — אינטראקציות (תמה, חיפוש, לייטבוקס, משוב) */
(function () {
  const BASE = document.body.dataset.base || '';
  // ---- תמה ----
  const root = document.documentElement;
  document.querySelector('.theme-toggle')?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('wb-help-theme', next); } catch (e) {}
  });

  // ---- חיפוש ----
  const modal = document.querySelector('.search-modal');
  const input = modal?.querySelector('input');
  const resultsEl = modal?.querySelector('.search-results');
  let index = null, sel = -1;

  let indexPromise = null;
  function ensureIndex() {
    if (!indexPromise) {
      indexPromise = fetch(BASE + '/search-index.json').then(r => r.json()).catch(() => []).then(d => (index = d));
    }
    return indexPromise;
  }
  function openSearch() {
    modal.hidden = false;
    input.value = '';
    resultsEl.innerHTML = '<div class="sr-empty">התחילו להקליד…</div>';
    input.focus();
    ensureIndex();
  }
  function closeSearch() { modal.hidden = true; sel = -1; }

  document.querySelectorAll('.search-open').forEach(b => b.addEventListener('click', openSearch));
  modal?.addEventListener('click', e => { if (e.target === modal) closeSearch(); });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && modal.hidden && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape' && !modal.hidden) closeSearch();
    if (!modal.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      const items = resultsEl.querySelectorAll('.sr-item');
      if (!items.length) return;
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((it, i) => it.classList.toggle('sel', i === sel));
      items[sel].scrollIntoView({ block: 'nearest' });
    }
    if (!modal.hidden && e.key === 'Enter') {
      const cur = resultsEl.querySelector('.sr-item.sel') || resultsEl.querySelector('.sr-item');
      if (cur) location.href = cur.href;
    }
  });

  function score(item, terms) {
    let s = 0;
    for (const t of terms) {
      if (item.title.includes(t)) s += 10;
      if (item.description.includes(t)) s += 4;
      if (item.text.includes(t)) s += 1;
    }
    return s;
  }
  input?.addEventListener('input', async () => {
    sel = -1;
    const q = input.value.trim();
    if (q.length < 2) { resultsEl.innerHTML = '<div class="sr-empty">התחילו להקליד…</div>'; return; }
    await ensureIndex();
    if (input.value.trim() !== q) return;
    const terms = q.split(/\s+/);
    const hits = index.map(it => ({ it, s: score(it, terms) })).filter(h => h.s > 0)
      .sort((a, b) => b.s - a.s).slice(0, 8);
    resultsEl.innerHTML = hits.length
      ? hits.map(h => `<a class="sr-item" href="${BASE}${h.it.url}"><b>${h.it.title}</b><small>${h.it.cat} · ${h.it.audience === 'student' ? 'לתלמיד' : 'למרצה'}</small></a>`).join('')
      : '<div class="sr-empty">לא נמצאו תוצאות — נסו ניסוח אחר</div>';
  });

  // ---- לייטבוקס ----
  const lb = document.querySelector('.lightbox');
  const lbImg = lb?.querySelector('img');
  document.querySelectorAll('.shot-zoom').forEach(btn => btn.addEventListener('click', () => {
    const img = [...btn.querySelectorAll('img')].find(i => getComputedStyle(i).display !== 'none') || btn.querySelector('img');
    if (!img) return;
    lbImg.src = img.src; lbImg.alt = img.alt; lb.hidden = false;
  }));
  lb?.addEventListener('click', () => { lb.hidden = true; lbImg.src = ''; });

  // ---- סיידבר: אקורדיון יחיד עם אנימציה ----
  const navCats = [...document.querySelectorAll('.nav-cat')];
  navCats.forEach(det => {
    if (det.open) det.classList.add('expanded');
    det.open = true; // התוכן תמיד ברינדור — הגובה נשלט ע"י .expanded
    det.querySelector('summary').addEventListener('click', e => {
      e.preventDefault();
      const isOpen = det.classList.contains('expanded');
      navCats.forEach(d => d.classList.remove('expanded'));
      if (!isOpen) det.classList.add('expanded');
    });
  });

  // ---- ראשי פרקים: הדגשת הסקשן הנוכחי בגלילה ----
  const tocLinks = [...document.querySelectorAll('.toc a[data-target]')];
  if (tocLinks.length) {
    const headings = tocLinks.map(a => document.getElementById(a.dataset.target)).filter(Boolean);
    const setActive = id => tocLinks.forEach(a => a.classList.toggle('active', a.dataset.target === id));
    const spy = () => {
      let current = headings[0]?.id;
      for (const h of headings) if (h.getBoundingClientRect().top <= 110) current = h.id;
      if (current) setActive(current);
    };
    document.addEventListener('scroll', spy, { passive: true });
    spy();
    tocLinks.forEach(a => a.addEventListener('click', () => setActive(a.dataset.target)));
  }

  // ---- כפתור שיתוף ----
  document.querySelectorAll('.share-btn').forEach(btn => btn.addEventListener('click', async () => {
    const url = btn.dataset.url || location.href;
    try { await navigator.clipboard.writeText(url); } catch (e) {
      const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select();
      document.execCommand('copy'); t.remove();
    }
    btn.classList.add('copied');
    btn.querySelector('span').textContent = 'הקישור הועתק';
    setTimeout(() => { btn.classList.remove('copied'); btn.querySelector('span').textContent = 'העתק קישור'; }, 2500);
  }));

  // ---- צ'אט בורדי ----
  const chat = document.querySelector('.boardi-chat');
  const launcher = document.querySelector('.boardi-launcher');
  const msgsEl = chat?.querySelector('.bc-msgs');
  const chatForm = chat?.querySelector('.bc-input');
  const chatInput = chat?.querySelector('.bc-input input');
  const audience = document.body.dataset.audience || 'teacher';

  function boMsg(html) {
    const el = document.createElement('div');
    el.className = 'ab ab-bo';
    el.innerHTML = `<img src="${BASE}/assets/brand/boardi-4.svg" alt=""><div class="bub">${html}</div>`;
    msgsEl.appendChild(el); msgsEl.scrollTop = msgsEl.scrollHeight;
    return el;
  }
  function userMsg(text) {
    const el = document.createElement('div');
    el.className = 'ab ab-user';
    el.textContent = text;
    msgsEl.appendChild(el); msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  function chips(items) {
    const wrap = document.createElement('div');
    wrap.className = 'ab-chips';
    for (const it of items) {
      const b = document.createElement('button');
      b.className = 'ab-chip' + (it.go ? ' go' : '');
      b.textContent = it.label;
      b.addEventListener('click', it.onClick);
      wrap.appendChild(b);
    }
    msgsEl.appendChild(wrap); msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  function typing(ms) {
    const el = document.createElement('div');
    el.className = 'ab-dots';
    el.innerHTML = '<i></i><i></i><i></i>';
    msgsEl.appendChild(el); msgsEl.scrollTop = msgsEl.scrollHeight;
    return new Promise(r => setTimeout(() => { el.remove(); r(); }, ms));
  }

  const PLAN_HE = { teacher: 'מורה', educator: 'מחנך', leader: 'מנהיג', enterprise: 'ארגוני' };
  function takeover(hit) {
    chat.hidden = true;
    const ov = document.createElement('div');
    ov.className = 'boardi-takeover';
    ov.innerHTML = `<div class="to-card"><img src="${BASE}/assets/brand/boardi-7.svg" alt="">רגע, אני לוקח אותך למדריך…</div>`;
    document.body.appendChild(ov);
    try { sessionStorage.setItem('boardi-nav', JSON.stringify({ title: hit.title })); } catch (e) {}
    setTimeout(() => { location.href = BASE + hit.url; }, 900);
  }

  function answer(q) {
    const terms = q.trim().split(/\s+/).filter(t => t.length > 1);
    const scored = (index || []).map(it => {
      let s = 0;
      for (const t of terms) {
        if (it.title.includes(t)) s += 10;
        if ((it.headings || []).some(h => h.includes(t))) s += 5;
        if (it.description.includes(t)) s += 4;
        if (it.text.includes(t)) s += 1;
      }
      if (it.audience === audience) s *= 1.5; // עדיפות לקהל הנוכחי
      return { it, s };
    }).filter(h => h.s > 0).sort((a, b) => b.s - a.s);

    if (!scored.length) {
      boMsg('לא מצאתי מדריך שעונה בדיוק על זה. נסו לנסח אחרת — למשל "איך יוצרים קורס" או "הזמנת תלמידים". אפשר גם לפתוח את החיפוש למעלה.');
      return;
    }
    const top = scored[0].it;
    const planNote = top.plan ? ` שימו לב — הפיצ'ר זמין ממסלול <b>${PLAN_HE[top.plan]}</b> ומעלה.` : '';
    boMsg(`${top.description || 'יש לנו מדריך מסודר בדיוק על זה.'}${planNote}<br>המדריך המלא: <b>${top.title}</b> (${top.cat}).`);
    const list = [{ label: 'קח אותי לשם', go: true, onClick: () => takeover(top) }];
    for (const alt of scored.slice(1, 3)) {
      list.push({ label: alt.it.title, onClick: () => { userMsg(alt.it.title); withTyping(() => {
        const pn = alt.it.plan ? ` (זמין ממסלול ${PLAN_HE[alt.it.plan]} ומעלה)` : '';
        boMsg(`${alt.it.description || alt.it.title}${pn}`);
        chips([{ label: 'קח אותי לשם', go: true, onClick: () => takeover(alt.it) }]);
      }); } });
    }
    chips(list);
  }
  async function withTyping(fn) { await typing(700 + Math.random() * 500); fn(); }

  let greeted = false;
  async function openChat() {
    chat.hidden = false; launcher.hidden = true;
    ensureIndex();
    chatInput.focus();
    if (!greeted) {
      greeted = true;
      await typing(700);
      boMsg(audience === 'student'
        ? 'היי! אני בורדי. שאלו אותי איך עושים דברים בקורס — ואקח אתכם למדריך הנכון.'
        : 'היי! אני בורדי, העוזר של מרכז העזרה. שאלו אותי איך עושים משהו במערכת — אסביר בקצרה ואקח אתכם למדריך המתאים.');
      chips((audience === 'student'
        ? ['איך נכנסים לקורס?', 'איפה הפתקים שלי?', 'איך ניגשים למבחן?']
        : ['איך יוצרים קורס חדש?', 'איך מעלים סרטונים?', 'איך מזמינים תלמידים?'])
        .map(qq => ({ label: qq, onClick: () => { userMsg(qq); withTyping(() => answer(qq)); } })));
    }
  }
  function closeChat() { chat.hidden = true; launcher.hidden = false; }

  launcher?.addEventListener('click', openChat);
  document.querySelectorAll('.boardi-open').forEach(b => b.addEventListener('click', openChat));
  chat?.querySelector('.bc-close')?.addEventListener('click', closeChat);
  chatForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const q = chatInput.value.trim();
    if (!q) return;
    chatInput.value = '';
    userMsg(q);
    await ensureIndex();
    await withTyping(() => answer(q));
  });

  // הגעה אחרי השתלטות: בורדי מסמן את היעד וממשיך את השיחה
  try {
    const nav = sessionStorage.getItem('boardi-nav');
    if (nav) {
      sessionStorage.removeItem('boardi-nav');
      const h1 = document.querySelector('.article h1');
      if (h1) {
        h1.classList.add('boardi-arrived');
        openChat().then(async () => {
          await typing(600);
          boMsg('הגענו! זה המדריך. עברו על השלבים — ואם משהו לא ברור, אני כאן.');
        });
      }
    }
  } catch (e) {}

  // ---- משוב ----
  document.querySelectorAll('.feedback button').forEach(btn => btn.addEventListener('click', e => {
    const box = e.target.closest('.feedback');
    box.querySelectorAll('button').forEach(b => b.remove());
    box.querySelector('em').hidden = false;
    try {
      const log = JSON.parse(localStorage.getItem('wb-help-feedback') || '[]');
      log.push({ url: location.pathname, v: e.target.dataset.v, at: new Date().toISOString() });
      localStorage.setItem('wb-help-feedback', JSON.stringify(log));
    } catch (err) {}
  }));
})();
