(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-magic';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  document.body.append(canvas);

  let enabled = false, frame = 0, previousTime = 0, lastMove = 0;
  let x = 0, y = 0, glowX = 0, glowY = 0, present = false, overControl = false;
  let lastPoint = null, trail = [], sparks = [], rings = [];
  let tone = 0, targetTone = 0, pendingTouch = null;
  const random = (min, max) => min + Math.random() * (max - min);
  const mixColor = (light, dark, amount = tone) => light.map((value, index) =>
    Math.round(value + (dark[index] - value) * amount)).join(',');
  const rgba = (light, dark, opacity, amount = tone) => `rgba(${mixColor(light, dark, amount)},${opacity})`;

  function surfaceTone(target) {
    if (target.closest?.('.photo-note,.about-seal,.card-stamp,.rate-card h3 span,.graduation-photo figcaption')) return 1;
    for (let element = target; element instanceof Element; element = element.parentElement) {
      const color = getComputedStyle(element).backgroundColor.match(/[\d.]+/g)?.map(Number);
      if (!color || color.length < 3 || (color.length > 3 && color[3] < .75)) continue;
      return color[0] * .2126 + color[1] * .7152 + color[2] * .0722 > 155 ? 1 : 0;
    }
    return 0;
  }

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(innerWidth * ratio);
    canvas.height = Math.round(innerHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function clear() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    present = false;
    pendingTouch = null;
    lastPoint = null;
    trail = []; sparks = []; rings = [];
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
  function configure() {
    enabled = !reducedMotion.matches;
    canvas.hidden = !enabled;
    clear();
    if (enabled) resize();
  }
  function wake() {
    if (!frame && enabled && !document.hidden) frame = requestAnimationFrame(draw);
  }
  function haze(px, py, radius, opacity, amount = tone) {
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
    gradient.addColorStop(0, rgba([255,237,249], [163,39,107], opacity * .9, amount));
    gradient.addColorStop(.18, rgba([246,174,214], [144,47,143], opacity * .7, amount));
    gradient.addColorStop(.48, rgba([182,142,237], [105,63,157], opacity * .35, amount));
    gradient.addColorStop(1, rgba([233,184,201], [105,63,157], 0, amount));
    ctx.fillStyle = gradient;
    ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);
  }
  function spark(px, py, burst = false) {
    const angle = random(0, Math.PI * 2), speed = burst ? random(35, 100) : random(8, 26);
    sparks.push({x: px, y: py, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      born: performance.now(), life: burst ? random(600, 1000) : random(400, 750),
      size: random(.8, 2.2), phase: random(0, Math.PI * 2)});
    if (sparks.length > 64) sparks.shift();
  }
  function draw(now) {
    frame = 0;
    const step = Math.min((now - (previousTime || now)) / 1000, .04);
    previousTime = now;
    tone += (targetTone - tone) * (1 - Math.exp(-step * 10));
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    trail = trail.filter(point => now - point.born < 550);
    for (const point of trail) {
      const life = 1 - (now - point.born) / 550;
      haze(point.x, point.y, 38 + 22 * life, .065 * life);
    }
    const glowLife = present ? Math.max(0, 1 - Math.max(0, now - lastMove - 1200) / 600)
      : Math.max(0, 1 - (now - lastMove) / 450);
    if (glowLife > 0) {
      const ease = 1 - Math.exp(-step * 18);
      glowX += (x - glowX) * ease;
      glowY += (y - glowY) * ease;
      haze(glowX, glowY, overControl ? 115 : 90, glowLife * (overControl ? .32 : .23));
    }
    sparks = sparks.filter(p => now - p.born < p.life);
    for (const p of sparks) {
      const life = 1 - (now - p.born) / p.life;
      p.x += p.vx * step; p.y += p.vy * step;
      const alpha = life * (.6 + .4 * Math.sin(now / 90 + p.phase) ** 2);
      ctx.fillStyle = rgba([255,233,246], [151,42,119], alpha);
      ctx.shadowColor = rgba([233,184,201], [118,57,153], .8); ctx.shadowBlur = 7;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * life, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba([220,148,185], [112,50,148], alpha * .65);
      ctx.lineWidth = .65;
      ctx.beginPath(); ctx.moveTo(p.x - p.size * 2.2, p.y); ctx.lineTo(p.x + p.size * 2.2, p.y);
      ctx.moveTo(p.x, p.y - p.size * 2.2); ctx.lineTo(p.x, p.y + p.size * 2.2); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    rings = rings.filter(r => now - r.born < 550);
    for (const r of rings) {
      const age = (now - r.born) / 550;
      ctx.strokeStyle = rgba([233,184,201], [142,43,123], .55 * (1 - age), r.tone);
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(r.x, r.y, 8 + age * 45, 0, Math.PI * 2); ctx.stroke();
      haze(r.x, r.y, 45 + age * 45, .28 * (1 - age), r.tone);
    }
    if (trail.length || sparks.length || rings.length || glowLife > 0) wake();
    else previousTime = 0;
  }
  document.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') {
      if (pendingTouch?.id === event.pointerId && Math.hypot(event.clientX - pendingTouch.x, event.clientY - pendingTouch.y) > 12) pendingTouch = null;
      return;
    }
    if (!enabled || document.hidden) return;
    const now = performance.now();
    x = event.clientX; y = event.clientY;
    targetTone = surfaceTone(event.target);
    if (!present) {glowX = x; glowY = y; tone = targetTone;}
    present = true; lastMove = now;
    overControl = !!event.target.closest?.('a,button,summary,input,textarea,select');
    if (!lastPoint || Math.hypot(x - lastPoint.x, y - lastPoint.y) > 8) {
      trail.push({x, y, born: now});
      if (trail.length > 22) trail.shift();
      spark(x + random(-9, 9), y + random(-9, 9));
      lastPoint = {x, y};
    }
    wake();
  }, {passive: true});
  function burstAt(event, touch = false) {
    const now = performance.now();
    targetTone = surfaceTone(event.target);
    if (touch || !present) {
      x = glowX = event.clientX; y = glowY = event.clientY;
      tone = targetTone; lastMove = now; present = false;
    }
    rings.push({x: event.clientX, y: event.clientY, born: now, tone: targetTone});
    if (rings.length > 4) rings.shift();
    for (let i = 0; i < 14; i++) spark(event.clientX, event.clientY, true);
    wake();
  }
  document.addEventListener('pointerdown', event => {
    if (!enabled || event.button !== 0) return;
    if (event.pointerType === 'touch') {
      pendingTouch = event.isPrimary === false ? null : {id: event.pointerId, x: event.clientX, y: event.clientY, born: performance.now()};
      return;
    }
    burstAt(event);
  }, {passive: true});
  document.addEventListener('pointerup', event => {
    const tap = pendingTouch;
    if (event.pointerType !== 'touch' || tap?.id !== event.pointerId) return;
    pendingTouch = null;
    if (enabled && performance.now() - tap.born < 700 && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) <= 12) burstAt(event, true);
  }, {passive: true});
  document.addEventListener('pointercancel', () => {pendingTouch = null;}, {passive: true});
  addEventListener('scroll', () => {if (pendingTouch) pendingTouch = null;}, {passive: true});
  document.documentElement.addEventListener('pointerleave', () => {
    present = false; lastMove = performance.now(); lastPoint = null; wake();
  });
  addEventListener('blur', clear);
  addEventListener('resize', () => {clear(); if (enabled) resize();});
  document.addEventListener('visibilitychange', clear);
  reducedMotion.addEventListener('change', configure);
  configure();
})();
