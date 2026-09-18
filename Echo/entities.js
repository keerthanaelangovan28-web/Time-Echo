/* =====================================================
   TIME ECHO PLATFORMER v3 — entities.js
   The Echonaut (player), Echo clones, all enemies with
   personality, platforms, hazards, collectibles
   ===================================================== */
window.TEP = window.TEP || {};

const C = TEP.CONFIG;

// ── Utility ───────────────────────────────────────────
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}
TEP.rectsOverlap = rectsOverlap;

// ── Platform ──────────────────────────────────────────
class Platform {
  constructor(x, y, w, h, opts = {}) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.oneWay   = opts.oneWay   || false;
    this.moving   = opts.moving   || false;
    this.axis     = opts.axis     || 'x';
    this.range    = opts.range    || 80;
    this.speed    = opts.speed    || 1.2;
    this.originX  = x;
    this.originY  = y;
    this._t       = opts.phaseOffset || 0;
    this.vx = 0; this.vy = 0;
    this.crumble  = opts.crumble  || false;
    this.crumbleTimer = 0;
    this.crumbled = false;
    this.resetTimer = 0;
    this.icy      = opts.icy || false;
  }
  update() {
    if (this.crumbled) {
      this.resetTimer++;
      if (this.resetTimer > 200) { this.crumbled = false; this.crumbleTimer = 0; this.resetTimer = 0; }
      return;
    }
    if (this.crumbleTimer > 0) {
      this.crumbleTimer++;
      if (this.crumbleTimer > 55) { this.crumbled = true; return; }
    }
    if (!this.moving) { this.vx = 0; this.vy = 0; return; }
    const prev = this.axis === 'x' ? this.x : this.y;
    this._t += this.speed * 0.022;
    if (this.axis === 'x') {
      this.x = this.originX + Math.sin(this._t) * this.range;
      this.vx = this.x - prev; this.vy = 0;
    } else {
      this.y = this.originY + Math.sin(this._t) * this.range;
      this.vy = this.y - prev; this.vx = 0;
    }
  }
  triggerCrumble() {
    if (!this.crumble || this.crumbleTimer > 0) return;
    this.crumbleTimer = 1;
    TEP.Sound?.sfx.land?.();
  }
}

