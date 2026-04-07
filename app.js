const STORAGE_KEY = "cicla-state-v2";
const LEGACY_STORAGE_KEY = "cicla-state-v1";
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LUTEAL_LENGTH = 14;
const PHASE_ORDER = ["menstruation", "follicular", "ovulation", "luteal"];

const PHASE_LABELS = {
  menstruation: "Menstruacion",
  follicular: "Folicular",
  ovulation: "Ovulacion",
  luteal: "Lutea",
};

const PHASE_META = {
  menstruation: {
    headline: "Descanso y contencion",
    energyTitle: "Suave",
    partnerTitle: "Calma",
    description: "Bajar un cambio, sentirte contenida y darte margen.",
  },
  follicular: {
    headline: "Impulso y liviandad",
    energyTitle: "Ascendente",
    partnerTitle: "Empuje amable",
    description: "Vuelves a tomar envion y suele ser mas facil accionar.",
  },
  ovulation: {
    headline: "Conexion y expansion",
    energyTitle: "Alta",
    partnerTitle: "Presencia",
    description: "Buen momento para disfrute, sociabilidad y confianza.",
  },
  luteal: {
    headline: "Seleccion y cuidado",
    energyTitle: "Selectiva",
    partnerTitle: "Claridad",
    description: "Mas sensibilidad y menos tolerancia a la friccion innecesaria.",
  },
};

const DEFAULT_PHASE_PROFILES = {
  menstruation: {
    symptoms: ["colicos", "cansancio", "pecho sensible", "necesidad de descanso"],
    care: ["hablarme suave", "darme abrigo", "priorizar contencion y comodidad"],
    avoid: ["presionarme", "discutir por cosas chicas", "meter planes intensos"],
    energy: ["descansar sin culpa", "hacer lo minimo importante", "elegir calma"],
  },
  follicular: {
    symptoms: ["mas energia", "foco", "humor mas liviano", "ganas de moverme"],
    care: ["acompanar mis ideas", "proponer planes", "sumarte a mi impulso"],
    avoid: ["frenarme sin motivo", "sobreprotegerme", "cargar el dia de drama"],
    energy: ["organizar pendientes", "mover el cuerpo", "iniciar cosas nuevas"],
  },
  ovulation: {
    symptoms: ["libido alta", "sociabilidad", "flujo", "energia pareja"],
    care: ["estar presente", "coquetear conmigo", "aprovechar planes lindos"],
    avoid: ["desconectarte", "apagarme la iniciativa", "ser distante"],
    energy: ["socializar", "disfrutar", "hacer cosas visibles o creativas"],
  },
  luteal: {
    symptoms: ["antojos", "hinchazon", "sensibilidad", "irritabilidad"],
    care: ["ser claro y amoroso", "bajar la friccion", "darme estructura simple"],
    avoid: ["ironias pesadas", "cambios caoticos", "pedirme mas de la cuenta"],
    energy: ["cerrar ciclos", "elegir prioridades", "hacer planes tranquilos"],
  },
};

const DEFAULT_REMINDERS = {
  enabled: false,
  time: "09:00",
  lastShownDate: "",
};

const DEFAULT_SYNC = {
  enabled: false,
  shareId: "",
  ownerSecret: "",
  partnerToken: "",
  roleLock: "",
  acceptedShareId: "",
  lastLocalChangeAt: "",
  lastRemoteUpdatedAt: "",
  lastPushedAt: "",
  lastPulledAt: "",
};

const elements = {
  roleGate: document.querySelector("#roleGate"),
  selectWomanRoleBtn: document.querySelector("#selectWomanRoleBtn"),
  selectPartnerRoleBtn: document.querySelector("#selectPartnerRoleBtn"),
  heroText: document.querySelector("#heroText"),
  viewerGreeting: document.querySelector("#viewerGreeting"),
  viewerModeChip: document.querySelector("#viewerModeChip"),
  installAppBtn: document.querySelector("#installAppBtn"),
  installHelpText: document.querySelector("#installHelpText"),
  dashboardKicker: document.querySelector("#dashboardKicker"),
  dashboardTitle: document.querySelector("#dashboardTitle"),
  changeRoleBtn: document.querySelector("#changeRoleBtn"),
  todayPulse: document.querySelector("#todayPulse"),
  statusGrid: document.querySelector("#statusGrid"),
  todayGuideGrid: document.querySelector("#todayGuideGrid"),
  statusCallout: document.querySelector("#statusCallout"),
  timeline: document.querySelector("#timeline"),
  partnerBriefing: document.querySelector("#partnerBriefing"),
  sharePreview: document.querySelector("#sharePreview"),
  sharingStatusText: document.querySelector("#sharingStatusText"),
  partnerLinkPreview: document.querySelector("#partnerLinkPreview"),
  notificationStatus: document.querySelector("#notificationStatus"),
  monthLabel: document.querySelector("#monthLabel"),
  calendarGrid: document.querySelector("#calendarGrid"),
  historyList: document.querySelector("#historyList"),
  dailyLogCard: document.querySelector("#dailyLogCard"),
  phaseGuideGrid: document.querySelector("#phaseGuideGrid"),
  setupForm: document.querySelector("#setupForm"),
  phaseGuideForm: document.querySelector("#phaseGuideForm"),
  periodForm: document.querySelector("#periodForm"),
  dayLogForm: document.querySelector("#dayLogForm"),
  unknownDateToggle: document.querySelector("#unknownDateToggle"),
  lastPeriodStart: document.querySelector("#lastPeriodStart"),
  reminderEnabled: document.querySelector("#reminderEnabled"),
  reminderTime: document.querySelector("#reminderTime"),
  recordTodayBtn: document.querySelector("#recordTodayBtn"),
  copyShareBtn: document.querySelector("#copyShareBtn"),
  nativeShareBtn: document.querySelector("#nativeShareBtn"),
  shareWithPartnerBtn: document.querySelector("#shareWithPartnerBtn"),
  copyPartnerLinkBtn: document.querySelector("#copyPartnerLinkBtn"),
  notificationPermissionBtn: document.querySelector("#notificationPermissionBtn"),
  prevMonthBtn: document.querySelector("#prevMonthBtn"),
  nextMonthBtn: document.querySelector("#nextMonthBtn"),
};

let state = loadState();
let viewMonth = startOfMonth(today());
let reminderIntervalId = null;
let sharedSyncIntervalId = null;
let deferredInstallPrompt = null;

repairInvalidPartnerLockState();
applyViewerRoleFromUrl();
applySharedRoleHintsFromUrl();
hydrateForms();
bindEvents();
setupInstallPrompt();
applyViewerMode();
render();
registerServiceWorker();
startReminderWatcher();
maybeSendDailyReminder();
startSharedSyncLoop();
void initializeSharedExperience();

function loadState() {
  const saved =
    localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);

  if (!saved) {
    return defaultState();
  }

  try {
    const parsed = JSON.parse(saved);
    const base = defaultState();

    return {
      ...base,
      profile: {
        ...base.profile,
        ...(parsed.profile || {}),
      },
      phaseProfiles: mergePhaseProfiles(parsed),
      periodHistory: normalizePeriodHistory(parsed.periodHistory),
      dailyLogs: normalizeDailyLogs(parsed.dailyLogs),
      reminders: normalizeReminders(parsed.reminders),
      sync: normalizeSync(parsed.sync),
    };
  } catch (error) {
    console.error("No pude leer el estado guardado", error);
    return defaultState();
  }
}

function repairInvalidPartnerLockState() {
  const hasAcceptedSharedPartnerMode = Boolean(
    state.sync.shareId &&
      state.sync.acceptedShareId &&
      state.sync.shareId === state.sync.acceptedShareId,
  );

  if (state.sync.roleLock !== "partner" || hasAcceptedSharedPartnerMode) {
    return;
  }

  const preserveSharePair = Boolean(state.sync.ownerSecret);
  clearPartnerLockState({ preserveSharePair });
  saveState();
}

function defaultState() {
  return {
    profile: {
      userName: "",
      partnerName: "",
      cycleLength: 28,
      periodLength: 5,
      lastPeriodStart: "",
      dateUnknown: true,
      viewerRole: "",
    },
    phaseProfiles: clonePhaseProfiles(DEFAULT_PHASE_PROFILES),
    periodHistory: [],
    dailyLogs: {},
    reminders: { ...DEFAULT_REMINDERS },
    sync: { ...DEFAULT_SYNC },
  };
}

function normalizePeriodHistory(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry) => entry && entry.start && entry.end)
    .map((entry) => ({
      start: String(entry.start),
      end: String(entry.end),
      notes: String(entry.notes || "").trim(),
    }))
    .sort((left, right) => parseISO(right.start) - parseISO(left.start));
}

function normalizeDailyLogs(value) {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([date, entry]) => [
      date,
      {
        mood: String(entry?.mood || "").trim(),
        energy: String(entry?.energy || "").trim(),
        symptoms: normalizeList(entry?.symptoms, []),
        note: String(entry?.note || "").trim(),
      },
    ]),
  );
}

function normalizeReminders(value) {
  return {
    ...DEFAULT_REMINDERS,
    ...(value || {}),
    enabled: Boolean(value?.enabled),
    time: normalizeTime(value?.time),
    lastShownDate: String(value?.lastShownDate || ""),
  };
}

