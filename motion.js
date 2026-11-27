(() => {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const cards = ".role-card, .education, .skill-panel, .timeline article, .recognition-grid article, .project-card, .more-projects article, .contact-card";
  const magnets = ".actions a, a[href^='https://github.com']:not(.contact-action)";
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
    document.querySelectorAll(".contact-heading > *, .contact-intro, .contact-card, .availability").forEach(el => observer.observe(el));
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
    function bind(host, face, travel = settings.turnDegrees) {
      if (!host || !face || disabled.has("turns")) return;
      let origin = null;
      let pitch = 0, yaw = 0;
      let frame = 0;
      let dragged = false;
      function stop() {
        if (!origin) return;
        cancelAnimationFrame(frame);
        frame = 0;
        const id = origin.id;
        origin = null;
        if (host.hasPointerCapture(id)) host.releasePointerCapture(id);
        host.classList.remove("turning");
        face.style.removeProperty("--turn-pitch");
        face.style.removeProperty("--turn-yaw");
      }
      host.classList.add("turn-target");
      face.setAttribute("data-turn-surface", "");
      on(host, "pointerdown", event => {
        dragged = false;
        if (event.pointerType !== "mouse" || event.button !== 0 || !fine.matches || reduced.matches) return;
        const bounds = host.getBoundingClientRect();
        origin = {
          id: event.pointerId,
          x: event.clientX, y: event.clientY,
          width: Math.max(1, bounds.width), height: Math.max(1, bounds.height)
        };
      });
      on(host, "pointermove", event => {
        if (!origin || event.pointerId !== origin.id) return;
        if (!(event.buttons & 1)) { stop(); return; }
        const dx = event.clientX - origin.x;
        const dy = origin.y - event.clientY;
        if (!dragged) {
          if (Math.hypot(dx, dy) < 5) return;
          dragged = true;
          host.setPointerCapture(event.pointerId);
        }
        yaw = Math.max(-1, Math.min(1, dx / origin.width)) * travel;
        pitch = Math.max(-1, Math.min(1, dy / origin.height)) * travel;
        if (!frame) frame = requestAnimationFrame(() => {
          frame = 0;
          host.classList.add("turning");
          face.style.setProperty("--turn-pitch", pitch.toFixed(2) + "deg");
          face.style.setProperty("--turn-yaw", yaw.toFixed(2) + "deg");
        });
      }, { passive: true });
      on(host, "dragstart", event => { if (origin) event.preventDefault(); });
      on(host, "click", event => {
        if (dragged && event.detail > 0) {
          event.preventDefault();
          event.stopImmediatePropagation();
          dragged = false;
        }
      }, { capture: true });
      on(window, "pointerup", event => { if (event.pointerId === origin?.id) stop(); });
      on(host, "lostpointercapture", stop);
      on(host, "pointercancel", stop);
      stops.push(stop);
    }
    bind(portrait, surface);
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
      bind(card, rotor);
    });
    document.querySelectorAll(".skill-panel").forEach(panel => bind(panel, panel.querySelector(".skill-visual")));
    document.querySelectorAll(".education, .timeline article").forEach(card => bind(card, card, 12));
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

  // Distances are CSS pixels and durations are milliseconds. Visual settings live on .mouse-halo.
  const cursorSettings = {
    smoothingAt60Hz: .20, magneticStrength: .18, magneticLimit: 10,
    trailLimit: 24, trailSpacing: 13, trailInterval: 20, trailLife: [300, 500],
    burstCount: 12, burstReach: [25, 65], burstLife: [400, 600], particleLimit: 60
  };

  function createParticles(container) {
    const config = cursorSettings;
    const slots = [];
    const random = ([low, high]) => low + Math.random() * (high - low);
    let lastX = 0, lastY = 0, lastTime = 0;

    function emit(kind, x, y, angle, distance, time) {
      let slot = slots.find(item => !item.active);
      if (!slot && slots.length < config.particleLimit) {
        const el = document.createElement("i");
        el.className = "reactor-particle";
        container.append(el);
        slot = { el };
        slots.push(slot);
      }
      if (!slot) {
        if (kind === "trail") return;
        slot = slots.reduce((oldest, item) => item.start < oldest.start ? item : oldest);
      }
      Object.assign(slot, {
        active: true, kind, x, y, start: time, dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance, life: random(kind === "trail" ? config.trailLife : config.burstLife),
        scale: .5 + Math.random() * .5
      });
      slot.el.hidden = false;
    }
    function anchor(x, y, time) { lastX = x; lastY = y; lastTime = time; }
    function trail(x, y, time, slow) {
      const dx = x - lastX, dy = y - lastY;
      const distance = Math.hypot(dx, dy);
      if (distance < config.trailSpacing || time - lastTime < config.trailInterval * (slow ? 2 : 1)) return;
      let room = config.trailLimit;
      for (const item of slots) if (item.active && item.kind === "trail") room--;
      const count = Math.min(room, slow ? 1 : 2, Math.floor(distance / config.trailSpacing));
      for (let i = 0; i < count; i++) {
        // Keep fast sweeps close to the pointer instead of drawing lines across the page.
        const behind = config.trailSpacing * (i + .5) / distance;
        emit("trail", x - dx * behind, y - dy * behind, Math.random() * 2 * Math.PI, 4, time);
      }
      anchor(x, y, time);
    }
    function burst(x, y, time) {
      const phase = Math.random() * 2 * Math.PI;
      for (let i = 0; i < config.burstCount; i++) {
        emit("burst", x, y, phase + 2 * Math.PI * i / config.burstCount, random(config.burstReach), time);
      }
    }
    function draw(time) {
      let alive = false;
      for (const item of slots) {
        if (!item.active) continue;
        const progress = Math.max(0, (time - item.start) / item.life);
        if (progress >= 1) { item.active = false; item.el.hidden = true; continue; }
        alive = true;
        const remaining = 1 - progress, travel = 1 - remaining * remaining;
        const x = item.x + item.dx * travel, y = item.y + item.dy * travel;
        item.el.style.transform = "translate(" + x.toFixed(2) + "px," + y.toFixed(2) + "px) scale(" +
          (item.scale * (.2 + .8 * remaining)).toFixed(3) + ")";
        item.el.style.opacity = (remaining * (item.kind === "trail" ? .48 : .82)).toFixed(3);
      }
      return alive;
    }
    function clear() {
      for (const slot of slots) { slot.active = false; slot.el.hidden = true; }
    }
    return { anchor, trail, burst, draw, clear };
  }

  function enablePointer() {
    const capable = matchMedia("(any-hover: hover) and (any-pointer: fine)");
    const contrast = matchMedia("(forced-colors: active), (prefers-contrast: more)");
    const nativeControls = "input, textarea, select, option, video[controls], iframe, dialog[open], [popover], :disabled, [role=separator]";
    const controls = "a[href], button, summary, [role=button], [role=link], [role=tab]";
    const halo = document.createElement("div");
    halo.className = "mouse-halo";
    halo.hidden = true;
    halo.setAttribute("aria-hidden", "true");
    halo.innerHTML = `
      <span class="reactor-particles"></span>
      <span class="reactor-head"><span class="reactor-size">
        <svg class="reactor-art" viewBox="0 0 50 50" aria-hidden="true" focusable="false">
          <g class="reactor-outer">
            <circle cx="25" cy="25" r="22" pathLength="100" stroke-width=".75" stroke-dasharray="19 5 5 21"/>
            <circle class="reactor-node" cx="47" cy="25" r="1.2"/>
            <circle class="reactor-node" cx="3" cy="25" r=".8"/>
          </g>
          <circle class="mouse-ring" cx="25" cy="25" r="18"/>
          <circle class="reactor-inner" cx="25" cy="25" r="13" pathLength="100" stroke-width="1" stroke-dasharray="19 10 8 13"/>
        </svg>
      </span></span><i class="mouse-dot"></i>`;
    const [layer, head, dot] = halo.children;
    const particles = createParticles(layer);
    const geometry = new Map();
    const shift = (x, y) => "translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px,0)";
    let target, card, magnet, control, magneticBox, lastTarget;
    let frame = 0, lastFrame = 0, ringX = 0, ringY = 0;
    let tracking = false, visible = false, retarget = false, dirty = false;
    let pressed = false, selecting = false, dragging = false, failed = false;
    let nativeArea = false;

    function bounds(element) {
      if (!geometry.has(element)) geometry.set(element, element.getBoundingClientRect());
      return geometry.get(element);
    }
    function position(element) {
      const box = bounds(element);
      const clamp = value => Math.max(0, Math.min(1, value));
      return { x: clamp((pointer.x - box.left) / box.width), y: clamp((pointer.y - box.top) / box.height) };
    }
    function resetMagnet() {
      if (!magnet) return;
      magnet.style.removeProperty("--mag-x");
      magnet.style.removeProperty("--mag-y");
    }
    function conceal() {
      root.classList.remove("custom-cursor-active");
      if (!visible) return;
      visible = false;
      lastTarget = null;
      halo.hidden = true;
      halo.removeAttribute("data-hover");
      halo.classList.remove("is-pressed");
      particles.clear();
    }
    function stop() {
      conceal();
      cancelAnimationFrame(frame);
      frame = lastFrame = 0;
      if (card) card.removeAttribute("data-pointed");
      resetMagnet();
      portrait.style.removeProperty("--portrait-x");
      portrait.style.removeProperty("--portrait-y");
      geometry.clear();
      card = magnet = control = magneticBox = target = lastTarget = null;
      tracking = pressed = selecting = dirty = retarget = pointer.inHero = false;
    }
    function schedule() {
      if (!frame && tracking) frame = requestAnimationFrame(draw);
    }
    function invalidate() {
      geometry.clear();
      if (tracking) { retarget = true; schedule(); }
    }
    function resolveTarget(element) {
      geometry.clear();
      lastTarget = element;
      nativeArea = !!element.closest(nativeControls) || element.isContentEditable;
      for (let node = element; !nativeArea && node instanceof Element; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.resize !== "none" || style.cursor.endsWith("-resize")) nativeArea = true;
      }
      const nextCard = disabled.has("cards") ? null : element.closest("[data-motion-card]");
      const nextMagnet = disabled.has("magnet") ? null : element.closest(magnets);
      if (card && card !== nextCard) card.removeAttribute("data-pointed");
      if (magnet !== nextMagnet) resetMagnet();
      card = nextCard;
      magnet = nextMagnet;
      control = element.closest(controls);
      magneticBox = null;
      if (control && !disabled.has("magnet") && !control.closest("nav")) {
        const box = bounds(control);
        if (box.width <= 260 && box.height <= 80) magneticBox = box;
      }
      const hover = control ? "control" :
        element.closest(cards + ", .turn-target") ? "card" : "";
      if (hover) halo.dataset.hover = hover;
      else halo.removeAttribute("data-hover");
    }
    function updatePageEffects() {
      // Share the existing spotlight, label and portrait tracking with the cursor's input frame.
      pointer.inHero = hero.contains(target);
      if (card) {
        const { x, y } = position(card);
        card.style.setProperty("--spot-x", x * 100 + "%");
        card.style.setProperty("--spot-y", y * 100 + "%");
        if (card.matches(".contact-card, .recognition-grid article:has(.certificate-link)")) {
          card.style.setProperty("--tilt-x", ((.5 - y) * 8) + "deg");
          card.style.setProperty("--tilt-y", ((x - .5) * 8) + "deg");
        }
        if (!card.hasAttribute("data-pointed")) card.setAttribute("data-pointed", "");
      }
      if (magnet) {
        const { x, y } = position(magnet);
        magnet.style.setProperty("--mag-x", (x - .5) * 2 * settings.magnet + "px");
        magnet.style.setProperty("--mag-y", (y - .5) * 2 * settings.magnet + "px");
      }
      if (pointer.inHero) {
        const { x, y } = position(hero);
        pointer.heroX = x; pointer.heroY = y;
        portrait.style.setProperty("--portrait-x", (x - .5) * 6 + "px");
        portrait.style.setProperty("--portrait-y", (y - .5) * 6 + "px");
      } else {
        portrait.style.removeProperty("--portrait-x");
        portrait.style.removeProperty("--portrait-y");
      }
    }
    function syncVisual(time) {
      if (nativeArea || selecting || disabled.has("cursor") || failed) { conceal(); return; }
      if (!visible) {
        if (!halo.isConnected) document.body.append(halo);
        ringX = pointer.x; ringY = pointer.y;
        head.style.transform = shift(ringX, ringY);
        particles.anchor(ringX, ringY, time);
        halo.hidden = false;
        visible = true;
      }
      dot.style.transform = shift(pointer.x, pointer.y);
      halo.classList.toggle("is-pressed", pressed);
      root.classList.add("custom-cursor-active");
    }
    function tick(time) {
      const elapsed = lastFrame ? time - lastFrame : 1000 / 60;
      lastFrame = time;
      if (retarget) {
        target = document.elementFromPoint(pointer.x, pointer.y);
        if (!target) { stop(); return; }
        resolveTarget(target);
        syncVisual(time);
        dirty = true;
        retarget = false;
      }
      if (dirty) {
        updatePageEffects();
        if (visible) particles.trail(pointer.x, pointer.y, time, elapsed > 25);
        dirty = false;
      }
      if (!visible) { lastFrame = 0; return; }
      let x = pointer.x, y = pointer.y;
      if (magneticBox) {
        const dx = magneticBox.left + magneticBox.width / 2 - x;
        const dy = magneticBox.top + magneticBox.height / 2 - y;
        const pull = Math.min(cursorSettings.magneticStrength, cursorSettings.magneticLimit / (Math.hypot(dx, dy) || 1));
        x += dx * pull; y += dy * pull;
      }
      const blend = 1 - Math.pow(1 - cursorSettings.smoothingAt60Hz, elapsed * 60 / 1000);
      ringX += (x - ringX) * blend; ringY += (y - ringY) * blend;
      const moving = Math.hypot(x - ringX, y - ringY) > .08;
      if (!moving) { ringX = x; ringY = y; }
      head.style.transform = shift(ringX, ringY);
      if (particles.draw(time) || moving) schedule();
      else lastFrame = 0;
    }
    function draw(time) {
      frame = 0;
      try { tick(time); }
      catch (error) { failed = true; stop(); console.error("Portfolio cursor disabled", error); }
    }
    function move(event) {
      if ((event.pointerType && event.pointerType !== "mouse") || !capable.matches ||
          reduced.matches || contrast.matches || document.hidden || dragging || !(event.target instanceof Element)) {
        stop(); return;
      }
      tracking = true;
      target = event.target;
      pointer.x = event.clientX; pointer.y = event.clientY;
      if (target !== lastTarget) resolveTarget(target);
      if (event.type !== "wheel") pressed = !!(event.buttons & 1);
      if (!pressed) selecting = false;
      syncVisual(performance.now());
      dirty = true;
      schedule();
    }
    function handleInput(event) {
      if (failed) return;
      try {
        move(event);
        if (visible && event.type === "pointerdown" && event.button === 0)
          particles.burst(pointer.x, pointer.y, performance.now());
      } catch (error) { failed = true; stop(); console.error("Portfolio cursor disabled", error); }
    }
    for (const name of ["pointermove", "pointerover", "pointerdown", "pointerup", "wheel"])
      on(document, name, handleInput, { passive: true });
    on(document, "selectionchange", () => {
      if (pressed && !document.getSelection()?.isCollapsed && !target?.closest(".turning")) {
        selecting = true; conceal();
      }
    });
    on(document, "dragstart", event => { if (!event.defaultPrevented) { dragging = true; stop(); } });
    on(document, "dragend", () => { dragging = false; });
    on(document, "pointerout", event => { if (!event.relatedTarget) stop(); });
    on(document, "pointercancel", stop);
    on(window, "scroll", invalidate, { passive: true, capture: true });
    on(window, "resize", invalidate, { passive: true });
    on(document, "toggle", invalidate, { capture: true });
    if (window.visualViewport) on(window.visualViewport, "resize", invalidate);
    const observer = track(new MutationObserver(records => {
      if (tracking && records.some(record => !halo.contains(record.target))) invalidate();
    }));
    observer.observe(document.body, { subtree: true, childList: true, attributes: true,
      attributeFilter: ["open", "hidden", "aria-expanded"] });
    function reset() { dragging = false; stop(); }
    on(window, "blur", reset);
    on(window, "pagehide", reset);
    on(document, "visibilitychange", reset);
    on(document, "keydown", reset);
    for (const query of [capable, contrast, reduced]) on(query, "change", () => {
      if (!capable.matches || contrast.matches || reduced.matches) reset();
    });
    cleanups.push(() => { reset(); halo.remove(); });
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
