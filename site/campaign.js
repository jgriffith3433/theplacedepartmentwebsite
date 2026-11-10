(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cards = document.querySelectorAll('.campaign .chapter');
  document.querySelectorAll('.c-seal').forEach(function (b) {
    b.addEventListener('click', function () {
      var li = b.closest('.chapter');
      document.getElementById(b.getAttribute('aria-controls')).hidden = false;
      li.classList.remove('sealed');
      li.removeAttribute('data-sealed');
      li.setAttribute('data-unsealed', 'true');
      b.hidden = true;
    });
  });
  if (reduce || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('reveal-on');
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  cards.forEach(function (c) { io.observe(c); });
})();
