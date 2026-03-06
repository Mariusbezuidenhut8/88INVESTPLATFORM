// ============================================================
// STORAGE HELPERS
// All localStorage read/write operations in one place
// Keys are namespaced under "roa_" to avoid conflicts
// ============================================================

const PREFIX = "roa_";

const key = (name) => `${PREFIX}${name}`;

// ── GENERIC ─────────────────────────────────────────────────
export const save = (name, data) => {
  try {
    localStorage.setItem(key(name), JSON.stringify(data));
    return true;
  } catch (e) {
    console.error(`Storage save failed for ${name}:`, e);
    return false;
  }
};

export const load = (name, fallback = null) => {
  try {
    const raw = localStorage.getItem(key(name));
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`Storage load failed for ${name}:`, e);
    return fallback;
  }
};

export const remove = (name) => {
  try {
    localStorage.removeItem(key(name));
    return true;
  } catch (e) {
    return false;
  }
};

export const clearAll = () => {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
    return true;
  } catch (e) {
    return false;
  }
};

// ── DOMAIN-SPECIFIC ──────────────────────────────────────────

// ROA Sessions — list of saved ROAs
export const saveROA = (roa) => {
  const all = load("roas", []);
  const idx = all.findIndex((r) => r.id === roa.id);
  if (idx >= 0) all[idx] = roa;
  else all.unshift(roa);
  save("roas", all);
};

export const loadROAs = () => load("roas", []);

export const loadROAById = (id) => {
  const all = load("roas", []);
  return all.find((r) => r.id === id) || null;
};

export const deleteROA = (id) => {
  const all = load("roas", []).filter((r) => r.id !== id);
  save("roas", all);
};

// Current draft ROA
export const saveDraft = (data) => save("draft", data);
export const loadDraft = () => load("draft", null);
export const clearDraft = () => remove("draft");

// Advisor profile
export const saveProfile = (profile) => save("profile", profile);
export const loadProfile = () =>
  load("profile", {
    practiceName: "",
    advisorName: "",
    fspNumber: "",
    phone: "",
    email: "",
    address: "",
    logoUrl: "",
    defaultAdvisorFee: 0.5,
    defaultFeeFrequency: "monthly",
    houseViews: [],
  });

// Custom paragraph bank overrides (merged with default bank)
export const saveParagraphOverrides = (overrides) => save("paragraphs", overrides);
export const loadParagraphOverrides = () => load("paragraphs", {});

// Custom provider score overrides
export const saveProviderOverrides = (overrides) => save("providers", overrides);
export const loadProviderOverrides = () => load("providers", {});

// Custom product catalogue overrides
export const saveCatalogueOverrides = (overrides) => save("catalogue", overrides);
export const loadCatalogueOverrides = () => load("catalogue", {});

// Settings
export const saveSettings = (settings) => save("settings", settings);
export const loadSettings = () =>
  load("settings", {
    theme: "light",
    language: "en",
    defaultSection: "tree",
    autoSave: true,
  });

// Generate a unique ROA ID
export const generateROAId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ROA-${ts}-${rand}`;
};

// Generate a unique paragraph ID
export const generateParaId = (section, product) => {
  const ts = Date.now().toString(36).toUpperCase();
  return `${section}_${product}_${ts}`;
};