function normalizeSync(value) {
  return {
    ...DEFAULT_SYNC,
    ...(value || {}),
    enabled: Boolean(value?.enabled),
    shareId: String(value?.shareId || "").trim(),
    ownerSecret: String(value?.ownerSecret || "").trim(),
    partnerToken: String(value?.partnerToken || "").trim(),
    roleLock: value?.roleLock === "partner" ? "partner" : "",
    acceptedShareId: String(value?.acceptedShareId || "").trim(),
    lastLocalChangeAt: String(value?.lastLocalChangeAt || "").trim(),
    lastRemoteUpdatedAt: String(value?.lastRemoteUpdatedAt || "").trim(),
    lastPushedAt: String(value?.lastPushedAt || "").trim(),
    lastPulledAt: String(value?.lastPulledAt || "").trim(),
  };
}

function mergePhaseProfiles(parsed) {
  const merged = clonePhaseProfiles(DEFAULT_PHASE_PROFILES);

  if (parsed.phaseProfiles && typeof parsed.phaseProfiles === "object") {
    PHASE_ORDER.forEach((phase) => {
      const input = parsed.phaseProfiles[phase] || {};
      merged[phase] = {
        symptoms: normalizeList(input.symptoms, merged[phase].symptoms),
        care: normalizeList(input.care, merged[phase].care),
        avoid: normalizeList(input.avoid, merged[phase].avoid),
        energy: normalizeList(input.energy, merged[phase].energy),
      };
    });

    return merged;
  }

  if (parsed.symptomTemplates && typeof parsed.symptomTemplates === "object") {
    PHASE_ORDER.forEach((phase) => {
      merged[phase].symptoms = normalizeList(
        parsed.symptomTemplates[phase],
        merged[phase].symptoms,
      );
    });
  }

  return merged;
}

function clonePhaseProfiles(source) {
  return Object.fromEntries(
    PHASE_ORDER.map((phase) => [
      phase,
      {
        symptoms: [...source[phase].symptoms],
        care: [...source[phase].care],
        avoid: [...source[phase].avoid],
        energy: [...source[phase].energy],
      },
    ]),
  );
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindEvents() {
  elements.selectWomanRoleBtn.addEventListener("click", () => handleViewerRoleSelect("woman"));
  elements.selectPartnerRoleBtn.addEventListener("click", () => handleViewerRoleSelect("partner"));
  elements.installAppBtn.addEventListener("click", handleInstallApp);
  elements.changeRoleBtn.addEventListener("click", openRoleGate);
  elements.setupForm.addEventListener("submit", handleSetupSubmit);
  elements.phaseGuideForm.addEventListener("submit", handlePhaseGuideSubmit);
  elements.periodForm.addEventListener("submit", handlePeriodSubmit);
  elements.dayLogForm.addEventListener("submit", handleDayLogSubmit);
  elements.unknownDateToggle.addEventListener("change", handleUnknownDateToggle);
  elements.recordTodayBtn.addEventListener("click", handleRecordToday);
  elements.copyShareBtn.addEventListener("click", handleCopySummary);
  elements.nativeShareBtn.addEventListener("click", handleNativeShare);
  elements.shareWithPartnerBtn.addEventListener("click", handleShareWithPartner);
  elements.copyPartnerLinkBtn.addEventListener("click", handleCopyPartnerLink);
  elements.notificationPermissionBtn.addEventListener(
    "click",
    requestNotificationPermission,
  );
  elements.prevMonthBtn.addEventListener("click", () => {
    viewMonth = addMonths(viewMonth, -1);
    renderCalendar();
  });
  elements.nextMonthBtn.addEventListener("click", () => {
    viewMonth = addMonths(viewMonth, 1);
    renderCalendar();
  });

  elements.historyList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-start]");
    if (!button) {
      return;
    }

    state.periodHistory = state.periodHistory.filter(
      (period) => period.start !== button.dataset.start,
    );

    syncProfileAnchorFromHistory();
    persistAndRender();
  });

  window.addEventListener("focus", () => {
    maybeSendDailyReminder();
    renderReminderStatus();
    void pullSharedState();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      maybeSendDailyReminder();
      renderReminderStatus();
      void pullSharedState();
    }
  });
}

function setupInstallPrompt() {
  syncInstallButton();

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    syncInstallButton();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    syncInstallButton();
  });
}

async function handleInstallApp() {
  if (window.location.protocol === "file:") {
    window.alert(
      "Esta copia esta abierta como archivo. Para instalarla como app, abre Abrir-Cicla.cmd y despues toca Descargar.",
    );
    return;
  }

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();

    try {
      await deferredInstallPrompt.userChoice;
    } catch (error) {
      console.error("No pude completar el prompt de instalacion", error);
    }

    deferredInstallPrompt = null;
    syncInstallButton();
    return;
  }

  showManualInstallHelp();
}

function syncInstallButton() {
  if (!elements.installAppBtn || !elements.installHelpText) {
    return;
  }

  const shouldShow = !isStandaloneMode();
  elements.installAppBtn.hidden = !shouldShow;
  elements.installAppBtn.disabled = false;
  elements.installAppBtn.textContent = "Descargar";
  elements.installHelpText.classList.add("hidden");
  elements.installHelpText.textContent = "";
}

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isHostedOnline() {
  return window.location.protocol === "https:" || window.location.protocol === "http:";
}

function showManualInstallHelp() {
  if (/iphone|ipad|ipod/i.test(window.navigator.userAgent)) {
    window.alert(
      "Para descargarla en iPhone: abre el link en Safari, toca Compartir y elige 'Agregar a pantalla de inicio'.",
    );
    return;
  }

  window.alert(
    "Si el navegador no muestra la instalacion automatica, abre el menu de Chrome y busca 'Instalar pagina como aplicacion' o 'Agregar a pantalla de inicio'.",
  );
}

async function handleShareWithPartner() {
  if (!isSyncConfigured()) {
    window.alert(
      "Para que tu pareja vea tu calendario con tus cambios en tiempo real, primero hay que completar sync-config.js con una URL y anon key de Supabase.",
    );
    return;
  }

  ensureSharedPair();
  markSharedStateChanged();
  saveState();
  renderSharingStatus();

  const pushed = await pushSharedState();
  if (!pushed) {
    window.alert("No pude guardar el enlace compartido en la nube. Revisa la configuracion de Supabase.");
    return;
  }

  const link = buildPartnerShareLink();
  if (!link) {
    window.alert("El enlace quedo armado, pero esta copia no tiene una URL valida para compartir todavia.");
    return;
  }

  const copied = await copyTextToClipboard(link);
  elements.shareWithPartnerBtn.textContent = copied ? "Link copiado" : "Link listo";
  window.setTimeout(() => {
    elements.shareWithPartnerBtn.textContent = "Compartir con mi pareja";
  }, 1800);

  if (isLocalhost()) {
    window.alert(
      "El link ya esta generado, pero para que funcione en el celular de tu pareja conviene publicar Cicla en GitHub Pages o Netlify.",
    );
  }
}

async function handleCopyPartnerLink() {
  const link = buildPartnerShareLink();
  if (!link) {
    window.alert("Todavia no hay un link compartido listo.");
    return;
  }

  const copied = await copyTextToClipboard(link);
  elements.copyPartnerLinkBtn.textContent = copied ? "Copiado" : "Listo";
  window.setTimeout(() => {
    elements.copyPartnerLinkBtn.textContent = "Copiar link de pareja";
  }, 1600);
}

async function initializeSharedExperience() {
  if (!canReadSharedState()) {
    return;
  }

  await pullSharedState({ force: true, confirmPartner: true });
}

function startSharedSyncLoop() {
  if (sharedSyncIntervalId) {
    window.clearInterval(sharedSyncIntervalId);
    sharedSyncIntervalId = null;
  }

  if (!canReadSharedState()) {
    return;
  }

  const config = getSyncConfig();
  sharedSyncIntervalId = window.setInterval(() => {
    void pullSharedState();
  }, config.pollIntervalMs);
}

async function pullSharedState(options = {}) {
  if (!canReadSharedState()) {
    return false;
  }

  try {
    const row = await fetchSharedRow();
    if (!row || !row.snapshot) {
      return false;
    }

    const remoteUpdatedAt = String(row.snapshot.updatedAt || row.updated_at || "");
    if (
      !options.force &&
      remoteUpdatedAt &&
      state.sync.lastRemoteUpdatedAt &&
      remoteUpdatedAt <= state.sync.lastRemoteUpdatedAt
    ) {
      return false;
    }

    const ownerName =
      String(row.snapshot?.profile?.userName || row.owner_name || "ella").trim() || "ella";

    if (options.confirmPartner && state.sync.acceptedShareId !== state.sync.shareId) {
      const accepted = window.confirm(
        `Sos la pareja de ${ownerName}? Si sigues, esta app quedara bloqueada en modo pareja para este enlace.`,
      );

      if (!accepted) {
        clearPartnerLockState();
        saveState();
        applyViewerMode();
        render();
        return false;
      }

      state.sync.roleLock = "partner";
      state.sync.acceptedShareId = state.sync.shareId;
    }

    applySharedSnapshot(row.snapshot);
    state.sync.enabled = true;
    state.sync.lastRemoteUpdatedAt = remoteUpdatedAt;
    state.sync.lastPulledAt = new Date().toISOString();
    saveState();
    hydrateForms();
    applyViewerMode();
    render();
    return true;
  } catch (error) {
    console.error("No pude traer los datos compartidos", error);
    return false;
  }
}

