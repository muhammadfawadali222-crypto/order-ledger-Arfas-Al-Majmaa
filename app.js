import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, onSnapshot,
  deleteDoc, enableIndexedDbPersistence,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getStorage, ref, uploadString, getDownloadURL, deleteObject,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

// ---------------- Firebase setup ----------------
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const auth = getAuth(fbApp);
const storage = getStorage(fbApp);
try { enableIndexedDbPersistence(db); } catch (e) { /* multiple tabs open, fine to skip */ }

// ---------------- Constants ----------------
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MAX_BILL_BYTES = 4.5 * 1024 * 1024;

const SEED_PRODUCTS = [
  { id: "PRD-0000586", name: "Sunsilk Hair Shampoo (400ml)", uom: "Dozen", price: 144 },
  { id: "PRD-0000177", name: "Lux Bathing Liquid Soap (250ml)", uom: "Carton", price: 195 },
  { id: "PRD-0013459", name: "Big Body Scrub Leefah", uom: "Piece", price: 9 },
  { id: "PRD-0000574", name: "Nunu Body Powder (200mg) 1x12Pcs", uom: "Dozen", price: 80 },
  { id: "PRD-0014137", name: "Colgate Toothbrush - Soft", uom: "Dozen", price: 72 },
  { id: "PRD-0000563", name: "Colgate Toothpaste (120gm)", uom: "Dozen", price: 52 },
  { id: "PRD-0000619", name: "Hair Brush", uom: "Piece", price: 7 },
  { id: "PRD-0005457", name: "Sunsilk Hair Cream 1x12x275ml", uom: "Dozen", price: 285 },
  { id: "PRD-0014361", name: "Veet Hair Remover Sensitive (100gm)", uom: "Dozen", price: 110 },
  { id: "PRD-0000581", name: "Nunu Baby Cologne (200ml)", uom: "Dozen", price: 251 },
  { id: "PRD-0000576", name: "Vaseline Petroleum Jelly (250ml)", uom: "Dozen", price: 183 },
  { id: "PRD-0013793", name: "FINE Adult Diaper, Size S (18x4)", uom: "Carton", price: 76 },
  { id: "PRD-0000516", name: "FINE Adult Diaper, Size L (20x4)", uom: "Carton", price: 85 },
  { id: "PRD-0000488", name: "FINE Adult Diaper, Size M (24x4)", uom: "Carton", price: 86 },
  { id: "PRD-0000501", name: "FINE Adult Diaper, Size XL (20x4)", uom: "Carton", price: 107 },
  { id: "PRD-0000490b", name: "Medical Bed UnderPads 90cm (15x8=120)", uom: "Carton", price: 75 },
  { id: "PRD-0000490", name: "Lifree Adult Diaper Small 6x25Pcs", uom: "Carton", price: 90 },
  { id: "PRD-0016488", name: "Lotus Adult Diaper Medium 2x50=100", uom: "Carton", price: 85, packSize: 100 },
  { id: "PRD-0016489", name: "Lotus Adult Diaper Large 2x50=100", uom: "Carton", price: 98, packSize: 100 },
  { id: "PRD-0016490", name: "Lotus Adult Diaper X-Large 2x50=100", uom: "Carton", price: 112, packSize: 100 },
  { id: "PRD-0000517", name: "Bed Underpads 90x60cm 1x3x50pcs", uom: "Carton", price: 84 },
  { id: "PRD-0014213", name: "Rexona Deodorant Spray (150ml)", uom: "Dozen", price: 130 },
  { id: "PRD-0000205", name: "Disposable Aprons HDPE (700Pcs)", uom: "Carton", price: 60 },
  { id: "PRD-0012314", name: "Face Mask 1x40x50 (CTN 2000Pcs)", uom: "Carton", price: 150 },
  { id: "PRD-0000300", name: "Disposable Sanitary Towels (160x80cm)", uom: "Carton", price: 250 },
  { id: "PRD-0012226", name: "Vinyl Hand Gloves, Size L - CTN/700", uom: "Carton", price: 76 },
  { id: "PRD-0012227", name: "Vinyl Hand Gloves, Size M - CTN/700", uom: "Carton", price: 76 },
  { id: "PRD-0000206", name: "Disposable Head Cover (100Pcs)", uom: "Carton", price: 75 },
  { id: "PRD-0012325", name: "Fam Sanitary Pads 6 Pack (3x10Pcs)", uom: "Carton", price: 120 },
  { id: "PRD-0002277", name: "Nail Clipper", uom: "Piece", price: 5 },
  { id: "PRD-0014158", name: "Shaving Razor Blade - Lord", uom: "Piece", price: 2.5 },
  { id: "PRD-0014269", name: "Panasonic Beard/Hair Trimmer ER2031K", uom: "Piece", price: 260 },
  { id: "PRD-0012317", name: "Fine Facial Tissue Prime (1x36x86x2Ply)", uom: "Carton", price: 76 },
  { id: "PRD-0000572", name: "Vaseline Body Lotion (200ml)", uom: "Dozen", price: 156 },
  { id: "PRD-0016843", name: "Disposable Catheter Tip Syringe 60ml (1x25Pcs)", uom: "Carton", price: 37.5 },
  { id: "PRD-0016844", name: "Baby Food Dispensing Spoon Feeder", uom: "Piece", price: 50 },
  { id: "PRD-0016847", name: "Sunst Cafe Powder Blue Perfume", uom: "Piece", price: 65 },
  { id: "PRD-0016848", name: "Capriccio Perfume", uom: "Piece", price: 65 },
  { id: "PRD-0016913", name: "Nivea Men Shaving Foam 200ml (1x12Pcs)", uom: "Carton", price: 250 },
  { id: "PRD-0016914", name: "Cetaphil Gentle Cleansing Bar 127gm (1x12Pcs)", uom: "Dozen", price: 260 },
  { id: "PRD-0016915", name: "Estremo White Petroleum Gel 1000gm (1x12Pcs)", uom: "Dozen", price: 340 },
  { id: "PRD-0000012", name: "Trash Bag - Black (55 Gallon)", uom: "Bag", price: 67 },
];

