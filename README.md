# Purcollect

React + Vite + Tailwind CSS + Matter.js prototype for turning purchases into physical sticker objects.

## Run locally

```bash
npm install
npm run dev
```

React owns screen flow and purchase state. `StickerPhysicsCanvas` owns Matter.js engine creation, gravity, collision walls, resize handling, cleanup, and body restoration. Purchases persist in `localStorage`.

Build for static hosting with `npm run build`; the generated `dist/` folder is the deployable Vite output.
