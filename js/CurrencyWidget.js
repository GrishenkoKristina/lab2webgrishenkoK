import { UIComponent } from "./UIComponent.js";

export class CurrencyWidget extends UIComponent {
  constructor(id, amount = 100) {
    super(id, "Конвертер валют", "currency", "€", "Планируйте бюджет поездки");
    this.amount = Number.isFinite(Number(amount)) && Number(amount) >= 0 ? Number(amount) : 100;
    this.rate = null;
    this.rateDate = "";
  }

  renderBody() {
    const content = document.createElement("div");
    content.className = "currency-content";
    this.body.append(content);
    this.content = content;
    this.load();
  }

  async load() {
    if (this.destroyed) return;
    this.abortController?.abort();
    this.abortController = new AbortController();
    const loading = document.createElement("div");
    loading.className = "data-loading currency-loading";
    loading.textContent = "Загружаем официальный курс...";
    this.content.replaceChildren(loading);
    try {
      const response = await fetch("https://api.frankfurter.dev/v2/rate/eur/usd", { signal: this.abortController.signal });
      if (!response.ok) throw new Error(`Сервис валют ответил с ошибкой (${response.status}).`);
      const data = await response.json();
      if (this.destroyed) return;
      if (typeof data.rate !== "number" || !Number.isFinite(data.rate) || !data.date) {
        throw new Error("Сервис вернул неполный курс EUR/USD.");
      }
      this.rate = data.rate;
      this.rateDate = data.date;
      this.renderRate();
    } catch (error) {
      if (error.name === "AbortError" || this.destroyed) return;
      const box = document.createElement("div");
      box.className = "data-error";
      const message = document.createElement("div");
      message.textContent = `Не удалось получить курс валют: ${error.message}`;
      const retry = document.createElement("button");
      retry.className = "retry-button";
      retry.textContent = "Повторить загрузку";
      retry.addEventListener("click", () => this.load());
      box.append(message, retry);
      this.content.replaceChildren(box);
    }
  }

  renderRate() {
    const rateCard = document.createElement("div");
    rateCard.className = "rate-highlight";
    const rateCopy = document.createElement("div");
    const eyebrow = document.createElement("div");
    eyebrow.className = "rate-eyebrow";
    eyebrow.textContent = "ТЕКУЩИЙ КУРС";
    const value = document.createElement("div");
    value.className = "currency-value";
    value.textContent = `${this.rate.toFixed(4)} $`;
    const caption = document.createElement("div");
    caption.className = "currency-pair";
    caption.textContent = "за 1 евро";
    rateCopy.append(eyebrow, value, caption);
    const badge = document.createElement("div");
    badge.className = "currency-badge";
    badge.textContent = "EUR  →  USD";
    rateCard.append(rateCopy, badge);

    const converter = document.createElement("div");
    converter.className = "converter-box";
    const label = document.createElement("label");
    label.className = "converter-label";
    label.textContent = "Сумма для конвертации";
    label.htmlFor = `amount-${this.id}`;
    const row = document.createElement("div");
    row.className = "converter-row";
    const input = document.createElement("input");
    input.id = `amount-${this.id}`;
    input.type = "number";
    input.min = "0";
    input.step = "0.01";
    input.inputMode = "decimal";
    input.value = String(this.amount);
    input.setAttribute("aria-label", "Сумма в евро");
    const from = document.createElement("span");
    from.className = "currency-chip";
    from.textContent = "EUR";
    const arrow = document.createElement("span");
    arrow.className = "converter-arrow";
    arrow.textContent = "→";
    const output = document.createElement("output");
    output.className = "converter-result";
    output.setAttribute("aria-live", "polite");
    const to = document.createElement("span");
    to.className = "currency-chip currency-chip-dark";
    to.textContent = "USD";
    const update = () => {
      const amount = Number(input.value);
      this.amount = Number.isFinite(amount) && amount >= 0 ? amount : 0;
      output.textContent = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(this.amount * this.rate);
      this.onChange?.();
    };
    input.addEventListener("input", update);
    row.append(input, from, arrow, output, to);
    const date = document.createElement("div");
    date.className = "currency-date";
    date.textContent = `Дата курса: ${this.rateDate} · Источник: Frankfurter`;
    converter.append(label, row, date);
    this.content.replaceChildren(rateCard, converter);
    update();
  }

  getData() { return { id: this.id, type: this.type, amount: this.amount }; }
}