// ---------------- Helpers ----------------
function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return "0";
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}
function defaultPackSize(uom) { return String(uom).toLowerCase() === "dozen" ? 12 : 1; }
function withPackSize(p) { return { ...p, packSize: p.packSize && p.packSize > 0 ? p.packSize : defaultPackSize(p.uom) }; }
function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}
function shiftMonthKey(key, delta) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------- App state ----------------
const state = {
  products: [],
  orders: {},
  bills: [],
  branding: { logo: null, bgColor: null },
  tab: "order",
  activeMonth: currentMonthKey(),
  historyMonth: null,
  billsMonth: currentMonthKey(),
  convertRow: null,
  ready: false,
};

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.display = "none"; }, 2200);
}

// ---------------- PIN gate ----------------
const CONFIG_DOC = () => doc(db, "config", "app");

async function initPinGate() {
  const gate = document.getElementById("pin-gate");
  const app = document.getElementById("app");
  gate.style.display = "flex";
  app.style.display = "none";

  const snap = await getDoc(CONFIG_DOC());
  const hasPin = snap.exists() && snap.data().pinHash;

  const title = document.getElementById("pin-title");
  const sub = document.getElementById("pin-sub");
  const input = document.getElementById("pin-input");
  const confirmInput = document.getElementById("pin-confirm");
  const error = document.getElementById("pin-error");
  const button = document.getElementById("pin-submit");

  if (!hasPin) {
    title.textContent = "PIN set karein";
    sub.textContent = "Ye PIN har device par app kholne ke liye chahiye hoga.";
    confirmInput.style.display = "block";
  } else {
    title.textContent = "PIN daalein";
    sub.textContent = "Afras Order Ledger";
    confirmInput.style.display = "none";
  }

  button.onclick = async () => {
    const pin = input.value.trim();
    if (pin.length < 4) {
      error.textContent = "Kam se kam 4 digit ka PIN daalein";
      return;
    }
    if (!hasPin) {
      if (pin !== confirmInput.value.trim()) {
        error.textContent = "Dono PIN match nahi karte";
        return;
      }
      const pinHash = await sha256Hex(pin);
      await setDoc(CONFIG_DOC(), { pinHash }, { merge: true });
      unlockApp();
    } else {
      const enteredHash = await sha256Hex(pin);
      if (enteredHash === snap.data().pinHash) {
        sessionStorage.setItem("ol-unlocked", "1");
        unlockApp();
      } else {
        error.textContent = "Galat PIN, dobara koshish karein";
      }
    }
  };
}

