import { useEffect } from "react";
import { useAppState } from "../state/AppState";

const numberKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"];

function appendAmount(current, key) {
  if (key === ".") {
    if (current.includes(".")) return current;
    return current ? `${current}.` : "0.";
  }
  if (current.length >= 9) return current;
  if (current === "0") return key;
  return `${current}${key}`;
}

export default function PriceScreen() {
  const { draft, updateAmount, backToPreview, collectPurchase } = useAppState();
  const numericAmount = Number(draft.amount);
  const canCollect = Number.isFinite(numericAmount) && numericAmount > 0;

  const pressKey = (key) => updateAmount(appendAmount(draft.amount, key));
  const erase = () => updateAmount(draft.amount.slice(0, -1));
  const submit = () => {
    if (canCollect) collectPurchase();
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (/^[0-9]$/.test(event.key) || event.key === ".") pressKey(event.key);
      if (event.key === "Backspace") erase();
      if (event.key === "Enter") submit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const shownAmount = draft.amount || "0";

  return (
    <main className="grid min-h-[100svh] grid-rows-[auto_minmax(9rem,1fr)_minmax(5.75rem,0.28fr)_minmax(14rem,0.55fr)] overflow-hidden bg-white text-neutral-950">
      <header className="flex items-center justify-between px-6 pb-2 pt-[max(1.1rem,calc(env(safe-area-inset-top)+0.7rem))]">
        <button className="min-h-11 px-1 text-sm text-neutral-400 transition active:scale-[0.98]" type="button" onClick={backToPreview}>Back</button>
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">Collect</span>
        <span className="w-10" aria-hidden="true" />
      </header>

      <section className="flex min-h-0 items-center justify-center px-8 py-3" aria-label="Your new sticker">
        <img className="max-h-full max-w-[min(72vw,19rem)] object-contain drop-shadow-[0_18px_26px_rgba(0,0,0,0.12)]" src={draft.stickerAsset?.image || draft.image} alt="Your sticker" />
      </section>

      <section className="flex min-h-0 items-end justify-center px-6 pb-2 pt-1" aria-live="polite">
        <output className={`max-w-full truncate text-center text-[clamp(4.6rem,18vw,7rem)] font-medium leading-none tracking-[-0.11em] tabular-nums ${canCollect ? "text-neutral-950" : "text-neutral-200"}`} aria-label={`Purchase amount ${shownAmount}`}>
          <span className="mr-1 inline-block text-[0.62em] tracking-[-0.08em]">$</span>{shownAmount}
        </output>
      </section>

      <section className="grid min-h-0 grid-cols-3 content-center gap-x-7 gap-y-1 px-10 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 sm:px-16">
        {numberKeys.map((key) => (
          <button
            key={key}
            className="min-h-12 rounded-2xl text-2xl font-medium tabular-nums transition duration-100 active:scale-90 active:bg-neutral-100"
            type="button"
            onClick={() => pressKey(key)}
            aria-label={key === "." ? "Decimal" : key}
          >
            {key}
          </button>
        ))}
        <button className="min-h-12 rounded-2xl text-xl text-neutral-500 transition duration-100 active:scale-90 active:bg-neutral-100" type="button" onClick={erase} aria-label="Delete last digit">⌫</button>
        <button className={`col-span-3 mt-1 min-h-12 rounded-2xl text-sm font-semibold transition duration-150 ${canCollect ? "bg-neutral-950 text-white active:scale-[0.98]" : "bg-neutral-100 text-neutral-300"}`} type="button" onClick={submit} disabled={!canCollect}>
          Collect
        </button>
      </section>
    </main>
  );
}