function clearPartnerLockState(options = {}) {
  const preserveSharePair = Boolean(options.preserveSharePair);

  state.sync.roleLock = "";
  state.sync.acceptedShareId = "";

  if (!preserveSharePair) {
    state.sync.shareId = state.sync.ownerSecret ? state.sync.shareId : "";
    state.sync.partnerToken = state.sync.ownerSecret ? state.sync.partnerToken : "";
    state.sync.enabled = Boolean(
      state.sync.ownerSecret && state.sync.shareId && state.sync.partnerToken,
    );
  }

  if (state.profile.viewerRole === "partner") {
    state.profile.viewerRole = "";
  }
}

async function pushSharedState() {
  if (!canWriteSharedState()) {
    return false;
  }

  try {
    const updatedAt = state.sync.lastLocalChangeAt || new Date().toISOString();
    const row = {
      share_id: state.sync.shareId,
      owner_secret: state.sync.ownerSecret,
      partner_token: state.sync.partnerToken,
      owner_name: state.profile.userName || "tu novia",
      updated_at: updatedAt,
      snapshot: extractSharedSnapshot(updatedAt),
    };

    await upsertSharedRow(row);
    state.sync.enabled = true;
    state.sync.lastRemoteUpdatedAt = updatedAt;
    state.sync.lastPushedAt = updatedAt;
    saveState();
    renderSharingStatus();
    return true;
  } catch (error) {
    console.error("No pude sincronizar los datos compartidos", error);
    return false;
  }
}

function ensureSharedPair() {
  if (state.sync.enabled && state.sync.shareId && state.sync.partnerToken) {
    return;
  }

  state.sync = {
    ...state.sync,
    enabled: true,
    shareId: randomId(16),
    ownerSecret: randomId(24),
    partnerToken: randomId(24),
  };
}

function markSharedStateChanged() {
  state.sync.lastLocalChangeAt = new Date().toISOString();
}

function extractSharedSnapshot(updatedAt) {
  return {
    schemaVersion: 1,
    updatedAt,
    profile: {
      userName: state.profile.userName,
      partnerName: state.profile.partnerName,
      cycleLength: state.profile.cycleLength,
      periodLength: state.profile.periodLength,
      lastPeriodStart: state.profile.lastPeriodStart,
      dateUnknown: state.profile.dateUnknown,
    },
    phaseProfiles: cloneData(state.phaseProfiles),
    periodHistory: cloneData(state.periodHistory),
    dailyLogs: cloneData(state.dailyLogs),
  };
}

function applySharedSnapshot(snapshot) {
  if (!snapshot) {
    return;
  }

  const mergedProfile = {
    ...state.profile,
    userName: String(snapshot.profile?.userName || "").trim(),
    partnerName: String(snapshot.profile?.partnerName || "").trim(),
    cycleLength: clampNumber(snapshot.profile?.cycleLength, 21, 40, state.profile.cycleLength),
    periodLength: clampNumber(snapshot.profile?.periodLength, 2, 10, state.profile.periodLength),
    lastPeriodStart: String(snapshot.profile?.lastPeriodStart || "").trim(),
    dateUnknown: Boolean(snapshot.profile?.dateUnknown),
  };

  state.profile = {
    ...mergedProfile,
    viewerRole: state.profile.viewerRole,
  };
  state.phaseProfiles = mergePhaseProfiles({ phaseProfiles: snapshot.phaseProfiles || {} });
  state.periodHistory = normalizePeriodHistory(snapshot.periodHistory);
  state.dailyLogs = normalizeDailyLogs(snapshot.dailyLogs);
  syncProfileAnchorFromHistory();
}

async function fetchSharedRow() {
  const config = getSyncConfig();
  const endpoint = new URL(`${trimTrailingSlash(config.url)}/rest/v1/${config.table}`);
  endpoint.searchParams.set("select", "share_id,partner_token,owner_name,snapshot,updated_at");
  endpoint.searchParams.set("share_id", `eq.${state.sync.shareId}`);
  endpoint.searchParams.set("partner_token", `eq.${state.sync.partnerToken}`);
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint, {
    headers: buildSyncHeaders(config),
  });

  if (!response.ok) {
    throw new Error(`No pude leer el par compartido (${response.status})`);
  }

  const rows = await response.json();
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function upsertSharedRow(row) {
  const config = getSyncConfig();
  const endpoint = `${trimTrailingSlash(config.url)}/rest/v1/${config.table}?on_conflict=share_id`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...buildSyncHeaders(config),
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(row),
  });

  if (!response.ok) {
    throw new Error(`No pude guardar el par compartido (${response.status})`);
  }
}

function buildSyncHeaders(config) {
  return {
    apikey: config.anonKey,
    Authorization: `Bearer ${config.anonKey}`,
  };
}

function canReadSharedState() {
  return Boolean(
    isSyncConfigured() &&
      state.sync.shareId &&
      state.sync.partnerToken &&
      isRoleLockedToPartner(),
  );
}

function canWriteSharedState() {
  return Boolean(
    isSyncConfigured() &&
      state.sync.enabled &&
      state.sync.shareId &&
      state.sync.ownerSecret &&
      state.sync.partnerToken &&
      !isRoleLockedToPartner(),
  );
}

function isSyncConfigured() {
  const config = getSyncConfig();
  return Boolean(config.url && config.anonKey && config.table);
}

function getSyncConfig() {
  const raw = window.CICLA_SYNC_CONFIG || {};
  return {
    provider: String(raw.provider || "supabase"),
    url: String(raw.url || "").trim(),
    anonKey: String(raw.anonKey || "").trim(),
    table: String(raw.table || "cicla_shares").trim(),
    pollIntervalMs: clampNumber(raw.pollIntervalMs, 5000, 120000, 15000),
  };
}

function buildPartnerShareLink() {
  if (!state.sync.enabled || !state.sync.shareId || !state.sync.partnerToken || !isHostedOnline()) {
    return "";
  }

  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("role", "partner");
  url.searchParams.set("share", state.sync.shareId);
  url.searchParams.set("partner", state.sync.partnerToken);
  return url.toString();
}

async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("No pude copiar al portapapeles", error);
    return false;
  }
}

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function isLocalhost() {
  return /^localhost$|^127(?:\.\d{1,3}){3}$/.test(window.location.hostname);
}

function randomId(length) {
  const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function applyViewerRoleFromUrl() {
  const role = getViewerRoleFromUrl();
  if (!role) {
    return;
  }

  state.profile.viewerRole = role;
}

function getViewerRoleFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const role = String(params.get("role") || "").toLowerCase();

  if (role === "woman" || role === "partner") {
    return role;
  }

  return "";
}

function applySharedRoleHintsFromUrl() {
  const params = getPartnerShareParamsFromUrl();

  if (!params) {
    return;
  }

  state.profile.viewerRole = "partner";
  state.sync = {
    ...state.sync,
    enabled: true,
    shareId: params.shareId,
    partnerToken: params.partnerToken,
    roleLock: "partner",
  };
}

function getPartnerShareParamsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const shareId = String(params.get("share") || "").trim();
  const partnerToken = String(params.get("partner") || "").trim();

  if (!shareId || !partnerToken) {
    return null;
  }

  return { shareId, partnerToken };
}

function handleViewerRoleSelect(role) {
  if (isRoleLockedToPartner() && role !== "partner") {
    return;
  }

  state.profile.viewerRole = role;
  saveState();
  applyViewerMode();
  render();
}

function openRoleGate() {
  if (isRoleLockedToPartner()) {
    return;
  }

  elements.roleGate.classList.remove("hidden");
  elements.roleGate.setAttribute("aria-hidden", "false");
  document.body.classList.add("role-gate-open");
}

function closeRoleGate() {
  elements.roleGate.classList.add("hidden");
  elements.roleGate.setAttribute("aria-hidden", "true");
  document.body.classList.remove("role-gate-open");
}

function applyViewerMode() {
  if (isRoleLockedToPartner()) {
    state.profile.viewerRole = "partner";
  }

  const role = state.profile.viewerRole;
  document.body.classList.toggle("role-woman", role === "woman");
  document.body.classList.toggle("role-partner", role === "partner");
  elements.changeRoleBtn.hidden = isRoleLockedToPartner();

  if (!role) {
    openRoleGate();
  } else {
    closeRoleGate();
  }
}

function hydrateForms() {
  document.querySelector("#userName").value = state.profile.userName;
  document.querySelector("#partnerName").value = state.profile.partnerName;
  document.querySelector("#cycleLength").value = state.profile.cycleLength;
  document.querySelector("#periodLength").value = state.profile.periodLength;
  document.querySelector("#lastPeriodStart").value = state.profile.lastPeriodStart;
  elements.unknownDateToggle.checked = state.profile.dateUnknown;
  elements.lastPeriodStart.disabled = state.profile.dateUnknown;
  elements.reminderEnabled.checked = state.reminders.enabled;
  elements.reminderTime.value = state.reminders.time;

  document.querySelector("#periodStart").value = isoDate(today());
  document.querySelector("#periodEnd").value = isoDate(today());
  document.querySelector("#logDate").value = isoDate(today());
}