function unlockApp() {
  document.getElementById("pin-gate").style.display = "none";
  document.getElementById("app").style.display = "block";
  startLiveSync();
}

// ---------------- Firestore live sync ----------------
function startLiveSync() {
  onSnapshot(collection(db, "products"), (snap) => {
    if (snap.empty && state.products.length === 0) {
      seedProducts();
      return;
    }
    state.products = snap.docs.map((d) => withPackSize({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name));
    state.ready = true;
    render();
  });

  onSnapshot(collection(db, "orders"), (snap) => {
    const next = {};
    snap.docs.forEach((d) => { next[d.id] = d.data(); });
    state.orders = next;
    render();
  });

  onSnapshot(collection(db, "bills"), (snap) => {
    state.bills = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    render();
  });

  onSnapshot(CONFIG_DOC(), (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      state.branding = { logo: data.logo || null, bgColor: data.bgColor || null };
      render();
    }
  });

  window.addEventListener("online", updateSyncStatus);
  window.addEventListener("offline", updateSyncStatus);
  updateSyncStatus();
}

async function seedProducts() {
  for (const p of SEED_PRODUCTS) {
    await setDoc(doc(db, "products", p.id), withPackSize(p));
  }
}

function updateSyncStatus() {
  const dot = document.getElementById("sync-dot");
  const label = document.getElementById("sync-label");
  if (!dot) return;
  if (navigator.onLine) {
    dot.className = "sync-dot online";
    label.textContent = "Synced — sab devices par live";
  } else {
    dot.className = "sync-dot offline";
    label.textContent = "Offline — internet aane par sync hoga";
  }
}

// ---------------- Mutations ----------------
async function setQty(productId, value) {
  const n = value === "" ? "" : Math.max(0, Number(value));
  const monthKey = state.activeMonth;
  const existing = state.orders[monthKey]?.qty || {};
  const qty = { ...existing, [productId]: n };
  await setDoc(doc(db, "orders", monthKey), { qty, savedAt: Date.now() }, { merge: true });
}

async function saveProduct(draft) {
  const clean = {
    name: draft.name,
    uom: draft.uom,
    price: Number(draft.price),
    packSize: draft.packSize && Number(draft.packSize) > 0 ? Number(draft.packSize) : defaultPackSize(draft.uom),
  };
  await setDoc(doc(db, "products", draft.id), clean);
  showToast("Product save ho gaya");
}
async function deleteProductById(id) {
  await deleteDoc(doc(db, "products", id));
  showToast("Product hata diya");
}
async function clearMonth(monthKey) {
  await deleteDoc(doc(db, "orders", monthKey));
  showToast(`${monthLabel(monthKey)} ka order clear ho gaya`);
}

async function uploadBills(fileList, monthKey) {
  const files = Array.from(fileList || []);
  let saved = 0, tooLarge = false;
  for (const file of files) {
    if (file.type !== "application/pdf") continue;
    if (file.size > MAX_BILL_BYTES) { tooLarge = true; continue; }
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      const storagePath = `bills/${monthKey}/${id}.pdf`;
      const sRef = ref(storage, storagePath);
      await uploadString(sRef, dataUrl, "data_url");
      await setDoc(doc(db, "bills", id), {
        name: file.name, size: file.size, monthKey, storagePath, savedAt: Date.now(),
      });
      saved++;
    } catch (e) {
      tooLarge = true;
    }
  }
  if (saved > 0) showToast(`${saved} bill${saved === 1 ? "" : "s"} upload ho gayi`);
  if (tooLarge) showToast("Kuch files save nahi hui - size ya connection check karein");
}

