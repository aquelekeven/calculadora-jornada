const STORE = "jfb_cloud_shadow_v1";
const SUPABASE_TABLE = "user_data";
const THEME = "jfb_theme_v1";
const JOURNEY = 480;
const TOLERANCE = 10;
const APP_RELEASE_ID = "v2.4";


const MATH_BURST_SYMBOLS = [
  "+", "−", "×", "÷", "=", "%", "√", "π", "Σ", "∞",
  "1", "2", "3", "4", "7", "8", "9", "(", ")", "x²"
];

function triggerMathBurst(icon) {
  if (!icon) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  icon.classList.remove("math-burst-active");
  void icon.offsetWidth;
  icon.classList.add("math-burst-active");

  if (reducedMotion) {
    window.setTimeout(() => icon.classList.remove("math-burst-active"), 360);
    return;
  }

  icon.querySelectorAll(".math-burst-layer").forEach((layer) => layer.remove());

  const layer = document.createElement("span");
  layer.className = "math-burst-layer";
  layer.setAttribute("aria-hidden", "true");

  const compact = Boolean(icon.closest(".compact-brand"));
  const particleCount = compact ? 18 : 22;
  const baseDistance = compact ? 62 : 72;

  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement("span");
    const angle = ((Math.PI * 2) / particleCount) * index + (Math.random() - 0.5) * 0.32;
    const distance = baseDistance + Math.random() * (compact ? 34 : 42);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const rotation = -150 + Math.random() * 300;
    const scale = 0.82 + Math.random() * 0.72;
    const delay = Math.random() * 90;

    particle.className = "math-burst-particle";
    particle.textContent = MATH_BURST_SYMBOLS[
      Math.floor(Math.random() * MATH_BURST_SYMBOLS.length)
    ];
    particle.style.setProperty("--burst-x", `${x.toFixed(1)}px`);
    particle.style.setProperty("--burst-y", `${y.toFixed(1)}px`);
    particle.style.setProperty("--burst-rotation", `${rotation.toFixed(0)}deg`);
    particle.style.setProperty("--burst-scale", scale.toFixed(2));
    particle.style.setProperty("--burst-delay", `${delay.toFixed(0)}ms`);

    layer.appendChild(particle);
  }

  icon.appendChild(layer);

  window.setTimeout(() => {
    layer.remove();
    icon.classList.remove("math-burst-active");
  }, 1250);
}

function initializeMathBurst() {
  document.querySelectorAll(".brand-calculator-icon").forEach((icon) => {
    icon.setAttribute("role", "button");
    icon.setAttribute("tabindex", "0");
    icon.setAttribute("aria-label", "Soltar símbolos matemáticos");
    icon.setAttribute("title", "Clique para uma explosão matemática");

    icon.addEventListener("click", () => triggerMathBurst(icon));
    icon.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      triggerMathBurst(icon);
    });
  });
}

const DEFAULT_MASCOT = "panda";
const DEFAULT_PALETTE = "panda";
const LEGACY_MASCOT_MAP = { urso: "panda", raposa: "pato", coruja: "coruja" };
const LEGACY_PALETTE_MAP = { urso: "panda", raposa: "pato", coruja: "coruja" };

const PALETTES = {
  panda: {
    label: "Panda",
    description: "Cinza, grafite e gelo",
    swatches: ["#1f2024", "#7f8591", "#eceef3"],
    themeLight: "#f3f4f7",
    themeDark: "#141518",
    iconLight: "#505661",
    iconDark: "#d9dde5"
  },
  pato: {
    label: "Pato",
    description: "Amarelo, laranja e café",
    swatches: ["#6b3a1f", "#ea6c2f", "#ffe28a"],
    themeLight: "#fff7e7",
    themeDark: "#1c140d",
    iconLight: "#d86625",
    iconDark: "#ffb466"
  },
  coelha: {
    label: "Coelha",
    description: "Rosa, blush e creme",
    swatches: ["#a66b7c", "#d9a6b7", "#f7e8ef"],
    themeLight: "#fff7fa",
    themeDark: "#1f1519",
    iconLight: "#b76584",
    iconDark: "#f1a9c5"
  },
  coruja: {
    label: "Coruja",
    description: "Lilás, ameixa e rosé",
    swatches: ["#5f3865", "#a36fd0", "#f1dff6"],
    themeLight: "#faf4fc",
    themeDark: "#18121d",
    iconLight: "#78478d",
    iconDark: "#d1a1e7"
  }
};

const MASCOTS = {
  panda: {
    label: "Panda",
    palette: "panda",
    image: "mascot-panda.png"
  },
  pato: {
    label: "Pato",
    palette: "pato",
    image: "mascot-pato.png"
  },
  coelha: {
    label: "Coelha",
    palette: "coelha",
    image: "mascot-coelha.png"
  },
  coruja: {
    label: "Coruja",
    palette: "coruja",
    image: "mascot-coruja.png"
  }
};

function mascotMarkup(id) {
  const mascot = MASCOTS[id] || MASCOTS[DEFAULT_MASCOT];
  return `<img src="${mascot.image}" alt="" class="mascot-image" loading="eager" decoding="async" />`;
}

function ensureMascot(user) {
  const mascot = LEGACY_MASCOT_MAP[user?.mascot] || user?.mascot;
  return MASCOTS[mascot] ? mascot : DEFAULT_MASCOT;
}

function ensurePalette(user) {
  const palette = LEGACY_PALETTE_MAP[user?.palette] || user?.palette;
  if (PALETTES[palette]) return palette;
  const mascot = ensureMascot(user);
  return MASCOTS[mascot]?.palette || DEFAULT_PALETTE;
}

function isPaletteIndependent(user) {
  return user?.paletteIndependent === true;
}


