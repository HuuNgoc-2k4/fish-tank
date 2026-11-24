# Fish Tank: notes for Claude

Electron desktop overlay for Windows: a neon aquarium on the desktop plus cartoon pets on the taskbar. The UI is in Vietnamese.

## Testing
- Verify with code tests only: run `npm test` (node:test, `test/*.test.js`) and `node --check` on the files you changed.
- Do **not** test in a browser or the preview pane. The user runs the app on Windows and reports back.
- Logic that can be tested belongs in `src/core/*` (pure, no DOM at load time) and `src/main/config.js`. Add tests there for new behaviour.

## Layout
- `src/core/`: simulation and drawing shared by the windows: `fish.js`, `decor.js`, `pet.js` (simulation), `pet-draw.js` (cat/dog/fox + shared drawing helpers), `pet-fancy.js` (the "Mèo điệu" model), `mood.js`, `neon.js`.
- `src/main/`: Electron main process (`index.js`), config sanitize and migration (`config.js`).
- `src/renderer/{aquarium,pet,settings}`: the three windows. They talk to main only through `window.bridge` (`src/preload/preload.js`).

## Pet models
- Pets are drawn in code only. There is no user image upload: flat images sliding sideways looked bad and were removed on purpose.
- When the user sends a picture to turn into a pet, draw it as a new model file (like `pet-fancy.js`). Add it to `Pet.TYPES` and register it in `PetDraw.models`, then load the script in `renderer/pet` and `renderer/settings`.
- Every model needs several angles and expressions:
  - side view while walking, running or playing, with stride, arm swing and flowing tail;
  - front view when idle, sitting, held up, jumping, waving or grooming;
  - back view when sulking, and curled up when asleep;
  - a face for each state (happy, closed, wide/surprised, annoyed brows, dizzy, yawning, chewing...).
- Cover every state in `test/pet.test.js` (the "every type and state draws" test runs all types).

## GUI style
- The settings window is minimal and monochrome: black, white and greys only, with no accent colour, emoji, neon, glow or gradients. Use thin-line SVG icons. It follows the system light/dark theme.
- The pet's right-click menu follows the same style. In-world effects (fish neon, speech bubbles, hearts) may keep their colours.

## Workflow
- The user pulls on Windows (`git pull`, `npm install`, `npm start`), so commit and push finished work.