async function deleteBill(bill) {
  try {
    await deleteObject(ref(storage, bill.storagePath));
  } catch (e) { /* file may already be gone */ }
  await deleteDoc(doc(db, "bills", bill.id));
}

async function downloadBill(bill) {
  try {
    const url = await getDownloadURL(ref(storage, bill.storagePath));
    const a = document.createElement("a");
    a.href = url;
    a.download = bill.name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (e) {
    showToast("File nahi mili");
  }
}

async function saveBranding(next) {
  await setDoc(CONFIG_DOC(), next, { merge: true });
}

// ---------------- Render ----------------
function render() {
  if (!state.ready) return;
  renderHeader();
  renderTabs();
  const main = document.getElementById("main");
  if (state.tab === "order") main.innerHTML = renderOrderTab();
  else if (state.tab === "history") main.innerHTML = renderHistoryTab();
  else if (state.tab === "bills") main.innerHTML = renderBillsTab();
  else if (state.tab === "catalogue") main.innerHTML = renderCatalogueTab();
  attachTabEvents();

  const appEl = document.getElementById("app");
  appEl.style.background = state.branding.bgColor
    ? `linear-gradient(160deg, ${state.branding.bgColor}22 0%, ${state.branding.bgColor}33 50%, ${state.branding.bgColor}22 100%)`
    : "";
}

function renderHeader() {
  const logoWrap = document.getElementById("logo-wrap");
  logoWrap.innerHTML = state.branding.logo
    ? `<img src="${state.branding.logo}" class="brand-logo-img" alt="Logo">`
    : `<div class="brand-mark">AT</div>`;
  document.getElementById("catalogue-count").textContent = `${state.products.length} items`;
}

function renderTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === state.tab);
  });
}

// ---- Order tab ----
function renderOrderTab() {
  const qty = state.orders[state.activeMonth]?.qty || {};
  let grandTotal = 0, lineCount = 0;
  const rows = state.products.map((p) => {
    const q = qty[p.id];
    const qNum = Number(q) || 0;
    const lineTotal = qNum * Number(p.price || 0);
    if (qNum > 0) { grandTotal += lineTotal; lineCount++; }
    const isConverting = state.convertRow === p.id;
    return `
      <tr class="${qNum > 0 ? "row-active" : ""}">
        <td><div class="item-name">${escapeHtml(p.name)}</div><div class="item-id">${escapeHtml(p.id)}</div></td>
        <td>${escapeHtml(p.uom)}</td>
        <td style="text-align:right">${fmt(p.price)}</td>
        <td style="text-align:center">
          <input type="number" min="0" class="qty-input" data-qty="${p.id}" value="${q === undefined ? "" : q}" placeholder="0">
        </td>
        <td style="text-align:right;font-weight:${qNum > 0 ? 600 : 400}">${lineTotal > 0 ? fmt(lineTotal) : "—"}</td>
        <td style="text-align:center"><button class="convert-btn" data-convert="${p.id}">⇄</button></td>
      </tr>
      ${isConverting ? `
      <tr class="convert-row">
        <td colspan="6">
          <span style="font-size:12.5px;color:#8A5B00;font-weight:600;margin-right:8px;">Pieces chahiye:</span>
          <input type="number" min="0" class="convert-input" id="convert-pieces" placeholder="e.g. 100">
          <span style="margin-right:8px;">=</span>
          <span class="convert-result" id="convert-result">—</span>
          <span class="convert-pack-info">(1 ${escapeHtml(p.uom)} = ${p.packSize} pieces)</span>
          <button class="convert-use-btn" data-use="${p.id}" data-pack="${p.packSize}">Qty mein daal dein</button>
        </td>
      </tr>` : ""}
    `;
  }).join("");

  return `
    <div class="month-bar">
      <button class="month-arrow" data-shift="-1">‹</button>
      <div class="month-label">${monthLabel(state.activeMonth)}</div>
      <button class="month-arrow" data-shift="1">›</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Item</th><th>UOM</th><th style="text-align:right">Price</th><th style="text-align:center">Qty</th><th style="text-align:right">Total</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="summary-bar">
      <div class="summary-lines">${lineCount} line${lineCount === 1 ? "" : "s"}</div>
      <div class="summary-right"><span class="summary-label">Grand Total</span><span class="summary-value">${fmt(grandTotal)}</span></div>
    </div>
  `;
}

