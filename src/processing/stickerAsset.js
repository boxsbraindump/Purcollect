export function resolveStickerAsset(purchase) {
  if (purchase?.stickerAsset?.image) return purchase.stickerAsset;
  const image = purchase?.sticker || purchase?.image;
  if (!image) return null;

  // Compatibility shape for purchases made before StickerAsset existed.
  return {
    id: `legacy-${purchase.id}`,
    image,
    width: 1,
    height: 1,
    aspectRatio: 1,
    preferredScale: "medium",
    collisionShape: { type: "rectangle" },
    collisionPadding: 0.92,
    outlineWidth: 6,
    shadowPreset: "soft"
  };
}
