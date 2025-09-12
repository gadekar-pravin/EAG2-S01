"use strict";

/**
 * Tiny confetti engine tailored for a single board canvas.
 * Draws lightweight rectangles with gravity & drag for ~2.2s.
 */
export function confettiBurst(canvas, strength = 1) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  const { width, height } = canvas.getBoundingClientRect();
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.scale(dpr, dpr);

  const N = Math.floor(120 * strength);
  const colors = ["#ffd166", "#06d6a0", "#118ab2", "#ef476f", "#f78c6b"];
  const parts = [];

  for (let i = 0; i < N; i++) {
    parts.push({
      x: width / 2 + (Math.random() - 0.5) * 80,
      y: height / 2,
      w: 4 + Math.random() * 4,
      h: 6 + Math.random() * 8,
      vx: (Math.random() - 0.5) * 5,
      vy: -4 - Math.random() * 3,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.2,
      col: colors[i % colors.length],
      life: 0
    });
  }

  const gravity = 0.15;
  const drag = 0.995;
  let then = performance.now();

  function step(now) {
    const dt = Math.min(32, now - then) / 16.67;
    then = now;
    ctx.clearRect(0, 0, width, height);

    let alive = 0;
    for (const p of parts) {
      p.life += dt;
      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.x += p.vx * dt * 3;
      p.y += p.vy * dt * 3;
      p.rot += p.vr * dt;

      if (p.y < height + 20 && p.life < 150) {
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.col;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    }

    if (alive > 0) requestAnimationFrame(step);
    else ctx.clearRect(0, 0, width, height);
  }
  requestAnimationFrame(step);
}