// ---- History tab ----
function totalForMonth(key) {
  const qty = state.orders[key]?.qty || {};
  return state.products.reduce((sum, p) => sum + (Number(qty[p.id]) || 0) * Number(p.price || 0), 0);
}

function renderHistoryTab() {
  const monthKeys = Object.keys(state.orders).sort().reverse();
  if (monthKeys.length === 0) {
    return `<div class="empty"><div class="empty-title">Abhi koi order save nahi hua</div><div class="empty-body">"New Order" tab mein quantity daaliye — yahan automatically save ho jayega.</div></div>`;
  }
  const openKey = state.historyMonth && monthKeys.includes(state.historyMonth) ? state.historyMonth : monthKeys[0];
  const openQty = state.orders[openKey]?.qty || {};
  const lines = state.products.map((p) => ({ ...p, qty: Number(openQty[p.id]) || 0 })).filter((l) => l.qty > 0);

  const listHtml = monthKeys.map((k) => `
    <button class="history-item ${k === openKey ? "active" : ""}" data-history="${k}">
      <span>${monthLabel(k)}</span><span>${fmt(totalForMonth(k))}</span>
    </button>
  `).join("");

  const linesHtml = lines.length === 0
    ? `<div class="empty-body">Is mahine koi quantity nahi bhari gayi.</div>`
    : `<table>
        <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Total</th></tr></thead>
        <tbody>${lines.map((l) => `<tr><td>${escapeHtml(l.name)}</td><td style="text-align:center">${l.qty}</td><td style="text-align:right">${fmt(l.qty * l.price)}</td></tr>`).join("")}</tbody>
      </table>`;

  return `
    <div class="history-grid">
      <div class="history-list">${listHtml}</div>
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <h2 style="font-family:Georgia,serif;font-size:19px;margin:0;color:var(--indigo);">${monthLabel(openKey)}</h2>
          <div style="display:flex;gap:14px;">
            <button class="btn-link" data-open-month="${openKey}">Edit</button>
            <button class="btn-link danger" data-clear-month="${openKey}">Clear</button>
          </div>
        </div>
        ${linesHtml}
        <div class="summary-bar" style="margin-top:16px;">
          <div></div>
          <div class="summary-right"><span class="summary-label">Grand Total</span><span class="summary-value">${fmt(totalForMonth(openKey))}</span></div>
        </div>
      </div>
    </div>
  `;
}

// ---- Bills tab ----
function renderBillsTab() {
  const monthBills = state.bills.filter((b) => b.monthKey === state.billsMonth);
  const listHtml = monthBills.length === 0
    ? `<div class="empty"><div class="empty-title">${monthLabel(state.billsMonth)} ke liye koi bill nahi</div><div class="empty-body">Upar se PDF upload karein.</div></div>`
    : `<div class="bills-list">${monthBills.map((b) => `
        <div class="bill-row">
          <div class="bill-icon">PDF</div>
          <div style="flex:1;min-width:0;">
            <div class="bill-name">${escapeHtml(b.name)}</div>
            <div class="bill-meta">${(b.size / 1024 / 1024).toFixed(2)} MB</div>
          </div>
          <button class="btn-link" data-download-bill="${b.id}">Download</button>
          <button class="btn-link danger" data-delete-bill="${b.id}">Delete</button>
        </div>
      `).join("")}</div>`;

  return `
    <div class="month-bar">
      <button class="month-arrow" data-bills-shift="-1">‹</button>
      <div class="month-label">${monthLabel(state.billsMonth)}</div>
      <button class="month-arrow" data-bills-shift="1">›</button>
    </div>
    <label class="drop-zone" id="drop-zone">
      <input type="file" accept="application/pdf" multiple style="display:none" id="bill-file-input">
      <div class="drop-zone-icon">⬆</div>
      <div class="drop-zone-text">PDF bills yahan drop karein ya click karke choose karein</div>
      <div class="drop-zone-hint">Ek ya kai files ek saath — har file max 4.5MB</div>
    </label>
    ${listHtml}
  `;
}

