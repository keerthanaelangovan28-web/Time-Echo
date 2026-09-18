/* =====================================================
   TIME ECHO PLATFORMER v3 — game.js
   Core game loop, camera, echo recording/playback,
   collision, state machine. ALL BUGS FIXED.
   ===================================================== */
window.TEP = window.TEP || {};

TEP.Game = (() => {
  const C = TEP.CONFIG;
  const R = TEP.Renderer;

  let canvas, ctx, W, H;

  // ── State ──────────────────────────────────────────
  let state = 'menu'; // menu|play|paused|complete|dead|endless
  let level = null;
  let levelNum = 1;
  let player = null;
  let echoes = [];
  let recording = false;
  let recFrames = [];
  let recTimer = 0;
  let recCorrupt = false;
  let recStartX = 0;
  let recStartY = 0;
  let levelTimer = 0;
  let coinsCollected = 0;
  let shardsCollected = 0;
  let prevKeys = {};
  let keys = {};
  let camX = 0, camY = 0;
  let completionData = null;
  let deathTimer = 0;
  let hintTimer = 0;
  let deathMessage = '';
  let shakeIntensity = 0;
  let deathCause = 'generic'; // spike|lava|enemy|fall|laser|generic
  let deathHandled = false;   // BUG FIX: prevent persistent death state

  // Night glow
  let nightGlowRadius = 0;
  let targetNightGlow = 0;

  // Endless
  let endlessScore = 0;
  let endlessActive = false;
  let endlessSeed = 0;
  let endlessLevelQueue = []; // queue of upcoming seeds
  let endlessDistance = 0;

  // Input
  function isDown(k) { return !!keys[k]; }
  function pressed(k) { return !!keys[k] && !prevKeys[k]; }

  // ── Camera ─────────────────────────────────────────
  function updateCamera() {
    const targetX = player.x - W / 3;
    const targetY = player.y - H / 2;
    camX += (targetX - camX) * 0.10;
    camY += (targetY - camY) * 0.10;
    camX = Math.max(0, Math.min(level.worldW - W, camX));
    camY = Math.max(0, Math.min(level.worldH - H, camY));
  }

  // ── Level loading ──────────────────────────────────
  function loadLevel(num, generated = false, seed = null) {
    levelNum = num;
    let def;
    if (generated || num > TEP.LEVELS.length) {
      def = TEP.generateLevel(num, seed || (num * 0x9e3779b1));
    } else {
      def = TEP.LEVELS[Math.max(0, num - 1)];
    }
    if (!def) {
      // Safety: if beyond available levels in endless, generate
      def = TEP.generateLevel(num, seed || (num * 0x9e3779b1));
    }

    // Deep-copy level definition
    function copyObj(src) {
      return Object.assign(Object.create(Object.getPrototypeOf(src)), src);
    }
    level = {
      ...def,
      platforms:      def.platforms.map(copyObj),
      switches:       def.switches.map(copyObj),
      doors:          def.doors.map(copyObj),
      enemies:        def.enemies.map(e => {
        const copy = copyObj(e);
        if (copy.history) copy.history = [];
        if (copy.antiEcho) copy.antiEcho = null;
        if (copy.splits) copy.splits = [];
        return copy;
      }),
      spikes:         def.spikes.map(copyObj),
      lasers:         def.lasers.map(copyObj),
      coins:          def.coins.map(copyObj),
      shards:         def.shards.map(copyObj),
      pressurePlates: def.pressurePlates.map(copyObj),
      lava:           (def.lava || []).map(copyObj),
      flagObj:        new TEP.Flag(def.goalPos[0], def.goalPos[1]),
    };

    resetLevelState();

    // Update BGM to match level theme
    TEP.Sound?.setTheme?.(level.theme || 'cave');
    if (!TEP.Sound?.isEnabled?.()) return;
    TEP.Sound?.startBGM?.(level.theme || 'cave');
  }

  function resetLevelState() {
    const outfitId = TEP.Auth.getOutfit?.() || 'default';
    const outfit = C.OUTFITS?.find(o => o.id === outfitId);
    player = new TEP.Actor(level.start[0], level.start[1], { color: outfit?.color || '#00d4ff' });
    echoes = [];
    recording = false;
    recFrames = [];
    recTimer = 0;
    recCorrupt = false;
    recStartX = 0;
    recStartY = 0;
    levelTimer = 0;
    coinsCollected = 0;
    shardsCollected = 0;
    deathHandled = false; // BUG FIX: reset death flag on every restart
    deathTimer = 0;
    deathMessage = '';
    deathCause = 'generic';
    shakeIntensity = 0;
    camX = Math.max(0, level.start[0] - W / 3);
    camY = Math.max(0, level.start[1] - H / 2);
    hintTimer = 240;

    level.coins.forEach(c => c.collected = false);
    level.shards.forEach(s => s.collected = false);
    level.switches.forEach(s => { s.active = false; s._t = 0; });
    level.doors.forEach(d => { d.open = false; d._openAnim = 0; });
    level.pressurePlates.forEach(pp => { pp.active = false; pp.count = 0; });
    level.enemies.forEach(e => {
      e.dead = false;
      if ('history' in e) e.history = [];
      if ('antiEcho' in e) e.antiEcho = null;
      if ('splits' in e) e.splits = [];
      if ('rewinding' in e) e.rewinding = false;
      if ('copyTimer' in e) e.copyTimer = 0;
    });
    level.lasers?.forEach(l => { l.active = true; l._t = 0; });

    // Apply pet: turtle shield
    const pet = TEP.Auth.getPet?.();
    if (pet === 'time_turtle') player.shielded = true;
  }

  // ── Recording ──────────────────────────────────────
  function getRecordMax() {
    const pet = TEP.Auth.getPet?.();
    const petDef = C.PETS?.find(p => p.id === pet);
    let bonus = 0;
    if (petDef?.perk === 'recordTime') bonus = petDef.value;
    // Echo sprite: extra echo slot
    if (petDef?.perk === 'extraEcho' && echoes.length >= C.MAX_ECHOES) {
      return C.MAX_RECORD_FRAMES + bonus + 60; // slightly longer
    }
    return C.MAX_RECORD_FRAMES + bonus;
  }

  function startRecording() {
    if (echoes.length >= C.MAX_ECHOES) {
      // Check echo sprite pet
      const pet = TEP.Auth.getPet?.();
      if (pet !== 'echo_sprite') {
        echoes.shift(); // drop oldest
      }
    }
    recording = true;
    recFrames = [];
    recTimer = 0;
    recCorrupt = false;
    recStartX = player.x;   // BUG FIX: capture start position HERE
    recStartY = player.y;
    TEP.Sound?.sfx?.recording?.();
    TEP.Sound?.sfx?.swoosh?.();
  }

  function stopRecording() {
    recording = false;
    TEP.Sound?.sfx?.recordingStop?.();
    if (recFrames.length > 5) {
      spawnEcho();
    }
    recFrames = [];
  }

  function spawnEcho() {
    const colorIdx = echoes.length % C.ECHO_COLORS.length;
    const color = C.ECHO_COLORS[colorIdx];
    const outfitId = TEP.Auth.getOutfit?.() || 'default';
    const outfit = C.OUTFITS?.find(o => o.id === outfitId);
    const echoColor = outfit ? `hsl(${outfit.echoHue},80%,65%)` : color;

    echoes.push({
      actor: new TEP.Actor(recStartX, recStartY, { color: echoColor }),
      frames: recFrames.slice(),
      frameIndex: 0,
      color: echoColor,
      startX: recStartX,
      startY: recStartY,
    });
    R.spawnParticles(recStartX + 11, recStartY + 19, echoColor, 14, 4);
    TEP.Sound?.sfx?.echoSpawn?.();

    if (echoes.length >= 1) TEP.Auth.unlockAchievement?.('first_echo');
    if (echoes.length >= 3) TEP.Auth.unlockAchievement?.('squad');
  }

  function corruptRecording() {
    recCorrupt = true;
    const junk = Math.min(40, recFrames.length);
    for (let i = 0; i < junk; i++) {
      const idx = recFrames.length - junk + i;
      if (Math.random() < 0.5) {
        recFrames[idx] = { left: Math.random() < 0.5, right: Math.random() < 0.5, jump: Math.random() < 0.4 };
      }
    }
    setTimeout(() => { if (recording) stopRecording(); }, 500);
  }

  function inputSnap() {
    return {
      left:  isDown('arrowleft')  || isDown('a'),
      right: isDown('arrowright') || isDown('d'),
      jump:  isDown('arrowup')    || isDown('w') || isDown(' '),
    };
  }

  // ── Switches / Doors / Plates ──────────────────────
  function updateInteractables() {
    const actors = [player, ...echoes.map(e => e.actor).filter(a => !a.dead)];
    const pet = TEP.Auth.getPet?.();

    // Chrono crab holds plates
    const hasCrab = pet === 'chrono_crab';

    level.switches.forEach(s => { s.active = false; s.update?.(); });
    level.pressurePlates.forEach(pp => { pp.count = 0; pp.active = false; });

    for (const a of actors) {
      for (const sw of level.switches) {
        if (TEP.rectsOverlap(a, sw)) {
          if (!sw.active) TEP.Sound?.sfx?.switchActivate?.();
          sw.active = true;
        }
      }
      for (const pp of level.pressurePlates) {
        if (TEP.rectsOverlap(a, pp)) pp.count++;
      }
    }

    // Wisp bird: occasionally activates nearby switch
    if (pet === 'wisp_bird') {
      for (const sw of level.switches) {
        const dist = Math.hypot(player.x - sw.x, player.y - sw.y);
        if (dist < 70 && Math.floor(levelTimer / 30) % 2 === 0) sw.active = true;
      }
    }

    // Copper golem: activates ONE switch per level (within proximity)
    if (pet === 'copper_golem' && !level._golemUsed) {
      for (const sw of level.switches) {
        const dist = Math.hypot(player.x - sw.x, player.y - sw.y);
        if (dist < 50) { sw.active = true; level._golemUsed = true; break; }
      }
    }

    // Crab holds pressure plates
    if (hasCrab) {
      level.pressurePlates.forEach(pp => {
        const dist = Math.hypot(player.x - pp.x, player.y - pp.y);
        if (dist < 60) pp.count++;
      });
    }

    level.pressurePlates.forEach(pp => { if (pp.count >= pp.required) pp.active = true; });
    level.doors.forEach(d => {
      const sw = level.switches.find(s => s.id === d.id);
      const pp = level.pressurePlates.find(p => p.id === d.id);
      d.update((sw?.active || pp?.active) || false);
    });
  }

  // ── Collectibles ───────────────────────────────────
  function updateCollectibles() {
    const pet = TEP.Auth.getPet?.();
    const hasMagnet = pet === 'chrono_cat';
    let allCollected = true;

    for (const c of level.coins) {
      if (c.collected) continue;
      allCollected = false;
      c.update();
      if (hasMagnet) {
        const dist = Math.hypot(player.x - c.x, player.y - c.y);
        if (dist < 90) { c.x += (player.x - c.x) * 0.06; c.y += (player.y - c.y) * 0.06; }
      }
      if (TEP.rectsOverlap(player, c)) {
        c.collected = true; coinsCollected++;
        R.spawnParticles(c.x + 7, c.y + 7, '#ffd700', 6, 3);
        TEP.Sound?.sfx?.coinCollect?.();
      }
    }
    for (const s of level.shards) {
      if (s.collected) continue;
      s.update();
      if (TEP.rectsOverlap(player, s)) {
        s.collected = true; shardsCollected++;
        R.spawnParticles(s.x + 7, s.y + 7, '#a78bfa', 8, 3);
        TEP.Sound?.sfx?.shardCollect?.();
      }
    }
    // Achievement: collected all coins in level
    if (allCollected && level.coins.length > 0) TEP.Auth.unlockAchievement?.('all_coins');
  }

  // ── Enemy update ───────────────────────────────────
  function updateEnemies() {
    for (const en of level.enemies) {
      if (en.dead) continue;

      if (en instanceof TEP.EchoWisp) {
        en.update(player.x, player.y);
        for (const echo of echoes) {
          if (echo.actor.dead) continue;
          if (TEP.rectsOverlap(en, echo.actor)) {
            en.triggerCorrupt();
            echo.actor.dead = true;
            R.spawnParticles(en.x + 10, en.y + 10, '#cc44ff', 10, 3);
          }
        }
        en.touchPlayer(player, { recording, corruptRecording });

      } else if (en instanceof TEP.ChronoSentinel) {
        en.update(level.platforms, level.worldW, level.worldH, player.x, player.y);
        for (const echo of echoes) {
          if (echo.actor.dead) continue;
          if (TEP.rectsOverlap(en, echo.actor)) {
            en.hitByEcho();
            echo.actor.dead = true;
            R.spawnParticles(en.x + 14, en.y + 22, '#ff8833', 10, 4);
          }
        }
        en.touchPlayer(player);

      } else if (en instanceof TEP.ParadoxBeast) {
        en.update(level.platforms, echoes, level.worldW, level.worldH);
        en.checkAntiEchoSpikes(level.spikes);
        en.touchPlayer(player);

      } else if (en instanceof TEP.TemporalSlime) {
        en.update(level.platforms, level.worldW, level.worldH);
        for (const echo of echoes) {
          if (echo.actor.dead) continue;
          if (TEP.rectsOverlap(en, echo.actor)) {
            en.hitByEcho();
            echo.actor.dead = true;
            R.spawnParticles(en.x + 10, en.y + 8, '#88ff44', 8, 3);
          }
        }
        en.touchPlayer(player);
        // Also check splits
        for (const sp of en.splits) {
          for (const echo of echoes) {
            if (echo.actor.dead) continue;
            if (TEP.rectsOverlap(sp, echo.actor)) {
              sp.hitByEcho?.();
              echo.actor.dead = true;
            }
          }
        }

      } else if (en instanceof TEP.VoidShade) {
        en.update(level.platforms, level.worldW, level.worldH, player.x, player.y, recording);
        en.touchPlayer(player);
      }

      // Check if any enemy killed player → set death cause
      if (player.dead && deathCause === 'generic') deathCause = 'enemy';
    }
  }

  // ── Hazards ────────────────────────────────────────
  function updateHazards() {
    for (const sp of level.spikes) {
      const prevDead = player.dead;
      sp.check(player);
      if (!prevDead && player.dead) deathCause = 'spike';
      for (const e of echoes) if (!e.actor.dead) sp.check(e.actor);
    }
    for (const l of (level.lasers || [])) {
      l.update();
      const prevDead = player.dead;
      l.check(player);
      if (!prevDead && player.dead) deathCause = 'laser';
    }
    for (const lv of (level.lava || [])) {
      lv.update();
      const prevDead = player.dead;
      lv.check(player);
      if (!prevDead && player.dead) deathCause = 'lava';
      for (const e of echoes) if (!e.actor.dead) lv.check(e.actor);
    }
    // Fall into void
    if (!player.dead && player.y > level.worldH + 50) {
      player.dead = true;
      deathCause = 'fall';
    }
  }

  // ── Door blocking ──────────────────────────────────
  function checkDoorBlock() {
    for (const d of level.doors) {
      if (d.open) continue;
      if (TEP.rectsOverlap(player, d)) {
        if (player.x + player.w / 2 < d.x + d.w / 2) player.x = d.x - player.w;
        else player.x = d.x + d.w;
        player.vx = 0;
      }
    }
  }

  // ── Puppy hint ─────────────────────────────────────
  let pupHintTimer = 0, pupHintText = '';
  function updatePupHint() {
    if (TEP.Auth.getPet?.() !== 'paradox_pup') return;
    pupHintTimer = Math.max(0, pupHintTimer - 1);
    for (const sw of level.switches) {
      const dist = Math.hypot(player.x - sw.x, player.y - sw.y);
      if (dist < 200 && !sw.active) {
        pupHintTimer = 90;
        pupHintText = '🐶 Lever nearby!';
      }
    }
  }

  // ── Night glow ─────────────────────────────────────
  function updateNightGlow() {
    const isNight = level.isNight || C.THEMES[level.theme]?.isNight;
    targetNightGlow = isNight ? 120 : 0;
    nightGlowRadius += (targetNightGlow - nightGlowRadius) * 0.05;
  }

  // ── Goal check ─────────────────────────────────────
  function checkGoal() {
    level.flagObj.update();
    if (!TEP.rectsOverlap(player, level.flagObj)) return;

    const timeSec = Math.floor(levelTimer / 60);
    const pet = TEP.Auth.getPet?.();
    const petDef = C.PETS?.find(p => p.id === pet);
    const scoreBoost = petDef?.perk === 'scoreBoost' ? petDef.value : 1;
    const score = Math.floor(
      (Math.max(0, 10000 - timeSec * 50 - echoes.length * 80) + coinsCollected * 25 + shardsCollected * 80) * scoreBoost
    );
    completionData = { score, timeSec, echoes: echoes.length, coins: coinsCollected };
    state = 'complete';
    R.triggerFlash('#2ecc71');
    R.spawnParticles(player.x + 11, player.y + 19, '#2ecc71', 24, 5);
    TEP.Sound?.sfx?.levelComplete?.();
    TEP.Sound?.stopBGM?.();

    TEP.Auth.submitScore?.(levelNum, score, timeSec, echoes.length);
    TEP.Auth.addCoins?.(coinsCollected + shardsCollected * 5);
    TEP.Auth.advanceLevel?.(levelNum + 1);
    if (timeSec < 20) TEP.Auth.unlockAchievement?.('speedrun');
    if (levelNum >= 5)  TEP.Auth.unlockAchievement?.('level5');
    if (levelNum >= 10) TEP.Auth.unlockAchievement?.('level10');
    if (levelNum >= 20) TEP.Auth.unlockAchievement?.('level20');
    const themesPlayed = JSON.parse(localStorage.getItem('tep_themes_played') || '[]');
    if (!themesPlayed.includes(level.theme)) {
      themesPlayed.push(level.theme);
      localStorage.setItem('tep_themes_played', JSON.stringify(themesPlayed));
      if (themesPlayed.length >= 5) TEP.Auth.unlockAchievement?.('all_themes');
    }
  }

  // ── Death trigger ──────────────────────────────────
  function triggerDeath() {
    if (deathHandled) return;
    deathHandled = true;
    deathTimer = 90;
    shakeIntensity = 16;
    // Pick death message by cause
    const msgs = C.DEATH_MESSAGES;
    const pool = msgs[deathCause] || msgs.generic;
    deathMessage = pool[Math.floor(Math.random() * pool.length)];
    R.triggerFlash('#e74c3c');
    R.spawnParticles(player.x + 11, player.y + 19, '#ff4444', 20, 5);
    TEP.Sound?.sfx?.death?.();
    state = 'dead';
  }

  // ── Main play update ───────────────────────────────
  function updatePlay() {
    levelTimer++;
    hintTimer = Math.max(0, hintTimer - 1);

    if (pressed('e')) {
      if (!recording) startRecording();
      else            stopRecording();
    }
    if (pressed('r')) { deathHandled = false; deathCause = 'generic'; resetLevelState(); state = 'play'; return; }
    if (pressed('escape')) { state = 'paused'; return; }

    if (recording) {
      const maxF = getRecordMax();
      recFrames.push(inputSnap());
      recTimer++;
      if (recTimer >= maxF) stopRecording();
    }

    // Player float fall perk
    const pet = TEP.Auth.getPet?.();
    const petDef = C.PETS?.find(p => p.id === pet);

    player.applyInput(inputSnap());
    if (petDef?.perk === 'floatFall') player.applyFloatFall?.(true);
    level.platforms.forEach(p => p.update());
    player.physics(level.platforms, level.worldW, level.worldH);

    if (player.dead && !deathHandled) { deathCause = deathCause || 'generic'; triggerDeath(); return; }

    // Echoes
    for (let i = echoes.length - 1; i >= 0; i--) {
      const e = echoes[i];
      if (e.actor.dead) { echoes.splice(i, 1); TEP.Sound?.sfx?.echoEnd?.(); continue; }
      const inp = e.frames[e.frameIndex] || { left:false, right:false, jump:false };
      e.actor.applyInput(inp);
      e.actor.physics(level.platforms, level.worldW, level.worldH);
      if (e.frameIndex >= e.frames.length) e.frameIndex = 0; // LOOP echo
      else e.frameIndex++;
    }

    updateEnemies();
    updateHazards();
    checkDoorBlock();
    updateInteractables();
    updateCollectibles();
    updatePupHint();
    updateNightGlow();
    checkGoal();
    updateCamera();
    R.updateParticles();

    if (player.dead && !deathHandled) { triggerDeath(); }
  }

  // ── Endless update ─────────────────────────────────
  function updateEndless() {
    updatePlay();
    endlessScore = Math.floor(levelTimer / 60) * 10 + coinsCollected * 5 + shardsCollected * 15;
    endlessDistance = Math.floor(levelTimer / 60);

    // Auto-advance endless level every 60 seconds
    if (levelTimer > 0 && levelTimer % 3600 === 0 && state === 'endless') {
      const nextSeed = endlessSeed + levelTimer;
      loadLevel(levelNum + 1, true, nextSeed);
      state = 'endless';
    }
  }

  // ── HUD ────────────────────────────────────────────
  function drawHUD() {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Coin display
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(8, 8, 150, 28);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 10px "Press Start 2P",monospace';
    ctx.fillText(`🪙 ${coinsCollected}`, 14, 27);

    // Echo pips
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(8, 40, 170, 28);
    ctx.fillStyle = '#7efff5';
    ctx.font = '9px "Press Start 2P",monospace';
    ctx.fillText(`ECHOES`, 14, 57);
    for (let i = 0; i < C.MAX_ECHOES; i++) {
      const filled = i < echoes.length;
      const px2 = 100 + i * 22;
      ctx.fillStyle = filled ? (C.ECHO_COLORS[i] || '#7efff5') : 'rgba(255,255,255,0.15)';
      ctx.fillRect(px2, 44, 16, 16);
      if (filled) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(px2+2, 44, 4, 3);
      }
    }
    // REC indicator if recording
    if (recording) {
      const flash = Math.floor(Date.now() / 400) % 2 === 0;
      if (flash) {
        ctx.fillStyle = recCorrupt ? '#ff00ff' : '#ff2222';
        ctx.beginPath(); ctx.arc(W/2 - 110, 20, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '8px "Press Start 2P",monospace';
        ctx.fillText(recCorrupt ? 'CORRUPT' : 'REC', W/2 - 98, 24);
      }
    }

    // Timer
    const timeSec = Math.floor(levelTimer / 60);
    const mm = String(Math.floor(timeSec / 60)).padStart(2,'0');
    const ss = String(timeSec % 60).padStart(2,'0');
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(W - 130, 8, 122, 28);
    ctx.fillStyle = '#cfe8ff';
    ctx.font = '10px "Press Start 2P",monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${mm}:${ss}`, W - 10, 27);
    ctx.textAlign = 'left';

    // Level name bar
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    const nameW = 260;
    ctx.fillRect(W/2 - nameW/2, 8, nameW, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px "Press Start 2P",monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`LVL ${levelNum}: ${(level.name||'').toUpperCase().slice(0,22)}`, W/2, 27);
    ctx.textAlign = 'left';

    // Hint text (clean fade)
    if (hintTimer > 0 && level.hint) {
      const alpha = Math.min(1, hintTimer / 80);
      ctx.globalAlpha = alpha;
      const hw = Math.min(W - 40, 520);
      ctx.fillStyle = 'rgba(0,0,10,0.75)';
      ctx.fillRect(W/2 - hw/2, H - 56, hw, 34);
      ctx.strokeStyle = 'rgba(0,212,255,0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(W/2 - hw/2, H - 56, hw, 34);
      ctx.fillStyle = '#ffd166';
      ctx.font = '8px "Press Start 2P",monospace';
      ctx.textAlign = 'center';
      // Word-wrap hint
      const words = level.hint.split(' ');
      let line = '', lines = [];
      words.forEach(w => {
        const test = line + (line ? ' ' : '') + w;
        if (ctx.measureText(test).width > hw - 20) { if (line) lines.push(line); line = w; }
        else line = test;
      });
      if (line) lines.push(line);
      const lineH = 14;
      const startY = H - 56 + (34 - lines.length * lineH) / 2 + 10;
      lines.forEach((l, i) => ctx.fillText(l, W/2, startY + i * lineH));
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }

    // Pup hint
    if (pupHintTimer > 0) {
      ctx.globalAlpha = Math.min(1, pupHintTimer / 30);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(W/2 - 110, H - 96, 220, 28);
      ctx.fillStyle = '#a78bfa';
      ctx.font = '8px "Press Start 2P",monospace';
      ctx.textAlign = 'center';
      ctx.fillText(pupHintText, W/2, H - 77);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }

    // Endless score
    if (endlessActive) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(8, 72, 180, 28);
      ctx.fillStyle = '#ff7ef4';
      ctx.font = '10px "Press Start 2P",monospace';
      ctx.fillText(`SCORE ${endlessScore}`, 14, 90);
    }

    ctx.restore();
  }

  // ── Night glow overlay ─────────────────────────────
  function drawNightGlow() {
    if (nightGlowRadius < 5) return;
    const sx = player.x - camX + 11;
    const sy = player.y - camY + 19;

    // Darken screen
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(0,0,30,0.88)';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Player glow
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, nightGlowRadius);
    const col = C.OUTFITS?.find(o => o.id === (TEP.Auth.getOutfit?.() || 'default'))?.glow || '#00d4ff';
    g.addColorStop(0, col + 'ff');
    g.addColorStop(0.4, col + '44');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(sx, sy, nightGlowRadius, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Pet glow too
    const pet = TEP.Auth.getPet?.();
    if (pet === 'star_jellyfish') {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const pg = ctx.createRadialGradient(sx + 32, sy - 10, 0, sx + 32, sy - 10, 45);
      pg.addColorStop(0, '#cc88ffaa');
      pg.addColorStop(1, 'transparent');
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.arc(sx + 32, sy - 10, 45, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  // ── Dead screen ────────────────────────────────────
  function drawDeadScreen() {
    ctx.fillStyle = 'rgba(15,0,0,0.86)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    // Big YOU DIED
    ctx.fillStyle = '#cc0000';
    ctx.font = 'bold 30px "Press Start 2P",monospace';
    ctx.fillText('YOU DIED', W/2, H/2 - 70);

    // Cause chip
    const causeLabels = { spike:'💀 IMPALED', lava:'🌋 INCINERATED', enemy:'👾 ELIMINATED',
      fall:'🕳 FELL INTO VOID', laser:'⚡ VAPORIZED', generic:'💥 PARADOXED' };
    ctx.fillStyle = '#ff4444';
    ctx.font = '9px "Press Start 2P",monospace';
    ctx.fillText(causeLabels[deathCause] || '💥 PARADOXED', W/2, H/2 - 38);

    // Death message (word wrap)
    ctx.fillStyle = '#ff8888';
    ctx.font = '8px "Press Start 2P",monospace';
    const words = deathMessage.split(' ');
    let line = '', lines = [];
    const maxW = W - 80;
    words.forEach(w => {
      const test = line + (line ? ' ' : '') + w;
      if (ctx.measureText(test).width > maxW) { if (line) lines.push(line); line = w; }
      else line = test;
    });
    if (line) lines.push(line);
    lines.forEach((l, i) => ctx.fillText(l, W/2, H/2 - 10 + i * 18));

    // Controls hint
    ctx.fillStyle = '#888';
    ctx.font = '9px "Press Start 2P",monospace';
    ctx.fillText('[R] RESTART', W/2, H/2 + 55);
    ctx.fillText('[ESC] MENU', W/2, H/2 + 75);
    ctx.textAlign = 'left';
  }

  // ── Pause screen ───────────────────────────────────
  function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0,5,20,0.82)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7efff5';
    ctx.font = 'bold 22px "Press Start 2P",monospace';
    ctx.fillText('PAUSED', W/2, H/2 - 40);
    ctx.fillStyle = '#cfe8ff';
    ctx.font = '9px "Press Start 2P",monospace';
    ctx.fillText('[ESC] RESUME', W/2, H/2 + 5);
    ctx.fillText('[R] RESTART', W/2, H/2 + 30);
    ctx.textAlign = 'left';
  }

  // ── Complete screen ────────────────────────────────
  function drawCompleteScreen() {
    const d = completionData;
    // Emotional particle burst
    R.spawnParticles(player.x + 11, player.y + 19, '#ffd700', 3, 2);

    ctx.fillStyle = 'rgba(0,20,10,0.92)';
    ctx.fillRect(W/2 - 240, H/2 - 130, 480, 260);
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2;
    ctx.strokeRect(W/2 - 240, H/2 - 130, 480, 260);
    // Glow
    ctx.shadowColor = '#2ecc71';
    ctx.shadowBlur = 20;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 18px "Press Start 2P",monospace';
    ctx.fillText('LEVEL CLEAR!', W/2, H/2 - 88);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 15px "Press Start 2P",monospace';
    ctx.fillText(`SCORE: ${d.score}`, W/2, H/2 - 55);
    ctx.fillStyle = '#cfe8ff';
    ctx.font = '9px "Press Start 2P",monospace';
    ctx.fillText(`TIME: ${d.timeSec}s`, W/2 - 100, H/2 - 20);
    ctx.fillText(`ECHOES: ${d.echoes}`, W/2, H/2 - 20);
    ctx.fillText(`COINS: ${d.coins}`, W/2 + 100, H/2 - 20);

    // Emotional message
    const emotionalMsgs = [
      "Your echo carried you here. Don't forget it.",
      "Time bent for you. Just this once.",
      "The past version of you is proud.",
      "Another paradox solved. Another timeline saved.",
      "You and your echoes — unstoppable.",
    ];
    const emsg = emotionalMsgs[levelNum % emotionalMsgs.length];
    ctx.fillStyle = 'rgba(200,230,255,0.6)';
    ctx.font = '7px "Press Start 2P",monospace';
    ctx.fillText(emsg, W/2, H/2 + 20);

    ctx.fillStyle = '#7efff5';
    ctx.font = '9px "Press Start 2P",monospace';
    ctx.fillText('[ENTER] NEXT LEVEL', W/2, H/2 + 60);
    ctx.fillText('[R] REPLAY   [ESC] MENU', W/2, H/2 + 82);
    ctx.textAlign = 'left';
  }

  // ── Main loop ──────────────────────────────────────
  let lastTime = 0;
  function loop(now) {
    lastTime = now;

    // Only run game logic if level is loaded
    if (!level && state !== 'menu') { prevKeys = {...keys}; requestAnimationFrame(loop); return; }

    switch (state) {
      case 'play':
        updatePlay();
        R.drawWorld({ level, player, echoes, nightGlowRadius }, camX, camY, C.THEMES[level.theme] || C.THEMES.cave);
        drawNightGlow();
        drawHUD();
        break;

      case 'dead': {
        deathTimer = Math.max(0, deathTimer - 1);
        if (shakeIntensity > 0) shakeIntensity *= 0.90;
        const sx = (Math.random() - 0.5) * shakeIntensity;
        const sy2 = (Math.random() - 0.5) * shakeIntensity;
        R.drawWorld({ level, player, echoes, nightGlowRadius }, camX + sx, camY + sy2, C.THEMES[level.theme] || C.THEMES.cave);
        drawNightGlow();
        drawDeadScreen();
        // BUG FIX: Allow restart ANY time after brief delay (deathTimer <= 60)
        if (deathTimer <= 60) {
          if (pressed('r')) {
            // FIX 1: Force-clear stuck key state so mobile buttons work more than once
            keys['r'] = false;
            prevKeys['r'] = false;
            // Full state reset — fixes the "always dead after first death" bug
            deathHandled = false;
            deathCause = 'generic';
            shakeIntensity = 0;
            resetLevelState();
            state = 'play';
            TEP.Sound?.startBGM?.(level.theme || 'cave');
          } else if (pressed('escape')) {
            keys['escape'] = false;
            prevKeys['escape'] = false;
            deathHandled = false;
            deathCause = 'generic';
            state = 'menu';
            TEP.UI?.showMenu?.();
            TEP.Sound?.stopBGM?.();
          }
        }
        break;
      }

      case 'paused':
        if (pressed('escape')) {
          keys['escape'] = false;
          prevKeys['escape'] = false;
          state = 'play';
        }
        if (pressed('r')) {
          keys['r'] = false;
          prevKeys['r'] = false;
          deathHandled = false;
          deathCause = 'generic';
          resetLevelState();
          state = 'play';
        }
        if (pressed('m')) {
          keys['m'] = false;
          prevKeys['m'] = false;
          deathHandled = false;
          deathCause = 'generic';
          state = 'menu';
          TEP.UI?.showMenu?.();
          TEP.Sound?.stopBGM?.();
        }
        R.drawWorld({ level, player, echoes, nightGlowRadius }, camX, camY, C.THEMES[level.theme] || C.THEMES.cave);
        drawNightGlow();
        drawPauseScreen();
        break;

      case 'complete':
        R.spawnParticles(W/2 + (Math.random()-0.5)*200, H/3, '#ffd700', 1, 2);
        if (pressed('enter') || pressed('return')) {
          keys['enter'] = false;
          keys['return'] = false;
          prevKeys['enter'] = false;
          prevKeys['return'] = false;
          const nextNum = levelNum + 1;
          if (endlessActive) {
            loadLevel(nextNum, true, endlessSeed + nextNum * 0x1337);
            state = 'endless';
          } else {
            loadLevel(nextNum);
            state = 'play';
          }
          TEP.Sound?.startBGM?.(level.theme);
        }
        if (pressed('r')) {
          keys['r'] = false;
          prevKeys['r'] = false;
          deathHandled = false;
          resetLevelState();
          state = 'play';
          TEP.Sound?.startBGM?.(level.theme);
        }
        if (pressed('escape')) {
          keys['escape'] = false;
          prevKeys['escape'] = false;
          state = 'menu';
          TEP.UI?.showMenu?.();
        }
        R.drawWorld({ level, player, echoes, nightGlowRadius }, camX, camY, C.THEMES[level.theme] || C.THEMES.cave);
        drawNightGlow();
        drawCompleteScreen();
        R.updateParticles();
        break;

      case 'endless':
        updateEndless();
        R.drawWorld({ level, player, echoes, nightGlowRadius }, camX, camY, C.THEMES[level.theme] || C.THEMES.cave);
        drawNightGlow();
        drawHUD();
        // Death handled inside updatePlay → triggerDeath → state = 'dead'
        break;
    }

    prevKeys = {...keys};
    requestAnimationFrame(loop);
  }
  // ── Public API ─────────────────────────────────────
  return {
    init(c) {
      canvas = c;
      ctx = c.getContext('2d');
      W = c.width;
      H = c.height;
      R.init(c);

      window.addEventListener('keydown', e => {
        const k = e.key.toLowerCase();
        keys[k] = true;
        if ([' ','arrowup','arrowleft','arrowright'].includes(k)) e.preventDefault();
      });
      window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

      requestAnimationFrame(loop);
    },

    startLevel(num) {
      endlessActive = false;
      deathHandled = false;
      deathCause = 'generic';
      loadLevel(num);
      state = 'play';
    },

    startEndless(seed) {
      endlessActive = true;
      endlessScore = 0;
      endlessDistance = 0;
      endlessSeed = seed || TEP.getDailySeed();
      deathHandled = false;
      deathCause = 'generic';
      // Generate first endless level
      loadLevel(21, true, endlessSeed);
      state = 'endless';
    },

    getState()    { return state; },
    goMenu()      { state = 'menu'; TEP.Sound?.stopBGM?.(); },
    keys,
    get recording() { return recording; },
  };
})();
