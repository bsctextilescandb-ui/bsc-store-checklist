// ════════════════════════════════════════════════════════════════
//  C&B Niranthar — Store Operation Checklist
//  script.js  |  Shared utilities
//  ⚠ Replace API_URL below after deploying your Apps Script
// ════════════════════════════════════════════════════════════════

const API_URL = 'https://script.google.com/macros/s/AKfycbzT-GnqHn6EfZnNMl2JdqwTfaOoKLklHe0PN4CSynq-c2nZWa1t43_8vNyvCrkpHqSyhQ/exec'; // ← Paste URL here

// ── GET request ───────────────────────────────────────────────
async function api(action, params = {}) {
  try {
    const q = new URLSearchParams({ action, ...params }).toString();
    const r = await fetch(`${API_URL}?${q}`, { redirect: 'follow' });
    return await r.json();
  } catch (e) {
    return { ok: false, error: 'Network error: ' + e.message };
  }
}

// ── POST request ──────────────────────────────────────────────
// Uses Content-Type: text/plain to avoid CORS preflight.
// Apps Script reads the body via e.postData.contents.
async function postApi(data) {
  try {
    const r = await fetch(API_URL, {
      method:   'POST',
      headers:  { 'Content-Type': 'text/plain;charset=utf-8' },
      body:     JSON.stringify(data),
      redirect: 'follow'
    });
    return await r.json();
  } catch (e) {
    // POST failed (CORS or network) — fall back to GET without photos
    console.warn('POST failed, trying GET fallback:', e.message);
    try {
      const fallbackData = { ...data };
      // Strip base64 photos from entries for GET (too large for URL)
      if (Array.isArray(fallbackData.entries)) {
        fallbackData.entries = fallbackData.entries.map(e => {
          const clean = { ...e };
          delete clean.photoBase64;
          if (!clean.photoUrl && clean.photoBase64 !== undefined) {
            clean.response = clean.response || 'Photo taken (not uploaded)';
          }
          return clean;
        });
      }
      const q = new URLSearchParams({
        action:    fallbackData.action,
        staffName: fallbackData.staffName || '',
        role:      fallbackData.role      || '',
        entries:   JSON.stringify(fallbackData.entries || [])
      }).toString();
      const r2 = await fetch(`${API_URL}?${q}`, { redirect: 'follow' });
      return await r2.json();
    } catch (e2) {
      return { ok: false, error: 'Submission failed. Check your internet connection.' };
    }
  }
}

// ── Compress image → base64 JPEG ─────────────────────────────
// maxWidth: max pixels wide | quality: 0.0–1.0
function compressImage(file, maxWidth = 600, quality = 0.60) {
  return new Promise((resolve, reject) => {
    const reader  = new FileReader();
    reader.onload = e => {
      const img   = new Image();
      img.onload  = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
        canvas.width  = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src     = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── IST date helpers ──────────────────────────────────────────
function getISTDate() {
  const now  = new Date();
  const ist  = new Date(now.getTime() + 5.5 * 3600000);
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const mon  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const pad  = n => String(n).padStart(2, '0');
  return {
    dateStr: `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth()+1)}-${pad(ist.getUTCDate())}`,
    label:   `${days[ist.getUTCDay()]}, ${ist.getUTCDate()} ${mon[ist.getUTCMonth()]} ${ist.getUTCFullYear()}`,
    time:    `${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`
  };
}

function formatDateLabel(dateStr) {
  const d   = new Date(dateStr + 'T00:00:00Z');
  const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()];
  const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()];
  return `${day} ${d.getUTCDate()} ${mon}`;
}

// ── Toast notification ────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className   = type;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── Screen switcher ───────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

// ── HTML escaper ──────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
