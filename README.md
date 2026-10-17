# Dice

A dice-rolling app for your phone. Pick a die, tap anywhere on the screen (or shake the phone) and watch it fly.

Works offline and installs to your home screen as a PWA.

## Dice

| Die | Notes |
| --- | --- |
| **D6** | Classic 3D cube with pips |
| **D20** | Natural 20 gives confetti, natural 1 gives a red flash and screen shake |
| **D4, D8, D10, D12** | The rest of the standard tabletop RPG set |
| **D100** | Percentile, 1–100 |
| **Fate / Fudge** | +, − and blank faces. Rolled as 4dF by default and shows the Fate ladder (Good, Great …) |
| **Coin** | Heads or tails, with a 3D flip |

Roll up to 8 dice at once. The app shows the total and adds each roll to the history.

## Effects

- Dice are thrown from where your finger touches and bounce when they land
- 3D tumbling cubes and coins, spinning polyhedral dice with flickering numbers
- Sparks and a shockwave on impact, a glow on max rolls
- Confetti and a banner for critical hits, embers and a screen shake for fumbles
- Sound effects made with Web Audio (no audio files) and vibration on Android
- Shake to roll (on iPhone, tap the phone icon to allow motion access)

## Install on your phone

The app deploys to GitHub Pages when you push to `main`. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions** once. The app is then at `https://<your-username>.github.io/dices/`.

- **iPhone (Safari):** Share → *Add to Home Screen*
- **Android (Chrome):** tap the download icon in the app, or ⋮ → *Install app*

## Development

```bash
npm install
npm run dev        # dev server; --host makes it reachable from your phone on the same Wi-Fi
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
```

Built with React, strict TypeScript, Tailwind CSS v4, Vite and `vite-plugin-pwa`.
