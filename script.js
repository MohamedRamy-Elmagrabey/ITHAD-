'use strict';

/* ============================================================
   script.js – اتحاد شباب الوطن – الإسكندرية  v5.0 (Supabase)
   ============================================================ */


try {
    supabaseClient = initSupabase();
} catch (e) {
    console.warn('Supabase init failed, using defaults:', e);
}

var DB = { committees: [], leaders: {}, news: [], coordinator: { president: {}, vp: {} } };

/* ─── Dark Mode Toggle ─── */
function toggleTheme() {
  const html = document.documentElement;
  html.classList.toggle('dark');
  const isDark = html.classList.contains('dark');
  document.querySelectorAll('#themeToggle i, #mobileThemeIcon').forEach(el => {
    el.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  });
  localStorage.setItem('watan_theme', isDark ? 'dark' : 'light');
}
(function initTheme() {
  const saved = localStorage.getItem('watan_theme');
  const sysDark = window.matchMedia('(prefers-color-scheme:dark)');
  if (saved === 'dark' || (!saved && sysDark.matches)) {
    document.documentElement.classList.add('dark');
    document.querySelectorAll('#themeToggle i, #mobileThemeIcon').forEach(el => el.className = 'fas fa-sun');
  }
  sysDark.addEventListener('change', e => {
    if (!localStorage.getItem('watan_theme')) {
      if (e.matches) { document.documentElement.classList.add('dark'); document.querySelectorAll('#themeToggle i, #mobileThemeIcon').forEach(el => el.className = 'fas fa-sun'); }
      else { document.documentElement.classList.remove('dark'); document.querySelectorAll('#themeToggle i, #mobileThemeIcon').forEach(el => el.className = 'fas fa-moon'); }
    }
  });
})();

async function loadDB() {
    if (!supabaseClient) {
        DB = { committees: DEFAULT_COMMITTEES, leaders: {}, news: DEFAULT_NEWS, coordinator: { president: {}, vp: {} } };
        return;
    }
    try {
        const [committeesRes, newsRes, leadersRes, coordRes] = await Promise.all([
            supabaseClient.from('committees').select('*').order('id'),
            supabaseClient.from('news').select('*').order('created_at', { ascending: false }),
            supabaseClient.from('leaders').select('*'),
            supabaseClient.from('coordinator').select('*')
        ]);

        if (committeesRes.error) throw committeesRes.error;
        if (newsRes.error) throw newsRes.error;
        if (leadersRes.error) throw leadersRes.error;
        if (coordRes.error) throw coordRes.error;

        const leadersMap = {};
        (leadersRes.data || []).forEach(l => {
            if (!leadersMap[l.committee_id]) leadersMap[l.committee_id] = { president: {}, vps: [] };
            if (l.type === 'president') {
                leadersMap[l.committee_id].president = { name: l.name, role: l.role, img: l.img, bio: l.bio };
            } else {
                leadersMap[l.committee_id].vps.push({ name: l.name, role: l.role, img: l.img, bio: l.bio });
            }
        });

        const coord = { president: {}, vp: {} };
        (coordRes.data || []).forEach(c => {
            coord[c.type] = { name: c.name, role: c.role, img: c.img, bio: c.bio };
        });

        DB = {
            committees: mergeCommittees(committeesRes.data),
            news: (newsRes.data && newsRes.data.length) ? newsRes.data : DEFAULT_NEWS,
            leaders: leadersMap,
            coordinator: coord
        };
        lsSet('watan_db', DB);
    } catch (e) {
        const cached = lsGet('watan_db', null);
        if (cached) {
            DB = cached;
        } else {
            DB = { committees: DEFAULT_COMMITTEES, leaders: {}, news: DEFAULT_NEWS, coordinator: { president: {}, vp: {} } };
        }
    }
}

/* ═══════════════════════════════════════════
   NAVBAR
════════════════════════════════════════════ */
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
window.addEventListener('scroll', () => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 20);
    let cur = '';
    document.querySelectorAll('section[id]').forEach(s => { if (y >= s.offsetTop - 110) cur = s.id; });
    document.querySelectorAll('.nav-links a,.mobile-menu a,.bottom-nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
}, { passive: true });

