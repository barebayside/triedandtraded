/* COPY of site/js/bbl-chat.js (2026-10-21) with Tried & Traded defaults. Edit bbl-chat.js first, then re-copy.
   from the site's own content (products/site-agent/) and offers the right next step.

   Place once per page, before </body>:
     <div data-bbl-chat data-site="bbl"
          data-endpoint="https://siteagent-7006497428.development.catalystserverless.com.au/server/site_agent/"></div>
     <script src="/js/bbl-chat.js?v=1" defer></script>

   When the visitor wants a person, the agent says so and this shows a name + email box, which posts
   to the EXISTING bbl_lead_capture as form:"contact" with the chat as the message: the same CRM path
   and alert email as the Contact page. text/plain keeps every POST a CORS-"simple" request
   (Catalyst answers the preflight itself, wrongly). The button sits bottom-LEFT so it never covers
   the sign-up beaker pop-up, which lives bottom-right. */
(function () {
  var host = document.querySelector('[data-bbl-chat]');
  if (!host) return;
  var SITE = host.getAttribute('data-site') || 'bbl';
  var ENDPOINT = host.getAttribute('data-endpoint');
  var LEADS = host.getAttribute('data-lead-endpoint') || 'https://bbl-pipeline-7006497428.catalystserverless.com.au/server/bbl_lead_capture/';
  var BUTTON_IMG = host.getAttribute('data-button-img') || '/assets/images/chat/bbl-mascot-button.webp';
  var FULL_IMG = host.getAttribute('data-full-img') || '/assets/images/chat/bbl-mascot-full.webp';
  var NAME = host.getAttribute('data-name') || 'Ask the lab';
  var GREETING = host.getAttribute('data-greeting') ||
    "Hi, I'm the Bare Bayside Labs assistant (an AI). Ask me anything about our reports, prices or how it works.";
  var EMAIL = host.getAttribute('data-email') || 'service@barebaysidelabs.com';
  var KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid','msclkid'];
  if (!ENDPOINT) return;

  function get(store, k) { try { return window[store].getItem(k); } catch (e) { return null; } }
  function set(store, k, v) { try { window[store].setItem(k, v); } catch (e) {} }

  var visitor = get('localStorage', 'bbl_chat_visitor');
  if (!visitor) { visitor = 'v' + Math.random().toString(36).slice(2) + Date.now().toString(36); set('localStorage', 'bbl_chat_visitor', visitor); }
  var history = [];
  try { history = JSON.parse(get('sessionStorage', 'bbl_chat_history_' + SITE) || '[]') || []; } catch (e) { history = []; }
  var leadSent = get('sessionStorage', 'bbl_chat_lead_' + SITE) === '1';

  var css = '' +
    '.bbc-btn{position:fixed;left:16px;bottom:16px;z-index:59;width:64px;height:64px;border-radius:50%;border:2px solid rgba(167,139,250,.7);padding:0;cursor:pointer;' +
      'background:#080c14 url(' + BUTTON_IMG + ') center/contain no-repeat;box-shadow:0 10px 30px rgba(14,22,38,.35),0 0 0 6px rgba(167,139,250,.15);transition:transform .2s}' +
    '.bbc-btn:hover{transform:scale(1.06)}' +
    '.bbc-btn:focus-visible{outline:3px solid #f59e0b;outline-offset:3px}' +
    '.bbc-hint{position:fixed;left:90px;bottom:28px;z-index:59;background:#fff;color:#111;border-radius:14px;padding:9px 13px;font:600 14px "Plus Jakarta Sans",sans-serif;' +
      'box-shadow:0 8px 24px rgba(0,0,0,.16);cursor:pointer;max-width:calc(100vw - 110px)}' +
    '.bbc-hint:before{content:"";position:absolute;left:-6px;bottom:14px;border:7px solid transparent;border-right-color:#fff;border-left:0}' +
    '.bbc-panel{position:fixed;left:16px;bottom:16px;z-index:61;width:min(380px,calc(100vw - 32px));height:min(580px,calc(100vh - 32px));display:flex;flex-direction:column;' +
      'background:#fff;color:#111;border-radius:18px;overflow:hidden;box-shadow:0 24px 60px rgba(14,22,38,.32);font:15px/1.5 "Plus Jakarta Sans",sans-serif}' +
    '.bbc-head{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#080c14;color:#fff}' +
    '.bbc-head img{width:44px;height:52px;object-fit:contain}' +
    '.bbc-head b{font-family:"Bebas Neue",sans-serif;font-weight:400;font-size:24px;letter-spacing:.04em;text-transform:uppercase;line-height:1}' +
    '.bbc-head small{display:block;color:rgba(255,255,255,.65);font-size:12px}' +
    '.bbc-x{margin-left:auto;background:rgba(255,255,255,.12);border:0;color:#fff;width:32px;height:32px;border-radius:50%;font-size:20px;cursor:pointer}' +
    '.bbc-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f6f7f8}' +
    '.bbc-m{max-width:85%;padding:9px 12px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word}' +
    '.bbc-m.u{align-self:flex-end;background:#2d1b69;color:#fff;border-bottom-right-radius:4px}' +
    '.bbc-m.a{align-self:flex-start;background:#fff;border:1px solid #e5e7eb;border-bottom-left-radius:4px}' +
    '.bbc-m a{color:#6d28d9;font-weight:600}' +
    '.bbc-m.typing{color:#666;font-style:italic}' +
    '.bbc-lead{align-self:stretch;background:#fff;border:1px solid #c4b5fd;border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:8px}' +
    '.bbc-lead input{border:1px solid #e5e7eb;border-radius:9px;padding:9px 11px;font:16px "Plus Jakarta Sans",sans-serif}' +
    '.bbc-lead button{background:#6d28d9;color:#fff;border:0;border-radius:9px;padding:10px;font-weight:700;cursor:pointer}' +
    '.bbc-lead .hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}' +
    '.bbc-form{display:flex;gap:8px;padding:10px;border-top:1px solid #e5e7eb;background:#fff}' +
    '.bbc-form input{flex:1;min-width:0;border:1px solid #e5e7eb;border-radius:10px;padding:10px 12px;font:16px "Plus Jakarta Sans",sans-serif}' +
    '.bbc-form button{background:#080c14;color:#fff;border:0;border-radius:10px;padding:0 14px;font-weight:700;cursor:pointer}' +
    '.bbc-form button:disabled{opacity:.5;cursor:default}' +
    '.bbc-note{font-size:11px;color:#777;padding:0 12px 8px;background:#fff}' +
    '@media (prefers-reduced-motion:reduce){.bbc-btn{transition:none}}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  var btn = document.createElement('button');
  btn.className = 'bbc-btn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Open chat: ' + NAME);
  var hint = null;
  var panel = null, log = null, input = null, send = null;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  // Only site paths become links: the agent is told to write them as (/path), and the function strips
  // any other web address before it gets here.
  function linkify(s) {
    return esc(s)
      .replace(/\((\/[a-z0-9\-\/#?=&_.]*)\)/gi, ' $1')
      .replace(/(\s|^)(\/[a-z0-9\-\/#?=&_.]*[a-z0-9\/#])(?=[\s.,;:]|$)/gi, function (m, pre, path) {
        return pre + '<a href="' + path + '">' + path + '</a>';
      });
  }

  function bubble(role, text) {
    var d = document.createElement('div');
    d.className = 'bbc-m ' + (role === 'user' ? 'u' : 'a');
    if (role === 'user') d.textContent = text; else d.innerHTML = linkify(text);
    log.appendChild(d); log.scrollTop = log.scrollHeight;
    return d;
  }

  function save() { set('sessionStorage', 'bbl_chat_history_' + SITE, JSON.stringify(history.slice(-24))); }

  function transcript() {
    return history.slice(-12).map(function (m) { return (m.role === 'user' ? 'Visitor: ' : 'Assistant: ') + m.content; }).join('\n');
  }

  function leadForm() {
    // data-lead-endpoint="none": a site with no lead path wired (Tried & Traded). The agent is told
    // the same, and points to the site's own sign-up or email instead.
    if (LEADS === 'none' || leadSent || log.querySelector('.bbc-lead')) return;
    var openedAt = Date.now();
    var f = document.createElement('form');
    f.className = 'bbc-lead'; f.noValidate = true;
    f.innerHTML = '<div class="hp" aria-hidden="true"><input type="text" name="company_url" tabindex="-1" autocomplete="off"></div>' +
      '<b>Leave your details and the team will reply by email.</b>' +
      '<input name="full_name" autocomplete="name" placeholder="Your name" aria-label="Your name">' +
      '<input name="email" type="email" autocomplete="email" placeholder="Your email" aria-label="Your email">' +
      '<button type="submit">Send to the team</button><span class="s" role="status" aria-live="polite"></span>';
    log.appendChild(f); log.scrollTop = log.scrollHeight;
    var status = f.querySelector('.s');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {};
      new FormData(f).forEach(function (v, k) { data[k] = String(v).trim(); });
      if (!data.full_name || !data.email || data.email.indexOf('@') < 1) { status.textContent = 'Please add your name and email.'; return; }
      var stored = {}; try { stored = JSON.parse(sessionStorage.getItem('bbl_tracking') || '{}') || {}; } catch (er) {}
      KEYS.forEach(function (k) { if (stored[k]) data[k] = stored[k]; });
      data.form = 'contact';
      data.message = '[Website chat]\n' + transcript();
      data.page = location.pathname; data.referrer = document.referrer || '';
      data.fill_seconds = Math.round((Date.now() - openedAt) / 1000);
      f.querySelector('button').disabled = true; status.textContent = 'Sending…';
      fetch(LEADS, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok || j.status !== 'ok') throw new Error(j.message || r.status); }); })
        .then(function () {
          leadSent = true; set('sessionStorage', 'bbl_chat_lead_' + SITE, '1');
          f.innerHTML = '<b>Thanks, the team has your message and will reply by email.</b>';
          (function ps(i){try{var q=window.pagesense=window.pagesense||[];if(q.push!==Array.prototype.push||i>=60){q.push(['trackEvent','chat_lead_submitted']);return;}setTimeout(function(){ps(i+1);},250);}catch(er){}})(0);
        })
        .catch(function () {
          f.querySelector('button').disabled = false;
          status.textContent = "That didn't send. Please email " + EMAIL + '.';
        });
    });
  }

  function ask(text) {
    history.push({ role: 'user', content: text }); save();
    bubble('user', text);
    var wait = bubble('assistant', 'Thinking…'); wait.classList.add('typing');
    send.disabled = true;
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ site: SITE, visitor: visitor, page: location.pathname, messages: history.slice(-12) }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        wait.remove();
        var reply = (j && j.reply) || ("Sorry, I can't answer right now. You can email us at " + EMAIL + '.');
        history.push({ role: 'assistant', content: reply }); save();
        bubble('assistant', reply);
        if (j && j.show_lead_form) leadForm();
      })
      .catch(function () {
        wait.remove();
        bubble('assistant', "Sorry, I can't answer right now. You can email us at " + EMAIL + '.');
        leadForm();
      })
      .then(function () { send.disabled = false; input.focus(); });
  }

  function open() {
    if (hint) { hint.remove(); hint = null; }
    set('localStorage', 'bbl_chat_seen', '1');
    btn.style.display = 'none';
    if (panel) { panel.style.display = 'flex'; input.focus(); return; }
    panel = document.createElement('div');
    panel.className = 'bbc-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', NAME);
    panel.innerHTML = '<div class="bbc-head"><img alt="" src="' + FULL_IMG + '"><div><b></b><small>AI assistant · answers from this site</small></div>' +
      '<button type="button" class="bbc-x" aria-label="Close chat">&times;</button></div>' +
      '<div class="bbc-log" aria-live="polite"></div>' +
      '<form class="bbc-form"><input name="q" maxlength="1000" autocomplete="off" placeholder="Ask a question…" aria-label="Your question"><button type="submit">Send</button></form>' +
      '<div class="bbc-note">Chats are saved so we can improve the answers. Please don’t share private details.</div>';
    panel.querySelector('.bbc-head b').textContent = NAME;
    document.body.appendChild(panel);
    log = panel.querySelector('.bbc-log'); input = panel.querySelector('input[name=q]'); send = panel.querySelector('.bbc-form button');
    bubble('assistant', GREETING);
    history.forEach(function (m) { bubble(m.role, m.content); });
    panel.querySelector('.bbc-x').addEventListener('click', function () { panel.style.display = 'none'; btn.style.display = ''; btn.focus(); });
    panel.querySelector('.bbc-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value.trim(); if (!q || send.disabled) return;
      input.value = ''; ask(q);
    });
    input.focus();
  }

  btn.addEventListener('click', open);

  // Same rule as the sign-up pop-up: Zoho's cookie banner is a full-width bottom bar, and the
  // cookie choice comes first. Show the button once it has gone (or straight away if there is none).
  function bannerUp() {
    try {
      var c = document.querySelector('#zcb-banner'); if (!c) return false;
      var r = c.getBoundingClientRect(), st = getComputedStyle(c);
      return r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden' && r.top < window.innerHeight;
    } catch (e) { return false; }
  }
  function place() {
    document.body.appendChild(btn);
    if (!get('localStorage', 'bbl_chat_seen')) {
      setTimeout(function () {
        if (panel || hint) return;
        hint = document.createElement('div'); hint.className = 'bbc-hint'; hint.textContent = 'Questions? Ask me.';
        hint.addEventListener('click', open); document.body.appendChild(hint);
      }, 6000);
    }
  }
  var tries = 0;
  (function wait() { if (bannerUp() && tries++ < 240) { setTimeout(wait, 500); } else { place(); } })();
})();