// ---- Catalogue tab ----
let catalogueQuery = "";
function renderCatalogueTab() {
  const filtered = state.products.filter((p) =>
    p.name.toLowerCase().includes(catalogueQuery.toLowerCase()) || p.id.toLowerCase().includes(catalogueQuery.toLowerCase())
  );
  const rows = filtered.map((p) => `
    <tr>
      <td><div class="item-name">${escapeHtml(p.name)}</div><div class="item-id">${escapeHtml(p.id)}</div></td>
      <td>${escapeHtml(p.uom)}</td>
      <td style="text-align:right">${fmt(p.price)}</td>
      <td style="text-align:right"><button class="btn-link" data-edit-product="${p.id}">Edit</button></td>
    </tr>
  `).join("");

  return `
    <div class="catalogue-bar">
      <input type="text" class="search-input" id="catalogue-search" placeholder="Item search karein…" value="${escapeHtml(catalogueQuery)}">
      <button class="btn-primary" id="add-product-btn">+ Add item</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Item</th><th>UOM</th><th style="text-align:right">Price</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// ---------------- Event wiring ----------------
function attachTabEvents() {
  // Order tab
  document.querySelectorAll("[data-shift]").forEach((btn) => {
    btn.onclick = () => { state.activeMonth = shiftMonthKey(state.activeMonth, Number(btn.dataset.shift)); render(); };
  });
  document.querySelectorAll("[data-qty]").forEach((input) => {
    input.onchange = (e) => setQty(input.dataset.qty, e.target.value);
  });
  document.querySelectorAll("[data-convert]").forEach((btn) => {
    btn.onclick = () => { state.convertRow = state.convertRow === btn.dataset.convert ? null : btn.dataset.convert; render(); };
  });
  const pieces = document.getElementById("convert-pieces");
  if (pieces) {
    const useBtn = document.querySelector("[data-use]");
    const pack = Number(useBtn?.dataset.pack || 1);
    const uomLabel = (document.querySelector(".convert-pack-info")?.textContent.match(/1 (\S+) =/) || [, ""])[1];
    pieces.oninput = () => {
      const val = Number(pieces.value);
      const resultEl = document.getElementById("convert-result");
      resultEl.textContent = pieces.value !== "" && !isNaN(val) ? `${fmt(val / pack)} ${uomLabel}` : "—";
    };
  }
  document.querySelectorAll("[data-use]").forEach((btn) => {
    btn.onclick = async () => {
      const pack = Number(btn.dataset.pack);
      const val = Number(document.getElementById("convert-pieces").value);
      if (!isNaN(val)) {
        await setQty(btn.dataset.use, Math.round((val / pack) * 100) / 100);
      }
      state.convertRow = null;
      render();
    };
  });

  // History tab
  document.querySelectorAll("[data-history]").forEach((btn) => {
    btn.onclick = () => { state.historyMonth = btn.dataset.history; render(); };
  });
  document.querySelectorAll("[data-open-month]").forEach((btn) => {
    btn.onclick = () => { state.activeMonth = btn.dataset.openMonth; state.tab = "order"; render(); };
  });
  document.querySelectorAll("[data-clear-month]").forEach((btn) => {
    btn.onclick = () => { if (confirm("Is mahine ka order clear karein?")) clearMonth(btn.dataset.clearMonth); };
  });

  // Bills tab
  const dropZone = document.getElementById("drop-zone");
  if (dropZone) {
    const fileInput = document.getElementById("bill-file-input");
    fileInput.onchange = (e) => { uploadBills(e.target.files, state.billsMonth); e.target.value = ""; };
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add("active"); };
    dropZone.ondragleave = () => dropZone.classList.remove("active");
    dropZone.ondrop = (e) => {
      e.preventDefault();
      dropZone.classList.remove("active");
      uploadBills(e.dataTransfer.files, state.billsMonth);
    };
  }
  document.querySelectorAll("[data-bills-shift]").forEach((btn) => {
    btn.onclick = () => { state.billsMonth = shiftMonthKey(state.billsMonth, Number(btn.dataset.billsShift)); render(); };
  });
  document.querySelectorAll("[data-download-bill]").forEach((btn) => {
    btn.onclick = () => { const bill = state.bills.find((b) => b.id === btn.dataset.downloadBill); if (bill) downloadBill(bill); };
  });
  document.querySelectorAll("[data-delete-bill]").forEach((btn) => {
    btn.onclick = () => {
      const bill = state.bills.find((b) => b.id === btn.dataset.deleteBill);
      if (bill && confirm(`"${bill.name}" delete karein?`)) deleteBill(bill);
    };
  });

  // Catalogue tab
  const search = document.getElementById("catalogue-search");
  if (search) {
    search.oninput = (e) => { catalogueQuery = e.target.value; render(); document.getElementById("catalogue-search").focus(); document.getElementById("catalogue-search").setSelectionRange(catalogueQuery.length, catalogueQuery.length); };
  }
  const addBtn = document.getElementById("add-product-btn");
  if (addBtn) addBtn.onclick = () => openProductModal(null);
  document.querySelectorAll("[data-edit-product]").forEach((btn) => {
    btn.onclick = () => openProductModal(state.products.find((p) => p.id === btn.dataset.editProduct));
  });
}

// Top-level tab switching + settings button
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.onclick = () => { state.tab = btn.dataset.tab; render(); };
});
document.getElementById("settings-btn").onclick = () => openSettingsModal();

// ---------------- Product modal ----------------
function openProductModal(product) {
  const overlay = document.getElementById("modal-root");
  const isNew = !product;
  const draft = product ? { ...product } : { id: "", name: "", uom: "Piece", price: "", packSize: "" };
  overlay.innerHTML = `
    <div class="modal-overlay" id="product-overlay">
      <div class="modal">
        <h3>${isNew ? "Naya item" : "Item edit karein"}</h3>
        <label class="field-label">Item Number</label>
        <input class="field-input" id="pf-id" value="${escapeHtml(draft.id)}" ${isNew ? "" : "disabled"} placeholder="PRD-0000000">
        <label class="field-label">Item Name</label>
        <input class="field-input" id="pf-name" value="${escapeHtml(draft.name)}" placeholder="Item ka naam">
        <div class="two-col">
          <div><label class="field-label">UOM</label><input class="field-input" id="pf-uom" value="${escapeHtml(draft.uom)}" placeholder="Piece / Dozen / Carton"></div>
          <div><label class="field-label">Price</label><input class="field-input" id="pf-price" type="number" value="${draft.price}" placeholder="0"></div>
        </div>
        <label class="field-label">Pack Size — pieces per UOM</label>
        <input class="field-input" id="pf-pack" type="number" min="1" value="${draft.packSize || ""}" placeholder="e.g. 12">
        <div class="field-hint">Agar 100 pieces chahiye aur pack size 12 hai, to order screen 8.33 dikhayega.</div>
        <div class="modal-actions">
          ${!isNew ? `<button class="btn-secondary" id="pf-delete" style="color:var(--danger);border-color:#E7C7C2;">Delete</button>` : ""}
          <div style="flex:1"></div>
          <button class="btn-secondary" id="pf-cancel">Cancel</button>
          <button class="btn-primary" id="pf-save">Save</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById("pf-cancel").onclick = () => { overlay.innerHTML = ""; };
  document.getElementById("product-overlay").onclick = (e) => { if (e.target.id === "product-overlay") overlay.innerHTML = ""; };
  const delBtn = document.getElementById("pf-delete");
  if (delBtn) delBtn.onclick = async () => { await deleteProductById(draft.id); overlay.innerHTML = ""; };
  document.getElementById("pf-save").onclick = async () => {
    const id = isNew ? document.getElementById("pf-id").value.trim() : draft.id;
    const name = document.getElementById("pf-name").value.trim();
    const uom = document.getElementById("pf-uom").value.trim();
    const price = document.getElementById("pf-price").value;
    const packSize = document.getElementById("pf-pack").value;
    if (!id || !name || !uom || price === "" || isNaN(Number(price))) return;
    await saveProduct({ id, name, uom, price, packSize });
    overlay.innerHTML = "";
  };
}

