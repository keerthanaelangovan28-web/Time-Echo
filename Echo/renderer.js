/* =====================================================
   TIME ECHO PLATFORMER v3 — renderer.js
   ===================================================== */
window.TEP = window.TEP || {};

TEP.Renderer = (() => {
  const C = TEP.CONFIG;
  let canvas, ctx, W, H;
  const particles = [];

  function init(c) {
    canvas = c; ctx = c.getContext('2d');
    W = c.width; H = c.height;
    ctx.imageSmoothingEnabled = false;
  }

  function px(x) { return Math.floor(x); }
  function py(y) { return Math.floor(y); }

  // ── Background (NO night, NO darkness) ───────────────
  function hillY(x, baseY, amp, freq) {
    return baseY + Math.sin(x * freq) * amp + Math.sin(x * freq * 2.3) * amp * 0.35;
  }
  function drawHillLayer(color, camX, parallax, baseY, amp, freq) {
    const off = camX * parallax;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W + 8; x += 4) {
      ctx.lineTo(x, hillY(x + off, baseY, amp, freq));
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }

  function drawBackground(camX, theme) {
    // Simple gradient sky — no night, no darkness overlay
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, theme.skyTop);
    g.addColorStop(1, theme.skyBot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    drawHillLayer(theme.far  || theme.layers?.[0] || '#111', camX, 0.04, H * 0.55, H * 0.12, 0.003);
    drawHillLayer(theme.mid  || theme.layers?.[1] || '#181818', camX, 0.12, H * 0.65, H * 0.10, 0.005);
    drawHillLayer(theme.near || theme.layers?.[2] || '#222', camX, 0.28, H * 0.76, H * 0.09, 0.007);
  }

  // ── Platform ──────────────────────────────────────────
  function drawPlatform(p, camX, camY, theme) {
    if (p.crumbled) return;
    const sx = px(p.x - camX), sy = py(p.y - camY);
    if (sx + p.w < -4 || sx > W || sy + p.h < -4 || sy > H) return;

    const topC  = p.icy  ? '#9ae4f5'
                 : p.crumbleTimer > 0 ? '#cc6600'
                 : theme.platformTop  || '#7a5a10';
    const sideC = p.icy  ? '#5ab0cc' : theme.platformSide || '#4a3508';
    const litC  = p.icy  ? '#ccf5ff' : theme.platformLight|| '#c49a20';

    const sideH = Math.min(12, p.h + 6);
    ctx.fillStyle = sideC;
    ctx.fillRect(sx, sy + p.h, p.w, sideH);

    const bz = 8;
    for (let bx = 0; bx < p.w; bx += bz) {
      const bw = Math.min(bz, p.w - bx);
      ctx.fillStyle = Math.floor(bx / bz) % 2 === 0 ? topC : litC;
      ctx.fillRect(sx + bx, sy, bw, p.h);
    }
    ctx.fillStyle = litC;
    ctx.fillRect(sx, sy, p.w, 2);

    if (p.icy) {
      ctx.fillStyle = 'rgba(200,245,255,0.35)';
      ctx.fillRect(sx + 2, sy + 2, p.w - 4, 3);
    }

    if (p.moving) {
      ctx.fillStyle = 'rgba(255,220,80,0.18)';
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.fillStyle = 'rgba(255,220,80,0.5)';
      ctx.fillRect(sx, sy, p.w, 1);
    }

    if (p.crumbleTimer > 0) {
      ctx.fillStyle = 'rgba(255,130,0,0.38)';
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.strokeStyle = '#ff5500'; ctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(px(sx + p.w * i / 3), sy);
        ctx.lineTo(px(sx + p.w * i / 3 + 5), sy + p.h);
        ctx.stroke();
      }
    }

    if (p.oneWay) {
      ctx.fillStyle = 'rgba(126,255,245,0.35)';
      ctx.fillRect(sx, sy, p.w, 2);
    }
  }

  // ── Lava — emits warm light into surroundings ─────────
  function drawLava(lv, camX, camY) {
    const sx = px(lv.x - camX), sy = py(lv.y - camY);
    if (sx + lv.w < -120 || sx > W + 120 || sy + lv.h < -120 || sy > H + 120) return;

    const t = Date.now() * 0.006;
    const pulse = 0.5 + Math.sin(t * 2) * 0.5;


    // ── CORE BODY ──
    ctx.fillStyle = '#6a1200';
    ctx.fillRect(sx, sy, lv.w, lv.h);

    ctx.fillStyle = '#cc2a00';
    ctx.fillRect(sx, sy + 3, lv.w, lv.h - 3);

    ctx.fillStyle = '#ff4a00';
    ctx.fillRect(sx, sy, lv.w, 3);

    // ── HOT SURFACE WAVES ──
    ctx.fillStyle = '#ff7a1a';
    for (let x = 0; x < lv.w; x += 6) {
      const wave = Math.sin(t * 2 + x * 0.18) * 2;
      ctx.fillRect(sx + x, sy + wave, 4, 3);
    }

    // Bright core glow on surface
    ctx.fillStyle = `rgba(255, 200, 80, ${0.18 + pulse * 0.14})`;
    ctx.fillRect(sx + 2, sy, lv.w - 4, 4);
  }

  // ── Spike ─────────────────────────────────────────────
  function drawSpike(s, camX, camY) {
    const sx = px(s.x - camX), sy = py(s.y - camY);
    if (sx + s.w < 0 || sx > W) return;
    const count = Math.max(1, Math.floor(s.w / 10));
    const sw2 = s.w / count;
    ctx.fillStyle = '#888fa0';
    for (let i = 0; i < count; i++) {
      ctx.beginPath();
      ctx.moveTo(px(sx + i * sw2), py(sy + s.h));
      ctx.lineTo(px(sx + i * sw2 + sw2 / 2), py(sy));
      ctx.lineTo(px(sx + i * sw2 + sw2), py(sy + s.h));
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#cc8888';
    for (let i = 0; i < count; i++) {
      ctx.fillRect(px(sx + i * sw2 + sw2 / 2 - 1), py(sy + 1), 2, 5);
    }
  }

  // ── Laser ─────────────────────────────────────────────
  function drawLaser(l, camX, camY) {
    if (!l.active) return;
    const sx = px(l.x - camX), sy = py(l.y - camY);
    const fl = 0.75 + Math.sin(Date.now() * 0.025) * 0.25;
    ctx.globalAlpha = fl;
    ctx.fillStyle = '#ff2244';
    ctx.fillRect(sx, sy, l.w, l.h);
    ctx.fillStyle = 'rgba(255,130,150,0.4)';
    ctx.fillRect(sx - 2, sy - 2, l.w + 4, l.h + 4);
    ctx.globalAlpha = 1;
  }

  // ── Switch (Lever) ────────────────────────────────────
  function drawSwitch(sw, camX, camY) {
    const sx = px(sw.x - camX), sy = py(sw.y - camY);
    if (sx + sw.w < 0 || sx > W) return;

    const on = sw.active;
    ctx.fillStyle = on ? '#5a8c30' : '#3a3a6a';
    ctx.fillRect(sx, sy + sw.h - 10, sw.w, 10);
    ctx.fillStyle = on ? '#88cc44' : '#6666aa';
    ctx.fillRect(sx + 2, sy + sw.h - 9, sw.w - 4, 7);
    ctx.strokeStyle = on ? '#ffdd44' : '#aaaacc';
    ctx.lineWidth = 3;
    const pivotX = sx + sw.w / 2;
    const pivotY = sy + sw.h - 4;
    const angle = on ? -0.5 : 0.5;
    ctx.beginPath();
    ctx.moveTo(px(pivotX), py(pivotY));
    ctx.lineTo(px(pivotX + Math.sin(angle) * 14), py(pivotY - Math.cos(angle) * 14));
    ctx.stroke();
    ctx.fillStyle = on ? '#ffdd44' : '#aaaacc';
    ctx.fillRect(
      px(pivotX + Math.sin(angle) * 14 - 4),
      py(pivotY - Math.cos(angle) * 14 - 4),
      8, 8
    );
    ctx.fillStyle = on ? '#ffdd44' : '#7777aa';
    ctx.font = 'bold 8px "Press Start 2P",monospace';
    ctx.textAlign = 'center';
    ctx.fillText(sw.id, px(pivotX), py(sy));
    ctx.textAlign = 'left';
  }

  // ── Door ──────────────────────────────────────────────
  function drawDoor(d, camX, camY) {
    const sx = px(d.x - camX), sy = py(d.y - camY);
    if (sx + d.w < 0 || sx > W) return;
    const openH = Math.floor(d.h * d._openAnim);
    const closedH = d.h - openH;
    if (closedH <= 0) return;
    ctx.fillStyle = d.open ? '#336633' : '#331100';
    ctx.fillRect(sx, sy + openH, d.w, closedH);
    ctx.fillStyle = d.open ? '#55aa55' : '#662200';
    for (let row = 0; row < 3; row++) {
      const dy2 = sy + openH + 4 + row * (closedH / 3.2);
      ctx.fillRect(sx + 3, py(dy2), d.w - 6, 4);
    }
    ctx.fillStyle = d.open ? '#aaffaa' : '#ffaa44';
    ctx.font = 'bold 9px "Press Start 2P",monospace';
    ctx.textAlign = 'center';
    ctx.fillText(d.id, px(sx + d.w / 2), py(sy + openH + 14));
    ctx.textAlign = 'left';
  }

  // ── Pressure plate ────────────────────────────────────
  function drawPressurePlate(pp, camX, camY) {
    const sx = px(pp.x - camX), sy = py(pp.y - camY);
    ctx.fillStyle = pp.active ? '#ffd166' : '#5a6a80';
    ctx.fillRect(sx, sy + 4, pp.w, 5);
    ctx.fillStyle = pp.active ? '#ffe999' : '#8899aa';
    ctx.fillRect(sx + 3, sy, pp.w - 6, 6);
    if (pp.required > 1) {
      ctx.fillStyle = pp.active ? '#ffaa00' : '#aaa';
      ctx.font = '7px monospace';
      ctx.fillText('×' + pp.required, sx + pp.w / 2 - 5, sy - 2);
    }
  }

  // ── Goal Portal ───────────────────────────────────────
  function drawFlag(f, camX, camY) {
    const sx = px(f.x - camX), sy = py(f.y - camY);
    if (sx + f.w < -20 || sx > W) return;

    const t = f._t;
    const pulse = (Math.sin(t * 2.5) + 1) * 0.5;

    ctx.strokeStyle = `rgba(46,204,113,${0.5 + pulse * 0.4})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(sx, sy, f.w, f.h);

    const g = ctx.createLinearGradient(sx, sy, sx, sy + f.h);
    g.addColorStop(0, `rgba(46,204,113,${0.12 + pulse * 0.12})`);
    g.addColorStop(1, `rgba(0,200,100,${0.06 + pulse * 0.06})`);
    ctx.fillStyle = g;
    ctx.fillRect(sx + 3, sy + 3, f.w - 6, f.h - 6);

    const dotC = `rgba(80,255,140,${0.6 + pulse * 0.4})`;
    ctx.fillStyle = dotC;
    ctx.fillRect(sx, sy, 6, 6);
    ctx.fillRect(sx + f.w - 6, sy, 6, 6);
    ctx.fillRect(sx, sy + f.h - 6, 6, 6);
    ctx.fillRect(sx + f.w - 6, sy + f.h - 6, 6, 6);

    ctx.fillStyle = `rgba(126,255,180,${0.7 + pulse * 0.3})`;
    ctx.font = '7px "Press Start 2P",monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GOAL', px(sx + f.w / 2), py(sy - 6));
    ctx.textAlign = 'left';

    for (let i = 0; i < 3; i++) {
      const ang = t * 1.2 + i * 2.09;
      const r = 18 + pulse * 6;
      const px2 = sx + f.w / 2 + Math.cos(ang) * r;
      const py2 = sy + f.h / 2 + Math.sin(ang) * r;
      ctx.fillStyle = `rgba(126,255,180,${0.4 + pulse * 0.4})`;
      ctx.fillRect(Math.floor(px2), Math.floor(py2), 3, 3);
    }
  }

  // ── Echonaut ──────────────────────────────────────────
  function drawEchonaut(sx, sy, color, facingRight, frame, alpha, isMoving) {
    ctx.globalAlpha = alpha;
    const f = frame;

    const legSwing = (isMoving !== false) ? Math.sin(f * 0.28) * 5 : 0;
    const armSwing = (isMoving !== false) ? Math.sin(f * 0.28) * 4 : 0;

    ctx.fillStyle = color;
    const lLegX = sx + 3;
    const lLegY = sy + 26 + legSwing;
    ctx.fillRect(lLegX, lLegY, 7, 10);
    ctx.fillStyle = _darken(color, 0.55);
    ctx.fillRect(lLegX - 1, lLegY + 9, 9, 4);

    ctx.fillStyle = color;
    const rLegX = sx + 12;
    const rLegY = sy + 26 - legSwing;
    ctx.fillRect(rLegX, rLegY, 7, 10);
    ctx.fillStyle = _darken(color, 0.55);
    ctx.fillRect(rLegX - 1, rLegY + 9, 9, 4);

    ctx.fillStyle = _darken(color, 0.72);
    ctx.fillRect(sx + 2, sy + 14, 18, 14);
    ctx.fillStyle = color;
    ctx.fillRect(sx + 6, sy + 15, 10, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx + 9, sy + 18, 4, 4);
    ctx.fillStyle = color;
    ctx.fillRect(sx + 10, sy + 19, 2, 2);

    const armY = sy + 15;
    ctx.fillStyle = _darken(color, 0.65);
    ctx.fillRect(sx - 2, armY + armSwing, 5, 10);
    ctx.fillStyle = _darken(color, 0.5);
    ctx.fillRect(sx - 3, armY + 9 + armSwing, 7, 4);
    ctx.fillStyle = _darken(color, 0.65);
    ctx.fillRect(sx + 19, armY - armSwing, 5, 10);
    ctx.fillStyle = _darken(color, 0.5);
    ctx.fillRect(sx + 18, armY + 9 - armSwing, 7, 4);

    ctx.fillStyle = _darken(color, 0.78);
    ctx.fillRect(sx + 3, sy + 1, 16, 14);
    ctx.fillStyle = _darken(color, 0.68);
    ctx.fillRect(sx + 4, sy, 14, 5);

    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(sx + 4, sy + 4, 14, 7);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha * 0.8;
    ctx.fillRect(sx + 5, sy + 5, 12, 4);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    if (facingRight) {
      ctx.fillRect(sx + 13, sy + 6, 3, 2);
    } else {
      ctx.fillRect(sx + 6, sy + 6, 3, 2);
    }

    ctx.fillStyle = _darken(color, 0.6);
    ctx.fillRect(sx + 7, sy + 13, 8, 3);

    ctx.globalAlpha = 1;
  }

  function _darken(hex, f) {
    if (!hex || hex[0] !== '#' || hex.length < 7) return hex;
    const r = Math.floor(parseInt(hex.slice(1,3),16) * f);
    const g2 = Math.floor(parseInt(hex.slice(3,5),16) * f);
    const b = Math.floor(parseInt(hex.slice(5,7),16) * f);
    return `rgb(${r},${g2},${b})`;
  }

  let _walkFrame = 0;

  function drawActor(actor, camX, camY, alpha) {
    if (alpha === undefined) alpha = 1;
    const sx = px(actor.x - camX);
    const sy = py(actor.y - camY);
    if (sx + actor.w < -10 || sx > W + 10) return;
    if (!actor.isGhost) _walkFrame++;
    drawEchonaut(sx, sy, actor.color || '#00d4ff', actor.facingRight, actor.isGhost ? 0 : _walkFrame, alpha);
  }

  function drawActorTrail(actor, camX, camY, color) {
    const trail = actor.trail || [];
    const isMoving = Math.abs(actor.vx) > 0.4 || Math.abs(actor.vy) > 1.0;
    if (!isMoving || trail.length < 3) return;

    for (let i = 0; i < trail.length; i++) {
      const alpha = (i / trail.length) * 0.18;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      const sx2 = trail[i].x - camX + actor.w / 2 - 3;
      const sy2 = trail[i].y - camY + actor.h / 2 - 3;
      ctx.fillRect(px(sx2), py(sy2), 6, 6);
    }
    ctx.globalAlpha = 1;
  }

  // ── Echo ──────────────────────────────────────────────
  function drawEcho(echo, camX, camY) {
    const actor = echo.actor;
    const sx = px(actor.x - camX);
    const sy = py(actor.y - camY);
    if (sx + actor.w < -10 || sx > W + 10) return;

    ctx.globalAlpha = 0.10;
    ctx.fillStyle = echo.color;
    ctx.fillRect(sx - 40, sy - 40, actor.w + 80, actor.h + 80);

    ctx.globalAlpha = 0.07;
    ctx.fillRect(sx - 70, sy - 70, actor.w + 140, actor.h + 140);

    ctx.globalAlpha = 0.04;
    ctx.fillRect(sx - 110, sy - 110, actor.w + 220, actor.h + 220);

    ctx.globalAlpha = 1;

    drawActorTrail(actor, camX, camY, echo.color);
    drawEchonaut(sx, sy, echo.color, actor.facingRight, 0, 0.80);

    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = echo.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, actor.w, actor.h);
    ctx.globalAlpha = 1;

    const t = echo.frames.length > 0 ? Math.min(1, echo.frameIndex / echo.frames.length) : 0;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(sx - 1, sy - 6, actor.w + 2, 3);
    ctx.fillStyle = echo.color;
    ctx.fillRect(sx - 1, sy - 6, Math.floor((actor.w + 2) * t), 3);
  }

  // ── Pet pixel drawing ─────────────────────────────────
  let _petFrame = 0;
  function drawPet(petId, playerX, playerY, camX, camY) {
    if (!petId || petId === 'none') return;
    const petDef = C.PETS?.find(p => p.id === petId);
    if (!petDef) return;
    _petFrame++;

    const sx = px(playerX - camX) + 28;
    const sy = py(playerY - camY) + 8;
    const t = _petFrame;
    const bob = Math.sin(t * 0.08) * 3;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    switch (petId) {
      case 'chrono_cat':    _drawPixelCat(ctx, sx, sy + bob, t, petDef.color); break;
      case 'paradox_pup':   _drawPixelDog(ctx, sx, sy + bob, t, petDef.color); break;
      case 'wisp_bird':     _drawPixelBird(ctx, sx, sy + bob, t, petDef.color); break;
      case 'copper_golem':  _drawPixelGolem(ctx, sx, sy + bob, t, petDef.color); break;
      case 'phantom_fox':   _drawPixelFox(ctx, sx, sy + bob, t, petDef.color); break;
      case 'star_jellyfish':_drawPixelJelly(ctx, sx, sy + bob, t, petDef.color); break;
      case 'time_ferret':   _drawPixelFerret(ctx, sx, sy + bob, t, petDef.color); break;
      case 'echo_sprite':   _drawPixelSprite(ctx, sx, sy + bob, t, petDef.color); break;
      case 'shadow_wolf':   _drawPixelWolf(ctx, sx, sy + bob, t, petDef.color); break;
      case 'time_turtle':   _drawPixelTurtle(ctx, sx, sy + bob, t, petDef.color); break;
      case 'neon_butterfly':_drawPixelButterfly(ctx, sx, sy + bob, t, petDef.color); break;
      case 'chrono_crab':   _drawPixelCrab(ctx, sx, sy + bob, t, petDef.color); break;
      default:
        ctx.fillStyle = petDef.color;
        ctx.fillRect(sx, sy, 16, 16);
    }

    ctx.restore();
  }

  // ── Enemy ambient glow helper ─────────────────────────
  // Draws multi-layer soft light emission around an enemy
  function _drawEnemyGlow(sx, sy, w, h, color, intensity, pulse) {
    // intensity: 0.0–1.0 scale, pulse: 0.0–1.0 animated value
    const p = pulse || 0.5;
    const base = intensity || 0.5;

    // 4 expanding layers, each more transparent
    const layers = [
      { pad: 28, alpha: base * (0.13 + p * 0.07) },
      { pad: 55, alpha: base * (0.075 + p * 0.04) },
      { pad: 90, alpha: base * (0.042 + p * 0.022) },
      { pad: 140, alpha: base * (0.020 + p * 0.012) },
    ];

    for (const l of layers) {
      ctx.fillStyle = color;
      ctx.globalAlpha = l.alpha;
      ctx.fillRect(sx - l.pad, sy - l.pad, w + l.pad * 2, h + l.pad * 2);
    }
    ctx.globalAlpha = 1;
  }

  // ── Enemy drawings ────────────────────────────────────
  function drawEchoWisp(w, camX, camY) {
    const sx = px(w.x - camX), sy = py(w.y - camY);
    if (sx + w.w < -160 || sx > W + 160) return;

    const pulse = w.pulse || 0.5;
    const glowColor = w.corrupt ? '#ff44ff' : '#aa44ff';

    // Ambient light emission
    _drawEnemyGlow(sx, sy, w.w, w.h, glowColor, 0.7, pulse);

    // Core orb
    const cc = w.corrupt ? '#ff00ff' : '#cc44ff';
    const lc = w.corrupt ? '#ffaaff' : '#ee99ff';
    ctx.fillStyle = cc; ctx.fillRect(sx+4,sy+4,12,12);
    ctx.fillStyle = lc; ctx.fillRect(sx+6,sy+6,8,8);
    ctx.fillStyle = '#fff'; ctx.fillRect(sx+8,sy+8,4,4);

    ctx.fillStyle = cc;
    ctx.font = '6px "Press Start 2P",monospace';
    ctx.textAlign = 'center';
    ctx.fillText(w.name || 'WISP', sx + w.w/2, sy - 4);
    ctx.textAlign = 'left';

    const r = w.glowRadius;
    for (let i = 0; i < 4; i++) {
      const ang = Date.now()*0.002 + i*Math.PI/2;
      ctx.fillStyle = lc;
      ctx.fillRect(Math.floor(sx+w.w/2+Math.cos(ang)*r*0.6), Math.floor(sy+w.h/2+Math.sin(ang)*r*0.6), 3,3);
    }
  }

  function drawChronoSentinel(s, camX, camY) {
    const sx = px(s.x - camX), sy = py(s.y - camY);
    if (sx + s.w < -160 || sx > W + 160) return;

    const alpha = s.rewindFlash > 0 ? 0.5 + Math.sin(s.rewindFlash*0.35)*0.5 : 1;
    const pulse = (Math.sin(Date.now() * 0.003) + 1) * 0.5;

    // Amber/orange light emission — sentinel radiates warmth
    const glowColor = s.enraged ? '#ff4400' : '#ff8833';
    _drawEnemyGlow(sx, sy, s.w, s.h, glowColor, s.enraged ? 0.85 : 0.55, pulse);

    ctx.globalAlpha = alpha;
    const bodyC = s.enraged ? '#ff4400' : '#e87820';
    const armC  = s.enraged ? '#dd2200' : '#cc5500';

    ctx.fillStyle = bodyC;
    ctx.fillRect(sx+4, sy+s.h-14, 8, 14);
    ctx.fillRect(sx+s.w-12, sy+s.h-14, 8, 14);
    ctx.fillStyle = armC; ctx.fillRect(sx+2,sy+18,s.w-4,s.h-32);
    ctx.fillStyle = bodyC; ctx.fillRect(sx+4,sy+20,s.w-8,s.h-36);
    ctx.fillStyle = armC;
    ctx.fillRect(sx-4,sy+20,8,16); ctx.fillRect(sx+s.w-4,sy+20,8,16);
    ctx.fillStyle = armC; ctx.fillRect(sx+4,sy+2,s.w-8,18);
    const vx = s.dir > 0 ? sx+s.w-14 : sx+4;
    ctx.fillStyle = s.enraged ? '#ffff00' : '#ff4400';
    ctx.fillRect(vx, sy+7, 8, 5);

    if (s.rewindFlash > 0) {
      ctx.fillStyle = 'rgba(255,180,80,0.45)';
      ctx.fillRect(sx,sy,s.w,s.h);
    }
    if (s.alertFlash > 0) {
      ctx.fillStyle = 'rgba(255,60,0,0.3)';
      ctx.fillRect(sx-4,sy-4,s.w+8,s.h+8);
    }
    ctx.fillStyle = '#ff8833'; ctx.font='5px "Press Start 2P",monospace'; ctx.textAlign='center';
    ctx.fillText(s.name||'SENTINEL', sx+s.w/2, sy-3); ctx.textAlign='left';
    ctx.globalAlpha = 1;
  }

  function drawParadoxBeast(b, camX, camY) {
    const sx = px(b.x - camX), sy = py(b.y - camY);
    if (sx + b.w < -160 || sx > W + 160) return;

    const roar = b.roarTimer > 0;
    const pulse = (Math.sin(Date.now()*0.005)+1)*0.5;

    // Deep purple/violet light emission
    _drawEnemyGlow(sx, sy, b.w, b.h, '#cc00ff', roar ? 1.0 : 0.7, pulse);

    ctx.fillStyle = '#8800cc'; ctx.fillRect(sx+2,sy+14,b.w-4,b.h-14);
    ctx.fillStyle = '#aa22ee'; ctx.fillRect(sx+4,sy+16,b.w-8,b.h-18);
    ctx.fillStyle = '#6600aa'; ctx.fillRect(sx+6,sy,b.w-12,16);
    ctx.fillStyle = '#ff44ff';
    ctx.fillRect(sx+6,sy-8,4,10); ctx.fillRect(sx+b.w-10,sy-8,4,10);
    ctx.fillStyle = roar ? '#ffffff' : '#ff0066';
    ctx.fillRect(sx+8,sy+4,6,6); ctx.fillRect(sx+b.w-14,sy+4,6,6);
    ctx.fillStyle = '#cc44ff';
    ctx.fillRect(sx-6,sy+20,10,8); ctx.fillRect(sx+b.w-4,sy+20,10,8);

    if (b.shakePulse > 0) {
      const off = Math.floor(Math.sin(b.shakePulse)*3);
      ctx.fillStyle='rgba(200,0,255,0.3)';
      ctx.fillRect(sx+off,sy,b.w,b.h);
    }
    if (roar) {
      ctx.fillStyle='#ff00ff'; ctx.font='bold 9px monospace';
      ctx.fillText('COPY!', sx+b.w/2-14, sy-14);
    }
    ctx.fillStyle='#cc44ff'; ctx.font='5px "Press Start 2P",monospace'; ctx.textAlign='center';
    ctx.fillText(b.name||'PARADOX', sx+b.w/2, sy-4); ctx.textAlign='left';

    if (b.antiEcho && !b.antiEcho.actor.dead) {
      drawActorTrail(b.antiEcho.actor, camX, camY, '#ff3333');
      drawEchonaut(px(b.antiEcho.actor.x-camX), py(b.antiEcho.actor.y-camY), '#ff2244', b.antiEcho.actor.facingRight, 0, 0.85);
    }
  }

  function drawTemporalSlime(s, camX, camY) {
    const sx=px(s.x-camX), sy=py(s.y-camY);
    if(sx+s.w<-160||sx>W+160) return;

    const sz=s.size||1;
    const w2=Math.floor(s.w*sz), h2=Math.floor(s.h*sz);
    const pulse = (Math.sin(Date.now()*0.004)+1)*0.5;

    // Acid green light emission
    _drawEnemyGlow(sx, sy, w2, h2, '#44ff22', 0.5 * sz, pulse);

    const col=s.hitFlash>0?'#ffffff':'#44dd22';
    ctx.fillStyle=col; ctx.fillRect(sx,sy,w2,h2);
    ctx.fillStyle='#88ff44'; ctx.fillRect(sx+2,sy+2,w2-4,h2/2);
    ctx.fillStyle='#000'; ctx.fillRect(sx+3,sy+3,3,3); ctx.fillRect(sx+w2-6,sy+3,3,3);
    ctx.fillStyle='#fff'; ctx.fillRect(sx+4,sy+4,1,1); ctx.fillRect(sx+w2-5,sy+4,1,1);
    ctx.fillStyle='#22bb00'; ctx.font='6px "Press Start 2P",monospace'; ctx.textAlign='center';
    ctx.fillText('SLIME',sx+w2/2,sy-3); ctx.textAlign='left';

    for(const sp of s.splits) drawTemporalSlime(sp,camX,camY);
  }

  function drawVoidShade(s, camX, camY) {
    const sx=px(s.x-camX), sy=py(s.y-camY);
    if(sx+s.w<-160||sx>W+160) return;

    const pulse = (Math.sin(Date.now()*0.004)+1)*0.5;
    const visAlpha = s.alpha || 1;

    // Dark violet light — dim when invisible, brighter when charging
    const glowIntensity = s.charging ? 0.65 : (0.3 * visAlpha);
    _drawEnemyGlow(sx, sy, s.w, s.h, '#6600cc', glowIntensity, pulse);

    ctx.globalAlpha = visAlpha;
    ctx.fillStyle='#1a0040'; ctx.fillRect(sx,sy,s.w,s.h);
    ctx.fillStyle='#440088'; ctx.fillRect(sx+2,sy+2,s.w-4,s.h-4);

    if(visAlpha > 0.3){
      ctx.fillStyle='rgba(180,0,255,0.8)';
      ctx.fillRect(sx+5,sy+12,6,5); ctx.fillRect(sx+s.w-11,sy+12,6,5);
    }
    if(s.charging){
      ctx.fillStyle='rgba(180,0,255,0.35)';
      ctx.fillRect(sx-4,sy-4,s.w+8,s.h+8);
    }
    ctx.globalAlpha=1;

    if(visAlpha > 0.5){
      ctx.globalAlpha=visAlpha*0.7;
      ctx.fillStyle='#aa44ff'; ctx.font='5px "Press Start 2P",monospace'; ctx.textAlign='center';
      ctx.fillText('SHADE',sx+s.w/2,sy-3); ctx.textAlign='left';
      ctx.globalAlpha=1;
    }
  }

  // ── Collectibles ──────────────────────────────────────
  function drawCollectible(c, camX, camY) {
    if (c.collected) return;
    const sx = px(c.x - camX), sy = py(c.y - camY + c.bobY);
    if (c.type === 'coin') {
      ctx.fillStyle = '#ffd700'; ctx.fillRect(sx+2,sy,10,14);
      ctx.fillStyle = '#ffaa00'; ctx.fillRect(sx,sy+2,2,10); ctx.fillRect(sx+12,sy+2,2,10);
      ctx.fillStyle = '#ffe066'; ctx.fillRect(sx+4,sy+2,6,3);
      if (Math.floor(Date.now()/350)%4===0) { ctx.fillStyle='#fff'; ctx.fillRect(sx+6,sy-3,2,2); }
    } else {
      ctx.fillStyle = '#a78bfa';
      ctx.beginPath(); ctx.moveTo(sx+7,sy); ctx.lineTo(sx+14,sy+7);
      ctx.lineTo(sx+7,sy+14); ctx.lineTo(sx,sy+7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c4b5fd'; ctx.fillRect(sx+5,sy+2,4,4);
    }
  }

  // ── Pet pixel art ─────────────────────────────────────
  function _drawPixelCat(ctx2, x, y, t, color) {
    const leg = Math.sin(t*0.15)*2;
    ctx2.fillStyle = color; ctx2.fillRect(x+2,y+8,14,9);
    ctx2.fillRect(x+3,y+1,12,9);
    ctx2.fillRect(x+3,y-2,4,5); ctx2.fillRect(x+11,y-2,4,5);
    ctx2.fillStyle='#ffaaaa'; ctx2.fillRect(x+4,y-1,2,3); ctx2.fillRect(x+12,y-1,2,3);
    ctx2.fillStyle='#000'; ctx2.fillRect(x+5,y+3,3,3); ctx2.fillRect(x+10,y+3,3,3);
    ctx2.fillStyle='#40e0d0'; ctx2.fillRect(x+6,y+4,2,2); ctx2.fillRect(x+11,y+4,2,2);
    ctx2.fillStyle='#ff99bb'; ctx2.fillRect(x+8,y+6,2,2);
    ctx2.fillStyle=color;
    ctx2.fillRect(x+3,y+16+leg,4,5); ctx2.fillRect(x+11,y+16-leg,4,5);
    const tw=Math.sin(t*0.1)*5;
    ctx2.fillRect(x+16+tw,y+10,3,3); ctx2.fillRect(x+17+tw*1.4,y+7,2,4);
  }

  function _drawPixelDog(ctx2, x, y, t, color) {
    const leg=Math.sin(t*0.15)*2;
    ctx2.fillStyle=color;
    ctx2.fillRect(x+1,y+9,16,8);
    ctx2.fillRect(x+2,y+2,12,9);
    ctx2.fillStyle=_darken(color,0.65);
    ctx2.fillRect(x+1,y+4,4,7); ctx2.fillRect(x+13,y+4,4,7);
    ctx2.fillStyle='#000'; ctx2.fillRect(x+4,y+4,4,4); ctx2.fillRect(x+11,y+4,4,4);
    ctx2.fillStyle='#fff'; ctx2.fillRect(x+5,y+5,2,2); ctx2.fillRect(x+12,y+5,2,2);
    ctx2.fillStyle='#222'; ctx2.fillRect(x+6,y+9,6,4);
    ctx2.fillStyle=color;
    ctx2.fillRect(x+2,y+16+leg,5,5); ctx2.fillRect(x+11,y+16-leg,5,5);
    const ta=Math.sin(t*0.2)*6;
    ctx2.fillRect(x+17+Math.floor(ta*0.4),y+9,3,3);
    ctx2.fillRect(x+18+Math.floor(ta),y+6,2,4);
  }

  function _drawPixelBird(ctx2, x, y, t, color) {
    const wy=Math.sin(t*0.25)*4;
    ctx2.fillStyle='#111'; ctx2.fillRect(x+5,y+9,10,8);
    ctx2.fillRect(x+4,y+4,12,7);
    ctx2.fillStyle='#ffaa00'; ctx2.fillRect(x+14,y+6,5,3);
    ctx2.fillStyle='#fff'; ctx2.fillRect(x+5,y+5,6,5);
    ctx2.fillStyle='#000'; ctx2.fillRect(x+7,y+6,3,3);
    ctx2.fillStyle=color;
    ctx2.fillRect(x, py(y+6+wy), 6,8); ctx2.fillRect(x+14,py(y+6-wy),6,8);
    ctx2.fillStyle='#333'; ctx2.fillRect(x+5,y+16,5,5); ctx2.fillRect(x+10,y+16,5,5);
    ctx2.fillStyle='#ffaa00'; ctx2.fillRect(x+6,y+20,3,3); ctx2.fillRect(x+11,y+20,3,3);
  }

  function _drawPixelGolem(ctx2, x, y, t, color) {
    const arm=Math.sin(t*0.1)*3;
    ctx2.fillStyle='#8B6633'; ctx2.fillRect(x+2,y+8,16,12);
    ctx2.fillStyle='#a07840'; ctx2.fillRect(x+4,y+9,12,10);
    ctx2.fillStyle='#6b5020'; ctx2.fillRect(x+3,y+1,14,9);
    ctx2.fillStyle=color; ctx2.fillRect(x+5,y+3,10,4);
    ctx2.fillStyle='#fff'; ctx2.fillRect(x+6,y+4,3,2); ctx2.fillRect(x+11,y+4,3,2);
    ctx2.fillStyle='#8B6633';
    ctx2.fillRect(x-2,y+8+arm,5,8); ctx2.fillRect(x+17,y+8-arm,5,8);
    ctx2.fillStyle='#5a4010';
    ctx2.fillRect(x-3,y+14+arm,6,5); ctx2.fillRect(x+17,y+14-arm,6,5);
    ctx2.fillRect(x+4,y+19,5,5); ctx2.fillRect(x+11,y+19,5,5);
  }

  function _drawPixelFox(ctx2, x, y, t, color) {
    const leg=Math.sin(t*0.15)*2;
    ctx2.fillStyle=color;
    ctx2.fillRect(x+2,y+9,16,8);
    ctx2.fillRect(x+3,y+2,13,9);
    ctx2.fillRect(x+3,y-2,5,6); ctx2.fillRect(x+12,y-2,5,6);
    ctx2.fillStyle='#ffccaa'; ctx2.fillRect(x+4,y-1,3,4); ctx2.fillRect(x+13,y-1,3,4);
    ctx2.fillStyle='#ffccaa'; ctx2.fillRect(x+12,y+7,7,5); ctx2.fillRect(x+9,y+8,5,4);
    ctx2.fillStyle='#000'; ctx2.fillRect(x+14,y+6,3,3);
    ctx2.fillStyle='#000'; ctx2.fillRect(x+5,y+4,4,4); ctx2.fillRect(x+12,y+4,4,4);
    ctx2.fillStyle='#ff7733'; ctx2.fillRect(x+6,y+5,2,2); ctx2.fillRect(x+13,y+5,2,2);
    ctx2.fillStyle=color; ctx2.fillRect(x+2,y+16+leg,5,5); ctx2.fillRect(x+13,y+16-leg,5,5);
    const ta=Math.sin(t*0.08)*4;
    ctx2.fillRect(x+18+Math.floor(ta*0.4),y+8,4,5);
    ctx2.fillRect(x+20+Math.floor(ta),y+4,3,5);
    ctx2.fillStyle='#fff'; ctx2.fillRect(x+20+Math.floor(ta),y+3,3,4);
  }

  function _drawPixelJelly(ctx2, x, y, t, color) {
    const pulse=Math.sin(t*0.12)*2;
    ctx2.globalAlpha=0.85;
    ctx2.fillStyle=color;
    ctx2.fillRect(x+2,y+2+pulse,14,10-pulse);
    ctx2.fillRect(x,y+10,18,6);
    ctx2.globalAlpha=0.4; ctx2.fillStyle='#fff';
    ctx2.fillRect(x+3,y+3+pulse,6,4);
    ctx2.globalAlpha=1;
    ctx2.fillStyle='#fff'; ctx2.fillRect(x+5,y+8,3,3); ctx2.fillRect(x+10,y+8,3,3);
    ctx2.fillStyle='#000'; ctx2.fillRect(x+6,y+9,2,2); ctx2.fillRect(x+11,y+9,2,2);
    ctx2.fillStyle=color;
    for(let i=0;i<4;i++){
      const tx=x+3+i*4;
      const wave=Math.sin(t*0.15+i*0.9)*3;
      ctx2.fillRect(tx,y+16,2,4+Math.floor(wave));
    }
  }

  function _drawPixelFerret(ctx2, x, y, t, color) {
    const bob=Math.sin(t*0.12)*2;
    ctx2.fillStyle=color;
    ctx2.fillRect(x,y+9+bob,20,7);
    ctx2.fillRect(x+14,y+4+bob,8,8);
    ctx2.fillStyle='#eeeecc'; ctx2.fillRect(x+3,y+10+bob,14,5);
    ctx2.fillStyle='#000'; ctx2.fillRect(x+16,y+6+bob,3,3);
    ctx2.fillStyle='#f00'; ctx2.fillRect(x+17,y+7+bob,1,1);
    ctx2.fillStyle='#222'; ctx2.fillRect(x+20,y+8+bob,2,2);
    ctx2.fillStyle=color;
    const leg=Math.sin(t*0.2)*2;
    ctx2.fillRect(x+1,y+15+bob+leg,4,5); ctx2.fillRect(x+7,y+15+bob-leg,4,5);
    ctx2.fillRect(x+13,y+15+bob+leg,4,5);
    const ta=Math.sin(t*0.08)*3;
    ctx2.fillRect(ta,y+10+bob,4,6);
  }

  function _drawPixelSprite(ctx2, x, y, t, color) {
    const glow=(Math.sin(t*0.12)+1)*0.5;
    ctx2.globalAlpha=0.25+glow*0.15; ctx2.fillStyle=color;
    ctx2.fillRect(x-2,y-2,22,22);
    ctx2.globalAlpha=1;
    ctx2.fillStyle=color;
    ctx2.fillRect(x+5,y+4,8,8);
    ctx2.fillRect(x+2,y+7,14,2);
    ctx2.fillStyle='#fff'; ctx2.fillRect(x+6,y+5,2,2); ctx2.fillRect(x+10,y+5,2,2);
    ctx2.fillStyle='#000'; ctx2.fillRect(x+7,y+6,1,1); ctx2.fillRect(x+11,y+6,1,1);
    for(let i=0;i<4;i++){
      const ang=t*0.1+i*Math.PI/2;
      const sx2=x+9+Math.cos(ang)*9, sy2=y+8+Math.sin(ang)*9;
      ctx2.fillStyle='#fff'; ctx2.fillRect(Math.floor(sx2),Math.floor(sy2),2,2);
    }
    ctx2.globalAlpha=0.55; ctx2.fillStyle=color;
    ctx2.fillRect(x-5,y+5+Math.floor(Math.sin(t*0.2)*2),6,4);
    ctx2.fillRect(x+17,y+5-Math.floor(Math.sin(t*0.2)*2),6,4);
    ctx2.globalAlpha=1;
  }

  function _drawPixelWolf(ctx2, x, y, t, color) {
    ctx2.fillStyle=color;
    ctx2.fillRect(x+2,y+10,16,8);
    ctx2.fillRect(x+3,y+2,13,10);
    ctx2.fillRect(x+3,y-3,5,7); ctx2.fillRect(x+12,y-3,5,7);
    ctx2.fillStyle='#ffaaaa'; ctx2.fillRect(x+4,y-2,3,5); ctx2.fillRect(x+13,y-2,3,5);
    ctx2.fillStyle='#cc0000'; ctx2.fillRect(x+5,y+4,5,4); ctx2.fillRect(x+12,y+4,5,4);
    ctx2.fillStyle='#ff4444'; ctx2.fillRect(x+6,y+5,3,2); ctx2.fillRect(x+13,y+5,3,2);
    ctx2.fillStyle='#fff'; ctx2.fillRect(x+8,y+10,3,4); ctx2.fillRect(x+13,y+10,3,4);
    ctx2.fillStyle=_darken(color,0.7); ctx2.fillRect(x+13,y+7,6,5);
    ctx2.fillStyle='#000'; ctx2.fillRect(x+14,y+7,3,2);
    const leg=Math.sin(t*0.12)*2;
    ctx2.fillStyle=color;
    ctx2.fillRect(x+2,y+17+leg,6,7); ctx2.fillRect(x+12,y+17-leg,6,7);
    const ta=Math.sin(t*0.06)*5;
    ctx2.fillRect(x+18+Math.floor(ta*0.3),y+8,4,5);
    ctx2.fillRect(x+20+Math.floor(ta),y+3,3,7);
  }

  function _drawPixelTurtle(ctx2, x, y, t, color) {
    ctx2.fillStyle='#3a5a20'; ctx2.fillRect(x+3,y+6,16,12);
    ctx2.fillStyle='#4a7228'; ctx2.fillRect(x+5,y+4,12,6);
    ctx2.fillStyle='#5a8a30';
    ctx2.fillRect(x+5,y+6,5,5); ctx2.fillRect(x+12,y+6,5,5); ctx2.fillRect(x+8,y+10,6,5);
    ctx2.fillStyle='#3a5a20';
    ctx2.fillRect(x+5,y+6,1,6); ctx2.fillRect(x+12,y+6,1,6); ctx2.fillRect(x+8,y+10,1,5);
    const hb=Math.sin(t*0.07)*2;
    ctx2.fillStyle=color; ctx2.fillRect(x+16,y+5+hb,8,7);
    ctx2.fillStyle='#000'; ctx2.fillRect(x+18,y+6+hb,3,3);
    ctx2.fillStyle='#88ff88'; ctx2.fillRect(x+19,y+7+hb,2,2);
    ctx2.fillStyle='#886622'; ctx2.fillRect(x+22,y+9+hb,4,3);
    ctx2.fillStyle=color;
    const leg=Math.sin(t*0.06)*1;
    ctx2.fillRect(x+3,y+17+leg,5,6); ctx2.fillRect(x+14,y+17-leg,5,6);
    ctx2.fillRect(x,y+12,5,4);
    ctx2.fillRect(x+3,y+8,3,4);
  }

  function _drawPixelButterfly(ctx2, x, y, t, color) {
    const fl=Math.abs(Math.sin(t*0.2));
    const ww=Math.floor(8+fl*6);
    ctx2.globalAlpha=0.85; ctx2.fillStyle=color;
    ctx2.fillRect(x+9-ww,y+4,ww,9); ctx2.fillRect(x+9,y+4,ww,9);
    ctx2.fillRect(x+9-ww+3,y+12,ww-3,6); ctx2.fillRect(x+9,y+12,ww-3,6);
    ctx2.globalAlpha=0.4; ctx2.fillStyle='#fff';
    ctx2.fillRect(x+9-ww+2,y+5,ww-5,4); ctx2.fillRect(x+11,y+5,ww-5,4);
    ctx2.globalAlpha=1;
    ctx2.fillStyle='#333'; ctx2.fillRect(x+8,y+2,2,18);
    ctx2.fillRect(x+7,y+2,4,5);
    ctx2.fillStyle='#555'; ctx2.fillRect(x+7,y-1,2,4); ctx2.fillRect(x+9,y-1,2,4);
    ctx2.fillStyle=color; ctx2.fillRect(x+6,y-2,3,2); ctx2.fillRect(x+9,y-2,3,2);
  }

  function _drawPixelCrab(ctx2, x, y, t, color) {
    ctx2.fillStyle=color;
    ctx2.fillRect(x+4,y+8,14,9);
    ctx2.fillStyle=_darken(color,0.75); ctx2.fillRect(x+5,y+5,12,6);
    const ew=Math.sin(t*0.1)*2;
    ctx2.fillStyle=color; ctx2.fillRect(x+6,y+2+ew,2,5); ctx2.fillRect(x+14,y+2-ew,2,5);
    ctx2.fillStyle='#fff'; ctx2.fillRect(x+5,y+1+ew,4,4); ctx2.fillRect(x+13,y+1-ew,4,4);
    ctx2.fillStyle='#000'; ctx2.fillRect(x+6,y+2+ew,2,2); ctx2.fillRect(x+14,y+2-ew,2,2);
    const clSnap=Math.sin(t*0.1)*2;
    ctx2.fillStyle=color;
    ctx2.fillRect(x-2,y+7+clSnap,7,5); ctx2.fillRect(x-2,y+11+clSnap,5,3);
    ctx2.fillRect(x+17,y+7-clSnap,7,5); ctx2.fillRect(x+18,y+11-clSnap,5,3);
    const leg=Math.sin(t*0.15)*2;
    ctx2.fillRect(x+4,y+16+leg,4,6); ctx2.fillRect(x+9,y+16-leg,4,6);
    ctx2.fillRect(x+14,y+16+leg,4,6);
  }

  // ── Particles ─────────────────────────────────────────
  function spawnParticles(x, y, color, count=8, speed=3) {
    for (let i = 0; i < count; i++) {
      const ang = (i/count)*Math.PI*2+Math.random()*0.5;
      const spd = speed*(0.5+Math.random()*0.8);
      particles.push({x,y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd-1,color,life:45+Math.random()*20,maxLife:65,size:3+Math.random()*3});
    }
  }
  function updateParticles() {
    for (let i=particles.length-1;i>=0;i--) {
      const p=particles[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.life--;
      if(p.life<=0) particles.splice(i,1);
    }
  }
  function drawParticles(camX,camY) {
    for(const p of particles){
      ctx.globalAlpha=p.life/p.maxLife;
      ctx.fillStyle=p.color;
      ctx.fillRect(Math.floor(p.x-camX),Math.floor(p.y-camY),p.size,p.size);
    }
    ctx.globalAlpha=1;
  }

  // ── Flash ─────────────────────────────────────────────
  let flashTimer=0, flashColor='#fff';
  function triggerFlash(color){ flashTimer=18; flashColor=color; }
  function drawFlash(){
    if(flashTimer<=0)return;
    ctx.globalAlpha=flashTimer/18*0.55;
    ctx.fillStyle=flashColor; ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=1; flashTimer--;
  }

  // ── Main draw ─────────────────────────────────────────
  function drawWorld(state, camX, camY, theme) {
    const { level, player, echoes } = state;
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0,0,W,H);
    drawBackground(camX, theme);

    // Lava first (behind platforms) — emits light upward
    for (const lv of (level.lava||[])) drawLava(lv, camX, camY);

    for (const p of level.platforms) drawPlatform(p, camX, camY, theme);

    for (const s of level.spikes)   drawSpike(s, camX, camY);
    for (const l of level.lasers)   drawLaser(l, camX, camY);

    for (const pp of level.pressurePlates) drawPressurePlate(pp, camX, camY);
    for (const sw of level.switches)       drawSwitch(sw, camX, camY);
    for (const d  of level.doors)          drawDoor(d, camX, camY);

    for (const c  of level.coins)  drawCollectible(c, camX, camY);
    for (const sh of level.shards) drawCollectible(sh, camX, camY);

    drawFlag(level.flagObj, camX, camY);

    for (const e of echoes) if(!e.actor.dead) drawEcho(e, camX, camY);

    for (const en of level.enemies) {
      if (en.dead) continue;
      if      (en instanceof TEP.EchoWisp)       drawEchoWisp(en, camX, camY);
      else if (en instanceof TEP.ChronoSentinel)  drawChronoSentinel(en, camX, camY);
      else if (en instanceof TEP.ParadoxBeast)    drawParadoxBeast(en, camX, camY);
      else if (en instanceof TEP.TemporalSlime)   drawTemporalSlime(en, camX, camY);
      else if (en instanceof TEP.VoidShade)       drawVoidShade(en, camX, camY);
    }

    const outfitId = TEP.Auth.getOutfit?.() || 'default';
    const outfit = C.OUTFITS?.find(o=>o.id===outfitId);
    drawActorTrail(player, camX, camY, outfit?.color||'#00d4ff');
    drawActor(player, camX, camY, player.dead?0.3:1);

    const petId = TEP.Auth.getPet?.();
    if (petId && petId !== 'none') drawPet(petId, player.x, player.y, camX, camY);

    drawParticles(camX, camY);
    drawFlash();
  }

  return {
    init,
    drawWorld,
    drawEchonaut,
    spawnParticles,
    updateParticles,
    triggerFlash,
    // Expose pixel-art pet drawers for use in shop UI
    drawPetPixelArt: { 
      chrono_cat: _drawPixelCat,
      paradox_pup: _drawPixelDog,
      wisp_bird: _drawPixelBird,
      copper_golem: _drawPixelGolem,
      phantom_fox: _drawPixelFox,
      star_jellyfish: _drawPixelJelly,
      time_ferret: _drawPixelFerret,
      echo_sprite: _drawPixelSprite,
      shadow_wolf: _drawPixelWolf,
      time_turtle: _drawPixelTurtle,
      neon_butterfly: _drawPixelButterfly,
      chrono_crab: _drawPixelCrab,
    },
    pxRect(x,y,w,h,fill){ctx.fillStyle=fill;ctx.fillRect(px(x),py(y),w,h);}
  };
})();
