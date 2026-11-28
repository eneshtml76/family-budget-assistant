import { state } from "./state.js";

export function currentMonthValue(date = new Date()) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
}

export function formatMoney(value, language = state.currentLang) {
    const amount = Number(value || 0);
    if (state.currentCurrency === "TRY") {
        return amount.toLocaleString(language === "tr" ? "tr-TR" : "en-US") + " TL";
    }

    const rate = state.currencyRates[state.currentCurrency];
    if (!Number.isFinite(rate)) throw new Error("The selected currency rate is unavailable.");
    return new Intl.NumberFormat(language === "tr" ? "tr-TR" : "en-US", {
        style: "currency",
        currency: state.currentCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount * rate);
}

export function localDateValue(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" +
        String(date.getDate()).padStart(2, "0");
}

export function transactionDateValue(createdAt) {
    if (typeof createdAt === "string") {
        const dateOnly = createdAt.match(/^(\d{4}-\d{2}-\d{2})(?:T|$)/);
        if (dateOnly) return dateOnly[1];
    }
    return localDateValue(new Date(createdAt));
}

export function transactionMonthValue(createdAt) {
    return transactionDateValue(createdAt).slice(0, 7);
}
