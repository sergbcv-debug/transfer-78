/* Окно «Заказать звонок»: телефон → заявка туда же, куда основная форма. */
(function () {
  var modal = document.getElementById('call-modal');
  var openBtn = document.getElementById('hero-call');
  var closeBtn = document.getElementById('close-call');
  var form = document.getElementById('call-form');
  var input = document.getElementById('call-phone');
  var status = document.getElementById('call-status');
  if (!modal || !form || !input) return;

  function open(e) {
    if (e) e.preventDefault();
    if (window.modalFocus) window.modalFocus.open(modal, input);
    else { modal.hidden = false; input.focus(); }
  }

  function close() {
    if (window.modalFocus) window.modalFocus.close(modal);
    else modal.hidden = true;
  }

  function say(text, ok) {
    if (!status) return;
    status.textContent = text;
    status.className = 'call-status' + (ok ? ' ok' : ' err');
  }

  if (openBtn) openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var phone = (input.value || '').trim();
    var digits = phone.replace(/\D+/g, '');

    if (digits.length < 10) {
      say('Проверьте номер: нужно не меньше 10 цифр.', false);
      input.focus();
      return;
    }

    say('Отправляем…', true);

    fetch('/api/zayavka', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Звонок с первого экрана',
        phone: phone,
        comment: 'Просит перезвонить',
        page: location.pathname
      })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      })
      .then(function () {
        say('Спасибо! Перезвоним в течение 15 минут.', true);
        input.value = '';
        setTimeout(close, 1800);
      })
      .catch(function () {
        say('Это демонстрационная версия: заявка не отправляется. На рабочем сайте номер уходит менеджеру.', false);
      });
  });
})();
