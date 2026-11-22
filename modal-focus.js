/* Общая логика модальных окон: изоляция фона, ловушка фокуса, возврат фокуса.
   Подключается до call.js и map.js. Использование:
     modalFocus.open(modalElement, elementForInitialFocus)
     modalFocus.close(modalElement)
*/
(function () {
  var current = null;

  function focusables(root) {
    var sel = 'a[href], button:not([disabled]), input:not([disabled]), ' +
              'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.prototype.slice.call(root.querySelectorAll(sel)).filter(function (el) {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
    });
  }

  function onKey(e) {
    if (e.key !== 'Tab' || !current) return;
    var list = focusables(current);
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function setBackgroundInert(modal, on) {
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (el === modal) return;
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
      if (on) {
        el.setAttribute('inert', '');
        el.setAttribute('aria-hidden', 'true');
      } else {
        el.removeAttribute('inert');
        el.removeAttribute('aria-hidden');
      }
    });
  }

  window.modalFocus = {
    open: function (modal, initial) {
      if (!modal) return;
      current = modal;
      modal.__savedFocus = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      setBackgroundInert(modal, true);
      document.addEventListener('keydown', onKey, true);
      var target = initial || focusables(modal)[0] || modal;
      setTimeout(function () { if (target && target.focus) target.focus(); }, 40);
    },
    close: function (modal) {
      if (!modal) return;
      current = null;
      document.removeEventListener('keydown', onKey, true);
      setBackgroundInert(modal, false);
      modal.hidden = true;
      document.body.style.overflow = '';
      var back = modal.__savedFocus;
      if (back && back.focus) setTimeout(function () { back.focus(); }, 30);
    }
  };
})();