// ── Actor (Player "The Echonaut" + Echoes) ────────────
class Actor {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y;
    this.w = 22; this.h = 38;
    this.vx = 0; this.vy = 0;
    this.onGround    = false;
    this.facingRight = true;
    this.dead        = false;
    this.color       = opts.color || '#00d4ff';
    this.isGhost     = opts.isGhost || false;
    this.trail       = [];
    this.ridingPlatform = null;
    this.jumpHeld    = false;
    this.wasOnGround = false;
    this.walkFrame   = 0;
    this.walkTimer   = 0;
    // Scarf animation
    this.scarfPoints = [];
    for (let i = 0; i < 8; i++) this.scarfPoints.push({ x: 0, y: 0 });
    this.stepSoundTimer = 0;
    // Shield from turtle pet
    this.shielded = false;
  }

  applyInput(inp) {
    const icy = this.ridingPlatform?.icy;
    const groundFriction = icy ? 0.92 : C.FRICTION;
    const accel  = this.onGround ? (icy ? 0.4 : 0.75) : 0.38;
    const maxSpd = 5.8;

    if (inp.left) {
      this.vx = Math.max(this.vx - accel, -maxSpd);
      this.facingRight = false;
    }
    if (inp.right) {
      this.vx = Math.min(this.vx + accel, maxSpd);
      this.facingRight = true;
    }
    if (!inp.left && !inp.right) {
      this.vx *= (this.onGround ? groundFriction : 0.92);
    }
    if (inp.jump && this.onGround && !this.jumpHeld) {
      this.vy = -13;
      this.onGround = false;
      this.jumpHeld = true;
      TEP.Sound?.sfx.jump?.();
    }
    if (!inp.jump) this.jumpHeld = false;

    // Walk sound
    if (this.onGround && (inp.left || inp.right) && !this.isGhost) {
      this.stepSoundTimer++;
      if (this.stepSoundTimer % 18 === 0) TEP.Sound?.sfx.walk?.();
    }
    // Walk animation
    this.walkTimer++;
    if (this.onGround && (inp.left || inp.right)) {
      if (this.walkTimer % 12 === 0) this.walkFrame = (this.walkFrame + 1) % 4;
    }
  }

  applyFloatFall(hasPerk) {
    if (hasPerk && this.vy > 0) this.vy *= 0.985;
  }

  physics(platforms, worldW, worldH) {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > C.TRAIL_LEN) this.trail.shift();

    // Scarf physics (spring chain)
    const anchorX = this.x + (this.facingRight ? -2 : this.w + 2);
    const anchorY = this.y + 10;
    for (let i = 0; i < this.scarfPoints.length; i++) {
      const p = this.scarfPoints[i];
      const tx = i === 0 ? anchorX : this.scarfPoints[i-1].x;
      const ty = i === 0 ? anchorY : this.scarfPoints[i-1].y;
      const dx = tx - p.x; const dy = ty - p.y;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;
      const targetDist = 5;
      const pullX = (dx / dist) * (dist - targetDist) * 0.3;
      const pullY = (dy / dist) * (dist - targetDist) * 0.3 + 0.2;
      p.x += (p.x + pullX - p.x) * 0.5 + this.vx * 0.1 * (1 - i/8);
      p.y += (p.y + pullY - p.y) * 0.5 + this.vy * 0.05;
    }

    this.wasOnGround = this.onGround;
    this.vy += C.GRAVITY;
    if (this.ridingPlatform) {
      this.x += this.ridingPlatform.vx;
      this.y += this.ridingPlatform.vy;
    }
    this.ridingPlatform = null;
    this.x += this.vx;
    this.y += this.vy;

    // World bounds
    if (this.x < 0) { this.x = 0; this.vx = 0; }
    if (this.x + this.w > worldW) { this.x = worldW - this.w; this.vx = 0; }
    if (this.y > worldH + 300) this.dead = true;

    this.onGround = false;
    for (const p of platforms) {
      if (p.crumbled) continue;
      if (!rectsOverlap(this, p)) continue;
      const prevBottom = this.y - this.vy + this.h;
      const prevTop    = this.y - this.vy;
      if (p.oneWay) {
        if (prevBottom <= p.y + 3 && this.vy >= 0) {
          this.y = p.y - this.h; this.vy = 0; this.onGround = true;
          this.ridingPlatform = p; p.triggerCrumble?.();
        }
      } else {
        const overlapX = Math.min(this.x + this.w, p.x + p.w) - Math.max(this.x, p.x);
        const overlapY = Math.min(this.y + this.h, p.y + p.h) - Math.max(this.y, p.y);
        if (overlapX < overlapY) {
          if (this.x + this.w/2 < p.x + p.w/2) { this.x = p.x - this.w; this.vx = 0; }
          else { this.x = p.x + p.w; this.vx = 0; }
        } else {
          if (prevBottom <= p.y + 5 && this.vy >= 0) {
            this.y = p.y - this.h; this.vy = 0; this.onGround = true;
            this.ridingPlatform = p; p.triggerCrumble?.();
            // Landing sound
            if (!this.wasOnGround && Math.abs(this.vy) > 2 && !this.isGhost) TEP.Sound?.sfx.land?.();
          } else if (prevTop >= p.y + p.h - 5 && this.vy < 0) {
            this.y = p.y + p.h; this.vy = 0;
          }
        }
      }
    }
  }
}

