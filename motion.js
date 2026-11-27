(() => {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const cards = ".role-card, .education, .skill-panel, .timeline article, .recognition-grid article, .project-card, .more-projects article";
  const magnets = ".actions a, .contact-links a, a[href^='https://github.com']";
  const hero = document.querySelector(".hero");
  const portrait = hero.querySelector(".portrait-card");
  const root = document.documentElement;
  // Set data-motion-off on <html> to a space-separated list of effect names.
  const disabled = new Set((root.dataset.motionOff || "").split(/\s+/));
  const settings = { turnDegrees: 360, magnet: 4.5, desktopNodes: 36, mobileNodes: 14, stageMs: 1500 };
  const lifetime = new AbortController();
  const cleanups = [];
  function on(target, event, handler, options = {}) {
    target.addEventListener(event, handler, { ...options, signal: lifetime.signal });
  }
  function track(observer) {
    cleanups.push(() => observer.disconnect());
    return observer;
  }
  let heroVisible = false;
  const pointer = { x: 0, y: 0, inHero: false, heroX: .5, heroY: .5 };

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
    const observer = track(new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("entered-view");
        observer.unobserve(entry.target);
      }
    }, { threshold: .035 }));
    const groups = ".timeline, .recognition-grid, .project-grid, .more-projects";
    document.querySelectorAll(groups).forEach(group => {
      Array.from(group.children).forEach((item, i) => item.style.setProperty("--enter-delay", (i % 2 * 80) + "ms"));
    });
    document.querySelectorAll(".section-head, .work-head, .education, .timeline article, .recognition-grid article, .project-card, .more-projects article").forEach(el => observer.observe(el));
  }

  function observeSkills() {
    if ("IntersectionObserver" in window) {
      const observer = track(new IntersectionObserver(entries => {
        entries.forEach(entry => entry.target.classList.toggle("in-view",entry.isIntersecting));
      }));
      document.querySelectorAll(".skill-panel").forEach(panel => observer.observe(panel));
    }
  }

  function observeWorkflow() {
    const workflow = document.querySelector(".recovery-workflow");
    const steps = [...workflow.querySelectorAll("li")];
    const demo = workflow.querySelector(".phoenix-demo");
    const status = demo.querySelector(".demo-status");
    const run = demo.querySelector("[data-demo-start]");
    const reset = demo.querySelector("[data-demo-reset]");
    const samples = [
      "Detect · A sample search request timed out after 100 ms.",
      "Diagnose · The sample log shows a healthy lookup taking 180 ms, above the configured deadline.",
      "Repair · The proposed change sets the sample deadline to 250 ms.",
      "Verify · The simulated 180 ms lookup passes. A 300 ms lookup still times out as expected.",
      "Recover · The sample service is healthy again."
    ];
    steps.forEach((el, i) => el.style.setProperty("--stage-delay", i * 800 + "ms"));
    let visible = !("IntersectionObserver" in window);
    let stage = -1, timer = 0, deadline = 0, remaining = settings.stageMs;

    function stopTimer() {
      if (!timer) return;
      remaining = Math.max(0, deadline - performance.now());
      clearTimeout(timer);
      timer = 0;
    }
    function render() {
      const running = stage >= 0 && stage < samples.length - 1;
      status.textContent = stage < 0 ? "Sample service is healthy." : samples[stage];
      run.textContent = stage === samples.length - 1 ? "Replay simulation" : "Run simulation";
      run.disabled = running;
      reset.disabled = stage < 0;
      workflow.classList.toggle("demo-active", stage >= 0);
      steps.forEach((el, i) => el.classList.toggle("current-stage", i === stage));
    }
    function sync() {
      const active = visible && workflow.open && !document.hidden;
      workflow.classList.toggle("workflow-paused", !active);
      if (!workflow.open) workflow.classList.remove("is-playing");
      else if (active) workflow.classList.add("is-playing");
      if (!active) { stopTimer(); return; }
      if (timer || stage < 0 || stage === samples.length - 1) return;
      deadline = performance.now() + remaining;
      timer = setTimeout(() => {
        timer = 0;
        stage++;
        remaining = settings.stageMs;
        render();
        sync();
      }, remaining);
    }
    function setStage(index) {
      stopTimer();
      stage = index;
      remaining = settings.stageMs;
      render();
      sync();
    }
    on(run, "click", () => { if (!run.disabled) setStage(0); });
    on(reset, "click", () => setStage(-1));
    if ("IntersectionObserver" in window) {
      track(new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); })).observe(workflow);
    }
    on(workflow, "toggle", sync);
    on(document, "visibilitychange", sync);
    cleanups.push(stopTimer);
    demo.hidden = false;
  }

  function prepareRotations() {
    // The hit target stays still while a child surface makes the turn.
    const image = portrait.querySelector("img");
    const floating = document.createElement("div");
    floating.className = "portrait-float";
    const parallax = document.createElement("div");
    parallax.className = "portrait-parallax";
    const surface = document.createElement("div");
    surface.className = "portrait-surface";
    surface.append(image);
    parallax.append(surface);
    floating.append(parallax);
    portrait.append(floating);
    if (!disabled.has("orbit")) {
      const orbit = document.createElement("span");
      orbit.className = "portrait-orbit";
      orbit.setAttribute("aria-hidden", "true");
      portrait.append(orbit);
    }

    const stops = [];
    function cancelTurns() { stops.forEach(stop => stop()); }
    function bind(host, face, axis, travel = settings.turnDegrees) {
      if (!host || !face || disabled.has("turns")) return;
      let origin = null;
      let angle = 0;
      let frame = 0;
      const horizontal = axis === "Y";
      let usedMouse = false;
      function stop() {
        if (!origin) return;
        cancelAnimationFrame(frame);
        frame = 0;
        const id = origin.id;
        origin = null;
        if (host.hasPointerCapture(id)) host.releasePointerCapture(id);
        host.classList.remove("turning");
        face.style.removeProperty("--turn-angle");
      }
      host.classList.add("turn-target");
      face.dataset.turnAxis = axis;
      on(host, "pointerdown", event => {
        usedMouse = event.pointerType === "mouse" && event.button === 2 && fine.matches && !reduced.matches;
        if (!usedMouse) return;
        event.preventDefault();
        host.setPointerCapture(event.pointerId);
        const bounds = host.getBoundingClientRect();
        origin = {
          id: event.pointerId,
          start: horizontal ? event.clientX : event.clientY,
          span: Math.max(1, horizontal ? bounds.width : bounds.height)
        };
      });
      on(host, "pointermove", event => {
        if (!origin || event.pointerId !== origin.id) return;
        if (!(event.buttons & 2)) { stop(); return; }
        const distance = horizontal ? event.clientX - origin.start : origin.start - event.clientY;
        angle = Math.max(-1, Math.min(1, distance / origin.span)) * travel;
        if (!frame) frame = requestAnimationFrame(() => {
          frame = 0;
          host.classList.add("turning");
          face.style.setProperty("--turn-angle", angle.toFixed(2) + "deg");
        });
      }, { passive: true });
      on(host, "contextmenu", event => {
        if (usedMouse && event.button === 2) event.preventDefault();
      });
      on(host, "pointerup", stop);
      on(host, "lostpointercapture", stop);
      on(host, "pointercancel", stop);
      stops.push(stop);
    }
    bind(portrait, surface, "Y");
    document.querySelectorAll(".role-card").forEach(card => {
      const face = document.createElement("span");
      face.className = "role-face";
      face.append(...card.childNodes);
      const rotor = document.createElement("span");
      rotor.className = "role-rotor";
      const back = document.createElement("span");
      back.className = "role-back";
      back.textContent = card.getAttribute("aria-description");
      back.setAttribute("aria-hidden", "true");
      rotor.append(face, back);
      card.append(rotor);
      bind(card, rotor, "Y");
    });
    document.querySelectorAll(".skill-panel").forEach(panel => bind(panel, panel.querySelector(".skill-visual"), "X"));
    document.querySelectorAll(".education, .timeline article").forEach(card => bind(card, card, "Y", 12));
    on(window,"blur",cancelTurns);
    on(reduced,"change",cancelTurns);
    on(fine,"change",cancelTurns);
    on(document,"visibilitychange",() => { if (document.hidden) cancelTurns(); });
    cleanups.push(cancelTurns);
  }

  function prepareSkillFlips() {
    if (disabled.has("flip")) return;
    document.querySelectorAll(".skill-panel").forEach(panel => {
      const visual = panel.querySelector(".skill-visual");
      const front = visual.querySelector(".skill-ring");
      const note = panel.querySelector(".tech-note");
      const back = document.createElement("div");
      const face = document.createElement("div");
      const button = document.createElement("button");
      visual.removeAttribute("aria-hidden");
      face.className = "skill-faces";
      face.setAttribute("aria-hidden","true");
      back.className = "skill-back";
      face.append(front,back);
      button.type = "button";
      button.className = "skill-flip-control";
      note.id = panel.id + "-note";
      button.setAttribute("aria-describedby",note.id);
      visual.append(face,button);
      function display(flipped) {
        visual.classList.toggle("flipped",flipped);
        back.textContent = note.textContent;
        button.setAttribute("aria-pressed",String(flipped));
        button.setAttribute("aria-label","Skill details for " + front.querySelector("strong").textContent);
      }
      display(false);
      on(button,"click",() => display(!visual.classList.contains("flipped")));
      on(panel.querySelector(".tech-list"),"click",() => display(false));
      on(button,"keydown",event => { if(event.key === "Escape") display(false); });
    });
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
    let pending = false, releaseTimer = 0;
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
        const nextCard = disabled.has("cards") ? null : target.closest("[data-motion-card]");
        const nextMagnet = disabled.has("magnet") ? null : target.closest(magnets);
        if (card !== nextCard && card) card.removeAttribute("data-pointed");
        if (magnet !== nextMagnet) resetMagnet();
        card = nextCard;
        magnet = nextMagnet;
        pointer.inHero = hero.contains(target);
        if (card) {
          const {x,y} = position(card);
          card.style.setProperty("--spot-x", x * 100 + "%");
          card.style.setProperty("--spot-y", y * 100 + "%");
          card.setAttribute("data-pointed", "");
        }
        if (magnet) {
          const {x,y} = position(magnet);
          magnet.style.setProperty("--mag-x", (x - .5) * 2 * settings.magnet + "px");
          magnet.style.setProperty("--mag-y", (y - .5) * 2 * settings.magnet + "px");
        }
        if (pointer.inHero) {
          const {x,y} = position(hero);
          pointer.heroX = x;
          pointer.heroY = y;

          portrait.style.setProperty("--portrait-x", (x - .5) * 6 + "px");
          portrait.style.setProperty("--portrait-y", (y - .5) * 6 + "px");
        } else {

          portrait.style.removeProperty("--portrait-x");
          portrait.style.removeProperty("--portrait-y");
        }
        targetSize = pressed ? .82 : target.closest("a, button, summary, [data-motion-card]") ? 1.65 : 1;
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
      if (event.pointerType !== "mouse" || !fine.matches) { hide(); return false; }
      if (event.target.closest("input, textarea, select, [contenteditable=true]")) { hide(); return false; }
      if (!showAt(event.clientX, event.clientY, event.target)) return false;
      halo.classList.toggle("cursor-off", disabled.has("cursor"));
      return true;
    }

    function pulse() {
      const at = shift(pointer.x, pointer.y);
      ripple.getAnimations().forEach(animation => animation.cancel());
      ripple.animate([{ transform: at + " scale(.5)", opacity: .65 }, { transform: at + " scale(2)", opacity: 0 }], { duration: 280, easing: "ease-out" });
    }

    on(document, "pointermove", moveMouse, { passive: true });
    on(document, "pointerdown", event => {
      if (moveMouse(event)) { pressed = true; pulse(); }
    }, { passive: true });
    on(document, "pointerup", event => {
      if (moveMouse(event)) pressed = false;
    });
    on(document, "pointerout", event => {
      if (event.pointerType === "mouse" && !event.relatedTarget) {
        halo.classList.add("is-releasing");
        clearTimeout(releaseTimer);
        releaseTimer = setTimeout(hide, 210);
      }
    });

    cleanups.push(hide);
    on(window, "scroll", hide, { passive: true });
    on(window, "blur", hide);
    on(document, "keydown", hide);
    on(document, "visibilitychange", hide);
    on(reduced, "change", hide);
    on(fine, "change", hide);
    on(highContrast, "change", hide);
  }

  function animateNetwork() {
    const canvas = hero.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = 0, height = 0, frame = 0, last = 0, elapsed = 0;
    const nodes = Array.from({length: settings.desktopNodes}, () => ({ x: Math.random(), y: Math.random(), phase: Math.random() * 6.28 }));
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
      const dx = pointer.inHero ? pointer.heroX - .5 : 0;
      const dy = pointer.inHero ? pointer.heroY - .5 : 0;
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
      const count = lean ? settings.mobileNodes : nodes.length;
      for (let i=0; i<count; i++) {
        const n = nodes[i];
        n.px = n.x*width + Math.cos(elapsed*.15+n.phase)*10 + dx*n.phase;
        n.py = n.y*height + Math.sin(elapsed*.12+n.phase)*9 + dy*n.phase;
        if (pointer.inHero) {
          const mx = pointer.heroX * width - n.px, my = pointer.heroY * height - n.py;
          const pull = .075 * Math.max(0, 1 - Math.hypot(mx,my)/160);
          n.px += mx * pull; n.py += my * pull;
        }
        for (let j=0; j<i; j++) {
          const other = nodes[j];
          const distance = Math.hypot(other.px-n.px, other.py-n.py);
          if (distance > 148) continue;
          ctx.strokeStyle = "rgba(205,210,210," + (.13*(1-distance/148)) + ")";
          ctx.beginPath(); ctx.moveTo(n.px,n.py); ctx.lineTo(other.px,other.py); ctx.stroke();
        }
        ctx.fillStyle = i % 7 === 0 ? "rgba(235,235,235,.48)" : "rgba(225,225,225,.27)";
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
    if ("ResizeObserver" in window) track(new ResizeObserver(resize)).observe(hero);
    else on(window, "resize", resize);
    resize();
    if ("IntersectionObserver" in window) {
      track(new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; sync(); })).observe(hero);
    }
    on(document, "visibilitychange", sync);
    on(reduced, "change", sync);
    cleanups.push(() => cancelAnimationFrame(frame));
  }

  prepareElements();
  prepareRotations();
  prepareSkillFlips();
  observeSkills();
  if (!disabled.has("reveal")) observeEntrances();
  observeWorkflow();
  enablePointer();
  if (!disabled.has("network")) animateNetwork();
  on(document, "visibilitychange", () => root.classList.toggle("motion-paused", document.hidden));
  on(window, "pagehide", event => {
    if (event.persisted) return;
    lifetime.abort();
    cleanups.forEach(cleanup => cleanup());
  });
})();
