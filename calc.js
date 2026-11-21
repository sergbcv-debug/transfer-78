(function () {
  var cls = document.getElementById('cls');
  var km = document.getElementById('km');
  var total = document.getElementById('total');
  var note = document.getElementById('calc-note');
  var form = document.getElementById('booking-form');
  var comment = document.getElementById('comment');
  if (!cls || !km || !total) return;

  var BASE = 200; // посадка

  function money(n) {
    return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽';
  }

  function calc() {
    var rate = Number(cls.value) || 35;
    var dist = Math.max(1, Math.min(600, Number(km.value) || 1));
    var extra = 0;
    var parts = ['посадка ' + money(BASE)];

    var seat = document.getElementById('opt-seat');
    var sign = document.getElementById('opt-sign');
    if (seat && seat.checked) { extra += Number(seat.value); parts.push('детское кресло ' + money(Number(seat.value))); }
    if (sign && sign.checked) { extra += Number(sign.value); parts.push('встреча ' + money(Number(sign.value))); }

    var sum = BASE + dist * rate + extra;
    total.textContent = money(sum);
    note.textContent = parts[0] + ' + ' + dist + ' км × ' + rate + ' ₽' +
      (extra ? ' + доп. услуги' : '') + '. Итог фиксируем при подтверждении.';
    return { sum: sum, text: cls.options[cls.selectedIndex].dataset.name + ', ' + dist + ' км' };
  }

  [cls, km, document.getElementById('opt-seat'), document.getElementById('opt-sign')]
    .forEach(function (el) { if (el) el.addEventListener('change', calc); });
  km.addEventListener('input', calc);

  // кнопка «Заказать по этой цене» — подставляем расчёт в комментарий
  var go = document.querySelector('.calc-go');
  if (go && form && comment) {
    go.addEventListener('click', function () {
      var r = calc();
      comment.value = 'Расчёт: ' + r.text + ', предварительно ' + money(r.sum);
    });
  }

  calc();
})();
