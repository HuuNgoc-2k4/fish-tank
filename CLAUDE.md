# Fish Tank: notes for Claude

Electron desktop overlay for Windows: a neon aquarium on the desktop plus cartoon pets on the taskbar. The UI is in Vietnamese.

## Testing
- Verify with code tests only: run `npm test` (node:test, `test/*.test.js`) and `node --check` on the files you changed.
- Do **not** test in a browser or the preview pane. The user runs the app on Windows and reports back.
- Logic that can be tested belongs in `src/core/*` (pure, no DOM at load time) and `src/main/config.js` / `petpacks.js`. Add tests there for new behaviour.

## Layout
- `src/core/`: simulation and drawing shared by the windows: `fish.js`, `decor.js`, `pet.js` (simulation), `pet-draw.js` (drawing), `mood.js`, `neon.js`.
- `src/main/`: Electron main process (`index.js`), config sanitize and migration (`config.js`), image pet folders (`petpacks.js`).
- `src/renderer/{aquarium,pet,settings}`: the three windows. They talk to main only through `window.bridge` (`src/preload/preload.js`).
- `assets/pets/<name>/pet.json`: image-based pets (format in README).

## Workflow
- The user pulls on Windows (`git pull`, `npm install`, `npm start`), so commit and push finished work.
