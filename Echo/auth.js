/* =====================================================
   TIME ECHO PLATFORMER — auth.js
   Account management: register, login, session,
   profile CRUD, achievements, coin tracking
   ===================================================== */
window.TEP = window.TEP || {};

TEP.Auth = (() => {
  let _user    = null;
  let _profile = null;
  let _token   = null;

  const SESSION_KEY = 'tep_session_v1';

  // ── Helpers ──────────────────────────────────────────
  function saveSession(data) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch(e) {}
  }
  function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch(e) {}
  }
  function loadSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch(e) { return null; }
  }

  // ── Profile helpers ───────────────────────────────────
  async function fetchProfile(userId) {
    const rows = await TEP.DB.select('profiles', `id=eq.${userId}&select=*`);
    if (rows && rows[0]) {
      const p = rows[0];
      p.achievements = JSON.parse(p.achievements || '[]');
      p.owned_pets   = JSON.parse(p.owned_pets   || '[]');
      p.owned_outfits= JSON.parse(p.owned_outfits|| '["default"]');
      _profile = p;
      return p;
    }
    return null;
  }

  async function createProfile(userId, username, email) {
    const row = {
      id: userId,
      username,
      email,
      coins: 0,
      level_progress: 1,
      pet: null,
      outfit: 'default',
      achievements: '[]',
      owned_pets: '[]',
      owned_outfits: '["default"]',
    };
    const rows = await TEP.DB.insert('profiles', row);
    if (rows && rows[0]) {
      _profile = rows[0];
      _profile.achievements  = [];
      _profile.owned_pets    = [];
      _profile.owned_outfits = ['default'];
    }
    return _profile;
  }

  // ── Public API ────────────────────────────────────────
  const API = {
    isLoggedIn()   { return !!_user; },
    getUser()      { return _user; },
    getProfile()   { return _profile; },
    getUsername()  { return _profile?.username || 'Guest'; },
    getCoins()     { return _profile?.coins || 0; },
    getOutfit()    { return _profile?.outfit || API.guestOutfit || 'default'; },
    getPet()       { return _profile?.pet || API.guestPet || null; },
    getLevel() {
      return TEP.LEVELS?.length || 20;
    },

    async init() {
      const session = loadSession();
      if (!session) return false;
      _user  = session.user || session?.data?.user || null;
      _token = session.access_token || session?.access_token || session?.data?.access_token || null;
      TEP.DB.setToken(_token);
      if (_user?.id) await fetchProfile(_user.id);
      return !!_profile;
    },

    async register(username, email, password) {
      if (!username || username.length < 3)
        return { ok: false, msg: 'Username must be ≥ 3 characters' };
      if (!email || !password)
        return { ok: false, msg: 'Email and password required' };
      if (password.length < 6)
        return { ok: false, msg: 'Password must be ≥ 6 characters' };

      const data = await TEP.DB.signUp(email, password);
      if (!data) return { ok: false, msg: 'Registration failed' };
      if (data?.error) return { ok: false, msg: data.msg || data.error };

      // normalize possible response shapes from Supabase / different SDKs
      const user = data.user || data?.data?.user || data?.data?.session?.user || null;
      const token = data.access_token || data.accessToken || data?.data?.access_token || data?.data?.session?.access_token || null;
      if (!user) return { ok: false, msg: 'Registration failed' };

      _user = user;
      _token = token || null;
      TEP.DB.setToken(_token);
      // store a minimal, consistent session object
      saveSession({ user: _user, access_token: _token });

      await createProfile(_user.id, username, email);      return { ok: true };
    },

    async login(identifier, password) {
  let email = identifier;

  try {
    // If it's not an email → treat as username
    if (!identifier.includes('@')) {
      const userRow = await TEP.DB.getUserByUsername(identifier);

      if (!userRow || !userRow.email) {
        return { ok: false, msg: 'User not found' };
      }

      email = userRow.email;
    }

    // Normal email login
    const data = await TEP.DB.signIn(email, password);

    if (!data) return { ok: false, msg: 'Login failed' };
    if (data?.error) {
      return { ok: false, msg: data.error_description || data.error };
    }

    // Normalize response
    const user =
      data.user ||
      data?.data?.user ||
      data?.data?.session?.user ||
      null;

    const token =
      data.access_token ||
      data.accessToken ||
      data?.data?.access_token ||
      data?.data?.session?.access_token ||
      null;

    if (!user && !token) {
      return { ok: false, msg: 'Login failed' };
    }

    // Save session
    _user = user;
    _token = token;

    TEP.DB.setToken(_token);
    saveSession({ user: _user, access_token: _token });

    // Ensure profile exists
    await fetchProfile(_user?.id);
    if (!_profile && _user) {
      await createProfile(_user.id, email.split('@')[0]);
    }

    return { ok: true };

  } catch (err) {
    console.error(err);
    return { ok: false, msg: 'Unexpected error' };
  }
},

    async logout() {
      if (_token) await TEP.DB.signOut(_token);
      _user = _profile = _token = null;
      TEP.DB.setToken(null);
      clearSession();
    },

    async saveProfile(patch) {
      if (!_user && !_profile) return;
      const dbPatch = { ...patch };
      if (patch.achievements)  dbPatch.achievements  = JSON.stringify(patch.achievements);
      if (patch.owned_pets)    dbPatch.owned_pets     = JSON.stringify(patch.owned_pets);
      if (patch.owned_outfits) dbPatch.owned_outfits  = JSON.stringify(patch.owned_outfits);
      Object.assign(_profile || {}, patch);
      // Try PATCH; if it fails (e.g., table row missing), fallback to upsert
      const res = await TEP.DB.update('profiles', `id=eq.${_user?.id}`, dbPatch);
      if (!res) {
        const up = { id: _user?.id, username: _profile?.username || _user?.email?.split('@')[0] || 'Player',
          coins: _profile?.coins || 0, level_progress: _profile?.level_progress || 1,
          pet: _profile?.pet || null, outfit: _profile?.outfit || 'default',
          achievements: JSON.stringify(_profile?.achievements || []),
          owned_pets: JSON.stringify(_profile?.owned_pets || []),
          owned_outfits: JSON.stringify(_profile?.owned_outfits || ['default']),
        };
        await TEP.DB.upsert('profiles', up);
      }
    },

    async addCoins(n) {
      if (!_profile) return 0;
      const newCoins = (_profile.coins || 0) + n;
      await API.saveProfile({ coins: newCoins });
      return newCoins;
    },

    async spendCoins(n) {
      if (!_profile || _profile.coins < n) return false;
      await API.saveProfile({ coins: _profile.coins - n });
      return true;
    },

    async unlockAchievement(id) {
      if (!_profile) return;
      if (_profile.achievements.includes(id)) return;
      _profile.achievements.push(id);
      const def = TEP.CONFIG.ACHIEVEMENTS.find(a => a.id === id);
      if (def) await API.addCoins(def.coins);
      await API.saveProfile({ achievements: _profile.achievements });
      TEP.UI?.showToast?.(`🏆 ${def?.name || id} unlocked! +${def?.coins || 0} coins`);
    },

    async advanceLevel(lvl) {
      if (!_profile) return;
      if (lvl > (_profile.level_progress || 1)) {
        await API.saveProfile({ level_progress: lvl });
      }
    },

    async submitScore(levelNum, score, timeSec, echoesUsed, mode = 'campaign') {
      if (!_user || !_profile) return;
      await TEP.DB.insert('leaderboard', {
        user_id: _user.id,
        username: _profile.username,
        level_number: levelNum,
        score,
        time_seconds: timeSec,
        echoes_used: echoesUsed,
        mode,
      });
    },

    async getLeaderboard(levelNum, mode = 'campaign', limit = 10) {
      return TEP.DB.rpc('get_level_leaderboard', {
        p_level: levelNum,
        p_mode:  mode,
        p_limit: limit,
      });
    },

    // Guest local storage fallback
    guestCoins: 0,
    guestLevel: 1,
    guestAchievements: [],
    guestPet: null,
    guestOutfit: 'default',
    initGuest() {
      try {
        const g = JSON.parse(localStorage.getItem('tep_guest') || '{}');
        this.guestCoins = g.coins || 0;
        this.guestLevel = TEP.LEVELS?.length || 20;
        this.guestAchievements = g.achievements || [];
        this.guestPet = g.pet || null;
        this.guestOutfit = g.outfit || 'default';
      } catch(e) {}
    },
    saveGuest() {
      try {
        localStorage.setItem('tep_guest', JSON.stringify({
          coins: this.guestCoins,
          level: this.guestLevel,
          achievements: this.guestAchievements,
          pet: this.guestPet || null,
          outfit: this.guestOutfit || 'default',
        }));
      } catch(e) {}
    },
  };

  return API;
})();
