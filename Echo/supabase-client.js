/* =====================================================
   TIME ECHO PLATFORMER — supabase-client.js
   Thin REST wrapper around Supabase.
   ===================================================== */
window.TEP = window.TEP || {};
const SUPABASE_URL = 'https://xqooqyyusorqrawmphoh.supabase.co';
const SUPABASE_ANON = 'sb_publishable_zsExJ_EzANt_bwi8jsNlhg_NtJ7pEOX';

TEP.DB = (() => {
  let accessToken = SUPABASE_ANON;

  function headers(extra = {}) {
    return {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${accessToken}`,
      ...extra,
    };
  }

  async function restFetch(path, opts = {}) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${path}`;
      const mergedOpts = {
        ...opts,
        headers: { ...headers(), ...(opts.headers || {}) },
      };
      const res = await fetch(url, mergedOpts);
      if (!res.ok) {
        const errText = await res.text();
        console.warn('[DB]', res.status, errText);
        return null;
      }
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    } catch (e) {
      console.warn('[DB] fetch error:', e);
      return null;
    }
  }

  async function authFetch(endpoint, body) {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Auth failed', msg: data.error_description || data.msg || '' };
      }
      return data;
    } catch (e) {
      console.warn('[Auth] error:', e);
      return { error: e.message };
    }
  }

  return {
    setToken(tok) {
      accessToken = tok || SUPABASE_ANON;
    },

    // ── Auth ────────────────────────────────────────────
    async signUp(email, password) {
      return authFetch('signup', { email, password });
    },

    async signIn(email, password) {
      return authFetch('token?grant_type=password', { email, password });
    },

    async signOut(token) {
      try {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON,
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (e) {}
    },

    // ── Username lookup ─────────────────────────────────
    async getUserByUsername(username) {
      const rows = await this.select(
        'profiles',
        `select=email&username=eq.${encodeURIComponent(username)}`
      );
      console.log('[DB] getUserByUsername lookup:', username, rows);
      return rows?.[0] || null;
    },

    // ── REST helpers ────────────────────────────────────
    async select(table, query = '') {
      return restFetch(`${table}${query ? '?' + query : ''}`);
    },

    async insert(table, row) {
      return restFetch(table, {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify(row),
      });
    },

    async update(table, query, patch) {
      return restFetch(`${table}?${query}`, {
        method: 'PATCH',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify(patch),
      });
    },

    async upsert(table, row) {
      return restFetch(table, {
        method: 'POST',
        headers: { 'Prefer': 'return=representation,resolution=merge-duplicates' },
        body: JSON.stringify(row),
      });
    },

    async rpc(fn, params = {}) {
      return restFetch(`rpc/${fn}`, {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  };
})();