// ── EchoWisp — "The Corrupted Jester" ─────────────────
// Personality: Mischievous, laughs at you when it corrupts.
// Floats in figure-8 paths. Has a name shown on hit.
class EchoWisp {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y;
    this.w = 22; this.h = 22;
    this.originX = x; this.originY = y;
    this.range   = opts.range  || 90;
    this.speed   = opts.speed  || 1.0;
    this._t      = opts.phase  || Math.random() * Math.PI * 2;
    this.dead    = false;
    this.corrupt = false;
    this.corruptTimer = 0;
    this.pulse = 0;
    this.glowRadius = 0;
    this.personality = opts.personality || 'jester';
    // Jester has random moments of "taunting" — pausing near you
    this.tauntTimer = 0;
    this.aggro = false; // becomes aggressive at 60% health
    this.soundTimer = 0;
    this.name = opts.name || ['Glitch', 'Fizzle', 'Static', 'Corruptor', 'Buzz'][Math.floor(Math.random()*5)];
  }
  update(playerX, playerY) {
    this._t += 0.025 * this.speed;
    // Figure-8 Lissajous
    this.x = this.originX + Math.sin(this._t) * this.range;
    this.y = this.originY + Math.sin(this._t * 2) * (this.range * 0.5);
    this.pulse = (Math.sin(this._t * 4) + 1) * 0.5;
    this.glowRadius = 16 + this.pulse * 14;
    if (this.corruptTimer > 0) {
      this.corruptTimer--;
      this.corrupt = this.corruptTimer > 0;
    }
    // Taunt: briefly hover near player
    const dist = Math.hypot(this.x - playerX, this.y - playerY);
    if (dist < 100 && !this.tauntTimer && Math.random() < 0.005) {
      this.tauntTimer = 60;
    }
    if (this.tauntTimer > 0) {
      this.tauntTimer--;
      // Drift toward player slightly
      const dx = playerX - this.x; const dy = playerY - this.y;
      this.originX += dx * 0.003;
      this.originY += dy * 0.003;
    }
    // Periodic ambient sound
    this.soundTimer++;
    if (this.soundTimer > 180 + Math.random() * 120) {
      this.soundTimer = 0;
      TEP.Sound?.sfx.wispHum?.();
    }
  }
  triggerCorrupt() {
    this.corruptTimer = 50;
    this.corrupt = true;
    TEP.Sound?.sfx.corruption?.();
  }
  touchPlayer(player, game) {
    if (!rectsOverlap(this, player)) return;
    if (game && game.recording) {
      game.corruptRecording();
      this.triggerCorrupt();
    } else {
      if (player.shielded) { player.shielded = false; return; }
      player.dead = true;
    }
  }
}