function updateDynamicAppIcon() {
  const favicon = document.getElementById("appFavicon");

  if (!favicon) return;

  const paletteId =
    document.documentElement.dataset.palette ||
    DEFAULT_PALETTE;

  const palette =
    PALETTES[paletteId] ||
    PALETTES[DEFAULT_PALETTE];

  const dark =
    document.documentElement.dataset.theme === "dark";

  const color = dark
    ? palette.iconDark
    : palette.iconLight;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <g fill="none" stroke="${color}" stroke-width="4"
        stroke-linecap="round" stroke-linejoin="round">
        <rect x="13" y="7" width="38" height="50" rx="8"/>
        <rect x="20" y="15" width="24" height="10" rx="2"/>
        <path d="M20 34h4M30 34h4M40 34h4"/>
        <path d="M20 43h4M30 43h4M40 43h4"/>
        <path d="M20 51h4M30 51h4M40 51h4"/>
      </g>
    </svg>
  `;

  favicon.href =
    `data:image/svg+xml,${encodeURIComponent(svg)}`;

  favicon.type = "image/svg+xml";
}

function updateThemeColor() {
  const paletteId = document.documentElement.dataset.palette || DEFAULT_PALETTE;
  const palette = PALETTES[paletteId] || PALETTES[DEFAULT_PALETTE];
  const dark = document.documentElement.dataset.theme === "dark";

  if (el.themeColor) {
    el.themeColor.content = dark ? palette.themeDark : palette.themeLight;
  }

  updateDynamicAppIcon();
}

function applyPalette(paletteId) {
  const palette = PALETTES[paletteId] ? paletteId : DEFAULT_PALETTE;
  document.documentElement.dataset.palette = palette;
  updateThemeColor();
}


const $ = (id) => document.getElementById(id);

const el = {
  toast: $("toast"),
  themeColor: $("themeColor"),
  authView: $("authView"),
  appView: $("appView"),
  authTabs: $("authTabs"),
  googleLogin: $("googleLogin"),
  authLoading: $("authLoading"),
  authLoadingText: $("authLoadingText"),
  authConfigWarning: $("authConfigWarning"),
  syncStatus: $("syncStatus"),
  syncStatusText: $("syncStatusText"),
  updatesButton: $("updatesButton"),
  updatesUnread: $("updatesUnread"),
  updatesDialog: $("updatesDialog"),
  closeUpdates: $("closeUpdates"),
  rankingButton: $("rankingButton"),
  rankingDock: $("rankingDock"),
  rankingDockOpen: $("rankingDockOpen"),
  rankingDockStatus: $("rankingDockStatus"),
  rankingDockList: $("rankingDockList"),
  rankingDockParticipation: $("rankingDockParticipation"),
  rankingDialog: $("rankingDialog"),
  rankingDialogStatus: $("rankingDialogStatus"),
  rankingDialogList: $("rankingDialogList"),
  rankingDialogParticipation: $("rankingDialogParticipation"),
  openCupPreview: $("openCupPreview"),
  cupResultDialog: $("cupResultDialog"),
  cupConfetti: $("cupConfetti"),
  cupResultPeriod: $("cupResultPeriod"),
  cupBoardPeriod: $("cupBoardPeriod"),
  cupPodium: $("cupPodium"),
  cupResultList: $("cupResultList"),
  cupMyResult: $("cupMyResult"),
  closeCupResultTop: $("closeCupResultTop"),
  closeCupResult: $("closeCupResult"),
  cupBackToRanking: $("cupBackToRanking"),
  profileRankAnchor: $("profileRankAnchor"),
  profileRankCard: $("profileRankCard"),
  profileRankDot: $("profileRankDot"),
  profileRankTitle: $("profileRankTitle"),
  profileRankMeta: $("profileRankMeta"),
  accountRankingCard: $("accountRankingCard"),
  accountRankingBadge: $("accountRankingBadge"),
  accountRankPosition: $("accountRankPosition"),
  accountRankTitle: $("accountRankTitle"),
  accountRankMedals: $("accountRankMedals"),
  accountRankStatus: $("accountRankStatus"),
  accountRankingParticipation: $("accountRankingParticipation"),
  closeRanking: $("closeRanking"),
  privacyDialog: $("privacyDialog"),
  termsDialog: $("termsDialog"),
  backupInput: $("backupInput"),

  noteDialog: $("noteDialog"),
  noteForm: $("noteForm"),
  noteDate: $("noteDate"),
  noteText: $("noteText"),
  noteCounter: $("noteCounter"),
  noteError: $("noteError"),
  deleteNote: $("deleteNote"),
  cancelNote: $("cancelNote"),

  negativeExcuseDialog: $("negativeExcuseDialog"),
  negativeExcuseForm: $("negativeExcuseForm"),
  negativeExcuseDate: $("negativeExcuseDate"),
  negativeExcuseOriginal: $("negativeExcuseOriginal"),
  negativeExcuseHours: $("negativeExcuseHours"),
  negativeExcuseMinutes: $("negativeExcuseMinutes"),
  negativeExcuseReason: $("negativeExcuseReason"),
  negativeExcuseFull: $("negativeExcuseFull"),
  negativeExcusePreview: $("negativeExcusePreview"),
  negativeExcuseError: $("negativeExcuseError"),
  removeNegativeExcuse: $("removeNegativeExcuse"),
  cancelNegativeExcuse: $("cancelNegativeExcuse"),

  userBadge: $("userBadge"),
  userAvatar: $("userAvatar"),
  userBadgeText: $("userBadgeText"),
  logout: $("logout"),
  installAuth: $("installAuth"),
  installApp: $("installApp"),

  tabToday: $("tabToday"),
  tabRecord: $("tabRecord"),
  tabHistory: $("tabHistory"),
  tabAccount: $("tabAccount"),
  statsButton: $("statsButton"),
  achievementsButton: $("achievementsButton"),
  statsBackHome: $("statsBackHome"),
  statsScrollTop: $("statsScrollTop"),
  statsPageTop: $("statsPageTop"),
  achievementsBackHome: $("achievementsBackHome"),
  achievementsScrollTop: $("achievementsScrollTop"),
  achievementsPageTop: $("achievementsPageTop"),
  mainNavigation: $("mainNavigation"),
  todayPanel: $("todayPanel"),
  recordPanel: $("recordPanel"),
  historyPanel: $("historyPanel"),
  statsPanel: $("statsPanel"),
  achievementsPanel: $("achievementsPanel"),
  accountPanel: $("accountPanel"),

  statsViewTabs: $("statsViewTabs"),
  statsDashboardView: $("statsDashboardView"),
  achievementsView: $("achievementsView"),
  achievementNavCount: $("achievementNavCount"),
  achievementUnlockedCount: $("achievementUnlockedCount"),
  achievementTotalCount: $("achievementTotalCount"),
  achievementProgressTitle: $("achievementProgressTitle"),
  achievementProgressText: $("achievementProgressText"),
  achievementProgressBar: $("achievementProgressBar"),
  achievementCategoryFilter: $("achievementCategoryFilter"),
  achievementFilters: $("achievementFilters"),
  achievementGrid: $("achievementGrid"),

  statsPeriodTabs: $("statsPeriodTabs"),
  statsEmpty: $("statsEmpty"),
  statsContent: $("statsContent"),
  statsPeriodLabel: $("statsPeriodLabel"),
  statsTotalWorked: $("statsTotalWorked"),
  statsEquivalentDays: $("statsEquivalentDays"),
  statsEquivalentWeeks: $("statsEquivalentWeeks"),
  statsWorkedDays: $("statsWorkedDays"),
  statsAveragePerDay: $("statsAveragePerDay"),
  statsRecords: $("statsRecords"),
  statsHabits: $("statsHabits"),
  statsComparisons: $("statsComparisons"),

  accountAvatar: $("accountAvatar"),
  accountName: $("accountName"),
  accountCode: $("accountCode"),
  mascotGrid: $("mascotGrid"),
  paletteIndependent: $("paletteIndependent"),
  paletteGrid: $("paletteGrid"),
  paletteLinkStatus: $("paletteLinkStatus"),

  salaryEstimateEnabled: $("salaryEstimateEnabled"),
  salaryFields: $("salaryFields"),
  salaryBase: $("salaryBase"),
  salaryDivisor: $("salaryDivisor"),
  salaryWeekdayPremium: $("salaryWeekdayPremium"),
  salarySpecialPremium: $("salarySpecialPremium"),
  salaryEstimateNegative: $("salaryEstimateNegative"),
  salaryNormalHour: $("salaryNormalHour"),
  salaryWeekdayHour: $("salaryWeekdayHour"),
  salarySpecialHour: $("salarySpecialHour"),

  todayPastedText: $("todayPastedText"),
  parseTodayText: $("parseTodayText"),
  todayParseStatus: $("todayParseStatus"),
  todayEntry: $("todayEntry"),
  todayLunchOut: $("todayLunchOut"),
  todayLunchBack: $("todayLunchBack"),
  todayUseRealExit: $("todayUseRealExit"),
  todayRealExitBlock: $("todayRealExitBlock"),
  todayRealExit: $("todayRealExit"),
  todayRealMetrics: $("todayRealMetrics"),
  todayTotalWorked: $("todayTotalWorked"),
  todayBalanceMetric: $("todayBalanceMetric"),
  todayBalance: $("todayBalance"),
  todayExactExit: $("todayExactExit"),
  todayToleranceExit: $("todayToleranceExit"),
  todayMaxExit: $("todayMaxExit"),
  todayResult: $("todayResult"),
  todayResultLabel: $("todayResultLabel"),
  todayResultText: $("todayResultText"),
  todayResultValue: $("todayResultValue"),
  clearToday: $("clearToday"),
  todayError: $("todayError"),

  recordPastedText: $("recordPastedText"),
  recordPasteHint: $("recordPasteHint"),
  recordModeWithLunch: $("recordModeWithLunch"),
  recordModeNoLunch: $("recordModeNoLunch"),
  recordModeHint: $("recordModeHint"),
  recordFieldsGrid: $("recordFieldsGrid"),
  recordLunchOutField: $("recordLunchOutField"),
  recordLunchBackField: $("recordLunchBackField"),
  parseRecordText: $("parseRecordText"),
  recordParseStatus: $("recordParseStatus"),
  date: $("date"),
  dateDisplay: $("dateDisplay"),
  datePickerButton: $("datePickerButton"),
  recordEntry: $("recordEntry"),
  recordLunchOut: $("recordLunchOut"),
  recordLunchBack: $("recordLunchBack"),
  recordRealExit: $("recordRealExit"),
  recordTotal: $("recordTotal"),
  recordLunchTime: $("recordLunchTime"),
  recordLunchMetric: $("recordLunchMetric"),
  recordLunchMetricLabel: $("recordLunchMetricLabel"),
  recordLunchMetricHint: $("recordLunchMetricHint"),
  recordBalanceMetric: $("recordBalanceMetric"),
  recordBalance: $("recordBalance"),
  recordResult: $("recordResult"),
  recordResultLabel: $("recordResultLabel"),
  recordResultText: $("recordResultText"),
  recordResultValue: $("recordResultValue"),
  saveDay: $("saveDay"),
  clearRecord: $("clearRecord"),
  recordError: $("recordError"),

  calendarDialog: $("calendarDialog"),
  calendarTitle: $("calendarTitle"),
  calendarGrid: $("calendarGrid"),
  calendarPrev: $("calendarPrev"),
  calendarNext: $("calendarNext"),
  calendarToday: $("calendarToday"),
  calendarCancel: $("calendarCancel"),

  daysCount: $("daysCount"),
  balanceMetric: $("balanceMetric"),
  totalBalance: $("totalBalance"),
  lastDate: $("lastDate"),
  emptyHistory: $("emptyHistory"),
  historyList: $("historyList"),
  exportBackup: $("exportBackup"),
  openDeleteAccount: $("openDeleteAccount"),
  deleteAccountDialog: $("deleteAccountDialog"),
  deleteAccountForm: $("deleteAccountForm"),
  deleteAccountCode: $("deleteAccountCode"),
  deleteAccountConfirm: $("deleteAccountConfirm"),
  deleteAccountError: $("deleteAccountError"),
  cancelDeleteAccount: $("cancelDeleteAccount"),
};

let currentUser = null;
let supabaseClient = null;
let authSession = null;
let cloudAccountsCache = {};
let cloudSaveTimer = null;
let cloudSaveChain = Promise.resolve();
let cloudSavePending = false;
let cloudSessionUserId = null;
let cloudOfflineMode = false;
let authTransitionId = 0;
let lastRecord = null;
let installPrompt = null;
let historyMonthKey = null;
let statsPeriod = "month";
let statsSubview = "dashboard";
let achievementFilter = "all";
let achievementCategoryFilter = "all";
let lastAppPage = "today";
let toastTimer = null;
let calendarCursor = new Date();
let noteTargetId = null;
let negativeExcuseTargetId = null;
let negativeExcuseMaximum = 0;
let medalRankingRows = [];
let medalRankingParticipates = true;
let medalRankingAvailable = false;
let medalRankingLoading = false;
let medalRankingError = "";
let medalRankingRefreshTimer = null;

function accounts() {
  return cloudAccountsCache;
}

function localShadowAccounts() {
  try {
    return JSON.parse(localStorage.getItem(STORE) || "{}");
  } catch {
    return {};
  }
}

function saveAccounts(value) {
  cloudAccountsCache = value && typeof value === "object"
    ? value
    : {};

  try {
    localStorage.setItem(STORE, JSON.stringify(cloudAccountsCache));
  } catch (error) {
    console.warn("Não foi possível atualizar a cópia local.", error);
  }

  scheduleCloudSave();
}

function cloudConfig() {
  const config = window.JFB_CONFIG || {};
  const url = String(config.supabaseUrl || "").trim();
  const key = String(config.supabasePublishableKey || "").trim();
  const placeholder = /COLE_AQUI|SEU_|YOUR_|EXEMPLO/i;

  return {
    url,
    key,
    ready: Boolean(
      url &&
      key &&
      !placeholder.test(url) &&
      !placeholder.test(key)
    )
  };
}

function setAuthLoading(active, message = "Verificando sua sessão…") {
  if (el.authLoadingText) {
    el.authLoadingText.textContent = message;
  }

  el.authLoading?.classList.toggle("hidden", !active);

  if (el.googleLogin) {
    el.googleLogin.disabled = active || !cloudConfig().ready;
  }
}

function setSyncState(state, message) {
  if (!el.syncStatus || !el.syncStatusText) return;

  const labels = {
    connecting: "Conectando…",
    saving: "Salvando…",
    synced: "Sincronizado",
    offline: "Sem conexão",
    error: "Erro ao sincronizar"
  };

  el.syncStatus.dataset.state = state;
  el.syncStatusText.textContent = message || labels[state] || "Sincronização";
  el.syncStatus.title = el.syncStatusText.textContent;
}

function cleanAppUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

function authIdentity(authUser) {
  const metadata = authUser?.user_metadata || {};
  const fullName = normalizeName(
    metadata.full_name ||
    metadata.name ||
    authUser?.email?.split("@")[0] ||
    "Usuário"
  );
  const parts = fullName.split(" ").filter(Boolean);

  return {
    firstName: parts.shift() || "Usuário",
    lastName: parts.join(" "),
    email: authUser?.email || "",
    googleSubject: authUser?.id || ""
  };
}

function createCloudAccount(authUser) {
  const identity = authIdentity(authUser);

  return {
    code: authUser.id,
    firstName: identity.firstName,
    lastName: identity.lastName,
    email: identity.email,
    googleSubject: identity.googleSubject,
    authProvider: "google",
    createdAt: new Date().toISOString(),
    mascot: DEFAULT_MASCOT,
    palette: DEFAULT_PALETTE,
    paletteIndependent: false,
    salarySettings: { ...DEFAULT_SALARY_SETTINGS },
    achievementState: newAchievementState(),
    lastSeenRelease: "",
    history: []
  };
}

function normalizeCloudAccount(account, authUser) {
  const identity = authIdentity(authUser);
  const normalized = account && typeof account === "object"
    ? { ...account }
    : createCloudAccount(authUser);

  normalized.code = authUser.id;
  normalized.email = identity.email;
  normalized.googleSubject = authUser.id;
  normalized.authProvider = "google";
  normalized.firstName = normalizeName(normalized.firstName) || identity.firstName;
  normalized.lastName = normalizeName(normalized.lastName) || identity.lastName;
  normalized.mascot = ensureMascot(normalized);
  normalized.palette = ensurePalette(normalized);
  normalized.paletteIndependent = normalized.paletteIndependent === true;
  normalized.salarySettings = {
    ...DEFAULT_SALARY_SETTINGS,
    ...(normalized.salarySettings || {})
  };
  normalized.history = Array.isArray(normalized.history)
    ? normalized.history
    : [];
  normalized.lastSeenRelease = typeof normalized.lastSeenRelease === "string"
    ? normalized.lastSeenRelease
    : "";

  if (!normalized.achievementState) {
    normalized.achievementState = newAchievementState(normalized);
  }

  ensureAchievementState(normalized);
  return normalized;
}

function scheduleCloudSave(delay = 220) {
  if (!currentUser || !supabaseClient || !authSession) return;

  cloudSavePending = true;
  setSyncState(navigator.onLine ? "saving" : "offline");
  clearTimeout(cloudSaveTimer);

  cloudSaveTimer = setTimeout(() => {
    persistCurrentUserNow();
  }, delay);
}

function persistCurrentUserNow() {
  clearTimeout(cloudSaveTimer);

  if (!currentUser || !supabaseClient || !authSession) {
    return Promise.resolve();
  }

  const account = cloudAccountsCache[currentUser];
  if (!account) return Promise.resolve();

  const payload = JSON.parse(JSON.stringify(account));
  cloudSavePending = true;
  setSyncState(navigator.onLine ? "saving" : "offline");

  cloudSaveChain = cloudSaveChain
    .catch(() => undefined)
    .then(async () => {
      const { error } = await supabaseClient
        .from(SUPABASE_TABLE)
        .upsert(
          {
            user_id: currentUser,
            account_data: payload,
            updated_at: new Date().toISOString()
          },
          { onConflict: "user_id" }
        );

      if (error) {
        cloudSavePending = true;
        setSyncState(navigator.onLine ? "error" : "offline");
        throw error;
      }

      cloudSavePending = false;
      cloudOfflineMode = false;
      setSyncState("synced");
      scheduleMedalRankingRefresh();
    })
    .catch((error) => {
      console.error("Falha ao sincronizar os dados.", error);
    });

  return cloudSaveChain;
}

async function loadCloudAccount(session) {
  const authUser = session.user;
  let account = null;
  let remoteError = null;

  const { data, error } = await supabaseClient
    .from(SUPABASE_TABLE)
    .select("account_data, updated_at")
    .eq("user_id", authUser.id)
    .maybeSingle();

  if (error) {
    remoteError = error;
  } else if (data?.account_data) {
    account = data.account_data;
  }

  if (!account) {
    const shadow = localShadowAccounts();
    account = shadow[authUser.id] || null;
  }

  const isNew = !account;
  account = normalizeCloudAccount(account, authUser);
  cloudAccountsCache = { [authUser.id]: account };

  try {
    localStorage.setItem(STORE, JSON.stringify(cloudAccountsCache));
  } catch {
    // A cópia local é auxiliar; o banco continua sendo a fonte principal.
  }

  if (remoteError && !data) {
    if (!isNew) {
      cloudOfflineMode = true;
      cloudSavePending = true;
      setSyncState("offline", "Cópia local — aguardando conexão");
      return;
    }

    throw new Error(
      `${remoteError.message}. Confira se o SQL de configuração foi executado.`
    );
  }

  cloudOfflineMode = false;

  if (isNew || !data?.account_data) {
    await persistCurrentUserNow();
  }
}

async function signInWithGoogle() {
  if (!supabaseClient) {
    return toast("A integração com o Google ainda não foi configurada.", "error");
  }

  setAuthLoading(true, "Abrindo o Google…");

  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: cleanAppUrl(),
      queryParams: {
        prompt: "select_account"
      }
    }
  });

  if (error) {
    setAuthLoading(false);
    toast(`Não foi possível abrir o Google: ${error.message}`, "error");
  }
}

function resetCloudInterface() {
  currentUser = null;
  cloudSessionUserId = null;
  cloudOfflineMode = false;
  authSession = null;
  cloudAccountsCache = {};
  cloudSavePending = false;
  clearTimeout(cloudSaveTimer);
  clearTimeout(medalRankingRefreshTimer);
  medalRankingRows = [];
  medalRankingParticipates = true;
  medalRankingAvailable = false;
  medalRankingLoading = false;
  medalRankingError = "";
  el.rankingDock?.classList.add("hidden");
  if (el.rankingDialog?.open) el.rankingDialog.close();
  localStorage.removeItem(STORE);

  el.appView.classList.add("hidden");
  el.authView.classList.remove("hidden");
  applyPalette(DEFAULT_PALETTE);
  setSyncState("connecting");
}

async function handleCloudSession(session) {
  const transitionId = ++authTransitionId;

  if (!session?.user) {
    resetCloudInterface();
    setAuthLoading(false);
    return;
  }

  if (
    cloudSessionUserId === session.user.id &&
    currentUser === session.user.id &&
    !el.appView.classList.contains("hidden")
  ) {
    authSession = session;
    return;
  }

  setAuthLoading(true, "Carregando seus registros…");
  setSyncState("connecting");
  authSession = session;
  currentUser = session.user.id;

  try {
    await loadCloudAccount(session);

    if (transitionId !== authTransitionId) return;

    cloudSessionUserId = session.user.id;
    openApp(session.user.id);
    setSyncState(
      cloudOfflineMode
        ? "offline"
        : cloudSavePending
          ? "saving"
          : "synced"
    );

    if (window.location.search || window.location.hash) {
      window.history.replaceState({}, document.title, cleanAppUrl());
    }
  } catch (error) {
    console.error(error);
    resetCloudInterface();
    el.authConfigWarning.textContent =
      `Não foi possível carregar sua conta: ${error.message}`;
    el.authConfigWarning.classList.remove("hidden");
    toast("Falha ao carregar os dados da conta.", "error");
  } finally {
    setAuthLoading(false);
  }
}

async function initializeCloudAuth() {
  const config = cloudConfig();

  if (!config.ready) {
    el.googleLogin.disabled = true;
    el.authConfigWarning.textContent =
      "Integração ainda não configurada. Preencha o arquivo config.js e execute o supabase-setup.sql.";
    el.authConfigWarning.classList.remove("hidden");
    setAuthLoading(false);
    return;
  }

  if (!window.supabase?.createClient) {
    el.googleLogin.disabled = true;
    el.authConfigWarning.textContent =
      "Não foi possível carregar a biblioteca de autenticação. Verifique sua conexão e recarregue a página.";
    el.authConfigWarning.classList.remove("hidden");
    return;
  }

  supabaseClient = window.supabase.createClient(config.url, config.key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce"
    }
  });

  el.authConfigWarning.classList.add("hidden");
  el.googleLogin.disabled = false;
  setAuthLoading(true);

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => handleCloudSession(session), 0);
  });

  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    setAuthLoading(false);
    el.authConfigWarning.textContent =
      `Não foi possível verificar sua sessão: ${error.message}`;
    el.authConfigWarning.classList.remove("hidden");
    return;
  }

  await handleCloudSession(data.session);
}

function normalizeName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function displayName(user) {
  return [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || "Usuário";
}

function toast(message, type = "ok") {
  clearTimeout(toastTimer);
  el.toast.textContent = message;
  el.toast.classList.remove("hidden", "error");

  if (type === "error") {
    el.toast.classList.add("error");
  }

  toastTimer = setTimeout(() => {
    el.toast.classList.add("hidden");
  }, 3500);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME, theme);
  updateThemeColor();

  document.querySelectorAll(".theme-toggle").forEach((button) => {
    const label = theme === "dark"
      ? "Ativar modo claro"
      : "Ativar modo noturno";

    button.setAttribute("aria-label", label);
    button.title = label;
  });
}

function toggleTheme() {
  applyTheme(
    document.documentElement.dataset.theme === "dark"
      ? "light"
      : "dark"
  );
}

function openApp(code) {
  currentUser = code;

  const allAccounts = accounts();
  const user = allAccounts[code];

  let migrated = false;

  const normalizedMascot = ensureMascot(user);
  const normalizedPalette = ensurePalette(user);

  if (user.mascot !== normalizedMascot) {
    user.mascot = normalizedMascot;
    migrated = true;
  }

  if (user.palette !== normalizedPalette) {
    user.palette = normalizedPalette;
    migrated = true;
  }

  if (typeof user.paletteIndependent !== "boolean") {
    user.paletteIndependent = false;
    migrated = true;
  }

  if (!user.salarySettings) {
    user.salarySettings = { ...DEFAULT_SALARY_SETTINGS };
    migrated = true;
  }

  if (!user.achievementState) {
    user.achievementState = newAchievementState(user);
    migrated = true;
  }

  ensureAchievementState(user);

  if (migrated) {
    allAccounts[code] = user;
    saveAccounts(allAccounts);
  }

  applyPalette(ensurePalette(user));

  el.authView.classList.add("hidden");
  el.appView.classList.remove("hidden");

  updateAccountInterface();
  updateUpdatesIndicator();

  if (!el.date.value) {
    setSelectedDate(yesterday());
  }

  initializeAchievementsSilently();

  showTab("today");
  calculateToday();
  calculateRecord();
  renderHistory();
  renderAchievements();
  el.rankingDock?.classList.remove("hidden");
  loadMedalRanking();
}


function renderMascotPicker() {
  const user = accounts()[currentUser];
  if (!user) return;

  const selected = ensureMascot(user);

  el.mascotGrid.innerHTML = Object.entries(MASCOTS)
    .map(([id, mascot]) => `
      <button
        class="mascot-option ${id === selected ? "selected" : ""}"
        data-mascot="${id}"
        type="button"
        aria-label="Usar mascote ${mascot.label}"
        aria-pressed="${id === selected}"
      >
        <span class="profile-avatar" aria-hidden="true">
          ${mascotMarkup(id)}
        </span>
        <span>${mascot.label}</span>
      </button>
    `)
    .join("");

  el.mascotGrid
    .querySelectorAll(".mascot-option")
    .forEach((button) => {
      button.addEventListener("click", () => {
        selectMascot(button.dataset.mascot);
      });
    });
}

function renderPalettePicker() {
  const user = accounts()[currentUser];
  if (!user) return;

  const selected = ensurePalette(user);
  const independent = isPaletteIndependent(user);

  el.paletteIndependent.checked = independent;
  el.paletteLinkStatus.textContent = independent
    ? "Paleta separada"
    : "Vinculada ao mascote";
  el.paletteGrid.classList.toggle("locked", !independent);

  el.paletteGrid.innerHTML = Object.entries(PALETTES)
    .map(([id, palette]) => `
      <button
        class="palette-option ${id === selected ? "selected" : ""}"
        data-palette="${id}"
        type="button"
        ${independent ? "" : "disabled"}
        aria-pressed="${id === selected}"
      >
        <span class="palette-swatches" aria-hidden="true">
          ${palette.swatches.map((color) => `<i style="--swatch:${color}"></i>`).join("")}
        </span>
        <span>
          <strong>${palette.label}</strong>
          <small>${palette.description}</small>
        </span>
      </button>
    `)
    .join("");

  el.paletteGrid
    .querySelectorAll(".palette-option:not(:disabled)")
    .forEach((button) => {
      button.addEventListener("click", () => {
        selectPalette(button.dataset.palette);
      });
    });
}


const DEFAULT_SALARY_SETTINGS = {
  enabled: false,
  salaryBase: 0,
  divisor: 200,
  weekdayPremium: 50,
  specialPremium: 100,
  estimateNegative: true
};

function finiteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBrazilianNumber(value) {
  const text = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(/R\$/gi, "");

  if (!text) return 0;

  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatBrazilianNumber(value, decimals = 2) {
  const number = finiteNumber(value, 0);

  if (!number) return "";

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
}

function money(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(finiteNumber(value, 0));
}

function salarySettings(user) {
  const source = user?.salarySettings || {};

  return {
    enabled: source.enabled === true,
    salaryBase: Math.max(0, finiteNumber(source.salaryBase, 0)),
    divisor: Math.max(1, finiteNumber(source.divisor, 200)),
    weekdayPremium: Math.max(
      0,
      finiteNumber(source.weekdayPremium, 50)
    ),
    specialPremium: Math.max(
      0,
      finiteNumber(source.specialPremium, 100)
    ),
    estimateNegative: source.estimateNegative !== false
  };
}

function validSalarySettings(settings) {
  return (
    settings.enabled &&
    settings.salaryBase > 0 &&
    settings.divisor > 0
  );
}

function salaryRates(settings) {
  if (!validSalarySettings(settings)) return null;

  const normal = settings.salaryBase / settings.divisor;

  return {
    normal,
    weekday: normal * (1 + settings.weekdayPremium / 100),
    special: normal * (1 + settings.specialPremium / 100)
  };
}

function updateSalaryPreview() {
  if (!el.salaryEstimateEnabled) return;

  const settings = {
    enabled: el.salaryEstimateEnabled.checked,
    salaryBase: parseBrazilianNumber(el.salaryBase.value),
    divisor: finiteNumber(el.salaryDivisor.value, 200),
    weekdayPremium: finiteNumber(
      el.salaryWeekdayPremium.value,
      50
    ),
    specialPremium: finiteNumber(
      el.salarySpecialPremium.value,
      100
    ),
    estimateNegative: el.salaryEstimateNegative.checked
  };

  el.salaryFields.disabled = !settings.enabled;

  const rates = salaryRates(settings);

  el.salaryNormalHour.textContent = rates
    ? money(rates.normal)
    : "—";

  el.salaryWeekdayHour.textContent = rates
    ? money(rates.weekday)
    : "—";

  el.salarySpecialHour.textContent = rates
    ? money(rates.special)
    : "—";
}

function saveSalarySettings() {
  const allAccounts = accounts();
  const user = allAccounts[currentUser];

  if (!user) return;

  user.salarySettings = {
    enabled: el.salaryEstimateEnabled.checked,
    salaryBase: parseBrazilianNumber(el.salaryBase.value),
    divisor: Math.max(
      1,
      finiteNumber(el.salaryDivisor.value, 200)
    ),
    weekdayPremium: Math.max(
      0,
      finiteNumber(el.salaryWeekdayPremium.value, 50)
    ),
    specialPremium: Math.max(
      0,
      finiteNumber(el.salarySpecialPremium.value, 100)
    ),
    estimateNegative: el.salaryEstimateNegative.checked
  };

  allAccounts[currentUser] = user;
  saveAccounts(allAccounts);

  updateSalaryPreview();
  renderHistory();
  evaluateAchievements({ source: "estimativa financeira" });
  renderAchievements();
}

function loadSalarySettings(user) {
  const settings = salarySettings(user);

  el.salaryEstimateEnabled.checked = settings.enabled;
  el.salaryBase.value = settings.salaryBase
    ? formatBrazilianNumber(settings.salaryBase)
    : "";
  el.salaryDivisor.value = String(settings.divisor);
  el.salaryWeekdayPremium.value = String(settings.weekdayPremium);
  el.salarySpecialPremium.value = String(settings.specialPremium);
  el.salaryEstimateNegative.checked = settings.estimateNegative;

  updateSalaryPreview();
}

function financialEstimateForMonth(user, items) {
  const settings = salarySettings(user);
  const rates = salaryRates(settings);

  if (!rates) return null;

  let weekdayMinutes = 0;
  let specialMinutes = 0;
  let negativeMinutes = 0;

  items.forEach((item) => {
    const balance = effectiveBalance(item);

    if (balance > 0) {
      if (
        item.specialWorkType === "weekend" ||
        item.specialWorkType === "holiday"
      ) {
        specialMinutes += balance;
      } else {
        weekdayMinutes += balance;
      }
    } else if (balance < 0 && settings.estimateNegative) {
      negativeMinutes += Math.abs(balance);
    }
  });

  const weekdayCredit =
    (weekdayMinutes / 60) * rates.weekday;

  const specialCredit =
    (specialMinutes / 60) * rates.special;

  const potentialDeduction =
    (negativeMinutes / 60) * rates.normal;

  return {
    settings,
    rates,
    weekdayMinutes,
    specialMinutes,
    negativeMinutes,
    weekdayCredit,
    specialCredit,
    potentialDeduction,
    positiveCredit: weekdayCredit + specialCredit,
    estimatedBalance:
      weekdayCredit + specialCredit - potentialDeduction
  };
}

function financialHistoryHtml(estimate) {
  if (!estimate) return "";

  const tone = estimate.estimatedBalance > 0
    ? "positive"
    : estimate.estimatedBalance < 0
      ? "negative"
      : "neutral";

  return `
    <section class="financial-history-card ${tone}">
      <div class="financial-history-head">
        <div>
          <span class="compensation-kicker">Estimativa financeira bruta</span>
          <strong>Referência do valor das horas</strong>
        </div>
        <span class="financial-history-total">
          ${money(estimate.estimatedBalance)}
        </span>
      </div>

      <div class="financial-history-grid">
        <article>
          <span>Crédito em dias úteis</span>
          <strong>${money(estimate.weekdayCredit)}</strong>
          <small>${duration(estimate.weekdayMinutes)} consideradas</small>
        </article>

        <article>
          <span>Crédito em fim de semana/feriado</span>
          <strong>${money(estimate.specialCredit)}</strong>
          <small>${duration(estimate.specialMinutes)} consideradas</small>
        </article>

        <article>
          <span>Possível desconto</span>
          <strong>${money(estimate.potentialDeduction)}</strong>
          <small>
            ${
              estimate.settings.estimateNegative
                ? `${duration(estimate.negativeMinutes)} negativas`
                : "Desativado em Minha conta"
            }
          </small>
        </article>
      </div>

      <small class="financial-history-disclaimer">
        Estimativa bruta baseada nos dados configurados em Minha conta.
        O pagamento ou desconto real depende das regras da empresa, banco de horas,
        fechamento da folha e incidências legais.
      </small>
    </section>
  `;
}

function updateAccountInterface() {
  const user = accounts()[currentUser];
  if (!user) return;

  const mascot = ensureMascot(user);
  const palette = ensurePalette(user);
  const name = displayName(user);

  applyPalette(palette);

  el.userAvatar.innerHTML = mascotMarkup(mascot);
  el.userBadgeText.textContent = name;

  el.accountAvatar.innerHTML = mascotMarkup(mascot);
  el.accountName.textContent = name;
  el.accountCode.textContent = user.email
    ? `Conta Google · ${user.email}`
    : "Conta Google conectada";

  renderMascotPicker();
  renderPalettePicker();
  loadSalarySettings(user);
  renderPersonalRankingSummary();
}

function selectMascot(mascotId) {
  if (!MASCOTS[mascotId]) return;

  const allAccounts = accounts();
  const user = allAccounts[currentUser];
  if (!user) return;

  user.mascot = mascotId;

  if (!isPaletteIndependent(user)) {
    user.palette = MASCOTS[mascotId].palette;
  }

  allAccounts[currentUser] = user;
  saveAccounts(allAccounts);
  updateAccountInterface();

  recordAchievementUsage("mascot", mascotId);
  evaluateAchievements({ source: "mascote" });
  renderAchievements();

  toast(
    isPaletteIndependent(user)
      ? `Mascote ${MASCOTS[mascotId].label} selecionado.`
      : `Mascote e paleta ${MASCOTS[mascotId].label} selecionados.`
  );
}

function selectPalette(paletteId) {
  if (!PALETTES[paletteId]) return;

  const allAccounts = accounts();
  const user = allAccounts[currentUser];
  if (!user || !isPaletteIndependent(user)) return;

  user.palette = paletteId;
  allAccounts[currentUser] = user;
  saveAccounts(allAccounts);
  updateAccountInterface();
  toast(`Paleta ${PALETTES[paletteId].label} aplicada.`);
}

function toggleIndependentPalette() {
  const allAccounts = accounts();
  const user = allAccounts[currentUser];
  if (!user) return;

  user.paletteIndependent = el.paletteIndependent.checked;

  if (!user.paletteIndependent) {
    user.palette = MASCOTS[ensureMascot(user)].palette;
  }

  allAccounts[currentUser] = user;
  saveAccounts(allAccounts);
  updateAccountInterface();

  evaluateAchievements({ source: "personalização" });
  renderAchievements();

  toast(
    user.paletteIndependent
      ? "Agora a paleta pode ser escolhida separadamente."
      : "Paleta vinculada novamente ao mascote."
  );
}

async function logout() {
  setSyncState("saving", "Finalizando sincronização…");
  await persistCurrentUserNow();

  if (supabaseClient) {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      toast(`Não foi possível sair: ${error.message}`, "error");
      setSyncState("error");
      return;
    }
  }

  resetCloudInterface();
  setAuthLoading(false);
}

function download(name, text, type = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toMinutes(value) {
  if (!value || !value.includes(":")) return null;

  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function clock(minutes) {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const remaining = normalized % 60;

  return `${String(hours).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function duration(minutes, withSign = false) {
  const absolute = Math.abs(minutes);
  const hours = Math.floor(absolute / 60);
  const remaining = absolute % 60;

  const value = hours
    ? `${hours}h${remaining ? String(remaining).padStart(2, "0") : ""}`
    : `${remaining} min`;

  if (withSign && minutes) {
    return `${minutes > 0 ? "+" : "−"}${value}`;
  }

  return value;
}

function localIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function today() {
  return localIsoDate(new Date());
}

function yesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return localIsoDate(date);
}

function dateBR(value) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function parseISO(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function setSelectedDate(value) {
  el.date.value = value;
  el.dateDisplay.textContent = value
    ? dateBR(value)
    : "Selecionar data";

  calculateRecord();
}

function setResultStatus(resultElement, status) {
  resultElement.classList.remove("blue", "green", "red");
  resultElement.classList.add(status);
}

function setMetricStatus(metricElement, status) {
  metricElement.classList.remove("positive", "negative", "neutral");
  metricElement.classList.add(status);
}

function setError(element, message = "") {
  element.textContent = message;
  element.classList.toggle("hidden", !message);
}

function parsePastedText(text) {
  const normalized = String(text || "")
    .replace(/\u00A0/g, " ")
    .replace(/[–—]/g, "-");

  const dateMatch = normalized.match(
    /\b(\d{2})\/(\d{2})\/(\d{4})\b/
  );

  const times = [...normalized.matchAll(
    /\b([01]?\d|2[0-3]):([0-5]\d)\b/g
  )].map((match) => {
    const hours = String(Number(match[1])).padStart(2, "0");
    return `${hours}:${match[2]}`;
  });

  return {
    date: dateMatch
      ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
      : null,
    times
  };
}

function validateSequence(entry, lunchOut, lunchBack, realExit = null) {
  if (lunchOut < entry) {
    return "A saída para almoço precisa ser depois da entrada.";
  }

  if (lunchBack < lunchOut) {
    return "A volta do almoço precisa ser depois da saída para almoço.";
  }

  if (realExit !== null && realExit < lunchBack) {
    return "A saída real precisa ser depois da volta do almoço.";
  }

  return "";
}

function calculateToday() {
  setError(el.todayError);

  const entry = toMinutes(el.todayEntry.value);
  const lunchOut = toMinutes(el.todayLunchOut.value);
  const lunchBack = toMinutes(el.todayLunchBack.value);
  const useRealExit = el.todayUseRealExit.checked;

  el.todayRealExitBlock.classList.toggle("hidden", !useRealExit);
  el.todayRealMetrics.classList.toggle("hidden", !useRealExit);

  if ([entry, lunchOut, lunchBack].some((value) => value === null)) {
    el.todayExactExit.textContent = "—";
    el.todayToleranceExit.textContent = "—";
    el.todayMaxExit.textContent = "—";
    el.todayTotalWorked.textContent = "—";
    el.todayBalance.textContent = "—";
    setMetricStatus(el.todayBalanceMetric, "neutral");
    el.todayResultLabel.textContent = "Horário de saída";
    el.todayResultText.textContent = "Preencha os três horários para calcular.";
    el.todayResultValue.textContent = "—";
    setResultStatus(el.todayResult, "blue");
    return;
  }

  const error = validateSequence(entry, lunchOut, lunchBack);
  if (error) {
    setError(el.todayError, error);
    return;
  }

  const morning = lunchOut - entry;
  const exactExit = lunchBack + (JOURNEY - morning);
  const toleranceExit = exactExit - TOLERANCE;
  const maximumExit = exactExit + TOLERANCE;

  el.todayExactExit.textContent = clock(exactExit);
  el.todayToleranceExit.textContent = clock(toleranceExit);
  el.todayMaxExit.textContent = clock(maximumExit);

  if (!useRealExit) {
    el.todayResultLabel.textContent = "Pode sair a partir de";
    el.todayResultText.textContent =
      `Você pode sair às ${clock(toleranceExit)} sem gerar saldo negativo. ` +
      `Diferenças de até 10 minutos, para menos ou para mais, são consideradas zero. ` +
      `Para completar 8 horas exatas, saia às ${clock(exactExit)}. ` +
      `Até ${clock(maximumExit)}, a diferença positiva também permanece dentro da tolerância.`;
    el.todayResultValue.textContent = clock(toleranceExit);
    setResultStatus(el.todayResult, "blue");
    return;
  }

  const realExit = toMinutes(el.todayRealExit.value);
  if (realExit === null) {
    el.todayTotalWorked.textContent = "—";
    el.todayBalance.textContent = "—";
    setMetricStatus(el.todayBalanceMetric, "neutral");
    el.todayResultLabel.textContent = "Saída real";
    el.todayResultText.textContent =
      `A faixa sem saldo vai de ${clock(toleranceExit)} até ${clock(maximumExit)}, com ${clock(exactExit)} para completar 8 horas. ` +
      `Informe sua saída real para calcular o saldo.`;
    el.todayResultValue.textContent = "—";
    setResultStatus(el.todayResult, "blue");
    return;
  }

  const sequenceError = validateSequence(entry, lunchOut, lunchBack, realExit);
  if (sequenceError) {
    setError(el.todayError, sequenceError);
    el.todayTotalWorked.textContent = "—";
    el.todayBalance.textContent = "—";
    return;
  }

  const totalWorked = morning + (realExit - lunchBack);
  const rawBalance = totalWorked - JOURNEY;
  const balance = toleranceAdjustedBalance(rawBalance);

  el.todayTotalWorked.textContent = duration(totalWorked);
  el.todayBalance.textContent = balance === 0
    ? rawBalance === 0
      ? "8h exatas"
      : "0 min"
    : duration(balance, true);

  if (balance > 0) {
    setMetricStatus(el.todayBalanceMetric, "positive");
    el.todayResultLabel.textContent = "Saldo positivo";
    el.todayResultText.textContent =
      `Saindo às ${el.todayRealExit.value}, você trabalhou ${duration(totalWorked)} ` +
      `e acumulou ${duration(balance)} de hora positiva.`;
    el.todayResultValue.textContent = duration(balance, true);
    setResultStatus(el.todayResult, "green");
    return;
  }

  if (balance < 0) {
    setMetricStatus(el.todayBalanceMetric, "negative");
    el.todayResultLabel.textContent = "Saldo negativo";
    el.todayResultText.textContent =
      `Saindo às ${el.todayRealExit.value}, você trabalhou ${duration(totalWorked)}. ` +
      `Faltaram ${duration(balance)} para completar 8 horas.`;
    el.todayResultValue.textContent = duration(balance, true);
    setResultStatus(el.todayResult, "red");
    return;
  }

  setMetricStatus(el.todayBalanceMetric, "neutral");
  el.todayResultValue.textContent = rawBalance === 0 ? "8h" : "0 min";
  setResultStatus(el.todayResult, "blue");

  if (rawBalance === 0) {
    el.todayResultLabel.textContent = "Jornada completa";
    el.todayResultText.textContent =
      `Saindo às ${el.todayRealExit.value}, você completou exatamente 8 horas de trabalho.`;
    return;
  }

  el.todayResultLabel.textContent = "Dentro da tolerância";
  el.todayResultText.textContent =
    `Você trabalhou ${duration(totalWorked)} e a diferença apurada foi de ${duration(rawBalance, true)}. ` +
    `Como está dentro do limite de 10 minutos, o saldo considerado é zero.`;
}
function extractToday() {
  const parsed = parsePastedText(el.todayPastedText.value);

  if (parsed.times.length !== 3) {
    el.todayParseStatus.textContent =
      `Encontrei ${parsed.times.length} horário(s). Para “Hora de sair”, cole exatamente 3 horários.`;
    el.todayParseStatus.className = "status error";
    return;
  }

  el.todayEntry.value = parsed.times[0];
  el.todayLunchOut.value = parsed.times[1];
  el.todayLunchBack.value = parsed.times[2];

  el.todayParseStatus.textContent =
    `Preenchido: ${parsed.times.join(" · ")}`;
  el.todayParseStatus.className = "status success";

  calculateToday();
}

function clearToday() {
  el.todayPastedText.value = "";
  el.todayEntry.value = "";
  el.todayLunchOut.value = "";
  el.todayLunchBack.value = "";
  el.todayUseRealExit.checked = false;
  el.todayRealExit.value = "";
  el.todayParseStatus.classList.add("hidden");
  calculateToday();
}


function specialWorkTypeForDate(date) {
  if (!date) return null;

  const parsed = parseISO(date);

  if (!parsed) return null;

  const weekDay = parsed.getDay();

  if (weekDay === 0 || weekDay === 6) {
    return "weekend";
  }

  const user = accounts()[currentUser];
  const existing = (user?.history || []).find(
    (record) => record.date === date
  );

  if (recordKind(existing) === "holiday") {
    return "holiday";
  }

  if (
    existing?.specialWorkType === "holiday" ||
    existing?.specialWorkType === "weekend"
  ) {
    return existing.specialWorkType;
  }

  return null;
}

function specialWorkLabel(type) {
  return type === "holiday"
    ? "Feriado trabalhado"
    : "Fim de semana trabalhado";
}

function prepareSpecialWorkEntry(date) {
  if (!date || date > today()) return;

  el.recordPastedText.value = "";
  el.recordEntry.value = "";
  el.recordLunchOut.value = "";
  el.recordLunchBack.value = "";
  el.recordRealExit.value = "";
  el.recordParseStatus.classList.add("hidden");
  el.recordModeWithLunch.checked = true;
  el.recordModeNoLunch.checked = false;
  applyRecordMode();

  setSelectedDate(date);
  showTab("record");
  calculateRecord();

  requestAnimationFrame(() => {
    el.recordPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    el.recordPastedText.focus();
  });

  const type = specialWorkTypeForDate(date);

  toast(
    `${specialWorkLabel(type)}: preencha os horários de ${dateBR(date)}.`
  );
}

function recordUsesLunchInterval() {
  return el.recordModeNoLunch?.checked !== true;
}

function applyRecordMode({ clearLunch = false } = {}) {
  const withLunch = recordUsesLunchInterval();

  el.recordLunchOutField.classList.toggle("hidden", !withLunch);
  el.recordLunchBackField.classList.toggle("hidden", !withLunch);
  el.recordFieldsGrid.classList.toggle("no-lunch", !withLunch);

  if (clearLunch && !withLunch) {
    el.recordLunchOut.value = "";
    el.recordLunchBack.value = "";
  }

  if (withLunch) {
    el.recordPastedText.placeholder = "Ex.: 11:09 - 11:40 12:58 - 18:43";
    el.recordPasteHint.textContent =
      "Escolha a data no calendário e cole exatamente quatro horários: entrada, saída para almoço, volta do almoço e saída real. Espaços e tabulações são aceitos.";
    el.recordModeHint.textContent =
      "Com intervalo está selecionado por padrão.";
    el.recordLunchMetricLabel.textContent = "Tempo de almoço";
    el.recordLunchMetricHint.textContent = "";
  } else {
    el.recordPastedText.placeholder = "Ex.: 13:00 - 18:00";
    el.recordPasteHint.textContent =
      "Escolha a data no calendário e cole exatamente dois horários: entrada e saída real.";
    el.recordModeHint.textContent =
      "Modo excepcional: o total será calculado diretamente entre entrada e saída.";
    el.recordLunchMetricLabel.textContent = "Intervalo";
    el.recordLunchMetricHint.textContent = "Duas batidas registradas";
  }

  calculateRecord();
}

function resetRecordMode() {
  el.recordModeWithLunch.checked = true;
  el.recordModeNoLunch.checked = false;
  applyRecordMode();
}

function calculateRecord() {
  setError(el.recordError);
  lastRecord = null;
  el.saveDay.disabled = true;

  const withLunch = recordUsesLunchInterval();
  const entry = toMinutes(el.recordEntry.value);
  const lunchOut = toMinutes(el.recordLunchOut.value);
  const lunchBack = toMinutes(el.recordLunchBack.value);
  const realExit = toMinutes(el.recordRealExit.value);
  const specialWorkType = specialWorkTypeForDate(el.date.value);
  const specialLabel = specialWorkType
    ? specialWorkLabel(specialWorkType)
    : null;
  const requiredValues = withLunch
    ? [entry, lunchOut, lunchBack, realExit]
    : [entry, realExit];
  const requiredCount = withLunch ? "quatro" : "dois";

  if (
    !el.date.value ||
    requiredValues.some((value) => value === null)
  ) {
    el.recordTotal.textContent = "—";
    el.recordLunchTime.textContent = withLunch ? "—" : "Sem intervalo";
    el.recordBalance.textContent = "—";
    setMetricStatus(el.recordBalanceMetric, "neutral");

    if (specialWorkType) {
      el.recordResultLabel.textContent = specialLabel;
      el.recordResultText.textContent =
        `Preencha os ${requiredCount} horários. Todas as horas trabalhadas nesse dia entrarão como saldo positivo.`;
    } else {
      el.recordResultLabel.textContent = "Registro do dia";
      el.recordResultText.textContent = withLunch
        ? "Preencha a data e os quatro horários."
        : "Preencha a data, a entrada e a saída real.";
    }

    el.recordResultValue.textContent = "—";
    setResultStatus(el.recordResult, "blue");
    return;
  }

  if (el.date.value > today()) {
    setError(el.recordError, "Não é possível registrar uma data futura.");
    return;
  }

  let error = "";

  if (withLunch) {
    error = validateSequence(entry, lunchOut, lunchBack, realExit);
  } else if (realExit < entry) {
    error = "A saída real precisa ser depois da entrada.";
  }

  if (error) {
    setError(el.recordError, error);
    return;
  }

  const lunchTime = withLunch ? lunchBack - lunchOut : 0;
  const total = withLunch
    ? (lunchOut - entry) + (realExit - lunchBack)
    : realExit - entry;
  const rawBalance = specialWorkType
    ? total
    : total - JOURNEY;
  const balance = specialWorkType
    ? rawBalance
    : toleranceAdjustedBalance(rawBalance);

  el.recordTotal.textContent = duration(total);
  el.recordLunchTime.textContent = withLunch
    ? duration(lunchTime)
    : "Sem intervalo";
  el.recordBalance.textContent = specialWorkType
    ? duration(balance, true)
    : balance === 0
      ? rawBalance === 0
        ? "8h exatas"
        : "0 min"
      : duration(balance, true);

  if (specialWorkType) {
    setMetricStatus(el.recordBalanceMetric, "positive");
    el.recordResultLabel.textContent = specialLabel;
    el.recordResultText.textContent =
      `Você trabalhou ${duration(total)}${withLunch ? "" : " sem intervalo registrado"}. Como é ${
        specialWorkType === "holiday"
          ? "feriado"
          : "fim de semana"
      }, todo esse período entra como hora positiva.`;
    el.recordResultValue.textContent = duration(balance, true);
    setResultStatus(el.recordResult, "green");
  } else if (balance > 0) {
    setMetricStatus(el.recordBalanceMetric, "positive");
    el.recordResultLabel.textContent = "Saldo positivo";
    el.recordResultText.textContent =
      `Você trabalhou ${duration(total)}${withLunch ? "" : " sem intervalo registrado"} e acumulou ` +
      `${duration(balance)} de hora positiva.`;
    el.recordResultValue.textContent = duration(balance, true);
    setResultStatus(el.recordResult, "green");
  } else if (balance < 0) {
    setMetricStatus(el.recordBalanceMetric, "negative");
    el.recordResultLabel.textContent = "Saldo negativo";
    el.recordResultText.textContent =
      `Você trabalhou ${duration(total)}${withLunch ? "" : " sem intervalo registrado"}. Faltaram ${duration(balance)} ` +
      `para completar 8 horas. Depois de salvar, esse saldo poderá ser abonado no histórico.`;
    el.recordResultValue.textContent = duration(balance, true);
    setResultStatus(el.recordResult, "red");
  } else {
    setMetricStatus(el.recordBalanceMetric, "neutral");
    el.recordResultValue.textContent = rawBalance === 0 ? "8h" : "0 min";
    setResultStatus(el.recordResult, "blue");

    if (rawBalance === 0) {
      el.recordResultLabel.textContent = "Jornada completa";
      el.recordResultText.textContent =
        `Você completou exatamente 8 horas, saindo às ${el.recordRealExit.value}.`;
    } else {
      el.recordResultLabel.textContent = "Dentro da tolerância";
      el.recordResultText.textContent =
        `A diferença apurada foi de ${duration(rawBalance, true)}. ` +
        `Como está dentro do limite de 10 minutos, o saldo considerado é zero.`;
    }
  }

  lastRecord = {
    date: el.date.value,
    entry: el.recordEntry.value,
    lunchOut: withLunch ? el.recordLunchOut.value : "",
    lunchBack: withLunch ? el.recordLunchBack.value : "",
    realExit: el.recordRealExit.value,
    noLunch: !withLunch,
    total,
    balance: rawBalance,
    specialWorkType
  };

  el.saveDay.disabled = false;
}
function extractRecord() {
  const parsed = parsePastedText(el.recordPastedText.value);
  const withLunch = recordUsesLunchInterval();
  const expected = withLunch ? 4 : 2;

  if (!el.date.value) {
    el.recordParseStatus.textContent =
      "Escolha primeiro a data no calendário.";
    el.recordParseStatus.className = "status error";
    return;
  }

  if (parsed.times.length !== expected) {
    el.recordParseStatus.textContent =
      `Encontrei ${parsed.times.length} horário(s). Neste modo, cole exatamente ${expected} horários.`;
    el.recordParseStatus.className = "status error";
    return;
  }

  el.recordEntry.value = parsed.times[0];

  if (withLunch) {
    el.recordLunchOut.value = parsed.times[1];
    el.recordLunchBack.value = parsed.times[2];
    el.recordRealExit.value = parsed.times[3];
  } else {
    el.recordLunchOut.value = "";
    el.recordLunchBack.value = "";
    el.recordRealExit.value = parsed.times[1];
  }

  el.recordParseStatus.textContent =
    `Preenchido: ${dateBR(el.date.value)} · ${parsed.times.join(" · ")}`;
  el.recordParseStatus.className = "status success";

  calculateRecord();
}

function clearRecord() {
  el.recordPastedText.value = "";
  el.recordEntry.value = "";
  el.recordLunchOut.value = "";
  el.recordLunchBack.value = "";
  el.recordRealExit.value = "";
  el.recordParseStatus.classList.add("hidden");
  setSelectedDate(yesterday());
  resetRecordMode();
}

function saveDay() {
  if (!lastRecord) return;

  const allAccounts = accounts();
  const user = allAccounts[currentUser];
  const history = Array.isArray(user.history)
    ? user.history
    : [];

  const item = {
    ...lastRecord,
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()),
    savedAt: new Date().toISOString()
  };

  const existingIndex = history.findIndex(
    (record) => record.date === item.date
  );

  if (existingIndex >= 0) {
    const shouldReplace = confirm(
      "Já existe um registro nessa data. Substituir?"
    );

    if (!shouldReplace) return;

    const previous = history[existingIndex];
    item.note = typeof previous?.note === "string"
      ? previous.note.slice(0, 500)
      : "";

    const maximumExcuse = workNegativeBaseMinutes(item);
    const previousExcuse = negativeExcusedMinutes(previous);

    if (maximumExcuse > 0 && previousExcuse > 0) {
      item.negativeExcusedMinutes = Math.min(maximumExcuse, previousExcuse);
      item.negativeExcuseReason = typeof previous?.negativeExcuseReason === "string"
        ? previous.negativeExcuseReason.slice(0, 120)
        : "";
    }

    history[existingIndex] = item;
  } else {
    history.push(item);
  }

  user.history = history;
  allAccounts[currentUser] = user;
  saveAccounts(allAccounts);

  historyMonthKey = item.date.slice(0, 7);
  renderHistory();
  evaluateAchievements({ source: "registro de jornada" });
  renderAchievements();
  if (item.noLunch && workNegativeBaseMinutes(item) > 0) {
    toast("Dia sem intervalo salvo. O saldo negativo pode ser abonado no Histórico.");
  } else {
    toast("Dia salvo no histórico.");
  }
}


const DAY_STATUS = {
  holiday: {
    label: "Feriado",
    description: "Dia completo sem contabilizar horas",
    balance: 0
  },
  medical: {
    label: "Atestado",
    description: "Dia justificado sem contabilizar horas",
    balance: 0
  },
  absence: {
    label: "Falta",
    description: "Desconto integral de 8 horas",
    balance: -JOURNEY
  }
};

function recordKind(record) {
  return record?.kind || "work";
}

function toleranceAdjustedBalance(value) {
  const balance = finiteNumber(value, 0);
  return Math.abs(balance) <= TOLERANCE ? 0 : balance;
}

function rawWorkBalance(record) {
  return finiteNumber(record?.balance, 0);
}

function workBalanceBeforeExcuse(record) {
  if (recordKind(record) !== "work") return 0;

  const raw = rawWorkBalance(record);
  return record?.specialWorkType
    ? raw
    : toleranceAdjustedBalance(raw);
}

function workNegativeBaseMinutes(record) {
  const balance = workBalanceBeforeExcuse(record);
  return balance < 0 ? Math.abs(balance) : 0;
}

function negativeExcusedMinutes(record) {
  const maximum = workNegativeBaseMinutes(record);
  const requested = Math.max(
    0,
    Math.round(finiteNumber(record?.negativeExcusedMinutes, 0))
  );

  return Math.min(maximum, requested);
}

function effectiveBalance(record) {
  const kind = recordKind(record);

  if (kind === "holiday" || kind === "medical") {
    return 0;
  }

  if (kind === "absence") {
    return record?.absenceExcused === true ? 0 : -JOURNEY;
  }

  const base = workBalanceBeforeExcuse(record);

  if (base >= 0) return base;

  return base + negativeExcusedMinutes(record);
}

function monthCalendarCells(monthKey, records) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDate = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();
  const mondayOffset = (firstDate.getDay() + 6) % 7;
  const neededCells = mondayOffset + lastDay;
  const totalCells = neededCells <= 35 ? 35 : 42;
  const currentKey = currentMonthKey();
  const todayIso = today();
  const byDate = new Map(records.map((record) => [record.date, record]));
  const cells = [];

  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - mondayOffset + 1;

    if (dayNumber < 1 || dayNumber > lastDay) {
      cells.push({
        id: `blank-${monthKey}-${index}`,
        kind: "blank",
        virtual: true
      });
      continue;
    }

    const date = new Date(year, month - 1, dayNumber);
    const iso = localIsoDate(date);
    const stored = byDate.get(iso);

    if (stored) {
      cells.push(stored);
      continue;
    }

    const weekDay = date.getDay();

    if (weekDay === 0 || weekDay === 6) {
      cells.push({
        id: `weekend-${iso}`,
        date: iso,
        kind: "weekend",
        label: weekDay === 6 ? "Sábado" : "Domingo",
        total: 0,
        balance: 0,
        virtual: true
      });
      continue;
    }

    if (monthKey === currentKey && iso > todayIso) {
      cells.push({
        id: `future-${iso}`,
        date: iso,
        kind: "future",
        label: "Próximo dia útil",
        total: 0,
        balance: 0,
        virtual: true
      });
      continue;
    }

    cells.push({
      id: `missing-${iso}`,
      date: iso,
      kind: "missing",
      label: iso === todayIso ? "Hoje sem marcação" : "Sem marcação",
      total: 0,
      balance: 0,
      virtual: true
    });
  }

  return cells;
}

