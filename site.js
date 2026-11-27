"use strict";

// Decorative line icons share a single coordinate system and accessible text labels.
const outlines = {
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  file: '<path d="M5 3h9l5 5v13H5zM14 3v6h5M8 13h8M8 17h6"/>',
  github: '<path d="M9 20c-4.5 1.3-4.5-2.1-6.4-2.5M15.4 22v-3.6c0-1 .1-1.5-.5-2.2 3.3-.4 6.2-1.6 6.2-7 0-1.6-.5-2.8-1.5-3.9.2-.9.2-2.3-.2-3.4-1.4-.2-3.3.9-4.1 1.5a14.3 14.3 0 0 0-6.6 0c-.8-.6-2.7-1.7-4.1-1.5-.4 1.1-.4 2.5-.2 3.4a5.5 5.5 0 0 0-1.5 3.9c0 5.4 2.9 6.6 6.2 7-.6.7-.5 1.2-.5 2.2V22"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 10v7m0-10v.2m4 9.8v-7m0 3c0-4 6-4 6 0v4"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  code: '<path d="m7 7-5 5 5 5m10-10 5 5-5 5m-4-14-3 18"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
  award: '<path d="M8 3h8v6a4 4 0 0 1-8 0ZM8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 2v5m-5 3h10m-8-3h6"/>',
  badge: '<circle cx="12" cy="9" r="6"/><path d="m9 15-2 7 5-2 5 2-2-7m-6-6 2 2 4-4"/>',
  expand: '<path d="M14 4h6v6M20 4l-7 7M10 20H4v-6m0 6 7-7"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  chart: '<path d="M3 3v18h18M7 16v-4m5 4V7m5 9v-7"/>',
  graduation: '<path d="m2 9 10-5 10 5-10 5zm4 2v5q6 5 12 0v-5m4-2v7"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9" y="9" width="6" height="6" rx=".7"/><path d="M9 2v4m6-4v4M2 9h4m-4 6h4M9 18v4m6-4v4m3-13h4m-4 6h4"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
  people: '<circle cx="10" cy="7" r="3"/><path d="M3 20v-2c0-6 14-6 14 0v2M16 4a4 4 0 0 1 0 7m2 2c3 1 4 3 4 6"/>'
};
for (const holder of document.querySelectorAll("[data-icon]")) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  Object.entries({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    "stroke-width": "1.7", "stroke-linecap": "round", "stroke-linejoin": "round",
    class: "icon", "aria-hidden": "true", focusable: "false"
  }).forEach(([key,value]) => svg.setAttribute(key,value));
  svg.innerHTML = outlines[holder.dataset.icon];
  holder.replaceWith(svg);
}

const navigation = document.querySelector("#navigation");
const copyEmail = document.querySelector(".copy-email");
if (copyEmail && navigator.clipboard?.writeText) {
  const status = document.querySelector(".copy-status");
  const address = copyEmail.previousElementSibling.href.slice("mailto:".length);
  let clearStatus;
  copyEmail.hidden = false;
  copyEmail.addEventListener("click", async () => {
    clearTimeout(clearStatus);
    try {
      await navigator.clipboard.writeText(address);
      status.textContent = "Email copied";
    } catch {
      status.textContent = "Select the email address to copy it.";
    }
    clearStatus = setTimeout(() => { status.textContent = ""; }, 4000);
  });
}
const menu = document.querySelector(".menu-toggle");
const navLinks = [...navigation.querySelectorAll("a")];
const sections = [...document.querySelectorAll("main > section")];
document.documentElement.classList.add("js");
menu.hidden = false;

function setMenu(open) {
  navigation.classList.toggle("open", open);
  menu.setAttribute("aria-expanded", String(open));
}
menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") === "false"));
navigation.addEventListener("click", event => {
  const link = event.target.closest("a");
  if (!link) return;
  setMenu(false);
  const section = document.querySelector(link.hash);
  section.tabIndex = -1;
  section.focus({preventScroll: true});
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && navigation.classList.contains("open")) {
    setMenu(false);
    menu.focus();
  }
});
document.addEventListener("click", event => {
  if (!navigation.contains(event.target) && !menu.contains(event.target)) setMenu(false);
});
document.querySelector(".topbar").addEventListener("focusout", event => {
  if (!event.currentTarget.contains(event.relatedTarget)) setMenu(false);
});
matchMedia("(min-width: 1041px)").addEventListener("change", () => setMenu(false));

let frameRequested = false;
function updateLocation() {
  let active = sections[0];
  const threshold = document.querySelector(".topbar").offsetHeight + 48;
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= threshold) active = section;
  }
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
    active = sections[sections.length - 1];
  }
  for (const link of navLinks) {
    if (link.hash === "#" + active.id) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
  const range = document.documentElement.scrollHeight - innerHeight;
  document.querySelector('.topbar').style.setProperty('--read-progress', range > 0 ? Math.min(1, Math.max(0, scrollY / range)) : 0);
  frameRequested = false;
}
function queueLocationUpdate() {
  if (frameRequested) return;
  frameRequested = true;
  requestAnimationFrame(updateLocation);
}
window.addEventListener("scroll", queueLocationUpdate, {passive: true});
window.addEventListener("resize", queueLocationUpdate);
updateLocation();


// Each category remains readable in the HTML when scripting is unavailable.
const switcher = document.querySelector(".skill-tabs");
const tabs = [...switcher.querySelectorAll("button")];
const panels = tabs.map(tab => document.getElementById(tab.dataset.panel));

function selectCategory(index, animate = false) {
  tabs.forEach((tab, i) => {
    const active = i === index;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    panels[i].hidden = !active;
    panels[i].classList.toggle("is-entering", active && animate);
  });
}

function enableTechnologies(panel) {
  const items = [...panel.querySelectorAll(".tech-list li")];
  const label = panel.querySelector(".skill-ring strong");
  const note = panel.querySelector(".tech-note");
  const buttons = items.map(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.textContent;
    item.replaceChildren(button);
    return button;
  });
  function selectTechnology(index) {
    buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
    label.textContent = buttons[index].textContent;
    note.textContent = items[index].dataset.note;
  }
  buttons.forEach((button, index) => button.addEventListener("click", () => selectTechnology(index)));
  selectTechnology(0);
  note.hidden = false;
}

switcher.setAttribute("role", "tablist");
tabs.forEach((tab, i) => {
  const panel = panels[i];
  tab.id = "tab-" + panel.id;
  tab.setAttribute("role", "tab");
  tab.setAttribute("aria-controls", panel.id);
  panel.setAttribute("role", "tabpanel");
  panel.setAttribute("aria-labelledby", tab.id);
  enableTechnologies(panel);
  tab.addEventListener("click", () => selectCategory(i, true));
  tab.addEventListener("keydown", event => {
    const next = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    selectCategory(next, true);
    tabs[next].focus();
  });
});
selectCategory(0);
switcher.hidden = false;

for (const card of document.querySelectorAll("[data-role-panel]")) {
  card.addEventListener("click", () => {
    const index = tabs.findIndex(tab => tab.dataset.panel === card.dataset.rolePanel);
    selectCategory(index);
  });
}
