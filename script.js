// === WEATHER REPORT APP ===
// API: Open-Meteo (gratis, tanpa API key)

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

const WMO_CODES = {
  0:  { desc: 'Cerah',                    icon: '☀️' },
  1:  { desc: 'Sebagian berawan',        icon: '🌤️' },
  2:  { desc: 'Berawan sebagian',       icon: '⛅' },
  3:  { desc: 'Mendung',                  icon: '☁️' },
  45: { desc: 'Berkabut',                 icon: '🌫️' },
  48: { desc: 'Berkabut beku',            icon: '🌫️' },
  51: { desc: 'Gerimis ringan',           icon: '🌦️' },
  53: { desc: 'Gerimis sedang',           icon: '🌦️' },
  55: { desc: 'Gerimis deras',            icon: '🌧️' },
  56: { desc: 'Gerimis beku ringan',      icon: '🌧️' },
  57: { desc: 'Gerimis beku deras',       icon: '🌧️' },
  61: { desc: 'Hujan ringan',             icon: '🌦️' },
  63: { desc: 'Hujan sedang',             icon: '🌧️' },
  65: { desc: 'Hujan deras',              icon: '🌧️' },
  66: { desc: 'Hujan beku ringan',        icon: '🌧️' },
  67: { desc: 'Hujan beku deras',         icon: '🌧️' },
  71: { desc: 'Salju ringan',            icon: '🌨️' },
  73: { desc: 'Salju sedang',            icon: '🌨️' },
  75: { desc: 'Salju deras',             icon: '❄️' },
  77: { desc: 'Butiran salju',           icon: '❄️' },
  80: { desc: 'Hujan lokal ringan',      icon: '🌦️' },
  81: { desc: 'Hujan lokal sedang',      icon: '🌧️' },
  82: { desc: 'Hujan lokal deras',       icon: '⛈️' },
  85: { desc: 'Hujan salju lokal',       icon: '🌨️' },
  86: { desc: 'Hujan salju lokal',       icon: '🌨️' },
  95: { desc: 'Badai petir',              icon: '⛈️' },
  96: { desc: 'Badai petir + hujan es',  icon: '⛈️' },
  99: { desc: 'Badai petir + hujan es',  icon: '⛈️' },
};

// === Enter key support ===
document.getElementById('cityInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') getWeather();
});

// === Auto-load default city ===
window.addEventListener('load', () => {
  document.getElementById('cityInput').value = 'Jakarta';
  getWeather();
});

async function getWeather() {
  const city = document.getElementById('cityInput').value.trim();
  if (!city) return;

  showLoading(true);
  hideError();
  hideWeather();

  try {
    // Step 1: Geocode city name → lat/lon
    const geoRes = await fetch(`${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=id`);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error(`Kota "${city}" tidak ditemukan`);
    }

    const { latitude, longitude, name, country, admin1 } = geoData.results[0];

    // Step 2: Fetch weather data
    const params = new URLSearchParams({
      latitude: latitude,
      longitude: longitude,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max',
      timezone: 'auto',
      forecast_days: '7'
    });

    const wxRes = await fetch(`${WEATHER_URL}?${params}`);
    const wxData = await wxRes.json();

    if (!wxData.current) {
      throw new Error('Data cuaca tidak tersedia untuk lokasi ini');
    }

    displayWeather(name, country, admin1, wxData);
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
}

function displayWeather(name, country, admin1, data) {
  const cur = data.current;
  const daily = data.daily;

  // Header
  document.getElementById('cityName').textContent = `${name}, ${admin1 || country}`;
  const now = new Date();
  document.getElementById('dateTime').textContent = now.toLocaleString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
  });

  // WMO code
  const wmo = WMO_CODES[cur.weather_code] || { desc: 'Tidak diketahui', icon: '❓' };

  // Main
  document.getElementById('temperature').textContent = Math.round(cur.temperature_2m);
  document.getElementById('description').textContent = wmo.desc;

  // Icon (emoji as text since Open-Meteo doesn't provide icon images)
  const iconEl = document.getElementById('weatherIcon');
  iconEl.src = '';
  iconEl.style.display = 'none';
  // Create emoji icon element
  let emojiEl = document.querySelector('.weather-emoji');
  if (!emojiEl) {
    emojiEl = document.createElement('span');
    emojiEl.className = 'weather-emoji';
    emojiEl.style.fontSize = '3rem';
    document.querySelector('.weather-main').insertBefore(emojiEl, document.querySelector('.temp-box'));
  }
  emojiEl.textContent = wmo.icon;

  // Details
  document.getElementById('humidity').textContent = `${cur.relative_humidity_2m}%`;
  document.getElementById('windSpeed').textContent = `${Math.round(cur.wind_speed_10m)} km/h`;
  document.getElementById('feelsLike').textContent = `${Math.round(cur.apparent_temperature)}°C`;
  document.getElementById('pressure').textContent = `${Math.round(cur.pressure_msl)} hPa`;

  // Forecast
  const forecastList = document.getElementById('forecastList');
  forecastList.innerHTML = '';

  const days = daily.time;
  const codes = daily.weather_code;
  const maxTemps = daily.temperature_2m_max;
  const minTemps = daily.temperature_2m_min;

  for (let i = 0; i < days.length; i++) {
    const dayName = i === 0 ? 'Hari ini' : i === 1 ? 'Besok' :
      new Date(days[i]).toLocaleDateString('id-ID', { weekday: 'short' });

    const wmo2 = WMO_CODES[codes[i]] || { desc: '?', icon: '❓' };

    const item = document.createElement('div');
    item.className = 'forecast-item';
    item.innerHTML = `
      <span class="forecast-day">${dayName}</span>
      <span class="forecast-icon">${wmo2.icon}</span>
      <span class="forecast-temps">
        <span class="high">${Math.round(maxTemps[i])}°</span> / <span class="low">${Math.round(minTemps[i])}°</span>
      </span>
    `;
    forecastList.appendChild(item);
  }

  showWeather();
}

// === UI HELPERS ===
function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showError(msg) {
  const el = document.getElementById('error');
  el.textContent = '⚠️ ' + msg;
  el.style.display = 'block';
}

function hideError() {
  document.getElementById('error').style.display = 'none';
}

function showWeather() {
  document.getElementById('weatherCard').style.display = 'block';
}

function hideWeather() {
  document.getElementById('weatherCard').style.display = 'none';
}