// ── ChronoSentinel — "The Relentless Guardian" ────────
// Personality: stoic, methodical, never gives up
// When hit by echo, rewinds; after 3 rewinds becomes enraged
class ChronoSentinel {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y;
    this.w = 28; this.h = 44;
    this.leftBound  = opts.leftBound  || x - 100;
    this.rightBound = opts.rightBound || x + 100;
    this.speed  = opts.speed || 1.4;
    this.dir    = 1;
    this.dead   = false;
    this.vx = this.dir * this.speed;
    this.vy = 0;
    this.onGround = false;
    this.history = [];
    this.rewinding = false;
    this.rewindFlash = 0;
    this.rewindCount = 0;   // after 3 rewinds: enraged
    this.enraged = false;
    this._t = 0;
    this.soundTimer = 0;
    this.alertFlash = 0;    // flashes when seeing player
    this.name = opts.name || ['Sentinel-7', 'GUARDIAN', 'Mk.IV', 'OMEGA'][Math.floor(Math.random()*4)];
  }
  update(platforms, worldW, worldH, playerX, playerY) {
    this._t++;
    if (this.rewinding) {
      this.rewindFlash = Math.max(0, this.rewindFlash - 1);
      if (this.history.length > 0) {
        const snap = this.history.pop();
        this.x = snap.x; this.y = snap.y; this.dir = snap.dir;
        this.vx = snap.vx; this.vy = snap.vy;
      } else {
        this.rewinding = false;
        // After rewind: enrage if 3+ rewinds
        if (this.rewindCount >= 3) {
          this.enraged = true;
          TEP.Sound?.sfx.beastRoar?.();
        }
      }
      return;
    }

    this.history.push({ x:this.x, y:this.y, dir:this.dir, vx:this.vx, vy:this.vy });
    if (this.history.length > 180) this.history.shift();

    const spd = this.enraged ? this.speed * 1.8 : this.speed;
    this.vy += C.GRAVITY;
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < this.leftBound)            { this.dir = 1;  this.vx =  spd; }
    if (this.x + this.w > this.rightBound)  { this.dir = -1; this.vx = -spd; }

    this.onGround = false;
    for (const p of platforms) {
      if (p.crumbled) continue;
      if (!rectsOverlap(this, p)) continue;
      const prevBottom = this.y - this.vy + this.h;
      if (prevBottom <= p.y + 5 && this.vy >= 0) {
        this.y = p.y - this.h; this.vy = 0; this.onGround = true;
      } else {
        this.dir *= -1; this.vx = this.dir * spd;
        if (this.x + this.w/2 < p.x + p.w/2) this.x = p.x - this.w;
        else this.x = p.x + p.w;
      }
    }
    if (this.x < 0) { this.dir = 1; this.vx = spd; this.x = 0; }
    if (this.x + this.w > worldW) { this.dir = -1; this.vx = -spd; }

    // Alert when player nearby
    const dist = Math.hypot(this.x - playerX, this.y - playerY);
    if (dist < 120 && !this.alertFlash) {
      this.alertFlash = 30;
      TEP.Sound?.sfx.sentinelAlert?.();
    }
    if (this.alertFlash > 0) this.alertFlash--;

    // Periodic sound
    this.soundTimer++;
    if (this.soundTimer > 240) { this.soundTimer = 0; TEP.Sound?.sfx.sentinelAlert?.(); }
  }
  hitByEcho() {
    if (this.rewinding) return;
    this.rewinding = true;
    this.rewindFlash = 35;
    this.rewindCount++;
    TEP.Sound?.sfx.hit?.();
  }
  touchPlayer(player) {
    if (!rectsOverlap(this, player)) return;
    if (player.shielded) { player.shielded = false; return; }
    player.dead = true;
    TEP.Sound?.sfx.enemyAttack?.();
  }
}

