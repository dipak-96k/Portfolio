(() => {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const cards = ".role-card, .education, .skill-panel, .timeline article, .recognition-grid article, .project-card, .more-projects article";
  const magnets = ".actions a, .contact-links a, a[href^='https://github.com']";
  const hero = document.querySelector(".hero");
  const portrait = hero.querySelector(".portrait-card");
  const root = document.documentElement;
  let heroVisible = false;
  const pointer = { x: 0, y: 0, inHero: false };

  function prepareElements() {
    document.querySelectorAll(cards).forEach(card => card.setAttribute("data-motion-card", ""));
    document.querySelectorAll(magnets).forEach(link => {
      const label = document.createElement("span");
      label.className = "magnetic-label";
      label.append(...link.childNodes);
      link.append(label);
    });
    document.querySelectorAll(".tech-list").forEach(list => {
      Array.from(list.children).forEach((item, i) => item.style.setProperty("--item-delay", (i * 15) + "ms"));
    });
  }

  function observeEntrances() {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("entered-view");
        observer.unobserve(entry.target);
      }
    }, { threshold: .035 });
    const groups = ".timeline, .recognition-grid, .project-grid, .more-projects";
    document.querySelectorAll(groups).forEach(group => {
      Array.from(group.children).forEach((item, i) => item.style.setProperty("--enter-delay", (i % 2 * 55) + "ms"));
    });
    document.querySelectorAll(".section-head, .work-head, .education, .timeline article, .recognition-grid article, .project-card, .more-projects article").forEach(el => observer.observe(el));
  }

  function observeSkills() {
    const tabs = document.querySelector(".skill-tabs");
    const indicator = document.createElement("span");
    indicator.className = "tab-indicator";
    indicator.setAttribute("aria-hidden", "true");
    tabs.append(indicator);
    function place() {
      const active = tabs.querySelector('[aria-selected="true"]');
      if (!active) return;
      indicator.style.width = Math.max(0, active.offsetWidth - 28) + "px";
      indicator.style.transform = "translate(" + (active.offsetLeft + 14) + "px," + (active.offsetTop + active.offsetHeight - 4) + "px)";
    }
    tabs.addEventListener("categorychange", place);
    window.addEventListener("resize", place);
    if ("ResizeObserver" in window) new ResizeObserver(place).observe(tabs);
    place();
  }

  function observeWorkflow() {
    const workflow = document.querySelector(".recovery-workflow");
    workflow.querySelectorAll("li").forEach((stage, i) => stage.style.setProperty("--stage-delay", i * 800 + "ms"));
    let visible = !("IntersectionObserver" in window);
    let played = false;
    function update() {
      if (!workflow.open) {
        played = false;
        workflow.classList.remove("is-playing");
      } else if (visible && !played && !document.hidden && !reduced.matches) {
        played = true;
        workflow.classList.add("is-playing");
      }
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }).observe(workflow);
    }
    workflow.addEventListener("toggle", update);
    document.addEventListener("visibilitychange", update);
  }

  function enablePointer() {
    const halo = document.createElement("div");
    halo.className = "mouse-halo";
    halo.setAttribute("aria-hidden", "true");
    halo.innerHTML = '<i class="mouse-dot"></i><i class="mouse-ring"></i><i class="mouse-ripple"></i>';
    halo.hidden = true;
    document.body.append(halo);
    const [dot, ring, ripple] = halo.children;
    let ringX = 0, ringY = 0, size = 1, targetSize = 1;
    let frame = 0, pressed = false, card = null, magnet = null, target = null;
    let pending = false, touchId = null, releaseTimer = 0;
    const highContrast = matchMedia("(forced-colors: active)");
    const shift = (x,y) => "translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px,0)";
    function position(el) {
      const box = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (pointer.x - box.left) / box.width));
      const y = Math.max(0, Math.min(1, (pointer.y - box.top) / box.height));
      return { x, y };
    }
    function resetMagnet() {
      if (magnet) {
        magnet.style.removeProperty("--mag-x");
        magnet.style.removeProperty("--mag-y");
      }
    }
    function draw() {
      frame = 0;
      if (halo.hidden) return;
      if (pending) {
        pending = false;
        const nextCard = touchId === null ? target.closest("[data-motion-card]") : null;
        const nextMagnet = touchId === null ? target.closest(magnets) : null;
        if (card !== nextCard && card) card.removeAttribute("data-pointed");
        if (magnet !== nextMagnet) resetMagnet();
        card = nextCard;
        magnet = nextMagnet;
        pointer.inHero = touchId === null && hero.contains(target);
        if (card) {
          const {x,y} = position(card);
          card.style.setProperty("--spot-x", x * 100 + "%");
          card.style.setProperty("--spot-y", y * 100 + "%");
          card.style.setProperty("--tilt-x", (0.5 - y) * 10 + "deg");
          card.style.setProperty("--tilt-y", (x - 0.5) * 10 + "deg");
          card.setAttribute("data-pointed", "");
        }
        if (magnet) {
          const {x,y} = position(magnet);
          magnet.style.setProperty("--mag-x", (x - .5) * 9 + "px");
          magnet.style.setProperty("--mag-y", (y - .5) * 9 + "px");
        }
        if (pointer.inHero) {
          const {x,y} = position(hero);
          portrait.style.setProperty("--portrait-x", (x - .5) * 6 + "px");
          portrait.style.setProperty("--portrait-y", (y - .5) * 6 + "px");
        } else {
          portrait.style.removeProperty("--portrait-x");
          portrait.style.removeProperty("--portrait-y");
        }
        targetSize = pressed ? .82 : target.closest("a, button, summary, [data-motion-card]") ? 1.24 : 1;
        dot.style.transform = shift(pointer.x, pointer.y);
      }
      ringX += (pointer.x - ringX) * .24;
      ringY += (pointer.y - ringY) * .24;
      size += (targetSize - size) * .22;
      ring.style.transform = shift(ringX, ringY) + " scale(" + size.toFixed(3) + ")";
      if (Math.abs(pointer.x-ringX) + Math.abs(pointer.y-ringY) + 20 * Math.abs(targetSize-size) > .12) schedule();
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(draw); }
    function hide() {
      clearTimeout(releaseTimer);
      touchId = null;
      root.classList.remove("using-halo");
      halo.classList.remove("is-releasing");
      halo.hidden = true;
      pressed = pending = pointer.inHero = false;
      if (card) card.removeAttribute("data-pointed");
      resetMagnet();
      portrait.style.removeProperty("--portrait-x");
      portrait.style.removeProperty("--portrait-y");
      card = magnet = target = null;
      cancelAnimationFrame(frame);
      frame = 0;
    }
    function showAt(x, y, element) {
      if (reduced.matches || highContrast.matches || document.hidden) { hide(); return false; }
      clearTimeout(releaseTimer);
      halo.classList.remove("is-releasing");
      target = element;
      pointer.x = x;
      pointer.y = y;
      if (halo.hidden) {
        ringX = x; ringY = y; size = 1;
        dot.style.transform = ring.style.transform = shift(x, y);
        halo.hidden = false;
      }
      pending = true;
      schedule();
      return true;
    }

    function moveMouse(event) {
      if (event.pointerType !== "mouse" || touchId !== null) return false;
      if (event.target.closest("input, textarea, select, [contenteditable=true]")) { hide(); return false; }
      if (!showAt(event.clientX, event.clientY, event.target)) return false;
      root.classList.add("using-halo");
      return true;
    }

    function pulse() {
      const at = shift(pointer.x, pointer.y);
      ripple.getAnimations().forEach(animation => animation.cancel());
      ripple.animate([{ transform: at + " scale(.5)", opacity: .65 }, { transform: at + " scale(2)", opacity: 0 }], { duration: 280, easing: "ease-out" });
    }

    document.addEventListener("pointermove", moveMouse, { passive: true });
    document.addEventListener("pointerdown", event => {
      if (moveMouse(event)) { pressed = true; pulse(); }
    }, { passive: true });
    document.addEventListener("pointerup", event => {
      if (moveMouse(event)) pressed = false;
    });
    document.addEventListener("pointerout", event => {
      if (event.pointerType === "mouse" && !event.relatedTarget) hide();
    });

    // Passive touch events keep tracking after the browser takes ownership of a scroll.
    document.addEventListener("touchstart", event => {
      if (event.touches.length !== 1) { hide(); return; }
      const touch = event.touches[0];
      root.classList.remove("using-halo");
      touchId = touch.identifier;
      if (showAt(touch.clientX, touch.clientY, event.target)) { pressed = true; pulse(); }
    }, { passive: true });
    document.addEventListener("touchmove", event => {
      const touch = event.touches[0];
      if (event.touches.length === 1 && touch.identifier === touchId) {
        showAt(touch.clientX, touch.clientY, event.target);
      }
    }, { passive: true });
    document.addEventListener("touchend", event => {
      if (event.touches.length || touchId === null) return;
      pressed = false;
      targetSize = 1;
      // Keep the last touch position through the release frame, then clear it.
      halo.classList.add("is-releasing");
      schedule();
      releaseTimer = setTimeout(hide, 310);
    }, { passive: true });
    document.addEventListener("touchcancel", hide, { passive: true });
    window.addEventListener("scroll", () => { if (touchId === null) hide(); }, { passive: true });
    window.addEventListener("blur", hide);
    document.addEventListener("keydown", hide);
    document.addEventListener("visibilitychange", hide);
    reduced.addEventListener("change", hide);
    fine.addEventListener("change", hide);
    highContrast.addEventListener("change", hide);
  }

  function animateNetwork() {
    const canvas = hero.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = 0, height = 0, frame = 0, last = 0, elapsed = 0;
    const nodes = Array.from({length: 34}, () => ({ x: Math.random(), y: Math.random(), phase: Math.random() * 6.28 }));
    function resize() {
      width = hero.clientWidth;
      height = hero.clientHeight;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    function draw(time) {
      frame = requestAnimationFrame(draw);
      const lean = !fine.matches || (navigator.hardwareConcurrency || 8) <= 4;
      if (time - last < (lean ? 64 : 32)) return;
      elapsed += Math.min(time - last, 80) / 1000;
      last = time;
      ctx.clearRect(0,0,width,height);
      const box = pointer.inHero ? canvas.getBoundingClientRect() : null;
      const dx = box ? (pointer.x - box.left) / width - .5 : 0;
      const dy = box ? (pointer.y - box.top) / height - .5 : 0;
      const cx = width * (.76 + .025 * Math.sin(elapsed*.15)) + dx * 15;
      const cy = height * .35 + dy * 15;
      const radius = Math.max(105, width * .24);
      const glow = ctx.createRadialGradient(cx,cy,0,cx,cy,radius);
      glow.addColorStop(0,"rgba(220,220,220,.043)");
      glow.addColorStop(1,"rgba(220,220,220,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(cx-radius,cy-radius,2*radius,2*radius);
      ctx.strokeStyle = "rgba(220,220,220,.045)";
      ctx.beginPath();
      ctx.arc(cx,cy,radius*.74,elapsed*.075,elapsed*.075+5.7);
      ctx.stroke();
      const count = lean ? 15 : nodes.length;
      for (let i=0; i<count; i++) {
        const n = nodes[i];
        n.px = n.x*width + Math.cos(elapsed*.15+n.phase)*10 + dx*n.phase;
        n.py = n.y*height + Math.sin(elapsed*.12+n.phase)*9 + dy*n.phase;
        for (let j=0; j<i; j++) {
          const other = nodes[j];
          const distance = Math.hypot(other.px-n.px, other.py-n.py);
          if (distance > 148) continue;
          ctx.strokeStyle = "rgba(205,210,210," + (.13*(1-distance/148)) + ")";
          ctx.beginPath(); ctx.moveTo(n.px,n.py); ctx.lineTo(other.px,other.py); ctx.stroke();
        }
        ctx.fillStyle = "rgba(225,225,225,.27)";
        ctx.beginPath(); ctx.arc(n.px,n.py,1.2,0,Math.PI*2); ctx.fill();
      }
    }
    function sync() {
      cancelAnimationFrame(frame);
      frame = 0;
      const running = heroVisible && !document.hidden && !reduced.matches;
      hero.classList.toggle("hero-in-view",running);
      if (running) { last = performance.now(); frame = requestAnimationFrame(draw); }
    }
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(hero);
    else window.addEventListener("resize", resize);
    resize();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; sync(); }).observe(hero);
    }
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
  }

  prepareElements();
  observeSkills();
  observeEntrances();
  observeWorkflow();
  enablePointer();
  animateNetwork();
  document.addEventListener("visibilitychange", () => root.classList.toggle("motion-paused", document.hidden));
})();
