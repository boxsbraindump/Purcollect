import { useEffect, useRef, useState } from "react";
import { useAppState } from "../state/AppState";
import { SAMPLE_IMAGE } from "../utils/sampleImage";

export default function CaptureScreen() {
  const { openPreview, backToHome } = useAppState();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const inputRef = useRef(null);
  const [status, setStatus] = useState("Requesting camera access...");

  useEffect(() => {
    let cancelled = false;
    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("Live camera is unavailable here. Upload a photo instead.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        setStatus("Frame the thing you want to keep.");
      } catch {
        setStatus("Camera access was blocked. Upload a photo or use the sample.");
      }
    }
    startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  function captureFrame() {
    const video = videoRef.current;
    if (!video?.videoWidth) return openPreview(SAMPLE_IMAGE);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    openPreview(canvas.toDataURL("image/jpeg", 0.88));
  }

  function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => openPreview(String(reader.result));
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <main className="flex min-h-[100dvh] flex-col bg-white text-neutral-950">
      <header className="flex items-center justify-between px-6 pb-4 pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))]">
        <button className="text-sm text-neutral-500" type="button" onClick={backToHome}>Back</button>
        <h1 className="text-sm font-semibold tracking-[-0.02em]">New purchase</h1>
        <span className="w-8" aria-hidden="true" />
      </header>
      <section className="flex flex-1 flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[1.5rem] bg-neutral-950">
          <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted aria-label="Live camera preview" />
          <span className="pointer-events-none absolute h-28 w-28 rounded-3xl border border-white/65" aria-hidden="true" />
          <p className="pointer-events-none absolute bottom-5 left-0 right-0 text-center text-xs text-white/70">Place the purchase inside the frame.</p>
        </div>
        <p className="mt-3 text-xs text-neutral-400">{status}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="h-12 rounded-full border border-neutral-200 text-sm text-neutral-600 transition-transform active:scale-[0.98]" type="button" onClick={() => inputRef.current?.click()}>Upload</button>
          <button className="h-12 rounded-full bg-neutral-950 text-sm text-white transition-transform active:scale-[0.98]" type="button" onClick={captureFrame}>Capture</button>
        </div>
        <button className="mt-3 h-10 text-xs text-neutral-500" type="button" onClick={() => openPreview(SAMPLE_IMAGE)}>Use sample</button>
        <input ref={inputRef} className="hidden" type="file" accept="image/*" capture="environment" onChange={handleUpload} />
      </section>
    </main>
  );
}
