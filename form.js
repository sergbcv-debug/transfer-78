(function () {
  var form = document.getElementById('booking-form');
  var status = document.getElementById('status');
  var submit = document.getElementById('submit');
  if (!form || !status) return;

  var busy = false;

  function setStatus(text, kind) {
    status.textContent = text;
    status.className = 'form-status' + (kind ? ' ' + kind : '');
    // ошибку объявляем сразу, успех — после текущей речи
    status.setAttribute('role', kind === 'err' ? 'alert' : 'status');
    status.setAttribute('aria-live', kind === 'err' ? 'assertive' : 'polite');
  }

  function markInvalid(el, invalid) {
    if (!el) return;
    if (invalid) {
      el.setAttribute('aria-invalid', 'true');
      el.setAttribute('aria-describedby', 'status');
    } else {
      el.removeAttribute('aria-invalid');
      el.setAttribute('aria-describedby', el.id === 'phone' ? 'phone-hint' : '');
      if (!el.getAttribute('aria-describedby')) el.removeAttribute('aria-describedby');
    }
  }

  function digits(s) {
    return (s || '').replace(/\D+/g, '');
  }

  function lock(on) {
    busy = on;
    submit.setAttribute('aria-disabled', on ? 'true' : 'false');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;

    var nameEl = form.elements['name'];
    var phoneEl = form.elements['phone'];
    var name = nameEl.value.trim();
    var phone = phoneEl.value.trim();

    markInvalid(nameEl, false);
    markInvalid(phoneEl, false);

    if (name.length < 2) {
      setStatus('Напишите, как к вам обращаться.', 'err');
      markInvalid(nameEl, true);
      nameEl.focus();
      return;
    }
    if (digits(phone).length < 10) {
      setStatus('Проверьте номер телефона: нужно не меньше 10 цифр.', 'err');
      markInvalid(phoneEl, true);
      phoneEl.focus();
      return;
    }

    lock(true);
    setStatus('Отправляем заявку…', '');

    fetch('/api/zayavka', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        phone: phone,
        route: form.elements['route'] ? form.elements['route'].value.trim() : '',
        comment: form.elements['comment'].value.trim(),
        page: location.pathname
      })
    })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error(data.error || 'ошибка сервера');
          return data;
        });
      })
      .then(function (data) {
        form.reset();
        setStatus('Заявка №' + data.id + ' принята. Перезвоним в течение 15 минут в рабочее время.', 'ok');
      })
      .catch(function (err) {
        setStatus('Не удалось отправить: ' + err.message + '. Позвоните: +7 (000) 000-00-00.', 'err');
      })
      .then(function () { lock(false); });
  });
})();

// --- демо-режим на GitHub Pages: сервера нет, заявка не отправляется ---
(function () {
  var f = document.getElementById('order-form') || document.querySelector('form');
  if (!f) return;
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var s = document.getElementById('status');
    var msg = 'Это демонстрационная версия: заявка не отправляется. ' +
              'В рабочей версии она приходит на почту и в Telegram.';
    if (s) { s.textContent = msg; s.className = 'form-status ok'; }
    else { alert(msg); }
  }, true);
})();