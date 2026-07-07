/* מרכז העזרה של WHITEBOARD — אינטראקציות (תמה, חיפוש, לייטבוקס, משוב) */
(function () {
  const BASE = document.body.dataset.base || '';
  const EN = document.body.dataset.lang === 'en';
  // מחרוזות ריצה — עברית/אנגלית לפי שפת העמוד
  const L = EN ? {
    typeToSearch: 'Start typing…', noResults: 'No results — try different wording',
    forStudent: 'For students', forTeacher: 'For instructors',
    copied: 'Link copied', copy: 'Copy link',
    greetStudent: 'Hey! I’m BOARDi. Ask me how to do anything in your course — I’ll take you to the right guide.',
    greetTeacher: 'Hey! I’m BOARDi, the Help Center sidekick. Ask me how to do something and I’ll give you the short version, then take you to the full guide.',
    chipsStudent: ['How do I get into my course?', 'Where are my notes?', 'How do I take an exam?'],
    chipsTeacher: ['How do I create a course?', 'How do I upload videos?', 'How do I invite students?'],
    noAnswer: 'I couldn’t find a guide that nails that one. Try different wording — like "how do I create a course" or "inviting students". And if it’s a bug or something only a human can fix — happy to connect you with one.',
    leaveDetails: 'Leave your details for support', talkHuman: 'Not it — talk to a human',
    planNote: p => ` Heads-up — this feature is available on the <b>${p}</b> plan and up.`,
    planShort: p => ` (available on the ${p} plan and up)`,
    haveGuide: 'We’ve got a guide for exactly that.',
    fullGuide: 'The full guide:', takeMe: 'Take me there',
    takingYou: 'One sec — taking you to the guide…',
    arrived: 'Here we are! This is the guide. Walk through the steps — and if anything’s unclear, I’m right here.',
    honestThanks: 'Thanks for being honest — let’s get this sorted.',
    didntHelp: t => `The guide "${t}" didn't help me. `,
    valError: 'Something’s missing — check your name, a valid email, and a short description of what happened.',
    sending: 'Sending…', send: 'Send',
    human24: '<b>A real human will get back to you within the next 24 hours.</b><br>',
    confirmSent: e => `We've sent a confirmation with all the details to <b>${e}</b>.`,
    ticketLine: id => `Your ticket number: <b>${id}</b>.<br>`,
    sendFail: 'Something went wrong — give it another try in a moment.',
    planNames: { teacher: 'Teacher', educator: 'Educator', leader: 'Leader', enterprise: 'Enterprise' }
  } : {
    typeToSearch: 'התחילו להקליד…', noResults: 'לא נמצאו תוצאות — נסו ניסוח אחר',
    forStudent: 'לתלמיד', forTeacher: 'למרצה',
    copied: 'הקישור הועתק', copy: 'העתק קישור',
    greetStudent: 'היי! אני בורדי. שאלו אותי איך עושים דברים בקורס — ואקח אתכם למדריך הנכון.',
    greetTeacher: 'היי! אני בורדי, העוזר של מרכז העזרה. שאלו אותי איך עושים משהו במערכת — אסביר בקצרה ואקח אתכם למדריך המתאים.',
    chipsStudent: ['איך נכנסים לקורס?', 'איפה הפתקים שלי?', 'איך ניגשים למבחן?'],
    chipsTeacher: ['איך יוצרים קורס חדש?', 'איך מעלים סרטונים?', 'איך מזמינים תלמידים?'],
    noAnswer: 'לא מצאתי מדריך שעונה בדיוק על זה. נסו לנסח אחרת — למשל "איך יוצרים קורס" או "הזמנת תלמידים". ואם זו תקלה או משהו שרק בן אדם יכול לפתור — אשמח לחבר אתכם לנציג.',
    leaveDetails: 'השאירו פרטים לנציג', talkHuman: 'זה לא זה — דברו עם נציג',
    planNote: p => ` שימו לב — הפיצ'ר זמין ממסלול <b>${p}</b> ומעלה.`,
    planShort: p => ` (זמין ממסלול ${p} ומעלה)`,
    haveGuide: 'יש לנו מדריך מסודר בדיוק על זה.',
    fullGuide: 'המדריך המלא:', takeMe: 'קח אותי לשם',
    takingYou: 'רגע, אני לוקח אותך למדריך…',
    arrived: 'הגענו! זה המדריך. עברו על השלבים — ואם משהו לא ברור, אני כאן.',
    honestThanks: 'תודה על הכנות — בואו נפתור את זה.',
    didntHelp: t => `המדריך "${t}" לא עזר לי. `,
    valError: 'חסרים פרטים — בדקו שם, אימייל תקין ותיאור קצר של מה שקרה.',
    sending: 'שולח…', send: 'שליחת הפנייה',
    human24: '<b>נציג אנושי יצור איתכם קשר ב-24 השעות הקרובות.</b><br>',
    confirmSent: e => `שלחנו אישור עם כל הפרטים למייל <b>${e}</b>.`,
    ticketLine: id => `מספר הפנייה שלכם: <b>${id}</b>.<br>`,
    sendFail: 'משהו השתבש בשליחה — נסו שוב עוד רגע.',
    planNames: { teacher: 'מורה', educator: 'מחנך', leader: 'מנהיג', enterprise: 'ארגוני' }
  };

  // מתג שפה: עברית ⇄ English — אותו נתיב, עם/בלי קידומת en
  document.querySelector('.lang-switch')?.addEventListener('click', () => {
    const rel = location.pathname.slice(BASE.length) || '/';
    location.href = (EN ? BASE.replace(/\/en$/, '') : BASE + '/en') + rel;
  });
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
    resultsEl.innerHTML = `<div class="sr-empty">${L.typeToSearch}</div>`;
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

  const lc = v => String(v || '').toLowerCase(); // אנגלית: התאמה בלי רגישות לאותיות
  function score(item, terms) {
    let s = 0;
    for (const t of terms) {
      if (lc(item.title).includes(t)) s += 10;
      if (lc(item.description).includes(t)) s += 4;
      if (lc(item.text).includes(t)) s += 1;
    }
    return s;
  }
  input?.addEventListener('input', async () => {
    sel = -1;
    const q = input.value.trim();
    if (q.length < 2) { resultsEl.innerHTML = `<div class="sr-empty">${L.typeToSearch}</div>`; return; }
    await ensureIndex();
    if (input.value.trim() !== q) return;
    const terms = lc(q).split(/\s+/);
    const hits = index.map(it => ({ it, s: score(it, terms) })).filter(h => h.s > 0)
      .sort((a, b) => b.s - a.s).slice(0, 8);
    resultsEl.innerHTML = hits.length
      ? hits.map(h => `<a class="sr-item" href="${BASE}${h.it.url}"><b>${h.it.title}</b><small>${h.it.cat} · ${h.it.audience === 'student' ? L.forStudent : L.forTeacher}</small></a>`).join('')
      : `<div class="sr-empty">${L.noResults}</div>`;
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
    btn.querySelector('span').textContent = L.copied;
    setTimeout(() => { btn.classList.remove('copied'); btn.querySelector('span').textContent = L.copy; }, 2500);
  }));

  // ---- טופס פנייה לנציג ----
  const cModal = document.querySelector('.contact-modal');
  const cForm = cModal?.querySelector('.cm-form');
  const cSuccess = cModal?.querySelector('.cm-success');
  const cError = cModal?.querySelector('.cm-error');
  // הקהל מזוהה אוטומטית לפי העמוד שממנו פונים — אין בחירה ידנית
  const cAudience = document.body.dataset.audience || 'teacher';
  let prefilled = false;

  // מילוי אוטומטי לפונה מחובר: WB_USER גלובלי (כשהמרכז מוטמע במערכת) → localStorage → נקודת קצה session
  async function prefillUser() {
    if (prefilled) return;
    prefilled = true;
    let u = window.WB_USER || null;
    if (!u) { try { u = JSON.parse(localStorage.getItem('wb-user') || 'null'); } catch (e) {} }
    const sess = document.body.dataset.sessionEndpoint;
    if (!u && sess) {
      try {
        const r = await fetch(sess, { credentials: 'include' });
        if (r.ok) u = await r.json();
      } catch (e) {}
    }
    if (!u || (!u.name && !u.email)) return;
    let any = false;
    for (const [k, v] of [['name', u.name || u.fullName], ['email', u.email], ['phone', u.phone]]) {
      const inp = cForm.querySelector(`[name="${k}"]`);
      if (v && inp && !inp.value) { inp.value = v; inp.classList.add('autofilled'); any = true; }
    }
    if (any) cModal.querySelector('.cm-autofill').hidden = false;
  }

  function openContact(opts = {}) {
    if (!cModal) return;
    chat && (chat.hidden = true, launcher.hidden = false);
    cModal.hidden = false;
    cForm.hidden = false; cSuccess.hidden = true; cError.hidden = true;
    if (opts.category) cForm.querySelector('[name="category"]').value = opts.category;
    if (opts.message && !cForm.querySelector('[name="message"]').value)
      cForm.querySelector('[name="message"]').value = opts.message;
    // הקשר אוטומטי: המדריך שממנו נשלחה הפנייה
    const h1 = document.querySelector('.article h1');
    if (h1) {
      cModal.querySelector('.cm-context').hidden = false;
      cModal.querySelector('.cm-context-title').textContent = h1.textContent.trim();
    }
    prefillUser();
    setTimeout(() => cForm.querySelector('[name="name"]').focus(), 60);
  }
  function closeContact() { cModal.hidden = true; }

  document.querySelectorAll('.contact-open').forEach(b => b.addEventListener('click', () => openContact()));
  cModal?.querySelector('.cm-close')?.addEventListener('click', closeContact);
  cModal?.querySelector('.cm-done')?.addEventListener('click', closeContact);
  cModal?.addEventListener('click', e => { if (e.target === cModal) closeContact(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && cModal && !cModal.hidden) closeContact(); });

  cForm?.addEventListener('submit', async e => {
    e.preventDefault();
    cError.hidden = true;
    // ולידציה בסיסית
    let bad = false;
    for (const name of ['name', 'email', 'message']) {
      const inp = cForm.querySelector(`[name="${name}"]`);
      const ok = name === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim()) : inp.value.trim().length > 1;
      inp.classList.toggle('invalid', !ok);
      if (!ok) bad = true;
    }
    if (bad) { cError.textContent = L.valError; cError.hidden = false; return; }
    if (cForm.querySelector('.cm-hp').value) return; // honeypot — בוט
    const h1 = document.querySelector('.article h1');
    const payload = {
      source: 'help-center',
      audience: cAudience,
      category: cForm.querySelector('[name="category"]').value,
      name: cForm.querySelector('[name="name"]').value.trim(),
      email: cForm.querySelector('[name="email"]').value.trim(),
      phone: cForm.querySelector('[name="phone"]').value.trim(),
      message: cForm.querySelector('[name="message"]').value.trim(),
      context: {
        url: location.href,
        article: h1 ? h1.textContent.trim() : null,
        userAgent: navigator.userAgent,
        theme: root.dataset.theme
      }
    };
    const endpoint = document.body.dataset.supportEndpoint;
    const btn = cForm.querySelector('.cm-submit');
    const showSuccess = (ticketId, demo) => {
      cForm.hidden = true;
      cSuccess.hidden = false;
      cSuccess.querySelector('.cm-success-line').innerHTML =
        (ticketId ? L.ticketLine(ticketId) : '') + L.human24 + L.confirmSent(payload.email);
      cSuccess.querySelector('.cm-demo-note').hidden = !demo;
    };
    if (!endpoint) { showSuccess(null, true); return; } // מצב תצוגה — חוויית האישור המלאה, עם הערה שכלום לא נשלח
    btn.disabled = true; btn.textContent = L.sending;
    try {
      const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json().catch(() => ({}));
      showSuccess(data.ticketId, false);
    } catch (err) {
      cError.textContent = L.sendFail;
      cError.hidden = false;
    } finally {
      btn.disabled = false; btn.textContent = L.send;
    }
  });

  // ---- פופאפ דירוג (משוב "כן") ----
  const rModal = document.querySelector('.rate-modal');
  let rating = 5;
  function openRate() {
    if (!rModal) return;
    rModal.hidden = false;
    rModal.querySelector('.rm-body').hidden = false;
    rModal.querySelector('.rm-thanks').hidden = true;
  }
  function closeRate() { rModal.hidden = true; }
  rModal?.querySelectorAll('.rm-star').forEach(st => st.addEventListener('click', () => {
    rating = +st.dataset.v;
    rModal.querySelectorAll('.rm-star').forEach(s => s.classList.toggle('on', +s.dataset.v <= rating));
  }));
  rModal?.querySelector('.rm-send')?.addEventListener('click', () => {
    const text = rModal.querySelector('textarea').value.trim();
    const review = { type: 'review', rating, text, url: location.href, article: document.querySelector('.article h1')?.textContent.trim() || null, audience: cAudience };
    const endpoint = document.body.dataset.supportEndpoint;
    if (endpoint) fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(review) }).catch(() => {});
    try {
      const log = JSON.parse(localStorage.getItem('wb-help-reviews') || '[]');
      log.push({ ...review, at: new Date().toISOString() });
      localStorage.setItem('wb-help-reviews', JSON.stringify(log));
    } catch (e) {}
    rModal.querySelector('.rm-body').hidden = true;
    rModal.querySelector('.rm-thanks').hidden = false;
  });
  rModal?.querySelector('.rm-close')?.addEventListener('click', closeRate);
  rModal?.querySelector('.rm-done')?.addEventListener('click', closeRate);
  rModal?.addEventListener('click', e => { if (e.target === rModal) closeRate(); });

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

  const PLAN_HE = L.planNames;
  function takeover(hit) {
    chat.hidden = true;
    const ov = document.createElement('div');
    ov.className = 'boardi-takeover';
    ov.innerHTML = `<div class="to-card"><img src="${BASE}/assets/brand/boardi-7.svg" alt="">${L.takingYou}</div>`;
    document.body.appendChild(ov);
    try { sessionStorage.setItem('boardi-nav', JSON.stringify({ title: hit.title })); } catch (e) {}
    setTimeout(() => { location.href = BASE + hit.url; }, 900);
  }

  function answer(q) {
    const terms = lc(q).trim().split(/\s+/).filter(t => t.length > 1);
    const scored = (index || []).map(it => {
      let s = 0;
      for (const t of terms) {
        if (lc(it.title).includes(t)) s += 10;
        if ((it.headings || []).some(h => lc(h).includes(t))) s += 5;
        if (lc(it.description).includes(t)) s += 4;
        if (lc(it.text).includes(t)) s += 1;
      }
      if (it.audience === audience) s *= 1.5; // עדיפות לקהל הנוכחי
      return { it, s };
    }).filter(h => h.s > 0).sort((a, b) => b.s - a.s);

    if (!scored.length) {
      boMsg(L.noAnswer);
      chips([{ label: L.leaveDetails, go: true, onClick: () => openContact({ message: q }) }]);
      return;
    }
    const top = scored[0].it;
    const planNote = top.plan ? L.planNote(PLAN_HE[top.plan]) : '';
    boMsg(`${top.description || L.haveGuide}${planNote}<br>${L.fullGuide} <b>${top.title}</b> (${top.cat}).`);
    const list = [{ label: L.takeMe, go: true, onClick: () => takeover(top) }];
    list.push({ label: L.talkHuman, onClick: () => openContact({ message: q }) });
    for (const alt of scored.slice(1, 2)) {
      list.push({ label: alt.it.title, onClick: () => { userMsg(alt.it.title); withTyping(() => {
        const pn = alt.it.plan ? L.planShort(PLAN_HE[alt.it.plan]) : '';
        boMsg(`${alt.it.description || alt.it.title}${pn}`);
        chips([{ label: L.takeMe, go: true, onClick: () => takeover(alt.it) }]);
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
      boMsg(audience === 'student' ? L.greetStudent : L.greetTeacher);
      chips((audience === 'student' ? L.chipsStudent : L.chipsTeacher)
        .map(qq => ({ label: qq, onClick: () => { userMsg(qq); withTyping(() => answer(qq)); } }))
        .concat([{ label: EN ? 'Talk to a human' : 'דברו עם נציג', onClick: () => openContact() }]));
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
          boMsg(L.arrived);
        });
      }
    }
  } catch (e) {}

  // ---- משוב ----
  document.querySelectorAll('.feedback button').forEach(btn => btn.addEventListener('click', e => {
    const box = e.target.closest('.feedback');
    const v = e.target.dataset.v;
    box.querySelectorAll('button').forEach(b => b.remove());
    const em = box.querySelector('em');
    em.hidden = false;
    if (v === 'yes') {
      openRate(); // דירוג 5 כוכבים + המלצה
    } else {
      em.textContent = L.honestThanks;
      // פנייה לתמיכה עם הקשר העמוד שממנו הגיע
      openContact({ category: 'usage', message: L.didntHelp(document.querySelector('.article h1')?.textContent.trim() || document.title) });
    }
    try {
      const log = JSON.parse(localStorage.getItem('wb-help-feedback') || '[]');
      log.push({ url: location.pathname, v: e.target.dataset.v, at: new Date().toISOString() });
      localStorage.setItem('wb-help-feedback', JSON.stringify(log));
    } catch (err) {}
  }));
})();
