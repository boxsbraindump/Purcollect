import { Bodies } from "matter-js";

export function createStickerBody({ purchase, index, width }) {
  const stickerSize = Math.min(174, Math.max(118, width * 0.42));
  const columns = width >= stickerSize * 2 + 20 ? 2 : 1;
  const column = index % columns;
  const row = Math.floor(index / columns);
  const x = columns === 2 ? (column === 0 ? width * 0.30 : width * 0.70) : width * 0.5;
  const y = -stickerSize - row * (stickerSize + 22) - 20;

  return Bodies.rectangle(x, y, stickerSize, stickerSize, {
    label: purchase.id,
    chamfer: { radius: 22 },
    restitution: 0.08,
    friction: 0.72,
    frictionStatic: 0.9,
    frictionAir: 0.025,
    density: 0.0012,
    angle: ((index % 5) - 2) * 0.045,
    plugin: { purchase, stickerSize }
  });
}