hamburger.addEventListener('click', () => {
    const o = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', o);
});

function closeMobile() {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
}
document.addEventListener('click', e => { if (!navbar.contains(e.target)) closeMobile(); });

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const t = document.querySelector(a.getAttribute('href'));
        if (!t) return;
        e.preventDefault();
        closeMobile();
        window.scrollTo({ top: Math.max(0, t.getBoundingClientRect().top + window.scrollY - navbar.offsetHeight - 16), behavior: 'smooth' });
    });
});

/* ═══════════════════════════════════════════
   REVEAL OBSERVER
════════════════════════════════════════════ */
const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('visible');
            revealObs.unobserve(e.target);
        }
    });
}, { threshold: 0.05, rootMargin: '0px' });

function observeReveal() {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.top <= window.innerHeight;
        if (isVisible) { el.classList.add('visible'); } else { revealObs.observe(el); }
    });
}

/* ═══════════════════════════════════════════
   RENDER COMMITTEES
════════════════════════════════════════════ */
function showSkeletons() {
  const skCard = n => Array(n).fill('<div class="skeleton-card"><div class="sk-icon"></div><div class="sk-line sk-w80"></div><div class="sk-line sk-w60"></div></div>').join('');
  const skNews = n => Array(n).fill('<div class="skeleton-card"><div class="sk-img"></div><div class="sk-line sk-w60" style="margin-top:.75rem"></div><div class="sk-line sk-w80"></div><div class="sk-line sk-w50"></div></div>').join('');
  const cg = document.getElementById('committeesGrid'); if (cg) cg.innerHTML = skCard(10);
  const ng = document.getElementById('newsGrid');       if (ng) ng.innerHTML = skNews(3);
  const lg = document.getElementById('leadersGrid');    if (lg) lg.innerHTML = skCard(6);
}

function updateCommCounts() {
    const count = DB.committees.length;
    const stat = document.getElementById('commCountStat');
    const desc = document.getElementById('commCountDesc');
    if (stat) stat.textContent = count;
    if (desc) desc.textContent = count;
}

function renderCommittees() {
    const grid = document.getElementById('committeesGrid');
    if (!grid) return;
    const comms = DB.committees.length ? DB.committees : DEFAULT_COMMITTEES;
    grid.innerHTML = comms.map((c, i) => `
    <div class="committee-card reveal ${i % 4 === 1 ? 'delay-1' : i % 4 === 2 ? 'delay-2' : i % 4 === 3 ? 'delay-3' : ''}"
         onclick="openCommitteeDetail('${c.id}')">
      <div class="committee-icon"><i class="${esc(c.icon)}"></i></div>
      <h4>${esc(c.name)}</h4>
      <p>${esc(c.shortDesc)}</p>
      <div class="click-hint"><i class="fas fa-eye"></i> عرض التفاصيل</div>
    </div>`).join('');
    observeReveal();
}