// ── ParadoxBeast — "The Mirror" ───────────────────────
// Personality: Obsessed with you. Mimics, roars, taunts.
class ParadoxBeast {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y;
    this.w = 38; this.h = 52;
    this.zoneLeft  = opts.zoneLeft  || x - 80;
    this.zoneRight = opts.zoneRight || x + 80;
    this.dead  = false;
    this.vy    = 0;
    this.onGround = false;
    this.copyTimer = 0;
    this.copyInterval = opts.copyInterval || 420;
    this.antiEcho  = null;
    this.roarTimer = 0;
    this.shakePulse= 0;
    this._t = 0;
    this.copyCount = 0;
    this.name = opts.name || ['MIRROR', 'PARADOX', 'THE ECHO'][Math.floor(Math.random()*3)];
  }
  update(platforms, echoes, worldW, worldH) {
    this._t++;
    this.shakePulse = Math.max(0, this.shakePulse - 1);
    this.roarTimer  = Math.max(0, this.roarTimer  - 1);
    this.vy += C.GRAVITY * 0.35;
    this.y  += this.vy;
    // Subtle hover
    this.y += Math.sin(this._t * 0.05) * 0.4;
    this.onGround = false;
    for (const p of platforms) {
      if (!rectsOverlap(this, p)) continue;
      const prevBottom = this.y - this.vy + this.h;
      if (prevBottom <= p.y + 5 && this.vy >= 0) {
        this.y = p.y - this.h; this.vy = 0; this.onGround = true;
      }
    }
    this.copyTimer++;
    if (this.copyTimer >= this.copyInterval && echoes.length > 0) {
      this.copyTimer = 0;
      this.roarTimer = 90;
      this.copyCount++;
      this.shakePulse = 30;
      const src = echoes[echoes.length - 1];
      this.antiEcho = {
        frames: src.frames.map(f => ({ left:f.right, right:f.left, jump:f.jump })),
        startX: src.startX, startY: src.startY,
        actor: new Actor(src.startX, src.startY, { color: '#ff2244', isGhost: false }),
        frameIndex: 0, hostile: true,
      };
      TEP.Sound?.sfx.beastRoar?.();
    }
    if (this.antiEcho) {
      const ae = this.antiEcho;
      if (ae.frameIndex < ae.frames.length && !ae.actor.dead) {
        ae.actor.applyInput(ae.frames[ae.frameIndex]);
        ae.actor.physics(platforms, worldW, worldH);
        ae.frameIndex++;
      }
      if (ae.actor.dead || ae.frameIndex >= ae.frames.length + 90) this.antiEcho = null;
    }
  }
  touchPlayer(player) {
    if (rectsOverlap(this, player)) {
      if (player.shielded) { player.shielded = false; return; }
      player.dead = true; TEP.Sound?.sfx.beastRoar?.();
    }
    if (this.antiEcho && !this.antiEcho.actor.dead && rectsOverlap(this.antiEcho.actor, player)) {
      if (player.shielded) { player.shielded = false; return; }
      player.dead = true;
    }
  }
  checkAntiEchoSpikes(spikes) {
    if (!this.antiEcho) return;
    for (const s of spikes) {
      if (rectsOverlap(this.antiEcho.actor, s)) {
        this.antiEcho.actor.dead = true;
        this.dead = true;
        TEP.Sound?.sfx.death?.();
        return;
      }
    }
  }
}

// ── TemporalSlime — NEW — "The Splitter" ──────────────
// Splits into 2 smaller versions when hit by an echo
class TemporalSlime {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y;
    this.w = 32; this.h = 24;
    this.leftBound  = opts.leftBound  || x - 80;
    this.rightBound = opts.rightBound || x + 80;
    this.speed  = opts.speed || 0.8;
    this.dir    = 1;
    this.dead   = false;
    this.vy     = 0;
    this.vx     = this.speed;
    this.onGround= false;
    this._t     = 0;
    this.size   = opts.size || 1;  // 1=large, 0.5=small (after split)
    this.splits = [];  // child slimes after split
    this.hitFlash = 0;
    this.jumpTimer  = 0;
    this.name = opts.name || 'SLIME';
  }
  update(platforms, worldW, worldH) {
    this._t++;
    this.hitFlash = Math.max(0, this.hitFlash - 1);
    // Occasionally jump
    this.jumpTimer++;
    if (this.jumpTimer > 60 && this.onGround) {
      this.vy = -8 * this.size;
      this.jumpTimer = 0;
    }
    this.vy += C.GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < this.leftBound)            { this.dir = 1;  this.vx =  this.speed; }
    if (this.x + this.w > this.rightBound)  { this.dir = -1; this.vx = -this.speed; }
    this.onGround = false;
    for (const p of platforms) {
      if (p.crumbled) continue;
      if (!rectsOverlap(this, p)) continue;
      const prevBottom = this.y - this.vy + this.h;
      if (prevBottom <= p.y + 5 && this.vy >= 0) {
        this.y = p.y - this.h; this.vy = 0; this.onGround = true;
      } else {
        this.dir *= -1; this.vx = this.dir * this.speed;
        if (this.x + this.w/2 < p.x + p.w/2) this.x = p.x - this.w;
        else this.x = p.x + p.w;
      }
    }
    if (this.x < 0) { this.dir = 1; this.vx = this.speed; this.x = 0; }
    if (this.x + this.w > worldW) { this.dir = -1; this.vx = -this.speed; }
    // Update children
    for (const s of this.splits) s.update(platforms, worldW, worldH);
    this.splits = this.splits.filter(s => !s.dead);
  }
  hitByEcho() {
    if (this.size < 0.6) { this.dead = true; TEP.Sound?.sfx.hit?.(); return; }
    // Split!
    this.dead = true;
    TEP.Sound?.sfx.hit?.();
    this.splits.push(new TemporalSlime(this.x, this.y - 10, {
      leftBound: this.leftBound, rightBound: this.rightBound,
      speed: this.speed * 1.3, size: 0.5,
    }));
    this.splits.push(new TemporalSlime(this.x + 20, this.y - 10, {
      leftBound: this.leftBound, rightBound: this.rightBound,
      speed: this.speed * 1.3, size: 0.5,
    }));
  }
  touchPlayer(player) {
    if (rectsOverlap(this, player)) {
      if (player.shielded) { player.shielded = false; return; }
      player.dead = true;
    }
    for (const s of this.splits) s.touchPlayer(player);
  }
}