function createStatusRecord(date, kind) {
  const status = DAY_STATUS[kind];

  if (!status) return null;

  return {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
    date,
    kind,
    label: status.label,
    total: 0,
    balance: status.balance,
    absenceExcused: false,
    savedAt: new Date().toISOString()
  };
}

function markDayStatus(date, kind) {
  const status = DAY_STATUS[kind];

  if (!status) return;

  const question = kind === "absence"
    ? `Marcar ${dateBR(date)} como FALTA? Isso descontará 8 horas do saldo líquido.`
    : `Marcar ${dateBR(date)} como ${status.label}?`;

  if (!confirm(question)) return;

  const allAccounts = accounts();
  const user = allAccounts[currentUser];
  const history = Array.isArray(user.history) ? user.history : [];
  const item = createStatusRecord(date, kind);
  const existingIndex = history.findIndex((record) => record.date === date);

  if (existingIndex >= 0) {
    const previous = history[existingIndex];
    item.note = typeof previous?.note === "string"
      ? previous.note.slice(0, 500)
      : "";
    history[existingIndex] = item;
  } else {
    history.push(item);
  }

  user.history = history;
  allAccounts[currentUser] = user;
  saveAccounts(allAccounts);
  renderHistory();
  evaluateAchievements({ source: "classificação do calendário" });
  renderAchievements();

  toast(`${status.label} registrado em ${dateBR(date)}.`);
}

function toggleAbsenceExcuse(id) {
  const allAccounts = accounts();
  const user = allAccounts[currentUser];
  const history = Array.isArray(user.history) ? user.history : [];
  const item = history.find((record) => record.id === id);

  if (!item || recordKind(item) !== "absence") {
    return;
  }

  const enabling = item.absenceExcused !== true;
  const question = enabling
    ? `Abonar as 8 horas negativas da falta de ${dateBR(item.date)}? Esse dia deixará de gerar débito no saldo líquido.`
    : `Remover o abono da falta de ${dateBR(item.date)}? As 8 horas negativas voltarão ao saldo líquido.`;

  if (!confirm(question)) return;

  item.absenceExcused = enabling;
  allAccounts[currentUser] = user;
  saveAccounts(allAccounts);
  renderHistory();
  evaluateAchievements({ source: "abono de falta" });
  renderAchievements();

  toast(
    enabling
      ? "Horas negativas da falta abonadas."
      : "Abono da falta removido."
  );
}


function historyRecordById(id) {
  const user = accounts()[currentUser];
  return (user?.history || []).find((record) => record.id === id) || null;
}


function escapeRankingText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

const RANK_TIER_CLASSES = [
  "rank-tier-diamond",
  "rank-tier-gold",
  "rank-tier-bronze",
  "rank-tier-common",
  "rank-tier-hidden"
];

function rankTierForPosition(position) {
  const numericPosition = Number(position);

  if (numericPosition === 1) {
    return { key: "diamond", title: "CLT Pro Max", icon: "💎" };
  }

  if (numericPosition === 2) {
    return { key: "gold", title: "CLT Premium", icon: "🥇" };
  }

  if (numericPosition === 3) {
    return { key: "bronze", title: "CLT Dedicado", icon: "🥉" };
  }

  return { key: "common", title: "CLT Comum", icon: "●" };
}

function applyRankTierClass(target, tierKey = "common") {
  if (!target) return;
  target.classList.remove(...RANK_TIER_CLASSES);
  target.classList.add(`rank-tier-${tierKey}`);
}

function currentRankingRow() {
  return medalRankingRows.find((row) => row.isCurrentUser) || null;
}

function localMedalCount() {
  const user = accounts()[currentUser];
  return achievementUnlockedCount(user?.achievementState || {});
}

function personalRankingSummary() {
  const current = currentRankingRow();
  const medalCount = current?.medalCount ?? localMedalCount();

  if (medalRankingLoading && !medalRankingAvailable && !medalRankingRows.length) {
    return {
      tier: { key: "common", title: "Carregando…", icon: "…" },
      position: "—",
      medalCount,
      shortTitle: "Carregando seu rank…",
      status: "Buscando sua colocação na Liga CLT."
    };
  }

  if (!medalRankingParticipates) {
    return {
      tier: { key: "hidden", title: "Fora do ranking", icon: "○" },
      position: "—",
      medalCount,
      shortTitle: "Fora do ranking",
      status: "Você está oculto para os demais, mas continua vendo a classificação."
    };
  }

  if (current) {
    const tier = rankTierForPosition(current.position);
    return {
      tier,
      position: `${current.position}º lugar`,
      medalCount,
      shortTitle: `${current.position}º lugar · ${tier.title}`,
      status: "Sua posição acompanha automaticamente a quantidade de medalhas conquistadas."
    };
  }

  if (medalRankingError) {
    return {
      tier: { key: "common", title: "Rank indisponível", icon: "!" },
      position: "—",
      medalCount,
      shortTitle: "Rank indisponível",
      status: medalRankingError
    };
  }

  return {
    tier: { key: "common", title: "CLT Comum", icon: "●" },
    position: "Aguardando",
    medalCount,
    shortTitle: "Aguardando colocação",
    status: "Seu perfil está sendo incluído no ranking."
  };
}

function renderPersonalRankingSummary() {
  const summary = personalRankingSummary();
  const medalLabel = summary.medalCount === 1 ? "medalha" : "medalhas";

  applyRankTierClass(el.profileRankCard, summary.tier.key);
  applyRankTierClass(el.accountRankingCard, summary.tier.key);
  applyRankTierClass(el.profileRankDot, summary.tier.key);

  if (el.profileRankTitle) el.profileRankTitle.textContent = summary.shortTitle;
  if (el.profileRankMeta) {
    el.profileRankMeta.textContent = `${summary.medalCount} ${medalLabel}`;
  }

  if (el.accountRankingBadge) {
    el.accountRankingBadge.textContent = `${summary.tier.icon} ${summary.tier.title}`;
  }
  if (el.accountRankPosition) el.accountRankPosition.textContent = summary.position;
  if (el.accountRankTitle) el.accountRankTitle.textContent = summary.tier.title;
  if (el.accountRankMedals) el.accountRankMedals.textContent = String(summary.medalCount);
  if (el.accountRankStatus) el.accountRankStatus.textContent = summary.status;

  if (el.accountRankingParticipation) {
    el.accountRankingParticipation.textContent = medalRankingParticipates
      ? "Não quero participar"
      : "Participar novamente";
    el.accountRankingParticipation.disabled = medalRankingLoading || !medalRankingAvailable;
    el.accountRankingParticipation.classList.toggle("rejoin", !medalRankingParticipates);
  }
}

function setProfileRankPopover(open) {
  if (!el.profileRankAnchor || !el.profileRankCard) return;
  el.profileRankAnchor.classList.toggle("is-open", open);
  el.profileRankAnchor.setAttribute("aria-expanded", open ? "true" : "false");
  el.profileRankCard.setAttribute("aria-hidden", open ? "false" : "true");
}

function normalizeRankingRow(row) {
  return {
    position: Math.max(1, Number(row?.position) || 1),
    displayName: String(row?.display_name || "Usuário").trim() || "Usuário",
    medalCount: Math.max(0, Number(row?.medal_count) || 0),
    isCurrentUser: row?.is_current_user === true
  };
}

function rankingRowMarkup(row, options = {}) {
  const medalLabel = row.medalCount === 1 ? "medalha" : "medalhas";
  const tier = rankTierForPosition(row.position);
  const currentLabel = row.isCurrentUser
    ? '<small class="ranking-you-label">você</small>'
    : "";
  const separated = options.separated ? " ranking-row-separated" : "";
  const safeName = escapeRankingText(row.displayName);

  return `
    <li class="ranking-row rank-tier-${tier.key} ${row.isCurrentUser ? "current-user" : ""}${separated}">
      <span class="ranking-position">${row.position}º</span>
      <span class="ranking-person">
        <span class="ranking-person-copy">
          <strong class="ranking-name" data-rank-name="${safeName}">${safeName}</strong>
          <small class="ranking-title">${tier.icon} ${tier.title}</small>
        </span>
        ${currentLabel}
      </span>
      <span class="ranking-medals">
        <strong>${row.medalCount}</strong>
        <small>${medalLabel}</small>
      </span>
    </li>
  `;
}

function rankingRowsForDock() {
  const firstFive = medalRankingRows.filter((row) => row.position <= 5);
  const current = medalRankingRows.find((row) => row.isCurrentUser);

  if (current && !firstFive.some((row) => row.isCurrentUser)) {
    return [
      ...firstFive.map((row) => ({ row, separated: false })),
      { row: current, separated: true }
    ];
  }

  return firstFive.map((row) => ({ row, separated: false }));
}

function rankingStatusText() {
  if (medalRankingLoading && !medalRankingRows.length) {
    return "Carregando ranking…";
  }

  if (medalRankingError) {
    return medalRankingError;
  }

  if (!medalRankingParticipates) {
    return "Você está oculto, mas continua podendo acompanhar o ranking.";
  }

  return "Você participa automaticamente e sua posição é atualizada com suas medalhas.";
}

function renderMedalRanking() {
  const status = rankingStatusText();
  const toggleText = medalRankingParticipates
    ? "Não quero participar"
    : "Participar novamente";
  const controlsDisabled = medalRankingLoading || !medalRankingAvailable;

  [el.rankingDockStatus, el.rankingDialogStatus].forEach((target) => {
    if (!target) return;
    target.textContent = status;
    target.classList.toggle("error", Boolean(medalRankingError));
  });

  [el.rankingDockParticipation, el.rankingDialogParticipation, el.accountRankingParticipation].forEach((button) => {
    if (!button) return;
    button.textContent = toggleText;
    button.disabled = controlsDisabled;
    button.classList.toggle("rejoin", !medalRankingParticipates);
  });

  if (!medalRankingRows.length) {
    const empty = medalRankingLoading
      ? '<li class="ranking-empty">Buscando colocações…</li>'
      : medalRankingError
        ? '<li class="ranking-empty">O ranking ainda não pôde ser carregado.</li>'
        : '<li class="ranking-empty">Ainda não há participantes no ranking.</li>';

    if (el.rankingDockList) el.rankingDockList.innerHTML = empty;
    if (el.rankingDialogList) el.rankingDialogList.innerHTML = empty;
    renderPersonalRankingSummary();
    return;
  }

  if (el.rankingDockList) {
    el.rankingDockList.innerHTML = rankingRowsForDock()
      .map(({ row, separated }) => rankingRowMarkup(row, { separated }))
      .join("");
  }

  if (el.rankingDialogList) {
    let previousPosition = null;
    el.rankingDialogList.innerHTML = medalRankingRows
      .map((row) => {
        const separated = Boolean(
          row.isCurrentUser &&
          previousPosition !== null &&
          row.position > previousPosition + 1
        );
        previousPosition = row.position;
        return rankingRowMarkup(row, { separated });
      })
      .join("");
  }

  renderPersonalRankingSummary();
}

function scheduleMedalRankingRefresh(delay = 350) {
  if (!currentUser || !supabaseClient || !authSession || !navigator.onLine) return;

  clearTimeout(medalRankingRefreshTimer);
  medalRankingRefreshTimer = window.setTimeout(() => {
    loadMedalRanking({ quiet: true });
  }, delay);
}

async function loadMedalRanking({ quiet = false } = {}) {
  if (!currentUser || !supabaseClient || !authSession) return;

  if (!quiet) {
    medalRankingLoading = true;
    medalRankingError = "";
    renderMedalRanking();
  }

  try {
    const [rankingResult, statusResult] = await Promise.all([
      supabaseClient.rpc("get_medal_ranking", { p_limit: 10 }),
      supabaseClient.rpc("get_my_medal_ranking_status")
    ]);

    if (rankingResult.error) throw rankingResult.error;
    if (statusResult.error) throw statusResult.error;

    medalRankingRows = Array.isArray(rankingResult.data)
      ? rankingResult.data.map(normalizeRankingRow)
      : [];
    medalRankingParticipates = statusResult.data !== false;
    medalRankingAvailable = true;
    medalRankingError = "";
  } catch (error) {
    console.error("Falha ao carregar o ranking de medalhas.", error);
    medalRankingAvailable = false;
    medalRankingError = navigator.onLine
      ? "Ranking indisponível. Confira se o SQL do ranking foi executado."
      : "Sem conexão para atualizar o ranking.";
  } finally {
    medalRankingLoading = false;
    renderMedalRanking();
  }
}

function openRankingDialog() {
  if (!el.rankingDialog) return;
  renderMedalRanking();
  el.rankingDialog.showModal();
  loadMedalRanking({ quiet: medalRankingRows.length > 0 });
}

function closeRankingDialog() {
  if (el.rankingDialog?.open) el.rankingDialog.close();
}

const CUP_PREVIEW_POINTS = [92, 85, 78, 70, 64, 58, 53, 48, 44, 40];

function cupPreviewMonthLabel() {
  const now = new Date();
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  }).format(now).replace(/^./, (character) => character.toUpperCase());
}