function handleSetupSubmit(event) {
  event.preventDefault();

  const formData = new FormData(elements.setupForm);
  const dateUnknown = elements.unknownDateToggle.checked;
  const lastPeriodStart = dateUnknown
    ? ""
    : String(formData.get("lastPeriodStart") || "");

  state.profile = {
    ...state.profile,
    userName: String(formData.get("userName") || "").trim(),
    partnerName: String(formData.get("partnerName") || "").trim(),
    cycleLength: clampNumber(formData.get("cycleLength"), 21, 40, 28),
    periodLength: clampNumber(formData.get("periodLength"), 2, 10, 5),
    lastPeriodStart,
    dateUnknown,
  };

  state.reminders = {
    ...state.reminders,
    enabled: elements.reminderEnabled.checked,
    time: normalizeTime(formData.get("reminderTime")),
  };

  if (lastPeriodStart) {
    upsertPeriod({
      start: lastPeriodStart,
      end: isoDate(addDays(parseISO(lastPeriodStart), state.profile.periodLength - 1)),
      notes: "Carga inicial",
    });
  }

  persistAndRender();
}

function handlePhaseGuideSubmit(event) {
  event.preventDefault();

  PHASE_ORDER.forEach((phase) => {
    state.phaseProfiles[phase] = {
      symptoms: splitInputList(
        document.querySelector(`#phase-${phase}-symptoms`).value,
      ),
      care: splitInputList(document.querySelector(`#phase-${phase}-care`).value),
      avoid: splitInputList(document.querySelector(`#phase-${phase}-avoid`).value),
      energy: splitInputList(document.querySelector(`#phase-${phase}-energy`).value),
    };
  });

  persistAndRender();
}

function handlePeriodSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.periodForm);
  const start = String(formData.get("periodStart") || "");
  const end = String(formData.get("periodEnd") || "");

  if (!start || !end || parseISO(end) < parseISO(start)) {
    window.alert("Revisa las fechas del periodo.");
    return;
  }

  upsertPeriod({
    start,
    end,
    notes: String(formData.get("periodNotes") || "").trim(),
  });

  state.profile.lastPeriodStart = mostRecentPeriod()?.start || start;
  state.profile.dateUnknown = false;

  elements.periodForm.reset();
  document.querySelector("#periodStart").value = isoDate(today());
  document.querySelector("#periodEnd").value = isoDate(today());
  persistAndRender();
}

function handleDayLogSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.dayLogForm);
  const date = String(formData.get("logDate") || "");

  if (!date) {
    return;
  }

  state.dailyLogs[date] = {
    mood: String(formData.get("logMood") || "").trim(),
    energy: String(formData.get("logEnergy") || "").trim(),
    symptoms: splitInputList(String(formData.get("logSymptoms") || "")),
    note: String(formData.get("logNote") || "").trim(),
  };

  persistAndRender();
}

function handleUnknownDateToggle() {
  const dateUnknown = elements.unknownDateToggle.checked;
  elements.lastPeriodStart.disabled = dateUnknown;

  if (dateUnknown) {
    elements.lastPeriodStart.value = "";
  }
}

function handleRecordToday() {
  const start = isoDate(today());
  const end = isoDate(addDays(today(), state.profile.periodLength - 1));

  upsertPeriod({
    start,
    end,
    notes: "Inicio marcado desde el tablero",
  });

  state.profile.lastPeriodStart = start;
  state.profile.dateUnknown = false;
  hydrateForms();
  persistAndRender();
}

async function handleCopySummary() {
  const text = buildShareSummary();

  try {
    await navigator.clipboard.writeText(text);
    elements.copyShareBtn.textContent = "Copiado";
    window.setTimeout(() => {
      elements.copyShareBtn.textContent = "Copiar briefing";
    }, 1600);
  } catch (error) {
    console.error("No pude copiar el briefing", error);
    window.alert("No pude copiar el briefing. Igual quedo visible en pantalla.");
  }
}

async function handleNativeShare() {
  const text = buildShareSummary();

  if (!navigator.share) {
    window.alert("Tu navegador no ofrece compartir nativo. Usa 'Copiar briefing'.");
    return;
  }

  try {
    await navigator.share({
      title: "Briefing de Cicla",
      text,
    });
  } catch (error) {
    console.error("Compartir fue cancelado o fallo", error);
  }
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    window.alert("Este navegador no soporta notificaciones.");
    return;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      await maybeSendDailyReminder(true);
    }

    renderReminderStatus();
  } catch (error) {
    console.error("No pude pedir permiso para notificaciones", error);
  }
}

function upsertPeriod(period) {
  const cleaned = {
    start: period.start,
    end: period.end,
    notes: period.notes || "",
  };

  const remaining = state.periodHistory.filter((item) => item.start !== cleaned.start);
  state.periodHistory = [...remaining, cleaned].sort(
    (left, right) => parseISO(right.start) - parseISO(left.start),
  );
}

function persistAndRender() {
  markSharedStateChanged();
  syncProfileAnchorFromHistory();
  saveState();
  hydrateForms();
  render();
  maybeSendDailyReminder();
  void pushSharedState();
}

function syncProfileAnchorFromHistory() {
  const recent = mostRecentPeriod();
  if (recent) {
    state.profile.lastPeriodStart = recent.start;
    state.profile.dateUnknown = false;
    return;
  }

  state.profile.lastPeriodStart = "";
  state.profile.dateUnknown = true;
}

function render() {
  renderViewerMode();
  renderPhaseGuideEditor();
  renderStatus();
  renderTodayGuidance();
  renderTimeline();
  renderPartnerBriefing();
  renderSharePreview();
  renderSharingStatus();
  renderCalendar();
  renderHistory();
  renderDailyLogCard();
  renderReminderStatus();
}

function isPartnerView() {
  return state.profile.viewerRole === "partner";
}

function isRoleLockedToPartner() {
  return state.sync.roleLock === "partner" && !canUnlockPartnerViewOnThisDevice();
}

function canUnlockPartnerViewOnThisDevice() {
  return Boolean(
    state.sync.ownerSecret &&
      !getPartnerShareParamsFromUrl(),
  );
}

function renderViewerMode() {
  const role = state.profile.viewerRole;

  if (role === "partner") {
    elements.viewerModeChip.textContent = "Vista pareja";
    elements.viewerGreeting.textContent = buildViewerGreeting("partner");
    elements.dashboardKicker.textContent = "Guia del dia";
    elements.dashboardTitle.textContent = "Como esta ella hoy";
    elements.heroText.textContent =
      "Una vista pensada para tu pareja: que te ayuda hoy, que conviene evitar y como acompanarte segun tu fase.";
    return;
  }

  if (role === "woman") {
    elements.viewerModeChip.textContent = "Vista mujer";
    elements.viewerGreeting.textContent = buildViewerGreeting("woman");
    elements.dashboardKicker.textContent = "Tablero de hoy";
    elements.dashboardTitle.textContent = "Tu pulso del dia";
    elements.heroText.textContent =
      "Una app pensada para que te organices mejor, entiendas como cambia tu energia segun el dia del ciclo y le des a tu pareja un briefing concreto sobre como acompanarte bien.";
    return;
  }

  elements.viewerModeChip.textContent = "Elegir vista";
  elements.viewerGreeting.textContent = "";
  elements.dashboardKicker.textContent = "Tablero de hoy";
  elements.dashboardTitle.textContent = "Tu pulso del dia";
  elements.heroText.textContent =
    "Una app pensada para que te organices mejor, entiendas como cambia tu energia segun el dia del ciclo y le des a tu pareja un briefing concreto sobre como acompanarte bien.";
}

function buildViewerGreeting(role) {
  if (role === "partner") {
    const partnerName = state.profile.partnerName?.trim();
    return partnerName ? `Hola ${partnerName}` : "Hola";
  }

  const userName = state.profile.userName?.trim();
  return userName ? `Hola ${userName}` : "Hola";
}

