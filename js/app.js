(function () {
  'use strict';

  const STORAGE_KEY = '8bitgoal.v1';
  const TASKS = 4;
  const FINAL = 8; // index of the final boss
  const NAME_MAX = 16;
  const QUEST_MAX = 28;
  const TASK_MAX = 80;

  const DEFAULT_BOSSES = [
    { name: 'SLIME KING', sprite: 'slime' },
    { name: 'EMBER WISP', sprite: 'wisp' },
    { name: 'IRON GOLEM', sprite: 'golem' },
    { name: 'FROST OWL', sprite: 'owl' },
    { name: 'GLOOM BAT', sprite: 'bat' },
    { name: 'SPORE CAP', sprite: 'shroom' },
    { name: 'BONE KNIGHT', sprite: 'skull' },
    { name: 'VOLT CRAB', sprite: 'crab' },
    { name: 'DREAD WYRM', sprite: 'dragon' },
  ];

  const app = document.getElementById('app');
  const soundBtn = document.getElementById('sound-toggle');
  const importInput = document.getElementById('import-file');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
  const nowIso = () => new Date().toISOString();

  // ---------------------------------------------------------------- state

  function blankTasks() {
    return Array.from({ length: TASKS }, () => ({ text: '', done: false, doneAt: null }));
  }

  function freshState() {
    return {
      version: 1,
      sound: true,
      bosses: DEFAULT_BOSSES.map((d, i) => ({
        id: i, name: d.name, sprite: d.sprite, quest: '', tasks: blankTasks(), defeatedAt: null,
      })),
    };
  }

  /** Accept anything (old saves, imported files) and coerce it into a valid state. */
  function normalize(data) {
    const s = freshState();
    if (!data || typeof data !== 'object' || !Array.isArray(data.bosses)) return s;
    s.sound = data.sound !== false;
    s.bosses.forEach((b, i) => {
      const src = data.bosses[i];
      if (!src || typeof src !== 'object') return;
      const name = str(src.name, NAME_MAX).trim();
      if (name) b.name = name;
      if (SPRITES.has(src.sprite)) b.sprite = src.sprite;
      b.quest = str(src.quest, QUEST_MAX);
      const tasks = Array.isArray(src.tasks) ? src.tasks : [];
      b.tasks = b.tasks.map((_, j) => {
        const t = tasks[j] && typeof tasks[j] === 'object' ? tasks[j] : {};
        const text = str(t.text, TASK_MAX);
        const done = !!t.done && text.trim() !== '';
        return { text, done, doneAt: done ? str(t.doneAt, 40) || null : null };
      });
      b.defeatedAt = isDefeated(b) ? str(src.defeatedAt, 40) || nowIso() : null;
    });
    return s;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? normalize(JSON.parse(raw)) : freshState();
    } catch (e) {
      return freshState();
    }
  }

  let saveWarned = false;
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      if (!saveWarned) {
        saveWarned = true;
        alert('This browser would not let 8bitgoal save your progress. Use EXPORT SAVE to keep a backup.');
      }
    }
  }

  function isDefeated(b) { return b.tasks.every((t) => t.done); }
  const hpLeft = (b) => b.tasks.filter((t) => !t.done).length;
  const defeatedCount = () => state.bosses.slice(0, FINAL).filter(isDefeated).length;
  const finalUnlocked = () => defeatedCount() === FINAL;
  const isLocked = (b) => b.id === FINAL && !finalUnlocked();
  const goalsSet = (b) => b.tasks.filter((t) => t.text.trim()).length;
  const fmtDate = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  };

  let state = load();

  // ---------------------------------------------------------------- sound (square-wave chiptune)

  const Sound = {
    ctx: null,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },
    tone(freq, start, dur, opts = {}) {
      const ac = this.ctx;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = opts.type || 'square';
      osc.frequency.setValueAtTime(freq, start);
      if (opts.slide) osc.frequency.exponentialRampToValueAtTime(opts.slide, start + dur);
      const vol = opts.vol || 0.05;
      gain.gain.setValueAtTime(vol, start);
      gain.gain.setValueAtTime(vol, start + dur * 0.7);
      gain.gain.linearRampToValueAtTime(0, start + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    },
    noise(start, dur, vol = 0.08) {
      const ac = this.ctx;
      const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
      const data = buf.getChannelData(0);
      // Stepped noise sounds more like the NES noise channel than white noise.
      let v = 0;
      for (let i = 0; i < data.length; i++) {
        if (i % 24 === 0) v = Math.random() * 2 - 1;
        data[i] = v * (1 - i / data.length);
      }
      const src = ac.createBufferSource();
      const gain = ac.createGain();
      gain.gain.value = vol;
      src.buffer = buf;
      src.connect(gain).connect(ac.destination);
      src.start(start);
    },
    play(name) {
      if (!state.sound) return;
      const ac = this.ensure();
      if (!ac) return;
      const t = ac.currentTime + 0.01;
      const notes = (list, step, opts) => list.forEach((f, i) => this.tone(f, t + i * step, step * 0.95, opts));
      switch (name) {
        case 'select':
          this.tone(988, t, 0.05); this.tone(1319, t + 0.05, 0.07);
          break;
        case 'hit':
          this.tone(620, t, 0.14, { slide: 110 });
          this.noise(t, 0.12, 0.06);
          break;
        case 'heal':
          notes([392, 523, 659], 0.06, { type: 'triangle', vol: 0.12 });
          break;
        case 'defeat':
          for (let i = 0; i < 6; i++) this.tone(700 - i * 60, t + i * 0.12, 0.08, { vol: 0.04 });
          this.noise(t + 0.9, 0.9, 0.1);
          [523, 659, 784, 1047, 784, 1047].forEach((f, i) =>
            this.tone(f, t + 1.9 + i * 0.11, i === 5 ? 0.4 : 0.1));
          break;
        case 'awaken':
          [196, 185, 175, 165].forEach((f, i) => this.tone(f, t + i * 0.35, 0.32, { type: 'triangle', vol: 0.18 }));
          break;
        case 'victory':
          [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) =>
            this.tone(f, t + i * 0.14, i === 7 ? 0.6 : 0.12));
          break;
      }
    },
  };

  // ---------------------------------------------------------------- arena (the boss "battle screen")

  const AW = 256;
  const AH = 208;
  const FLOOR = 184;

  function Arena(canvas) {
    this.ctx = canvas.getContext('2d');
    this.mode = 'alive';
    this.flashUntil = 0;
    this.whiteoutUntil = 0;
    this.particles = [];
    this.timers = [];
    this.last = 0;
    this.stars = Array.from({ length: 30 }, (_, i) => ({
      x: Math.floor(Math.random() * (AW / 2)) * 2,
      y: Math.floor(Math.random() * ((FLOOR - 24) / 2)) * 2,
      p: i % 6,
      c: i % 3 ? '#fcfcfc' : '#3cbcfc',
    }));
    this.frame = this.frame.bind(this);
    this.raf = requestAnimationFrame(this.frame);
  }

  Arena.prototype.set = function (key, mode) {
    this.sprite = SPRITES.get(key);
    this.mode = mode;
    this.particles = [];
  };

  Arena.prototype.layout = function () {
    const sp = this.sprite;
    const scale = Math.max(1, Math.floor(Math.min(168 / sp.h, 224 / sp.w)));
    return { scale, x: Math.floor((AW - sp.w * scale) / 2), y: FLOOR - sp.h * scale };
  };

  Arena.prototype.later = function (ms, fn) { this.timers.push(setTimeout(fn, ms)); };

  Arena.prototype.hit = function () { this.flashUntil = performance.now() + 500; };

  Arena.prototype.defeat = function (onDone) {
    this.mode = 'dying';
    this.flashUntil = performance.now() + 900;
    this.later(900, () => {
      this.burst();
      this.mode = 'exploding';
      this.whiteoutUntil = performance.now() + 90;
    });
    this.later(2300, () => {
      this.mode = 'defeated';
      if (onDone) onDone();
    });
  };

  Arena.prototype.burst = function () {
    const { scale, x, y } = this.layout();
    const sp = this.sprite;
    const cx = x + (sp.w * scale) / 2;
    const cy = y + (sp.h * scale) / 2;
    this.pscale = scale;
    this.particles = [];
    sp.pixels.forEach((row, r) =>
      row.forEach((color, c) => {
        if (!color) return;
        const px = x + c * scale;
        const py = y + r * scale;
        const ang = Math.atan2(py - cy, px - cx);
        const spd = 60 + Math.random() * 200;
        this.particles.push({
          x: px, y: py, color, life: 1,
          vx: Math.cos(ang) * spd + (Math.random() - 0.5) * 60,
          vy: Math.sin(ang) * spd - Math.random() * 140,
          decay: 0.55 + Math.random() * 0.5,
        });
      })
    );
  };

  Arena.prototype.destroy = function () {
    cancelAnimationFrame(this.raf);
    this.timers.forEach(clearTimeout);
  };

  Arena.prototype.drawSprite = function (x, y, scale, colorFn) {
    const ctx = this.ctx;
    this.sprite.pixels.forEach((row, r) =>
      row.forEach((color, c) => {
        if (!color) return;
        ctx.fillStyle = colorFn ? colorFn(color) : color;
        ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
      })
    );
  };

  Arena.prototype.frame = function (t) {
    const ctx = this.ctx;
    const dt = Math.min(0.05, (t - (this.last || t)) / 1000);
    this.last = t;

    // sky + twinkling stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, AW, AH);
    const twinkle = Math.floor(t / 350);
    this.stars.forEach((s) => {
      if (reducedMotion || (twinkle + s.p) % 7) {
        ctx.fillStyle = s.c;
        ctx.fillRect(s.x, s.y, 2, 2);
      }
    });

    // ground
    ctx.fillStyle = '#00a800';
    ctx.fillRect(0, FLOOR, AW, 4);
    ctx.fillStyle = '#503000';
    ctx.fillRect(0, FLOOR + 4, AW, AH - FLOOR - 4);
    ctx.fillStyle = '#ac7c00';
    for (let yy = FLOOR + 8, row = 0; yy < AH; yy += 8, row++) {
      for (let xx = (row % 2) * 8; xx < AW; xx += 16) ctx.fillRect(xx, yy, 4, 2);
    }

    if (this.sprite) {
      const { scale, x, y } = this.layout();
      const flashing = t < this.flashUntil;
      const blink = flashing && Math.floor(t / 70) % 2 === 0;
      const shake = flashing ? (Math.floor(t / 50) % 2 ? 1 : -1) * Math.round(scale / 2) : 0;
      const bob = !reducedMotion && !flashing && Math.floor(t / 450) % 2 ? scale : 0;
      switch (this.mode) {
        case 'alive':
        case 'dying':
          this.drawSprite(x + shake, y - (this.mode === 'alive' ? bob : 0), scale, blink ? () => '#fcfcfc' : null);
          break;
        case 'defeated':
          ctx.globalAlpha = 0.45;
          this.drawSprite(x, y, scale, SPRITES.gray);
          ctx.globalAlpha = 1;
          break;
        case 'locked':
          this.drawSprite(x, y - bob, scale, () => '#24244a');
          break;
      }
    }

    if (this.particles.length) {
      this.particles.forEach((p) => {
        p.vy += 420 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt;
      });
      this.particles = this.particles.filter((p) => p.life > 0 && p.y < AH);
      this.particles.forEach((p) => {
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5));
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), this.pscale, this.pscale);
      });
      ctx.globalAlpha = 1;
    }

    if (t < this.whiteoutUntil) {
      ctx.fillStyle = '#fcfcfc';
      ctx.fillRect(0, 0, AW, AH);
    }

    this.raf = requestAnimationFrame(this.frame);
  };

  // ---------------------------------------------------------------- views

  let arena = null;
  let busy = false; // true while a defeat animation plays

  const pips = (b, cls) =>
    `<span class="${cls}" role="img" aria-label="${hpLeft(b)} of ${TASKS} HP left">${b.tasks
      .map((t) => `<i class="${t.done ? 'gone' : ''}"></i>`)
      .join('')}</span>`;

  function card(b) {
    const isFinal = b.id === FINAL;
    const locked = isLocked(b);
    const dead = isDefeated(b);
    const set = goalsSet(b);
    let meta;
    if (locked) meta = 'DEFEAT ALL 8 TO UNLOCK';
    else if (dead) meta = 'DEFEATED ' + fmtDate(b.defeatedAt);
    else if (set < TASKS) meta = `${set}/${TASKS} GOALS SET`;
    else meta = `HP ${hpLeft(b)}/${TASKS}`;

    return `
      <a class="card ${isFinal ? 'card-final' : ''} ${dead ? 'is-dead' : ''} ${locked ? 'is-locked' : ''}" href="#/boss/${b.id}">
        <span class="card-art" data-art="${b.id}"></span>
        <span class="card-info">
          <span class="card-tag">${isFinal ? 'FINAL BOSS' : 'STAGE ' + (b.id + 1)}</span>
          <span class="card-name">${locked ? '? ? ?' : esc(b.name)}</span>
          <span class="card-quest">${b.quest ? esc(b.quest) : '&nbsp;'}</span>
          ${pips(b, 'pips')}
          <span class="card-meta">${meta}</span>
        </span>
        ${dead ? '<span class="stamp">DEFEATED</span>' : ''}
      </a>`;
  }

  function renderSelect() {
    const count = defeatedCount();
    const finalBoss = state.bosses[FINAL];
    const won = finalUnlocked() && isDefeated(finalBoss);

    app.innerHTML = `
      <section class="select">
        <h1 class="sr">Stage select</h1>
        <div class="status pixel-box">
          <span>BOSSES DEFEATED</span>
          <span class="trophies" aria-hidden="true">${state.bosses
            .slice(0, FINAL)
            .map((b) => `<i class="${isDefeated(b) ? 'on' : ''}"></i>`)
            .join('')}</span>
          <span class="count">${count}/${FINAL}</span>
        </div>
        ${won ? `
          <div class="victory pixel-box">
            <p class="blink">&#9733; CONGRATULATIONS &#9733;</p>
            <p>ALL 9 BOSSES DEFEATED.<br>EVERY GOAL CONQUERED!</p>
            <button class="btn gold" type="button" data-action="newgameplus">NEW GAME+</button>
          </div>` : ''}
        <div class="grid">${state.bosses.slice(0, FINAL).map(card).join('')}</div>
        <div class="final">${card(finalBoss)}</div>
        <div class="tools">
          <button class="btn small" type="button" data-action="export">EXPORT SAVE</button>
          <button class="btn small" type="button" data-action="import">IMPORT SAVE</button>
          <button class="btn small danger" type="button" data-action="reset">RESET ALL</button>
        </div>
      </section>`;

    app.querySelectorAll('[data-art]').forEach((el) => {
      const b = state.bosses[+el.dataset.art];
      const mode = isLocked(b) ? 'silhouette' : isDefeated(b) ? 'gray' : 'normal';
      el.appendChild(SPRITES.canvas(b.sprite, { scale: b.id === FINAL ? 6 : 5, mode }));
    });
  }

  function renderBoss(i) {
    const b = state.bosses[i];
    const isFinal = i === FINAL;
    const locked = isLocked(b);

    app.innerHTML = `
      <section class="boss-view">
        <nav class="boss-nav" aria-label="Boss navigation">
          <a class="btn small" href="#/">&#9664; ALL STAGES</a>
          <span class="nav-step">
            <a class="btn small" href="#/boss/${(i + FINAL) % (FINAL + 1)}" aria-label="Previous boss">&#9664;</a>
            <span>${isFinal ? 'FINAL BOSS' : 'STAGE ' + (i + 1)}</span>
            <a class="btn small" href="#/boss/${(i + 1) % (FINAL + 1)}" aria-label="Next boss">&#9654;</a>
          </span>
        </nav>
        <div class="boss-layout">
          <div class="arena-box pixel-box ${isFinal ? 'is-final' : ''}">
            <div class="hud">
              <h1 class="hud-name" id="hud-name"></h1>
              <span class="hud-hp"><span>HP</span><span id="hud-hp"></span></span>
            </div>
            <div class="arena-screen">
              <canvas id="arena" width="${AW}" height="${AH}" role="img" aria-label="Boss artwork"></canvas>
              ${locked ? '<div class="arena-lock" aria-hidden="true">?</div>' : ''}
              <div class="banner" id="banner" hidden></div>
            </div>
            <p class="caption" id="caption" aria-live="polite"></p>
          </div>

          <div class="panel pixel-box">
            <label class="field">
              <span>BOSS NAME</span>
              <input type="text" id="f-name" maxlength="${NAME_MAX}" autocomplete="off" spellcheck="false">
            </label>
            <label class="field">
              <span>QUEST <em>- WHAT GOAL IS THIS?</em></span>
              <input type="text" id="f-quest" maxlength="${QUEST_MAX}" autocomplete="off" placeholder="E.G. GET FIT">
            </label>
            <div class="field">
              <span id="picker-label">ARTWORK</span>
              <div class="picker" id="picker" role="radiogroup" aria-labelledby="picker-label"></div>
            </div>
            <h2 class="panel-title">ACCOMPLISHMENTS</h2>
            <p class="hint">${locked
              ? 'THE FINAL BOSS SLEEPS. YOU CAN PLAN ITS 4 ACCOMPLISHMENTS NOW, BUT CAN ONLY STRIKE ONCE ALL 8 BOSSES FALL.'
              : 'SET 4 ACCOMPLISHMENTS. CHECK ONE OFF TO LAND A HIT. 4 HITS DEFEATS THE BOSS!'}</p>
            <ol class="tasks" id="tasks">
              ${b.tasks.map((_, j) => `
                <li class="task" data-j="${j}">
                  <label class="check">
                    <input type="checkbox" data-j="${j}">
                    <span class="box" aria-hidden="true"></span>
                    <span class="sr">Accomplishment ${j + 1} complete</span>
                  </label>
                  <input type="text" class="task-text" data-j="${j}" maxlength="${TASK_MAX}"
                    placeholder="ACCOMPLISHMENT ${j + 1}" aria-label="Accomplishment ${j + 1}" autocomplete="off">
                </li>`).join('')}
            </ol>
          </div>
        </div>
      </section>`;

    const nameInput = document.getElementById('f-name');
    const questInput = document.getElementById('f-quest');
    nameInput.value = b.name;
    questInput.value = b.quest;
    app.querySelectorAll('.task-text').forEach((el) => { el.value = b.tasks[+el.dataset.j].text; });

    arena = new Arena(document.getElementById('arena'));
    arena.set(b.sprite, locked ? 'locked' : isDefeated(b) ? 'defeated' : 'alive');

    renderPicker(b);
    refreshBoss(b);

    nameInput.addEventListener('input', () => {
      b.name = nameInput.value.slice(0, NAME_MAX);
      refreshBoss(b);
      save();
    });
    nameInput.addEventListener('blur', () => {
      if (!b.name.trim()) {
        b.name = DEFAULT_BOSSES[i].name;
        nameInput.value = b.name;
        refreshBoss(b);
        save();
      }
    });
    questInput.addEventListener('input', () => {
      b.quest = questInput.value.slice(0, QUEST_MAX);
      save();
    });

    const tasksEl = document.getElementById('tasks');
    tasksEl.addEventListener('input', (e) => {
      if (!e.target.classList.contains('task-text')) return;
      b.tasks[+e.target.dataset.j].text = e.target.value.slice(0, TASK_MAX);
      refreshBoss(b);
      save();
    });
    tasksEl.addEventListener('change', (e) => {
      if (e.target.type !== 'checkbox') return;
      toggleTask(b, +e.target.dataset.j, e.target.checked);
    });
  }

  function renderPicker(b) {
    const picker = document.getElementById('picker');
    picker.innerHTML = '';
    SPRITES.keys.forEach((key) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pick';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(key === b.sprite));
      btn.setAttribute('aria-label', SPRITES.get(key).label);
      btn.title = SPRITES.get(key).label;
      btn.appendChild(SPRITES.canvas(key));
      btn.addEventListener('click', () => {
        if (busy || key === b.sprite) return;
        b.sprite = key;
        save();
        Sound.play('select');
        arena.set(key, isLocked(b) ? 'locked' : isDefeated(b) ? 'defeated' : 'alive');
        picker.querySelectorAll('.pick').forEach((p) =>
          p.setAttribute('aria-checked', String(p === btn)));
      });
      picker.appendChild(btn);
    });
  }

  /** Sync HUD, caption and task rows with state (without re-rendering inputs). */
  function refreshBoss(b) {
    const locked = isLocked(b);
    const dead = isDefeated(b);
    document.getElementById('hud-name').textContent = locked ? '? ? ?' : b.name || ' ';
    document.getElementById('hud-hp').outerHTML = pips(b, 'hpbar').replace('class="hpbar"', 'class="hpbar" id="hud-hp"');

    let caption;
    if (locked) caption = `DEFEAT ALL 8 STAGE BOSSES TO WAKE IT. (${defeatedCount()}/8)`;
    else if (dead) caption = 'DEFEATED ON ' + fmtDate(b.defeatedAt) + '. UNCHECK AN ACCOMPLISHMENT TO REVIVE IT.';
    else if (goalsSet(b) < TASKS) caption = `WRITE ALL 4 ACCOMPLISHMENTS TO PREPARE FOR BATTLE. (${goalsSet(b)}/4)`;
    else caption = hpLeft(b) === TASKS ? 'THE BOSS AWAITS. CHECK OFF AN ACCOMPLISHMENT TO STRIKE!' : `${hpLeft(b)} HIT${hpLeft(b) === 1 ? '' : 'S'} LEFT. KEEP GOING!`;
    document.getElementById('caption').textContent = caption;

    app.querySelectorAll('.task').forEach((li) => {
      const t = b.tasks[+li.dataset.j];
      const box = li.querySelector('input[type=checkbox]');
      const text = li.querySelector('.task-text');
      li.classList.toggle('done', t.done);
      box.checked = t.done;
      box.disabled = busy || locked || !t.text.trim();
      text.readOnly = t.done;
      text.title = t.done ? 'Uncheck to edit' : '';
    });
  }

  function toggleTask(b, j, checked) {
    const t = b.tasks[j];
    if (busy || isLocked(b) || (checked && !t.text.trim())) {
      refreshBoss(b);
      return;
    }
    const wasDead = isDefeated(b);
    t.done = checked;
    t.doneAt = checked ? nowIso() : null;

    if (checked && isDefeated(b)) {
      b.defeatedAt = nowIso();
      busy = true;
      Sound.play('defeat');
      arena.defeat(() => {
        busy = false;
        refreshBoss(b);
        showBanner(b);
      });
    } else if (checked) {
      Sound.play('hit');
      arena.hit();
    } else {
      if (wasDead) {
        b.defeatedAt = null;
        arena.set(b.sprite, 'alive');
        document.getElementById('banner').hidden = true;
      }
      Sound.play('heal');
    }
    save();
    refreshBoss(b);
  }

  function showBanner(b) {
    const banner = document.getElementById('banner');
    if (!banner) return;
    const count = defeatedCount();
    let title, lines, action;
    if (b.id === FINAL) {
      title = 'VICTORY!';
      lines = [`${esc(b.name)} HAS FALLEN.`, 'ALL GOALS CONQUERED!'];
      action = `<a class="btn gold" href="#/">CONTINUE</a>`;
      setTimeout(() => Sound.play('victory'), 300);
    } else if (count === FINAL && !isDefeated(state.bosses[FINAL])) {
      title = 'BOSS DEFEATED!';
      lines = ['ALL 8 BOSSES HAVE FALLEN...', 'THE FINAL BOSS AWAKENS!'];
      action = `<a class="btn danger" href="#/boss/${FINAL}">FACE THE FINAL BOSS</a>`;
      setTimeout(() => Sound.play('awaken'), 500);
    } else {
      title = 'BOSS DEFEATED!';
      const left = FINAL - count;
      lines = left > 0 ? [`${left} BOSS${left === 1 ? '' : 'ES'} REMAIN${left === 1 ? 'S' : ''}.`] : ['ALL STAGE BOSSES DEFEATED.'];
      action = `<a class="btn" href="#/">CONTINUE</a>`;
    }
    banner.innerHTML = `<h2>${title}</h2>${lines.map((l) => `<p>${l}</p>`).join('')}${action}
      <button class="btn small ghost" type="button" data-action="close-banner">STAY HERE</button>`;
    banner.hidden = false;
    banner.querySelector('a').focus();
  }

  // ---------------------------------------------------------------- save management

  function exportSave() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `8bitgoal-save-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  importInput.addEventListener('change', async () => {
    const file = importInput.files[0];
    importInput.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || !Array.isArray(data.bosses)) throw new Error('bad save');
      if (!confirm('Replace your current progress with this save file?')) return;
      state = normalize(data);
      save();
      syncSoundBtn();
      route();
    } catch (e) {
      alert('That file is not a valid 8bitgoal save.');
    }
  });

  app.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    switch (btn.dataset.action) {
      case 'export':
        exportSave();
        break;
      case 'import':
        importInput.click();
        break;
      case 'reset':
        if (confirm('Erase ALL bosses, names and accomplishments and start over? This cannot be undone. (Tip: EXPORT SAVE first.)')) {
          const sound = state.sound;
          state = freshState();
          state.sound = sound;
          save();
          route();
        }
        break;
      case 'newgameplus':
        if (confirm('Start NEW GAME+? Boss names, quests and artwork stay; all accomplishments are cleared.')) {
          state.bosses.forEach((b) => { b.tasks = blankTasks(); b.defeatedAt = null; });
          save();
          route();
        }
        break;
      case 'close-banner':
        document.getElementById('banner').hidden = true;
        break;
    }
  });

  // Little "select" blip whenever you move between screens.
  document.addEventListener('click', (e) => {
    if (e.target.closest('a[href^="#/"]')) Sound.play('select');
  });

  function syncSoundBtn() {
    soundBtn.textContent = state.sound ? 'SOUND ON' : 'SOUND OFF';
    soundBtn.setAttribute('aria-pressed', String(state.sound));
  }
  soundBtn.addEventListener('click', () => {
    state.sound = !state.sound;
    save();
    syncSoundBtn();
    Sound.play('select');
  });

  // ---------------------------------------------------------------- routing

  function route() {
    if (arena) {
      arena.destroy();
      arena = null;
    }
    busy = false;
    const m = location.hash.match(/^#\/boss\/(\d+)$/);
    if (m && +m[1] <= FINAL) renderBoss(+m[1]);
    else renderSelect();
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);
  // Keep tabs in sync if the app is open in two windows.
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && !busy) {
      state = load();
      syncSoundBtn();
      route();
    }
  });

  syncSoundBtn();
  route();
})();
