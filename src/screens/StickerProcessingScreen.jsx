import { useEffect, useState } from "react";
import { useAppState } from "../state/AppState";
import { generateSticker } from "../processing/stickerGenerator";

export default function StickerProcessingScreen() {
  const { draft, backToPreview, finishSticker } = useAppState();
  const [progress, setProgress] = useState(3);
  const [status, setStatus] = useState("Reading your photo");

  useEffect(() => {
    let active = true;
    let completionTimer;
    const progressTimer = window.setInterval(() => {
      setProgress((current) => (current < 88 ? current + 1 : current));
    }, 160);

    generateSticker(draft.image, ({ progress: nextProgress }) => {
      if (!active) return;
      setProgress((current) => Math.max(current, nextProgress));
      if (nextProgress >= 55) setStatus("Cutting out your sticker");
    })
      .then((stickerAsset) => {
        if (!active) return;
        setProgress(100);
        setStatus("Sticker ready");
        completionTimer = window.setTimeout(() => finishSticker(stickerAsset), 320);
      })
      .catch(() => {
        if (!active) return;
        setProgress(100);
        setStatus("Photo ready");
        completionTimer = window.setTimeout(() => finishSticker(null), 320);
      })
      .finally(() => window.clearInterval(progressTimer));

    return () => {
      active = false;
      window.clearInterval(progressTimer);
      window.clearTimeout(completionTimer);
    };
  }, [draft.image, finishSticker]);

  return (
    <main className="flex min-h-[100dvh] flex-col overflow-hidden bg-white text-neutral-950">
      <header className="flex items-center justify-between px-6 pb-3 pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))]">
        <button className="min-h-11 px-1 text-sm text-neutral-400 transition active:scale-[0.98]" type="button" onClick={backToPreview}>Back</button>
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">Creating</span>
        <span className="w-10" aria-hidden="true" />
      </header>

      <section className="flex min-h-0 flex-1 items-center justify-center px-8 py-8">
        <img className="max-h-full max-w-full object-contain opacity-80" src={draft.image} alt="Photo being made into a sticker" />
      </section>

      <section className="px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-sm" aria-live="polite">
          <div className="mb-4 flex items-end justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">{status}</p>
            <output className="text-3xl font-semibold tabular-nums tracking-[-0.07em]" aria-label={`Sticker generation ${progress}%`}>{progress}%</output>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
            <div className="h-full rounded-full bg-neutral-950 transition-[width] duration-200 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>
    </main>
  );
}