/* ═══════════════════════════════════════════
   COMMITTEE DETAIL PAGE
════════════════════════════════════════════ */
function openCommitteeDetail(id) {
    const comms = DB.committees.length ? DB.committees : DEFAULT_COMMITTEES;
    const c = comms.find(x => x.id === id);
    if (!c) return;
    const ldr = DB.leaders[id] || { president: { name: '', img: '', role: '' }, vps: [] };

    function personCard(p, badgeText, badgeClass) {
        if (!p || !p.name) return '';
        const av = p.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=1a56db&color=fff&size=200&bold=true`;
        return `<div class="dlc">
      <img loading="lazy" class="dlc-avatar" src="${esc(av)}" alt="${esc(p.name)}" onerror="this.src='${av}'"/>
      <div class="dlc-info">
        <h4>${esc(p.name)}</h4>
        <p>${esc(p.role || badgeText)}</p>
        <span class="dlc-badge ${badgeClass}">${badgeText}</span>
        ${p.bio ? `<p style="margin-top:.4rem;font-size:.8rem;color:var(--text-mid)">${esc(p.bio)}</p>` : ''}
      </div>
    </div>`;
    }

    let leadersHtml = personCard(ldr.president, 'رئيس', 'president');
    (ldr.vps || []).filter(v => v.name).forEach(v => { leadersHtml += personCard(v, v.role || 'نائب', 'vp'); });
    if (!leadersHtml) leadersHtml = '<div class="dlc-empty"><i class="fas fa-user-slash"></i><p>سيتم الإعلان عن القيادة قريباً</p></div>';

  document.getElementById('committeeDetailContent').innerHTML = `
    <div class="detail-header-block">
      <div class="detail-big-icon"><i class="${esc(c.icon)}"></i></div>
      <div>
        <span class="detail-tag-small">لجنة متخصصة</span>
        <h1>${esc(c.name)}</h1>
      </div>
    </div>
    <div class="detail-desc-block">
      <h3><i class="fas fa-info-circle"></i> نبذة عن اللجنة</h3>
      <p>${esc(c.fullDesc)}</p>
    </div>
    <div class="detail-leaders-block">
      <h3><i class="fas fa-crown"></i> قيادة اللجنة</h3>
      <div class="detail-leaders-row">
        ${leadersHtml}
      </div>
    </div>`;

  document.getElementById('committeeDetail').style.display = 'block';
  document.body.style.overflow = 'hidden';
  window.scrollTo({ top: 0 });
}
function closeCommitteeDetail() {
  document.getElementById('committeeDetail').style.display = 'none';
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('committeeDetail').style.display !== 'none') {
    closeCommitteeDetail();
  }
});

/* ═══════════════════════════════════════════
   RENDER NEWS
════════════════════════════════════════════ */
var showMoreState = { news: 3, leaders: 6 };

function computeIsNew(item) {
  try {
    const parts = (item.date || '').split(' ');
    if (parts.length < 3) return false;
    const day = parseInt(parts[0], 10);
    const monthIdx = AR_MONTHS.indexOf(parts[1]);
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || monthIdx === -1 || isNaN(year)) return false;
    const d = new Date(year, monthIdx, day);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    return diff >= 0 && diff < 7 * 24 * 60 * 60 * 1000;
  } catch { return false; }
}

function toggleShowMore(type) {
  if (type === 'news') showMoreState.news = showMoreState.news === 3 ? DB.news.length : 3;
  else showMoreState.leaders = showMoreState.leaders === 6 ? DB.leadersCount : 6;
  if (type === 'news') renderNews(); else renderLeaders();
}

function renderNews() {
  const grid = document.getElementById('newsGrid'); if (!grid) return;
  const items = (DB.news.length ? DB.news : DEFAULT_NEWS).slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  if (!items.length) { grid.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:2rem">لا توجد أخبار حالياً</p>'; return; }
  const limit = showMoreState.news;
  const visible = items.slice(0, limit);
  const hidden = items.length - visible.length;
  grid.innerHTML = visible.map((n, idx) => {
    const trunc = (n.desc || '').length > 180;
    return `<div class="news-card reveal">
      <div class="news-img-wrap">
        ${n.img
           ? `<img loading="lazy" src="${esc(n.img)}" alt="${esc(n.title)}"
               style="object-position:${esc(n.imgPos || 'center')}"
               onerror="this.parentElement.innerHTML='<div class=news-img-placeholder><i class=\\'fas fa-newspaper\\'></i></div>'"/>`
          : `<div class="news-img-placeholder"><i class="fas fa-newspaper"></i></div>`}
        ${computeIsNew(n) ? '<span class="news-new-badge">جديد</span>' : ''}
        ${n.pinned ? '<span class="news-pin-badge"><i class="fas fa-thumbtack"></i> مثبت</span>' : ''}
      </div>
      <div class="news-content">
        <span class="news-date"><i class="fas fa-calendar-alt"></i> ${esc(n.date)}</span>
        <h4>${esc(n.title)}</h4>
        <div class="news-desc-wrap">
          <p class="news-desc-short">${trunc ? esc((n.desc || '').slice(0, 180)) + '...' : esc(n.desc || '')}</p>
          ${trunc ? `<p class="news-desc-full" style="display:none">${esc(n.desc || '')}</p><button class="news-more-btn" onclick="this.parentElement.querySelector('.news-desc-full').style.display='block';this.parentElement.querySelector('.news-desc-short').style.display='none';this.style.display='none'"><i class="fas fa-chevron-down"></i> قراءة المزيد</button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
  document.querySelectorAll('.show-more-news').forEach(el => el.remove());
  if (hidden > 0 || limit > 3) {
    grid.insertAdjacentHTML('afterend', `<div class="show-more-news" style="text-align:center;margin-top:1.5rem"><button class="btn btn-outline btn-sm" onclick="toggleShowMore('news')">${limit > 3 ? '<i class="fas fa-chevron-up"></i> عرض أقل' : `<i class="fas fa-chevron-down"></i> عرض المزيد (${hidden})`}</button></div>`);
  }
  observeReveal();
}

/* ═══════════════════════════════════════════
   RENDER LEADERS + COORDINATOR
════════════════════════════════════════════ */
function renderLeaders() {
  const grid = document.getElementById('leadersGrid'); if (!grid) return;
  const comms = DB.committees.length ? DB.committees : DEFAULT_COMMITTEES;
  let html = '';

  const gen = DB.leaders['general'] || {};
  const genVps = (gen.vps || []).filter(v => v.name).map(v => coordPersonEl(v, v.role || 'نائب الرئيس العام', 'vp')).join('');
  if (gen.president?.name || genVps) {
    html += `<div class="coordinator-card premium reveal" style="grid-column:1/-1">
      <div class="coord-header">
        <i class="fas fa-crown"></i>
        <span>رئاسة الاتحاد</span>
      </div>
      <div class="coord-body">
        ${coordPersonEl(gen.president, 'الرئيس العام', 'president')}
        ${genVps}
      </div>
    </div>`;
  }

  const co = DB.coordinator || {};
  if (co.president?.name || co.vp?.name) {
    html += `<div class="coordinator-card reveal" style="grid-column:1/-1">
      <div class="coord-header">
        <i class="fas fa-map-marker-alt"></i>
        <span>منسق محافظة الإسكندرية</span>
      </div>
      <div class="coord-body">
        ${coordPersonEl(co.president, 'منسق المحافظة', 'president')}
        ${coordPersonEl(co.vp, 'نائب المنسق', 'vp')}
      </div>
    </div>`;
  }

  DB.leadersCount = comms.length;
  const limit = showMoreState.leaders;
  const visibleGroups = comms.slice(0, limit);
  const hidden = comms.length - visibleGroups.length;
  let shownHtml = '';
  visibleGroups.forEach((c, i) => {
    const ldr = DB.leaders[c.id] || {};
    const vps = (ldr.vps || []).filter(v => v.name).map(v => personRow(v, 'vp')).join('');
    const hasData = ldr.president?.name || vps;
    shownHtml += `<div class="leader-committee-group reveal ${i % 3 === 1 ? 'delay-1' : i % 3 === 2 ? 'delay-2' : ''}">
      <div class="lcg-header" onclick="openCommitteeDetail('${c.id}')">
        <i class="${esc(c.icon)}"></i><span>${esc(c.name)}</span>
      </div>
      <div class="lcg-body">
        ${hasData
          ? personRow(ldr.president, 'president') + vps
          : '<div class="lcg-empty"><i class="fas fa-hourglass-half"></i><p>سيتم الإعلان عن القيادة قريباً</p></div>'}
      </div>
    </div>`;
  });
  grid.innerHTML = html + shownHtml;
  document.querySelectorAll('.show-more-leaders').forEach(el => el.remove());
  if (hidden > 0 || limit > 6) {
    grid.insertAdjacentHTML('afterend', `<div class="show-more-leaders" style="text-align:center;margin-top:1.5rem"><button class="btn btn-outline btn-sm" onclick="toggleShowMore('leaders')">${limit > 6 ? '<i class="fas fa-chevron-up"></i> عرض أقل' : `<i class="fas fa-chevron-down"></i> عرض المزيد (${hidden})`}</button></div>`);
  }
  observeReveal();
}

function coordPersonEl(p, label, type) {
  if (!p || !p.name) return '';
  const av = p.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=1a56db&color=fff&size=200&bold=true`;
  let badgeClass = type === 'president' ? 'president' : 'vp';
  return `<div class="coord-person">
    <img loading="lazy" class="coord-avatar" src="${esc(av)}" alt="${esc(p.name)}" onerror="this.src='${av}'"/>
    <div class="coord-info">
      <h4>${esc(p.name)}</h4>
      <p>${esc(p.role || label)}</p>
      <span class="lcg-badge ${badgeClass}">${label}</span>
      ${p.bio ? `<small>${esc(p.bio)}</small>` : ''}
    </div>
  </div>`;
}

function personRow(p, type) {
  if (!p || !p.name) return '';
  const av = p.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=1a56db&color=fff&size=200&bold=true`;
  let badgeClass = type === 'president' ? 'president' : 'vp';
  let badgeText = type === 'president' ? 'رئيس' : 'نائب';
  return `<div class="lcg-person">
    <img loading="lazy" class="lcg-avatar" src="${esc(av)}" alt="${esc(p.name)}" onerror="this.src='${av}'"/>
    <div class="lcg-info">
      <h4>${esc(p.name)}</h4>
      <p>${esc(p.role || (type === 'president' ? 'رئيس' : 'نائب'))}</p>
      <span class="lcg-badge ${badgeClass}">${badgeText}</span>
    </div>
  </div>`;
}

/* ═══════════════════════════════════════════
   TOAST
════════════════════════════════════════════ */
function toast(msg, type = 'success') {
  document.querySelectorAll('.toast-notif').forEach(t => t.remove());
  const t = document.createElement('div'); t.className = 'toast-notif';
  t.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${msg}`;
  Object.assign(t.style, {
    position: 'fixed', bottom: '6rem', right: '1.5rem',
    background: type === 'success' ? 'var(--success)' : 'var(--danger)',
    color: '#fff', padding: '.8rem 1.4rem', borderRadius: '999px',
    fontFamily: 'Cairo,sans-serif', fontWeight: '700', fontSize: '.9rem',
    display: 'flex', alignItems: 'center', gap: '.5rem', zIndex: '9999',
    direction: 'rtl', opacity: '0', transform: 'translateY(10px)',
    transition: 'all .3s ease', boxShadow: '0 4px 20px rgba(0,0,0,.2)'
  });
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
  setTimeout(() => {
    t.style.opacity = '0'; t.style.transform = 'translateY(10px)';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

/* ═══════════════════════════════════════════
   JOIN FORM
════════════════════════════════════════════ */
var jfCurrentStep = 1;

function jfNextStep(n) {
  const stepFields = {
    2: ['jf-name', 'jf-national'],
    3: ['jf-phone', 'jf-whatsapp', 'jf-address', 'jf-qualification']
  };
  const fields = stepFields[n];
  if (fields) {
    const rules = {
      'jf-name': v => (!v || v.length < 4) ? 'الاسم الرباعي يجب أن يكون 4 أحرف على الأقل' : !/^[\u0600-\u06FF\s]+$/.test(v) ? 'الاسم يجب أن يكون باللغة العربية فقط' : '',
      'jf-national': v => /^\d{14}$/.test(v) ? '' : 'الرقم القومي يجب أن يكون 14 رقماً',
      'jf-phone': v => /^01[0-9]{9}$/.test(v) ? '' : 'رقم الهاتف غير صحيح (01xxxxxxxxx)',
      'jf-whatsapp': v => /^01[0-9]{9}$/.test(v) ? '' : 'رقم الواتساب غير صحيح (01xxxxxxxxx)',
      'jf-address': v => v ? '' : 'يرجى إدخال العنوان',
      'jf-qualification': v => v ? '' : 'يرجى إدخال المؤهل الدراسي',
    };
    let hasError = false;
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const err = rules[id](el.value.trim());
      let errEl = el.parentElement.querySelector('.jf-inline-err');
      if (err) {
        el.style.borderColor = 'var(--danger)';
        if (!errEl) { errEl = document.createElement('span'); errEl.className = 'jf-inline-err'; errEl.style.cssText = 'display:block;color:var(--danger);font-size:.78rem;margin-top:.25rem;font-weight:600'; el.parentElement.appendChild(errEl); }
        errEl.textContent = '⚠ ' + err;
        hasError = true;
      } else {
        el.style.borderColor = 'var(--success)';
        if (errEl) errEl.remove();
      }
    });
    if (hasError) { toast('⚠ يرجى تصحيح الأخطاء قبل المتابعة', 'err'); return; }
  }
  document.querySelectorAll('.jf-step-content').forEach(el => el.style.display = 'none');
  document.querySelector(`.jf-step-content[data-step="${n}"]`).style.display = 'block';
  document.querySelectorAll('.jf-step').forEach(el => el.classList.toggle('active', parseInt(el.dataset.step) <= n));
  jfCurrentStep = n;
  window.scrollTo({ top: document.getElementById('join').offsetTop - 80, behavior: 'smooth' });
}

function jfPrevStep(n) {
  document.querySelectorAll('.jf-step-content').forEach(el => el.style.display = 'none');
  document.querySelector(`.jf-step-content[data-step="${n}"]`).style.display = 'block';
  document.querySelectorAll('.jf-step').forEach(el => el.classList.toggle('active', parseInt(el.dataset.step) <= n));
  jfCurrentStep = n;
}

function initJoinForm() {
  const sel = document.getElementById('jf-committee');
  if (!sel) return;
  const comms = DB.committees.length ? DB.committees : DEFAULT_COMMITTEES;
  sel.innerHTML = '<option value="">-- اختر اللجنة --</option>' +
    comms.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
}

function extractNationalID(id) {
  if (!/^\d{14}$/.test(id)) return null;
  const century = id[0] === '2' ? 1900 : id[0] === '3' ? 2000 : 0;
  if (!century) return null;
  const year = century + parseInt(id.slice(1, 3), 10);
  const month = parseInt(id.slice(3, 5), 10) - 1;
  const day = parseInt(id.slice(5, 7), 10);
  const bd = new Date(year, month, day);
  if (isNaN(bd.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - bd.getFullYear();
  const mDiff = now.getMonth() - bd.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < bd.getDate())) age--;
  return { date: bd.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }), age };
}

function initInlineValidation() {
  const rules = {
    'jf-name':          v => (!v || v.length < 4) ? 'الاسم الرباعي يجب أن يكون 4 أحرف على الأقل' : !/^[\u0600-\u06FF\s]+$/.test(v) ? 'الاسم يجب أن يكون باللغة العربية فقط' : '',
    'jf-national':      v => /^\d{14}$/.test(v) ? '' : 'الرقم القومي يجب أن يكون 14 رقماً',
    'jf-phone':         v => /^01[0-9]{9}$/.test(v) ? '' : 'رقم الهاتف غير صحيح (01xxxxxxxxx)',
    'jf-whatsapp':      v => /^01[0-9]{9}$/.test(v) ? '' : 'رقم الواتساب غير صحيح (01xxxxxxxxx)',
    'jf-address':       v => v ? '' : 'يرجى إدخال العنوان',
    'jf-qualification': v => v ? '' : 'يرجى إدخال المؤهل الدراسي',
  };
  Object.entries(rules).forEach(([id, validate]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === 'jf-national') {
      el.addEventListener('input', function() {
        const info = document.getElementById('jf-national-info');
        if (!info) return;
        const r = extractNationalID(this.value.trim());
        if (r) {
          info.innerHTML = `<i class="fas fa-calendar-alt"></i> تاريخ الميلاد: ${r.date} · العمر: ${r.age} سنة`;
          info.style.color = 'rgba(255,255,255,.9)';
        } else if (/^\d{14}$/.test(this.value.trim())) {
          info.innerHTML = '<span style="color:var(--danger)">⚠ الرقم القومي غير صحيح</span>';
        } else {
          info.innerHTML = '';
        }
      });
    }
    const check = () => {
      const errMsg = validate(el.value.trim());
      let errEl = el.parentElement.querySelector('.jf-inline-err');
      if (errMsg) {
        el.style.borderColor = 'var(--danger)';
        if (!errEl) { errEl = document.createElement('span'); errEl.className = 'jf-inline-err'; errEl.style.cssText = 'display:block;color:var(--danger);font-size:.78rem;margin-top:.25rem;font-weight:600'; el.parentElement.appendChild(errEl); }
        errEl.textContent = '⚠ ' + errMsg;
      } else {
        el.style.borderColor = 'var(--success)';
        if (errEl) errEl.remove();
      }
    };
    el.addEventListener('blur', check);
    el.addEventListener('input', () => { if (el.style.borderColor && el.style.borderColor !== '') check(); });
  });
}

