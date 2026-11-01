import { UIComponent } from "./UIComponent.js";

const CITIES = {
  "Владивосток": { latitude: 43.1155, longitude: 131.8855 },
  "Москва": { latitude: 55.7558, longitude: 37.6173 },
  "Санкт-Петербург": { latitude: 59.9343, longitude: 30.3351 },
  "Берлин": { latitude: 52.52, longitude: 13.405 },
  "Токио": { latitude: 35.6762, longitude: 139.6503 }
};

const WEATHER = {
  0: ["Ясно", "☀️"], 1: ["Преимущественно ясно", "🌤️"], 2: ["Переменная облачность", "⛅"],
  3: ["Пасмурно", "☁️"], 45: ["Туман", "🌫️"], 48: ["Изморозь", "🌫️"],
  51: ["Лёгкая морось", "🌦️"], 53: ["Морось", "🌦️"], 55: ["Сильная морось", "🌧️"],
  61: ["Небольшой дождь", "🌦️"], 63: ["Дождь", "🌧️"], 65: ["Сильный дождь", "🌧️"],
  71: ["Небольшой снег", "🌨️"], 73: ["Снег", "🌨️"], 75: ["Сильный снег", "❄️"],
  80: ["Ливень", "🌧️"], 81: ["Сильный ливень", "🌧️"], 82: ["Очень сильный ливень", "⛈️"],
  95: ["Гроза", "⛈️"], 96: ["Гроза с градом", "⛈️"], 99: ["Сильная гроза", "⛈️"]
};

export class WeatherWidget extends UIComponent {
  constructor(id, city = "Владивосток") {
    super(id, "Погода", "weather", "☀", "Погода в городе назначения");
    this.city = CITIES[city] ? city : "Владивосток";
  }

  renderBody() {
    const toolbar = document.createElement("div");
    toolbar.className = "weather-toolbar";
    const cityLabel = document.createElement("span");
    cityLabel.textContent = "Город поездки";
    const selector = document.createElement("select");
    selector.className = "weather-city-select";
    selector.setAttribute("aria-label", "Город для прогноза погоды");
    Object.keys(CITIES).forEach(city => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      option.selected = city === this.city;
      selector.append(option);
    });
    selector.addEventListener("change", () => {
      this.city = selector.value;
      this.onChange?.();
      this.load();
    });
    toolbar.append(cityLabel, selector);
    const content = document.createElement("div");
    this.body.append(toolbar, content);
    this.content = content;
    this.load();
  }

  async load() {
    if (this.destroyed) return;
    this.abortController?.abort();
    this.abortController = new AbortController();
    const loading = document.createElement("div");
    loading.className = "data-loading weather-loading";
    loading.textContent = "Получаем свежий прогноз...";
    this.content.replaceChildren(loading);
    try {
      const { latitude, longitude } = CITIES[this.city];
      const params = new URLSearchParams({
        latitude, longitude,
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
        daily: "weather_code,temperature_2m_max,temperature_2m_min",
        forecast_days: "4", timezone: "auto"
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: this.abortController.signal });
      if (!response.ok) throw new Error(`Сервис погоды ответил с ошибкой (${response.status}).`);
      const data = await response.json();
      if (this.destroyed) return;
      const current = data.current;
      if (!current || !Number.isFinite(current.temperature_2m) ||
          !Number.isFinite(current.apparent_temperature) ||
          !Number.isFinite(current.relative_humidity_2m) ||
          !Number.isFinite(current.wind_speed_10m) ||
          !Array.isArray(data.daily?.time) || data.daily.time.length < 4 ||
          !Array.isArray(data.daily?.temperature_2m_max) ||
          !Array.isArray(data.daily?.temperature_2m_min) ||
          !Array.isArray(data.daily?.weather_code)) {
        throw new Error("Сервис вернул неполные данные о погоде.");
      }
      const [description, symbol] = WEATHER[current.weather_code] ?? ["Погодные условия", "🌍"];
      const main = document.createElement("div");
      main.className = "weather-main";
      const left = document.createElement("div");
      const location = document.createElement("div");
      location.className = "weather-location";
      location.textContent = this.city;
      const temp = document.createElement("div");
      temp.className = "weather-temp";
      temp.textContent = `${Math.round(current.temperature_2m)}°`;
      const desc = document.createElement("div");
      desc.className = "weather-desc";
      desc.textContent = description;
      left.append(location, temp, desc);
      const icon = document.createElement("div");
      icon.className = "weather-symbol";
      icon.textContent = symbol;
      main.append(left, icon);

      const meta = document.createElement("div");
      meta.className = "data-meta";
      meta.append(
        this.metric("ОЩУЩАЕТСЯ", `${Math.round(current.apparent_temperature)}°`),
        this.metric("ВЛАЖНОСТЬ", `${current.relative_humidity_2m}%`),
        this.metric("ВЕТЕР", `${Math.round(current.wind_speed_10m)} км/ч`)
      );

      const forecastTitle = document.createElement("div");
      forecastTitle.className = "forecast-title";
      forecastTitle.textContent = "Прогноз на 3 дня · Open-Meteo";
      const forecast = document.createElement("div");
      forecast.className = "forecast-list";
      data.daily.time.slice(1, 4).forEach((date, index) => {
        const row = document.createElement("div");
        row.className = "forecast-day";
        const day = document.createElement("span");
        day.className = "forecast-date";
        day.textContent = new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
        const [label, emoji] = WEATHER[data.daily.weather_code[index + 1]] ?? ["", "🌤️"];
        const condition = document.createElement("span");
        condition.className = "forecast-condition";
        condition.textContent = `${emoji} ${label}`;
        const range = document.createElement("strong");
        range.textContent = `${Math.round(data.daily.temperature_2m_max[index + 1])}° / ${Math.round(data.daily.temperature_2m_min[index + 1])}°`;
        row.append(day, condition, range);
        forecast.append(row);
      });
      this.content.replaceChildren(main, meta, forecastTitle, forecast);
    } catch (error) {
      if (error.name === "AbortError" || this.destroyed) return;
      this.showError(error.message);
    }
  }

  metric(label, value) {
    const wrapper = document.createElement("div");
    const small = document.createElement("span");
    small.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value;
    wrapper.append(small, strong);
    return wrapper;
  }

  showError(message) {
    const box = document.createElement("div");
    box.className = "data-error";
    const text = document.createElement("div");
    text.textContent = `Не удалось получить погоду: ${message}`;
    const retry = document.createElement("button");
    retry.className = "retry-button";
    retry.textContent = "Повторить загрузку";
    retry.addEventListener("click", () => this.load());
    box.append(text, retry);
    this.content.replaceChildren(box);
  }

  getData() { return { id: this.id, type: this.type, city: this.city }; }
}
