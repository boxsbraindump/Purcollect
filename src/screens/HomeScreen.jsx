import { useMemo } from "react";
import StickerPhysicsCanvas from "../components/StickerPhysicsCanvas";
import { useAppState } from "../state/AppState";

function money(value) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(value);
}

export default function HomeScreen({ physicsController }) {
  const { purchases, openCapture } = useAppState();
  const total = useMemo(() => purchases.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0), [purchases]);
  const month = new Intl.DateTimeFormat(undefined, { month: "long" }).format(new Date());

  function addPurchase() {
    physicsController?.requestMotion();
    openCapture();
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-white text-neutral-950">
      <header className="relative z-10 px-6 pb-0 pt-[max(2rem,calc(env(safe-area-inset-top)+1rem))] text-center">
        <button className="inline-flex items-center gap-2 text-[clamp(1.8rem,7vw,2.25rem)] font-medium tracking-[-0.06em] text-[#92978a]" type="button" aria-label="Current month">
          <span>{month}</span>
          <span className="mt-[-0.35rem] block h-2.5 w-2.5 rotate-45 border-b-2 border-r-2 border-[#92978a]" aria-hidden="true" />
        </button>
        <div className="mt-24">
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-neutral-400">This month</p>
          <p className="text-[clamp(2.8rem,13vw,4.25rem)] font-medium leading-none tracking-[-0.08em] text-neutral-900">{money(total)}</p>
        </div>
      </header>

      <section className="relative min-h-0 flex-1" aria-label="This month's purchase collection">
        <StickerPhysicsCanvas purchases={purchases} onCanvasReady={physicsController?.setController} />
        {purchases.length === 0 && (
          <p className="pointer-events-none absolute inset-x-8 top-1/2 z-10 -translate-y-1/2 text-center text-sm leading-6 text-neutral-400">
            Your month starts with one small thing.
          </p>
        )}
      </section>

      <footer className="relative z-10 flex justify-center px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <button className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-neutral-950 text-white shadow-[0_12px_24px_rgba(0,0,0,0.14)] transition-transform active:scale-95" type="button" onClick={addPurchase} aria-label="Add a purchase">
          <span className="text-[2.5rem] font-light leading-none" aria-hidden="true">+</span>
        </button>
      </footer>
    </main>
  );
}