async function submitApplication() {
  const btn = document.getElementById('jf-submit');
  const msg = document.getElementById('jf-msg');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
  msg.style.display = 'none';

  document.querySelectorAll('.jf-err').forEach(e => e.remove());
  document.querySelectorAll('.jf-group input, .jf-group select').forEach(e => e.style.borderColor = '');

  const fields = {
    full_name: { el: document.getElementById('jf-name'), label: 'الاسم الرباعي' },
    national_id: { el: document.getElementById('jf-national'), label: 'الرقم القومي' },
    phone: { el: document.getElementById('jf-phone'), label: 'رقم الهاتف' },
    whatsapp: { el: document.getElementById('jf-whatsapp'), label: 'رقم الواتساب' },
    address: { el: document.getElementById('jf-address'), label: 'العنوان' },
    qualification: { el: document.getElementById('jf-qualification'), label: 'المؤهل الدراسي' },
    committee_id: { el: document.getElementById('jf-committee'), label: 'اللجنة' }
  };

  const errors = [];

  const v = name => fields[name].el.value.trim();

  if (!v('full_name') || v('full_name').length < 4) {
    errors.push('الاسم الرباعي يجب أن يكون 4 أحرف على الأقل');
    fields.full_name.el.style.borderColor = 'var(--danger)';
  } else if (!/^[\u0600-\u06FF\s]+$/.test(v('full_name'))) {
    errors.push('الاسم الرباعي يجب أن يكون باللغة العربية فقط');
    fields.full_name.el.style.borderColor = 'var(--danger)';
  }

  if (!/^\d{14}$/.test(v('national_id'))) {
    errors.push('الرقم القومي يجب أن يكون 14 رقماً');
    fields.national_id.el.style.borderColor = 'var(--danger)';
  }

  if (!/^01[0-9]{9}$/.test(v('phone'))) {
    errors.push('رقم الهاتف غير صحيح (يجب أن يبدأ بـ 01 ويتكون من 11 رقم)');
    fields.phone.el.style.borderColor = 'var(--danger)';
  }

  if (!/^01[0-9]{9}$/.test(v('whatsapp'))) {
    errors.push('رقم الواتساب غير صحيح (يجب أن يبدأ بـ 01 ويتكون من 11 رقم)');
    fields.whatsapp.el.style.borderColor = 'var(--danger)';
  }

  if (!v('address')) {
    errors.push('يرجى إدخال العنوان');
    fields.address.el.style.borderColor = 'var(--danger)';
  }

  if (!v('qualification')) {
    errors.push('يرجى إدخال المؤهل الدراسي');
    fields.qualification.el.style.borderColor = 'var(--danger)';
  }

  if (!fields.committee_id.el.value) {
    errors.push('يرجى اختيار اللجنة');
    fields.committee_id.el.style.borderColor = 'var(--danger)';
  }

  if (errors.length) {
    msg.style.display = 'block'; msg.style.color = 'var(--danger)';
    msg.innerHTML = '<i class="fas fa-exclamation-circle"></i> يرجى تصحيح الأخطاء التالية:<ul style="margin:.4rem 0 0 1rem;text-align:right;font-size:.85rem;font-weight:400">' + errors.map(e => `<li style="margin:.2rem 0">• ${e}</li>`).join('') + '</ul>';
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال الطلب';
    return;
  }

  if (!supabaseClient) {
    msg.style.display = 'block'; msg.style.color = 'var(--danger)';
    msg.innerHTML = '<i class="fas fa-exclamation-circle"></i> حدث خطأ في الاتصال، حاول مرة أخرى';
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال الطلب';
    return;
  }

  try {
    const { error } = await supabaseClient.from('applications').insert({
      full_name: v('full_name'), national_id: v('national_id'),
      phone: v('phone'), whatsapp: v('whatsapp'),
      address: v('address'), qualification: v('qualification'),
      committee_id: fields.committee_id.el.value,
      experience: document.getElementById('jf-experience').value.trim()
    });
    if (error) throw error;
    msg.style.display = 'block'; msg.style.color = 'var(--success)';
    msg.innerHTML = '<i class="fas fa-check-circle"></i> تم إرسال الطلب بنجاح! ✔ سيتم التواصل معك قريباً';
    document.getElementById('joinForm').reset();
    document.querySelectorAll('.jf-inline-err').forEach(el => el.remove());
    document.querySelectorAll('.jf-group input, .jf-group select, .jf-group textarea').forEach(el => { el.style.borderColor = ''; el.disabled = true; });
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-check-circle"></i> تم إرسال الطلب';
    btn.style.background = 'var(--success)';
    document.querySelectorAll('.jf-next').forEach(el => el.disabled = true);
    return;
  } catch (e) {
    msg.style.display = 'block'; msg.style.color = 'var(--danger)';
    msg.innerHTML = '<i class="fas fa-exclamation-circle"></i> فشل الإرسال: ' + (e.message || e);
  }
  btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال الطلب';
}

