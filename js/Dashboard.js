import { ToDoWidget } from "./ToDoWidget.js";
import { WeatherWidget } from "./WeatherWidget.js";
import { CurrencyWidget } from "./CurrencyWidget.js";

const STORAGE_KEY = "kristina-dashboard-v1";

export class Dashboard {
  constructor(container, notice) {
    this.container = container;
    this.notice = notice;
    this.widgets = new Map();
  }

  addWidget(type, saved = null) {
    const allowed = ["todo", "weather", "currency"];
    if (!allowed.includes(type)) return;
    if ([...this.widgets.values()].some(widget => widget.type === type)) {
      this.showNotice("Этот виджет уже добавлен на панель.");
      return;
    }
    const id = saved?.id ?? (globalThis.crypto?.randomUUID?.() ?? `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    let widget;
    if (type === "todo") widget = new ToDoWidget(id, saved?.tasks ?? []);
    if (type === "weather") widget = new WeatherWidget(id, saved?.city ?? "Владивосток");
    if (type === "currency") widget = new CurrencyWidget(id, saved?.amount ?? 100);

    widget.onRemove = () => this.removeWidget(id);
    widget.onChange = () => this.save();
    this.widgets.set(id, widget);
    this.container.querySelector(".empty-dashboard")?.remove();
    this.container.append(widget.render());
    this.save();
  }

  removeWidget(id) {
    const widget = this.widgets.get(id);
    if (!widget) return;
    widget.destroy();
    this.widgets.delete(id);
    this.save();
    if (this.widgets.size === 0) this.showEmpty();
  }

  showEmpty() {
    const empty = document.createElement("div");
    empty.className = "empty-dashboard";
    empty.textContent = "Ваша панель пока пуста. Добавьте первый виджет выше.";
    this.container.append(empty);
  }

  showNotice(message) {
    this.notice.textContent = message;
    window.clearTimeout(this.noticeTimer);
    this.noticeTimer = window.setTimeout(() => { this.notice.textContent = ""; }, 3000);
  }

  save() {
    const data = [...this.widgets.values()].map(widget => widget.getData?.() ?? { id: widget.id, type: widget.type });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch { this.showNotice("Не удалось сохранить данные в этом браузере."); }
  }

  restore() {
    let saved = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) saved = parsed;
      }
    } catch {
      this.showNotice("Сохранённые данные повреждены. Создана новая панель.");
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    }
    saved.forEach(item => {
      // Проверяем каждую запись отдельно: одна повреждённая карточка
      // не должна мешать восстановлению остальных виджетов.
      if (!item || !["todo", "weather", "currency"].includes(item.type)) return;
      if (item.type === "todo" && item.tasks !== undefined && !Array.isArray(item.tasks)) return;
      if (item.type === "weather" && item.city !== undefined &&
          !["Владивосток", "Москва", "Санкт-Петербург", "Берлин", "Токио"].includes(item.city)) {
        item = { ...item, city: "Владивосток" };
      }
      this.addWidget(item.type, item);
    });
    if (!this.widgets.size) this.showEmpty();
  }
}