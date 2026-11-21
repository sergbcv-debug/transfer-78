(function () {
  var root = document.getElementById('promo-slider');
  if (!root) return;

  var slides = Array.prototype.slice.call(root.querySelectorAll('.slide'));
  var dots = Array.prototype.slice.call(root.querySelectorAll('.dot'));
  var status = root.querySelector('.slider-status');
  var prev = root.querySelector('[data-dir="-1"]');
  var next = root.querySelector('[data-dir="1"]');
  var index = 0;
  var timer = null;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function show(i, announce) {
    index = (i + slides.length) % slides.length;
    slides.forEach(function (s, n) { s.classList.toggle('is-active', n === index); });
    dots.forEach(function (d, n) {
      d.classList.toggle('is-active', n === index);
      d.setAttribute('aria-selected', n === index ? 'true' : 'false');
    });
    if (announce && status) {
      var title = slides[index].querySelector('h2');
      status.textContent = 'Слайд ' + (index + 1) + ' из ' + slides.length +
        (title ? ': ' + title.textContent : '');
    }
  }

  function start() {
    if (reduced) return;
    stop();
    timer = setInterval(function () { show(index + 1, true); }, 7000);
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  if (prev) prev.addEventListener('click', function () { show(index - 1, true); start(); });
  if (next) next.addEventListener('click', function () { show(index + 1, true); start(); });

  dots.forEach(function (d, n) {
    d.addEventListener('click', function () { show(n, true); start(); });
  });

  root.addEventListener('pointerenter', stop);
  root.addEventListener('pointerleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', function (e) {
    if (!root.contains(e.relatedTarget)) start();
  });

  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { show(index - 1, true); e.preventDefault(); }
    if (e.key === 'ArrowRight') { show(index + 1, true); e.preventDefault(); }
  });

  // автопрокрутка не мешает, если вкладка не видна
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  show(0, false);
  start();
})();
