import { categories, categoryLabel } from "../core/categories.js";
import { currentMonthValue, formatMoney, transactionMonthValue } from "../core/formatting.js";
import { state } from "../core/state.js";
import { dom } from "../core/dom.js";
import { updateChart } from "./chart.js";

const {
    analysisMonth,
    categorySummary,
    guideNeedsAmount,
    guideNeedsMeter,
    guideNeedsMeterFill,
    guidePlanNote,
    guideSavingsAmount,
    guideSavingsMeter,
    guideSavingsMeterFill,
    guideWantsAmount,
    guideWantsMeter,
    guideWantsMeterFill,
    monthlyAnalysisNote,
    monthlyComparison,
    monthlySavingsRate,
    topExpenseCategory,
    totalExpenseAmount,
    totalExpenseLabel,
    totalIncomeAmount,
    totalIncomeLabel
} = dom;

export function renderCategorySummary(transactions) {
    if (!categorySummary) return;
    const totals = new Map();
    transactions.filter((item) => item.type === "gider").forEach((item) => {
        const categoryId = categories[item.category] ? item.category : "other";
        totals.set(categoryId, (totals.get(categoryId) || 0) + item.amount);
    });

    categorySummary.replaceChildren();
    const sortedTotals = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    if (sortedTotals.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "category-empty";
        emptyMessage.textContent = state.currentLang === "tr" ? "Henüz gider kaydı yok." : "No expenses yet.";
        categorySummary.appendChild(emptyMessage);
        return;
    }

    sortedTotals.forEach(([categoryId, total]) => {
        const row = document.createElement("div");
        row.className = "category-row";
        const label = document.createElement("span");
        label.className = "category-name";
        label.textContent = categories[categoryId].icon + " " + categoryLabel(categoryId);
        const amountLabel = document.createElement("strong");
        amountLabel.textContent = total.toLocaleString("tr-TR") + " TL";
        row.append(label, amountLabel);
        categorySummary.appendChild(row);
    });
}

export function renderMonthlyAnalysis(transactions) {
    if (!analysisMonth.value) analysisMonth.value = currentMonthValue();
    const [year, month] = analysisMonth.value.split("-").map(Number);
    const previousMonth = currentMonthValue(new Date(year, month - 2, 1));
    const datedTransactions = transactions.filter((item) => item.createdAt);
    const selectedTransactions = datedTransactions.filter((item) => transactionMonthValue(item.createdAt) === analysisMonth.value);
    const previousTransactions = datedTransactions.filter((item) => transactionMonthValue(item.createdAt) === previousMonth);
    const income = selectedTransactions
        .filter((item) => item.type === "gelir")
        .reduce((total, item) => total + item.amount, 0);
    const expenses = selectedTransactions
        .filter((item) => item.type === "gider")
        .reduce((total, item) => total + item.amount, 0);
    const previousIncome = previousTransactions
        .filter((item) => item.type === "gelir")
        .reduce((total, item) => total + item.amount, 0);
    const previousExpenses = previousTransactions
        .filter((item) => item.type === "gider")
        .reduce((total, item) => total + item.amount, 0);
    const expenseTotals = new Map();
    selectedTransactions.filter((item) => item.type === "gider").forEach((item) => {
        const categoryId = categories[item.category] ? item.category : "other";
        expenseTotals.set(categoryId, (expenseTotals.get(categoryId) || 0) + item.amount);
    });

    totalIncomeLabel.textContent = state.currentLang === "tr" ? "Bu Ayın Geliri" : "Income This Month";
    totalExpenseLabel.textContent = state.currentLang === "tr" ? "Bu Ayın Gideri" : "Expenses This Month";
    totalIncomeAmount.textContent = "+" + formatMoney(income);
    totalExpenseAmount.textContent = "-" + formatMoney(expenses);

    const formatChange = (label, current, previous) => {
        if (previous === 0) {
            if (current === 0) return state.currentLang === "tr" ? label + ": değişmedi" : label + ": unchanged";
            return state.currentLang === "tr"
                ? label + ": " + formatMoney(current) + " (önceki ay 0 TL)"
                : label + ": " + formatMoney(current) + " (0 TL last month)";
        }
        const change = ((current - previous) / previous) * 100;
        const direction = change > 0
            ? (state.currentLang === "tr" ? "arttı" : "increased")
            : change < 0
                ? (state.currentLang === "tr" ? "azaldı" : "decreased")
                : (state.currentLang === "tr" ? "değişmedi" : "unchanged");
        return label + " " + Math.abs(change).toLocaleString(state.currentLang === "tr" ? "tr-TR" : "en-US", { maximumFractionDigits: 1 }) + "% " + direction;
    };

    monthlyComparison.textContent = previousTransactions.length
        ? formatChange(state.currentLang === "tr" ? "Gelir" : "Income", income, previousIncome) +
            " · " +
            formatChange(state.currentLang === "tr" ? "Gider" : "Expenses", expenses, previousExpenses)
        : (state.currentLang === "tr" ? "Önceki ay için tarihli işlem yok" : "No dated transactions last month");

    const highestExpense = [...expenseTotals.entries()].sort((first, second) => second[1] - first[1])[0];
    topExpenseCategory.textContent = highestExpense
        ? categoryLabel(highestExpense[0]) + " · " + formatMoney(highestExpense[1])
        : (state.currentLang === "tr" ? "Henüz gider yok" : "No expenses yet");

    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    monthlySavingsRate.textContent = savingsRate.toLocaleString(state.currentLang === "tr" ? "tr-TR" : "en-US", {
        maximumFractionDigits: 1
    }) + "%";
    monthlyAnalysisNote.textContent = state.currentLang === "tr"
        ? "Tarih bilgisi olmayan eski işlemler aylık analize dahil edilmez."
        : "Older transactions without dates are excluded from monthly analysis.";
    updateChart(income, expenses, state.currentLang === "tr");
}

