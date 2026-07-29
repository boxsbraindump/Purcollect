const STORAGE_KEY = "purcollect-purchases-v2";

export function loadPurchases() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((purchase) => purchase && typeof purchase === "object" && Number(purchase.amount) > 0)
      : [];
  } catch {
    return [];
  }
}

export function savePurchases(purchases) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
  } catch {
    // The prototype keeps working when storage is unavailable.
  }
}
