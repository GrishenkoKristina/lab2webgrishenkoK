export class UIComponent {
  constructor(id, title, type, icon, subtitle = "") {
    this.id = id;
    this.title = title;
    this.type = type;
    this.icon = icon;
    this.subtitle = subtitle;
    this.element = null;
    this.collapsed = false;
    this.destroyed = false;
    this.abortController = null;
  }

  render() {
    const card = document.createElement("article");
    card.className = "widget-card";
    card.dataset.type = this.type;
    card.dataset.id = this.id;

    const head = document.createElement("div");
    head.className = "widget-head";
    const titleWrap = document.createElement("div");
    titleWrap.className = "widget-title-wrap";
    const icon = document.createElement("div");
    icon.className = "widget-icon";
    icon.textContent = this.icon;
    const labels = document.createElement("div");
    const title = document.createElement("div");
    title.className = "widget-title";
    title.textContent = this.title;
    const subtitle = document.createElement("div");
    subtitle.className = "widget-subtitle";
    subtitle.textContent = this.subtitle;
    labels.append(title, subtitle);
    titleWrap.append(icon, labels);

    const actions = document.createElement("div");
    actions.className = "widget-actions";
    const collapse = this.makeAction("−", "Свернуть виджет", () => {
      this.collapsed = !this.collapsed;
      card.classList.toggle("collapsed", this.collapsed);
      collapse.textContent = this.collapsed ? "+" : "−";
      collapse.setAttribute("aria-expanded", String(!this.collapsed));
      collapse.setAttribute("aria-label", this.collapsed ? "Развернуть виджет" : "Свернуть виджет");
      collapse.title = this.collapsed ? "Развернуть виджет" : "Свернуть виджет";
    });
    collapse.setAttribute("aria-expanded", "true");
    const remove = this.makeAction("×", "Удалить виджет", () => {
      this.onRemove?.();
    });
    remove.classList.add("delete");
    actions.append(collapse, remove);
    head.append(titleWrap, actions);

    const body = document.createElement("div");
    body.className = "widget-body";
    card.append(head, body);
    this.element = card;
    this.body = body;
    this.collapseButton = collapse;
    this.renderBody();
    return card;
  }

  makeAction(symbol, label, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "icon-button";
    button.textContent = symbol;
    button.title = label;
    button.setAttribute("aria-label", label);
    button.addEventListener("click", handler);
    return button;
  }

  renderBody() {}

  destroy() {
    this.destroyed = true;
    this.abortController?.abort();
    this.element?.remove();
    this.element = null;
  }
}