// ── VoidShade — NEW — "The Invisible Stalker" ─────────
// Becomes invisible when player isn't recording.
// Charges at player when invisible.
class VoidShade {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y;
    this.w = 26; this.h = 40;
    this.leftBound  = opts.leftBound  || x - 100;
    this.rightBound = opts.rightBound || x + 100;
    this.speed   = opts.speed  || 2.0;
    this.dead    = false;
    this.vy      = 0;
    this.vx      = 0;
    this.onGround= false;
    this._t      = 0;
    this.visible = true;  // becomes invisible when not recording
    this.charging= false; // charges when invisible
    this.chargeSpeed = opts.chargeSpeed || 4.0;
    this.alpha   = 1;
    this.name    = 'SHADE';
  }
  update(platforms, worldW, worldH, playerX, playerY, isRecording) {
    this._t++;
    this.visible = isRecording;  // visible ONLY when player records
    this.alpha = this.visible
      ? Math.min(1, this.alpha + 0.08)
      : Math.max(0.08, this.alpha - 0.04);

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy);

    if (!this.visible && dist < 300) {
      // Invisible: stalk slowly then charge
      this.charging = dist < 80;
      const spd = this.charging ? this.chargeSpeed : this.speed * 0.5;
      if (dist > 5) { this.vx = (dx / dist) * spd; }
    } else {
      // Visible: patrol
      if (this.x < this.leftBound)            { this.vx =  this.speed; }
      if (this.x + this.w > this.rightBound)  { this.vx = -this.speed; }
      this.vx *= 0.95;
    }

    this.vy += C.GRAVITY;
    this.x  += this.vx;
    this.y  += this.vy;
    this.onGround = false;
    for (const p of platforms) {
      if (p.crumbled) continue;
      if (!rectsOverlap(this, p)) continue;
      const pb = this.y - this.vy + this.h;
      if (pb <= p.y + 5 && this.vy >= 0) {
        this.y = p.y - this.h; this.vy = 0; this.onGround = true;
      } else {
        this.vx *= -1;
        if (this.x + this.w/2 < p.x + p.w/2) this.x = p.x - this.w;
        else this.x = p.x + p.w;
      }
    }
    if (this.x < 0) { this.x = 0; this.vx = Math.abs(this.vx); }
    if (this.x + this.w > worldW) { this.x = worldW - this.w; this.vx = -Math.abs(this.vx); }
  }
  touchPlayer(player) {
    if (this.visible) return; // can only hurt when invisible
    if (!rectsOverlap(this, player)) return;
    if (player.shielded) { player.shielded = false; return; }
    player.dead = true;
  }
}

// ── Spike ─────────────────────────────────────────────
class Spike {
  constructor(x, y, w, h = 16, dir = 'up') {
    this.x = x; this.y = y; this.w = w; this.h = h; this.dir = dir;
  }
  check(actor) {
    if (rectsOverlap(this, actor)) {
      actor.dead = true;
      TEP.Sound?.sfx.death?.();
    }
  }
}

