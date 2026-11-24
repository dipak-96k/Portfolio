"use strict";

// Decorative line icons share a single coordinate system and accessible text labels.
const outlines = {
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
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
const menu = document.querySelector(".menu-toggle");
const navLinks = [...navigation.querySelectorAll("a")];
const sections = navLinks.map(link => document.querySelector(link.hash));
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
  if (!event.target.closest(".topbar")) setMenu(false);
});
matchMedia("(min-width: 791px)").addEventListener("change", () => setMenu(false));

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

// An original schematic of the prototype's sensor arrangement, drawn in track coordinates.
function drawRailDiagram(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const project = (x, y, z = 0) => [470 + x * .93 + y * .8, 225 - x * .32 + y * .46 - z];
  function path(points, stroke, fill, width = 2) {
    ctx.beginPath();
    points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    if (fill) { ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
  }
  function block(x,y,z,w,d,h, colors) {
    const corner = (dx,dy,dz) => project(x+dx,y+dy,z+dz);
    path([corner(0,d,h),corner(w,d,h),corner(w,d,0),corner(0,d,0)],colors[3],colors[1]);
    path([corner(0,0,h),corner(0,d,h),corner(0,d,0),corner(0,0,0)],colors[3],colors[2]);
    path([corner(0,0,h),corner(w,0,h),corner(w,d,h),corner(0,d,h)],colors[3],colors[0]);
  }
  const bg = ctx.createLinearGradient(0,0,960,410);
  bg.addColorStop(0,"#102d33"); bg.addColorStop(.63,"#173f40"); bg.addColorStop(1,"#123134");
  ctx.fillStyle=bg; ctx.fillRect(0,0,960,410);
  for (let x=-800; x<=800; x+=42) path([project(x,-600),project(x,600)],"#285050",null,1);
  for (let y=-600; y<=600; y+=42) path([project(-800,y),project(800,y)],"#25494a",null,1);
  for (let x=-650; x<650; x+=28) block(x,-48,0,12,96,3,["#366460","#1f4845","#28534e","#48736c"]);
  for (const y of [-32,27]) block(-620,y,4,1240,6,5,["#a4cab6","#689282","#42766e","#78a495"]);
  // The instrument trolley carries the edge computer and forward-facing sensors.
  block(-89,-34,11,157,68,13,["#608c7f","#41695f","#33574f","#93b7a5"]);
  block(-72,-28,25,105,52,22,["#87a99c","#436d63","#50776a","#b1cdba"]);
  block(-48,-18,48,45,33,19,["#c0d4b9","#739587","#8daa96","#c8d6bf"]);
  block(35,-18,26,24,36,25,["#b2c9ab","#759a81","#668b75","#bad2b2"]);
  for (let i=0; i<4; i++) path([project(-63+i*9,24,42),project(-60+i*9,24,32)],"#244c4a",null,2);
  const tip=project(65,0,39);
  path([tip,project(280,-94,16),project(280,94,16)],"#8adfba55","#87e5ae16",2);
  for (let i=1;i<=3;i++) {
    ctx.beginPath(); ctx.ellipse(tip[0]+i*37,tip[1]-i*13,14+i*3,8+i*5,-.32,-1.15,1.1);
    ctx.lineWidth=2;ctx.strokeStyle="#a2e2be";ctx.stroke();
  }
  function label(text,x,y,target) {
    const [tx,ty]=target;
    path([[x,y+11],[x+45,y+11],[tx,ty]],"#8ab9aa",null,1.5);
    ctx.fillStyle="#d1e6d8";ctx.font="19px Consolas, monospace";ctx.fillText(text,x,y);
    ctx.beginPath();ctx.arc(tx,ty,3,0,Math.PI*2);ctx.fill();
  }
  label("Camera + radar",100,72,project(47,-12,55));
  label("Track sensors",675,283,project(66,26,25));
}
drawRailDiagram(document.querySelector("#rail-art"));
