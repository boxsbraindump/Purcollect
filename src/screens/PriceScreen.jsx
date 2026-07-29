import { useEffect, useRef } from "react";
import { useAppState } from "../state/AppState";

export default function PriceScreen() {
  const { draft, updateAmount, backToPreview, collectPurchase } = useAppState();
  const amountInput = useRef(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => amountInput.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const amount = Number(draft.amount);
    if (!Number.isFinite(amount) || amount <= 0) return undefined;

    // This gives people time to finish typing amounts such as 200 before collecting.
    const timer = window.setTimeout(() => collectPurchase(), 900);
    return () => window.clearTimeout(timer);
  }, [collectPurchase, draft.amount]);

  const submitNow = () => {
    const amount = Number(draft.amount);
    if (Number.isFinite(amount) && amount > 0) collectPurchase();
  };

  return (
    <main className="flex min-h-[100dvh] flex-col overflow-hidden bg-white text-neutral-950">
      <header className="flex items-center justify-between px-6 pb-3 pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))]">
        <button className="min-h-11 px-1 text-sm text-neutral-400 transition active:scale-[0.98]" type="button" onClick={backToPreview}>Back</button>
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">Collect</span>
        <span className="w-10" aria-hidden="true" />
      </header>

      <section className="flex min-h-0 flex-[1.05] items-center justify-center px-8 pb-4 pt-2" aria-label="Your new sticker">
        <img className="max-h-full max-w-full object-contain drop-shadow-[0_20px_28px_rgba(0,0,0,0.12)]" src={draft.stickerAsset?.image || draft.image} alt="Your sticker" />
      </section>

      <section className="flex min-h-[40dvh] flex-1 flex-col justify-center px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-5">
        <div className="mx-auto flex w-full max-w-xl items-baseline justify-center">
          <span className="mr-2 select-none text-[clamp(4.5rem,18vw,8rem)] font-medium leading-none tracking-[-0.1em] text-neutral-950">$</span>
          <input
            ref={amountInput}
            className="min-w-0 flex-1 bg-transparent text-center text-[clamp(5.5rem,23vw,10rem)] font-medium leading-none tracking-[-0.115em] text-neutral-950 outline-none placeholder:text-neutral-200"
            inputMode="decimal"
            enterKeyHint="done"
            autoComplete="off"
            value={draft.amount}
            onChange={(event) => updateAmount(event.target.value.replace(/[^0-9.]/g, ""))}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitNow();
            }}
            placeholder="0"
            aria-label="Purchase amount"
          />
        </div>
      </section>
    </main>
  );
}
