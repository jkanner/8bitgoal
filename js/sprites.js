/*
 * 8bitgoal sprite sheet.
 *
 * Every boss is hand-drawn pixel art in an NES-style palette.
 * Rows are strings: each character is a palette key, "." is transparent.
 * When `mirror` is true, each row holds only the LEFT half of the sprite and
 * is mirrored to build the right half (keeps symmetric sprites tidy).
 */
(function () {
  'use strict';

  // A subset of the NES master palette.
  const NES = {
    black: '#000000',
    white: '#fcfcfc',
    gray1: '#545454',
    gray2: '#7c7c7c',
    gray3: '#bcbcbc',
    red: '#d82800',
    darkRed: '#a81000',
    orange: '#e45c10',
    gold: '#f8b800',
    cream: '#fce0a8',
    green: '#00a800',
    lime: '#b8f818',
    blue: '#0058f8',
    sky: '#3cbcfc',
    cyan: '#00e8d8',
    violet: '#6844fc',
    indigo: '#4428bc',
    lavender: '#9878f8',
  };

  const DEFS = {
    slime: {
      label: 'Slime',
      mirror: true,
      palette: { k: NES.black, g: NES.green, G: NES.lime, w: NES.white, y: NES.gold, r: NES.red },
      rows: [
        '........',
        '.....y.y',
        '.....yyy',
        '.....yry',
        '....kkkk',
        '...kgGGg',
        '..kgGggg',
        '.kggwwkg',
        '.kggwkkg',
        'kggggggg',
        'kggkgggg',
        'kgggkkkk',
        'kggggggg',
        'kggggggg',
        '.kkkkkkk',
        '........',
      ],
    },
    wisp: {
      label: 'Wisp',
      mirror: true,
      palette: { k: NES.black, r: NES.red, o: NES.orange, y: NES.gold, w: NES.white },
      rows: [
        '.......r',
        '......rr',
        '..r...ro',
        '..rr.roo',
        '.rro.roy',
        '.roorooy',
        'rooyooyy',
        'rooywwyy',
        'royykwyy',
        'royykwyy',
        'royyyyyy',
        'royyykkk',
        '.royyyyy',
        '.rooyyyy',
        '..rroooo',
        '....rrrr',
      ],
    },
    golem: {
      label: 'Golem',
      mirror: true,
      palette: { k: NES.black, d: NES.gray2, g: NES.gray3, l: NES.white, c: NES.cyan },
      rows: [
        '........',
        '...kkkkk',
        '..kllggg',
        '..klgggg',
        '..kgcckg',
        '..kggggg',
        '..kgkkkk',
        'kkkkdddd',
        'kllgkggg',
        'klggkddd',
        'kggdkggg',
        'kddkkggg',
        '.kkkgggd',
        '..kggkkk',
        '.kllgk..',
        '.kkkkk..',
      ],
    },
    owl: {
      label: 'Owl',
      mirror: true,
      palette: { k: NES.black, b: NES.blue, l: NES.sky, w: NES.white, y: NES.gold },
      rows: [
        '........',
        '.k......',
        '.kk.....',
        '.kbkkkkk',
        '.kbbbbbb',
        'kbwwwbbb',
        'kbwkwbbb',
        'kbwwwbby',
        'kbbbbbby',
        'kbbbllll',
        'kbblwlwl',
        'kbblllll',
        'kbbllwlw',
        '.kbbllll',
        '..kkkkkk',
        '...y.y..',
      ],
    },
    bat: {
      label: 'Bat',
      mirror: true,
      palette: { k: NES.black, p: NES.violet, r: NES.red, w: NES.white },
      rows: [
        '........',
        '........',
        '........',
        'k.......',
        'kk....k.',
        'kpk...kp',
        'kppk.kpp',
        'kpppkppp',
        'kppppprp',
        'kppppppp',
        'kpkpppwp',
        'kk.kpppp',
        'k...kppp',
        '.....kpp',
        '......kk',
        '........',
      ],
    },
    shroom: {
      label: 'Mushroom',
      mirror: true,
      palette: { k: NES.black, r: NES.red, w: NES.white, s: NES.cream },
      rows: [
        '........',
        '.....kkk',
        '...kkrrr',
        '..krrwwr',
        '.krrwwwr',
        '.krrrwrr',
        'krwrrrrr',
        'kwwwrrrr',
        'krwrrrrr',
        '.kkkkkkk',
        '...kssss',
        '...kssks',
        '...ksssk',
        '...kssss',
        '....kkkk',
        '........',
      ],
    },
    skull: {
      label: 'Skull',
      mirror: true,
      palette: { k: NES.black, w: NES.white, g: NES.gray2, l: NES.gray3, r: NES.red },
      rows: [
        '........',
        '...kkkkk',
        '..kwwwww',
        '.kwwwwww',
        '.kwkkkww',
        '.kwkrkww',
        '.kwkkkww',
        '.kwwwwwk',
        '..kwwwww',
        '...kwkwk',
        '...kwkwk',
        '....kkkk',
        '.kkkgggg',
        'kgggglgg',
        'kgggggrr',
        'kggggggg',
      ],
    },
    crab: {
      label: 'Crab',
      mirror: true,
      palette: { k: NES.black, o: NES.orange, r: NES.darkRed, y: NES.gold, w: NES.white },
      rows: [
        '........',
        '.kk.....',
        'kook....',
        'ko.k....',
        'kook....',
        '.kok.kwk',
        '..kk.kkk',
        '...k..k.',
        '...kkkkk',
        '..korroo',
        '.kooyooo',
        'kooyyooo',
        'kooooyoo',
        '.kkkkkkk',
        '.k.k.k..',
        'k.k.k...',
      ],
    },
    dragon: {
      label: 'Dragon',
      mirror: true,
      palette: {
        k: NES.black, d: NES.indigo, p: NES.lavender, y: NES.gold, r: NES.red, w: NES.white,
      },
      rows: [
        'k...........',
        'kk..........',
        'kpk.........',
        'kppk........',
        '.kppk.......',
        '.kpppk..kkkk',
        '..kpppkkdddd',
        '..kkppkddpdd',
        '...kkkdddddd',
        '...kddddpddd',
        '..kddkkkdddd',
        '..kdkyyrkddd',
        '..kddkkkdddd',
        '..kdddpddddd',
        '..kddddddkdd',
        '..kdkkkkkkkk',
        '..kdkwkwkwkw',
        '..kdkrrrrrrr',
        '..kdkrwrwrwr',
        '..kddkkkkkkk',
        '...kdddddddd',
        '....kkdddddd',
        '......kkkkkk',
        '............',
      ],
    },
  };

  const GRAYS = [NES.black, NES.gray1, NES.gray2, NES.gray3];

  function toGray(hex) {
    const n = parseInt(hex.slice(1), 16);
    const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    if (lum < 0.08) return NES.black;
    return GRAYS[Math.min(GRAYS.length - 1, 1 + Math.floor(lum * (GRAYS.length - 1)))];
  }

  const cache = {};

  function build(key) {
    const def = DEFS[key];
    const pixels = def.rows.map((row, r) => {
      const full = def.mirror ? row + row.split('').reverse().join('') : row;
      return full.split('').map((ch, c) => {
        if (ch === '.') return null;
        const color = def.palette[ch];
        if (!color) console.warn(`sprite ${key}: unknown key "${ch}" at ${r},${c}`);
        return color || null;
      });
    });
    const w = pixels[0].length;
    pixels.forEach((row, r) => {
      if (row.length !== w) console.warn(`sprite ${key}: row ${r} has width ${row.length}, expected ${w}`);
    });
    return { key, label: def.label, w, h: pixels.length, pixels };
  }

  function get(key) {
    if (!DEFS[key]) key = 'slime';
    return cache[key] || (cache[key] = build(key));
  }

  const MODES = {
    normal: (c) => c,
    gray: toGray,
    silhouette: () => '#24244a',
  };

  /** Draw a sprite into a new <canvas> at native resolution; CSS scales it up. */
  function canvas(key, opts = {}) {
    const sp = get(key);
    const mode = MODES[opts.mode] || MODES.normal;
    const el = document.createElement('canvas');
    el.width = sp.w;
    el.height = sp.h;
    el.className = 'sprite';
    if (opts.scale) {
      el.style.width = sp.w * opts.scale + 'px';
      el.style.height = sp.h * opts.scale + 'px';
    }
    el.setAttribute('aria-hidden', 'true');
    const ctx = el.getContext('2d');
    sp.pixels.forEach((row, y) =>
      row.forEach((color, x) => {
        if (!color) return;
        ctx.fillStyle = mode(color);
        ctx.fillRect(x, y, 1, 1);
      })
    );
    return el;
  }

  window.SPRITES = {
    keys: Object.keys(DEFS),
    has: (key) => Object.prototype.hasOwnProperty.call(DEFS, key),
    get,
    canvas,
    gray: toGray,
  };
})();
