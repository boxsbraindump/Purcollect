import { removeBackground } from "@imgly/background-removal";

self.onmessage = async (event) => {
  const { source } = event.data || {};

  if (!source) {
    self.postMessage({ type: "error", message: "Missing image source" });
    return;
  }

  try {
    const blob = await removeBackground(source, {
      output: { format: "image/png" },
      model: "isnet_quint8",
      progress: (key, current, total) => {
        self.postMessage({
          type: "progress",
          key,
          current,
          total
        });
      }
    });

    self.postMessage({ type: "result", blob });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Sticker generation failed"
    });
  }
};