function cupPreviewInitials(name) {
  const words = String(name || "Usuário")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function cupPreviewFallbackRows() {
  const user = accounts()[currentUser];
  const ownName = displayName(user);
  const names = [ownName, "Gabriel H.", "Bárbara S.", "Participante 4", "Participante 5"];

  return names.map((name, index) => ({
    position: index + 1,
    displayName: name,
    medalCount: Math.max(0, 37 - index * 4),
    isCurrentUser: index === 0
  }));
}

function cupPreviewRows() {
  const source = medalRankingRows.length
    ? medalRankingRows.slice(0, 10)
    : cupPreviewFallbackRows();

  return source.map((row, index) => ({
    ...row,
    position: index + 1,
    previewPoints: CUP_PREVIEW_POINTS[index] ?? Math.max(12, 40 - index * 3)
  }));
}

function cupPreviewAvatarMarkup(row) {
  const safeName = escapeRankingText(row.displayName);

  if (row.isCurrentUser) {
    const user = accounts()[currentUser];
    if (user) {
      return `<span class="cup-avatar cup-avatar-mascot" title="${safeName}">${mascotMarkup(ensureMascot(user))}</span>`;
    }
  }

  const safeInitials = escapeRankingText(cupPreviewInitials(row.displayName));
  return `<span class="cup-avatar cup-avatar-initials" title="${safeName}">${safeInitials}</span>`;
}

function cupPodiumMarkup(row) {
  if (!row) return "";
  const tier = rankTierForPosition(row.position);
  const safeName = escapeRankingText(row.displayName);

  return `
    <article class="cup-podium-place cup-podium-place-${row.position} rank-tier-${tier.key}">
      <div class="cup-podium-avatar-wrap">
        ${cupPreviewAvatarMarkup(row)}
        <span class="cup-podium-number">${row.position}</span>
      </div>
      <div class="cup-podium-copy">
        <strong>${safeName}</strong>
        <small>${tier.icon} ${tier.title}</small>
        <span>${row.previewPoints} pts</span>
      </div>
      <div class="cup-pedestal" aria-hidden="true"></div>
    </article>
  `;
}

function cupResultRowMarkup(row) {
  const tier = rankTierForPosition(row.position);
  const safeName = escapeRankingText(row.displayName);
  const currentLabel = row.isCurrentUser ? '<small class="cup-result-you">você</small>' : "";

  return `
    <li class="cup-result-row rank-tier-${tier.key} ${row.isCurrentUser ? "current-user" : ""}">
      <span class="cup-result-position">${row.position}</span>
      <span class="cup-result-person">
        ${cupPreviewAvatarMarkup(row)}
        <span>
          <strong>${safeName}</strong>
          <small>${tier.icon} ${tier.title}</small>
        </span>
        ${currentLabel}
      </span>
      <strong class="cup-result-points">${row.previewPoints}<small>pts</small></strong>
    </li>
  `;
}

function renderCupPreview() {
  const rows = cupPreviewRows();
  const period = cupPreviewMonthLabel();
  const topOne = rows.find((row) => row.position === 1) || rows[0];
  const topTwo = rows.find((row) => row.position === 2) || rows[1];
  const topThree = rows.find((row) => row.position === 3) || rows[2];

  if (el.cupResultPeriod) el.cupResultPeriod.textContent = period;
  if (el.cupBoardPeriod) el.cupBoardPeriod.textContent = period;

  if (el.cupPodium) {
    el.cupPodium.innerHTML = [topTwo, topOne, topThree]
      .filter(Boolean)
      .map(cupPodiumMarkup)
      .join("");
  }

  if (el.cupResultList) {
    el.cupResultList.innerHTML = rows
      .slice(0, 10)
      .map(cupResultRowMarkup)
      .join("");
  }

  const own = rows.find((row) => row.isCurrentUser);
  if (el.cupMyResult) {
    if (own && own.position > 3) {
      const tier = rankTierForPosition(own.position);
      applyRankTierClass(el.cupMyResult, tier.key);
      el.cupMyResult.innerHTML = `
        <span>Sua colocação nesta prévia</span>
        <strong>${own.position}º lugar · ${tier.title}</strong>
        <small>${own.previewPoints} pontos simulados</small>
      `;
      el.cupMyResult.classList.remove("hidden");
    } else {
      el.cupMyResult.classList.add("hidden");
      el.cupMyResult.innerHTML = "";
    }
  }
}

function createCupConfetti() {
  if (!el.cupConfetti) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.cupConfetti.innerHTML = "";
  if (reducedMotion) return;

  for (let index = 0; index < 28; index += 1) {
    const particle = document.createElement("i");
    particle.style.setProperty("--confetti-x", `${4 + Math.random() * 92}%`);
    particle.style.setProperty("--confetti-delay", `${Math.random() * 1.2}s`);
    particle.style.setProperty("--confetti-duration", `${2.8 + Math.random() * 2.2}s`);
    particle.style.setProperty("--confetti-rotate", `${120 + Math.random() * 520}deg`);
    particle.dataset.shape = String(index % 4);
    el.cupConfetti.appendChild(particle);
  }
}

function openCupPreview() {
  if (!el.cupResultDialog) return;

  renderCupPreview();
  createCupConfetti();

  if (el.rankingDialog?.open) {
    el.rankingDialog.close();
  }

  // Aguarda o diálogo do ranking sair da camada modal antes de abrir a prévia.
  // Isso também evita falhas silenciosas em navegadores que ainda estão
  // processando o fechamento do primeiro <dialog>.
  window.setTimeout(() => {
    if (el.cupResultDialog.open) return;

    try {
      el.cupResultDialog.showModal();
    } catch (error) {
      console.warn("Não foi possível abrir a prévia como modal; usando fallback.", error);
      el.cupResultDialog.setAttribute("open", "");
    }
  }, 60);
}

function closeCupPreview({ reopenRanking = false } = {}) {
  if (el.cupResultDialog?.open) el.cupResultDialog.close();
  if (reopenRanking) window.setTimeout(openRankingDialog, 80);
}

async function toggleMedalRankingParticipation() {
  if (!medalRankingAvailable || medalRankingLoading || !supabaseClient || !authSession) {
    return;
  }

  const nextValue = !medalRankingParticipates;
  medalRankingLoading = true;
  renderMedalRanking();

  const { data, error } = await supabaseClient.rpc(
    "set_my_medal_ranking_participation",
    { p_participates: nextValue }
  );

  if (error) {
    console.error("Falha ao alterar a participação no ranking.", error);
    medalRankingLoading = false;
    medalRankingError = "Não foi possível alterar sua participação agora.";
    renderMedalRanking();
    return toast("Não foi possível alterar sua participação no ranking.", "error");
  }

  medalRankingParticipates = data !== false;
  medalRankingError = "";
  medalRankingLoading = false;
  renderMedalRanking();
  await loadMedalRanking({ quiet: true });

  toast(
    medalRankingParticipates
      ? "Você voltou a participar do ranking."
      : "Você não aparece mais no ranking."
  );
}

function updateUpdatesIndicator() {
  const user = accounts()[currentUser];
  const unread = Boolean(user && user.lastSeenRelease !== APP_RELEASE_ID);
  el.updatesUnread?.classList.toggle("hidden", !unread);
  el.updatesButton?.classList.toggle("has-unread", unread);
}

function openUpdatesDialog() {
  const allAccounts = accounts();
  const user = allAccounts[currentUser];

  if (!user) return;

  if (user.lastSeenRelease !== APP_RELEASE_ID) {
    user.lastSeenRelease = APP_RELEASE_ID;
    allAccounts[currentUser] = user;
    saveAccounts(allAccounts);
  }

  updateUpdatesIndicator();
  el.updatesDialog.showModal();
}

function closeUpdatesDialog() {
  if (el.updatesDialog.open) el.updatesDialog.close();
}

function updateNoteCounter() {
  const length = el.noteText.value.length;
  el.noteCounter.textContent = `${length}/500`;
}

function openNoteDialog(id) {
  const record = historyRecordById(id);

  if (!record) {
    return toast("Registro não encontrado.", "error");
  }

  noteTargetId = id;
  el.noteDate.textContent = `${dateBR(record.date)} · ${
    recordKind(record) === "work"
      ? "Dia trabalhado"
      : DAY_STATUS[recordKind(record)]?.label || "Registro"
  }`;
  el.noteText.value = typeof record.note === "string"
    ? record.note.slice(0, 500)
    : "";
  el.deleteNote.classList.toggle("hidden", !el.noteText.value.trim());
  setError(el.noteError);
  updateNoteCounter();
  el.noteDialog.showModal();

  requestAnimationFrame(() => el.noteText.focus());
}

function closeNoteDialog() {
  noteTargetId = null;
  if (el.noteDialog.open) el.noteDialog.close();
}

function saveNote(event) {
  event.preventDefault();

  const allAccounts = accounts();
  const user = allAccounts[currentUser];
  const record = (user?.history || []).find((item) => item.id === noteTargetId);

  if (!record) {
    setError(el.noteError, "O registro não foi encontrado.");
    return;
  }

  const note = el.noteText.value.trim().slice(0, 500);

  if (note) {
    record.note = note;
  } else {
    delete record.note;
  }

  allAccounts[currentUser] = user;
  saveAccounts(allAccounts);
  closeNoteDialog();
  renderHistory();
  toast(note ? "Anotação salva." : "Anotação removida.");
}

function deleteCurrentNote() {
  if (!noteTargetId) return;
  if (!confirm("Excluir esta anotação?")) return;

  const allAccounts = accounts();
  const user = allAccounts[currentUser];
  const record = (user?.history || []).find((item) => item.id === noteTargetId);

  if (!record) return;

  delete record.note;
  allAccounts[currentUser] = user;
  saveAccounts(allAccounts);
  closeNoteDialog();
  renderHistory();
  toast("Anotação excluída.");
}

function negativeExcuseInputMinutes() {
  const hours = Math.max(0, Math.floor(finiteNumber(el.negativeExcuseHours.value, 0)));
  const minutes = Math.max(0, Math.floor(finiteNumber(el.negativeExcuseMinutes.value, 0)));
  return hours * 60 + minutes;
}

function setNegativeExcuseInputs(totalMinutes) {
  const total = Math.max(0, Math.round(totalMinutes));
  el.negativeExcuseHours.value = String(Math.floor(total / 60));
  el.negativeExcuseMinutes.value = String(total % 60);
  updateNegativeExcusePreview();
}

function updateNegativeExcusePreview() {
  if (!negativeExcuseTargetId) return;

  const requested = negativeExcuseInputMinutes();
  const valid = requested <= negativeExcuseMaximum;
  const considered = Math.max(0, negativeExcuseMaximum - requested);

  el.negativeExcusePreview.textContent = valid
    ? requested
      ? `Após o abono, o saldo considerado será ${
          considered ? duration(-considered, true) : "0 min"
        }.`
      : `Sem abono, o saldo considerado permanece ${duration(-negativeExcuseMaximum, true)}.`
    : `O abono não pode ultrapassar ${duration(negativeExcuseMaximum)}.`;

  el.negativeExcusePreview.classList.toggle("invalid", !valid);
}

function openNegativeExcuseDialog(id) {
  const record = historyRecordById(id);
  const maximum = workNegativeBaseMinutes(record);

  if (!record || maximum <= 0) {
    return toast("Este dia não possui saldo negativo disponível para abono.", "error");
  }

  negativeExcuseTargetId = id;
  negativeExcuseMaximum = maximum;
  const existing = negativeExcusedMinutes(record);

  el.negativeExcuseDate.textContent = dateBR(record.date);
  el.negativeExcuseOriginal.textContent = duration(-maximum, true);
  el.negativeExcuseReason.value = typeof record.negativeExcuseReason === "string"
    ? record.negativeExcuseReason.slice(0, 120)
    : "";
  el.removeNegativeExcuse.classList.toggle("hidden", existing <= 0);
  setError(el.negativeExcuseError);
  setNegativeExcuseInputs(existing);
  el.negativeExcuseDialog.showModal();
}

function closeNegativeExcuseDialog() {
  negativeExcuseTargetId = null;
  negativeExcuseMaximum = 0;
  if (el.negativeExcuseDialog.open) el.negativeExcuseDialog.close();
}

function saveNegativeExcuse(event) {
  event.preventDefault();

  const requested = negativeExcuseInputMinutes();

  if (requested > negativeExcuseMaximum) {
    setError(
      el.negativeExcuseError,
      `O máximo disponível para este dia é ${duration(negativeExcuseMaximum)}.`
    );
    return;
  }

  const allAccounts = accounts();
  const user = allAccounts[currentUser];
  const record = (user?.history || []).find(
    (item) => item.id === negativeExcuseTargetId
  );

  if (!record || workNegativeBaseMinutes(record) <= 0) {
    setError(el.negativeExcuseError, "O registro não foi encontrado ou deixou de ser negativo.");
    return;
  }

  if (requested > 0) {
    record.negativeExcusedMinutes = requested;
    record.negativeExcuseReason = el.negativeExcuseReason.value.trim().slice(0, 120);
  } else {
    delete record.negativeExcusedMinutes;
    delete record.negativeExcuseReason;
  }

  allAccounts[currentUser] = user;
  saveAccounts(allAccounts);
  closeNegativeExcuseDialog();
  renderHistory();
  evaluateAchievements({ source: "abono de horas negativas" });
  renderAchievements();
  toast(requested > 0 ? "Abono salvo." : "Abono removido.");
}

function removeNegativeExcuse() {
  if (!negativeExcuseTargetId) return;
  if (!confirm("Remover o abono deste dia?")) return;

  const allAccounts = accounts();
  const user = allAccounts[currentUser];
  const record = (user?.history || []).find(
    (item) => item.id === negativeExcuseTargetId
  );

  if (!record) return;

  delete record.negativeExcusedMinutes;
  delete record.negativeExcuseReason;
  allAccounts[currentUser] = user;
  saveAccounts(allAccounts);
  closeNegativeExcuseDialog();
  renderHistory();
  evaluateAchievements({ source: "remoção de abono" });
  renderAchievements();
  toast("Abono removido.");
}


let floatingTooltip = null;

function ensureFloatingTooltip() {
  if (floatingTooltip) return floatingTooltip;

  floatingTooltip = document.createElement("div");
  floatingTooltip.className = "floating-tooltip hidden";
  floatingTooltip.setAttribute("role", "tooltip");
  document.body.appendChild(floatingTooltip);

  return floatingTooltip;
}

function positionFloatingTooltip(event) {
  const tooltip = ensureFloatingTooltip();
  const offset = 14;
  const padding = 10;

  let left = event.clientX + offset;
  let top = event.clientY + offset;

  const rect = tooltip.getBoundingClientRect();

  if (left + rect.width + padding > window.innerWidth) {
    left = event.clientX - rect.width - offset;
  }

  if (top + rect.height + padding > window.innerHeight) {
    top = event.clientY - rect.height - offset;
  }

  tooltip.style.left = `${Math.max(padding, left)}px`;
  tooltip.style.top = `${Math.max(padding, top)}px`;
}

function showFloatingTooltip(event) {
  const text = event.currentTarget.dataset.tooltip;

  if (!text) return;

  const tooltip = ensureFloatingTooltip();
  tooltip.textContent = text;
  tooltip.classList.remove("hidden");
  positionFloatingTooltip(event);
}

function hideFloatingTooltip() {
  if (!floatingTooltip) return;
  floatingTooltip.classList.add("hidden");
}

function bindFloatingTooltips(root = document) {
  root.querySelectorAll(".tooltip-target").forEach((target) => {
    if (target.dataset.tooltipBound === "true") return;

    target.dataset.tooltipBound = "true";
    target.addEventListener("mouseenter", showFloatingTooltip);
    target.addEventListener("mousemove", positionFloatingTooltip);
    target.addEventListener("mouseleave", hideFloatingTooltip);
    target.addEventListener("blur", hideFloatingTooltip);
  });
}

function calendarCellClass(item) {
  const kind = recordKind(item);

  if (kind !== "work") {
    return kind;
  }

  const balance = effectiveBalance(item);

  if (balance > 0) return "work positive";
  if (balance < 0) return "work negative";
  return "work zero";
}

function noteButtonHtml(item) {
  const hasNote = typeof item?.note === "string" && Boolean(item.note.trim());
  const label = hasNote ? "Abrir anotação deste dia" : "Adicionar anotação neste dia";

  return `
    <button
      class="calendar-note ${hasNote ? "active" : ""} tooltip-target"
      data-id="${item.id}"
      data-tooltip="${label}."
      type="button"
      aria-label="${label}"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5.5h14v11H9l-4 3v-14Z"/>
        <path d="M8 9h8M8 12.5h5"/>
      </svg>
      <i aria-hidden="true"></i>
    </button>
  `;
}

function negativeExcuseButtonHtml(item) {
  const maximum = workNegativeBaseMinutes(item);

  if (maximum <= 0) return "";

  const excused = negativeExcusedMinutes(item);

  return `
    <button
      class="work-negative-excuse ${excused ? "active" : ""}"
      data-id="${item.id}"
      type="button"
      aria-label="${excused ? "Editar" : "Adicionar"} abono de horas negativas"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.5 20 7v5c0 4.3-2.8 7.2-8 8.8C6.8 19.2 4 16.3 4 12V7l8-3.5Z"/>
        <path d="m8.5 12 2.2 2.2 4.8-5"/>
      </svg>
      <span>${excused ? "Editar abono" : "Abonar"}</span>
    </button>
  `;
}

function workBalanceAdjustmentHtml(item) {
  if (item.specialWorkType) return "";

  const raw = rawWorkBalance(item);
  const beforeExcuse = workBalanceBeforeExcuse(item);
  const excused = negativeExcusedMinutes(item);

  if (raw !== 0 && beforeExcuse === 0) {
    return `
      <small class="calendar-adjustment tolerance-applied">
        Saldo apurado ${duration(raw, true)} · tolerância aplicada
      </small>
    `;
  }

  if (excused > 0) {
    return `
      <small class="calendar-adjustment excused-applied">
        Saldo apurado ${duration(beforeExcuse, true)} · ${duration(excused)} abonados
      </small>
    `;
  }

  return "";
}

function calendarWorkCell(item) {
  const balance = effectiveBalance(item);
  const balanceClass = balance > 0
    ? "positive"
    : balance < 0
      ? "negative"
      : "zero";

  return `
    <article class="history-calendar-day ${calendarCellClass(item)}">
      <header class="calendar-cell-head">
        <strong>${Number(item.date.slice(-2))}</strong>
        <span class="calendar-balance ${balanceClass}">
          ${duration(balance, true)}
        </span>
      </header>

      <div class="calendar-cell-body">
        <span class="calendar-status-title">
          ${
            item.specialWorkType
              ? specialWorkLabel(item.specialWorkType)
              : `${duration(item.total)} trabalhadas`
          }
        </span>

        ${
          item.specialWorkType
            ? `<small>${duration(item.total)} trabalhadas · todas positivas</small>`
            : ""
        }

        ${workBalanceAdjustmentHtml(item)}

        <small class="calendar-times">
          ${item.noLunch
            ? `${item.entry}–${item.realExit}<br /><span>Sem intervalo</span>`
            : `${item.entry}–${item.lunchOut}<br />${item.lunchBack}–${item.realExit}`}
        </small>
      </div>

      <footer class="calendar-cell-actions">
        ${negativeExcuseButtonHtml(item)}
        ${noteButtonHtml(item)}
        <button
          class="calendar-delete tooltip-target"
          data-id="${item.id}"
          data-tooltip="Excluir esse registro."
          type="button"
          aria-label="Excluir esse registro"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16"/>
            <path d="M9 7V4h6v3"/>
            <path d="m6 7 1 13h10l1-13"/>
            <path d="M10 11v5M14 11v5"/>
          </svg>
        </button>
      </footer>
    </article>
  `;
}
function calendarStatusCell(item) {
  const kind = recordKind(item);
  const status = DAY_STATUS[kind];
  const absenceExcused =
    kind === "absence" && item.absenceExcused === true;

  const statusLabel = absenceExcused
    ? "Falta abonada"
    : status.label;

  const balanceLabel = kind === "absence"
    ? absenceExcused
      ? "0 min"
      : "−8h"
    : status.label;

  const absenceButton = kind === "absence"
    ? `
      <button
        class="absence-excuse ${absenceExcused ? "active" : ""}"
        data-id="${item.id}"
        type="button"
      >
        ${absenceExcused
          ? "Remover abono"
          : "Abonar horas negativas"}
      </button>
    `
    : "";

  const addSpecialWorkButton = kind === "holiday"
    ? `
      <button
        class="add-special-work"
        data-date="${item.date}"
        type="button"
      >
        Adicionar horas trabalhadas
      </button>
    `
    : "";

  return `
    <article class="history-calendar-day status ${kind} ${
      absenceExcused ? "excused" : ""
    }">
      <header class="calendar-cell-head">
        <strong>${Number(item.date.slice(-2))}</strong>
        <span class="calendar-status-badge ${kind} ${
          absenceExcused ? "excused" : ""
        }">
          ${balanceLabel}
        </span>
      </header>

      <div class="calendar-cell-body">
        <span class="calendar-status-title">${statusLabel}</span>
        <small>${status.description}</small>
      </div>

      <footer class="calendar-cell-actions vertical">
        ${absenceButton}
        ${addSpecialWorkButton}
        <div class="calendar-icon-actions">
          ${noteButtonHtml(item)}
          <button
            class="calendar-delete tooltip-target"
            data-id="${item.id}"
            data-tooltip="Excluir esse registro."
            type="button"
            aria-label="Excluir esse registro"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16"/>
              <path d="M9 7V4h6v3"/>
              <path d="m6 7 1 13h10l1-13"/>
              <path d="M10 11v5M14 11v5"/>
            </svg>
          </button>
        </div>
      </footer>
    </article>
  `;
}

function calendarMissingCell(item) {
  return `
    <article class="history-calendar-day missing">
      <header class="calendar-cell-head">
        <strong>${Number(item.date.slice(-2))}</strong>
        <span class="calendar-status-badge missing">Pendente</span>
      </header>

      <div class="calendar-cell-body">
        <span class="calendar-status-title">${item.label}</span>
        <small>Defina o motivo do dia sem registro.</small>
      </div>

      <footer class="calendar-missing-actions">
        <button
          class="day-action holiday"
          data-date="${item.date}"
          data-kind="holiday"
          type="button"
        >
          Feriado
        </button>
        <button
          class="day-action medical"
          data-date="${item.date}"
          data-kind="medical"
          type="button"
        >
          Atestado
        </button>
        <button
          class="day-action absence"
          data-date="${item.date}"
          data-kind="absence"
          type="button"
        >
          Falta
        </button>
      </footer>
    </article>
  `;
}

function calendarWeekendCell(item) {
  const canAddWork = item.date <= today();

  return `
    <article class="history-calendar-day weekend">
      <header class="calendar-cell-head">
        <strong>${Number(item.date.slice(-2))}</strong>
      </header>

      <div class="calendar-cell-body center">
        <span class="calendar-status-title">${item.label}</span>
        <small>Fim de semana</small>
      </div>

      ${
        canAddWork
          ? `
            <footer class="calendar-cell-actions vertical">
              <button
                class="add-special-work"
                data-date="${item.date}"
                type="button"
              >
                Adicionar horas trabalhadas
              </button>
            </footer>
          `
          : ""
      }
    </article>
  `;
}

function calendarFutureCell(item) {
  return `
    <article class="history-calendar-day future">
      <header class="calendar-cell-head">
        <strong>${Number(item.date.slice(-2))}</strong>
      </header>

      <div class="calendar-cell-body center">
        <span class="calendar-status-title">Próximo dia</span>
        <small>Aguardando marcação</small>
      </div>
    </article>
  `;
}

function historyCalendarCellHtml(item) {
  const kind = recordKind(item);

  if (kind === "blank") {
    return `<div class="history-calendar-day blank" aria-hidden="true"></div>`;
  }

  if (kind === "missing") return calendarMissingCell(item);
  if (kind === "weekend") return calendarWeekendCell(item);
  if (kind === "future") return calendarFutureCell(item);
  if (DAY_STATUS[kind]) return calendarStatusCell(item);

  return calendarWorkCell(item);
}

function monthLabel(key) {
  const [year, month] = key.split("-").map(Number);

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, 1));
}

function currentMonthKey() {
  return today().slice(0, 7);
}

function automaticRemainingWorkdays(monthKey, items) {
  if (monthKey !== currentMonthKey()) return 0;

  const [year, month] = monthKey.split("-").map(Number);
  const now = new Date();
  const firstDate = new Date(year, month - 1, now.getDate());
  const lastDate = new Date(year, month, 0);
  const recordedDates = new Set(items.map((item) => item.date));

  let count = 0;

  for (
    let cursor = new Date(firstDate);
    cursor <= lastDate;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const day = cursor.getDay();
    const iso = localIsoDate(cursor);
    const isWeekday = day >= 1 && day <= 5;

    if (isWeekday && !recordedDates.has(iso)) {
      count += 1;
    }
  }

  return count;
}

function remainingDaysForMonth(user, monthKey, items) {
  const override = Number(user?.compensationDays?.[monthKey]);

  if (
    Number.isInteger(override) &&
    override >= 0 &&
    override <= 31
  ) {
    return override;
  }

  return automaticRemainingWorkdays(monthKey, items);
}

