/* =========================================================
   Hero studs: a LEGO baseplate that lights up with live data
   from Mizavo (mizavo.gg).

   Each column of studs is one day, today at the right edge.
   Copper studs = chat answers in real streamer games,
   blue studs = daily-challenge plays. Height is scaled against
   the busiest day in view, so growth reads as a rising curve.

   Data: Mizavo's public, read-only Supabase function
   get_portfolio_stats (daily totals only, no names).
   The key below is Supabase's publishable key: it is meant to
   be public, and the database decides what it can read.
   ========================================================= */
(function () {
    const host = document.querySelector('.stud-layer');
    const plate = document.querySelector('.hero-studs');
    if (!host) return;

    const API = 'https://puhnuwstlujkvevsromj.supabase.co/rest/v1/rpc/get_portfolio_stats';
    const KEY = 'sb_publishable_hu0RB8qzJWkgLMXkVh7tgg_GrV5EpA9';
    const DAYS = 60;
    const REFRESH_MS = 5 * 60 * 1000;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const live = document.querySelector('.hero-live');
    const liveStats = document.querySelector('.hero-live-stats');
    const tip = document.createElement('div');
    tip.className = 'stud-tip';
    tip.setAttribute('role', 'status');
    host.appendChild(tip);

    let data = null;
    let firstPaint = true;

    const fmt = n => Number(n).toLocaleString('en-US');
    const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many}`;
    const dayLabel = iso => {
        const [y, m, d] = iso.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // rows of studs for one day's activity, scaled against the busiest day in view
    // (square-root scale: big days stand out, small days still get a stud; 0 = quiet day)
    const rowsFor = (a, max, maxRows) => (a <= 0 || max <= 0 ? 0 : Math.max(1, Math.round(maxRows * Math.sqrt(a / max))));

    function layout() {
        const pitch = window.innerWidth < 700 ? 26 : 32;
        const W = host.clientWidth;
        const H = host.clientHeight;
        const cols = Math.floor(W / pitch) - (window.innerWidth < 700 ? 1 : 2); // leave a margin on the right
        // keep lit studs below the text block on the left side of the hero
        const text = document.querySelector('.hero-text');
        let textRight = 0, rowsUnderText = 99;
        if (text) {
            const hr = host.getBoundingClientRect();
            const tr = text.getBoundingClientRect();
            textRight = tr.right - hr.left + 24;
            rowsUnderText = Math.max(1, Math.floor((hr.bottom - tr.bottom - 24) / pitch));
        }
        const maxRows = Math.min(window.innerWidth < 700 ? 5 : 9, Math.floor(H / pitch) - 2);
        return { pitch, cols, textRight, rowsUnderText, maxRows };
    }

    function render() {
        const { pitch, cols, textRight, rowsUnderText, maxRows } = layout();
        host.style.setProperty('--pitch', pitch + 'px');
        if (plate) plate.style.setProperty('--pitch', pitch + 'px');
        host.querySelectorAll('.stud-col').forEach(n => n.remove());

        const days = data ? data.days.slice(-cols) : [];
        const frag = document.createDocumentFragment();
        const offset = cols - days.length; // columns with no data yet (before the window)
        const peak = days.reduce((m, d) => Math.max(m, (d.answers || 0) + (d.solo || 0)), 0);

        days.forEach((day, i) => {
            const c = offset + i;
            const x = c * pitch;
            const answers = day.answers || 0;
            const solo = day.solo || 0;
            const total = answers + solo;
            let rows = rowsFor(total, peak, maxRows);
            if (x + pitch > 0 && x < textRight) rows = Math.min(rows, rowsUnderText);
            const isToday = i === days.length - 1;

            const col = document.createElement('div');
            col.className = 'stud-col' + (isToday ? ' is-today' : '') + (rows === 0 ? ' is-quiet' : '');
            col.style.left = x + 'px';
            col.style.width = pitch + 'px';
            col.style.height = Math.max(1, rows) * pitch + 'px';
            col.dataset.tip = `${isToday ? 'Today' : dayLabel(day.date)} · ${plural(answers, 'chat answer', 'chat answers')} · ${plural(solo, 'daily challenge', 'daily challenges')}`;

            // blue (daily challenge) studs sit at the bottom, copper on top
            const soloRows = total ? Math.min(rows, Math.max(solo ? 1 : 0, Math.round(rows * solo / total))) : 0;
            for (let r = 0; r < Math.max(rows, 1); r++) {
                const s = document.createElement('i');
                s.className = 'stud ' + (rows === 0 ? 'stud--ghost' : r < soloRows ? 'stud--solo' : 'stud--chat');
                if (rows && r === rows - 1) s.classList.add('stud--top');
                s.style.bottom = (r * pitch + pitch * 0.22) + 'px';
                if (!reduceMotion && firstPaint) s.style.animationDelay = (c * 0.03 + r * 0.05).toFixed(2) + 's';
                col.appendChild(s);
            }
            frag.appendChild(col);
        });
        host.appendChild(frag);
        host.classList.toggle('is-animated', !reduceMotion && firstPaint);
        firstPaint = false;
    }

    function renderLive() {
        if (!live || !data) return;
        const today = data.days[data.days.length - 1] || { answers: 0, solo: 0 };
        const t = data.totals || {};
        const quiet = !today.answers && !today.solo;
        const windowSum = key => data.days.reduce((a, d) => a + (d[key] || 0), 0);
        const items = quiet
            ? [['k-chat', `${plural(windowSum('answers'), 'chat answer', 'chat answers')} in ${data.days.length} days`],
               ['k-solo', plural(windowSum('solo'), 'daily challenge', 'daily challenges')]]
            : [['k-chat', `${plural(today.answers, 'chat answer', 'chat answers')} today`],
               ['k-solo', plural(today.solo, 'daily challenge', 'daily challenges')]];
        if (t.questions) items.push([null, `${fmt(t.questions)} questions in the bank`]);
        liveStats.replaceChildren(...items.map(([dot, text]) => {
            const span = document.createElement('span');
            if (dot) { const k = document.createElement('i'); k.className = 'k ' + dot; span.appendChild(k); }
            span.appendChild(document.createTextNode(text));
            return span;
        }));
        live.hidden = false;
    }

    async function load() {
        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { apikey: KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ p_days: DAYS })
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            data = await res.json();
            render();
            renderLive();
        } catch (e) {
            // no data: keep the plain baseplate, hide the live line
            if (!data) render();
        }
    }

    // hover / tap a column to see that day's numbers
    host.addEventListener('pointerover', e => {
        const col = e.target.closest('.stud-col');
        if (!col) return;
        tip.textContent = col.dataset.tip;
        const left = Math.min(parseFloat(col.style.left), host.clientWidth - tip.offsetWidth - 12);
        tip.style.left = Math.max(8, left) + 'px';
        tip.style.bottom = parseFloat(col.style.height) + 14 + 'px';
        tip.classList.add('is-on');
    });
    host.addEventListener('pointerout', e => {
        if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('.stud-col')) tip.classList.remove('is-on');
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(render, 150);
    });

    load();
    setInterval(() => { if (!document.hidden) load(); }, REFRESH_MS);
})();

/* Typewriter tagline: types once, then the cursor keeps blinking */
(function () {
    const el = document.querySelector('.hero-typed');
    if (!el) return;
    const full = el.getAttribute('data-text') || '';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = full; return; }
    el.textContent = '';
    let i = 0;
    setTimeout(function type() {
        el.textContent = full.slice(0, ++i);
        if (i < full.length) setTimeout(type, full[i - 1] === '/' ? 140 : 42 + Math.random() * 40);
    }, 900);
})();
