/* ============================================================================
   Tried & Traded — Test of the Week signup prompt.

   TRIGGER: the visitor's SECOND page in a session, then whichever comes first of
   12 seconds or 35% scroll. Someone who clicked through to a second page is
   reading; someone who landed and bounced is not, and interrupting them is how a
   popup earns its reputation.

   IT IS A BOTTOM SLIDE-IN, NOT A FULL-SCREEN OVERLAY, AND THAT IS DELIBERATE.
   Google treats intrusive interstitials — content covered by a modal on arrival,
   especially on mobile — as a ranking negative. This site is about to be indexed.
   A panel docked to the bottom that leaves the article readable is explicitly
   allowed. Do not "upgrade" this to a centre modal.

   NEVER SHOWN: on the homepage (the full signup is already there), to anyone who
   has signed up, or to anyone who dismissed it in the last 30 days.
   ========================================================================== */
(function () {
  'use strict';

  var ENDPOINT = 'https://bbl-pipeline-7006497428.development.catalystserverless.com.au/server/tnt_lead_capture/';

  var K_DONE = 'tt-signed-up';      // permanent — they converted
  var K_HIDE = 'tt-popup-hidden';   // timestamp — they said no
  var K_SEEN = 'tt-popup-seen';     // session — once per session, whatever happens
  var K_PAGES = 'tt-pageviews';
  var COOLDOWN_DAYS = 30;

  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function ss(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  // ---- count this pageview first, whatever else happens ----
  var views = parseInt(ss(K_PAGES) || '0', 10) + 1;
  ssSet(K_PAGES, String(views));

  var onHome = /(^\/$|\/index\.html$)/.test(location.pathname);

  function suppressed() {
    if (onHome) return 'homepage';
    if (ls(K_DONE)) return 'already signed up';
    if (ss(K_SEEN)) return 'seen this session';
    if (views < 2) return 'first page';
    var h = parseInt(ls(K_HIDE) || '0', 10);
    if (h && (Date.now() - h) < COOLDOWN_DAYS * 864e5) return 'dismissed recently';
    return null;
  }
  if (suppressed()) return;

  // ---------------------------------------------------------------- markup
  var wrap = document.createElement('div');
  wrap.className = 'ttp';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'false');
  wrap.setAttribute('aria-labelledby', 'ttpTitle');
  wrap.innerHTML =
    '<div class="ttp-bar">TEST-OF-THE-WEEK.EXE' +
      '<button class="ttp-x" type="button" aria-label="Close">×</button></div>' +
    '<div class="ttp-body">' +
      '<img class="ttp-fig" src="/assets/mascots/ferret-up.svg" alt="" width="92" height="153">' +
      '<div class="ttp-main">' +
        '<p class="ttp-kick"><b></b>Free · every Tuesday</p>' +
        '<h2 id="ttpTitle">One strategy,<br>tested properly.</h2>' +
        '<p class="ttp-sub">The verdict, the assumptions behind it, and the condition that ' +
          'changes the answer. No tips, no signals, nothing you have to act on.</p>' +
        '<form class="ttp-form" novalidate>' +
          '<div class="ttp-two">' +
            '<input type="text" name="first_name" required autocomplete="given-name" placeholder="First name" aria-label="First name" maxlength="60">' +
            '<input type="text" name="last_name" required autocomplete="family-name" placeholder="Last name" aria-label="Last name" maxlength="60">' +
          '</div>' +
          '<input type="email" name="email" required autocomplete="email" placeholder="you@example.com" aria-label="Email address" maxlength="120">' +
          '<button type="submit">Send me the test</button>' +
        '</form>' +
        '<div class="ttp-msg" role="status" aria-live="polite"></div>' +
        '<button class="ttp-no" type="button">No thanks</button>' +
      '</div>' +
    '</div>';

  var shown = false, lastFocus = null;
  var msg = wrap.querySelector('.ttp-msg');
  var form = wrap.querySelector('.ttp-form');

  function show() {
    if (shown) return;
    shown = true;
    ssSet(K_SEEN, '1');
    document.body.appendChild(wrap);
    // next frame so the transition actually runs
    requestAnimationFrame(function () { wrap.classList.add('open'); });
    lastFocus = document.activeElement;
    document.addEventListener('keydown', onKey);
  }

  function close(remember) {
    if (!shown) return;
    if (remember) lsSet(K_HIDE, String(Date.now()));
    wrap.classList.remove('open');
    document.removeEventListener('keydown', onKey);
    setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 250);
    try { if (lastFocus && lastFocus.focus) lastFocus.focus(); } catch (e) {}
  }

  function onKey(e) {
    if (e.key === 'Escape') { close(true); return; }
    if (e.key !== 'Tab') return;
    // Keep tabbing inside the panel while it is open.
    var f = wrap.querySelectorAll('button, input, a[href]');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  wrap.querySelector('.ttp-x').addEventListener('click', function () { close(true); });
  wrap.querySelector('.ttp-no').addEventListener('click', function () { close(true); });

  // ---------------------------------------------------------------- submit
  function say(kind, text) { msg.className = 'ttp-msg ' + kind; msg.textContent = text; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fn = form.first_name.value.trim(),
        ln = form.last_name.value.trim(),
        em = form.email.value.trim();

    if (!fn) { say('err', 'Please add your first name.'); form.first_name.focus(); return; }
    if (!ln) { say('err', 'Please add your last name.'); form.last_name.focus(); return; }
    if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(em)) { say('err', 'That email address does not look right.'); form.email.focus(); return; }

    var btn = form.querySelector('button[type=submit]');
    btn.disabled = true; say('', 'Sending…');

    // text/plain, NOT application/json — Catalyst answers the CORS preflight itself
    // with no headers, so a preflighted request never leaves the browser.
    // Same rule as the homepage form. Do not change it.
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({
        first_name: fn, last_name: ln, email: em.toLowerCase(),
        source: 'triedandtraded.com', page: location.pathname,
        utm_source: ss('tnt_utm_source') || '', utm_medium: ss('tnt_utm_medium') || '',
        utm_campaign: ss('tnt_utm_campaign') || ''
      })
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      lsSet(K_DONE, '1');
      say('ok', 'Done. Check your inbox to confirm — the first test lands Tuesday.');
      form.style.display = 'none';
      setTimeout(function () { close(false); }, 3200);
    }).catch(function () {
      say('err', 'That did not save. Nothing was recorded — please try again.');
    }).finally(function () { btn.disabled = false; });
  });

  // ---------------------------------------------------------------- triggers
  var timer = setTimeout(show, 12000);
  function onScroll() {
    var h = document.documentElement;
    var pct = (h.scrollTop || document.body.scrollTop) / ((h.scrollHeight - h.clientHeight) || 1);
    if (pct > 0.35) { clearTimeout(timer); window.removeEventListener('scroll', onScroll); show(); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();
