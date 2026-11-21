/* Карта выбора точки: Leaflet + OpenStreetMap, без ключей.
   Клик по карте → обратное геокодирование → адрес в форму и километры. */
(function () {
  var box = document.getElementById('map');
  if (!box || typeof L === 'undefined') return;

  var station = document.getElementById('station');
  var addr = document.getElementById('addr');
  var km = document.getElementById('km');
  var hint = document.getElementById('addr-hint');
  var total = document.getElementById('total');

  var STATIONS = [
    { id: 'moscow',    name: 'Московский вокзал',  lat: 59.9297, lon: 30.3622 },
    { id: 'ladoga',    name: 'Ладожский вокзал',   lat: 59.9317, lon: 30.4413 },
    { id: 'vitebsk',   name: 'Витебский вокзал',   lat: 59.9200, lon: 30.3286 },
    { id: 'baltiysky', name: 'Балтийский вокзал',  lat: 59.9070, lon: 30.3010 },
    { id: 'finland',   name: 'Финляндский вокзал', lat: 59.9553, lon: 30.3563 },
    { id: 'pulkovo',   name: 'Аэропорт Пулково',   lat: 59.8003, lon: 30.2625 }
  ];

  var map = L.map('map', { scrollWheelZoom: false }).setView([59.88, 30.34], 10);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  // метки точек подачи
  STATIONS.forEach(function (s) {
    var m = L.marker([s.lat, s.lon]).addTo(map).bindTooltip(s.name, { direction: 'top' });
    m.on('click', function () {
      if (station) {
        for (var i = 0; i < station.options.length; i++) {
          if (station.options[i].value === s.id) { station.selectedIndex = i; break; }
        }
        station.dispatchEvent(new Event('change'));
      }
      setHint('Откуда: ' + s.name + '. Теперь ткните на карте точку назначения.');
    });
  });

  var dest = null;

  function setHint(text) { if (hint) hint.textContent = text; }

  function haversine(lat1, lon1, lat2, lon2) {
    var R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function stationCoords() {
    if (!station || !station.value) return null;
    for (var i = 0; i < STATIONS.length; i++) {
      if (STATIONS[i].id === station.value) return STATIONS[i];
    }
    return null;
  }

  map.on('click', function (e) {
    var lat = e.latlng.lat, lon = e.latlng.lng;

    if (dest) { map.removeLayer(dest); }
    dest = L.marker([lat, lon], { opacity: .95 }).addTo(map);

    var st = stationCoords();
    if (!st) {
      setHint('Сначала выберите, откуда едем — в поле «Откуда» или по метке на карте.');
      return;
    }

    var direct = haversine(st.lat, st.lon, lat, lon);
    var road = Math.max(2, Math.round(direct * 1.35));
    if (km) { km.value = road; km.dispatchEvent(new Event('input')); }

    setHint('Считаю адрес…');

    fetch('https://photon.komoot.io/reverse?lat=' + lat + '&lon=' + lon)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var f = data && data.features && data.features[0];
        var p = (f && f.properties) || {};
        var parts = [];
        if (p.street) parts.push(p.street + (p.housenumber ? ', ' + p.housenumber : ''));
        if (!parts.length && p.name) parts.push(p.name);
        if (!parts.length && p.city) parts.push(p.city);
        var text = parts.join(', ') || (lat.toFixed(5) + ', ' + lon.toFixed(5));
        if (addr) addr.value = text;
        if (dest) dest.bindTooltip(text, { direction: 'top' }).openTooltip();
        setHint('Откуда: ' + st.name + ' → ' + text + ', около ' + road + ' км по дорогам.');
        var comment = document.getElementById('comment');
        if (comment) comment.value = 'Откуда: ' + st.name + '; куда: ' + text + '; ~' + road + ' км';
      })
      .catch(function () {
        setHint('Откуда: ' + st.name + ' → точка на карте, около ' + road + ' км (адрес не распознался).');
      });
  });

  // подсказка при первом открытии
  setHint('Ткните на карте точку назначения — адрес и километры подставятся сами. Откуда — выберите в поле или нажмите метку.');
})();