function preciseDailyDuration(totalMinutes, days) {
  if (!days) return "—";

  const totalSeconds = Math.round((Math.abs(totalMinutes) / days) * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];

  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes} min`);
  if (seconds) parts.push(`${seconds} s`);

  return parts.join(" ") || "0 min";
}

function exactDistribution(totalMinutes, days, actionText) {
  const total = Math.abs(Math.round(totalMinutes));

  if (!days || !total) return "";

  const base = Math.floor(total / days);
  const remainder = total % days;
  const higher = base + 1;
  const lowerDays = days - remainder;

  if (remainder === 0) {
    return `${actionText} ${duration(base)} em cada um dos ${days} dias.`;
  }

  if (base === 0) {
    return `${actionText} 1 min em ${remainder} ${
      remainder === 1 ? "dia" : "dias"
    }; nos demais, não é necessário ajustar.`;
  }

  return `${actionText} ${duration(higher)} em ${remainder} ${
    remainder === 1 ? "dia" : "dias"
  } e ${duration(base)} nos outros ${lowerDays}.`;
}

function compensationPlan(net, days) {
  if (days <= 0) {
    return {
      tone: "neutral",
      label: "Sem dias úteis restantes",
      value: "—",
      text:
        "Não há dias disponíveis para distribuir o saldo. " +
        "Ajuste manualmente o número de dias caso ainda exista alguma data útil."
    };
  }

  if (net === 0) {
    return {
      tone: "zero",
      label: "Saldo mensal zerado",
      value: "0 min/dia",
      text: "Você não precisa fazer nenhum ajuste diário para fechar o mês."
    };
  }

  const average = preciseDailyDuration(net, days);

  if (net > 0) {
    return {
      tone: "positive",
      label: "Crédito disponível por dia",
      value: average,
      text:
        `Você pode chegar, em média, ${average} mais tarde por dia. ` +
        exactDistribution(net, days, "Para usar o saldo exatamente, chegue")
    };
  }

  return {
    tone: "negative",
    label: "Tempo extra necessário por dia",
    value: average,
    text:
      `Faça, em média, ${average} além das 8 horas por dia. ` +
      exactDistribution(net, days, "Para zerar exatamente, trabalhe")
  };
}

function saveCompensationDays(monthKey, value) {
  const allAccounts = accounts();
  const user = allAccounts[currentUser];

  if (!user) return;

  user.compensationDays = user.compensationDays || {};

  if (value === "" || value === null) {
    delete user.compensationDays[monthKey];
  } else {
    const parsed = Math.max(0, Math.min(31, Number(value)));

    if (!Number.isInteger(parsed)) return;
    user.compensationDays[monthKey] = parsed;
  }

  allAccounts[currentUser] = user;
  saveAccounts(allAccounts);
  renderHistory();
}



function availableHistoryMonths(history) {
  const months = new Set(
    history
      .filter((record) => record?.date)
      .map((record) => record.date.slice(0, 7))
  );

  months.add(currentMonthKey());

  return Array.from(months).sort();
}

function navigateHistoryMonth(direction) {
  const user = accounts()[currentUser];
  const history = Array.isArray(user?.history) ? user.history : [];
  const monthKeys = availableHistoryMonths(history);
  const currentIndex = monthKeys.indexOf(historyMonthKey);

  if (currentIndex < 0) return;

  const nextIndex = currentIndex + direction;

  if (nextIndex < 0 || nextIndex >= monthKeys.length) {
    return;
  }

  historyMonthKey = monthKeys[nextIndex];
  renderHistory();
}

function renderHistory() {
  const user = accounts()[currentUser];
  const history = (user?.history || [])
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  const groups = history.reduce((result, record) => {
    const key = record.date.slice(0, 7);
    (result[key] || (result[key] = [])).push(record);
    return result;
  }, {});

  const monthKeys = availableHistoryMonths(history);

  if (
    !historyMonthKey ||
    !monthKeys.includes(historyMonthKey)
  ) {
    historyMonthKey = monthKeys.includes(currentMonthKey())
      ? currentMonthKey()
      : monthKeys[monthKeys.length - 1];
  }

  const selectedIndex = monthKeys.indexOf(historyMonthKey);
  const hasOlderMonth = selectedIndex > 0;
  const hasNewerMonth = selectedIndex < monthKeys.length - 1;
  const items = (groups[historyMonthKey] || [])
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  const positive = items
    .map(effectiveBalance)
    .filter((balance) => balance > 0)
    .reduce((sum, balance) => sum + balance, 0);

  const negative = items
    .map(effectiveBalance)
    .filter((balance) => balance < 0)
    .reduce((sum, balance) => sum + balance, 0);

  const net = positive + negative;
  const isCurrentMonth = historyMonthKey === currentMonthKey();
  const automaticDays = automaticRemainingWorkdays(
    historyMonthKey,
    items
  );
  const remainingDays = remainingDaysForMonth(
    user,
    historyMonthKey,
    items
  );
  const plan = compensationPlan(net, remainingDays);
  const financialEstimate = financialEstimateForMonth(user, items);
  const financialHtml = financialHistoryHtml(financialEstimate);
  const calendarCells = monthCalendarCells(
    historyMonthKey,
    items
  );

  el.daysCount.textContent = items.length;
  el.totalBalance.textContent = duration(net, true);
  el.lastDate.textContent = items[0]
    ? dateBR(items[0].date)
    : "—";

  setMetricStatus(
    el.balanceMetric,
    net > 0
      ? "positive"
      : net < 0
        ? "negative"
        : "neutral"
  );

  el.emptyHistory.classList.add("hidden");
  el.historyList.classList.remove("hidden");

  const compensationHtml = isCurrentMonth
    ? `
      <section class="compensation-card ${plan.tone}">
        <div class="compensation-head">
          <div>
            <span class="compensation-kicker">Plano de compensação</span>
            <strong>${plan.label}</strong>
          </div>
          <span class="compensation-value">${plan.value}</span>
        </div>

        <div class="compensation-controls">
          <label>
            Dias úteis restantes
            <input
              class="compensation-days-input"
              data-month="${historyMonthKey}"
              type="number"
              min="0"
              max="31"
              step="1"
              value="${remainingDays}"
            />
          </label>

          <button
            class="btn secondary small compensation-auto"
            data-month="${historyMonthKey}"
            type="button"
          >
            Usar automático (${automaticDays})
          </button>
        </div>

        <small>
          O automático considera os dias úteis futuros ainda não registrados.
          Feriados, atestados, faltas e faltas abonadas já registradas deixam
          de ser considerados pendentes.
        </small>
      </section>
    `
    : "";

  const cellsHtml = calendarCells
    .map(historyCalendarCellHtml)
    .join("");

  el.historyList.innerHTML = `
    <section class="month-group calendar-month-group">
      <header class="month-head">
        <nav class="history-month-navigation" aria-label="Navegação entre meses">
          <button
            id="historyPreviousMonth"
            class="history-month-arrow"
            type="button"
            aria-label="Abrir mês anterior"
            ${hasOlderMonth ? "" : "disabled"}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>

          <div class="history-month-current">
            <span class="history-month-position">
              ${selectedIndex + 1} de ${monthKeys.length}
            </span>
            <h3 class="month-title">${monthLabel(historyMonthKey)}</h3>
            <span class="month-days">
              ${items.length}
              ${items.length === 1 ? "registro" : "registros"}
            </span>
          </div>

          <button
            id="historyNextMonth"
            class="history-month-arrow"
            type="button"
            aria-label="Abrir próximo mês"
            ${hasNewerMonth ? "" : "disabled"}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </nav>

        <div class="month-summary">
          <div class="month-stat positive">
            <span>Horas positivas</span>
            <strong>${duration(positive, true)}</strong>
          </div>

          <div class="month-stat negative">
            <span>Horas negativas</span>
            <strong>${negative ? duration(negative, true) : "0 min"}</strong>
          </div>

          <div class="month-stat net ${
            net > 0
              ? "positive"
              : net < 0
                ? "negative"
                : "zero"
          }">
            <span>Saldo líquido do mês</span>
            <strong>${duration(net, true)}</strong>
          </div>
        </div>

        ${financialHtml}
        ${compensationHtml}
      </header>

      <div class="history-calendar-scroll">
        <div class="history-calendar-weekdays" aria-hidden="true">
          <span>Seg</span>
          <span>Ter</span>
          <span>Qua</span>
          <span>Qui</span>
          <span>Sex</span>
          <span>Sáb</span>
          <span>Dom</span>
        </div>

        <div class="history-calendar-grid">
          ${cellsHtml}
        </div>
      </div>

      <footer class="history-calendar-legend">
        <span><i class="legend-dot positive"></i> Hora positiva</span>
        <span><i class="legend-dot negative"></i> Hora negativa</span>
        <span><i class="legend-dot holiday"></i> Feriado</span>
        <span><i class="legend-dot medical"></i> Atestado</span>
        <span><i class="legend-dot absence"></i> Falta</span>
        <span><i class="legend-dot weekend"></i> Fim de semana</span>
      </footer>
    </section>
  `;

  const previousButton = $("historyPreviousMonth");
  const nextButton = $("historyNextMonth");

  if (previousButton) {
    previousButton.addEventListener("click", () => {
      navigateHistoryMonth(-1);
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      navigateHistoryMonth(1);
    });
  }

  el.historyList
    .querySelectorAll(".calendar-delete")
    .forEach((button) => {
      button.addEventListener("click", () => {
        hideFloatingTooltip();
        deleteHistory(button.dataset.id);
      });
    });

  el.historyList
    .querySelectorAll(".calendar-note")
    .forEach((button) => {
      button.addEventListener("click", () => {
        hideFloatingTooltip();
        openNoteDialog(button.dataset.id);
      });
    });

  el.historyList
    .querySelectorAll(".work-negative-excuse")
    .forEach((button) => {
      button.addEventListener("click", () => {
        openNegativeExcuseDialog(button.dataset.id);
      });
    });

  bindFloatingTooltips(el.historyList);

  el.historyList
    .querySelectorAll(".day-action")
    .forEach((button) => {
      button.addEventListener("click", () => {
        markDayStatus(
          button.dataset.date,
          button.dataset.kind
        );
      });
    });

  el.historyList
    .querySelectorAll(".absence-excuse")
    .forEach((button) => {
      button.addEventListener("click", () => {
        toggleAbsenceExcuse(button.dataset.id);
      });
    });

  el.historyList
    .querySelectorAll(".add-special-work")
    .forEach((button) => {
      button.addEventListener("click", () => {
        prepareSpecialWorkEntry(button.dataset.date);
      });
    });

  el.historyList
    .querySelectorAll(".compensation-days-input")
    .forEach((input) => {
      input.addEventListener("change", () => {
        saveCompensationDays(input.dataset.month, input.value);
      });
    });

  el.historyList
    .querySelectorAll(".compensation-auto")
    .forEach((button) => {
      button.addEventListener("click", () => {
        saveCompensationDays(button.dataset.month, "");
      });
    });
}

function deleteHistory(id) {
  if (!confirm("Excluir este registro?")) return;

  const allAccounts = accounts();
  const user = allAccounts[currentUser];

  user.history = (user.history || []).filter(
    (record) => record.id !== id
  );

  allAccounts[currentUser] = user;
  saveAccounts(allAccounts);
  renderHistory();
}


function openDeleteAccountDialog() {
  const user = accounts()[currentUser];

  if (!user) {
    return toast("Conta não encontrada.", "error");
  }

  el.deleteAccountCode.textContent = user.email || "Conta Google conectada";
  el.deleteAccountConfirm.value = "";
  setError(el.deleteAccountError);
  el.deleteAccountDialog.showModal();
}

function closeDeleteAccountDialog() {
  el.deleteAccountDialog.close();
  el.deleteAccountForm.reset();
  setError(el.deleteAccountError);
}

async function deleteCurrentAccount(event) {
  event.preventDefault();
  setError(el.deleteAccountError);

  if (el.deleteAccountConfirm.value.trim().toUpperCase() !== "APAGAR") {
    setError(el.deleteAccountError, "Digite APAGAR exatamente como solicitado.");
    return;
  }

  if (!supabaseClient || !authSession) {
    setError(el.deleteAccountError, "Sua sessão não está disponível. Entre novamente.");
    return;
  }

  const submit = el.deleteAccountForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.textContent = "Apagando…";

  try {
    const { error } = await supabaseClient.rpc("delete_my_account");

    if (error) throw error;

    try {
      await supabaseClient.auth.signOut();
    } catch {
      // A função já pode ter invalidado a sessão ao remover o usuário.
    }

    el.deleteAccountDialog.close();
    resetCloudInterface();
    setAuthLoading(false);
    toast("Conta e dados apagados definitivamente.");
  } catch (error) {
    console.error(error);
    setError(
      el.deleteAccountError,
      `Não foi possível apagar a conta: ${error.message}`
    );
  } finally {
    submit.disabled = false;
    submit.textContent = "Apagar definitivamente";
  }
}

function backupFileLabel(user) {
  return String(user?.email || "conta-google")
    .split("@")[0]
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "conta-google";
}

function exportBackup() {
  const user = accounts()[currentUser];

  const payload = {
    app: "Calculadora de Jornada FB",
    version: 2,
    exportedAt: new Date().toISOString(),
    account: user
  };

  download(
    `backup-jornada-${backupFileLabel(user)}.json`,
    JSON.stringify(payload, null, 2),
    "application/json"
  );
}

async function importBackupFile(file) {
  try {
    const data = JSON.parse(await file.text());
    const imported = data?.account;
    const allAccounts = accounts();
    const current = allAccounts[currentUser];

    if (!current || !imported || typeof imported !== "object") {
      throw new Error("Backup inválido");
    }

    if (!Array.isArray(imported.history)) {
      throw new Error("O backup não contém um histórico válido");
    }

    if (!confirm(
      "Importar este backup substituirá histórico, preferências e medalhas da conta atual. Continuar?"
    )) {
      return;
    }

    const importedMascot = ensureMascot(imported);
    const importedPalette = ensurePalette(imported);

    allAccounts[currentUser] = normalizeCloudAccount(
      {
        ...current,
        mascot: importedMascot,
        palette: importedPalette,
        paletteIndependent: imported.paletteIndependent === true,
        salarySettings: {
          ...DEFAULT_SALARY_SETTINGS,
          ...(imported.salarySettings || {})
        },
        achievementState: imported.achievementState || newAchievementState(current),
        history: imported.history
      },
      authSession.user
    );

    saveAccounts(allAccounts);
    await persistCurrentUserNow();
    updateAccountInterface();
    renderHistory();
    renderAchievements();
    toast("Backup importado e sincronizado.");
  } catch (error) {
    toast(error.message || "Não foi possível importar o backup.", "error");
  }
}



const ACHIEVEMENT_CATEGORIES = {
  jornada: {
    label: "Pontualidade e jornada",
    glyph: "◷"
  },
  saldo: {
    label: "Saldo e compensação",
    glyph: "+"
  },
  horarios: {
    label: "Horários curiosos",
    glyph: "⌚"
  },
  almoco: {
    label: "Almoço",
    glyph: "☕"
  },
  frequencia: {
    label: "Sequências e frequência",
    glyph: "▦"
  },
  especiais: {
    label: "Fim de semana e feriado",
    glyph: "✦"
  },
  ocorrencias: {
    label: "Justificativas e ocorrências",
    glyph: "!"
  },
  app: {
    label: "Uso do aplicativo",
    glyph: "⌁"
  },
  secretas: {
    label: "Medalhas secretas",
    glyph: "?"
  }
};

const ACHIEVEMENTS = [
  { id:"relogio-suico", code:"RS", category:"jornada", name:"Relógio suíço", description:"Complete a jornada em 10 dias consecutivos." },
  { id:"na-medida", code:"NM", category:"jornada", name:"Na medida", description:"Termine um dia com exatamente 8 horas trabalhadas." },
  { id:"precisao-cirurgica", code:"PC", category:"jornada", name:"Precisão cirúrgica", description:"Termine 5 dias com saldo entre −1 e +1 minuto." },
  { id:"tolerancia-estrategia", code:"TE", category:"jornada", name:"Tolerância é estratégia", description:"Termine um dia com exatamente 10 minutos de diferença, para menos ou para mais." },
  { id:"semana-redonda", code:"SR", category:"jornada", name:"Semana redonda", description:"Feche uma semana inteira sem horas negativas." },
  { id:"mes-perfeito", code:"MP", category:"jornada", name:"Mês perfeito", description:"Finalize um mês completo com saldo líquido exatamente zerado." },
  { id:"sem-sustos", code:"SS", category:"jornada", name:"Sem sustos", description:"Passe um mês completo sem nenhum dia abaixo da tolerância." },
  { id:"tudo-sob-controle", code:"TC", category:"jornada", name:"Tudo sob controle", description:"Mantenha todos os dias úteis do mês atual classificados." },

  { id:"primeiro-credito", code:"1C", category:"saldo", name:"Primeiro crédito", description:"Acumule sua primeira hora positiva." },
  { id:"banco-abastecido", code:"BA", category:"saldo", name:"Banco abastecido", description:"Acumule 5 horas positivas." },
  { id:"banco-recheado", code:"BR", category:"saldo", name:"Banco recheado", description:"Acumule 10 horas positivas." },
  { id:"patrimonio-minutos", code:"PM", category:"saldo", name:"Patrimônio em minutos", description:"Acumule 20 horas positivas." },
  { id:"divida-paga", code:"DP", category:"saldo", name:"Dívida paga", description:"Saia de um saldo acumulado negativo e volte ao zero ou positivo." },
  { id:"recuperacao-historica", code:"RH", category:"saldo", name:"Recuperação histórica", description:"Recupere mais de 5 horas negativas dentro do mesmo mês." },
  { id:"distribuicao-perfeita", code:"D0", category:"saldo", name:"Distribuição perfeita", description:"Tenha horas positivas e negativas e finalize um mês completo no zero." },
  { id:"guardou-usou", code:"GU", category:"saldo", name:"Guardou, usou", description:"Use um crédito anterior para absorver um atraso sem ficar negativo." },

  { id:"madrugador", code:"MD", category:"horarios", name:"Madrugador", description:"Entre antes das 8h." },
  { id:"sol-nem-nasceu", code:"SN", category:"horarios", name:"O sol nem nasceu direito", description:"Entre antes das 7h." },
  { id:"ultimo-apagar-luz", code:"UL", category:"horarios", name:"Último a apagar a luz", description:"Registre uma saída depois das 21h." },
  { id:"horario-alternativo", code:"HA", category:"horarios", name:"Horário alternativo", description:"Entre depois das 11h e ainda complete a jornada." },
  { id:"turno-estendido", code:"10", category:"horarios", name:"Turno estendido", description:"Trabalhe mais de 10 horas em um único dia." },
  { id:"dia-infinito", code:"12", category:"horarios", name:"Dia infinito", description:"Trabalhe mais de 12 horas em um único dia." },
  { id:"speedrun-jornada", code:"SJ", category:"horarios", name:"Speedrun da jornada", description:"Complete 8 horas e saia exatamente no horário calculado." },
  { id:"consistencia-suspeita", code:"CS", category:"horarios", name:"Consistência suspeita", description:"Registre o mesmo horário de entrada em 5 dias diferentes." },

  { id:"rh-viu-isso", code:"RH", category:"almoco", name:"O RH viu isso", description:"Registre um intervalo de almoço inferior a 1 hora.", negative:true },
  { id:"sem-pressa-nenhuma", code:"SP", category:"almoco", name:"Sem pressa nenhuma", description:"Faça um intervalo de almoço superior a 1h30." },
  { id:"cronometro-gastronomico", code:"CG", category:"almoco", name:"Cronômetro gastronômico", description:"Faça exatamente 1 hora de almoço." },
  { id:"cardapio-consistente", code:"CC", category:"almoco", name:"Cardápio consistente", description:"Mantenha 5 almoços dentro de uma variação máxima de 5 minutos." },
  { id:"foi-almocar-viajar", code:"FV", category:"almoco", name:"Foi almoçar ou viajar?", description:"Bata o seu próprio recorde de maior intervalo de almoço.", dynamic:true },

  { id:"pegou-no-tranco", code:"PT", category:"frequencia", name:"Pegou no tranco", description:"Registre 5 dias úteis consecutivos." },
  { id:"no-automatico", code:"NA", category:"frequencia", name:"No automático", description:"Registre 10 dias úteis consecutivos." },
  { id:"maquina-administrativa", code:"30", category:"frequencia", name:"Máquina administrativa", description:"Registre 30 dias trabalhados." },
  { id:"veterano-ponto", code:"100", category:"frequencia", name:"Veterano do ponto", description:"Registre 100 dias trabalhados." },
  { id:"historiador-oficial", code:"HO", category:"frequencia", name:"Historiador oficial", description:"Mantenha registros em 6 meses diferentes." },
  { id:"anuario-completo", code:"AC", category:"frequencia", name:"Anuário completo", description:"Tenha pelo menos um registro trabalhado em todos os meses de um mesmo ano." },
  { id:"segundou-mesmo", code:"2ª", category:"frequencia", name:"Segundou mesmo", description:"Complete 10 segundas-feiras sem saldo negativo." },
  { id:"sextou-direito", code:"6ª", category:"frequencia", name:"Sextou direito", description:"Complete 10 sextas-feiras sem sair devendo." },

  { id:"fim-semana-nunca-ouvi", code:"FS", category:"especiais", name:"Final de semana? Nunca ouvi falar", description:"Registre trabalho em um sábado ou domingo." },
  { id:"domingou-trabalhando", code:"DO", category:"especiais", name:"Domingou trabalhando", description:"Registre trabalho em um domingo." },
  { id:"feriado-premium", code:"FP", category:"especiais", name:"Feriado premium", description:"Registre horas trabalhadas em um feriado." },
  { id:"plantao-desbloqueado", code:"PD", category:"especiais", name:"Plantão desbloqueado", description:"Trabalhe em 3 fins de semana diferentes." },
  { id:"calendario-nao-manda", code:"CN", category:"especiais", name:"Calendário não manda em mim", description:"Trabalhe em fim de semana e feriado no mesmo mês." },
  { id:"hora-dourada", code:"HD", category:"especiais", name:"Hora dourada", description:"Acumule 8 horas positivas apenas em fins de semana ou feriados." },

  { id:"tudo-documentado", code:"TD", category:"ocorrencias", name:"Tudo documentado", description:"Registre o primeiro atestado." },
  { id:"calendario-atualizado", code:"CA", category:"ocorrencias", name:"Calendário atualizado", description:"Marque um feriado no calendário." },
  { id:"acontece", code:"AC", category:"ocorrencias", name:"Acontece", description:"Registre a primeira falta." },
  { id:"falta-contexto", code:"FC", category:"ocorrencias", name:"Falta, mas com contexto", description:"Registre uma falta e aplique o abono das horas negativas." },
  { id:"organizacao-acima-tudo", code:"OT", category:"ocorrencias", name:"Organização acima de tudo", description:"Não deixe dias úteis pendentes nos meses presentes no histórico." },
  { id:"arquivo-impecavel", code:"AI", category:"ocorrencias", name:"Arquivo impecável", description:"Finalize um mês completo com todos os dias úteis classificados." },

  { id:"curioso-demais", code:"CD", category:"app", name:"Curioso demais", description:"Abra Dados inúteis pela primeira vez.", fireworks:true },
  { id:"rh-nao-pediu", code:"RH", category:"app", name:"O RH não pediu", description:"Consulte os três períodos da tela de estatísticas." },
  { id:"cientista-jornada", code:"CJ", category:"app", name:"Cientista da jornada", description:"Abra Dados inúteis em 10 dias diferentes." },
  { id:"agora-virou-competicao", code:"AV", category:"app", name:"Agora virou competição", description:"Supere um dos seus próprios recordes pessoais." },
  { id:"deixa-eu-conferir", code:"DC", category:"app", name:"Deixa eu só conferir", description:"Abra o histórico 20 vezes." },
  { id:"personalidade-definida", code:"PD", category:"app", name:"Personalidade definida", description:"Escolha um mascote e use uma paleta independente." },
  { id:"colecionador-estilos", code:"CE", category:"app", name:"Colecionador de estilos", description:"Use os quatro mascotes pelo menos uma vez." },
  { id:"contador-honorario", code:"CH", category:"app", name:"Contador honorário", description:"Ative a estimativa financeira." },
  { id:"quanto-vale-sofrimento", code:"QV", category:"app", name:"Quanto vale meu sofrimento?", description:"Consulte pela primeira vez a estimativa financeira das horas." },

  { id:"secret-2359", code:"?", category:"secretas", name:"23:59", description:"Registre uma saída exatamente às 23:59.", secret:true },
  { id:"secret-numero-bonito", code:"?", category:"secretas", name:"Número bonito", description:"Termine um dia com saldo de +1h11, +2h22 ou +3h33.", secret:true },
  { id:"secret-escolhido", code:"?", category:"secretas", name:"O escolhido", description:"Trabalhe exatamente 7h07, 8h08 ou 9h09.", secret:true },
  { id:"secret-equilibrio", code:"?", category:"secretas", name:"Equilíbrio universal", description:"Iguale horas positivas e negativas e feche o saldo em zero.", secret:true },
  { id:"secret-segunda-2", code:"?", category:"secretas", name:"Segunda-feira 2", description:"Faça da segunda-feira o dia mais trabalhado da semana.", secret:true },
  { id:"secret-olhadinha", code:"?", category:"secretas", name:"Era só uma olhadinha", description:"Abra Dados inúteis 5 vezes no mesmo dia.", secret:true },
  { id:"secret-planejado", code:"?", category:"secretas", name:"Isso foi planejado?", description:"Registre os quatro horários com o mesmo número nos minutos.", secret:true },
  { id:"secret-sem-comentarios", code:"?", category:"secretas", name:"Sem comentários", description:"Acumule exatamente 7h06 de saldo positivo.", secret:true },
  { id:"secret-viajante-tempo", code:"?", category:"secretas", name:"Viajante do tempo", description:"Registre uma data antiga depois de já ter datas mais recentes.", secret:true },
  { id:"achievement-desbloqueado", code:"?", category:"secretas", name:"Achievement desbloqueado", description:"Desbloqueie 10 medalhas.", secret:true }
];

const DEFAULT_ACHIEVEMENT_STATE = {
  initialized: false,
  unlocked: {},
  repeatCounts: {},
  dynamicValues: {},
  usage: {
    statsOpenDates: [],
    statsOpenByDate: {},
    statsPeriodsViewed: [],
    historyOpenCount: 0,
    mascotsUsed: [],
    financialViewed: false,
    personalRecordBroken: false
  }
};

function newAchievementState(user = null) {
  return {
    initialized: false,
    unlocked: {},
    repeatCounts: {},
    dynamicValues: {},
    usage: {
      statsOpenDates: [],
      statsOpenByDate: {},
      statsPeriodsViewed: [],
      historyOpenCount: 0,
      mascotsUsed: user ? [ensureMascot(user)] : [],
      financialViewed: false,
      personalRecordBroken: false
    }
  };
}

function ensureAchievementState(user) {
  if (!user.achievementState || typeof user.achievementState !== "object") {
    user.achievementState = newAchievementState(user);
  }

  const state = user.achievementState;
  state.unlocked = state.unlocked || {};
  state.repeatCounts = state.repeatCounts || {};
  state.dynamicValues = state.dynamicValues || {};
  state.usage = state.usage || {};

  const usage = state.usage;
  usage.statsOpenDates = Array.isArray(usage.statsOpenDates)
    ? usage.statsOpenDates
    : [];
  usage.statsOpenByDate =
    usage.statsOpenByDate &&
    typeof usage.statsOpenByDate === "object"
      ? usage.statsOpenByDate
      : {};
  usage.statsPeriodsViewed = Array.isArray(usage.statsPeriodsViewed)
    ? usage.statsPeriodsViewed
    : [];
  usage.historyOpenCount = Math.max(
    0,
    finiteNumber(usage.historyOpenCount, 0)
  );
  usage.mascotsUsed = Array.isArray(usage.mascotsUsed)
    ? usage.mascotsUsed
    : [];
  usage.financialViewed = usage.financialViewed === true;
  usage.personalRecordBroken = usage.personalRecordBroken === true;

  const currentMascot = ensureMascot(user);
  if (!usage.mascotsUsed.includes(currentMascot)) {
    usage.mascotsUsed.push(currentMascot);
  }

  return state;
}

function achievementLunchMinutes(record) {
  if (record?.noLunch === true) return null;

  const lunchOut = toMinutes(record?.lunchOut);
  const lunchBack = toMinutes(record?.lunchBack);

  if (lunchOut === null || lunchBack === null) return null;

  const value = lunchBack - lunchOut;
  return value >= 0 ? value : null;
}

function achievementMinutePart(value) {
  if (!value || !value.includes(":")) return null;
  return Number(value.split(":")[1]);
}

function achievementMondayIso(dateValue) {
  const date = parseISO(dateValue);
  if (!date) return null;

  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return localIsoDate(date);
}

function achievementNextBusinessIso(dateValue) {
  const date = parseISO(dateValue);
  if (!date) return null;

  do {
    date.setDate(date.getDate() + 1);
  } while (date.getDay() === 0 || date.getDay() === 6);

  return localIsoDate(date);
}

function achievementLongestBusinessStreak(records, predicate = () => true) {
  const valid = records
    .filter(predicate)
    .map((record) => record.date)
    .filter(Boolean)
    .sort()
    .filter((date, index, list) => index === 0 || date !== list[index - 1]);

  let longest = 0;
  let current = 0;
  let previous = null;

  valid.forEach((date) => {
    if (previous && achievementNextBusinessIso(previous) === date) {
      current += 1;
    } else {
      current = 1;
    }

    longest = Math.max(longest, current);
    previous = date;
  });

  return longest;
}

function achievementMonthWeekdays(monthKey, throughToday = false) {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const currentIso = today();
  const dates = [];

  for (let day = 1; day <= lastDay; day += 1) {
    const date = new Date(year, month - 1, day);
    const iso = localIsoDate(date);

    if (throughToday && iso > currentIso) break;

    if (date.getDay() >= 1 && date.getDay() <= 5) {
      dates.push(iso);
    }
  }

  return dates;
}

function achievementMonthCovered(monthKey, records, throughToday = false) {
  const registered = new Set(records.map((record) => record.date));
  const required = achievementMonthWeekdays(monthKey, throughToday);

  return required.length > 0 && required.every((date) => registered.has(date));
}

function achievementSlidingLunchConsistency(lunchRecords) {
  const sorted = lunchRecords
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  for (let index = 0; index <= sorted.length - 5; index += 1) {
    const values = sorted
      .slice(index, index + 5)
      .map((record) => record.lunchMinutes);

    if (Math.max(...values) - Math.min(...values) <= 5) {
      return true;
    }
  }

  return false;
}

function buildAchievementContext(user) {
  const state = ensureAchievementState(user);
  const history = (Array.isArray(user.history) ? user.history : [])
    .filter((record) => record?.date)
    .slice();

  const sorted = history
    .slice()
    .sort((a, b) => (
      a.date.localeCompare(b.date) ||
      String(a.savedAt || "").localeCompare(String(b.savedAt || ""))
    ));

  const workRecords = sorted.filter(
    (record) => recordKind(record) === "work"
  );

  const normalWork = workRecords.filter(
    (record) => !record.specialWorkType
  );

  const lunchRecords = workRecords
    .map((record) => ({
      ...record,
      lunchMinutes: achievementLunchMinutes(record)
    }))
    .filter((record) => record.lunchMinutes !== null);

  const positiveMinutes = history.reduce(
    (sum, record) => sum + Math.max(0, effectiveBalance(record)),
    0
  );

  const negativeMinutes = history.reduce(
    (sum, record) => sum + Math.min(0, effectiveBalance(record)),
    0
  );

  const netMinutes = positiveMinutes + negativeMinutes;
  const specialPositiveMinutes = workRecords
    .filter((record) => record.specialWorkType)
    .reduce(
      (sum, record) => sum + Math.max(0, effectiveBalance(record)),
      0
    );

  const months = {};
  history.forEach((record) => {
    const key = record.date.slice(0, 7);
    (months[key] || (months[key] = [])).push(record);
  });

  const monthKeys = Object.keys(months).sort();
  const currentMonth = currentMonthKey();
  const completedMonthKeys = monthKeys.filter(
    (key) => key < currentMonth
  );

  const monthSummaries = {};
  monthKeys.forEach((key) => {
    const items = months[key];
    const positive = items.reduce(
      (sum, record) => sum + Math.max(0, effectiveBalance(record)),
      0
    );
    const negative = items.reduce(
      (sum, record) => sum + Math.min(0, effectiveBalance(record)),
      0
    );

    monthSummaries[key] = {
      items,
      positive,
      negative,
      net: positive + negative,
      covered: achievementMonthCovered(
        key,
        items,
        key === currentMonth
      ),
      fullyCovered: achievementMonthCovered(key, items, false)
    };
  });

  const validStreak = achievementLongestBusinessStreak(
    normalWork,
    (record) => effectiveBalance(record) >= -TOLERANCE
  );

  const registeredStreak = achievementLongestBusinessStreak(workRecords);

  const preciseDays = normalWork.filter(
    (record) => Math.abs(effectiveBalance(record)) <= 1
  ).length;

  const exactDays = normalWork.filter(
    (record) => finiteNumber(record.total, 0) === JOURNEY
  ).length;

  const entryCounts = {};
  normalWork.forEach((record) => {
    if (record.entry) {
      entryCounts[record.entry] = (entryCounts[record.entry] || 0) + 1;
    }
  });

  const maxSameEntry = Math.max(0, ...Object.values(entryCounts));

  const mondayValid = normalWork.filter((record) => {
    const date = parseISO(record.date);
    return date?.getDay() === 1 && effectiveBalance(record) >= 0;
  }).length;

  const fridayValid = normalWork.filter((record) => {
    const date = parseISO(record.date);
    return date?.getDay() === 5 && effectiveBalance(record) >= 0;
  }).length;

  const weekendWork = workRecords.filter((record) => {
    const date = parseISO(record.date);
    return (
      record.specialWorkType === "weekend" ||
      date?.getDay() === 0 ||
      date?.getDay() === 6
    );
  });

  const sundayWork = weekendWork.filter((record) => {
    const date = parseISO(record.date);
    return date?.getDay() === 0;
  });

  const holidayWork = workRecords.filter(
    (record) => record.specialWorkType === "holiday"
  );

  const differentWorkMonths = new Set(
    workRecords.map((record) => record.date.slice(0, 7))
  );

  const monthsByYear = {};
  workRecords.forEach((record) => {
    const year = record.date.slice(0, 4);
    const month = record.date.slice(5, 7);
    (monthsByYear[year] || (monthsByYear[year] = new Set())).add(month);
  });

  const hasFullYear = Object.values(monthsByYear)
    .some((set) => set.size === 12);

  const weekGroups = {};
  history.forEach((record) => {
    const week = achievementMondayIso(record.date);
    if (!week) return;
    (weekGroups[week] || (weekGroups[week] = [])).push(record);
  });

  const hasRoundWeek = Object.entries(weekGroups).some(([monday, items]) => {
    const required = [];
    const mondayDate = parseISO(monday);

    for (let offset = 0; offset < 5; offset += 1) {
      const date = new Date(mondayDate);
      date.setDate(date.getDate() + offset);
      required.push(localIsoDate(date));
    }

    const byDate = new Map(items.map((item) => [item.date, item]));

    return required.every((date) => {
      const item = byDate.get(date);
      return item && effectiveBalance(item) >= 0;
    });
  });

  const completeCoveredMonths = completedMonthKeys.filter(
    (key) => monthSummaries[key]?.fullyCovered
  );

  const hasPerfectMonth = completeCoveredMonths.some(
    (key) => monthSummaries[key].net === 0
  );

  const hasNoScareMonth = completeCoveredMonths.some((key) =>
    monthSummaries[key].items.every(
      (record) => effectiveBalance(record) >= -TOLERANCE
    )
  );

  const hasDistributionPerfect = completeCoveredMonths.some((key) => {
    const summary = monthSummaries[key];
    return (
      summary.net === 0 &&
      summary.positive > 0 &&
      summary.negative < 0
    );
  });

  let cumulative = 0;
  let wasNegative = false;
  let debtPaid = false;

  sorted.forEach((record) => {
    cumulative += effectiveBalance(record);

    if (cumulative < 0) {
      wasNegative = true;
    } else if (wasNegative) {
      debtPaid = true;
    }
  });

  let recoveryHistorical = false;
  let guardouUsou = false;

  Object.values(monthSummaries).forEach((summary) => {
    const items = summary.items
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));

    let monthCumulative = 0;
    let minimum = 0;
    let sawPositiveBank = false;

    items.forEach((record) => {
      const balance = effectiveBalance(record);

      if (monthCumulative > 0) {
        sawPositiveBank = true;
      }

      if (
        balance < 0 &&
        sawPositiveBank &&
        monthCumulative + balance >= 0
      ) {
        guardouUsou = true;
      }

      monthCumulative += balance;
      minimum = Math.min(minimum, monthCumulative);

      if (
        minimum <= -300 &&
        monthCumulative - minimum >= 300
      ) {
        recoveryHistorical = true;
      }
    });
  });

  const lunchLongest = lunchRecords.length
    ? Math.max(...lunchRecords.map((record) => record.lunchMinutes))
    : 0;

  const weekdayTotals = new Map();
  workRecords.forEach((record) => {
    const day = parseISO(record.date)?.getDay();
    if (day === undefined) return;

    weekdayTotals.set(
      day,
      (weekdayTotals.get(day) || 0) + finiteNumber(record.total, 0)
    );
  });

  const mondayTotal = weekdayTotals.get(1) || 0;
  const otherWeekdayTotals = [0, 2, 3, 4, 5, 6]
    .map((day) => weekdayTotals.get(day) || 0);

  const mondayDominates =
    workRecords.filter(
      (record) => parseISO(record.date)?.getDay() === 1
    ).length >= 3 &&
    mondayTotal > Math.max(0, ...otherWeekdayTotals);

  const sameMonthWeekendHoliday = monthKeys.some((key) => {
    const items = months[key];
    return (
      items.some((record) => record.specialWorkType === "weekend") &&
      items.some((record) => record.specialWorkType === "holiday")
    );
  });

  const allRepresentedMonthsOrganized = monthKeys.length > 0 &&
    monthKeys.every((key) => (
      key === currentMonth
        ? monthSummaries[key].covered
        : monthSummaries[key].fullyCovered
    ));

  let timeTraveler = false;
  let latestSavedDate = "";

  history
    .slice()
    .sort((a, b) =>
      String(a.savedAt || "").localeCompare(String(b.savedAt || ""))
    )
    .forEach((record) => {
      if (latestSavedDate && record.date < latestSavedDate) {
        timeTraveler = true;
      }

      if (record.date > latestSavedDate) {
        latestSavedDate = record.date;
      }
    });

  const balanceByMonthEqual = monthKeys.some((key) => {
    const summary = monthSummaries[key];
    return (
      summary.positive > 0 &&
      summary.positive === Math.abs(summary.negative)
    );
  });

  return {
    user,
    state,
    history,
    sorted,
    workRecords,
    normalWork,
    lunchRecords,
    positiveMinutes,
    negativeMinutes,
    netMinutes,
    specialPositiveMinutes,
    months,
    monthKeys,
    monthSummaries,
    currentMonth,
    completedMonthKeys,
    completeCoveredMonths,
    validStreak,
    registeredStreak,
    preciseDays,
    exactDays,
    maxSameEntry,
    mondayValid,
    fridayValid,
    weekendWork,
    sundayWork,
    holidayWork,
    differentWorkMonths,
    hasFullYear,
    hasRoundWeek,
    hasPerfectMonth,
    hasNoScareMonth,
    hasDistributionPerfect,
    debtPaid,
    recoveryHistorical,
    guardouUsou,
    lunchLongest,
    mondayDominates,
    sameMonthWeekendHoliday,
    allRepresentedMonthsOrganized,
    timeTraveler,
    balanceByMonthEqual
  };
}

function achievementResult(id, context, unlockedWithoutFinal = 0) {
  const c = context;
  const usage = c.state.usage;
  const currentSummary = c.monthSummaries[c.currentMonth];
  const statsDates = usage.statsOpenDates.length;
  const statsPeriods = new Set(usage.statsPeriodsViewed).size;
  const historyOpens = usage.historyOpenCount;
  const mascotsUsed = new Set(usage.mascotsUsed).size;
  const maxStatsDay = Math.max(
    0,
    ...Object.values(usage.statsOpenByDate).map(Number)
  );

  const progress = (met, current = null, target = null, detail = "") => ({
    met,
    current,
    target,
    detail
  });

  switch (id) {
    case "relogio-suico":
      return progress(c.validStreak >= 10, c.validStreak, 10);
    case "na-medida":
      return progress(c.exactDays >= 1, c.exactDays, 1);
    case "precisao-cirurgica":
      return progress(c.preciseDays >= 5, c.preciseDays, 5);
    case "tolerancia-estrategia":
      return progress(c.normalWork.some(
        (record) => Math.abs(rawWorkBalance(record)) === TOLERANCE
      ));
    case "semana-redonda":
      return progress(c.hasRoundWeek);
    case "mes-perfeito":
      return progress(c.hasPerfectMonth);
    case "sem-sustos":
      return progress(c.hasNoScareMonth);
    case "tudo-sob-controle":
      return progress(
        Boolean(currentSummary?.covered),
        currentSummary?.items.length || 0,
        achievementMonthWeekdays(c.currentMonth, true).length
      );

    case "primeiro-credito":
      return progress(c.positiveMinutes >= 60, c.positiveMinutes, 60);
    case "banco-abastecido":
      return progress(c.positiveMinutes >= 300, c.positiveMinutes, 300);
    case "banco-recheado":
      return progress(c.positiveMinutes >= 600, c.positiveMinutes, 600);
    case "patrimonio-minutos":
      return progress(c.positiveMinutes >= 1200, c.positiveMinutes, 1200);
    case "divida-paga":
      return progress(c.debtPaid);
    case "recuperacao-historica":
      return progress(c.recoveryHistorical);
    case "distribuicao-perfeita":
      return progress(c.hasDistributionPerfect);
    case "guardou-usou":
      return progress(c.guardouUsou);

    case "madrugador":
      return progress(c.workRecords.some(
        (record) => toMinutes(record.entry) < 480
      ));
    case "sol-nem-nasceu":
      return progress(c.workRecords.some(
        (record) => toMinutes(record.entry) < 420
      ));
    case "ultimo-apagar-luz":
      return progress(c.workRecords.some(
        (record) => toMinutes(record.realExit) > 1260
      ));
    case "horario-alternativo":
      return progress(c.normalWork.some(
        (record) =>
          toMinutes(record.entry) > 660 &&
          finiteNumber(record.total, 0) >= JOURNEY
      ));
    case "turno-estendido":
      return progress(c.workRecords.some(
        (record) => finiteNumber(record.total, 0) > 600
      ));
    case "dia-infinito":
      return progress(c.workRecords.some(
        (record) => finiteNumber(record.total, 0) > 720
      ));
    case "speedrun-jornada":
      return progress(c.normalWork.some(
        (record) => (
          finiteNumber(record.total, 0) === JOURNEY &&
          effectiveBalance(record) === 0
        )
      ));
    case "consistencia-suspeita":
      return progress(c.maxSameEntry >= 5, c.maxSameEntry, 5);

    case "rh-viu-isso":
      return progress(c.lunchRecords.some(
        (record) => record.lunchMinutes < 60
      ));
    case "sem-pressa-nenhuma":
      return progress(c.lunchRecords.some(
        (record) => record.lunchMinutes > 90
      ));
    case "cronometro-gastronomico":
      return progress(c.lunchRecords.some(
        (record) => record.lunchMinutes === 60
      ));
    case "cardapio-consistente":
      return progress(achievementSlidingLunchConsistency(c.lunchRecords));
    case "foi-almocar-viajar":
      return progress(
        (c.state.repeatCounts[id] || 0) >= 1,
        c.state.repeatCounts[id] || 0,
        null,
        c.state.dynamicValues.longestLunch
          ? `Recorde atual: ${duration(c.state.dynamicValues.longestLunch)}`
          : ""
      );

    case "pegou-no-tranco":
      return progress(c.registeredStreak >= 5, c.registeredStreak, 5);
    case "no-automatico":
      return progress(c.registeredStreak >= 10, c.registeredStreak, 10);
    case "maquina-administrativa":
      return progress(c.workRecords.length >= 30, c.workRecords.length, 30);
    case "veterano-ponto":
      return progress(c.workRecords.length >= 100, c.workRecords.length, 100);
    case "historiador-oficial":
      return progress(
        c.differentWorkMonths.size >= 6,
        c.differentWorkMonths.size,
        6
      );
    case "anuario-completo":
      return progress(c.hasFullYear);
    case "segundou-mesmo":
      return progress(c.mondayValid >= 10, c.mondayValid, 10);
    case "sextou-direito":
      return progress(c.fridayValid >= 10, c.fridayValid, 10);

    case "fim-semana-nunca-ouvi":
      return progress(c.weekendWork.length >= 1, c.weekendWork.length, 1);
    case "domingou-trabalhando":
      return progress(c.sundayWork.length >= 1, c.sundayWork.length, 1);
    case "feriado-premium":
      return progress(c.holidayWork.length >= 1, c.holidayWork.length, 1);
    case "plantao-desbloqueado":
      return progress(c.weekendWork.length >= 3, c.weekendWork.length, 3);
    case "calendario-nao-manda":
      return progress(c.sameMonthWeekendHoliday);
    case "hora-dourada":
      return progress(
        c.specialPositiveMinutes >= 480,
        c.specialPositiveMinutes,
        480
      );

    case "tudo-documentado":
      return progress(c.history.some(
        (record) => recordKind(record) === "medical"
      ));
    case "calendario-atualizado":
      return progress(c.history.some(
        (record) => recordKind(record) === "holiday"
      ));
    case "acontece":
      return progress(c.history.some(
        (record) => recordKind(record) === "absence"
      ));
    case "falta-contexto":
      return progress(c.history.some(
        (record) => (
          recordKind(record) === "absence" &&
          record.absenceExcused === true
        )
      ));
    case "organizacao-acima-tudo":
      return progress(c.allRepresentedMonthsOrganized);
    case "arquivo-impecavel":
      return progress(c.completeCoveredMonths.length >= 1);

    case "curioso-demais":
      return progress(statsDates >= 1, statsDates, 1);
    case "rh-nao-pediu":
      return progress(statsPeriods >= 3, statsPeriods, 3);
    case "cientista-jornada":
      return progress(statsDates >= 10, statsDates, 10);
    case "agora-virou-competicao":
      return progress(usage.personalRecordBroken === true);
    case "deixa-eu-conferir":
      return progress(historyOpens >= 20, historyOpens, 20);
    case "personalidade-definida":
      return progress(c.user.paletteIndependent === true);
    case "colecionador-estilos":
      return progress(mascotsUsed >= 4, mascotsUsed, 4);
    case "contador-honorario":
      return progress(salarySettings(c.user).enabled);
    case "quanto-vale-sofrimento":
      return progress(usage.financialViewed === true);

    case "secret-2359":
      return progress(c.workRecords.some(
        (record) => record.realExit === "23:59"
      ));
    case "secret-numero-bonito":
      return progress(c.workRecords.some(
        (record) => [71, 142, 213].includes(effectiveBalance(record))
      ));
    case "secret-escolhido":
      return progress(c.workRecords.some(
        (record) => [427, 488, 549].includes(finiteNumber(record.total, 0))
      ));
    case "secret-equilibrio":
      return progress(c.balanceByMonthEqual);
    case "secret-segunda-2":
      return progress(c.mondayDominates);
    case "secret-olhadinha":
      return progress(maxStatsDay >= 5, maxStatsDay, 5);
    case "secret-planejado":
      return progress(c.workRecords.some((record) => {
        const values = [
          achievementMinutePart(record.entry),
          achievementMinutePart(record.lunchOut),
          achievementMinutePart(record.lunchBack),
          achievementMinutePart(record.realExit)
        ];

        return (
          values.every((value) => value !== null) &&
          new Set(values).size === 1
        );
      }));
    case "secret-sem-comentarios":
      return progress(c.positiveMinutes === 426);
    case "secret-viajante-tempo":
      return progress(c.timeTraveler);
    case "achievement-desbloqueado":
      return progress(unlockedWithoutFinal >= 10, unlockedWithoutFinal, 10);
    default:
      return progress(false);
  }
}

function achievementRecordSnapshot(context) {
  const work = context.workRecords;
  const entries = work
    .map((record) => toMinutes(record.entry))
    .filter((value) => value !== null);
  const exits = work
    .map((record) => toMinutes(record.realExit))
    .filter((value) => value !== null);
  const positives = work
    .map(effectiveBalance)
    .filter((value) => value > 0);

  return {
    longestDay: work.length
      ? Math.max(...work.map((record) => finiteNumber(record.total, 0)))
      : 0,
    largestPositive: positives.length ? Math.max(...positives) : 0,
    earliestEntry: entries.length ? Math.min(...entries) : null,
    latestExit: exits.length ? Math.max(...exits) : null,
    longestLunch: context.lunchLongest || 0
  };
}

function updateDynamicAchievements(context, initializing = false) {
  const state = context.state;
  const current = achievementRecordSnapshot(context);
  const previous = state.dynamicValues || {};
  let personalRecordBroken = false;
  let lunchRepeated = false;

  const compares = [
    ["longestDay", (now, old) => now > old],
    ["largestPositive", (now, old) => now > old],
    ["latestExit", (now, old) => now > old],
    [
      "earliestEntry",
      (now, old) => (
        now !== null &&
        old !== null &&
        now < old
      )
    ]
  ];

  if (!initializing) {
    compares.forEach(([key, beats]) => {
      const now = current[key];
      const old = previous[key];

      if (
        old !== undefined &&
        old !== null &&
        now !== null &&
        beats(now, old)
      ) {
        personalRecordBroken = true;
      }
    });
  }

  const previousLunch = finiteNumber(previous.longestLunch, 0);

  if (current.longestLunch > 0) {
    if (!state.repeatCounts["foi-almocar-viajar"]) {
      state.repeatCounts["foi-almocar-viajar"] = 1;
    }

    if (
      !initializing &&
      previousLunch > 0 &&
      current.longestLunch > previousLunch
    ) {
      state.repeatCounts["foi-almocar-viajar"] += 1;
      lunchRepeated = true;
      personalRecordBroken = true;
    }
  }

  if (personalRecordBroken) {
    state.usage.personalRecordBroken = true;
  }

  state.dynamicValues = {
    ...previous,
    ...current,
    longestLunch: Math.max(previousLunch, current.longestLunch)
  };

  return { lunchRepeated, personalRecordBroken };
}

function achievementUnlockedCount(state) {
  return Object.keys(state.unlocked || {}).length;
}

function saveCurrentAchievementState(user) {
  const allAccounts = accounts();
  allAccounts[currentUser] = user;
  saveAccounts(allAccounts);
}


function achievementAccentHex(category) {
  const colors = {
    jornada: "#4f7fe8",
    saldo: "#34a66f",
    horarios: "#8f68c8",
    almoco: "#d17c32",
    frequencia: "#3c9a91",
    especiais: "#c79518",
    ocorrencias: "#75808e",
    app: "#b07a2b",
    secretas: "#74528e"
  };

  return colors[category] || colors.jornada;
}

function ensureAchievementBannerStack() {
  let stack = document.querySelector(".achievement-banner-stack");

  if (stack) return stack;

  stack = document.createElement("div");
  stack.className = "achievement-banner-stack";
  stack.setAttribute("aria-live", "polite");
  stack.setAttribute("aria-atomic", "false");
  document.body.appendChild(stack);

  return stack;
}

function showAchievementBanner(
  achievement,
  {
    kicker = "Medalha desbloqueada",
    description = achievement.description,
    durationMs = 6200
  } = {}
) {
  const stack = ensureAchievementBannerStack();
  const iconName =
    ACHIEVEMENT_ICON_MAP[achievement.id] ||
    categoryDefaultBadgeIcon(achievement.category);
  const accent = achievementAccentHex(achievement.category);

  const banner = document.createElement("article");
  banner.className =
    `achievement-banner category-${achievement.category}`;
  banner.style.setProperty("--banner-accent", accent);
  banner.setAttribute("role", "status");

  banner.innerHTML = `
    <div class="achievement-banner-icon" aria-hidden="true">
      ${badgeIconSvg(iconName)}
    </div>

    <div class="achievement-banner-copy">
      <span>${kicker}</span>
      <strong>${achievement.name}</strong>
      <p>${description}</p>
    </div>

    <button
      class="achievement-banner-close"
      type="button"
      aria-label="Fechar notificação de conquista"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m7 7 10 10M17 7 7 17"/>
      </svg>
    </button>

    <i class="achievement-banner-timer" aria-hidden="true"></i>
  `;

  stack.appendChild(banner);

  const close = () => {
    if (banner.classList.contains("leaving")) return;

    banner.classList.add("leaving");
    setTimeout(() => banner.remove(), 360);
  };

  banner
    .querySelector(".achievement-banner-close")
    .addEventListener("click", close);

  requestAnimationFrame(() => {
    banner.classList.add("visible");
  });

  setTimeout(close, durationMs);
}

function showAchievementFireworks(achievement) {
  const old = document.querySelector(".achievement-celebration");
  old?.remove();

  const overlay = document.createElement("div");
  overlay.className = "achievement-celebration";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");

  const colors = [
    "#ffd75f",
    "#ff8a65",
    "#7fd5ff",
    "#d69cff",
    "#83e29b",
    "#ffffff"
  ];

  const bursts = Array.from({ length: 7 }, (_, burstIndex) => {
    const left = 12 + ((burstIndex * 13) % 76);
    const top = 12 + ((burstIndex * 19) % 54);
    const delay = (burstIndex % 4) * 0.22;

    const sparks = Array.from({ length: 14 }, (_, sparkIndex) => {
      const angle = sparkIndex * (360 / 14);
      const distance = 58 + ((sparkIndex * 11 + burstIndex * 7) % 54);
      const color = colors[(sparkIndex + burstIndex) % colors.length];

      return `
        <i style="
          --spark-angle:${angle}deg;
          --spark-distance:${distance}px;
          --spark-color:${color};
        "></i>
      `;
    }).join("");

    return `
      <span
        class="achievement-firework"
        style="
          --firework-left:${left}%;
          --firework-top:${top}%;
          --firework-delay:${delay}s;
        "
      >
        ${sparks}
      </span>
    `;
  }).join("");

  overlay.innerHTML = `
    <div class="achievement-fireworks-layer" aria-hidden="true">
      ${bursts}
    </div>

    <div class="achievement-unlock-card">
      <span class="achievement-unlock-kicker">Conquista desbloqueada</span>
      <div class="achievement-unlock-badge">
        ${achievementBadgeHtml(achievement, false)}
      </div>
      <h2>${achievement.name}</h2>
      <p>${achievement.description}</p>
      <button type="button">Boa, pode fechar isso</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => {
    overlay.classList.add("leaving");
    setTimeout(() => overlay.remove(), 350);
  };

  overlay
    .querySelector("button")
    .addEventListener("click", close);

  setTimeout(close, 5200);
}

