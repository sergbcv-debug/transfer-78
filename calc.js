(function () {
  var cls = document.getElementById('cls');
  var km = document.getElementById('km');
  var total = document.getElementById('total');
  var note = document.getElementById('calc-note');
  var form = document.getElementById('booking-form');
  var comment = document.getElementById('comment');
  var station = document.getElementById('station');
  var addr = document.getElementById('addr');
  var routeBtn = document.getElementById('calc-route');
  var hint = document.getElementById('addr-hint');
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

  // --- расстояние по карте: геокодер Photon + формула по прямой с поправкой ---
  function haversine(lat1, lon1, lat2, lon2) {
    var R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function setHint(text) { if (hint) hint.textContent = text; }

  function computeRoute() {
    if (!station || !addr) return;
    var opt = station.options[station.selectedIndex];
    var lat = Number(opt.dataset.lat), lon = Number(opt.dataset.lon);
    var q = addr.value.trim();

    if (!opt.value) { setHint('Сначала выберите, откуда едем.'); return; }
    if (q.length < 4) { setHint('Впишите улицу и дом — например, Невский пр., 100.'); return; }

    setHint('Считаю расстояние…');
    if (routeBtn) routeBtn.disabled = true;

    var url = 'https://photon.komoot.io/api/?limit=1&q=' +
              encodeURIComponent('Санкт-Петербург, ' + q);

    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var f = data && data.features && data.features[0];
        if (!f || !f.geometry) {
          setHint('Не нашёл такой адрес. Уточните улицу и дом или впишите километры вручную.');
          return;
        }
        var lon2 = f.geometry.coordinates[0], lat2 = f.geometry.coordinates[1];
        var direct = haversine(lat, lon, lat2, lon2);
        if (direct > 150) {
          setHint('Похоже, это адрес в другом городе. Уточните улицу и дом — например, «Московское шоссе, 14».');
          return;
        }
        var road = Math.max(2, Math.round(direct * 1.35)); // поправка на дороги
        km.value = road;
        calc();
        var name = (f.properties && (f.properties.street || f.properties.name)) || q;
        setHint('Маршрут: ' + opt.textContent + ' → ' + name + ', около ' + road + ' км по дорогам.');
        console.log('[calc] станция:', opt.textContent, '| адрес:', q, '| найдено:', name, lat2, lon2, '| км:', road);
        if (form && comment) {
          comment.value = 'Откуда: ' + opt.textContent + '; куда: ' + q + '; ~' + road + ' км';
        }
      })
      .catch(function () {
        setHint('Сервис карт не ответил. Впишите километры вручную — цена посчитается.');
      })
      .then(function () { if (routeBtn) routeBtn.disabled = false; });
  }

  if (routeBtn) routeBtn.addEventListener('click', computeRoute);
  if (addr) addr.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); computeRoute(); }
  });

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
