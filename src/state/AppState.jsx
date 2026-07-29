import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadPurchases, savePurchases } from "../storage/storage";

const AppStateContext = createContext(null);
const emptyDraft = { image: "", amount: "" };

export function AppStateProvider({ children }) {
  const [screen, setScreen] = useState("home");
  const [purchases, setPurchases] = useState(() => loadPurchases());
  const [draft, setDraft] = useState(emptyDraft);

  useEffect(() => savePurchases(purchases), [purchases]);

  const actions = useMemo(() => ({
    openCapture() {
      setDraft(emptyDraft);
      setScreen("capture");
    },
    openPreview(image) {
      setDraft((current) => ({ ...current, image }));
      setScreen("preview");
    },
    confirmPhoto() {
      setScreen("price");
    },
    updateAmount(amount) {
      setDraft((current) => ({ ...current, amount }));
    },
    backToHome() {
      setDraft(emptyDraft);
      setScreen("home");
    },
    backToCapture() {
      setScreen("capture");
    },
    backToPreview() {
      setScreen("preview");
    },
    collectPurchase() {
      const amount = Number(draft.amount);
      if (!draft.image || !Number.isFinite(amount) || amount <= 0) return false;
      setPurchases((current) => [...current, {
        id: `purchase-${Date.now()}`,
        image: draft.image,
        amount,
        createdAt: new Date().toISOString()
      }]);
      setDraft(emptyDraft);
      setScreen("home");
      return true;
    }
  }), [draft.amount, draft.image]);

  const value = useMemo(() => ({ screen, purchases, draft, ...actions }), [actions, draft, purchases, screen]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const state = useContext(AppStateContext);
  if (!state) throw new Error("useAppState must be used inside AppStateProvider");
  return state;
}