function evaluateAchievements({
  silent = false,
  source = "app"
} = {}) {
  const allAccounts = accounts();
  const user = allAccounts[currentUser];

  if (!user) {
    return null;
  }

  const state = ensureAchievementState(user);
  const initializing = state.initialized !== true;
  const context = buildAchievementContext(user);
  const dynamicEvents = updateDynamicAchievements(
    context,
    initializing
  );

  const results = {};
  let metWithoutFinal = 0;

  ACHIEVEMENTS
    .filter((achievement) => achievement.id !== "achievement-desbloqueado")
    .forEach((achievement) => {
      const result = achievementResult(
        achievement.id,
        context,
        0
      );

      results[achievement.id] = result;

      if (result.met) {
        metWithoutFinal += 1;
      }
    });

  results["achievement-desbloqueado"] = achievementResult(
    "achievement-desbloqueado",
    context,
    metWithoutFinal
  );

  const newlyUnlocked = [];

  ACHIEVEMENTS.forEach((achievement) => {
    const result = results[achievement.id];

    if (result?.met && !state.unlocked[achievement.id]) {
      state.unlocked[achievement.id] = {
        at: new Date().toISOString(),
        source
      };

      newlyUnlocked.push(achievement);
    }
  });

  state.initialized = true;
  user.achievementState = state;
  allAccounts[currentUser] = user;
  saveAccounts(allAccounts);

  if (!silent && !initializing) {
    const curious = newlyUnlocked.find(
      (achievement) => achievement.id === "curioso-demais"
    );

    newlyUnlocked.forEach((achievement, index) => {
      setTimeout(() => {
        showAchievementBanner(achievement);
      }, index * 420);
    });

    if (curious) {
      showAchievementFireworks(curious);
    }

    if (dynamicEvents.lunchRepeated) {
      const lunchAchievement = ACHIEVEMENTS.find(
        (achievement) => achievement.id === "foi-almocar-viajar"
      );

      if (lunchAchievement) {
        setTimeout(() => {
          showAchievementBanner(lunchAchievement, {
            kicker: "Medalha reconquistada",
            description:
              `Novo recorde de almoço: ${duration(state.dynamicValues.longestLunch)}.`
          });
        }, newlyUnlocked.length * 420);
      }
    }
  }

  return {
    user,
    state,
    context,
    results,
    newlyUnlocked
  };
}

function initializeAchievementsSilently() {
  return evaluateAchievements({
    silent: true,
    source: "migração"
  });
}

