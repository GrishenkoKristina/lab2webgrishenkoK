import { UIComponent } from "./UIComponent.js";

const makeId = () => globalThis.crypto?.randomUUID?.() ?? `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export class ToDoWidget extends UIComponent {
  constructor(id, tasks = []) {
    super(id, "Мои планы", "todo", "✓", "Соберите всё необходимое для поездки");
    this.tasks = Array.isArray(tasks)
      ? tasks.filter(task => task && typeof task.text === "string" && task.text.trim())
          .map(task => ({ id: String(task.id ?? makeId()), text: task.text.trim().slice(0, 120), done: Boolean(task.done) }))
      : [];
  }

  renderBody() {
    const summary = document.createElement("div");
    summary.className = "todo-summary";
    const summaryTop = document.createElement("div");
    summaryTop.className = "todo-summary-top";
    const summaryLabel = document.createElement("span");
    summaryLabel.textContent = "Прогресс подготовки";
    const summaryCount = document.createElement("strong");
    summaryTop.append(summaryLabel, summaryCount);
    const progressTrack = document.createElement("div");
    progressTrack.className = "progress-track";
    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    progressTrack.append(progressBar);
    summary.append(summaryTop, progressTrack);

    const form = document.createElement("form");
    form.className = "todo-form";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Добавить задачу к поездке...";
    input.maxLength = 120;
    input.setAttribute("aria-label", "Новая задача");
    const add = document.createElement("button");
    add.type = "submit";
    add.className = "small-button";
    add.textContent = "+ Добавить";
    form.append(input, add);

    const list = document.createElement("ul");
    list.className = "task-list";
    const paint = () => {
      list.replaceChildren();
      const done = this.tasks.filter(task => task.done).length;
      const total = this.tasks.length;
      summaryCount.textContent = `${done} из ${total}`;
      progressBar.style.width = `${total ? done / total * 100 : 0}%`;
      if (!total) {
        const empty = document.createElement("li");
        empty.className = "empty-state";
        empty.innerHTML = '<span class="empty-icon">✦</span><span>Пока нет планов — добавьте первую задачу</span>';
        list.append(empty);
      }
      this.tasks.forEach(task => {
        const item = document.createElement("li");
        item.className = `task-item${task.done ? " done" : ""}`;
        const checkLabel = document.createElement("label");
        checkLabel.className = "task-check-wrap";
        const check = document.createElement("input");
        check.type = "checkbox";
        check.checked = task.done;
        check.setAttribute("aria-label", `Отметить задачу «${task.text}» выполненной`);
        check.addEventListener("change", () => {
          task.done = check.checked;
          paint();
          this.onChange?.();
        });
        const checkVisual = document.createElement("span");
        checkVisual.className = "task-check-visual";
        checkLabel.append(check, checkVisual);
        const text = document.createElement("span");
        text.className = "task-text";
        text.textContent = task.text;
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "task-remove";
        remove.textContent = "×";
        remove.title = "Удалить задачу";
        remove.setAttribute("aria-label", `Удалить задачу «${task.text}»`);
        remove.addEventListener("click", () => {
          this.tasks = this.tasks.filter(t => t.id !== task.id);
          paint();
          this.onChange?.();
        });
        item.append(checkLabel, text, remove);
        list.append(item);
      });
    };

    form.addEventListener("submit", event => {
      event.preventDefault();
      const value = input.value.trim();
      if (!value) {
        input.focus();
        input.setCustomValidity("Введите название задачи");
        input.reportValidity();
        input.addEventListener("input", () => input.setCustomValidity(""), { once: true });
        return;
      }
      this.tasks.push({ id: makeId(), text: value, done: false });
      input.value = "";
      paint();
      this.onChange?.();
      input.focus();
    });
    this.body.append(summary, form, list);
    paint();
  }

  getData() { return { id: this.id, type: this.type, tasks: this.tasks }; }
}
