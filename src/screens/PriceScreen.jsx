import { useEffect, useState } from "react";
import { useAppState } from "../state/AppState";
import { generateSticker } from "../processing/stickerGenerator";

export default function PriceScreen() {
  const { draft, updateAmount, setSticker, backToPreview, collectPurchase } = useAppState();
  const [isMaking, setIsMaking] = useState(true);
  const [progress, setProgress] = useState(4);
  const [processingError, setProcessingError] = useState("");

  useEffect(() => {
    let active = true;
    setIsMaking(true);
    setProgress(4);
    setProcessingError("");
    setSticker(null);

    const progressTimer = window.setInterval(() => {
      setProgress((current) => (current < 84 ? current + 1 : current));
    }, 180);

    generateSticker(draft.image, ({ progress: nextProgress }) => {
      if (active) setProgress((current) => Math.max(current, nextProgress));
    })
      .then((stickerAsset) => {
        if (active) {
          setProgress(100);
          setSticker(stickerAsset);
        }
      })
      .catch(() => {
        if (active) {
          setProgress(100);
          setProcessingError("Photo kept as a sticker");
        }
      })
      .finally(() => {
        if (active) setIsMaking(false);
      });

    return () => {
      active = false;
      window.clearInterval(progressTimer);
    };
    // setSticker is intentionally omitted: typing the amount must not restart image processing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.image]);

  useEffect(() => {
    const amount = Number(draft.amount);
    if (isMaking || !Number.isFinite(amount) || amount <= 0) return undefined;
    const timer = window.setTimeout(() => collectPurchase(), 320);
    return () => window.clearTimeout(timer);
  }, [collectPurchase, draft.amount, isMaking]);

  const statusLabel = processingError || (isMaking ? "Making your sticker" : "Sticker ready");

  return (
    <main className="grid min-h-[100dvh] grid-rows-[1fr_minmax(18rem,42dvh)] bg-white text-neutral-950">
      <section className="relative flex min-h-0 flex-col items-center px-6 pb-8 pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))]">
        <header className="flex w-full items-center justify-between">
          <button className="min-h-11 px-1 text-sm text-neutral-500 transition active:scale-[0.98]" type="button" onClick={backToPreview}>Back</button>
          <span className="text-sm font-semibold tracking-[-0.02em]">New purchase</span>
          <span className="w-10" aria-hidden="true" />
        </header>

        <div className="flex min-h-0 w-full flex-1 items-center justify-center py-5">
          <img className={`max-h-full max-w-[82vw] object-contain transition-opacity duration-300 ${isMaking ? "opacity-55" : "opacity-100"}`} src={draft.stickerAsset?.image || draft.image} alt="Sticker being created" />
        </div>

        <div className="w-full max-w-sm" aria-live="polite">
          <div className="mb-3 flex items-end justify-between">
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">{statusLabel}</p>
            <output className="text-2xl font-semibold tabular-nums tracking-[-0.06em]" aria-label={`Sticker generation ${progress}%`}>{progress}%</output>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-neutral-100" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
            <div className="h-full rounded-full bg-neutral-950 transition-[width] duration-200 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      <section className="flex min-h-0 flex-col justify-center border-t border-neutral-200 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7">
        <div className="mx-auto w-full max-w-sm">
          <label className="block text-xs uppercase tracking-[0.16em] text-neutral-400" htmlFor="amount">Purchase amount</label>
          <div className="mt-4 flex items-center border-b-2 border-neutral-950 pb-3">
            <span className="mr-3 text-5xl font-light leading-none">$</span>
            <input id="amount" className="min-w-0 flex-1 bg-transparent text-6xl font-medium leading-none tracking-[-0.08em] outline-none placeholder:text-neutral-200" inputMode="decimal" autoFocus value={draft.amount} onChange={(event) => updateAmount(event.target.value.replace(/[^0-9.]/g, ""))} placeholder="0" aria-label="Purchase amount" />
          </div>
          <p className="mt-4 h-6 text-sm text-neutral-400">{isMaking ? "Enter the amount while your sticker is made." : Number(draft.amount) > 0 ? "Adding to your collection..." : "Enter an amount to continue."}</p>
        </div>
      </section>
    </main>
  );
}