function renderStatus() {
  const anchor = getAnchorDate();
  const cycleLength = getCycleLength();
  const periodLength = getPeriodLength();
  const confidence = getConfidenceLabel();
  const partnerView = isPartnerView();
  const cards = [];

  if (!anchor) {
    elements.todayPulse.innerHTML = `
      <article class="empty-state">
        <h3>${partnerView ? "Esperando que ella marque su proximo inicio" : "Esperando tu proximo inicio"}</h3>
        <p>
          ${
            partnerView
              ? "No hace falta adivinar fechas. Cuando ella registre que le vino o cargue un periodo, aqui veras que le hace bien, que conviene evitar y como acompanarla."
              : 'No hace falta inventar fechas. Deja listo tu mapa personal y, cuando te venga, marcas "Me vino hoy" o guardas el periodo para activar todo.'
          }
        </p>
      </article>
    `;

    if (partnerView) {
      cards.push(
        statusCard("Estado", "A la espera", "Falta la fecha base para activar la guia del dia."),
        statusCard("Cuando se active", "Tu apoyo", "Vas a ver que le hace bien, que evitar y como ordenar el dia."),
        statusCard("Ciclo promedio", `${cycleLength} dias`, "Esto queda como referencia general mientras tanto."),
        statusCard("Menstruacion", `${periodLength} dias`, "Se usara para estimar comienzo y duracion."),
      );

      elements.statusCallout.textContent =
        "Por ahora no adivines. En cuanto ella marque el inicio, esta vista te va a decir como acompanarla mejor.";
    } else {
      cards.push(
        statusCard("Estado", "Preparada", "La app ya puede guardar tu mapa personal."),
        statusCard("Precision", confidence, "Sin una fecha base no conviene adivinar."),
        statusCard("Ciclo promedio", `${cycleLength} dias`, "Puedes cambiarlo cuando quieras."),
        statusCard("Menstruacion", `${periodLength} dias`, "Esto ayuda a pintar el calendario."),
      );

      elements.statusCallout.textContent =
        "Aunque todavia no recuerdes la ultima fecha, puedes dejar definidas las fases, tus sintomas y la guia para tu pareja.";
    }

    elements.statusGrid.innerHTML = cards.join("");
    return;
  }

  const context = getDailyContext(today());
  const progress = Math.round((context.prediction.cycleDay / cycleLength) * 100);
  const partnerRhythmCard = getPartnerRhythmCard(context);
  const partnerSupportCard = getPartnerSupportCard(context);

  elements.todayPulse.innerHTML = `
    <article class="pulse-shell">
      <div class="pulse-header">
        <div>
          <p class="section-kicker">${partnerView ? "Ella hoy" : "Hoy"}</p>
          <h3>${PHASE_LABELS[context.prediction.phase]}</h3>
        </div>
        <span class="phase-pill ${context.prediction.phase}">
          ${escapeHtml(context.meta.headline)}
        </span>
      </div>
      <p class="pulse-date">${escapeHtml(capitalize(formatLongDate(today())))}</p>
      <p class="mini-note">${escapeHtml(partnerView ? buildPartnerPulseSummary(context) : context.prediction.summary)}</p>
      <div class="pulse-progress">
        <div class="progress-track">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="pulse-meta">
          <span>Dia ${context.prediction.cycleDay} de ${cycleLength} del ciclo estimado</span>
        </div>
      </div>
    </article>
  `;

  if (partnerView) {
    cards.push(
      statusCard(
        "Proximo periodo",
        context.nextPeriod.label,
        `${context.nextPeriod.daysUntil} dias para el inicio estimado`,
      ),
      statusCard(
        "Ovulacion",
        context.nextOvulation.label,
        "Ventana aproximada del ciclo fertil",
      ),
      statusCard(
        partnerRhythmCard.label,
        partnerRhythmCard.value,
        partnerRhythmCard.description,
      ),
      statusCard(
        partnerSupportCard.label,
        partnerSupportCard.value,
        partnerSupportCard.description,
      ),
    );
  } else {
    cards.push(
      statusCard(
        "Proximo periodo",
        context.nextPeriod.label,
        `${context.nextPeriod.daysUntil} dias para el inicio estimado`,
      ),
      statusCard(
        "Ovulacion",
        context.nextOvulation.label,
        "Ventana aproximada del ciclo fertil",
      ),
      statusCard(
        "Ritmo de hoy",
        context.meta.energyTitle,
        joinList(context.phaseProfile.energy.slice(0, 2)),
      ),
      statusCard(
        "Tono para tu pareja",
        context.meta.partnerTitle,
        joinList(context.phaseProfile.care.slice(0, 2)),
      ),
    );
  }

  elements.statusGrid.innerHTML = cards.join("");
  elements.statusCallout.textContent = buildTodayCallout(context);
}

function renderTodayGuidance() {
  const anchor = getAnchorDate();
  const partnerView = isPartnerView();

  if (!anchor) {
    if (partnerView) {
      elements.todayGuideGrid.innerHTML = [
        supportCard(
          "Cuando ella lo active",
          ["Vas a ver que le hace bien", "Tambien que conviene evitar", "Y el ritmo que le sirve ese dia"],
          "No hace falta adivinar: la app te lo va a ordenar de forma simple.",
        ),
        supportCard(
          "Como leer esta vista",
          ["'Le hace bien' son cosas para hacer", "'Conviene evitar' son cosas que es mejor no hacerle", "'Ritmo que le conviene' describe el tipo de dia que a ella le sirve"],
          "La idea es ayudarte a acompanarla, no que interpretes todo por tu cuenta.",
        ),
      ].join("");
      return;
    }

    elements.todayGuideGrid.innerHTML = [
      supportCard(
        "Mapa personal",
        ["Define que te hace bien", "Anota que te irrita", "Deja escrito tu plan ideal"],
        "Todo esto queda listo para activarse cuando marques tu proximo inicio.",
      ),
      supportCard(
        "Tu pareja",
        ["Podra ver un briefing diario", "Sabra que evitar", "Tendra un resumen para compartir"],
        "La idea es que no tenga que adivinar como acompanarte.",
      ),
      supportCard(
        "Energia hormonal",
        ["Cada fase tiene un ritmo", "Habra foco del dia", "Tambien se ajusta con tu bitacora"],
        "Cuanto mas registres, mas sentido va a tener para ti.",
      ),
    ].join("");
    return;
  }

  const context = getDailyContext(today());

  if (partnerView) {
    elements.todayGuideGrid.innerHTML = [
      supportCard(
        "Lo que mas le ayuda hoy",
        context.phaseProfile.care,
        "Estas son acciones concretas que puedes priorizar para que ella se sienta mejor.",
      ),
      supportCard(
        "Conviene evitar",
        context.phaseProfile.avoid,
        "Tomalo como lista de cosas que hoy es mejor no hacerle.",
      ),
      supportCard(
        "Ritmo que le conviene hoy",
        getPartnerRhythmItems(context.phaseProfile.energy),
        "Esto habla del tipo de dia que le hace bien a ella, para que puedas ayudar a sostenerlo.",
      ),
    ].join("");
    return;
  }

  elements.todayGuideGrid.innerHTML = [
    supportCard(
      "Lo que mas ayuda hoy",
      context.phaseProfile.care,
      "Esto es lo que conviene priorizar para que te sientas mejor.",
    ),
    supportCard(
      "Conviene evitar",
      context.phaseProfile.avoid,
      "Asi tu pareja sabe que puede tensarte de mas en esta fase.",
    ),
    supportCard(
      "Como aprovechar tu energia",
      context.phaseProfile.energy,
      context.dailyLog
        ? `Hoy registraste energia ${context.dailyLog.energy || "sin cargar"}.`
        : "Puedes afinar esta parte segun como te vayas sintiendo.",
    ),
  ].join("");
}

function renderTimeline() {
  const anchor = getAnchorDate();

  if (!anchor) {
    elements.timeline.innerHTML = `
      <article class="empty-state">
        <h3>La linea del tiempo se activa cuando registres un inicio</h3>
        <p>
          En cuanto marques tu proximo periodo, aqui vas a ver 14 dias de
          sintomas, energia y acompanamiento sugerido.
        </p>
      </article>
    `;
    return;
  }

  const items = Array.from({ length: 14 }, (_, index) => {
    const date = addDays(today(), index);
    const context = getDailyContext(date);
    const dailyLog = context.dailyLog;
    const note = dailyLog
      ? `Bitacora: ${buildLogSummary(dailyLog)}.`
      : `Apoyo recomendado: ${joinList(context.phaseProfile.care.slice(0, 2))}.`;

    return `
      <article class="timeline-item">
        <header>
          <div>
            <strong>${escapeHtml(capitalize(formatWeekday(date)))} ${date.getDate()}</strong>
            <p>${escapeHtml(capitalize(formatLongDate(date)))}</p>
          </div>
          <span class="phase-pill ${context.prediction.phase}">
            ${PHASE_LABELS[context.prediction.phase]}
          </span>
        </header>
        <p>${escapeHtml(buildAudiencePhaseSummary(context))}</p>
        <p class="mini-note">Sintomas probables: ${escapeHtml(joinList(context.phaseProfile.symptoms.slice(0, 3)))}.</p>
        <p class="mini-note">${escapeHtml(isPartnerView() ? `Ritmo que le conviene: ${joinList(getPartnerRhythmItems(context.phaseProfile.energy.slice(0, 2)))}.` : `Energia / plan: ${joinList(context.phaseProfile.energy.slice(0, 2))}.`)}</p>
        <p class="mini-note">${escapeHtml(note)}</p>
      </article>
    `;
  });

  elements.timeline.innerHTML = items.join("");
}

