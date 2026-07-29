import { useAppState } from "../state/AppState";

export default function PreviewScreen() {
  const { draft, backToCapture, confirmPhoto } = useAppState();
  return (
    <main className="flex min-h-[100dvh] flex-col bg-white text-neutral-950">
      <header className="flex items-center justify-between px-6 pb-4 pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))]">
        <button className="text-sm text-neutral-500" type="button" onClick={backToCapture}>Back</button>
        <h1 className="text-sm font-semibold tracking-[-0.02em]">Check the photo</h1>
        <span className="w-8" aria-hidden="true" />
      </header>
      <section className="flex flex-1 flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[1.5rem] bg-neutral-100 p-4">
          <img className="max-h-full max-w-full rounded-2xl object-contain" src={draft.image} alt="Purchase preview" />
        </div>
        <p className="mt-4 text-center text-sm leading-6 text-neutral-500">Use this photo to make a sticker, or take it again.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button className="h-12 rounded-full border border-neutral-200 text-sm text-neutral-600 transition-transform active:scale-[0.98]" type="button" onClick={backToCapture}>Retake</button>
          <button className="h-12 rounded-full bg-neutral-950 text-sm text-white transition-transform active:scale-[0.98]" type="button" onClick={confirmPhoto}>Use photo</button>
        </div>
      </section>
    </main>
  );
}
