import { useCallback, useState } from "react";
import { AppStateProvider, useAppState } from "./state/AppState";
import HomeScreen from "./screens/HomeScreen";
import CaptureScreen from "./screens/CaptureScreen";
import PreviewScreen from "./screens/PreviewScreen";
import StickerProcessingScreen from "./screens/StickerProcessingScreen";
import PriceScreen from "./screens/PriceScreen";

function AppContent() {
  const { screen } = useAppState();
  const [motionController, setMotionController] = useState(null);
  const onCanvasReady = useCallback((controller) => setMotionController(() => controller), []);
  const physicsController = { setController: onCanvasReady, requestMotion: () => motionController?.requestMotion() };

  if (screen === "capture") return <CaptureScreen />;
  if (screen === "preview") return <PreviewScreen />;
  if (screen === "processing") return <StickerProcessingScreen />;
  if (screen === "price") return <PriceScreen />;
  return <HomeScreen physicsController={physicsController} />;
}

export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}
