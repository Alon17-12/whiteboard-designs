/* =====================================================================
   WB-FUNNEL · unified funnel-analytics infrastructure for WHITEBOARD
   One source of truth for EVERY step and EVERY data point across the
   homepage → lead popup → checkout → thank-you journey, so the whole
   funnel can be measured and optimized.

   Load on every page BEFORE the page's own scripts:
     <script>window.WB_FUNNEL_CONFIG={page:'homepage'};</script>
     <script src="assets/wb-funnel.js"></script>

   Then use:
     WBF.set({plan:'educator',billing:'monthly',value:199})  // context that rides on every event
     WBF.step('lead_submitted',{...})                        // a canonical funnel step
     WBF.trackForm(formEl,'lead')                            // auto field-level tracking
     WBF.field('lead','email','error',{reason:'invalid'})    // manual field event
     WBF.journey() / WBF.dump()                              // full path for debugging
   Every event is mirrored to dataLayer (GTM/GA4), Microsoft Clarity, and
   the Meta Pixel (with correct standard-event mapping). Add ?wbdebug=1 to
   any URL to see the whole funnel in the console.
   ===================================================================== */
(function () {
  var CFG = window.WB_FUNNEL_CONFIG || {};
  var CLARITY_ID = CFG.clarityId || 'xi43gegise';   // Clarity project "whiteboard"
  /* WHITEBOARD's own pixel: "whiteboard pixel", business 594916872671950, ad account
     1035055716097456. NOT the Bunker pixel, and NOT 2165422377642345 — that one sits in
     the blocked business and never fired. The product repo ships the same id
     (WB_DEFAULT_PIXEL_ID in src/lib/analytics/meta-events.ts); they must stay in sync or
     Meta sees two unrelated journeys. Pass pixelId:'off' to disable on a page. */
  var PIXEL_ID   = CFG.pixelId || '1002841276116788';
  if(PIXEL_ID === 'off') PIXEL_ID = '';
  var PAGE       = CFG.page || 'unknown';
  var DEBUG      = /[?&]wbdebug=1/.test(location.search) || !!CFG.debug;

  /* ---------- storage helpers ---------- */
  function sget(k){try{return sessionStorage.getItem(k);}catch(e){return null;}}
  function sset(k,v){try{sessionStorage.setItem(k,v);}catch(e){}}
  function lget(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function lset(k,v){try{localStorage.setItem(k,v);}catch(e){}}
  function jload(store,k){try{return JSON.parse((store==='l'?lget:sget)(k)||'null');}catch(e){return null;}}
  function jsave(store,k,v){(store==='l'?lset:sset)(k,JSON.stringify(v));}

  /* ---------- canonical funnel taxonomy (ordered; step_index powers funnel reports) ----------
     The MAIN funnel is the ordered spine (0→9). Everything else is a
     secondary event that enriches a step but doesn't advance the index. */
  var STEPS = {
    page_view:          {i: 0, fb: 'PageView'},
    pricing_viewed:     {i: 1},
    plan_selected:      {i: 2},                    // a plan CTA was clicked
    lead_popup_opened:  {i: 3},
    lead_submitted:     {i: 4, fb: 'Lead'},        // details captured (pre-payment)
    checkout_loaded:    {i: 5, fb: 'InitiateCheckout'},
    payment_started:    {i: 6, fb: 'AddPaymentInfo'},
    payment_success:    {i: 7},
    thankyou_viewed:    {i: 8},
    purchase_completed: {i: 9, fb: 'Purchase'}     // revenue event (StartTrial for trial, Lead for enterprise)
  };

  /* ---------- identity ----------
     funnel_id: one journey per tab-session, threads popup→checkout→thankyou.
     attribution: first-touch UTM + referrer, persisted across sessions. */
  function uuid(){
    var s='',h='0123456789abcdef';
    for(var i=0;i<32;i++){s+=h[(Math.random()*16)|0];}       // random-only (no crypto dependency)
    return s.slice(0,8)+'-'+s.slice(8,12)+'-'+s.slice(12,16)+'-'+s.slice(16,20)+'-'+s.slice(20);
  }
  var funnelId = sget('wb_funnel_id');
  if(!funnelId){ funnelId = uuid(); sset('wb_funnel_id', funnelId); sset('wb_funnel_start', String(Date.now())); }

  var qs = new URLSearchParams(location.search);
  var ATTR = jload('l','wb_attr');
  if(!ATTR){
    ATTR = {
      utm_source: qs.get('utm_source')||'', utm_medium: qs.get('utm_medium')||'',
      utm_campaign: qs.get('utm_campaign')||'', utm_content: qs.get('utm_content')||'',
      utm_term: qs.get('utm_term')||'', referrer: document.referrer||'direct',
      landing: location.pathname, first_seen: new Date().toISOString()
    };
    jsave('l','wb_attr',ATTR);
  }

  /* ---------- context that rides on EVERY event (plan/billing/value) ---------- */
  var CTX = jload('s','wb_ctx') || {currency:'ILS'};
  function setCtx(o){ CTX = Object.assign(CTX, o||{}); jsave('s','wb_ctx',CTX); return CTX; }

  /* ---------- journey ring-buffer (the full path, for debugging + send-with-purchase) ---------- */
  var journey = jload('s','wb_journey') || [];
  var lastTs = journey.length ? journey[journey.length-1].t : Date.now();

  /* ---------- external tools ---------- */
  if(CLARITY_ID && !window.clarity){(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",CLARITY_ID);}
  if(PIXEL_ID && !window.fbq){!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;
    n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init',PIXEL_ID);}

  /* ---------- Meta standard-event params ---------- */
  function fbParams(){
    var p={currency:CTX.currency||'ILS'};
    if(CTX.value!=null) p.value=CTX.value;
    if(CTX.plan) p.content_name=CTX.plan;
    if(CTX.plan) p.content_ids=[CTX.plan];
    return p;
  }

  /* ---------- the emit core ---------- */
  window.dataLayer = window.dataLayer || [];
  function emit(name, props, opts){
    props = props || {}; opts = opts || {};
    var now = Date.now(), meta = STEPS[name] || {};
    var rec = Object.assign({
      event: 'wb_event',
      name: name,
      funnel_step: (meta.i!=null ? name : undefined),
      step_index: (meta.i!=null ? meta.i : undefined),
      funnel_id: funnelId,
      page: PAGE,
      plan: CTX.plan, billing: CTX.billing, value: CTX.value, currency: CTX.currency||'ILS',
      ts: now,
      step_ms: now - lastTs                       // time since the previous event (velocity)
    }, ATTR, props);
    lastTs = now;

    // journey buffer (compact)
    journey.push({n:name, i:meta.i, t:now, p:CTX.plan, b:CTX.billing}); if(journey.length>80) journey.shift();
    jsave('s','wb_journey',journey);

    // sink 1: dataLayer (GTM / GA4)
    try{ dataLayer.push(rec); }catch(e){}
    // sink 2: Microsoft Clarity (custom event + tag the session with plan/step for filtering)
    try{ if(window.clarity){ clarity('event', name);
      if(CTX.plan) clarity('set','plan',CTX.plan);
      if(CTX.billing) clarity('set','billing',CTX.billing);
      if(meta.i!=null) clarity('set','furthest_step',String(meta.i));
    }}catch(e){}
    // sink 3: Meta Pixel (standard event when mapped, else custom) with dedupe eventID.
    // Always SCOPED to our pixel: bare fbq('track') broadcasts to every pixel on the page,
    // so a teacher's pixel or an embedded partner tag would silently receive our funnel.
    try{ if(window.fbq && PIXEL_ID){
      if(meta.fb){ fbq('trackSingle', PIXEL_ID, meta.fb, fbParams(), opts.eventID?{eventID:opts.eventID}:undefined); }
      else { fbq('trackSingleCustom', PIXEL_ID, name, props); }
    }}catch(e){}

    if(DEBUG) console.log('%c[WBF]'+(meta.i!=null?(' #'+meta.i):'')+' '+name,
      'color:#38C4F2;font-weight:bold', Object.assign({step_ms:rec.step_ms},props));
    return rec;
  }

  /* ---------- field-level tracking ----------
     Auto-instruments a form: first focus → field_started, blur-with-value →
     field_completed, blur-after-focus-still-empty → field_abandoned. This is
     what tells you exactly where people stall inside a form. */
  function field(form, name, action, props){
    emit('field_'+action, Object.assign({form:form, field:name}, props||{}));
  }
  function trackForm(formEl, formName){
    if(!formEl) return;
    var touched = {};
    var fields = formEl.querySelectorAll('input,select,textarea');
    fields.forEach(function(el){
      var fname = el.id || el.name || (el.getAttribute('aria-label')||'field');
      el.addEventListener('focus', function(){
        if(!touched[fname]){ touched[fname]='started'; field(formName, fname, 'started'); }
      });
      el.addEventListener('blur', function(){
        var val = (el.type==='checkbox') ? el.checked : (el.value||'').trim();
        var has = (el.type==='checkbox') ? el.checked : !!val;
        if(touched[fname] && touched[fname]!=='completed'){
          if(has){ touched[fname]='completed'; field(formName, fname, 'completed'); }
          else   { field(formName, fname, 'abandoned'); }
        }
      });
    });
  }

  /* ---------- abandonment: on exit, record how far the funnel got ----------
     A forward navigation inside the funnel (popup→checkout→thank-you) also
     triggers pagehide — so pages call WBF.advance() right before navigating on,
     which suppresses the abandon ping. funnel_abandoned then means a REAL exit. */
  var exited=false, advancing=false;
  function onExit(){
    if(exited || advancing) return; exited=true;
    var last = journey.length ? journey[journey.length-1] : null;
    emit('funnel_abandoned', {
      last_step: last?last.n:null,
      last_step_index: last&&last.i!=null?last.i:null,
      seconds_in_funnel: Math.round((Date.now() - (parseInt(sget('wb_funnel_start'),10)||Date.now()))/1000)
    });
  }
  window.addEventListener('pagehide', onExit);
  document.addEventListener('visibilitychange', function(){ if(document.visibilityState==='hidden') onExit(); });

  /* ---------- public API ---------- */
  window.WBF = {
    STEPS: STEPS,
    step: emit,                 // WBF.step(name, props, {eventID})
    field: field,               // WBF.field(form, name, action, props)
    trackForm: trackForm,       // WBF.trackForm(formEl, 'lead')
    set: setCtx,                // WBF.set({plan,billing,value})
    pixel: function(){return PIXEL_ID;},      // for pages that fire fbq directly — always scope with it
    ctx: function(){return Object.assign({},CTX);},
    id: function(){return funnelId;},
    attribution: function(){return Object.assign({},ATTR);},
    advance: function(){ advancing=true; },   // call right before navigating forward in the funnel
    journey: function(){return journey.slice();},
    dump: function(){ try{console.table(journey.map(function(j){return {step:j.n,index:j.i,plan:j.p,billing:j.b,at:new Date(j.t).toLocaleTimeString()};}));}catch(e){} return journey.slice(); },
    reset: function(){ journey=[]; jsave('s','wb_journey',journey); sset('wb_funnel_id', funnelId=uuid()); sset('wb_funnel_start',String(Date.now())); }
  };
  /* backward-compat: existing pages call wbTrack(ev,props) */
  window.wbTrack = function(ev, props){ return emit(ev, props); };

  /* auto page_view on every page → base Pixel PageView + dataLayer + Clarity.
     (funnel reports scope step 0 to page='homepage'; other pages carry their own `page`.) */
  emit('page_view', {title: document.title});

  if(DEBUG) console.log('%c[WBF] ready','color:#7DC57A;font-weight:bold',{page:PAGE,funnel_id:funnelId,attribution:ATTR});
})();