// ---------------- Settings modal (logo + background) ----------------
function openSettingsModal() {
  const overlay = document.getElementById("modal-root");
  let logo = state.branding.logo;
  let useCustomBg = !!state.branding.bgColor;
  let bgColor = state.branding.bgColor || "#5B3FCB";

  function draw() {
    overlay.innerHTML = `
      <div class="modal-overlay" id="settings-overlay">
        <div class="modal">
          <h3>Logo aur background</h3>
          <label class="field-label">Company Logo</label>
          <div class="logo-pick-row">
            ${logo ? `<img src="${logo}" class="logo-preview">` : `<div class="brand-mark">AT</div>`}
            <label class="btn-secondary" style="cursor:pointer;">Logo choose karein<input type="file" accept="image/*" style="display:none" id="logo-file"></label>
            ${logo ? `<button class="btn-link" id="logo-remove">Remove</button>` : ""}
          </div>
          <label class="field-label">Background</label>
          <div class="bg-toggle-row">
            <button class="bg-toggle-btn ${!useCustomBg ? "active" : ""}" id="bg-default">Default</button>
            <button class="bg-toggle-btn ${useCustomBg ? "active" : ""}" id="bg-custom">Custom color</button>
          </div>
          ${useCustomBg ? `<div class="color-pick-row"><input type="color" class="color-input" id="bg-color" value="${bgColor}"><span id="bg-color-val">${bgColor}</span></div>` : ""}
          <div class="modal-actions">
            <div style="flex:1"></div>
            <button class="btn-secondary" id="settings-cancel">Cancel</button>
            <button class="btn-primary" id="settings-save">Save</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById("settings-cancel").onclick = () => { overlay.innerHTML = ""; };
    document.getElementById("settings-overlay").onclick = (e) => { if (e.target.id === "settings-overlay") overlay.innerHTML = ""; };
    document.getElementById("logo-file").onchange = (e) => {
      const file = e.target.files[0];
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => { logo = reader.result; draw(); };
      reader.readAsDataURL(file);
    };
    const removeBtn = document.getElementById("logo-remove");
    if (removeBtn) removeBtn.onclick = () => { logo = null; draw(); };
    document.getElementById("bg-default").onclick = () => { useCustomBg = false; draw(); };
    document.getElementById("bg-custom").onclick = () => { useCustomBg = true; draw(); };
    const colorInput = document.getElementById("bg-color");
    if (colorInput) colorInput.oninput = (e) => { bgColor = e.target.value; document.getElementById("bg-color-val").textContent = bgColor; };
    document.getElementById("settings-save").onclick = async () => {
      await saveBranding({ logo, bgColor: useCustomBg ? bgColor : null });
      overlay.innerHTML = "";
    };
  }
  draw();
}

// ---------------- Boot ----------------
signInAnonymously(auth).catch((e) => {
  console.error("Auth failed", e);
  showToast("Connection error — internet check karein");
});

onAuthStateChanged(auth, (user) => {
  if (user) initPinGate();
});