function recordAchievementUsage(type, value = null) {
  const allAccounts = accounts();
  const user = allAccounts[currentUser];

  if (!user) return;

  const state = ensureAchievementState(user);
  const usage = state.usage;
  const date = today();

  if (type === "stats_open") {
    if (!usage.statsOpenDates.includes(date)) {
      usage.statsOpenDates.push(date);
    }

    usage.statsOpenByDate[date] =
      finiteNumber(usage.statsOpenByDate[date], 0) + 1;
  }

  if (type === "stats_period" && value) {
    if (!usage.statsPeriodsViewed.includes(value)) {
      usage.statsPeriodsViewed.push(value);
    }
  }

  if (type === "history_open") {
    usage.historyOpenCount += 1;
  }

  if (type === "mascot" && value) {
    if (!usage.mascotsUsed.includes(value)) {
      usage.mascotsUsed.push(value);
    }
  }

  if (type === "financial_view") {
    usage.financialViewed = true;
  }

  user.achievementState = state;
  allAccounts[currentUser] = user;
  saveAccounts(allAccounts);
}


const ACHIEVEMENT_ICON_MAP = {
  "relogio-suico":"clock",
  "na-medida":"target",
  "precisao-cirurgica":"crosshair",
  "tolerancia-estrategia":"shield-clock",
  "semana-redonda":"calendar-check",
  "mes-perfeito":"sparkle-check",
  "sem-sustos":"shield",
  "tudo-sob-controle":"clipboard-check",

  "primeiro-credito":"coin",
  "banco-abastecido":"bank",
  "banco-recheado":"vault",
  "patrimonio-minutos":"stack",
  "divida-paga":"arrow-up",
  "recuperacao-historica":"refresh",
  "distribuicao-perfeita":"balance",
  "guardou-usou":"wallet",

  "madrugador":"sunrise",
  "sol-nem-nasceu":"sun",
  "ultimo-apagar-luz":"moon",
  "horario-alternativo":"clock-late",
  "turno-estendido":"hourglass",
  "dia-infinito":"bolt",
  "speedrun-jornada":"rocket",
  "consistencia-suspeita":"repeat",

  "rh-viu-isso":"lunch-warning",
  "sem-pressa-nenhuma":"coffee",
  "cronometro-gastronomico":"plate-clock",
  "cardapio-consistente":"utensils",
  "foi-almocar-viajar":"plane",

  "pegou-no-tranco":"road",
  "no-automatico":"calendar-flow",
  "maquina-administrativa":"building",
  "veterano-ponto":"trophy",
  "historiador-oficial":"books",
  "anuario-completo":"year",
  "segundou-mesmo":"briefcase",
  "sextou-direito":"party",

  "fim-semana-nunca-ouvi":"weekend",
  "domingou-trabalhando":"sun-small",
  "feriado-premium":"confetti",
  "plantao-desbloqueado":"toolkit",
  "calendario-nao-manda":"calendar-star",
  "hora-dourada":"star-coin",

  "tudo-documentado":"medical",
  "calendario-atualizado":"calendar",
  "acontece":"x-circle",
  "falta-contexto":"stamp",
  "organizacao-acima-tudo":"folder-check",
  "arquivo-impecavel":"archive",

  "curioso-demais":"sparkles",
  "rh-nao-pediu":"chart",
  "cientista-jornada":"flask",
  "agora-virou-competicao":"medal",
  "deixa-eu-conferir":"eye",
  "personalidade-definida":"avatar",
  "colecionador-estilos":"palette",
  "contador-honorario":"calculator",
  "quanto-vale-sofrimento":"money",

  "secret-2359":"midnight",
  "secret-numero-bonito":"gem",
  "secret-escolhido":"star",
  "secret-equilibrio":"yin-yang",
  "secret-segunda-2":"moon-2",
  "secret-olhadinha":"peek",
  "secret-planejado":"grid",
  "secret-sem-comentarios":"ghost",
  "secret-viajante-tempo":"time-warp",
  "achievement-desbloqueado":"crown"
};

function categoryDefaultBadgeIcon(category) {
  const defaults = {
    jornada: "clock",
    saldo: "bank",
    horarios: "sunrise",
    almoco: "utensils",
    frequencia: "calendar-flow",
    especiais: "calendar-star",
    ocorrencias: "clipboard-check",
    app: "sparkles",
    secretas: "crown"
  };

  return defaults[category] || "medal";
}

