import { useEffect, useState } from "react";
import { useAppState } from "../state/AppState";
import { generateSticker } from "../processing/stickerGenerator";

export default function PriceScreen() {
  const { draft, updateAmount, setSticker, backToPreview, collectPurchase } = useAppState();
  const [isMaking, setIsMaking] = useState(true);
  const [processingError, setProcessingError] = useState("");

  useEffect(() => {
    let active = true;
    setIsMaking(true);
    setProcessingError("");
    setSticker(null);

    generateSticker(draft.image)
      .then((stickerAsset) => {
        if (active) setSticker(stickerAsset);
      })
      .catch(() => {
        if (active) setProcessingError("Photo kept as a sticker");
      })
      .finally(() => {
        if (active) setIsMaking(false);
      });

    return () => {
      active = false;
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

  return (
    <main className="flex min-h-[100dvh] flex-col bg-white text-neutral-950">
      <header className="flex items-center justify-between px-6 pb-4 pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))]">
        <button className="text-sm text-neutral-500" type="button" onClick={backToPreview}>Back</button>
        <h1 className="text-sm font-semibold tracking-[-0.02em]">Add the amount</h1>
        <span className="w-8" aria-hidden="true" />
      </header>
      <section className="flex flex-1 flex-col items-center px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6">
        <div className="flex w-full max-w-sm flex-1 items-center justify-center p-8">
          <img className={`max-h-full max-w-full object-contain transition-opacity ${isMaking ? "opacity-45" : "opacity-100"}`} src={draft.stickerAsset?.image || draft.image} alt="Sticker being created" />
        </div>
        <p className="mt-5 text-xs uppercase tracking-[0.16em] text-neutral-400">{isMaking ? "Making your sticker" : processingError || "Sticker ready"}</p>
        <label className="mt-8 text-sm text-neutral-500" htmlFor="amount">Price is required</label>
        <div className="mt-3 flex items-center border-b-2 border-neutral-950 pb-2">
          <span className="mr-2 text-3xl font-light">$</span>
          <input id="amount" className="w-40 bg-transparent text-4xl font-medium tracking-[-0.08em] outline-none placeholder:text-neutral-300" inputMode="decimal" autoFocus value={draft.amount} onChange={(event) => updateAmount(event.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.00" aria-label="Purchase price" />
        </div>
        <p className="mt-3 h-6 text-center text-xs text-neutral-400">{isMaking ? "Enter the amount while it comes to life." : Number(draft.amount) > 0 ? "Collecting it now..." : "Enter an amount to continue."}</p>
      </section>
    </main>
  );
}
