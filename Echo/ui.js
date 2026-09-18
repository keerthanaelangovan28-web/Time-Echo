/* =====================================================
   TIME ECHO PLATFORMER v3 — ui.js
   All HTML overlay panels: main menu, auth, shop,
   leaderboard, settings, achievements, toasts
   ===================================================== */
window.TEP = window.TEP || {};

TEP.UI = (() => {

  // ── Theme display data ─────────────────────────────
  const THEME_PRIMARY = {
    cave:          '#c49a20',
    neon_city:     '#6030ff',
    sunset_ruins:  '#e84800',
    crystal_sky:   '#55d4ff',
    haunted_forest:'#44cc22',
    frozen_peaks:  '#9ae4f5',
    lava_core:     '#dd3300',
    temple_gold:   '#d4aa55',
    paradox_void:  '#aa44ff',
    sky_islands:   '#aaccee',
    deep_ocean:    '#0099cc',
    desert_night:  '#ddaa44',
    blood_moon:    '#cc0040',
    time_rift:     '#00eecc',
    ember_ruins:   '#cc8833',
  };
  const THEME_EMOJIS = {
    cave:          '🪨',
    neon_city:     '🌆',
    sunset_ruins:  '🌅',
    crystal_sky:   '💎',
    haunted_forest:'🌲',
    frozen_peaks:  '❄️',
    lava_core:     '🌋',
    temple_gold:   '⛩️',
    paradox_void:  '🌀',
    sky_islands:   '☁️',
    deep_ocean:    '🌊',
    desert_night:  '🏜️',
    blood_moon:    '🩸',
    time_rift:     '⚡',
    ember_ruins:   '🔥',
  };
  const THEME_BG = {
    cave:          '#1a0a2e',
    neon_city:     '#060d22',
    sunset_ruins:  '#1a0533',
    crystal_sky:   '#030c1a',
    haunted_forest:'#050d05',
    frozen_peaks:  '#030d1a',
    lava_core:     '#0a0000',
    temple_gold:   '#0a0a05',
    paradox_void:  '#050010',
    sky_islands:   '#1a4aaa',
    deep_ocean:    '#000814',
    desert_night:  '#05030a',
    blood_moon:    '#0a0005',
    time_rift:     '#000a0a',
    ember_ruins:   '#100500',
  };

  // ── Pet pixel art renderer for shop ───────────────
  // Renders a static preview frame of each pet onto a canvas
  function renderPetToCanvas(canvas, petId, color) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scale up — canvas is 64x64, pets are drawn at ~22x22 native
    const scale = 2.5;
    ctx.save();
    ctx.scale(scale, scale);
    const x = 4, y = 4, t = 30; // static frame t=30 for a mid-animation pose

    function darken(hex, f) {
      if (!hex || hex[0] !== '#' || hex.length < 7) return hex;
      const r = Math.floor(parseInt(hex.slice(1,3),16)*f);
      const g = Math.floor(parseInt(hex.slice(3,5),16)*f);
      const b = Math.floor(parseInt(hex.slice(5,7),16)*f);
      return `rgb(${r},${g},${b})`;
    }

    switch(petId) {
      case 'chrono_cat': {
        ctx.fillStyle = color; ctx.fillRect(x+2,y+8,14,9); ctx.fillRect(x+3,y+1,12,9);
        ctx.fillRect(x+3,y-2,4,5); ctx.fillRect(x+11,y-2,4,5);
        ctx.fillStyle='#ffaaaa'; ctx.fillRect(x+4,y-1,2,3); ctx.fillRect(x+12,y-1,2,3);
        ctx.fillStyle='#000'; ctx.fillRect(x+5,y+3,3,3); ctx.fillRect(x+10,y+3,3,3);
        ctx.fillStyle='#40e0d0'; ctx.fillRect(x+6,y+4,2,2); ctx.fillRect(x+11,y+4,2,2);
        ctx.fillStyle='#ff99bb'; ctx.fillRect(x+8,y+6,2,2);
        ctx.fillStyle=color; ctx.fillRect(x+3,y+16,4,5); ctx.fillRect(x+11,y+16,4,5);
        ctx.fillRect(x+16,y+10,3,3); ctx.fillRect(x+17,y+7,2,4);
        break;
      }
      case 'paradox_pup': {
        ctx.fillStyle=color; ctx.fillRect(x+1,y+9,16,8); ctx.fillRect(x+2,y+2,12,9);
        ctx.fillStyle=darken(color,0.65); ctx.fillRect(x+1,y+4,4,7); ctx.fillRect(x+13,y+4,4,7);
        ctx.fillStyle='#000'; ctx.fillRect(x+4,y+4,4,4); ctx.fillRect(x+11,y+4,4,4);
        ctx.fillStyle='#fff'; ctx.fillRect(x+5,y+5,2,2); ctx.fillRect(x+12,y+5,2,2);
        ctx.fillStyle='#222'; ctx.fillRect(x+6,y+9,6,4);
        ctx.fillStyle=color; ctx.fillRect(x+2,y+16,5,5); ctx.fillRect(x+11,y+16,5,5);
        ctx.fillRect(x+17,y+9,3,3); ctx.fillRect(x+18,y+6,2,4);
        break;
      }
      case 'wisp_bird': {
        ctx.fillStyle='#111'; ctx.fillRect(x+5,y+9,10,8); ctx.fillRect(x+4,y+4,12,7);
        ctx.fillStyle='#ffaa00'; ctx.fillRect(x+14,y+6,5,3);
        ctx.fillStyle='#fff'; ctx.fillRect(x+5,y+5,6,5);
        ctx.fillStyle='#000'; ctx.fillRect(x+7,y+6,3,3);
        ctx.fillStyle=color; ctx.fillRect(x,y+6,6,8); ctx.fillRect(x+14,y+6,6,8);
        ctx.fillStyle='#333'; ctx.fillRect(x+5,y+16,5,5); ctx.fillRect(x+10,y+16,5,5);
        ctx.fillStyle='#ffaa00'; ctx.fillRect(x+6,y+20,3,3); ctx.fillRect(x+11,y+20,3,3);
        break;
      }
      case 'copper_golem': {
        ctx.fillStyle='#8B6633'; ctx.fillRect(x+2,y+8,16,12);
        ctx.fillStyle='#a07840'; ctx.fillRect(x+4,y+9,12,10);
        ctx.fillStyle='#6b5020'; ctx.fillRect(x+3,y+1,14,9);
        ctx.fillStyle=color; ctx.fillRect(x+5,y+3,10,4);
        ctx.fillStyle='#fff'; ctx.fillRect(x+6,y+4,3,2); ctx.fillRect(x+11,y+4,3,2);
        ctx.fillStyle='#8B6633'; ctx.fillRect(x-2,y+8,5,8); ctx.fillRect(x+17,y+8,5,8);
        ctx.fillStyle='#5a4010'; ctx.fillRect(x-3,y+14,6,5); ctx.fillRect(x+17,y+14,6,5);
        ctx.fillRect(x+4,y+19,5,5); ctx.fillRect(x+11,y+19,5,5);
        break;
      }
      case 'phantom_fox': {
        ctx.fillStyle=color; ctx.fillRect(x+2,y+9,16,8); ctx.fillRect(x+3,y+2,13,9);
        ctx.fillRect(x+3,y-2,5,6); ctx.fillRect(x+12,y-2,5,6);
        ctx.fillStyle='#ffccaa'; ctx.fillRect(x+4,y-1,3,4); ctx.fillRect(x+13,y-1,3,4);
        ctx.fillStyle='#ffccaa'; ctx.fillRect(x+12,y+7,7,5); ctx.fillRect(x+9,y+8,5,4);
        ctx.fillStyle='#000'; ctx.fillRect(x+5,y+4,4,4); ctx.fillRect(x+12,y+4,4,4);
        ctx.fillStyle='#ff7733'; ctx.fillRect(x+6,y+5,2,2); ctx.fillRect(x+13,y+5,2,2);
        ctx.fillStyle=color; ctx.fillRect(x+2,y+16,5,5); ctx.fillRect(x+13,y+16,5,5);
        ctx.fillRect(x+18,y+8,4,5); ctx.fillRect(x+20,y+4,3,5);
        ctx.fillStyle='#fff'; ctx.fillRect(x+20,y+3,3,4);
        break;
      }
      case 'star_jellyfish': {
        ctx.globalAlpha=0.85; ctx.fillStyle=color;
        ctx.fillRect(x+2,y+2,14,10); ctx.fillRect(x,y+10,18,6);
        ctx.globalAlpha=0.4; ctx.fillStyle='#fff'; ctx.fillRect(x+3,y+3,6,4);
        ctx.globalAlpha=1;
        ctx.fillStyle='#fff'; ctx.fillRect(x+5,y+8,3,3); ctx.fillRect(x+10,y+8,3,3);
        ctx.fillStyle='#000'; ctx.fillRect(x+6,y+9,2,2); ctx.fillRect(x+11,y+9,2,2);
        ctx.fillStyle=color;
        for(let i=0;i<4;i++) ctx.fillRect(x+3+i*4,y+16,2,5);
        break;
      }
      case 'time_ferret': {
        ctx.fillStyle=color; ctx.fillRect(x,y+9,20,7); ctx.fillRect(x+14,y+4,8,8);
        ctx.fillStyle='#eeeecc'; ctx.fillRect(x+3,y+10,14,5);
        ctx.fillStyle='#000'; ctx.fillRect(x+16,y+6,3,3);
        ctx.fillStyle='#f00'; ctx.fillRect(x+17,y+7,1,1);
        ctx.fillStyle='#222'; ctx.fillRect(x+20,y+8,2,2);
        ctx.fillStyle=color; ctx.fillRect(x+1,y+15,4,5); ctx.fillRect(x+7,y+15,4,5); ctx.fillRect(x+13,y+15,4,5);
        break;
      }
      case 'echo_sprite': {
        ctx.globalAlpha=0.3; ctx.fillStyle=color; ctx.fillRect(x-2,y-2,22,22);
        ctx.globalAlpha=1; ctx.fillStyle=color;
        ctx.fillRect(x+5,y+4,8,8); ctx.fillRect(x+2,y+7,14,2);
        ctx.fillStyle='#fff'; ctx.fillRect(x+6,y+5,2,2); ctx.fillRect(x+10,y+5,2,2);
        ctx.fillStyle='#000'; ctx.fillRect(x+7,y+6,1,1); ctx.fillRect(x+11,y+6,1,1);
        // orbiting sparkles (static positions)
        const sparks = [[x+18,y+8],[x+9,y-1],[x,y+8],[x+9,y+17]];
        ctx.fillStyle='#fff'; sparks.forEach(([sx,sy])=>ctx.fillRect(sx,sy,2,2));
        ctx.globalAlpha=0.55; ctx.fillStyle=color;
        ctx.fillRect(x-5,y+5,6,4); ctx.fillRect(x+17,y+5,6,4);
        ctx.globalAlpha=1;
        break;
      }
      case 'shadow_wolf': {
        ctx.fillStyle=color; ctx.fillRect(x+2,y+10,16,8); ctx.fillRect(x+3,y+2,13,10);
        ctx.fillRect(x+3,y-3,5,7); ctx.fillRect(x+12,y-3,5,7);
        ctx.fillStyle='#ffaaaa'; ctx.fillRect(x+4,y-2,3,5); ctx.fillRect(x+13,y-2,3,5);
        ctx.fillStyle='#cc0000'; ctx.fillRect(x+5,y+4,5,4); ctx.fillRect(x+12,y+4,5,4);
        ctx.fillStyle='#ff4444'; ctx.fillRect(x+6,y+5,3,2); ctx.fillRect(x+13,y+5,3,2);
        ctx.fillStyle='#fff'; ctx.fillRect(x+8,y+10,3,4); ctx.fillRect(x+13,y+10,3,4);
        ctx.fillStyle=darken(color,0.7); ctx.fillRect(x+13,y+7,6,5);
        ctx.fillStyle='#000'; ctx.fillRect(x+14,y+7,3,2);
        ctx.fillStyle=color; ctx.fillRect(x+2,y+17,6,7); ctx.fillRect(x+12,y+17,6,7);
        ctx.fillRect(x+18,y+8,4,5); ctx.fillRect(x+20,y+3,3,7);
        break;
      }
      case 'time_turtle': {
        ctx.fillStyle='#3a5a20'; ctx.fillRect(x+3,y+6,16,12);
        ctx.fillStyle='#4a7228'; ctx.fillRect(x+5,y+4,12,6);
        ctx.fillStyle='#5a8a30'; ctx.fillRect(x+5,y+6,5,5); ctx.fillRect(x+12,y+6,5,5); ctx.fillRect(x+8,y+10,6,5);
        ctx.fillStyle='#3a5a20'; ctx.fillRect(x+5,y+6,1,6); ctx.fillRect(x+12,y+6,1,6);
        ctx.fillStyle=color; ctx.fillRect(x+16,y+5,8,7);
        ctx.fillStyle='#000'; ctx.fillRect(x+18,y+6,3,3);
        ctx.fillStyle='#88ff88'; ctx.fillRect(x+19,y+7,2,2);
        ctx.fillStyle='#886622'; ctx.fillRect(x+22,y+9,4,3);
        ctx.fillStyle=color; ctx.fillRect(x+3,y+17,5,6); ctx.fillRect(x+14,y+17,5,6);
        ctx.fillRect(x,y+12,5,4);
        break;
      }
      case 'neon_butterfly': {
        const ww = 11;
        ctx.globalAlpha=0.85; ctx.fillStyle=color;
        ctx.fillRect(x+9-ww,y+4,ww,9); ctx.fillRect(x+9,y+4,ww,9);
        ctx.fillRect(x+9-ww+3,y+12,ww-3,6); ctx.fillRect(x+9,y+12,ww-3,6);
        ctx.globalAlpha=0.4; ctx.fillStyle='#fff';
        ctx.fillRect(x+9-ww+2,y+5,ww-5,4); ctx.fillRect(x+11,y+5,ww-5,4);
        ctx.globalAlpha=1;
        ctx.fillStyle='#333'; ctx.fillRect(x+8,y+2,2,18); ctx.fillRect(x+7,y+2,4,5);
        ctx.fillStyle='#555'; ctx.fillRect(x+7,y-1,2,4); ctx.fillRect(x+9,y-1,2,4);
        ctx.fillStyle=color; ctx.fillRect(x+6,y-2,3,2); ctx.fillRect(x+9,y-2,3,2);
        break;
      }
      case 'chrono_crab': {
        ctx.fillStyle=color; ctx.fillRect(x+4,y+8,14,9);
        ctx.fillStyle=darken(color,0.75); ctx.fillRect(x+5,y+5,12,6);
        ctx.fillStyle=color; ctx.fillRect(x+6,y+2,2,5); ctx.fillRect(x+14,y+2,2,5);
        ctx.fillStyle='#fff'; ctx.fillRect(x+5,y+1,4,4); ctx.fillRect(x+13,y+1,4,4);
        ctx.fillStyle='#000'; ctx.fillRect(x+6,y+2,2,2); ctx.fillRect(x+14,y+2,2,2);
        ctx.fillStyle=color;
        ctx.fillRect(x-2,y+7,7,5); ctx.fillRect(x-2,y+11,5,3);
        ctx.fillRect(x+17,y+7,7,5); ctx.fillRect(x+18,y+11,5,3);
        ctx.fillRect(x+4,y+16,4,6); ctx.fillRect(x+9,y+16,4,6); ctx.fillRect(x+14,y+16,4,6);
        break;
      }
      default: {
        // Fallback coloured square
        ctx.fillStyle = color;
        ctx.fillRect(x+2, y+2, 18, 18);
      }
    }
    ctx.restore();
  }

  // Creates a canvas element with the pet pixel art drawn on it
  function makePetCanvas(petId, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    canvas.style.cssText = 'width:64px;height:64px;image-rendering:pixelated;image-rendering:crisp-edges;display:block;margin:0 auto 4px;';
    // Animate pet canvas with bobbing
    let frame = 0;
    let animHandle = null;
    function animate() {
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, 64, 64);
      const scale = 2.5;
      ctx.save();
      ctx.scale(scale, scale);
      const bob = Math.sin(frame * 0.08) * 1.2;
      frame++;
      renderPetToCanvasAt(ctx, petId, color, 4, 4 + bob);
      ctx.restore();
      animHandle = requestAnimationFrame(animate);
    }
    animate();
    canvas._stopAnim = () => { if (animHandle) cancelAnimationFrame(animHandle); };
    return canvas;
  }

  // Internal: render pet at specific position (with t for animations)
  function renderPetToCanvasAt(ctx, petId, color, x, y) {
    function darken(hex, f) {
      if (!hex || hex[0] !== '#' || hex.length < 7) return hex;
      const r = Math.floor(parseInt(hex.slice(1,3),16)*f);
      const g = Math.floor(parseInt(hex.slice(3,5),16)*f);
      const b = Math.floor(parseInt(hex.slice(5,7),16)*f);
      return `rgb(${r},${g},${b})`;
    }
    // Use TEP.Renderer's exposed drawPetPixelArt if available (preferred, same code)
    const drawers = TEP.Renderer?.drawPetPixelArt;
    if (drawers && drawers[petId]) {
      drawers[petId](ctx, x, y, frame || 30, color);
      return;
    }
    // Fallback inline draw
    renderPetToCanvas({ getContext: () => ctx, width: 64, height: 64 }, petId, color);
  }

  // ── Toast system ──────────────────────────────────
  let toastQ = [];
  let toastActive = false;

  function showToast(msg, color = '#7efff5', duration = 2800) {
    toastQ.push({ msg, color, duration });
    if (!toastActive) processToast();
  }

  function processToast() {
    if (!toastQ.length) { toastActive = false; return; }
    toastActive = true;
    const { msg, color, duration } = toastQ.shift();
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.background = color;
    t.style.color = '#000';
    t.style.opacity = '1';
    t.style.transform = 'translateY(0)';
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(-16px)';
      setTimeout(processToast, 500);
    }, duration);
  }

  // ── Panel helpers ──────────────────────────────────
  function showPanel(id) {
    document.querySelectorAll('.tep-panel').forEach(p => p.classList.add('hidden'));
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
    // Stop all pet canvas animations when closing shop
    document.querySelectorAll('canvas[data-pet-canvas]').forEach(c => c._stopAnim?.());
  }

  function hideAll() {
    document.querySelectorAll('.tep-panel').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('canvas[data-pet-canvas]').forEach(c => c._stopAnim?.());
  }

  function _scrollToLevels() {
    const el = document.getElementById('level-select-title') || document.getElementById('level-grid');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Auth panel ─────────────────────────────────────
  function showAuth(tab = 'login') {
    showPanel('auth-panel');
    switchAuthTab(tab);
  }

  function switchAuthTab(tab) {
    document.getElementById('auth-login-tab').classList.toggle('active', tab === 'login');
    document.getElementById('auth-reg-tab').classList.toggle('active',   tab === 'register');
    document.getElementById('auth-login-form').classList.toggle('hidden', tab !== 'login');
    document.getElementById('auth-reg-form').classList.toggle('hidden',   tab !== 'register');
    document.getElementById('auth-err').textContent = '';
  }

  async function handleLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('login-identifier').value.trim();
    const pass  = document.getElementById('login-pass').value;
    const btn   = document.getElementById('login-btn');
    btn.disabled = true; btn.textContent = 'Logging in…';
    const res = await TEP.Auth.login(identifier, pass);
    btn.disabled = false; btn.textContent = 'LOGIN';
    if (res.ok) {
      hideAll(); updateNavBar();
      showToast('👋 Welcome back, ' + TEP.Auth.getUsername());
      showMenu();
    } else {
      document.getElementById('auth-err').textContent = res.msg;
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const pass     = document.getElementById('reg-pass').value;
    const btn      = document.getElementById('reg-btn');
    btn.disabled = true; btn.textContent = 'Creating…';
    const res = await TEP.Auth.register(username, email, pass);
    btn.disabled = false; btn.textContent = 'CREATE ACCOUNT';
    if (res.ok) { hideAll(); updateNavBar(); showToast('🎉 Welcome, ' + TEP.Auth.getUsername()); showMenu(); }
    else document.getElementById('auth-err').textContent = res.msg;
  }

  // ── Nav bar ────────────────────────────────────────
  function updateNavBar() {
    const loggedIn  = TEP.Auth.isLoggedIn();
    const userArea  = document.getElementById('nav-user');
    const guestArea = document.getElementById('nav-guest');
    if (!userArea || !guestArea) return;
    if (loggedIn) {
      userArea.classList.remove('hidden');
      guestArea.classList.add('hidden');
      document.getElementById('nav-username').textContent = TEP.Auth.getUsername();
      document.getElementById('nav-coins').textContent    = '🪙 ' + TEP.Auth.getCoins();
    } else {
      userArea.classList.add('hidden');
      guestArea.classList.remove('hidden');
    }
  }

  // ── Main menu ──────────────────────────────────────
  function showMenu() {
    showPanel('main-menu');
    updateNavBar();

    const grid = document.getElementById('level-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const totalLevels = TEP.LEVELS?.length || 20;

    for (let i = 1; i <= totalLevels + 2; i++) {
      const btn = document.createElement('button');
      btn.className = 'lvl-btn';

      const lvlDef   = i <= totalLevels ? TEP.LEVELS[i - 1] : null;
      const theme    = lvlDef?.theme || 'cave';
      const color    = THEME_PRIMARY[theme]  || '#c49a20';
      const bgColor  = THEME_BG[theme]       || '#1a0a2e';
      const emoji    = THEME_EMOJIS[theme]   || '🎮';
      const isNight  = lvlDef?.isNight;
      const isLocked = false;
      const isGen    = i > totalLevels;

      if (isGen)    btn.classList.add('generated');

      btn.style.background  = bgColor;
      btn.style.borderColor = `${color}55`;

      if (i <= totalLevels) {
        btn.innerHTML = `
          <span class="lvl-btn-stripe" style="background:${color};box-shadow:0 0 8px ${color}66"></span>
          <div class="lvl-btn-body">
            <span class="lvl-theme">${emoji}</span>
            <span class="lvl-num" style="color:${color};text-shadow:0 0 8px ${color}66">${i}</span>
            <span class="lvl-name">${lvlDef?.name || ''}</span>
            ${isNight ? '<span class="lvl-night">🌙</span>' : ''}
            ${isLocked ? '<span style="font-size:10px;opacity:0.5">🔒</span>' : ''}
          </div>`;
      } else if (i === totalLevels + 1) {
        btn.style.background  = '#050010';
        btn.style.borderColor = '#aa44ff66';
        btn.innerHTML = `
          <span class="lvl-btn-stripe" style="background:linear-gradient(90deg,#aa44ff,#6030ff);box-shadow:0 0 8px #aa44ff66"></span>
          <div class="lvl-btn-body">
            <span class="lvl-theme">♾️</span>
            <span class="lvl-num" style="color:#aa44ff;text-shadow:0 0 8px #aa44ff66;font-size:16px">∞</span>
            <span class="lvl-name">ENDLESS</span>
          </div>`;
      } else {
        btn.style.background  = '#050818';
        btn.style.borderColor = '#ffd70066';
        btn.innerHTML = `
          <span class="lvl-btn-stripe" style="background:linear-gradient(90deg,#ffd700,#ff8800);box-shadow:0 0 8px #ffd70066"></span>
          <div class="lvl-btn-body">
            <span class="lvl-theme">📅</span>
            <span class="lvl-num" style="color:#ffd700;text-shadow:0 0 8px #ffd70066;font-size:12px">DAY</span>
            <span class="lvl-name">DAILY</span>
          </div>`;
      }

      btn.onclick = () => {
        hideAll();
        if (i === totalLevels + 1) { TEP.Game.startEndless(); }
        else if (i === totalLevels + 2) { TEP.Game.startEndless(TEP.getDailySeed()); }
        else { TEP.Game.startLevel(i); }
      };

      grid.appendChild(btn);
    }
  }

  // ── Shop panel ─────────────────────────────────────
  function showShop() {
    showPanel('shop-panel');
    renderShop();
  }

  function renderShop() {
    const profile = TEP.Auth.getProfile();
    const coins   = TEP.Auth.getCoins();
    document.getElementById('shop-coins').textContent = `🪙 ${coins}`;

    // Outfits
    const oGrid = document.getElementById('outfit-grid');
    oGrid.innerHTML = '';
    TEP.CONFIG.OUTFITS.forEach(o => {
      const owned    = !profile || profile.owned_outfits?.includes(o.id);
      const equipped = profile?.outfit === o.id;
      const btn = document.createElement('div');
      btn.className = 'shop-item' + (equipped ? ' equipped' : '') + (owned ? '' : ' locked-item');
      btn.innerHTML = `
        <div class="item-swatch" style="background:${o.color};box-shadow:0 0 10px ${o.color}66"></div>
        <div class="item-name">${o.name}</div>
        <div class="item-cost">${owned ? (equipped ? '✅ ON' : '✔ OWNED') : '🪙 '+o.cost}</div>`;
      btn.onclick = async () => {
        if (!TEP.Auth.isLoggedIn()) { showAuth(); return; }
        if (equipped) return;
        if (!owned) {
          const ok = await TEP.Auth.spendCoins(o.cost);
          if (!ok) { showToast('Not enough coins!', '#ff7e7e'); return; }
          profile.owned_outfits.push(o.id);
          await TEP.Auth.saveProfile({ owned_outfits: profile.owned_outfits, outfit: o.id });
        } else {
          await TEP.Auth.saveProfile({ outfit: o.id });
        }
        showToast(`👕 Wearing ${o.name}!`);
        renderShop();
        updateNavBar();
      };
      oGrid.appendChild(btn);
    });

    // ── Pets — render real pixel-art canvases ─────────
    const pGrid = document.getElementById('pet-grid');
    // Stop old animations before clearing
    pGrid.querySelectorAll('canvas[data-pet-canvas]').forEach(c => c._stopAnim?.());
    pGrid.innerHTML = '';

    TEP.CONFIG.PETS.forEach(p => {
      const owned    = profile?.owned_pets?.includes(p.id);
      const equipped = profile?.pet === p.id;
      const btn = document.createElement('div');
      btn.className = 'shop-item pet-shop-item' + (equipped ? ' equipped' : '') + (owned ? '' : ' locked-item');

      // Create pixel-art canvas preview
      const petCanvas = document.createElement('canvas');
      petCanvas.width = 64;
      petCanvas.height = 64;
      petCanvas.setAttribute('data-pet-canvas', p.id);
      petCanvas.style.cssText = [
        'width:64px',
        'height:64px',
        'image-rendering:pixelated',
        'image-rendering:crisp-edges',
        'display:block',
        'margin:0 auto 6px',
        `filter:drop-shadow(0 0 6px ${p.color}88)`,
      ].join(';');

      // Animate with bobbing
      let frame = 0;
      let animHandle = null;
      const drawers = TEP.Renderer?.drawPetPixelArt;
      const drawFn = drawers?.[p.id];

      function animate() {
        const ctx = petCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 64, 64);
        const scale = 2.6;
        ctx.save();
        ctx.scale(scale, scale);
        const bob = Math.sin(frame * 0.07) * 1.0;
        if (drawFn) {
          drawFn(ctx, 2, 2 + bob, frame, p.color);
        } else {
          // Inline fallback
          renderPetToCanvas(petCanvas, p.id, p.color);
        }
        ctx.restore();
        frame++;
        animHandle = requestAnimationFrame(animate);
      }
      animate();
      petCanvas._stopAnim = () => { if (animHandle) cancelAnimationFrame(animHandle); };

      btn.appendChild(petCanvas);

      const info = document.createElement('div');
      info.innerHTML = `
        <div class="item-name">${p.name}</div>
        <div class="item-desc">${p.desc}</div>
        <div class="item-story" style="font-size:9px;color:#556;margin:4px 0 6px;font-style:italic;line-height:1.5;">${p.story}</div>
        <div class="item-cost">${owned ? (equipped ? '✅ ACTIVE' : '✔ OWNED') : '🪙 '+p.cost}</div>`;
      btn.appendChild(info);

      btn.onclick = async () => {
        if (!TEP.Auth.isLoggedIn()) { showAuth(); return; }
        if (equipped) {
          await TEP.Auth.saveProfile({ pet: null });
          showToast('Pet unequipped');
          renderShop();
          return;
        }
        if (!owned) {
          const ok = await TEP.Auth.spendCoins(p.cost);
          if (!ok) { showToast('Not enough coins!', '#ff7e7e'); return; }
          profile.owned_pets.push(p.id);
          await TEP.Auth.saveProfile({ owned_pets: profile.owned_pets, pet: p.id });
        } else {
          await TEP.Auth.saveProfile({ pet: p.id });
        }
        showToast(`${p.name} equipped!`);
        renderShop();
      };

      pGrid.appendChild(btn);
    });
  }

  // ── Leaderboard panel ──────────────────────────────
  async function showLeaderboard() {
    showPanel('lb-panel');
    document.getElementById('lb-body').innerHTML = '<tr><td colspan="5">Loading…</td></tr>';
    const lvl    = parseInt(document.getElementById('lb-level-sel')?.value || '1');
    const mode   = document.getElementById('lb-mode-sel')?.value || 'campaign';
    const rows   = await TEP.Auth.getLeaderboard?.(lvl, mode, 15);
    const tbody  = document.getElementById('lb-body');
    if (!rows || !rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="color:#aaa">No scores yet — be first!</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((r, i) => `
      <tr class="${i === 0 ? 'lb-gold' : i === 1 ? 'lb-silver' : i === 2 ? 'lb-bronze' : ''}">
        <td>${['🥇','🥈','🥉'][i] || (i+1)}</td>
        <td>${r.username}</td>
        <td>${r.score}</td>
        <td>${r.time_seconds}s</td>
        <td>${r.echoes_used}</td>
      </tr>`).join('');
  }

  // ── Achievements panel ─────────────────────────────
  function showAchievements() {
    showPanel('ach-panel');
    const profile = TEP.Auth.getProfile();
    const earned  = profile?.achievements || [];
    const grid    = document.getElementById('ach-grid');
    grid.innerHTML = '';
    TEP.CONFIG.ACHIEVEMENTS.forEach(a => {
      const done = earned.includes(a.id);
      const div  = document.createElement('div');
      div.className = 'ach-card' + (done ? ' done' : '');
      div.innerHTML = `
        <div class="ach-icon">${done ? '🏆' : '🔒'}</div>
        <div class="ach-name">${a.name}</div>
        <div class="ach-desc">${a.desc}</div>
        <div class="ach-coins">+${a.coins} 🪙</div>`;
      grid.appendChild(div);
    });
  }

  // ── Controls/Help panel ────────────────────────────
  function showHelp() { showPanel('help-panel'); }

  // ── Expose ─────────────────────────────────────────
  return {
    showMenu, showAuth, switchAuthTab, handleLogin, handleRegister,
    showShop, showLeaderboard, showAchievements, showHelp,
    showToast, updateNavBar, hideAll, _scrollToLevels,
  };
})();