function updateBudgetRule(actual, target, amountElement, meter, meterFill, trLabel, enLabel) {
    const progress = target > 0 ? Math.max(0, Math.min(100, (actual / target) * 100)) : 0;
    amountElement.textContent = state.currentLang === "tr"
        ? trLabel + " " + actual.toLocaleString("tr-TR") + " / hedef " + target.toLocaleString("tr-TR") + " TL"
        : enLabel + " " + actual.toLocaleString("en-US") + " / target " + target.toLocaleString("en-US") + " TL";
    meter.setAttribute("aria-valuenow", progress.toFixed(0));
    meterFill.style.width = progress + "%";
    meter.closest(".budget-rule").classList.toggle("is-over", target > 0 && actual > target);
}

export function renderBudgetPlan(transactions, totalIncome, remainingBalance) {
    const expenseTotals = new Map();
    transactions.filter((item) => item.type === "gider").forEach((item) => {
        const categoryId = categories[item.category] ? item.category : "other";
        expenseTotals.set(categoryId, (expenseTotals.get(categoryId) || 0) + item.amount);
    });

    const needs = ["groceries", "bills", "housing", "transport", "health", "education", "other"]
        .reduce((total, categoryId) => total + (expenseTotals.get(categoryId) || 0), 0);
    const wants = ["dining", "clothing", "entertainment"]
        .reduce((total, categoryId) => total + (expenseTotals.get(categoryId) || 0), 0);

    updateBudgetRule(needs, totalIncome * 0.5, guideNeedsAmount, guideNeedsMeter, guideNeedsMeterFill, "Harcanan", "Spent");
    updateBudgetRule(wants, totalIncome * 0.3, guideWantsAmount, guideWantsMeter, guideWantsMeterFill, "Harcanan", "Spent");
    updateBudgetRule(remainingBalance, totalIncome * 0.2, guideSavingsAmount, guideSavingsMeter, guideSavingsMeterFill, "Kalan", "Remaining");

    guidePlanNote.textContent = totalIncome > 0
        ? (state.currentLang === "tr"
            ? "Tüm kayıtlı işlemlere göre hesaplanır; aylık değildir. Ailenize göre uyarlayın."
            : "Based on all recorded transactions, not monthly. Adjust it to your family.")
        : (state.currentLang === "tr"
            ? "Hedefleri görmek için önce Gelir (+) işlemi ekleyin."
            : "Add an income (+) transaction to see your targets.");
}