function renderPartnerBriefing() {
  const anchor = getAnchorDate();
  const partnerName = state.profile.partnerName || "tu pareja";

  if (!anchor) {
    elements.partnerBriefing.innerHTML = `
      <article class="empty-state">
        <h3>Briefing listo para activarse</h3>
        <p>
          ${escapeHtml(partnerName)} va a recibir recomendaciones claras apenas
          registres el proximo inicio de tu periodo.
        </p>
      </article>
    `;
    return;
  }

  const context = getDailyContext(today());

  elements.partnerBriefing.innerHTML = `
    <div class="briefing-head">
      <div>
        <p class="section-kicker">Hoy para ${escapeHtml(partnerName)}</p>
        <h3>${PHASE_LABELS[context.prediction.phase]} - ${escapeHtml(context.meta.headline)}</h3>
      </div>
      <span class="brief-tag">
        ${escapeHtml(state.reminders.enabled ? `Recordatorio ${state.reminders.time}` : "Sin recordatorio")}
      </span>
    </div>
    <p>${escapeHtml(buildBriefIntro(context))}</p>
    <div class="briefing-grid">
      <article class="brief-block">
        <h3>Le hace bien</h3>
        ${listMarkup(context.phaseProfile.care, "Define aqui que te ayuda en esta fase.")}
      </article>
      <article class="brief-block">
        <h3>Mejor evitar</h3>
        ${listMarkup(context.phaseProfile.avoid, "Define aqui que conviene bajar o evitar.")}
      </article>
      <article class="brief-block">
        <h3>Ritmo que le conviene</h3>
        ${listMarkup(getPartnerRhythmItems(context.phaseProfile.energy), "Define aqui que tipo de ritmo le hace bien en esta fase.")}
      </article>
    </div>
    <p class="micro-note">
      ${
        context.dailyLog
          ? escapeHtml(`Dato real de hoy: ${buildLogSummary(context.dailyLog)}.`)
          : isPartnerView()
            ? "Si hoy ella nota algo distinto, conviene sumarlo a la bitacora para ajustar el siguiente ciclo."
            : "Si hoy notas algo distinto, sumalo a la bitacora para ajustar el siguiente ciclo."
      }
    </p>
  `;
}

function renderSharePreview() {
  elements.sharePreview.textContent = buildShareSummary();
  elements.nativeShareBtn.disabled = !navigator.share;
}

function renderSharingStatus() {
  if (!elements.sharingStatusText || !elements.partnerLinkPreview) {
    return;
  }

  const link = buildPartnerShareLink();
  const isConfigured = isSyncConfigured();

  if (!isConfigured) {
    elements.sharingStatusText.textContent =
      "Para que tu pareja reciba tus cambios automaticamente hace falta conectar la app a Supabase una sola vez.";
    elements.partnerLinkPreview.textContent =
      "Completa sync-config.js con la URL y la anon key de tu proyecto para activar el link compartido.";
    elements.shareWithPartnerBtn.disabled = false;
    elements.copyPartnerLinkBtn.disabled = true;
    return;
  }

  if (!state.sync.enabled || !state.sync.shareId || !state.sync.partnerToken) {
    elements.sharingStatusText.textContent =
      "Todavia no generaste el link compartido. Cuando lo actives, tu pareja entrara directo en modo pareja y tus cambios se van a sincronizar solos.";
    elements.partnerLinkPreview.textContent = "Aqui aparecera el link para tu pareja.";
    elements.shareWithPartnerBtn.disabled = false;
    elements.copyPartnerLinkBtn.disabled = true;
    return;
  }

  elements.sharingStatusText.textContent = isHostedOnline() && !isLocalhost()
    ? "El link ya esta listo. Tu pareja vera solo su vista y cada cambio tuyo se actualizara automaticamente."
    : "El link ya esta armado, pero para usarlo desde el celular de tu pareja conviene publicar la app en Pages o Netlify.";
  elements.partnerLinkPreview.textContent = link || "No pude armar el link todavia.";
  elements.shareWithPartnerBtn.disabled = false;
  elements.copyPartnerLinkBtn.disabled = !link;
}

function renderPhaseGuideEditor() {
  elements.phaseGuideGrid.innerHTML = PHASE_ORDER.map((phase) => {
    const profile = state.phaseProfiles[phase];
    const meta = PHASE_META[phase];

    return `
      <article class="phase-guide-card">
        <header>
          <div>
            <h3>${PHASE_LABELS[phase]}</h3>
            <p>${escapeHtml(meta.description)}</p>
          </div>
          <span class="phase-pill ${phase}">${escapeHtml(meta.energyTitle)}</span>
        </header>

        <label>
          Sintomas probables
          <textarea id="phase-${phase}-symptoms" rows="4" placeholder="Una idea por linea">${escapeHtml(profile.symptoms.join("\n"))}</textarea>
        </label>

        <label>
          Lo que me hace bien
          <textarea id="phase-${phase}-care" rows="4" placeholder="Una idea por linea">${escapeHtml(profile.care.join("\n"))}</textarea>
        </label>

        <label>
          Lo que conviene evitar
          <textarea id="phase-${phase}-avoid" rows="4" placeholder="Una idea por linea">${escapeHtml(profile.avoid.join("\n"))}</textarea>
        </label>

        <label>
          Energia / plan ideal
          <textarea id="phase-${phase}-energy" rows="4" placeholder="Una idea por linea">${escapeHtml(profile.energy.join("\n"))}</textarea>
        </label>
      </article>
    `;
  }).join("");
}