function badgeIconSvg(name = "medal") {
  const icons = {
    "clock": `<circle cx="12" cy="12" r="6.2"/><path d="M12 8.6v3.8l2.6 1.6"/>`,
    "target": `<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="3.3"/><path d="M12 3.6v2.2M12 18.2v2.2M3.6 12h2.2M18.2 12h2.2"/>`,
    "crosshair": `<circle cx="12" cy="12" r="6.2"/><path d="M12 7.6v8.8M7.6 12h8.8"/><circle cx="12" cy="12" r="1.4"/>`,
    "shield-clock": `<path d="M12 4.2 17 6v4.1c0 3.3-2.1 5.7-5 7.2-2.9-1.5-5-3.9-5-7.2V6l5-1.8Z"/><path d="M12 8.7v2.4l1.7 1"/>`,
    "calendar-check": `<rect x="5" y="6" width="14" height="12" rx="2"/><path d="M8 4.5v3M16 4.5v3M5 9.5h14M9.3 13l1.8 1.8 3.6-3.8"/>`,
    "sparkle-check": `<path d="m12 4 1.1 3.7L17 8.8l-3.9 1.1L12 13.6l-1.1-3.7L7 8.8l3.9-1.1L12 4Z"/><path d="m8.8 16.1 1.3 1.3 2.7-2.8"/>`,
    "shield": `<path d="M12 4.2 17 6v4.1c0 3.3-2.1 5.7-5 7.2-2.9-1.5-5-3.9-5-7.2V6l5-1.8Z"/>`,
    "clipboard-check": `<rect x="7" y="5.4" width="10" height="12.6" rx="2"/><path d="M9.5 5.4h5M9.2 12.5l1.7 1.7 3.5-3.6"/>`,

    "coin": `<circle cx="12" cy="12" r="6.2"/><path d="M12 8.7v6.6M10.1 10.4c.2-.9.9-1.5 1.9-1.5 1.1 0 1.9.6 1.9 1.5 0 2-3.8 1-3.8 3 0 .9.8 1.5 1.9 1.5 1 0 1.7-.5 1.9-1.4"/>`,
    "bank": `<path d="M4.6 10 12 6l7.4 4"/><path d="M6.4 10v5.4M10.2 10v5.4M13.8 10v5.4M17.6 10v5.4M4.5 16.5h15"/>`,
    "vault": `<rect x="6" y="6.5" width="12" height="11" rx="2.2"/><circle cx="12.6" cy="12" r="2.2"/><path d="M12.6 9.8v4.4M10.4 12h4.4"/>`,
    "stack": `<path d="M6 9.2 12 6l6 3.2-6 3.2L6 9.2Z"/><path d="M6 12.6 12 15.8 18 12.6M6 16 12 19.2 18 16"/>`,
    "arrow-up": `<path d="M12 18V7.4"/><path d="m7.8 11.6 4.2-4.2 4.2 4.2"/><path d="M6 18h12"/>`,
    "refresh": `<path d="M18 8.5V5.8h-2.7"/><path d="M18 5.8A6.6 6.6 0 1 0 19 12"/><path d="M6 15.5v2.7h2.7"/><path d="M6 18.2A6.6 6.6 0 0 0 5 12"/>`,
    "balance": `<path d="M12 6v12M7 6h10M9 18h6"/><path d="m7.7 8.3-2.3 4.2h4.6l-2.3-4.2Zm8.6 0-2.3 4.2h4.6l-2.3-4.2Z"/>`,
    "wallet": `<rect x="5.5" y="7" width="13" height="10" rx="2"/><path d="M15 11h3.5v2.2H15a1.1 1.1 0 0 1 0-2.2Z"/>`,

    "sunrise": `<path d="M5 16h14"/><path d="M8 16a4 4 0 0 1 8 0"/><path d="M12 6.2v2.4M7.5 8.3l1.5 1.5M16.5 8.3 15 9.8"/>`,
    "sun": `<circle cx="12" cy="12" r="4.3"/><path d="M12 4.3v2.1M12 17.6v2.1M4.3 12h2.1M17.6 12h2.1M6.6 6.6l1.5 1.5M15.9 15.9l1.5 1.5M17.4 6.6l-1.5 1.5M8.1 15.9l-1.5 1.5"/>`,
    "moon": `<path d="M16.4 15.5A5.8 5.8 0 1 1 10 7.7a4.9 4.9 0 0 0 6.4 7.8Z"/>`,
    "clock-late": `<circle cx="12" cy="12" r="6.1"/><path d="M12 8.4v4.2l2.9 1.6"/><path d="M18.2 6.2 20 4.4"/>`,
    "hourglass": `<path d="M8 4.8h8M8 19.2h8"/><path d="M8.2 5.2c0 3.2 3.8 3.5 3.8 6.1 0 2.6-3.8 2.9-3.8 6.1M15.8 5.2c0 3.2-3.8 3.5-3.8 6.1 0 2.6 3.8 2.9 3.8 6.1"/>`,
    "bolt": `<path d="m13.2 4.8-5 7h3.1l-.4 7.4 5-7h-3.1l.4-7.4Z"/>`,
    "rocket": `<path d="M14.7 6.5c1.6 1.6 1.7 4.4.6 7l-4.2 4.2c-2.6 1.1-5.4 1-7-.6.8-1.8 2.1-4 4-5.9 2-2 4.2-3.2 6-4.1Z"/><path d="m8.2 15.8-2.1 2.1M14.1 9.9h.1"/>`,
    "repeat": `<path d="M8 8H18v3M16 5l3 3-3 3M16 16H6v-3M8 19l-3-3 3-3"/>`,

    "lunch-warning": `<path d="M7.2 6.4v5.8M9.4 6.4v5.8M8.3 12.2v5.4M14.2 6.4v6.1a2 2 0 0 0 2 2h.3v3"/><path d="M17.4 8.2h.1M17.4 11.8v.1"/>`,
    "coffee": `<path d="M8 10h6.2a2 2 0 0 1 0 4H8v2.6h7.2a3.8 3.8 0 0 0 0-7.6H8Zm2.2-2.8v1.7M12 6.6v2.3M9.8 7.6v1.3"/>`,
    "plate-clock": `<circle cx="10.5" cy="12.5" r="4.6"/><path d="M10.5 10.5v2.2l1.4.9"/><path d="M16.2 8.5v8.1M18 8.5v8.1"/>`,
    "utensils": `<path d="M7.4 5.6v6.2M9.2 5.6v6.2M8.3 11.8V18M14.7 5.6v5.8a1.9 1.9 0 0 0 1.9 1.9H17V18"/>`,
    "plane": `<path d="m4.8 13.2 13.8-5-1.1-1.1-5.7 1.5-2.7-2.7-1.5.5 1.6 3-3.1.8-1.3 2.1Zm9.8 2.7.8 1.8 1.2-.4-.6-2.2"/>`,

    "road": `<path d="M7 18 10 6M17 18 14 6"/><path d="M12 7.8v2.4M12 13.2v2.4"/>`,
    "calendar-flow": `<rect x="5" y="6" width="14" height="12" rx="2"/><path d="M8 4.5v3M16 4.5v3M5 9.5h14M9 13h5M9 16h3"/>`,
    "building": `<path d="M7 18V7.5L12 5l5 2.5V18"/><path d="M9.3 9.4h.1M12 9.4h.1M14.7 9.4h.1M9.3 12.3h.1M12 12.3h.1M14.7 12.3h.1M11 18v-3h2v3"/>`,
    "trophy": `<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v4M8.5 20h7"/>`,
    "books": `<path d="M6.2 6.5h4.8v10.8H6.2a1.2 1.2 0 0 1-1.2-1.2V7.7a1.2 1.2 0 0 1 1.2-1.2Zm6.8 0h4.8A1.2 1.2 0 0 1 19 7.7v8.4a1.2 1.2 0 0 1-1.2 1.2H13V6.5Z"/><path d="M11 8h2"/>`,
    "year": `<rect x="5" y="6" width="14" height="12" rx="2"/><path d="M8 4.5v3M16 4.5v3M5 9.5h14M8.5 13h2M13.5 13h2M8.5 16h2M13.5 16h2"/>`,
    "briefcase": `<rect x="5" y="8" width="14" height="9" rx="2"/><path d="M9 8V6.8A1.8 1.8 0 0 1 10.8 5h2.4A1.8 1.8 0 0 1 15 6.8V8M5 12h14"/>`,
    "party": `<path d="m7 18 10-10M11 7l6 6"/><path d="M6 6h.1M18 18h.1M16.8 5.8h.1M7.2 16.2h.1"/>`,

    "weekend": `<rect x="5" y="6" width="14" height="12" rx="2"/><path d="M8 4.5v3M16 4.5v3M5 9.5h14M9 14l1.5 1.6L14.5 12"/>`,
    "sun-small": `<circle cx="12" cy="12" r="3.9"/><path d="M12 5.6v1.6M12 16.8v1.6M5.6 12h1.6M16.8 12h1.6"/>`,
    "confetti": `<path d="m7 8 9 9M14.8 6.4l2.8 2.8M6.4 14.8l2.8 2.8"/><path d="M6.5 8.2h.1M17.2 16.5h.1M10.2 5.7h.1M18 10.3h.1M7.3 18.1h.1"/>`,
    "toolkit": `<rect x="5" y="8" width="14" height="9" rx="2"/><path d="M9.3 8V6.8A1.8 1.8 0 0 1 11.1 5h1.8a1.8 1.8 0 0 1 1.8 1.8V8M5 12h14"/>`,
    "calendar-star": `<rect x="5" y="6" width="14" height="12" rx="2"/><path d="M8 4.5v3M16 4.5v3M5 9.5h14"/><path d="m12 11.4.7 1.4 1.6.2-1.1 1.1.3 1.6-1.5-.8-1.5.8.3-1.6-1.1-1.1 1.6-.2.7-1.4Z"/>`,
    "star-coin": `<circle cx="12" cy="12" r="6.2"/><path d="m12 8.8.8 1.7 1.8.3-1.3 1.2.3 1.8-1.6-.9-1.6.9.3-1.8-1.3-1.2 1.8-.3.8-1.7Z"/>`,

    "medical": `<path d="M9 5.8h6v3h3v6h-3v3H9v-3H6v-6h3Z"/>`,
    "calendar": `<rect x="5" y="6" width="14" height="12" rx="2"/><path d="M8 4.5v3M16 4.5v3M5 9.5h14"/>`,
    "x-circle": `<circle cx="12" cy="12" r="6.4"/><path d="m9.5 9.5 5 5M14.5 9.5l-5 5"/>`,
    "stamp": `<rect x="8" y="5.8" width="8" height="5" rx="1.5"/><path d="M10 10.8v2.2a2 2 0 0 0 2 2 2 2 0 0 0 2-2v-2.2M7 18h10"/>`,
    "folder-check": `<path d="M4.8 8.2h4.5l1.4 1.7H19v6.8a1.3 1.3 0 0 1-1.3 1.3H6.1a1.3 1.3 0 0 1-1.3-1.3V9.5a1.3 1.3 0 0 1 1.3-1.3Z"/><path d="m9.4 13.4 1.5 1.5 3.2-3.3"/>`,
    "archive": `<rect x="5" y="6" width="14" height="4" rx="1.2"/><path d="M6.2 10v6.5A1.5 1.5 0 0 0 7.7 18h8.6a1.5 1.5 0 0 0 1.5-1.5V10M10 13h4"/>`,

    "sparkles": `<path d="m12 4 1 3.3 3.3 1-3.3 1-1 3.3-1-3.3-3.3-1 3.3-1L12 4Z"/><path d="m17.8 12.6.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6.6-1.8Zm-11.6.9.7 2.2 2.2.7-2.2.7-.7 2.2-.7-2.2-2.2-.7 2.2-.7.7-2.2Z"/>`,
    "chart": `<path d="M5.5 18V9.6M10.7 18V6.8M15.9 18v-4.9M19 18H4"/>`,
    "flask": `<path d="M10 5h4M11 5v4.1L7 16.3A2 2 0 0 0 8.7 19h6.6A2 2 0 0 0 17 16.3l-4-7.2V5"/><path d="M9.5 14.2h5"/>`,
    "medal": `<path d="M8 4h3l1 4H9L8 4Zm5 0h3l-1 4h-3l1-4Z"/><circle cx="12" cy="15" r="4.5"/><path d="m12 12.5.8 1.6 1.7.3-1.3 1.2.3 1.8-1.5-.8-1.5.8.3-1.8-1.3-1.2 1.7-.3.8-1.6Z"/>`,
    "eye": `<path d="M3.8 12s3.2-4.8 8.2-4.8 8.2 4.8 8.2 4.8-3.2 4.8-8.2 4.8S3.8 12 3.8 12Z"/><circle cx="12" cy="12" r="2.1"/>`,
    "avatar": `<circle cx="12" cy="9.2" r="3.2"/><path d="M6.6 18a5.4 5.4 0 0 1 10.8 0"/>`,
    "palette": `<path d="M12 5.2c-4 0-7.2 2.7-7.2 6.2 0 2.7 2.1 5.1 4.9 5.1h1.4a1.2 1.2 0 0 0 1-1.9 1.4 1.4 0 0 1 1.2-2.1h1.6c2.6 0 4.4-1.5 4.4-3.8 0-2.1-2-3.6-4.7-3.6H12Z"/><path d="M8.1 11h.1M9.7 8.8h.1M12.4 8h.1M15 9.2h.1"/>`,
    "calculator": `<rect x="7" y="5.5" width="10" height="13" rx="2"/><path d="M9.5 8.2h5M9.5 11.6h1.6M12.2 11.6h1.6M9.5 14.6h1.6M12.2 14.6h1.6"/>`,
    "money": `<rect x="5.2" y="7.2" width="13.6" height="9.6" rx="1.8"/><circle cx="12" cy="12" r="2.1"/><path d="M7.6 9.2h.1M16.4 14.8h.1"/>`,

    "midnight": `<path d="M12 5.6v6.5l3.2 1.8"/><path d="M8 4h8M9 18h6"/><path d="M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"/>`,
    "gem": `<path d="M8 7h8l2 3-6 7-6-7 2-3Z"/><path d="m8 7 4 10 4-10"/>`,
    "star": `<path d="m12 4.7 1.8 3.8 4.2.6-3 2.9.7 4.1-3.7-2-3.7 2 .7-4.1-3-2.9 4.2-.6L12 4.7Z"/>`,
    "yin-yang": `<circle cx="12" cy="12" r="6.4"/><path d="M12 5.6a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 1 1 0 6.4"/><circle cx="12" cy="8.8" r=".8"/><circle cx="12" cy="15.2" r=".8"/>`,
    "moon-2": `<path d="M14.8 5.8a5.6 5.6 0 1 0 0 12.4 6.6 6.6 0 1 1 0-12.4Z"/>`,
    "peek": `<path d="M4 12s3-4.2 8-4.2S20 12 20 12s-3 4.2-8 4.2S4 12 4 12Z"/><path d="M9.8 12h4.4"/><circle cx="12" cy="12" r="1.8"/>`,
    "grid": `<rect x="6" y="6" width="4" height="4" rx=".8"/><rect x="14" y="6" width="4" height="4" rx=".8"/><rect x="6" y="14" width="4" height="4" rx=".8"/><rect x="14" y="14" width="4" height="4" rx=".8"/>`,
    "ghost": `<path d="M8 18v-6.2a4 4 0 1 1 8 0V18l-2-1.5-2 1.5-2-1.5L8 18Z"/><path d="M10.5 11.6h.1M13.5 11.6h.1"/>`,
    "time-warp": `<circle cx="12" cy="12" r="6.2"/><path d="M12 8.2v3.8l2.6 1.6"/><path d="m15.6 5.8 2.8-.4-.4 2.8M18 5.4a8.2 8.2 0 0 1-1.1 11.5"/>`,
    "crown": `<path d="m5 16 1.3-8 4.2 3.4L12 6l1.5 5.4L17.7 8 19 16H5Z"/><path d="M7 18h10"/>`
  };

  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      ${icons[name] || icons.medal}
    </svg>
  `;
}

function achievementProgressLabel(result, achievement) {
  if (
    result.current === null ||
    result.current === undefined ||
    result.target === null ||
    result.target === undefined
  ) {
    return "";
  }

  const minuteTargets = new Set([
    "primeiro-credito",
    "banco-abastecido",
    "banco-recheado",
    "patrimonio-minutos",
    "hora-dourada"
  ]);

  if (minuteTargets.has(achievement.id)) {
    return `${duration(Math.min(result.current, result.target))} de ${duration(result.target)}`;
  }

  return `${Math.min(result.current, result.target)} de ${result.target}`;
}

function achievementBadgeHtml(achievement, lockedSecret = false) {
  const category =
    ACHIEVEMENT_CATEGORIES[achievement.category] ||
    ACHIEVEMENT_CATEGORIES.app;

  const iconName = lockedSecret
    ? "crown"
    : ACHIEVEMENT_ICON_MAP[achievement.id] ||
      categoryDefaultBadgeIcon(achievement.category);

  const code = lockedSecret
    ? "???"
    : achievement.code || category.glyph;

  return `
    <span
      class="achievement-badge-icon category-${achievement.category}"
      data-badge-id="${achievement.id}"
      title="${lockedSecret ? "Conquista secreta" : achievement.name}"
      aria-hidden="true"
    >
      <span class="achievement-badge-layer badge-top">
        ${badgeIconSvg(iconName)}
      </span>

      <span class="achievement-badge-layer badge-bottom">
        <i>${category.glyph}</i>
        <b>${code}</b>
      </span>
    </span>
  `;
}

function achievementCardHtml(achievement, result, state) {
  const unlocked = Boolean(state.unlocked[achievement.id]);
  const hiddenSecret = achievement.secret && !unlocked;
  const progressText = achievementProgressLabel(
    result,
    achievement
  );

  const progressPercent =
    result.target && result.current !== null
      ? Math.min(
          100,
          Math.max(0, (result.current / result.target) * 100)
        )
      : 0;

  const repeatCount = state.repeatCounts[achievement.id] || 0;
  const dynamicText = achievement.dynamic && unlocked
    ? repeatCount > 1
      ? `Conquistada ${repeatCount} vezes`
      : "Primeiro recorde registrado"
    : "";

  const unlockedAt = state.unlocked[achievement.id]?.at;
  const unlockedDate = unlockedAt
    ? new Intl.DateTimeFormat("pt-BR").format(new Date(unlockedAt))
    : "";

  return `
    <article
      class="achievement-card
        category-${achievement.category}
        ${unlocked ? "unlocked" : "locked"}
        ${achievement.negative ? "negative-achievement" : ""}
        ${achievement.secret ? "secret-achievement" : ""}"
      data-achievement-id="${achievement.id}"
    >
      <div class="achievement-card-top">
        ${achievementBadgeHtml(achievement, hiddenSecret)}

        <span class="achievement-state-label">
          ${
            unlocked
              ? achievement.negative
                ? "Infelizmente conquistada"
                : achievement.dynamic && repeatCount > 1
                  ? "Reconquistada"
                  : "Conquistada"
              : achievement.secret
                ? "Secreta"
                : "Bloqueada"
          }
        </span>
      </div>

      <div class="achievement-card-copy">
        <h3>${hiddenSecret ? "Conquista secreta" : achievement.name}</h3>
        <p>
          ${
            hiddenSecret
              ? "Continue usando o aplicativo para descobrir esta medalha."
              : achievement.description
          }
        </p>
      </div>

      ${
        !unlocked && progressText && !hiddenSecret
          ? `
            <div class="achievement-card-progress">
              <span>${progressText}</span>
              <div><i style="width:${progressPercent}%"></i></div>
            </div>
          `
          : ""
      }

      ${
        unlocked
          ? `
            <footer class="achievement-card-footer">
              <span>
                ${
                  dynamicText ||
                  result.detail ||
                  `Desbloqueada em ${unlockedDate}`
                }
              </span>
              <strong>✓</strong>
            </footer>
          `
          : ""
      }
    </article>
  `;
}

function filteredAchievements(state, results) {
  return ACHIEVEMENTS.filter((achievement) => {
    const unlocked = Boolean(state.unlocked[achievement.id]);

    if (
      achievementCategoryFilter !== "all" &&
      achievement.category !== achievementCategoryFilter
    ) {
      return false;
    }

    if (achievementFilter === "unlocked" && !unlocked) {
      return false;
    }

    if (achievementFilter === "locked" && unlocked) {
      return false;
    }

    if (achievementFilter === "secret" && !achievement.secret) {
      return false;
    }

    return true;
  });
}

function renderAchievements() {
  const evaluation = evaluateAchievements({ silent: true });

  if (!evaluation) return;

  const { state, results } = evaluation;
  const unlocked = achievementUnlockedCount(state);
  const total = ACHIEVEMENTS.length;
  const percent = total ? (unlocked / total) * 100 : 0;

  el.achievementNavCount.textContent = String(unlocked);
  el.achievementUnlockedCount.textContent = String(unlocked);
  el.achievementTotalCount.textContent = String(total);
  el.achievementProgressBar.style.width = `${percent}%`;
  document
    .querySelector(".achievement-progress-ring")
    ?.style.setProperty("--achievement-angle", `${percent * 3.6}deg`);

  el.achievementProgressTitle.textContent =
    unlocked === total
      ? "Você desbloqueou tudo. Isso é preocupante."
      : unlocked
        ? `${unlocked} ${unlocked === 1 ? "medalha conquistada" : "medalhas conquistadas"}`
        : "Nenhuma desbloqueada ainda";

  el.achievementProgressText.textContent =
    unlocked === total
      ? "Não há mais nada que o aplicativo possa esconder de você."
      : `Faltam ${total - unlocked} para completar este álbum desnecessário.`;

  el.achievementFilters
    .querySelectorAll(".achievement-filter")
    .forEach((button) => {
      const active =
        button.dataset.achievementFilter === achievementFilter;

      button.classList.toggle("active", active);
      button.setAttribute(
        "aria-pressed",
        active ? "true" : "false"
      );
    });

  el.achievementCategoryFilter.value =
    achievementCategoryFilter;

  const visible = filteredAchievements(state, results);
  const categories = Object.keys(ACHIEVEMENT_CATEGORIES)
    .filter((categoryId) =>
      visible.some(
        (achievement) => achievement.category === categoryId
      )
    );

  if (!visible.length) {
    el.achievementGrid.innerHTML = `
      <div class="achievements-filter-empty">
        <strong>Nenhuma medalha por aqui.</strong>
        <span>O filtro foi exigente demais.</span>
      </div>
    `;
    return;
  }

  el.achievementGrid.innerHTML = categories
    .map((categoryId) => {
      const category = ACHIEVEMENT_CATEGORIES[categoryId];
      const items = visible.filter(
        (achievement) => achievement.category === categoryId
      );
      const categoryUnlocked = items.filter(
        (achievement) => state.unlocked[achievement.id]
      ).length;

      return `
        <section class="achievement-category-section category-${categoryId}">
          <header>
            <div>
              <span>${category.glyph}</span>
              <h3>${category.label}</h3>
            </div>
            <small>${categoryUnlocked} de ${items.length}</small>
          </header>

          <div class="achievement-card-grid">
            ${items.map((achievement) =>
              achievementCardHtml(
                achievement,
                results[achievement.id],
                state
              )
            ).join("")}
          </div>
        </section>
      `;
    })
    .join("");
}

function setStatsSubview(view) {
  statsSubview = view === "achievements"
    ? "achievements"
    : "dashboard";

  const achievementsOpen = statsSubview === "achievements";

  el.statsDashboardView.classList.toggle(
    "hidden",
    achievementsOpen
  );
  el.achievementsView.classList.toggle(
    "hidden",
    !achievementsOpen
  );

  el.statsViewTabs
    .querySelectorAll(".stats-view-button")
    .forEach((button) => {
      const active = button.dataset.statsView === statsSubview;

      button.classList.toggle("active", active);
      button.setAttribute(
        "aria-pressed",
        active ? "true" : "false"
      );
    });

  if (achievementsOpen) {
    renderAchievements();
  }
}


function decimalPtBr(value, maximumDigits = 1) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maximumDigits
  }).format(value);
}

function statsPeriodText(period = statsPeriod) {
  if (period === "year") return "Este ano";
  if (period === "all") return "Desde o primeiro registro";
  return "Este mês";
}

function workRecordsForStats(history, period = statsPeriod) {
  const current = today();
  const currentMonth = current.slice(0, 7);
  const currentYear = current.slice(0, 4);

  return history
    .filter((record) => {
      if (
        recordKind(record) !== "work" ||
        !record.date ||
        finiteNumber(record.total, 0) <= 0
      ) {
        return false;
      }

      if (period === "month") {
        return record.date.slice(0, 7) === currentMonth;
      }

      if (period === "year") {
        return record.date.slice(0, 4) === currentYear;
      }

      return true;
    })
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
}

function statDateLabel(record) {
  return record?.date ? dateBR(record.date) : "—";
}

function maxRecord(records, getter) {
  return records.reduce((best, item) => {
    if (!best) return item;
    return getter(item) > getter(best) ? item : best;
  }, null);
}

function minRecord(records, getter) {
  return records.reduce((best, item) => {
    if (!best) return item;
    return getter(item) < getter(best) ? item : best;
  }, null);
}

function average(values) {
  const valid = values.filter(
    (value) => Number.isFinite(value)
  );

  if (!valid.length) return 0;

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function statsRecordCard(label, value, detail, tone = "") {
  return `
    <article class="stats-record-card ${tone}">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${detail}</small>
    </article>
  `;
}

function statsHabitCard(label, value, detail = "") {
  return `
    <article class="stats-habit-card">
      <span>${label}</span>
      <strong>${value}</strong>
      ${detail ? `<small>${detail}</small>` : ""}
    </article>
  `;
}

function weekdayStats(records) {
  const totals = new Map();

  records.forEach((record) => {
    const date = parseISO(record.date);

    if (!date) return;

    const day = date.getDay();
    totals.set(
      day,
      (totals.get(day) || 0) + finiteNumber(record.total, 0)
    );
  });

  let bestDay = null;
  let bestTotal = -1;

  totals.forEach((total, day) => {
    if (total > bestTotal) {
      bestDay = day;
      bestTotal = total;
    }
  });

  const names = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado"
  ];

  return {
    name: bestDay === null ? "—" : names[bestDay],
    total: Math.max(0, bestTotal)
  };
}

function longestValidRecordStreak(records) {
  let current = 0;
  let longest = 0;

  records
    .filter((record) => !record.specialWorkType)
    .forEach((record) => {
      if (effectiveBalance(record) >= -TOLERANCE) {
        current += 1;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    });

  return longest;
}

function uselessComparisonCards(totalMinutes) {
  const comparisons = [
    {
      icon: "⚽",
      minutes: 90,
      title: "partidas de futebol",
      detail: "Sem acréscimos e sem VAR."
    },
    {
      icon: "📺",
      minutes: 45,
      title: "episódios de série",
      detail: "Daqueles que terminam em cliffhanger."
    },
    {
      icon: "🎬",
      minutes: 120,
      title: "filmes de duas horas",
      detail: "Com direito a escolher outro por 40 minutos."
    },
    {
      icon: "⏰",
      minutes: 9,
      title: "sonecas de 9 minutos",
      detail: "O botão mais apertado da humanidade."
    },
    {
      icon: "☕",
      minutes: 10,
      title: "cafezinhos de 10 minutos",
      detail: "Puramente para fins científicos."
    },
    {
      icon: "🎵",
      minutes: 3.5,
      title: "músicas de 3min30",
      detail: "Uma playlist levemente preocupante."
    }
  ];

  const seed = Math.max(
    0,
    Math.round(totalMinutes) % comparisons.length
  );

  const selected = Array.from(
    { length: 4 },
    (_, index) => comparisons[(seed + index) % comparisons.length]
  );

  return selected.map((item) => {
    const amount = Math.floor(totalMinutes / item.minutes);

    return `
      <article class="stats-comparison-card">
        <span class="stats-comparison-icon" aria-hidden="true">${item.icon}</span>
        <div>
          <strong>${new Intl.NumberFormat("pt-BR").format(amount)}</strong>
          <span>${item.title}</span>
          <small>${item.detail}</small>
        </div>
      </article>
    `;
  }).join("");
}

function renderStats() {
  const user = accounts()[currentUser];
  const history = Array.isArray(user?.history) ? user.history : [];
  const records = workRecordsForStats(history);

  el.statsPeriodTabs
    .querySelectorAll(".stats-period-button")
    .forEach((button) => {
      const active = button.dataset.period === statsPeriod;
      button.classList.toggle("active", active);
      button.setAttribute(
        "aria-pressed",
        active ? "true" : "false"
      );
    });

  el.statsPeriodLabel.textContent = statsPeriodText();

  const hasRecords = records.length > 0;
  el.statsEmpty.classList.toggle("hidden", hasRecords);
  el.statsContent.classList.toggle("hidden", !hasRecords);

  if (!hasRecords) return;

  const totalMinutes = records.reduce(
    (sum, record) => sum + finiteNumber(record.total, 0),
    0
  );

  const averageWorked = totalMinutes / records.length;
  const equivalentDays = totalMinutes / JOURNEY;
  const equivalentWeeks = totalMinutes / (JOURNEY * 5);

  el.statsTotalWorked.textContent = duration(totalMinutes);
  el.statsEquivalentDays.textContent = decimalPtBr(
    equivalentDays,
    1
  );
  el.statsEquivalentWeeks.textContent = decimalPtBr(
    equivalentWeeks,
    1
  );
  el.statsWorkedDays.textContent = String(records.length);
  el.statsAveragePerDay.textContent =
    `Média de ${duration(Math.round(averageWorked))} por dia`;

  const positiveRecords = records.filter(
    (record) => effectiveBalance(record) > 0
  );
  const negativeRecords = records.filter(
    (record) => effectiveBalance(record) < 0
  );

  const longestDay = maxRecord(
    records,
    (record) => finiteNumber(record.total, 0)
  );

  const biggestPositive = positiveRecords.length
    ? maxRecord(positiveRecords, effectiveBalance)
    : null;

  const biggestNegative = negativeRecords.length
    ? minRecord(negativeRecords, effectiveBalance)
    : null;

  const timedRecords = records.filter((record) => (
    toMinutes(record.entry) !== null &&
    toMinutes(record.realExit) !== null
  ));

  const earliestEntry = timedRecords.length
    ? minRecord(timedRecords, (record) => toMinutes(record.entry))
    : null;

  const latestEntry = timedRecords.length
    ? maxRecord(timedRecords, (record) => toMinutes(record.entry))
    : null;

  const latestExit = timedRecords.length
    ? maxRecord(timedRecords, (record) => toMinutes(record.realExit))
    : null;

  const lunchRecords = timedRecords
    .filter((record) => (
      record.noLunch !== true &&
      toMinutes(record.lunchOut) !== null &&
      toMinutes(record.lunchBack) !== null
    ))
    .map((record) => ({
      ...record,
      lunchDuration:
        toMinutes(record.lunchBack) -
        toMinutes(record.lunchOut)
    }))
    .filter((record) => record.lunchDuration >= 0);

  const longestLunch = lunchRecords.length
    ? maxRecord(lunchRecords, (record) => record.lunchDuration)
    : null;

  const shortestLunch = lunchRecords.length
    ? minRecord(lunchRecords, (record) => record.lunchDuration)
    : null;

  el.statsRecords.innerHTML = [
    statsRecordCard(
      "Dia mais longo",
      duration(longestDay.total),
      statDateLabel(longestDay),
      "highlight"
    ),
    statsRecordCard(
      "Maior hora positiva",
      biggestPositive
        ? duration(effectiveBalance(biggestPositive), true)
        : "Nenhuma",
      biggestPositive
        ? statDateLabel(biggestPositive)
        : "O banco segue comportado.",
      "positive"
    ),
    statsRecordCard(
      "Maior hora negativa",
      biggestNegative
        ? duration(effectiveBalance(biggestNegative), true)
        : "Nenhuma",
      biggestNegative
        ? statDateLabel(biggestNegative)
        : "Uma rara história de sucesso.",
      "negative"
    ),
    statsRecordCard(
      "Entrada mais cedo",
      earliestEntry?.entry || "—",
      earliestEntry
        ? statDateLabel(earliestEntry)
        : "Sem horário suficiente."
    ),
    statsRecordCard(
      "Entrada mais tarde",
      latestEntry?.entry || "—",
      latestEntry
        ? statDateLabel(latestEntry)
        : "Sem horário suficiente."
    ),
    statsRecordCard(
      "Saída mais tarde",
      latestExit?.realExit || "—",
      latestExit
        ? statDateLabel(latestExit)
        : "Sem horário suficiente."
    ),
    statsRecordCard(
      "Almoço mais longo",
      longestLunch
        ? duration(longestLunch.lunchDuration)
        : "—",
      longestLunch
        ? statDateLabel(longestLunch)
        : "Sem horário suficiente."
    ),
    statsRecordCard(
      "Almoço mais rápido",
      shortestLunch
        ? duration(shortestLunch.lunchDuration)
        : "—",
      shortestLunch
        ? statDateLabel(shortestLunch)
        : "Sem horário suficiente."
    )
  ].join("");

  const averageEntry = average(
    timedRecords.map((record) => toMinutes(record.entry))
  );
  const averageExit = average(
    timedRecords.map((record) => toMinutes(record.realExit))
  );
  const averageLunch = average(
    lunchRecords.map((record) => record.lunchDuration)
  );

  const bestWeekday = weekdayStats(records);
  const regularRecords = records.filter(
    (record) => !record.specialWorkType
  );
  const positivePercent = records.length
    ? (positiveRecords.length / records.length) * 100
    : 0;
  const validRegularDays = regularRecords.filter(
    (record) => effectiveBalance(record) >= -TOLERANCE
  ).length;
  const validPercent = regularRecords.length
    ? (validRegularDays / regularRecords.length) * 100
    : 0;
  const longestStreak = longestValidRecordStreak(records);

  el.statsHabits.innerHTML = [
    statsHabitCard(
      "Horário médio de entrada",
      timedRecords.length ? clock(Math.round(averageEntry)) : "—",
      "Seu relógio biológico em números."
    ),
    statsHabitCard(
      "Horário médio de saída",
      timedRecords.length ? clock(Math.round(averageExit)) : "—",
      "Até que enfim."
    ),
    statsHabitCard(
      "Duração média do almoço",
      lunchRecords.length
        ? duration(Math.round(averageLunch))
        : "—",
      "Inclui o tempo pensando no que pedir."
    ),
    statsHabitCard(
      "Média trabalhada por dia",
      duration(Math.round(averageWorked)),
      `${records.length} dias analisados`
    ),
    statsHabitCard(
      "Dia da semana mais trabalhado",
      bestWeekday.name,
      bestWeekday.total
        ? `${duration(bestWeekday.total)} acumuladas`
        : ""
    ),
    statsHabitCard(
      "Dias com saldo positivo",
      `${decimalPtBr(positivePercent, 0)}%`,
      `${positiveRecords.length} de ${records.length} registros`
    ),
    statsHabitCard(
      "Dentro da jornada ou tolerância",
      regularRecords.length
        ? `${decimalPtBr(validPercent, 0)}%`
        : "—",
      regularRecords.length
        ? `${validRegularDays} de ${regularRecords.length} dias normais`
        : "Sem dias normais no período"
    ),
    statsHabitCard(
      "Maior sequência de registros válidos",
      `${longestStreak} ${longestStreak === 1 ? "dia" : "dias"}`,
      "Considera a ordem dos registros trabalhados."
    )
  ].join("");

  el.statsComparisons.innerHTML =
    uselessComparisonCards(totalMinutes);
}

function showTab(which) {
  const todayIsOpen = which === "today";
  const recordIsOpen = which === "record";
  const historyIsOpen = which === "history";
  const statsIsOpen = which === "stats";
  const achievementsIsOpen = which === "achievements";
  const accountIsOpen = which === "account";
  const specialPageIsOpen = statsIsOpen || achievementsIsOpen;

  if (!specialPageIsOpen) {
    lastAppPage = which;
  }

  el.todayPanel.classList.toggle("hidden", !todayIsOpen);
  el.recordPanel.classList.toggle("hidden", !recordIsOpen);
  el.historyPanel.classList.toggle("hidden", !historyIsOpen);
  el.statsPanel.classList.toggle("hidden", !statsIsOpen);
  el.achievementsPanel.classList.toggle("hidden", !achievementsIsOpen);
  el.accountPanel.classList.toggle("hidden", !accountIsOpen);
  el.mainNavigation.classList.toggle("hidden", specialPageIsOpen);

  el.tabToday.classList.toggle("active", todayIsOpen);
  el.tabRecord.classList.toggle("active", recordIsOpen);
  el.tabHistory.classList.toggle("active", historyIsOpen);
  el.tabAccount.classList.toggle("active", accountIsOpen);
  el.statsButton.classList.toggle("active", statsIsOpen);
  el.achievementsButton.classList.toggle("active", achievementsIsOpen);

  el.tabToday.setAttribute("aria-current", todayIsOpen ? "page" : "false");
  el.tabRecord.setAttribute("aria-current", recordIsOpen ? "page" : "false");
  el.tabHistory.setAttribute("aria-current", historyIsOpen ? "page" : "false");
  el.tabAccount.setAttribute("aria-pressed", accountIsOpen ? "true" : "false");
  el.statsButton.setAttribute("aria-pressed", statsIsOpen ? "true" : "false");
  el.achievementsButton.setAttribute("aria-pressed", achievementsIsOpen ? "true" : "false");

  el.statsButton.setAttribute(
    "aria-label",
    statsIsOpen ? "Voltar da tela Dados inúteis" : "Abrir Dados inúteis"
  );
  el.statsButton.title = statsIsOpen ? "Voltar" : "Dados inúteis";

  el.achievementsButton.setAttribute(
    "aria-label",
    achievementsIsOpen ? "Voltar da tela Medalhas" : "Abrir Medalhas"
  );
  el.achievementsButton.title = achievementsIsOpen ? "Voltar" : "Medalhas";

  el.statsDashboardView.classList.remove("hidden");
  el.achievementsView.classList.remove("hidden");

  if (recordIsOpen) calculateRecord();
  if (historyIsOpen) renderHistory();
  if (statsIsOpen) renderStats();
  if (achievementsIsOpen) renderAchievements();
  if (accountIsOpen) updateAccountInterface();
}
function openCalendar() {
  const selected = parseISO(el.date.value) || new Date();

  calendarCursor = new Date(
    selected.getFullYear(),
    selected.getMonth(),
    1
  );

  renderCalendar();
  el.calendarDialog.showModal();
}

function renderCalendar() {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();

  el.calendarTitle.textContent = new Intl.DateTimeFormat(
    "pt-BR",
    { month: "long", year: "numeric" }
  ).format(calendarCursor);

  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const selected = el.date.value;
  const todayIso = today();

  let html = "";

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    const iso = localIsoDate(date);
    const outside = date.getMonth() !== month;
    const future = iso > todayIso;

    html += `
      <button
        class="calendar-day
          ${outside ? "outside" : ""}
          ${iso === todayIso ? "today" : ""}
          ${iso === selected ? "selected" : ""}
          ${future ? "disabled" : ""}"
        data-date="${iso}"
        type="button"
        aria-label="${dateBR(iso)}"
        ${future ? "disabled" : ""}
      >
        ${date.getDate()}
      </button>
    `;
  }

  el.calendarGrid.innerHTML = html;

  el.calendarGrid
    .querySelectorAll(".calendar-day:not(:disabled)")
    .forEach((button) => {
      button.addEventListener("click", () => {
        setSelectedDate(button.dataset.date);
        el.calendarDialog.close();
      });
    });
}

el.googleLogin.addEventListener("click", signInWithGoogle);
el.logout.onclick = logout;

el.updatesButton.addEventListener("click", openUpdatesDialog);
el.closeUpdates.addEventListener("click", closeUpdatesDialog);
el.updatesDialog.addEventListener("click", (event) => {
  if (event.target === el.updatesDialog) closeUpdatesDialog();
});

el.rankingButton?.addEventListener("click", openRankingDialog);
el.rankingDockOpen?.addEventListener("click", openRankingDialog);
el.closeRanking?.addEventListener("click", closeRankingDialog);
el.rankingDockParticipation?.addEventListener("click", toggleMedalRankingParticipation);
el.rankingDialogParticipation?.addEventListener("click", toggleMedalRankingParticipation);
el.accountRankingParticipation?.addEventListener("click", toggleMedalRankingParticipation);
el.openCupPreview?.addEventListener("click", openCupPreview);
el.closeCupResultTop?.addEventListener("click", () => closeCupPreview());
el.closeCupResult?.addEventListener("click", () => closeCupPreview());
el.cupBackToRanking?.addEventListener("click", () => closeCupPreview({ reopenRanking: true }));
el.cupResultDialog?.addEventListener("click", (event) => {
  if (event.target === el.cupResultDialog) closeCupPreview();
});

el.profileRankAnchor?.addEventListener("click", (event) => {
  event.stopPropagation();
  setProfileRankPopover(!el.profileRankAnchor.classList.contains("is-open"));
});
el.profileRankAnchor?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    setProfileRankPopover(!el.profileRankAnchor.classList.contains("is-open"));
  }
  if (event.key === "Escape") setProfileRankPopover(false);
});
document.addEventListener("click", (event) => {
  if (!el.profileRankAnchor?.contains(event.target)) setProfileRankPopover(false);
});

el.rankingDialog?.addEventListener("click", (event) => {
  if (event.target === el.rankingDialog) closeRankingDialog();
});

el.noteForm.addEventListener("submit", saveNote);
el.noteText.addEventListener("input", updateNoteCounter);
el.cancelNote.addEventListener("click", closeNoteDialog);
el.deleteNote.addEventListener("click", deleteCurrentNote);
el.noteDialog.addEventListener("click", (event) => {
  if (event.target === el.noteDialog) closeNoteDialog();
});

el.negativeExcuseForm.addEventListener("submit", saveNegativeExcuse);
el.negativeExcuseHours.addEventListener("input", updateNegativeExcusePreview);
el.negativeExcuseMinutes.addEventListener("input", updateNegativeExcusePreview);
el.negativeExcuseFull.addEventListener("click", () => {
  setNegativeExcuseInputs(negativeExcuseMaximum);
});
el.removeNegativeExcuse.addEventListener("click", removeNegativeExcuse);
el.cancelNegativeExcuse.addEventListener("click", closeNegativeExcuseDialog);
el.negativeExcuseDialog.addEventListener("click", (event) => {
  if (event.target === el.negativeExcuseDialog) closeNegativeExcuseDialog();
});

document.querySelectorAll(".openPrivacyNotice").forEach((button) => {
  button.addEventListener("click", () => el.privacyDialog.showModal());
});

document.querySelectorAll(".closePrivacyNotice").forEach((button) => {
  button.addEventListener("click", () => el.privacyDialog.close());
});

document.querySelectorAll(".openTermsNotice").forEach((button) => {
  button.addEventListener("click", () => el.termsDialog.showModal());
});

document.querySelectorAll(".closeTermsNotice").forEach((button) => {
  button.addEventListener("click", () => el.termsDialog.close());
});

[el.privacyDialog, el.termsDialog].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});

el.tabToday.onclick = () => showTab("today");
el.tabRecord.onclick = () => showTab("record");
el.tabHistory.onclick = () => {
  showTab("history");
  recordAchievementUsage("history_open");

  const user = accounts()[currentUser];
  if (validSalarySettings(salarySettings(user))) {
    recordAchievementUsage("financial_view");
  }

  evaluateAchievements({ source: "histórico" });
  renderAchievements();
};
el.tabAccount.onclick = () => showTab("account");
el.statsButton.onclick = () => {
  const isActive = el.statsButton.classList.contains("active");

  if (isActive) {
    showTab(lastAppPage);
    return;
  }

  showTab("stats");
  recordAchievementUsage("stats_open");
  recordAchievementUsage("stats_period", statsPeriod);
  evaluateAchievements({ source: "Dados inúteis" });
  renderAchievements();
};

el.achievementsButton.onclick = () => {
  const isActive = el.achievementsButton.classList.contains("active");

  if (isActive) {
    showTab(lastAppPage);
    return;
  }

  showTab("achievements");
  evaluateAchievements({ source: "Medalhas" });
  renderAchievements();
};

el.statsBackHome.onclick = () => {
  showTab("today");
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};

el.statsScrollTop.onclick = () => {
  el.statsPageTop.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
};

el.achievementsBackHome.onclick = () => {
  showTab("today");
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};

el.achievementsScrollTop.onclick = () => {
  el.achievementsPageTop.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
};

el.statsPeriodTabs
  .querySelectorAll(".stats-period-button")
  .forEach((button) => {
    button.addEventListener("click", () => {
      statsPeriod = button.dataset.period;
      recordAchievementUsage("stats_period", statsPeriod);
      evaluateAchievements({ source: "período das estatísticas" });
      renderStats();
      renderAchievements();
    });
  });

el.statsViewTabs
  .querySelectorAll(".stats-view-button")
  .forEach((button) => {
    button.addEventListener("click", () => {
      setStatsSubview(button.dataset.statsView);
    });
  });

el.achievementFilters
  .querySelectorAll(".achievement-filter")
  .forEach((button) => {
    button.addEventListener("click", () => {
      achievementFilter = button.dataset.achievementFilter;
      renderAchievements();
    });
  });

el.achievementCategoryFilter.addEventListener("change", () => {
  achievementCategoryFilter = el.achievementCategoryFilter.value;
  renderAchievements();
});

el.paletteIndependent.addEventListener("change", toggleIndependentPalette);

el.salaryEstimateEnabled.addEventListener("change", saveSalarySettings);
el.salaryEstimateNegative.addEventListener("change", saveSalarySettings);

[
  el.salaryBase,
  el.salaryDivisor,
  el.salaryWeekdayPremium,
  el.salarySpecialPremium
].forEach((input) => {
  input.addEventListener("input", updateSalaryPreview);
  input.addEventListener("change", saveSalarySettings);
});

el.salaryBase.addEventListener("blur", () => {
  const value = parseBrazilianNumber(el.salaryBase.value);

  el.salaryBase.value = value
    ? formatBrazilianNumber(value)
    : "";

  saveSalarySettings();
});

el.parseTodayText.onclick = extractToday;
el.clearToday.onclick = clearToday;
el.todayUseRealExit.addEventListener("change", calculateToday);

[
  el.todayEntry,
  el.todayLunchOut,
  el.todayLunchBack,
  el.todayRealExit
].forEach((input) => {
  input.addEventListener("input", calculateToday);
  input.addEventListener("change", calculateToday);
});

el.parseRecordText.onclick = extractRecord;
el.recordModeWithLunch.addEventListener("change", () => applyRecordMode());
el.recordModeNoLunch.addEventListener("change", () => applyRecordMode({ clearLunch: true }));
el.clearRecord.onclick = clearRecord;
el.saveDay.onclick = saveDay;
el.exportBackup.onclick = exportBackup;
el.openDeleteAccount.onclick = openDeleteAccountDialog;
el.cancelDeleteAccount.onclick = closeDeleteAccountDialog;
el.deleteAccountForm.addEventListener("submit", deleteCurrentAccount);

el.deleteAccountDialog.addEventListener("click", (event) => {
  if (event.target === el.deleteAccountDialog) {
    closeDeleteAccountDialog();
  }
});

[
  el.recordEntry,
  el.recordLunchOut,
  el.recordLunchBack,
  el.recordRealExit
].forEach((input) => {
  input.addEventListener("input", calculateRecord);
  input.addEventListener("change", calculateRecord);
});

document
  .querySelectorAll(".theme-toggle")
  .forEach((button) => {
    button.addEventListener("click", toggleTheme);
  });

document
  .querySelectorAll(".importBackup")
  .forEach((button) => {
    button.addEventListener("click", () => {
      el.backupInput.click();
    });
  });

el.backupInput.addEventListener("change", () => {
  if (el.backupInput.files[0]) {
    importBackupFile(el.backupInput.files[0]);
  }

  el.backupInput.value = "";
});


el.datePickerButton.onclick = openCalendar;

el.calendarPrev.onclick = () => {
  calendarCursor.setMonth(calendarCursor.getMonth() - 1);
  renderCalendar();
};

el.calendarNext.onclick = () => {
  calendarCursor.setMonth(calendarCursor.getMonth() + 1);
  renderCalendar();
};

el.calendarToday.onclick = () => {
  setSelectedDate(today());
  el.calendarDialog.close();
};

el.calendarCancel.onclick = () => {
  el.calendarDialog.close();
};

el.calendarDialog.addEventListener("click", (event) => {
  if (event.target === el.calendarDialog) {
    el.calendarDialog.close();
  }
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  el.installAuth.classList.remove("hidden");
  el.installApp.classList.remove("hidden");
});

async function install() {
  if (!installPrompt) return;

  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;

  el.installAuth.classList.add("hidden");
  el.installApp.classList.add("hidden");
}

el.installAuth.onclick = install;
el.installApp.onclick = install;

if ("serviceWorker" in navigator) {
  let refreshingForUpdate = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshingForUpdate) return;
    refreshingForUpdate = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch(console.warn);
  });
}

resetRecordMode();
initializeMathBurst();

applyTheme(document.documentElement.dataset.theme || "light");
applyPalette(DEFAULT_PALETTE);
el.authView.classList.remove("hidden");
el.appView.classList.add("hidden");
initializeCloudAuth();

window.addEventListener("online", () => {
  if (currentUser && cloudSavePending) {
    persistCurrentUserNow();
  } else if (currentUser) {
    setSyncState("synced");
  }

  if (currentUser) {
    loadMedalRanking({ quiet: medalRankingRows.length > 0 });
  }
});

window.addEventListener("offline", () => {
  if (currentUser) setSyncState("offline");
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && currentUser && cloudSavePending) {
    persistCurrentUserNow();
  }
});
