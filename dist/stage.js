'use strict';
(() => {
  const root = document.documentElement;
  const hero = document.querySelector('.hero');
  const proc = document.querySelector('.process');
  if (!hero || !proc) return;
  const steps = [...proc.querySelectorAll('.steps li')];
  const spots = [...proc.querySelectorAll('.spot')];
  const parallax = [...document.querySelectorAll('[data-par]')];
  const videos = [...document.querySelectorAll('video[data-loop]')];
  const phone = matchMedia('(max-width: 820px)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const TAU = Math.PI * 2;
  const isOff = () => root.classList.contains('motion-off');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const ease = v => { const t = clamp(v, 0, 1); return t * t * (3 - 2 * t); };

  // Sprites are drawn once, then stamped each frame.
  function sprite(size, paint) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.translate(size / 2, size / 2);
    paint(g, size / 2 - 2);
    return c;
  }
  const SPRITES = {
    cell: sprite(96, (g, r) => {
      const f = g.createRadialGradient(0, 0, r * .05, 0, 0, r);
      f.addColorStop(0, '#93101a'); f.addColorStop(.36, '#cc1a23'); f.addColorStop(.74, '#f23a41'); f.addColorStop(.94, '#d3212a'); f.addColorStop(1, 'rgba(170,12,22,0)');
      g.fillStyle = f; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,214,214,.45)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, r * .8, 3.5, 5.2); g.stroke();
    }),
    toxin: sprite(64, (g, r) => {
      const f = g.createRadialGradient(-r * .35, -r * .4, r * .05, 0, 0, r);
      f.addColorStop(0, '#8b93a0'); f.addColorStop(.35, '#383d46'); f.addColorStop(1, '#07080a');
      g.fillStyle = f; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
      g.fillStyle = 'rgba(0,0,0,.8)';
      for (let i = 0; i < 16; i++) { const a = i * 2.4, d = r * .78 * Math.sqrt((i + .5) / 16); g.beginPath(); g.arc(Math.cos(a) * d, Math.sin(a) * d, r * .11, 0, TAU); g.fill(); }
    }),
    amber: sprite(40, (g, r) => {
      const f = g.createRadialGradient(-r * .35, -r * .4, r * .08, 0, 0, r);
      f.addColorStop(0, '#fff6cf'); f.addColorStop(.4, '#ffb21e'); f.addColorStop(1, '#b85a00');
      g.fillStyle = f; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    })
  };

  function fit(canvas) {
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.round(box.width * dpr), h = Math.round(box.height * dpr);
    if (w && h && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; }
    return canvas.width > 0 && canvas.height > 0;
  }

  // Blood stream: cells and toxins follow the wave art into the cartridge.
  const PATH = [[-.06, .43], [.14, .5], [.3, .58], [.5, .62], [.66, .55], [.8, .4], [.92, .22], [1.04, .02], [1.12, -.12]];
  const TABLE = [];
  for (let i = 0; i <= 120; i++) {
    const f = i / 120 * (PATH.length - 1), k = Math.min(PATH.length - 2, Math.floor(f)), t = f - k;
    const p0 = PATH[Math.max(0, k - 1)], p1 = PATH[k], p2 = PATH[k + 1], p3 = PATH[Math.min(PATH.length - 1, k + 2)];
    const cr = j => .5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t * t * t);
    TABLE.push([cr(0), cr(1)]);
  }
  class Stream {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.live = false;
      this.parts = [];
      const add = (kind, n) => { for (let i = 0; i < n; i++) this.parts.push(this.spawn({ kind }, true)); };
      add('cell', 30); add('toxin', 15); add('amber', 12);
      this.parts.sort((a, b) => a.z - b.z);
    }
    spawn(p, scatter) {
      p.t = scatter ? Math.random() : 0;
      p.speed = rand(.045, .085) * (p.kind === 'cell' ? 1 : 1.15);
      p.off = rand(-1, 1); p.z = Math.random();
      p.rot = rand(0, TAU); p.vr = rand(-.9, .9); p.sq = p.kind === 'cell' ? rand(.5, 1) : 1;
      p.size = p.kind === 'cell' ? rand(.026, .05) : p.kind === 'toxin' ? rand(.014, .03) : rand(.006, .012);
      return p;
    }
    draw(dt) {
      if (!fit(this.canvas)) return;
      const { ctx, canvas } = this, W = canvas.width, H = canvas.height;
      const iw = W / 1.12, ih = H / 1.22, oy = H * .22 / 1.22;
      ctx.clearRect(0, 0, W, H);
      for (const p of this.parts) {
        p.t += p.speed * dt; p.rot += p.vr * dt;
        if (p.t >= 1) this.spawn(p, false);
        const f = p.t * 120, i = Math.min(119, Math.floor(f)), u = f - i;
        const a = TABLE[i], b = TABLE[i + 1];
        const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u;
        const tx = b[0] - a[0], ty = (b[1] - a[1]) * ih / iw, len = Math.hypot(tx, ty) || 1;
        const band = (.2 - .15 * ease(p.t)) * ih * p.off;
        const px = x * iw - ty / len * band, py = oy + y * ih + tx / len * band;
        const captured = p.kind !== 'cell';
        const out = captured ? ease((p.t - .78) / .16) : ease((p.t - .9) / .1);
        const alpha = ease(p.t / .07) * (1 - out) * (.55 + .45 * p.z);
        if (alpha < .01) continue;
        const size = p.size * iw * (1 - .45 * ease(p.t)) * (.7 + .5 * p.z) * (captured ? 1 - .6 * out : 1);
        ctx.globalAlpha = alpha;
        ctx.save(); ctx.translate(px, py); ctx.rotate(p.rot); ctx.scale(1, p.sq);
        ctx.drawImage(SPRITES[p.kind], -size, -size, size * 2, size * 2);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }

  // Inside the cartridge: blood runs through, toxin specks stop on the beads.
  const LANE = [[222, 189, 6], [330, 178, 40], [395, 166, 60], [800, 150, 60], [900, 138, 30], [958, 121, 6]];
  function lane(y) {
    for (let i = 0; i < LANE.length - 1; i++) {
      const a = LANE[i], b = LANE[i + 1];
      if (y <= b[0]) { const t = clamp((y - a[0]) / (b[0] - a[0]), 0, 1); return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
    }
    return [121, 6];
  }
  class CartFx {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.live = false;
      this.blood = Array.from({ length: 42 }, () => ({ y: rand(222, 958), off: rand(-1, 1), v: rand(120, 210), ph: rand(0, TAU), r: rand(1.4, 2.8) }));
      this.tox = Array.from({ length: 30 }, () => this.reset({}, true));
    }
    reset(t, scatter) {
      t.goal = rand(300, 790); t.off = rand(-.9, .9); t.r = rand(1.6, 3.2);
      t.y = scatter ? rand(222, t.goal) : 222; t.held = scatter && Math.random() < .5 ? rand(0, 2.4) : 0; t.blue = Math.random() < .15;
      return t;
    }
    draw(dt) {
      if (!fit(this.canvas)) return;
      const { ctx, canvas } = this, sx = canvas.width / 296, sy = canvas.height / 1045;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const b of this.blood) {
        b.y += b.v * dt; if (b.y > 958) { b.y = 222; b.off = rand(-1, 1); }
        const [cx, hw] = lane(b.y);
        const x = cx + (b.off * .85 + .15 * Math.sin(b.y * .05 + b.ph)) * hw;
        ctx.globalAlpha = .5 * ease((b.y - 222) / 30) * (1 - ease((b.y - 930) / 28));
        ctx.fillStyle = '#ff4d55';
        ctx.beginPath(); ctx.ellipse(x * sx, b.y * sy, b.r * sx, b.r * 1.9 * sx, 0, 0, TAU); ctx.fill();
      }
      for (const t of this.tox) {
        if (t.y < t.goal) t.y = Math.min(t.goal, t.y + (60 + (t.goal - t.y) * 1.4) * dt);
        else { t.held += dt; if (t.held > 2.6) this.reset(t, false); }
        const [cx, hw] = lane(t.y), x = cx + t.off * hw;
        const fade = 1 - ease((t.held - 1.8) / .8);
        const glow = t.held > 0 && t.held < .7 ? 1 - t.held / .7 : 0;
        ctx.globalAlpha = ease((t.y - 222) / 24) * fade;
        if (glow) { ctx.strokeStyle = 'rgba(255,233,168,' + (.8 * glow).toFixed(3) + ')'; ctx.lineWidth = 1.2 * sx; ctx.beginPath(); ctx.arc(x * sx, t.y * sy, t.r * (1.4 + 3 * (1 - glow)) * sx, 0, TAU); ctx.stroke(); }
        ctx.fillStyle = t.blue ? '#6bb6ff' : '#ffb21e';
        ctx.beginPath(); ctx.arc(x * sx, t.y * sy, t.r * (.5 + .5 * fade) * sx, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  const layers = [
    ...[...document.querySelectorAll('canvas.cells')].map(c => new Stream(c)),
    ...[...document.querySelectorAll('canvas.cart-fx')].map(c => new CartFx(c))
  ];

  // Scroll state
  let heroSeen = true, procSeen = false;
  function onScroll() {
    const y = window.scrollY, vh = window.innerHeight;
    if (heroSeen) {
      hero.style.setProperty('--sy', isOff() ? 0 : y.toFixed(1));
      hero.style.setProperty('--sr', isOff() ? 0 : (-16 * clamp(y / hero.offsetHeight, 0, 1)).toFixed(2));
    }
    if (phone.matches) {
      proc.style.setProperty('--p', .5);
      steps.forEach(el => el.classList.add('on')); spots.forEach(el => el.classList.add('on'));
    } else {
      const box = proc.getBoundingClientRect(), span = box.height - vh;
      const p = span > 0 ? clamp(-box.top / span, 0, 1) : 0;
      const step = Math.min(2, Math.floor(p * 3));
      proc.style.setProperty('--p', p.toFixed(4));
      proc.style.setProperty('--lens', step === 1 ? 1 : 0);
      steps.forEach((el, i) => el.classList.toggle('on', i === step));
      spots.forEach((el, i) => el.classList.toggle('on', i === step));
    }
    if (!isOff()) for (const el of parallax) {
      const box = el.getBoundingClientRect();
      if (box.bottom < -200 || box.top > vh + 200) continue;
      const shift = (box.top + box.height / 2 - vh / 2) * -Number(el.dataset.par);
      el.style.translate = '0 ' + shift.toFixed(1) + 'px';
    }
  }
  let ticking = false;
  const queueScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); } };
  addEventListener('scroll', queueScroll, { passive: true });
  addEventListener('resize', queueScroll);
  phone.addEventListener('change', queueScroll);

  // Pointer tilt
  let tx = 0, ty = 0, mx = 0, my = 0;
  if (finePointer) hero.addEventListener('pointermove', e => {
    tx = clamp(e.clientX / innerWidth * 2 - 1, -1, 1);
    ty = clamp(e.clientY / innerHeight * 2 - 1, -1, 1);
  });
  hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
  if (finePointer) document.querySelectorAll('[data-tilt]').forEach(el => {
    el.addEventListener('pointermove', e => {
      const box = el.getBoundingClientRect();
      el.style.setProperty('--tx', ((e.clientX - box.left) / box.width * 2 - 1).toFixed(3));
      el.style.setProperty('--ty', ((e.clientY - box.top) / box.height * 2 - 1).toFixed(3));
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--tx', 0); el.style.setProperty('--ty', 0); });
  });

  // Frame loop: runs only while an animated layer is on screen.
  let raf = 0, last = 0;
  function frame(now) {
    raf = 0;
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
    mx += (tx - mx) * .07; my += (ty - my) * .07;
    if (heroSeen) { hero.style.setProperty('--mx', mx.toFixed(4)); hero.style.setProperty('--my', my.toFixed(4)); }
    let any = false;
    for (const l of layers) if (l.live) { l.draw(dt); any = true; }
    if (any && !isOff()) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && !isOff()) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  function syncVideo(v) {
    if (v.dataset.seen === '1' && !isOff()) { const run = v.play(); if (run) run.catch(() => {}); }
    else v.pause();
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      const el = e.target;
      if (el === hero) heroSeen = e.isIntersecting;
      else if (el === proc) procSeen = e.isIntersecting;
      else if (el.tagName === 'VIDEO') { el.dataset.seen = e.isIntersecting ? '1' : '0'; syncVideo(el); }
      else { const l = layers.find(x => x.canvas === el); if (l) l.live = e.isIntersecting; }
      kick();
    }), { rootMargin: '80px' });
    [hero, proc, ...videos, ...layers.map(l => l.canvas)].forEach(el => io.observe(el));
  } else layers.forEach(l => { l.live = true; });

  document.addEventListener('motionchange', () => {
    videos.forEach(syncVideo);
    if (isOff()) { tx = ty = mx = my = 0; hero.style.setProperty('--mx', 0); hero.style.setProperty('--my', 0); parallax.forEach(el => { el.style.translate = ''; }); layers.forEach(l => l.draw(0)); }
    onScroll(); kick();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  addEventListener('load', () => { layers.forEach(l => l.draw(0)); onScroll(); kick(); });
  onScroll(); kick();
})();