// ── Laser ─────────────────────────────────────────────
class Laser {
  constructor(x, y, len, axis, id) {
    this.x = x; this.y = y;
    this.w = axis === 'x' ? len : 6;
    this.h = axis === 'x' ? 6   : len;
    this.axis = axis; this.id = id;
    this.active = true; this._t = 0;
  }
  update() { this._t++; }
  check(actor) {
    if (this.active && rectsOverlap(this, actor)) { actor.dead = true; TEP.Sound?.sfx.death?.(); }
  }
}

// ── Lever (replaces Switch — more visible!) ────────────
class Switch {
  constructor(x, y, id) {
    this.x = x - 8; this.y = y - 24; this.w = 24; this.h = 24;
    this.id = id; this.active = false; this._t = 0;
    this.leverAngle = -0.5;  // radians: -0.5 = off, +0.5 = on
  }
  update() {
    this._t++;
    const target = this.active ? 0.5 : -0.5;
    this.leverAngle += (target - this.leverAngle) * 0.2;
  }
}

// ── Door ──────────────────────────────────────────────
class Door {
  constructor(x, y, w, h, id, timed = 0) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.id = id; this.open = false; this.timed = timed;
    this.timedCounter = 0; this._openAnim = 0;
  }
  update(open) {
    if (open) {
      this.timedCounter = this.timed || 0;
      this._openAnim = Math.min(1, this._openAnim + 0.07);
      const wasOpen = this.open;
      this.open = true;
      if (!wasOpen) TEP.Sound?.sfx.doorOpen?.();
    } else if (this.timed > 0 && this.timedCounter > 0) {
      this.timedCounter--;
      this._openAnim = Math.min(1, this._openAnim + 0.07);
      this.open = true;
    } else {
      this._openAnim = Math.max(0, this._openAnim - 0.07);
      this.open = false;
    }
  }
}

// ── Collectible ───────────────────────────────────────
class Collectible {
  constructor(x, y, type = 'coin') {
    this.x = x; this.y = y;
    this.w = 16; this.h = 16;
    this.type = type; this.collected = false;
    this._t = Math.random() * Math.PI * 2;
    this.bobY = 0;
  }
  update() {
    this._t += 0.06;
    this.bobY = Math.sin(this._t) * 4;
  }
}

// ── Goal Portal (replaces flag — much more visible!) ───
class Flag {
  constructor(x, y) {
    this.x = x - 20; this.y = y - 40; this.w = 40; this.h = 60;
    this._t = 0;
    this.pulseRadius = 0;
  }
  update() { this._t += 0.04; this.pulseRadius = (Math.sin(this._t * 2) + 1) * 8; }
}

// ── Pressure Plate ────────────────────────────────────
class PressurePlate {
  constructor(x, y, id, required = 1) {
    this.x = x; this.y = y; this.w = 36; this.h = 10;
    this.id = id; this.required = required;
    this.count = 0; this.active = false;
  }
}

// ── Lava ──────────────────────────────────────────────
class Lava {
  constructor(x, y, w, h = 20) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.pulse = 0;
  }
  update() { this.pulse = (this.pulse + 0.04) % (Math.PI * 2); }
  check(actor) {
    if (rectsOverlap(actor, this)) {
      actor.dead = true;
      TEP.Sound?.sfx.lavaHiss?.();
    }
  }
}

// ── Exports ────────────────────────────────────────────
TEP.Platform        = Platform;
TEP.Actor           = Actor;
TEP.EchoWisp        = EchoWisp;
TEP.ChronoSentinel  = ChronoSentinel;
TEP.ParadoxBeast    = ParadoxBeast;
TEP.TemporalSlime   = TemporalSlime;
TEP.VoidShade       = VoidShade;
TEP.Spike           = Spike;
TEP.Laser           = Laser;
TEP.Switch          = Switch;
TEP.Door            = Door;
TEP.Collectible     = Collectible;
TEP.Flag            = Flag;
TEP.PressurePlate   = PressurePlate;
TEP.Lava            = Lava;