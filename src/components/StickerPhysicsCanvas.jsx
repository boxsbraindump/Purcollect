import { useEffect, useRef } from "react";
import { Body, Bodies, Composite, Engine, Events } from "matter-js";
import { createStickerBody } from "../physics/stickerSpawner";
import { resolveStickerAsset } from "../processing/stickerAsset";

const MAX_GRAVITY = 1.45;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function drawSticker(context, body, image, dpr) {
  const stickerWidth = body.plugin?.stickerWidth || body.plugin?.stickerSize || 150;
  const stickerHeight = body.plugin?.stickerHeight || body.plugin?.stickerSize || 150;
  const hasBakedAsset = Boolean(body.plugin?.stickerAsset?.image);

  context.save();
  context.translate(body.position.x, body.position.y);
  context.rotate(body.angle);

  if (image?.complete && image.naturalWidth > 0) {
    // Compatibility path for old locally saved cutouts. New assets already
    // contain their white contour and must be drawn exactly once.
    if (!hasBakedAsset && body.plugin?.purchase?.stickerCutout) {
      const outline = Math.max(2.5, Math.min(stickerWidth, stickerHeight) * 0.026);
      context.filter = "brightness(0) invert(1)";
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        context.drawImage(
          image,
          -stickerWidth / 2 + Math.cos(angle) * outline,
          -stickerHeight / 2 + Math.sin(angle) * outline,
          stickerWidth,
          stickerHeight
        );
      }
      context.filter = "none";
    }

    context.shadowColor = "rgba(0, 0, 0, 0.12)";
    context.shadowBlur = 10 * dpr;
    context.shadowOffsetY = 4 * dpr;
    context.drawImage(image, -stickerWidth / 2, -stickerHeight / 2, stickerWidth, stickerHeight);
    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.shadowOffsetY = 0;
  } else {
    context.fillStyle = "#111111";
    context.font = `${Math.round(Math.min(stickerWidth, stickerHeight) * 0.28)}px system-ui`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("✦", 0, 0);
  }
  context.restore();
}