/* ═══════════════════════════════════════════
   FORM SETTINGS
════════════════════════════════════════════ */
async function loadFormSettings() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient.from('app_settings').select('*').eq('id', 'form').single();
    if (error) return;
    if (!data) return;
    var isOpen = data.form_open;
    if (data.schedule_enabled && data.form_open_at && data.form_close_at) {
      const now = new Date();
      isOpen = now >= new Date(data.form_open_at) && now <= new Date(data.form_close_at);
    }
    if (!isOpen) {
      const wrap = document.querySelector('.join-form-wrap');
      if (wrap) {
        wrap.innerHTML = '<div style="text-align:center;padding:2rem;color:rgba(255,255,255,.8)"><i class="fas fa-clock" style="font-size:3rem;display:block;margin-bottom:1rem;opacity:.6"></i><p style="font-size:1.1rem;font-weight:700">' + esc(data.form_message || 'التقديم مغلق حالياً. سيتم فتحه قريباً.') + '</p></div>';
      }
      const btn = document.querySelector('.float-join-btn');
      if (btn) btn.style.display = 'none';
    }
  } catch (e) {}
}

/* ═══════════════════════════════════════════
   INIT
════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  document.documentElement.classList.add('js');
  showSkeletons();
  await loadDB();
  loadFormSettings();
  updateCommCounts();
  renderCommittees();
  renderNews();
  renderLeaders();
  initJoinForm();
  initInlineValidation();
  observeReveal();
  setTimeout(observeReveal, 100);
  setTimeout(observeReveal, 300);
});

// Keep Supabase awake
function pingSupabase() {
  if (!supabaseClient) return;
  supabaseClient.from('committees').select('id', { count: 'exact', head: true }).limit(1).then(() => {}).catch(() => {});
}
setInterval(pingSupabase, 300000); // كل 5 دقايق