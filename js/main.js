import { Dashboard } from "./Dashboard.js";

const container = document.querySelector("#widget-grid");
const notice = document.querySelector("#notice");
const select = document.querySelector("#widget-select");
const addButton = document.querySelector("#add-widget");

const dashboard = new Dashboard(container, notice);
dashboard.restore();

addButton.addEventListener("click", () => {
  dashboard.addWidget(select.value);
});