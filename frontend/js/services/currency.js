import { state } from "../core/state.js";

const RATE_URL = "https://api.frankfurter.dev/v2/rates?base=TRY&quotes=USD,EUR";
const CURRENCY_STORAGE_KEY = "budgetDisplayCurrency";
const CURRENCIES = ["TRY", "USD", "EUR"];
const selectors = document.querySelectorAll("[data-currency-select]");
const labels = document.querySelectorAll("[data-currency-label]");
const notes = document.querySelectorAll("[data-currency-note]");
const statuses = document.querySelectorAll("[data-currency-status]");
let statusType = "idle";
let ratesPromise = null;

function renderStatus() {
    const isTurkish = state.currentLang === "tr";
    let message = "";
    if (statusType === "loading") {
        message = isTurkish ? "Döviz kurları alınıyor…" : "Loading exchange rates…";
    } else if (statusType === "error") {
        message = isTurkish
            ? "Kur alınamadı; TL gösteriliyor. Bağlantını kontrol et."
            : "Could not load rates; showing TRY. Check your connection.";
    } else if (state.currentCurrency !== "TRY" && state.currencyRateDate) {
        message = (isTurkish ? "Referans kur tarihi: " : "Reference rate date: ") +
            state.currencyRateDate + " · Frankfurter";
    }

    statuses.forEach((element) => {
        element.textContent = message;
        element.classList.toggle("is-error", statusType === "error");
    });
}

export function updateCurrencyControlLanguage() {
    const isTurkish = state.currentLang === "tr";
    labels.forEach((element) => {
        element.textContent = isTurkish ? "Görüntü para birimi" : "Display currency";
    });
    notes.forEach((element) => {
        element.textContent = isTurkish
            ? "Tutar girişleri TL; USD/EUR yalnızca gösterimi dönüştürür."
            : "Enter amounts in TL; USD/EUR only change the displayed conversion.";
    });
    selectors.forEach((element) => {
        element.setAttribute("aria-label", isTurkish ? "Görüntü para birimi" : "Display currency");
    });
    renderStatus();
}

async function fetchRates() {
    if (state.currencyRates.USD && state.currencyRates.EUR && state.currencyRateDate) return;
    if (!ratesPromise) {
        ratesPromise = (async () => {
            const response = await fetch(RATE_URL, { headers: { Accept: "application/json" } });
            if (!response.ok) throw new Error("Exchange-rate service returned HTTP " + response.status + ".");
            const rows = await response.json();
            if (!Array.isArray(rows)) throw new Error("Exchange-rate service returned an invalid response.");

            const usd = rows.find((row) => row.quote === "USD");
            const eur = rows.find((row) => row.quote === "EUR");
            if (!usd || !eur ||
                !Number.isFinite(usd.rate) || usd.rate <= 0 ||
                !Number.isFinite(eur.rate) || eur.rate <= 0 ||
                typeof usd.date !== "string" || typeof eur.date !== "string") {
                throw new Error("Exchange-rate service did not return valid USD and EUR rates.");
            }

            state.currencyRates = { TRY: 1, USD: usd.rate, EUR: eur.rate };
            state.currencyRateDate = usd.date < eur.date ? usd.date : eur.date;
        })();
    }

    try {
        await ratesPromise;
    } finally {
        ratesPromise = null;
    }
}

async function selectCurrency(currency) {
    if (!CURRENCIES.includes(currency)) return;
    const previousCurrency = state.currentCurrency;
    selectors.forEach((element) => {
        element.value = currency;
        element.disabled = true;
    });

    try {
        if (currency !== "TRY") {
            statusType = "loading";
            renderStatus();
            await fetchRates();
        }

        state.currentCurrency = currency;
        localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
        statusType = "ready";
        renderStatus();
        window.dispatchEvent(new Event("budget:currencychange"));
    } catch (error) {
        console.error("Could not load exchange rates:", error);
        state.currentCurrency = previousCurrency;
        selectors.forEach((element) => {
            element.value = previousCurrency;
        });
        statusType = "error";
        renderStatus();
    } finally {
        selectors.forEach((element) => {
            element.disabled = false;
        });
    }
}

export function initializeCurrency() {
    const preferredCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
    const initialCurrency = CURRENCIES.includes(preferredCurrency) ? preferredCurrency : "TRY";
    selectors.forEach((element) => {
        element.value = initialCurrency;
        element.addEventListener("change", () => {
            selectCurrency(element.value);
        });
    });
    updateCurrencyControlLanguage();

    if (initialCurrency !== "TRY") {
        selectCurrency(initialCurrency);
    }
}
