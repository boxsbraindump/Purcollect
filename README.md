# Purcollect

Purcollect is a mobile-first MVP prototype for turning a purchase into a collectible sticker.

## Run locally

Open [collect-mvp.html](outputs/collect-mvp.html) directly in a browser.

The prototype includes:

- black-and-white product UI with colorful stickers
- swipe-up or click-to-open capture flow
- photo upload or sample photo
- preview, retake, and use-photo states
- in-browser subject/background removal with a white sticker outline
- required amount entry
- automatic local save and sticker drop animation

The photo cutout uses `@imgly/background-removal` in the browser. The first real photo may take longer while the model assets load; later photos reuse the browser cache. For live camera access, open the GitHub Pages version or another HTTPS/localhost origin.
