import { Bodies } from "matter-js";
import { resolveStickerAsset } from "../processing/stickerAsset";

export function createStickerBody({ purchase, index, width }) {
  const stickerAsset = resolveStickerAsset(purchase);
  const scaleByGroup = { small: 0.18, medium: 0.25, large: 0.33 };
  const preferredScale = scaleByGroup[stickerAsset?.preferredScale] || scaleByGroup.medium;
  const stickerWidth = Math.min(width * 0.35, Math.max(56, width * preferredScale));
  const aspectRatio = Math.max(0.25, Math.min(4, Number(stickerAsset?.aspectRatio) || 1));
  const stickerHeight = stickerWidth / aspectRatio;
  const columns = width >= stickerWidth * 2 + 20 ? 2 : 1;
  const column = index % columns;
  const row = Math.floor(index / columns);
  const x = columns === 2 ? (column === 0 ? width * 0.30 : width * 0.70) : width * 0.5;
  const y = -stickerHeight - row * (stickerHeight + 22) - 20;
  const rotation = (((index * 37) % 240) / 10 - 12) * Math.PI / 180;
  const collisionPadding = Number(stickerAsset?.collisionPadding) || 0.92;

  return Bodies.rectangle(x, y, stickerWidth * collisionPadding, stickerHeight * collisionPadding, {
    label: purchase.id,
    chamfer: { radius: Math.min(18, stickerWidth * 0.12) },
    restitution: 0.05,
    friction: 0.82,
    frictionStatic: 0.95,
    frictionAir: 0.045,
    density: 0.0011,
    sleepThreshold: 45,
    angle: rotation,
    plugin: { purchase, stickerAsset, stickerWidth, stickerHeight, stickerSize: Math.max(stickerWidth, stickerHeight) }
  });
}
