/* Карта в модальном окне: Leaflet + OpenStreetMap, без ключей.
   Открывается ссылкой «(открыть карту)» в поле «Адрес назначения». */
(function () {
  var modal = document.getElementById('map-modal');
  var box = document.getElementById('map');
  var openLink = document.getElementById('open-map');
  var closeBtn = document.getElementById('close-map');
  var hintModal = document.getElementById('map-modal-hint');
  if (!modal || !box) return;

  var station = document.getElementById('station');
  var addr = document.getElementById('addr');
  var km = document.getElementById('km');
  var comment = document.getElementById('comment');

  var STATIONS = [
    { id: 'moscow',    name: 'Московский вокзал',  lat: 59.9297, lon: 30.3622 },
    { id: 'ladoga',    name: 'Ладожский вокзал',   lat: 59.9317, lon: 30.4413 },
    { id: 'vitebsk',   name: 'Витебский вокзал',   lat: 59.9200, lon: 30.3286 },
    { id: 'baltiysky', name: 'Балтийский вокзал',  lat: 59.9070, lon: 30.3010 },
    { id: 'finland',   name: 'Финляндский вокзал', lat: 59.9553, lon: 30.3563 },
    { id: 'pulkovo',   name: 'Аэропорт Пулково',   lat: 59.8003, lon: 30.2625 }
  ];

  var map = null, dest = null;

  function setHint(text) {
    if (hintModal) hintModal.textContent = text;
    var h = document.getElementById('addr-hint');
    if (h) h.textContent = text;
  }

  function haversine(lat1, lon1, lat2, lon2) {
    var R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function stationOf() {
    if (!station || !station.value) return null;
    for (var i = 0; i < STATIONS.length; i++) if (STATIONS[i].id === station.value) return STATIONS[i];
    return null;
  }

  function initMap() {
    if (map) return;
    map = L.map('map', { scrollWheelZoom: true }).setView([59.88, 30.34], 10);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '© OpenStreetMap'
    }).addTo(map);

    STATIONS.forEach(function (s) {
      L.marker([s.lat, s.lon]).addTo(map).bindTooltip(s.name, { direction: 'top' })
        .on('click', function () {
          if (station) {
            for (var i = 0; i < station.options.length; i++) {
              if (station.options[i].value === s.id) { station.selectedIndex = i; break; }
            }
            station.dispatchEvent(new Event('change'));
          }
          setHint('Откуда: ' + s.name + '. Теперь ткните точку назначения на карте.');
        });
    });

    map.on('click', function (e) {
      var lat = e.latlng.lat, lon = e.latlng.lng;
      if (dest) map.removeLayer(dest);
      dest = L.marker([lat, lon]).addTo(map);

      var st = stationOf();
      if (!st) { setHint('Сначала выберите «Откуда» — в поле или нажав метку станции.'); return; }

      var road = Math.max(2, Math.round(haversine(st.lat, st.lon, lat, lon) * 1.35));
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
          if (comment) comment.value = 'Откуда: ' + st.name + '; куда: ' + text + '; ~' + road + ' км';
          setHint('Маршрут: ' + st.name + ' → ' + text + ', около ' + road + ' км.');
          setTimeout(close, 900);
        })
        .catch(function () {
          setHint('Откуда: ' + st.name + ' → точка на карте, около ' + road + ' км (адрес не распознался).');
          setTimeout(close, 900);
        });
    });
  }

  function open(e) {
    if (e) e.preventDefault();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    initMap();
    setTimeout(function () { if (map) map.invalidateSize(); }, 60);
    setHint(stationOf() ? ('Откуда: ' + stationOf().name + '. Ткните точку назначения.')
                        : 'Сначала выберите «Откуда», потом ткните точку на карте.');
  }

  function close() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  if (openLink) openLink.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });
})();
