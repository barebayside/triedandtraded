/* ============================================================================
   The field scene: the bull charges, the bear charges, they take each other out,
   and the ferret wanders over to look at what is left.

   The animation is pure CSS keyframes — this file only decides WHEN to run it.
   It starts when the scene scrolls into view and replays on each re-entry, so a
   visitor who arrives mid-page still sees it from the beginning rather than
   catching the tail of a loop that has been running to an empty room.

   prefers-reduced-motion is honoured by the stylesheet, which paints the final
   frame instead. Nothing here needs to know about that.
   ========================================================================== */
(function () {
  'use strict';

  var arena = document.querySelector('.arena');
  if (!arena) return;

  var CYCLE = 10200;  // must match the longest keyframe chain in style.css
  var timer = null;

  function play() {
    arena.classList.remove('run');
    // Force a reflow so removing and re-adding the class actually restarts the
    // animations rather than being collapsed into a no-op by the browser.
    void arena.offsetWidth;
    arena.classList.add('run');
  }

  function start() {
    if (timer) return;
    play();
    timer = setInterval(play, CYCLE);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    arena.classList.remove('run');
  }

  if (!('IntersectionObserver' in window)) { start(); return; }

  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) start(); else stop();
    });
  }, { threshold: 0.4 }).observe(arena);

  // Pause while the tab is hidden — a loop nobody is watching is just heat.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
  });
})();
