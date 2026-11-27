import { state } from "./state.js";

export const categories = {
    groceries: { tr: "Market", en: "Groceries", icon: "🛒" },
    bills: { tr: "Faturalar", en: "Bills", icon: "🧾" },
    housing: { tr: "Kira & Ev", en: "Housing", icon: "🏠" },
    transport: { tr: "Ulaşım", en: "Transport", icon: "🚌" },
    dining: { tr: "Yeme-İçme", en: "Dining", icon: "🍽️" },
    health: { tr: "Sağlık", en: "Health", icon: "💊" },
    education: { tr: "Eğitim", en: "Education", icon: "📚" },
    clothing: { tr: "Giyim", en: "Clothing", icon: "👕" },
    entertainment: { tr: "Eğlence", en: "Entertainment", icon: "🎬" },
    salary: { tr: "Maaş", en: "Salary", icon: "💼" },
    extra_income: { tr: "Ek Gelir", en: "Extra Income", icon: "✨" },
    other: { tr: "Diğer", en: "Other", icon: "📦" }
};

export function categoryLabel(categoryId, language = state.currentLang) {
    const item = categories[categoryId] || categories.other;
    return language === "tr" ? item.tr : item.en;
}
