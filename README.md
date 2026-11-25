# 8bitgoal

A goal tracker web app styled like an NES game. Your goals become a quest
against **8 stage bosses** and a **final boss**:

- Every boss has **4 HP**, one for each accomplishment you set.
- Checking off an accomplishment lands a hit. The fourth hit defeats the boss.
- The final boss stays locked until all 8 stage bosses are defeated.
- You can rename any boss, give it a "quest" (the goal area it stands for, like
  *Get fit*) and pick its pixel-art sprite.

Progress is saved in your browser (`localStorage`). Use **EXPORT SAVE** and
**IMPORT SAVE** on the stage-select screen to back up your progress or move it
to another device.

## Running it

It's a static site with no build step and no dependencies. Open `index.html`
in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Project layout

| File | Purpose |
| --- | --- |
| `index.html` | Page shell |
| `css/style.css` | NES-style UI |
| `js/sprites.js` | Pixel-art boss sprites (palette + row strings) and canvas renderer |
| `js/app.js` | State, saving, the stage-select and boss screens, battle animations, chiptune sound effects |

### Adding or editing a sprite

Sprites live in `js/sprites.js`. Each one is a list of row strings. Every
character is a key into that sprite's palette, and `.` is transparent. With
`mirror: true`, each row is only the left half and gets mirrored to build the
right half. Any key you add to `DEFS` shows up automatically in the artwork
picker.

### Built with AI

This app was created using AI tools