export default function StickerPhysicsCanvas({ purchases, onCanvasReady }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const bodiesRef = useRef(new Map());
  const imagesRef = useRef(new Map());
  const purchasesRef = useRef(purchases);

  useEffect(() => {
    purchasesRef.current = purchases;
  }, [purchases]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    const context = canvas.getContext("2d");
    const engine = Engine.create({ enableSleeping: true });
    engine.gravity.x = 0;
    engine.gravity.y = 1;
    engine.gravity.scale = 0.001;
    engineRef.current = engine;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let walls = [];
    let animationFrame = 0;
    let orientationAttached = false;
    let motionReady = false;

    function setCanvasSize() {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      walls.forEach((wall) => Composite.remove(engine.world, wall));
      walls = [
        Bodies.rectangle(width / 2, height + 18, width + 80, 36, { isStatic: true, label: "floor" }),
        Bodies.rectangle(-18, height / 2, 36, height + 80, { isStatic: true, label: "left-wall" }),
        Bodies.rectangle(width + 18, height / 2, 36, height + 80, { isStatic: true, label: "right-wall" }),
        Bodies.rectangle(width / 2, -18, width + 80, 36, { isStatic: true, label: "ceiling" })
      ];
      Composite.add(engine.world, walls);
      bodiesRef.current.forEach((body) => {
        const halfWidth = (body.plugin?.stickerWidth || body.plugin?.stickerSize || 150) / 2;
        const halfHeight = (body.plugin?.stickerHeight || body.plugin?.stickerSize || 150) / 2;
        Body.setPosition(body, {
          x: clamp(body.position.x, halfWidth + 2, width - halfWidth - 2),
          y: clamp(body.position.y, halfHeight + 2, height - halfHeight - 2)
        });
      });
    }

    function loadPurchaseImage(purchase) {
      const source = resolveStickerAsset(purchase)?.image;
      if (!source) return;
      const image = new Image();
      image.onload = () => imagesRef.current.set(purchase.id, image);
      image.src = source;
    }

    function syncBodies() {
      const currentIds = new Set(purchasesRef.current.map((purchase) => purchase.id));
      bodiesRef.current.forEach((body, id) => {
        if (!currentIds.has(id)) {
          Composite.remove(engine.world, body);
          bodiesRef.current.delete(id);
          imagesRef.current.delete(id);
        }
      });
      purchasesRef.current.forEach((purchase, index) => {
        if (bodiesRef.current.has(purchase.id)) return;
        const body = createStickerBody({ purchase, index, width });
        bodiesRef.current.set(purchase.id, body);
        Composite.add(engine.world, body);
        loadPurchaseImage(purchase);
      });
    }

    function draw() {
      context.clearRect(0, 0, width, height);
      bodiesRef.current.forEach((body) => drawSticker(context, body, imagesRef.current.get(body.label), dpr));
      Engine.update(engine, 1000 / 60);
      animationFrame = requestAnimationFrame(draw);
    }

    function guidePile() {
      bodiesRef.current.forEach((body) => {
        if (body.isSleeping) return;
        const distanceFromCenter = width / 2 - body.position.x;
        // A tiny center force keeps the collection balanced without turning the
        // pile into a rigid layout. Friction and sleeping still control settling.
        body.force.x += clamp(distanceFromCenter * 0.0000012, -0.00028, 0.00028) * body.mass;
        if (body.position.y > height * 0.72) {
          body.force.x += clamp(distanceFromCenter * 0.00000055, -0.00012, 0.00012) * body.mass;
        }
        const maxAngle = 25 * Math.PI / 180;
        if (body.angle > maxAngle && body.angularVelocity > 0) Body.setAngularVelocity(body, body.angularVelocity * 0.7);
        if (body.angle < -maxAngle && body.angularVelocity < 0) Body.setAngularVelocity(body, body.angularVelocity * 0.7);
      });
    }

    function setGravity(horizontal, vertical) {
      engine.gravity.x = clamp(horizontal, -MAX_GRAVITY, MAX_GRAVITY);
      engine.gravity.y = clamp(vertical, -MAX_GRAVITY, MAX_GRAVITY);
    }

    function onOrientation(event) {
      if (event.gamma == null && event.beta == null) return;
      motionReady = true;
      const horizontal = Math.sin((Number(event.gamma) || 0) * Math.PI / 180) * 1.3;
      const vertical = Math.sin((Number(event.beta) || 90) * Math.PI / 180);
      setGravity(horizontal, vertical);
    }

    function attachOrientation() {
      if (orientationAttached) return;
      window.addEventListener("deviceorientation", onOrientation, true);
      orientationAttached = true;
    }

    function onPointerMove(event) {
      if (motionReady) return;
      const rect = container.getBoundingClientRect();
      const horizontal = ((event.clientX - rect.left) / rect.width - 0.5) * 1.5;
      const vertical = 0.75 + ((event.clientY - rect.top) / rect.height - 0.5) * 0.55;
      setGravity(horizontal, vertical);
    }

    function requestMotion() {
      if (typeof window.DeviceOrientationEvent === "undefined") return;
      const requestPermission = window.DeviceOrientationEvent.requestPermission;
      if (typeof requestPermission === "function") {
        requestPermission.call(window.DeviceOrientationEvent).then((permission) => {
          if (permission === "granted") attachOrientation();
        }).catch(() => {});
      } else {
        attachOrientation();
      }
    }

    setCanvasSize();
    syncBodies();
    Events.on(engine, "beforeUpdate", guidePile);
    draw();
    onCanvasReady?.({ requestMotion });
    const resizeObserver = new ResizeObserver(setCanvasSize);
    resizeObserver.observe(container);
    container.addEventListener("pointermove", onPointerMove, { passive: true });
    if (typeof window.DeviceOrientationEvent !== "undefined" && typeof window.DeviceOrientationEvent.requestPermission !== "function") {
      attachOrientation();
    }

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("deviceorientation", onOrientation, true);
      cancelAnimationFrame(animationFrame);
      Events.off(engine, "beforeUpdate", guidePile);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      bodiesRef.current.clear();
      imagesRef.current.clear();
      engineRef.current = null;
    };
  }, [onCanvasReady]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const currentIds = new Set(purchases.map((purchase) => purchase.id));
    const bodyMap = bodiesRef.current;
    bodyMap.forEach((body, id) => {
      if (!currentIds.has(id)) {
        Composite.remove(engine.world, body);
        bodyMap.delete(id);
      }
    });
    purchases.forEach((purchase, index) => {
      if (bodyMap.has(purchase.id)) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const body = createStickerBody({ purchase, index, width: rect.width });
      bodyMap.set(purchase.id, body);
      Composite.add(engine.world, body);
      const source = resolveStickerAsset(purchase)?.image;
      if (source) {
        const image = new Image();
        image.onload = () => imagesRef.current.set(purchase.id, image);
        image.src = source;
      }
    });
    purchasesRef.current = purchases;
  }, [purchases]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden" aria-label="Physics sticker collection">
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
    </div>
  );
}
