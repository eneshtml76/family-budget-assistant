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
    monthlyCategoryReport,
    monthlyCategoryReportTitle,
    monthlySavingsRate,
    topExpenseCategory,
    totalExpenseAmount,
    totalExpenseLabel,
    totalIncomeAmount,
    totalIncomeLabel
} = dom;

function renderMonthlyCategoryReport(transactions, selectedMonth) {
    if (!monthlyCategoryReport) return;
    const [year, month] = selectedMonth.split("-").map(Number);
    const previousMonth = currentMonthValue(new Date(year, month - 2, 1));
    const currentTotals = new Map();
    const previousTotals = new Map();

    transactions.filter((item) => item.type === "gider" && item.createdAt).forEach((item) => {
        const categoryId = categories[item.category] ? item.category : "other";
        const transactionMonth = transactionMonthValue(item.createdAt);
        const target = transactionMonth === selectedMonth
            ? currentTotals
            : transactionMonth === previousMonth
                ? previousTotals
                : null;
        if (target) target.set(categoryId, (target.get(categoryId) || 0) + item.amount);
    });

    const rows = [...new Set([...currentTotals.keys(), ...previousTotals.keys()])]
        .sort((first, second) => (currentTotals.get(second) || 0) - (currentTotals.get(first) || 0));
    monthlyCategoryReport.replaceChildren();

    if (rows.length === 0) {
        const message = document.createElement("p");
        message.className = "category-empty";
        message.textContent = state.currentLang === "tr"
            ? "Bu ay ve önceki ay için tarihli gider bulunmuyor."
            : "No dated expenses found for this or the previous month.";
        monthlyCategoryReport.appendChild(message);
        return;
    }

    const currentTotal = [...currentTotals.values()].reduce((total, value) => total + value, 0);
    const table = document.createElement("table");
    table.className = "report-table";
    const caption = document.createElement("caption");
    caption.className = "visually-hidden";
    caption.textContent = state.currentLang === "tr"
        ? "Seçili ay ile önceki ayın kategori bazında gider karşılaştırması"
        : "Spending by category for the selected and previous month";
    table.appendChild(caption);

    const head = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const headers = state.currentLang === "tr"
        ? ["Kategori", "Seçilen ay", "Önceki ay", "Değişim"]
        : ["Category", "Selected month", "Previous month", "Change"];
    headers.forEach((text) => {
        const cell = document.createElement("th");
        cell.scope = "col";
        cell.textContent = text;
        headerRow.appendChild(cell);
    });
    head.appendChild(headerRow);
    table.appendChild(head);

    const body = document.createElement("tbody");
    rows.forEach((categoryId) => {
        const current = currentTotals.get(categoryId) || 0;
        const previous = previousTotals.get(categoryId) || 0;
        const row = document.createElement("tr");
        const categoryCell = document.createElement("th");
        categoryCell.scope = "row";
        categoryCell.textContent = categories[categoryId].icon + " " + categoryLabel(categoryId);
        const currentCell = document.createElement("td");
        currentCell.textContent = formatMoney(current);
        const previousCell = document.createElement("td");
        previousCell.textContent = formatMoney(previous);
        const changeCell = document.createElement("td");
        changeCell.textContent = previous > 0
            ? (current - previous > 0 ? "+" : "") +
                (((current - previous) / previous) * 100).toLocaleString(
                    state.currentLang === "tr" ? "tr-TR" : "en-US",
                    { maximumFractionDigits: 1 }
                ) + "%"
            : (state.currentLang === "tr" ? "Yeni" : "New");
        row.append(categoryCell, currentCell, previousCell, changeCell);
        body.appendChild(row);
    });
    table.appendChild(body);

    const foot = document.createElement("tfoot");
    const totalRow = document.createElement("tr");
    const totalLabel = document.createElement("th");
    totalLabel.scope = "row";
    totalLabel.textContent = state.currentLang === "tr" ? "Toplam gider" : "Total expenses";
    const currentCell = document.createElement("td");
    currentCell.textContent = formatMoney(currentTotal);
    const previousCell = document.createElement("td");
    previousCell.textContent = formatMoney([...previousTotals.values()].reduce((total, value) => total + value, 0));
    const emptyCell = document.createElement("td");
    emptyCell.textContent = "—";
    totalRow.append(totalLabel, currentCell, previousCell, emptyCell);
    foot.appendChild(totalRow);
    table.appendChild(foot);
    monthlyCategoryReport.appendChild(table);
}

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
        amountLabel.textContent = formatMoney(total);
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
                ? label + ": " + formatMoney(current) + " (önceki ay " + formatMoney(0) + ")"
                : label + ": " + formatMoney(current) + " (" + formatMoney(0) + " last month)";
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
    if (monthlyCategoryReportTitle) {
        monthlyCategoryReportTitle.textContent = state.currentLang === "tr"
            ? "📈 Aylık kategori raporu"
            : "📈 Monthly category report";
    }
    renderMonthlyCategoryReport(transactions, analysisMonth.value);
    updateChart(income, expenses, state.currentLang === "tr");
}

function updateBudgetRule(actual, target, amountElement, meter, meterFill, trLabel, enLabel) {
    const progress = target > 0 ? Math.max(0, Math.min(100, (actual / target) * 100)) : 0;
    amountElement.textContent = state.currentLang === "tr"
        ? trLabel + " " + formatMoney(actual) + " / hedef " + formatMoney(target)
        : enLabel + " " + formatMoney(actual) + " / target " + formatMoney(target);
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
