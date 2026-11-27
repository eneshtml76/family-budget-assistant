import { state } from "./state.js";

export function currentMonthValue(date = new Date()) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
}

export function formatMoney(value, language = state.currentLang) {
    return Number(value || 0).toLocaleString(language === "tr" ? "tr-TR" : "en-US") + " TL";
}

export function localDateValue(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" +
        String(date.getDate()).padStart(2, "0");
}

export function transactionDateValue(createdAt) {
    return localDateValue(new Date(createdAt));
}

export function transactionMonthValue(createdAt) {
    return transactionDateValue(createdAt).slice(0, 7);
}