function renderCalendar() {
  elements.monthLabel.textContent = capitalize(formatMonthYear(viewMonth));

  const calendarStart = getCalendarStart(viewMonth);
  const cells = Array.from({ length: 42 }, (_, index) => {
    const date = addDays(calendarStart, index);
    const context = getDailyContext(date);
    const prediction = context.prediction;
    const inMonth = date.getMonth() === viewMonth.getMonth();
    const dailyLog = state.dailyLogs[isoDate(date)];
    const classes = [
      "calendar-cell",
      inMonth ? "current-month" : "outside",
      isSameDay(date, today()) ? "today" : "",
      prediction?.phase === "menstruation" ? "menstruation" : "",
      prediction?.phase === "ovulation" ? "ovulation" : "",
      dailyLog ? "logged" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const hint = dailyLog?.note
      ? dailyLog.note
      : prediction
        ? joinList(context.phaseProfile.symptoms.slice(0, 2))
        : "Sin base";

    return `
      <article class="${classes}">
        <strong>${date.getDate()}</strong>
        <small>${prediction ? PHASE_LABELS[prediction.phase] : "Sin base"}</small>
        <small>${escapeHtml(hint)}</small>
      </article>
    `;
  });

  elements.calendarGrid.innerHTML = cells.join("");
}

function renderHistory() {
  if (!state.periodHistory.length) {
    elements.historyList.innerHTML = `
      <article class="empty-state">
        <h3>Aun no hay periodos cargados</h3>
        <p>Cuando guardes el primero, el promedio y el briefing van a mejorar.</p>
      </article>
    `;
    return;
  }

  elements.historyList.innerHTML = state.periodHistory
    .map((period) => {
      const duration = daysBetweenInclusive(parseISO(period.start), parseISO(period.end));
      return `
        <article class="history-item">
          <header>
            <strong>${escapeHtml(formatShortDate(parseISO(period.start)))} al ${escapeHtml(formatShortDate(parseISO(period.end)))}</strong>
            <button type="button" data-start="${escapeHtml(period.start)}">Quitar</button>
          </header>
          <p>${duration} dias. ${escapeHtml(period.notes || "Sin nota.")}</p>
        </article>
      `;
    })
    .join("");
}

function renderDailyLogCard() {
  const todayKey = isoDate(today());
  const todayLog = state.dailyLogs[todayKey];
  const context = getDailyContext(today());

  if (!todayLog) {
    elements.dailyLogCard.innerHTML = `
      <p>
        Todavia no anotaste nada para hoy. Si registras como te sentiste, la app
        va a comparar tus sensaciones reales con el patron de la fase.
      </p>
      <p>
        ${
          context.prediction
            ? escapeHtml(`Guia de hoy: ${joinList(context.phaseProfile.symptoms.slice(0, 3))}.`)
            : "La guia aparecera cuando tengas una fecha base del ciclo."
        }
      </p>
    `;
    return;
  }

  elements.dailyLogCard.innerHTML = `
    <strong>${escapeHtml(capitalize(formatLongDate(parseISO(todayKey))))}</strong>
    <p>Animo: ${escapeHtml(todayLog.mood || "sin cargar")} | Energia: ${escapeHtml(todayLog.energy || "sin cargar")}</p>
    <p>Sintomas: ${escapeHtml(todayLog.symptoms.length ? joinList(todayLog.symptoms) : "sin cargar")}</p>
    <p>${escapeHtml(todayLog.note || "Sin nota adicional.")}</p>
  `;
}

function renderReminderStatus() {
  if (!state.reminders.enabled) {
    elements.notificationStatus.textContent =
      "Los avisos diarios estan apagados. Puedes prenderlos cuando quieras.";
    return;
  }

  if (!("Notification" in window)) {
    elements.notificationStatus.textContent =
      "Este navegador no soporta notificaciones. El briefing igual queda listo para copiar.";
    return;
  }

  if (!getAnchorDate()) {
    elements.notificationStatus.textContent =
      `El recordatorio esta guardado para las ${state.reminders.time}, pero esperara hasta que registres tu proximo inicio.`;
    return;
  }

  if (Notification.permission === "granted") {
    elements.notificationStatus.textContent =
      `Cicla te avisara a las ${state.reminders.time} en este dispositivo cuando la app este abierta o la abras despues de esa hora.`;
    return;
  }

  if (Notification.permission === "denied") {
    elements.notificationStatus.textContent =
      "Los avisos del navegador estan bloqueados. Puedes seguir usando el briefing manualmente.";
    return;
  }

  elements.notificationStatus.textContent =
    `El recordatorio quedo a las ${state.reminders.time}. Falta activar los avisos del navegador con el boton de arriba.`;
}

function buildShareSummary() {
  const partnerName = state.profile.partnerName || "amor";
  const owner = state.profile.userName || "yo";
  const anchor = getAnchorDate();

  if (!anchor) {
    return `Hola ${partnerName}, Cicla quedo lista pero todavia no marque una fecha confiable de inicio.\n\nEl mapa de cuidados ya esta armado y el briefing diario se activa apenas registre el proximo inicio del periodo.`;
  }

  const todayContext = getDailyContext(today());
  const tomorrowContext = getDailyContext(addDays(today(), 1));
  const nextPeriod = getNextPeriodWindow();
  const nextMilestone =
    todayContext.prediction.phase === "ovulation"
      ? `Sigue la ventana de ovulacion hasta ${todayContext.nextOvulation.label}.`
      : `Proximo periodo estimado: ${nextPeriod.label}.`;

  const lines = [
    `Hola ${partnerName}, briefing de hoy de ${owner}:`,
    "",
    `${owner} esta en ${PHASE_LABELS[todayContext.prediction.phase]} (dia ${todayContext.prediction.cycleDay} del ciclo).`,
    `Lo que mas le ayuda hoy: ${joinList(todayContext.phaseProfile.care)}.`,
    `Conviene evitar: ${joinList(todayContext.phaseProfile.avoid)}.`,
    `Ritmo que le conviene hoy: ${joinList(getPartnerRhythmItems(todayContext.phaseProfile.energy))}.`,
    `Sintomas probables: ${joinList(todayContext.phaseProfile.symptoms)}.`,
    todayContext.dailyLog
      ? `Dato real de hoy: ${buildLogSummary(todayContext.dailyLog)}.`
      : "Todavia no cargo una bitacora real hoy, asi que esto funciona como guia por fase.",
    "",
    `Manana probablemente siga en ${PHASE_LABELS[tomorrowContext.prediction.phase]} y le convenga ${joinList(getPartnerRhythmItems(tomorrowContext.phaseProfile.energy.slice(0, 2)))}.`,
    nextMilestone,
    `Si quieres ayudarla ya mismo, prioriza: ${todayContext.phaseProfile.care[0] || "acompanarla con calma"}.`,
  ];

  return lines.join("\n");
}

function buildTodayCallout(context) {
  if (isPartnerView()) {
    if (context.dailyLog) {
      return `Hoy ella registro ${buildLogSummary(context.dailyLog)}. Toma eso como dato real para acompanarla mejor.`;
    }

    return `${getPartnerSupportCard(context).description} Si dudas, prioriza ${context.phaseProfile.care[0] || "acompanarla con calma"}.`;
  }

  if (context.dailyLog) {
    return `Hoy dejaste asentado ${buildLogSummary(context.dailyLog)}. Tu pareja puede apoyarse en eso y no solo en la prediccion de fase.`;
  }

  return `Hoy el tono mas conveniente es ${context.meta.partnerTitle.toLowerCase()}: ${joinList(context.phaseProfile.care.slice(0, 2))}.`;
}

function buildBriefIntro(context) {
  const nextStep =
    context.prediction.phase === "ovulation"
      ? `Ventana fertil estimada: ${context.nextOvulation.label}.`
      : `Proximo periodo estimado: ${context.nextPeriod.label}.`;

  return `Dia ${context.prediction.cycleDay} del ciclo. ${buildAudiencePhaseSummary(context)} ${nextStep}`;
}

function buildAudiencePhaseSummary(context) {
  if (!isPartnerView()) {
    return context.prediction.summary;
  }

  const cycleLength = getCycleLength();
  const ovulationDay = Math.max(2, cycleLength - LUTEAL_LENGTH);

  if (context.prediction.phase === "menstruation") {
    return `Ella esta en dia ${context.prediction.cycleDay} de menstruacion estimada dentro de un ciclo de ${cycleLength} dias.`;
  }

  if (context.prediction.phase === "follicular") {
    return "Ella esta en una fase de recuperacion con energia en subida despues del periodo.";
  }

  if (context.prediction.phase === "ovulation") {
    return `Ella esta cerca de la ovulacion estimada alrededor del dia ${ovulationDay}.`;
  }

  return "Ella esta en una fase de sensibilidad mas selectiva y conviene bajar friccion.";
}

function buildPartnerPulseSummary(context) {
  if (context.prediction.phase === "menstruation") {
    return "Tu foco hoy: bajale la exigencia y ayudala a descansar de verdad.";
  }

  if (context.prediction.phase === "follicular") {
    return "Tu foco hoy: acompanar su envion y no apagarle la iniciativa.";
  }

  if (context.prediction.phase === "ovulation") {
    return "Tu foco hoy: estar presente, conectar y aprovechar su apertura.";
  }

  return "Tu foco hoy: bajar friccion, simplificarle el dia y darle claridad.";
}

function getPartnerRhythmCard(context) {
  return {
    label: "Ritmo que le conviene",
    value: context.meta.headline,
    description: `Ayudala a sostener esto hoy: ${joinList(getPartnerRhythmItems(context.phaseProfile.energy.slice(0, 2)))}.`,
  };
}

function getPartnerSupportCard(context) {
  if (context.prediction.phase === "menstruation") {
    return {
      label: "Tu mejor apoyo",
      value: "Facilitale descanso",
      description: "Bajale la exigencia, ocupate de lo practico y prioriza contencion.",
    };
  }

  if (context.prediction.phase === "follicular") {
    return {
      label: "Tu mejor apoyo",
      value: "Segui su impulso",
      description: "Acompana sus ganas de hacer, propon planes y no le apagues la iniciativa.",
    };
  }

  if (context.prediction.phase === "ovulation") {
    return {
      label: "Tu mejor apoyo",
      value: "Estate presente",
      description: "Conecta con ella, responde a su energia y aprovecha planes lindos juntos.",
    };
  }

  return {
    label: "Tu mejor apoyo",
    value: "Baja la friccion",
    description: "Se claro, simple y amoroso para que no cargue tension innecesaria.",
  };
}

function getPartnerRhythmItems(items) {
  return items.map((item) => adaptRhythmItemForPartner(item)).filter(Boolean);
}

function adaptRhythmItemForPartner(item) {
  const raw = String(item || "").trim();
  if (!raw) {
    return "";
  }

  const normalized = raw.toLowerCase();
  const exactMatches = {
    "descansar sin culpa": "que descanse sin culpa",
    "hacer lo minimo importante": "que haga lo minimo importante",
    "elegir calma": "que tenga un dia en calma",
    "organizar pendientes": "que organice pendientes",
    "mover el cuerpo": "que mueva el cuerpo",
    "iniciar cosas nuevas": "que inicie cosas nuevas",
    socializar: "que socialice",
    disfrutar: "que disfrute",
    "hacer cosas visibles o creativas": "que haga cosas visibles o creativas",
    "cerrar ciclos": "que cierre ciclos",
    "elegir prioridades": "que elija prioridades",
    "hacer planes tranquilos": "que haga planes tranquilos",
  };

  if (exactMatches[normalized]) {
    return exactMatches[normalized];
  }

  const infinitiveRules = [
    ["descansar ", "que descanse "],
    ["hacer ", "que haga "],
    ["elegir ", "que elija "],
    ["organizar ", "que organice "],
    ["mover ", "que mueva "],
    ["iniciar ", "que inicie "],
    ["cerrar ", "que cierre "],
    ["socializar ", "que socialice "],
    ["disfrutar ", "que disfrute "],
    ["priorizar ", "que priorice "],
  ];

  for (const [prefix, replacement] of infinitiveRules) {
    if (normalized.startsWith(prefix)) {
      return `${replacement}${raw.slice(prefix.length)}`.trim();
    }
  }

  return raw.startsWith("que ") ? raw : `que ${normalized}`;
}

function getDailyContext(date) {
  const prediction = predictForDate(date);
  const phase = prediction?.phase || "menstruation";
  return {
    prediction,
    phaseProfile: getPhaseProfile(phase),
    meta: PHASE_META[phase],
    dailyLog: state.dailyLogs[isoDate(date)] || null,
    nextPeriod: getAnchorDate() ? getNextPeriodWindow() : null,
    nextOvulation: getAnchorDate() ? getNextOvulationWindow() : null,
  };
}

function getPhaseProfile(phase) {
  return state.phaseProfiles[phase] || DEFAULT_PHASE_PROFILES[phase];
}

function predictForDate(date) {
  const anchor = getAnchorDate();
  if (!anchor) {
    return null;
  }

  const cycleLength = getCycleLength();
  const periodLength = getPeriodLength();
  const cycleDay = normalizeCycleDay(daysBetween(parseISO(anchor), date), cycleLength);
  const ovulationDay = Math.max(2, cycleLength - LUTEAL_LENGTH);

  let phase = "luteal";
  if (cycleDay <= periodLength) {
    phase = "menstruation";
  } else if (cycleDay < ovulationDay - 1) {
    phase = "follicular";
  } else if (cycleDay <= ovulationDay + 1) {
    phase = "ovulation";
  }

  return {
    date: isoDate(date),
    cycleDay,
    phase,
    summary: buildPredictionSummary(phase, cycleDay, cycleLength, ovulationDay),
  };
}

function buildPredictionSummary(phase, cycleDay, cycleLength, ovulationDay) {
  if (phase === "menstruation") {
    return `Estas en dia ${cycleDay} de menstruacion estimada dentro de un ciclo de ${cycleLength} dias.`;
  }

  if (phase === "follicular") {
    return "Estas en una fase de recuperacion con energia en subida despues del periodo.";
  }

  if (phase === "ovulation") {
    return `Estas cerca de la ovulacion estimada alrededor del dia ${ovulationDay}.`;
  }

  return "Estas en una fase de sensibilidad mas selectiva y conviene bajar friccion.";
}

function getCycleLength() {
  if (state.periodHistory.length >= 2) {
    const sorted = [...state.periodHistory].sort(
      (left, right) => parseISO(left.start) - parseISO(right.start),
    );
    const gaps = [];

    for (let index = 1; index < sorted.length; index += 1) {
      gaps.push(daysBetween(parseISO(sorted[index - 1].start), parseISO(sorted[index].start)));
    }

    if (gaps.length) {
      return Math.round(gaps.reduce((sum, value) => sum + value, 0) / gaps.length);
    }
  }

  return state.profile.cycleLength;
}

function getPeriodLength() {
  if (state.periodHistory.length) {
    const durations = state.periodHistory.map((period) =>
      daysBetweenInclusive(parseISO(period.start), parseISO(period.end)),
    );
    return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
  }

  return state.profile.periodLength;
}

function getAnchorDate() {
  const recent = mostRecentPeriod();
  if (recent) {
    return recent.start;
  }

  return state.profile.dateUnknown ? "" : state.profile.lastPeriodStart;
}

function mostRecentPeriod() {
  if (!state.periodHistory.length) {
    return null;
  }

  return [...state.periodHistory].sort(
    (left, right) => parseISO(right.start) - parseISO(left.start),
  )[0];
}

function getNextPeriodWindow() {
  const anchor = parseISO(getAnchorDate());
  const cycleLength = getCycleLength();
  const periodLength = getPeriodLength();
  const daysFromAnchor = daysBetween(anchor, today());
  const cyclesCompleted = Math.max(0, Math.ceil((daysFromAnchor + 1) / cycleLength) - 1);
  const start = addDays(anchor, cycleLength * (cyclesCompleted + 1));
  const end = addDays(start, periodLength - 1);

  return {
    start,
    end,
    label: `${formatShortDate(start)} al ${formatShortDate(end)}`,
    daysUntil: Math.max(0, daysBetween(today(), start)),
  };
}

function getNextOvulationWindow() {
  const anchor = parseISO(getAnchorDate());
  const cycleLength = getCycleLength();
  const ovulationDay = Math.max(2, cycleLength - LUTEAL_LENGTH);
  const daysFromAnchor = daysBetween(anchor, today());
  const cyclesCompleted = Math.max(0, Math.ceil((daysFromAnchor + 1) / cycleLength) - 1);
  const center = addDays(anchor, cycleLength * cyclesCompleted + (ovulationDay - 1));
  const adjustedCenter = center < today() ? addDays(center, cycleLength) : center;
  const start = addDays(adjustedCenter, -1);
  const end = addDays(adjustedCenter, 1);

  return {
    start,
    end,
    label: `${formatShortDate(start)} al ${formatShortDate(end)}`,
  };
}

function getConfidenceLabel() {
  if (!getAnchorDate()) {
    return "Baja";
  }

  if (state.periodHistory.length >= 3) {
    return "Alta";
  }

  if (state.periodHistory.length >= 2) {
    return "Media";
  }

  return "Inicial";
}

function supportCard(title, items, description) {
  return `
    <article class="support-card">
      <h3>${escapeHtml(title)}</h3>
      ${listMarkup(items, "Todavia no definiste nada aqui.")}
      <p>${escapeHtml(description)}</p>
    </article>
  `;
}

function statusCard(label, value, description) {
  return `
    <article class="status-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <p>${escapeHtml(description)}</p>
    </article>
  `;
}

function listMarkup(items, emptyText) {
  if (!items.length) {
    return `<p class="mini-note">${escapeHtml(emptyText)}</p>`;
  }

  return `
    <ul class="support-list">
      ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function splitInputList(value) {
  return String(value)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeList(value, fallback) {
  if (Array.isArray(value)) {
    const cleaned = value.map((item) => String(item).trim()).filter(Boolean);
    return cleaned.length ? cleaned : [...fallback];
  }

  if (typeof value === "string") {
    const cleaned = splitInputList(value);
    return cleaned.length ? cleaned : [...fallback];
  }

  return [...fallback];
}

function buildLogSummary(log) {
  const parts = [];

  if (log.mood) {
    parts.push(`animo ${log.mood}`);
  }

  if (log.energy) {
    parts.push(`energia ${log.energy}`);
  }

  if (log.symptoms.length) {
    parts.push(`sintomas ${joinList(log.symptoms)}`);
  }

  if (log.note) {
    parts.push(log.note);
  }

  return parts.length ? parts.join(", ") : "sin datos reales cargados";
}

function joinList(items) {
  if (!items.length) {
    return "sin datos";
  }

  return items.join(", ");
}

function normalizeCycleDay(offset, cycleLength) {
  const normalized = ((offset % cycleLength) + cycleLength) % cycleLength;
  return normalized + 1;
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numeric));
}

function normalizeTime(value) {
  const input = String(value || "").trim();
  return /^\d{2}:\d{2}$/.test(input) ? input : DEFAULT_REMINDERS.time;
}

function today() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

function parseISO(value) {
  const [year, month, day] = String(value)
    .split("-")
    .map(Number);
  return new Date(year, month - 1, day, 12);
}

function isoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return new Date(next.getFullYear(), next.getMonth(), next.getDate(), 12);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function getCalendarStart(monthDate) {
  const monthStart = startOfMonth(monthDate);
  const day = monthStart.getDay();
  const mondayIndex = (day + 6) % 7;
  return addDays(monthStart, -mondayIndex);
}

function daysBetween(start, end) {
  return Math.round((stripTime(end) - stripTime(start)) / MS_PER_DAY);
}

function daysBetweenInclusive(start, end) {
  return daysBetween(start, end) + 1;
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatWeekday(date) {
  return new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(date);
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatMonthYear(date) {
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function isSameDay(left, right) {
  return isoDate(left) === isoDate(right);
}

function capitalize(value) {
  const input = String(value || "");
  return input ? input.charAt(0).toUpperCase() + input.slice(1) : "";
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function startReminderWatcher() {
  if (reminderIntervalId) {
    window.clearInterval(reminderIntervalId);
  }

  reminderIntervalId = window.setInterval(() => {
    maybeSendDailyReminder();
    renderReminderStatus();
  }, 60000);
}

function isPastReminderTime(date, time) {
  const [hour, minute] = normalizeTime(time)
    .split(":")
    .map(Number);

  if (date.getHours() > hour) {
    return true;
  }

  if (date.getHours() === hour && date.getMinutes() >= minute) {
    return true;
  }

  return false;
}

async function maybeSendDailyReminder(force = false) {
  if (!state.reminders.enabled || !getAnchorDate()) {
    return;
  }

  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const todayKey = isoDate(today());
  if (state.reminders.lastShownDate === todayKey) {
    return;
  }

  if (!force && !isPastReminderTime(new Date(), state.reminders.time)) {
    return;
  }

  const title = state.profile.partnerName
    ? `Cicla: briefing para ${state.profile.partnerName}`
    : "Cicla: briefing del dia";

  try {
    await showReminderNotification(title, buildNotificationBody());
    state.reminders.lastShownDate = todayKey;
    saveState();
    renderReminderStatus();
  } catch (error) {
    console.error("No pude mostrar la notificacion", error);
  }
}

function buildNotificationBody() {
  const context = getDailyContext(today());

  if (!context.prediction) {
    return "Cicla sigue esperando una fecha base para activar el briefing.";
  }

  return `${PHASE_LABELS[context.prediction.phase]} hoy. Le ayuda: ${joinList(
    context.phaseProfile.care.slice(0, 2),
  )}. Evita: ${joinList(context.phaseProfile.avoid.slice(0, 1))}.`;
}

async function showReminderNotification(title, body) {
  const options = {
    body,
    icon: "./assets/icon-192.png",
    badge: "./assets/icon-192.png",
    tag: `cicla-${isoDate(today())}`,
    data: { url: "./" },
  };

  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      return;
    } catch (error) {
      console.error("No pude usar el service worker para la notificacion", error);
    }
  }

  new Notification(title, options);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.error("No pude registrar el service worker", error);
    });
  });
}
