import {
    registerUser,
    loginUser,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    removeTransaction,
    fetchSavingsGoals,
    createSavingsGoal,
    contributeToSavingsGoal,
    removeSavingsGoal
} from "./api.js";
import { updateChart, calculateLoan } from "./chart.js";

// Auth DOM Elements
const authSection = document.getElementById("authSection");
const dashboardSection = document.getElementById("dashboardSection");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const guestBtn = document.getElementById("guestBtn");
const logoutBtn = document.getElementById("logoutBtn");
const exportButton = document.getElementById("exportButton");
const exportButtonLabel = document.getElementById("exportButtonLabel");
const installButton = document.getElementById("installButton");
const installButtonText = document.getElementById("installButtonText");
const welcomeUser = document.getElementById("welcomeUser");
const themeToggleButtons = document.querySelectorAll(".theme-toggle");

// Budget DOM Elements
const totalBalance = document.getElementById("totalBalance");
const totalIncomeAmount = document.getElementById("totalIncomeAmount");
const totalExpenseAmount = document.getElementById("totalExpenseAmount");
const description = document.getElementById("description");
const amount = document.getElementById("amount");
const type = document.getElementById("type");
const category = document.getElementById("category");
const addButton = document.getElementById("addButton");
const transactionList = document.getElementById("transactionList");
const categorySummary = document.getElementById("categorySummary");
const transactionSearch = document.getElementById("transactionSearch");
const transactionTypeFilter = document.getElementById("transactionTypeFilter");
const transactionCategoryFilter = document.getElementById("transactionCategoryFilter");
const transactionDateFrom = document.getElementById("transactionDateFrom");
const transactionDateTo = document.getElementById("transactionDateTo");
const transactionEmptyMessage = document.getElementById("transactionEmptyMessage");
const clearFiltersButton = document.getElementById("clearFiltersButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const analysisMonth = document.getElementById("analysisMonth");
const monthlyComparison = document.getElementById("monthlyComparison");
const topExpenseCategory = document.getElementById("topExpenseCategory");
const monthlySavingsRate = document.getElementById("monthlySavingsRate");
const monthlyAnalysisNote = document.getElementById("monthlyAnalysisNote");
const showGoalFormButton = document.getElementById("showGoalFormButton");
const goalForm = document.getElementById("goalForm");
const goalNameInput = document.getElementById("goalNameInput");
const goalTargetInput = document.getElementById("goalTargetInput");
const saveGoalButton = document.getElementById("saveGoalButton");
const savingsGoalsList = document.getElementById("savingsGoalsList");

// Loan Simulator DOM Elements
const loanAmountInput = document.getElementById("loanAmount");
const loanMonthsInput = document.getElementById("loanMonths");
const interestRateInput = document.getElementById("interestRate");
const calcLoanBtn = document.getElementById("calcLoanBtn");
const simResult = document.getElementById("simResult");

// Language Toggle Elements
const languageButton = document.getElementById("languageButton");
const authLangBtn = document.getElementById("authLangBtn");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const title = document.getElementById("title");
const balanceTitle = document.getElementById("balanceTitle");
const totalIncomeLabel = document.getElementById("totalIncomeLabel");
const totalExpenseLabel = document.getElementById("totalExpenseLabel");
const incomeOption = document.getElementById("incomeOption");
const expenseOption = document.getElementById("expenseOption");
const analyticsTitle = document.getElementById("analyticsTitle");
const categorySummaryTitle = document.getElementById("categorySummaryTitle");
const simTitle = document.getElementById("simTitle");
const guideKicker = document.getElementById("guideKicker");
const guideTitle = document.getElementById("guideTitle");
const guideIntro = document.getElementById("guideIntro");
const guidePlanTitle = document.getElementById("guidePlanTitle");
const guideNeedsTitle = document.getElementById("guideNeedsTitle");
const guideNeedsText = document.getElementById("guideNeedsText");
const guideNeedsAmount = document.getElementById("guideNeedsAmount");
const guideNeedsMeter = document.getElementById("guideNeedsMeter");
const guideNeedsMeterFill = document.getElementById("guideNeedsMeterFill");
const guideWantsTitle = document.getElementById("guideWantsTitle");
const guideWantsText = document.getElementById("guideWantsText");
const guideWantsAmount = document.getElementById("guideWantsAmount");
const guideWantsMeter = document.getElementById("guideWantsMeter");
const guideWantsMeterFill = document.getElementById("guideWantsMeterFill");
const guideSavingsTitle = document.getElementById("guideSavingsTitle");
const guideSavingsText = document.getElementById("guideSavingsText");
const guideSavingsAmount = document.getElementById("guideSavingsAmount");
const guideSavingsMeter = document.getElementById("guideSavingsMeter");
const guideSavingsMeterFill = document.getElementById("guideSavingsMeterFill");
const guidePlanNote = document.getElementById("guidePlanNote");
const guideActionButton = document.getElementById("guideActionButton");
const guideActionLabel = document.getElementById("guideActionLabel");

// Application State
let currentUser = JSON.parse(localStorage.getItem("budgetUser")) || null;
let guestTransactions = [];
let currentTransactions = [];
let guestSavingsGoals = [];
let currentSavingsGoals = [];
let editingTransactionId = null;
let balance = 0;
let currentLang = "tr";
let currentTheme = localStorage.getItem("budgetTheme") === "dark" ? "dark" : "light";

function applyTheme() {
    document.body.classList.toggle("dark-theme", currentTheme === "dark");
    const themeColor = document.querySelector('meta[name="theme-color"]');
    themeColor.content = currentTheme === "dark" ? "#101713" : "#f5f7f2";
    themeToggleButtons.forEach((button) => {
        button.textContent = currentTheme === "dark" ? "☀️" : "🌙";
        button.setAttribute(
            "aria-label",
            currentTheme === "dark"
                ? (currentLang === "tr" ? "Açık temayı aç" : "Switch to light theme")
                : (currentLang === "tr" ? "Koyu temayı aç" : "Switch to dark theme")
        );
    });
}

themeToggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
        currentTheme = currentTheme === "dark" ? "light" : "dark";
        localStorage.setItem("budgetTheme", currentTheme);
        applyTheme();
    });
});
applyTheme();

const categories = {
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

function categoryLabel(categoryId) {
    const item = categories[categoryId] || categories.other;
    return (currentLang === "tr" ? item.tr : item.en);
}

function renderCategoryOptions(selectedCategory) {
    const isIncome = type.value === "gelir";
    const allowedCategories = isIncome
        ? ["salary", "extra_income", "other"]
        : ["groceries", "bills", "housing", "transport", "dining", "health", "education", "clothing", "entertainment", "other"];
    category.replaceChildren();
    allowedCategories.forEach((categoryId) => {
        const option = document.createElement("option");
        option.value = categoryId;
        option.textContent = categoryLabel(categoryId);
        category.appendChild(option);
    });
    category.value = allowedCategories.includes(selectedCategory)
        ? selectedCategory
        : (isIncome ? "salary" : "groceries");
}

function renderCategorySummary(transactions) {
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
        emptyMessage.textContent = currentLang === "tr" ? "Henüz gider kaydı yok." : "No expenses yet.";
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

function currentMonthValue(date = new Date()) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
}

function formatMoney(value) {
    return Number(value || 0).toLocaleString(currentLang === "tr" ? "tr-TR" : "en-US") + " TL";
}

function localDateValue(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" +
        String(date.getDate()).padStart(2, "0");
}

function transactionDateValue(createdAt) {
    return localDateValue(new Date(createdAt));
}

function transactionMonthValue(createdAt) {
    return transactionDateValue(createdAt).slice(0, 7);
}

function renderMonthlyAnalysis(transactions) {
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

    totalIncomeLabel.textContent = currentLang === "tr" ? "Bu Ayın Geliri" : "Income This Month";
    totalExpenseLabel.textContent = currentLang === "tr" ? "Bu Ayın Gideri" : "Expenses This Month";
    totalIncomeAmount.textContent = "+" + formatMoney(income);
    totalExpenseAmount.textContent = "-" + formatMoney(expenses);

    const formatChange = (label, current, previous) => {
        if (previous === 0) {
            if (current === 0) return currentLang === "tr" ? label + ": değişmedi" : label + ": unchanged";
            return currentLang === "tr"
                ? label + ": " + formatMoney(current) + " (önceki ay 0 TL)"
                : label + ": " + formatMoney(current) + " (0 TL last month)";
        }
        const change = ((current - previous) / previous) * 100;
        const direction = change > 0
            ? (currentLang === "tr" ? "arttı" : "increased")
            : change < 0
                ? (currentLang === "tr" ? "azaldı" : "decreased")
                : (currentLang === "tr" ? "değişmedi" : "unchanged");
        return label + " " + Math.abs(change).toLocaleString(currentLang === "tr" ? "tr-TR" : "en-US", { maximumFractionDigits: 1 }) + "% " + direction;
    };

    monthlyComparison.textContent = previousTransactions.length
        ? formatChange(currentLang === "tr" ? "Gelir" : "Income", income, previousIncome) +
            " · " +
            formatChange(currentLang === "tr" ? "Gider" : "Expenses", expenses, previousExpenses)
        : (currentLang === "tr" ? "Önceki ay için tarihli işlem yok" : "No dated transactions last month");

    const highestExpense = [...expenseTotals.entries()].sort((first, second) => second[1] - first[1])[0];
    topExpenseCategory.textContent = highestExpense
        ? categoryLabel(highestExpense[0]) + " · " + formatMoney(highestExpense[1])
        : (currentLang === "tr" ? "Henüz gider yok" : "No expenses yet");

    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    monthlySavingsRate.textContent = savingsRate.toLocaleString(currentLang === "tr" ? "tr-TR" : "en-US", {
        maximumFractionDigits: 1
    }) + "%";
    monthlyAnalysisNote.textContent = currentLang === "tr"
        ? "Tarih bilgisi olmayan eski işlemler aylık analize dahil edilmez."
        : "Older transactions without dates are excluded from monthly analysis.";
    updateChart(income, expenses, currentLang === "tr");
}

function renderCategoryFilterOptions() {
    const selectedCategory = transactionCategoryFilter.value;
    transactionCategoryFilter.replaceChildren();
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = currentLang === "tr" ? "Tüm kategoriler" : "All categories";
    transactionCategoryFilter.appendChild(allOption);
    Object.entries(categories).forEach(([categoryId]) => {
        const option = document.createElement("option");
        option.value = categoryId;
        option.textContent = categoryLabel(categoryId);
        transactionCategoryFilter.appendChild(option);
    });
    transactionCategoryFilter.value = selectedCategory || "all";
}

function renderFilteredTransactions() {
    const searchText = transactionSearch.value.trim().toLocaleLowerCase(currentLang === "tr" ? "tr-TR" : "en-US");
    const typeFilter = transactionTypeFilter.value;
    const categoryFilter = transactionCategoryFilter.value;
    const fromDate = transactionDateFrom.value;
    const toDate = transactionDateTo.value;
    const filteredTransactions = currentTransactions.filter((item) => {
        const searchableText = (item.description + " " + categoryLabel(item.category))
            .toLocaleLowerCase(currentLang === "tr" ? "tr-TR" : "en-US");
        if (searchText && !searchableText.includes(searchText)) return false;
        if (typeFilter !== "all" && item.type !== typeFilter) return false;
        if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
        if (fromDate || toDate) {
            if (!item.createdAt) return false;
            const transactionDate = transactionDateValue(item.createdAt);
            if (fromDate && transactionDate < fromDate) return false;
            if (toDate && transactionDate > toDate) return false;
        }
        return true;
    });

    transactionList.replaceChildren();
    filteredTransactions.forEach((item) => renderTransactionItem(item));
    transactionEmptyMessage.classList.toggle("hidden", filteredTransactions.length > 0);
    if (filteredTransactions.length === 0) {
        transactionEmptyMessage.textContent = currentTransactions.length === 0
            ? (currentLang === "tr" ? "Henüz işlem yok." : "No transactions yet.")
            : (currentLang === "tr" ? "Bu filtrelerle eşleşen işlem bulunamadı." : "No transactions match these filters.");
    }
}

renderCategoryFilterOptions();
[transactionSearch, transactionTypeFilter, transactionCategoryFilter, transactionDateFrom, transactionDateTo]
    .forEach((filter) => filter.addEventListener("input", renderFilteredTransactions));
if (clearFiltersButton) {
    clearFiltersButton.addEventListener("click", () => {
        transactionSearch.value = "";
        transactionTypeFilter.value = "all";
        transactionCategoryFilter.value = "all";
        transactionDateFrom.value = "";
        transactionDateTo.value = "";
        renderFilteredTransactions();
    });
}
analysisMonth.value = currentMonthValue();
analysisMonth.addEventListener("change", () => renderMonthlyAnalysis(currentTransactions));

function updateBudgetRule(actual, target, amountElement, meter, meterFill, trLabel, enLabel) {
    const progress = target > 0 ? Math.max(0, Math.min(100, (actual / target) * 100)) : 0;
    amountElement.textContent = currentLang === "tr"
        ? trLabel + " " + actual.toLocaleString("tr-TR") + " / hedef " + target.toLocaleString("tr-TR") + " TL"
        : enLabel + " " + actual.toLocaleString("en-US") + " / target " + target.toLocaleString("en-US") + " TL";
    meter.setAttribute("aria-valuenow", progress.toFixed(0));
    meterFill.style.width = progress + "%";
    meter.closest(".budget-rule").classList.toggle("is-over", target > 0 && actual > target);
}

function renderBudgetPlan(transactions, totalIncome, remainingBalance) {
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
        ? (currentLang === "tr"
            ? "Tüm kayıtlı işlemlere göre hesaplanır; aylık değildir. Ailenize göre uyarlayın."
            : "Based on all recorded transactions, not monthly. Adjust it to your family.")
        : (currentLang === "tr"
            ? "Hedefleri görmek için önce Gelir (+) işlemi ekleyin."
            : "Add an income (+) transaction to see your targets.");
}

function renderSavingsGoals(goals) {
    savingsGoalsList.replaceChildren();
    if (goals.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "category-empty";
        emptyMessage.textContent = currentLang === "tr"
            ? "Henüz birikim hedefi eklemedin."
            : "You have not added a savings goal yet.";
        savingsGoalsList.appendChild(emptyMessage);
        return;
    }

    goals.forEach((goal) => {
        const card = document.createElement("article");
        card.className = "savings-goal-card";
        const heading = document.createElement("div");
        heading.className = "savings-goal-card-heading";
        const name = document.createElement("strong");
        name.textContent = goal.name;
        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.type = "button";
        deleteButton.textContent = "✕";
        deleteButton.setAttribute("aria-label", currentLang === "tr" ? "Hedefi sil" : "Delete goal");
        deleteButton.addEventListener("click", async () => {
            const confirmed = confirm(currentLang === "tr" ? "Bu birikim hedefi silinsin mi?" : "Delete this savings goal?");
            if (!confirmed) return;
            try {
                if (currentUser.isGuest) {
                    guestSavingsGoals = guestSavingsGoals.filter((item) => item.id !== goal.id);
                } else {
                    await removeSavingsGoal(goal.id, currentUser.userId);
                }
                await loadSavingsGoals();
            } catch (error) {
                console.error("Error deleting savings goal:", error);
                alert(currentLang === "tr" ? "Hedef silinemedi: " + error.message : "Could not delete goal: " + error.message);
            }
        });
        heading.append(name, deleteButton);

        const target = Number(goal.targetAmount);
        const saved = Number(goal.savedAmount);
        const progress = Math.max(0, Math.min(100, target > 0 ? (saved / target) * 100 : 0));
        const amountLabel = document.createElement("p");
        amountLabel.className = "savings-goal-amount";
        amountLabel.textContent = formatMoney(saved) + " / " + formatMoney(target);
        const meter = document.createElement("div");
        meter.className = "savings-goal-meter";
        meter.setAttribute("role", "progressbar");
        meter.setAttribute("aria-valuemin", "0");
        meter.setAttribute("aria-valuemax", "100");
        meter.setAttribute("aria-valuenow", progress.toFixed(0));
        const fill = document.createElement("span");
        fill.style.width = progress + "%";
        meter.appendChild(fill);

        const remaining = document.createElement("p");
        remaining.className = "savings-goal-remaining";
        remaining.textContent = currentLang === "tr"
            ? "Kalan: " + formatMoney(Math.max(0, target - saved)) + " · %" + progress.toFixed(0)
            : "Remaining: " + formatMoney(Math.max(0, target - saved)) + " · " + progress.toFixed(0) + "%";

        const contributionRow = document.createElement("div");
        contributionRow.className = "savings-contribution-row";
        const contributionInput = document.createElement("input");
        contributionInput.type = "number";
        contributionInput.min = "0.01";
        contributionInput.step = "any";
        contributionInput.placeholder = currentLang === "tr" ? "Eklenecek tutar" : "Amount to add";
        contributionInput.setAttribute("aria-label", currentLang === "tr" ? goal.name + " hedefine eklenecek tutar" : "Amount to add to " + goal.name);
        const contributionButton = document.createElement("button");
        contributionButton.type = "button";
        contributionButton.className = "small-action-btn";
        contributionButton.textContent = currentLang === "tr" ? "Ekle" : "Add";
        contributionButton.addEventListener("click", async () => {
            const contributionAmount = Number(contributionInput.value);
            if (!Number.isFinite(contributionAmount) || contributionAmount <= 0) {
                alert(currentLang === "tr" ? "Pozitif bir tutar gir." : "Enter an amount greater than zero.");
                return;
            }
            try {
                if (currentUser.isGuest) {
                    guestSavingsGoals = guestSavingsGoals.map((item) =>
                        item.id === goal.id
                            ? { ...item, savedAmount: item.savedAmount + contributionAmount }
                            : item
                    );
                } else {
                    await contributeToSavingsGoal(goal.id, currentUser.userId, contributionAmount);
                }
                await loadSavingsGoals();
            } catch (error) {
                console.error("Error adding savings contribution:", error);
                alert(currentLang === "tr" ? "Birikim eklenemedi: " + error.message : "Could not add contribution: " + error.message);
            }
        });
        contributionRow.append(contributionInput, contributionButton);
        card.append(heading, amountLabel, meter, remaining, contributionRow);
        savingsGoalsList.appendChild(card);
    });
}

async function loadSavingsGoals() {
    if (!currentUser) return;
    try {
        currentSavingsGoals = currentUser.isGuest
            ? guestSavingsGoals
            : await fetchSavingsGoals(currentUser.userId);
        renderSavingsGoals(currentSavingsGoals);
    } catch (error) {
        console.error("Error loading savings goals:", error);
        savingsGoalsList.textContent = currentLang === "tr"
            ? "Birikim hedefleri yüklenemedi: " + error.message
            : "Could not load savings goals: " + error.message;
    }
}

if (showGoalFormButton) {
    showGoalFormButton.addEventListener("click", () => {
        goalForm.classList.toggle("hidden");
        if (!goalForm.classList.contains("hidden")) goalNameInput.focus();
    });
}

if (saveGoalButton) {
    saveGoalButton.addEventListener("click", async () => {
        const name = goalNameInput.value.trim();
        const targetAmount = Number(goalTargetInput.value);
        if (!name || !Number.isFinite(targetAmount) || targetAmount <= 0) {
            alert(currentLang === "tr" ? "Hedef adı ve pozitif hedef tutarı gir." : "Enter a goal name and a target greater than zero.");
            return;
        }

        try {
            if (currentUser.isGuest) {
                guestSavingsGoals.push({
                    id: Date.now(),
                    name,
                    targetAmount,
                    savedAmount: 0
                });
            } else {
                await createSavingsGoal({
                    userId: currentUser.userId,
                    name,
                    targetAmount
                });
            }
            goalNameInput.value = "";
            goalTargetInput.value = "";
            goalForm.classList.add("hidden");
            await loadSavingsGoals();
        } catch (error) {
            console.error("Error creating savings goal:", error);
            alert(currentLang === "tr" ? "Hedef kaydedilemedi: " + error.message : "Could not save goal: " + error.message);
        }
    });
}

type.addEventListener("change", () => renderCategoryOptions());
renderCategoryOptions();

if (guideActionButton) {
    guideActionButton.addEventListener("click", () => {
        description.scrollIntoView({ behavior: "smooth", block: "center" });
        description.focus({ preventScroll: true });
    });
}

// Check if user is already logged in on page load
function checkSession() {
    if (currentUser) {
        authSection.classList.add("hidden");
        dashboardSection.classList.remove("hidden");
        if (currentUser.isGuest) {
            welcomeUser.textContent = currentLang === "tr" ? "⚡ Misafir (Kaydetmez)" : "⚡ Guest (Not Saved)";
        } else {
            welcomeUser.textContent = "👤 " + currentUser.username;
        }
        loadTransactions();
        loadSavingsGoals();
    } else {
        authSection.classList.remove("hidden");
        dashboardSection.classList.add("hidden");
    }
}

// Guest / Quick Demo Mode Handler
if (guestBtn) {
    guestBtn.addEventListener("click", () => {
        currentUser = { userId: 0, username: "Misafir", isGuest: true };
        guestTransactions = [];
        guestSavingsGoals = [];
        checkSession();
    });
}

// Register Handler
if (registerBtn) {
    registerBtn.addEventListener("click", async () => {
        const user = usernameInput.value.trim();
        const pass = passwordInput.value.trim();
        if (!user || !pass) return alert(currentLang === "tr" ? "Kullanıcı adı ve şifre girin!" : "Enter username and password!");

        try {
            const data = await registerUser(user, pass);
            localStorage.setItem("budgetUser", JSON.stringify(data));
            currentUser = data;
            checkSession();
        } catch (error) {
            alert((currentLang === "tr" ? "Kayıt hatası: " : "Registration error: ") + error.message);
        }
    });
}

// Login Handler
if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
        const user = usernameInput.value.trim();
        const pass = passwordInput.value.trim();
        if (!user || !pass) return alert(currentLang === "tr" ? "Kullanıcı adı ve şifre girin!" : "Enter username and password!");

        try {
            const data = await loginUser(user, pass);
            localStorage.setItem("budgetUser", JSON.stringify(data));
            currentUser = data;
            checkSession();
        } catch (error) {
            alert(currentLang === "tr" ? "Giriş başarısız! Kullanıcı adı veya şifre hatalı." : "Login failed! Invalid username or password.");
        }
    });
}

// Logout Handler
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("budgetUser");
        currentUser = null;
        guestTransactions = [];
        guestSavingsGoals = [];
        currentTransactions = [];
        currentSavingsGoals = [];
        resetTransactionForm();
        transactionList.replaceChildren();
        transactionEmptyMessage.classList.add("hidden");
        savingsGoalsList.replaceChildren();
        goalForm.classList.add("hidden");
        goalNameInput.value = "";
        goalTargetInput.value = "";
        usernameInput.value = "";
        passwordInput.value = "";
        checkSession();
    });
}

// Load user-specific transactions
async function loadTransactions() {
    if (!currentUser) return;
    try {
        const transactions = currentUser.isGuest
            ? guestTransactions
            : await fetchTransactions(currentUser.userId);

        currentTransactions = transactions;
        balance = 0;
        let totalIncome = 0;

        transactions.forEach((item) => {
            if (item.type === "gelir") {
                balance += item.amount;
                totalIncome += item.amount;
            } else {
                balance -= item.amount;
            }
        });

        totalBalance.textContent = balance.toLocaleString("tr-TR") + " TL";
        renderMonthlyAnalysis(transactions);
        renderFilteredTransactions();
        renderCategorySummary(transactions);
        renderBudgetPlan(transactions, totalIncome, balance);
    } catch (error) {
        console.error("Error loading transactions:", error);
        transactionEmptyMessage.classList.remove("hidden");
        transactionEmptyMessage.textContent = currentLang === "tr"
            ? "İşlemler yüklenemedi: " + error.message
            : "Could not load transactions: " + error.message;
    }
}

function downloadTransactions() {
    const isTr = currentLang === "tr";
    const delimiter = ";";
    const rows = [
        isTr ? ["Tarih", "Açıklama", "Tür", "Kategori", "Tutar (TL)"] : ["Date", "Description", "Type", "Category", "Amount (TL)"],
        ...currentTransactions.map((transaction) => [
            transaction.createdAt ? transactionDateValue(transaction.createdAt) : "",
            transaction.description,
            transaction.type === "gelir" ? (isTr ? "Gelir" : "Income") : (isTr ? "Gider" : "Expense"),
            categoryLabel(transaction.category),
            transaction.amount
        ])
    ];
    const csv = rows
        .map((row) => row.map((value) => {
            const text = String(value ?? "");
            const safeText = /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
            return '"' + safeText.replace(/"/g, '""') + '"';
        }).join(delimiter))
        .join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "aile-butce-islemleri-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

if (exportButton) exportButton.addEventListener("click", downloadTransactions);

function resetTransactionForm() {
    editingTransactionId = null;
    description.value = "";
    amount.value = "";
    renderCategoryOptions();
    addButton.textContent = currentLang === "tr" ? "İşlemi Ekle" : "Add Transaction";
    cancelEditButton.classList.add("hidden");
}

function startEditingTransaction(item) {
    editingTransactionId = item.id;
    description.value = item.description;
    amount.value = item.amount;
    type.value = item.type;
    renderCategoryOptions(item.category);
    addButton.textContent = currentLang === "tr" ? "Değişikliği Kaydet" : "Save Changes";
    cancelEditButton.classList.remove("hidden");
    description.scrollIntoView({ behavior: "smooth", block: "center" });
    description.focus({ preventScroll: true });
}

if (cancelEditButton) cancelEditButton.addEventListener("click", resetTransactionForm);

function renderTransactionItem(item) {
    const listItem = document.createElement("li");

    const descriptionGroup = document.createElement("div");
    descriptionGroup.className = "transaction-description";
    const descSpan = document.createElement("span");
    descSpan.className = "transaction-name";
    descSpan.textContent = item.description;
    const categorySpan = document.createElement("span");
    categorySpan.className = "transaction-category";
    categorySpan.textContent = categoryLabel(item.category);
    const dateSpan = document.createElement("span");
    dateSpan.className = "transaction-date";
    dateSpan.textContent = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString(currentLang === "tr" ? "tr-TR" : "en-US")
        : (currentLang === "tr" ? "Tarih bilgisi yok" : "Date unavailable");
    descriptionGroup.append(descSpan, categorySpan, dateSpan);

    const rightDiv = document.createElement("div");
    rightDiv.className = "item-right";

    const amountSpan = document.createElement("span");
    const isIncome = item.type === "gelir";
    amountSpan.textContent = (isIncome ? "+" : "-") + formatMoney(item.amount);
    amountSpan.className = isIncome ? "income-text" : "expense-text";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = currentLang === "tr" ? "Düzenle" : "Edit";
    editButton.className = "edit-btn";
    editButton.setAttribute("aria-label", currentLang === "tr" ? "İşlemi düzenle" : "Edit transaction");
    editButton.addEventListener("click", () => startEditingTransaction(item));

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "✕";
    delBtn.className = "delete-btn";
    delBtn.setAttribute("aria-label", currentLang === "tr" ? "İşlemi sil" : "Delete transaction");
    delBtn.onclick = async () => {
        try {
            if (currentUser.isGuest) {
                guestTransactions = guestTransactions.filter((transaction) => transaction.id !== item.id);
            } else {
                await removeTransaction(item.id);
            }
            if (editingTransactionId === item.id) resetTransactionForm();
            await loadTransactions();
        } catch (error) {
            console.error("Error deleting transaction:", error);
            alert(currentLang === "tr" ? "İşlem silinemedi: " + error.message : "Could not delete transaction: " + error.message);
        }
    };

    rightDiv.append(amountSpan, editButton, delBtn);
    listItem.appendChild(descriptionGroup);
    listItem.appendChild(rightDiv);
    transactionList.prepend(listItem);
}

// Add transaction linked to currentUser
if (addButton) {
    addButton.addEventListener("click", async () => {
        const descValue = description.value.trim();
        const amnt = Number(amount.value);
        const typeValue = type.value;
        const categoryValue = category.value;

        if (descValue === "" || !Number.isFinite(amnt) || amnt <= 0) {
            alert(currentLang === "tr" ? "Geçerli bilgi girin!" : "Enter valid info!");
            return;
        }

        try {
            const transactionData = {
                userId: currentUser.userId,
                description: descValue,
                amount: amnt,
                type: typeValue,
                category: categoryValue
            };
            if (editingTransactionId !== null) {
                if (currentUser.isGuest) {
                    guestTransactions = guestTransactions.map((item) =>
                        item.id === editingTransactionId
                            ? { ...item, ...transactionData }
                            : item
                    );
                } else {
                    await updateTransaction(editingTransactionId, transactionData);
                }
            } else if (currentUser.isGuest) {
                guestTransactions.push({
                    ...transactionData,
                    id: Date.now(),
                    createdAt: new Date().toISOString()
                });
            } else {
                await createTransaction(transactionData);
            }
            resetTransactionForm();
            await loadTransactions();
        } catch (error) {
            console.error("Error saving transaction:", error);
            alert(currentLang === "tr" ? "İşlem kaydedilemedi: " + error.message : "Could not save transaction: " + error.message);
        }
    });
}
// Loan Simulator Handler
if (calcLoanBtn) {
calcLoanBtn.addEventListener("click", () => {
const principal = Number(loanAmountInput.value);
const months = Number(loanMonthsInput.value);
const ratePercent = Number(interestRateInput.value);
if (principal <= 0 || months <= 0 || ratePercent < 0) {
alert(currentLang === "tr" ? "Geçerli kredi tutarı ve vade girin!" : "Enter valid loan amount and months!");
return;
}
const result = calculateLoan(principal, months, ratePercent);
const monthlyStr = Math.round(result.monthlyPayment).toLocaleString("tr-TR");
const totalStr = Math.round(result.totalPayment).toLocaleString("tr-TR");
const interestStr = Math.round(result.totalInterest).toLocaleString("tr-TR");
simResult.classList.remove("hidden");
if (currentLang === "tr") {
simResult.innerHTML = '📅 Aylık Taksit: ' + monthlyStr + ' TL<br>💰 Toplam Geri Ödeme: ' + totalStr + ' TL<br>📈 Toplam Faiz Maliyeti: ' + interestStr + ' TL';
} else {
simResult.innerHTML = '📅 Monthly Payment: ' + monthlyStr + ' TL<br>💰 Total Payback: ' + totalStr + ' TL<br>📈 Total Interest Paid: ' + interestStr + ' TL';
}
});
}
// Language Toggle Function
function toggleLanguage() {
currentLang = currentLang === "tr" ? "en" : "tr";
const isTr = currentLang === "tr";
document.documentElement.lang = currentLang;
document.getElementById("appFooterDock").setAttribute("aria-label", isTr ? "Uygulama bağlantıları" : "App links");
versionBackdrop.setAttribute("aria-label", isTr ? "Sürüm geçmişini kapat" : "Close version history");
if (languageButton) languageButton.textContent = isTr ? "EN" : "TR";
if (authLangBtn) authLangBtn.textContent = isTr ? "EN" : "TR";
if (authTitle) authTitle.textContent = isTr ? "🔐 Hesap Girişi" : "🔐 Account Login";
if (authSubtitle) authSubtitle.textContent = isTr
? "Verilerinin kalıcı olması için giriş yap veya yeni hesap oluştur."
: "Sign in or create a permanent account to save your data.";
if (usernameInput) usernameInput.placeholder = isTr ? "Kullanıcı Adı" : "Username";
if (passwordInput) passwordInput.placeholder = isTr ? "Şifre" : "Password";
if (loginBtn) loginBtn.textContent = isTr ? "Giriş Yap" : "Sign In";
if (registerBtn) registerBtn.textContent = isTr ? "Kalıcı Hesap Oluştur" : "Create Permanent Account";
if (guestBtn) guestBtn.textContent = isTr ? "⚡ Hızlıca Gir (Kaydetmez)" : "⚡ Quick Enter (Not Saved)";
if (guideKicker) guideKicker.textContent = isTr ? "AİLECE DAHA GÜÇLÜ" : "STRONGER TOGETHER";
if (guideTitle) guideTitle.textContent = isTr ? "Ailece hedeflere doğru" : "Family goals, made together";
if (guideIntro) guideIntro.textContent = isTr
    ? "Geliri ihtiyaçlara, keyfe ve geleceğe dengeli ayırın."
    : "Balance today's needs, little joys, and tomorrow's goals.";
if (guidePlanTitle) guidePlanTitle.textContent = isTr ? "Gelirine göre önerilen hedefler" : "Suggested targets from income";
if (guideNeedsTitle) guideNeedsTitle.textContent = isTr ? "Temel ihtiyaçlar" : "Needs";
if (guideNeedsText) guideNeedsText.textContent = isTr
    ? "Kira, faturalar, market, ulaşım ve diğer"
    : "Housing, bills, groceries, transport, other";
if (guideWantsTitle) guideWantsTitle.textContent = isTr ? "İstekler ve keyif" : "Wants and fun";
if (guideWantsText) guideWantsText.textContent = isTr
    ? "Yeme-içme, giyim, eğlence"
    : "Dining, clothing, entertainment";
if (guideSavingsTitle) guideSavingsTitle.textContent = isTr ? "Kalan bakiye" : "Remaining balance";
if (guideSavingsText) guideSavingsText.textContent = isTr
    ? "Gelirin %20'si birikim hedefi"
    : "20% of income is the savings target";
if (guidePlanNote) guidePlanNote.textContent = isTr
    ? "Tüm kayıtlı işlemlere göre hesaplanır; aylık değildir. Ailenize göre uyarlayın."
    : "Based on all recorded transactions, not monthly. Adjust it to your family.";
if (guideActionLabel) guideActionLabel.textContent = isTr ? "İlk işlemini ekle" : "Add your first transaction";
if (title) title.textContent = isTr ? "💰 Aile Bütçe Asistanı" : "💰 Family Budget Assistant";
if (balanceTitle) balanceTitle.textContent = isTr ? "Toplam Bakiye" : "Total Balance";
if (totalIncomeLabel) totalIncomeLabel.textContent = isTr ? "Bu Ayın Geliri" : "Income This Month";
if (totalExpenseLabel) totalExpenseLabel.textContent = isTr ? "Bu Ayın Gideri" : "Expenses This Month";
if (categorySummaryTitle) categorySummaryTitle.textContent = isTr ? "🧾 Harcama Kategorileri" : "🧾 Spending Categories";
if (description) description.placeholder = isTr ? "Açıklama (Örn: Market, Maaş)" : "Description (e.g. Grocery, Salary)";
if (amount) amount.placeholder = isTr ? "Tutar (TL)" : "Amount (TL)";
if (incomeOption) incomeOption.textContent = isTr ? "Gelir (+)" : "Income (+)";
if (expenseOption) expenseOption.textContent = isTr ? "Gider (-)" : "Expense (-)";
if (category) {
    category.setAttribute("aria-label", isTr ? "İşlem kategorisi" : "Transaction category");
    renderCategoryOptions(category.value);
}
if (addButton) {
    addButton.textContent = editingTransactionId !== null
        ? (isTr ? "Değişikliği Kaydet" : "Save Changes")
        : (isTr ? "İşlemi Ekle" : "Add Transaction");
}
if (cancelEditButton) cancelEditButton.textContent = isTr ? "Düzenlemeyi iptal et" : "Cancel editing";
if (logoutBtn) logoutBtn.textContent = isTr ? "Çıkış" : "Logout";
if (exportButtonLabel) exportButtonLabel.textContent = isTr ? "İndir" : "Export";
if (exportButton) exportButton.setAttribute("aria-label", isTr ? "İşlemleri indir" : "Download transactions");
if (analyticsTitle) analyticsTitle.textContent = isTr ? "📊 Bütçe Analizi & Kredi" : "📊 Budget Analytics & Loan";
document.getElementById("monthlyAnalysisTitle").textContent = isTr ? "📅 Aylık finansal analiz" : "📅 Monthly financial analysis";
document.getElementById("monthlyComparisonLabel").textContent = isTr ? "Önceki aya göre" : "Compared with previous month";
document.getElementById("topExpenseCategoryLabel").textContent = isTr ? "En çok harcanan kategori" : "Top spending category";
document.getElementById("monthlySavingsRateLabel").textContent = isTr ? "Tasarruf oranı" : "Savings rate";
analysisMonth.setAttribute("aria-label", isTr ? "Analiz ayı" : "Analysis month");
transactionSearch.placeholder = isTr ? "İşlemlerde ara" : "Search transactions";
transactionSearch.setAttribute("aria-label", transactionSearch.placeholder);
transactionTypeFilter.setAttribute("aria-label", isTr ? "İşlem türüne göre filtrele" : "Filter by transaction type");
transactionCategoryFilter.setAttribute("aria-label", isTr ? "Kategoriye göre filtrele" : "Filter by category");
document.getElementById("filterAllTypes").textContent = isTr ? "Tüm türler" : "All types";
document.getElementById("filterIncomeType").textContent = isTr ? "Gelir" : "Income";
document.getElementById("filterExpenseType").textContent = isTr ? "Gider" : "Expense";
transactionDateFrom.setAttribute("aria-label", isTr ? "Başlangıç tarihi" : "Start date");
transactionDateTo.setAttribute("aria-label", isTr ? "Bitiş tarihi" : "End date");
document.querySelector(".transaction-filters").setAttribute("aria-label", isTr ? "İşlem filtreleri" : "Transaction filters");
clearFiltersButton.textContent = isTr ? "Filtreleri temizle" : "Clear filters";
showGoalFormButton.textContent = isTr ? "+ Hedef" : "+ Goal";
document.getElementById("savingsGoalsTitle").textContent = isTr ? "🎯 Birikim hedeflerim" : "🎯 My savings goals";
goalNameInput.placeholder = isTr ? "Hedef adı (Örn: Tatil)" : "Goal name (e.g. Vacation)";
goalTargetInput.placeholder = isTr ? "Hedef tutarı (TL)" : "Target amount (TL)";
saveGoalButton.textContent = isTr ? "Hedefi kaydet" : "Save goal";
if (simTitle) simTitle.textContent = isTr ? "🏦 Kredi & Taksit Simülatörü" : "🏦 Loan & Installment Simulator";
if (loanAmountInput) loanAmountInput.placeholder = isTr ? "Kredi Tutarı (Örn: 1000000 TL)" : "Loan Amount (e.g. 1000000 TL)";
if (loanMonthsInput) loanMonthsInput.placeholder = isTr ? "Vade (Ay - Örn: 24)" : "Term (Months - e.g. 24)";
if (interestRateInput) interestRateInput.placeholder = isTr ? "Aylık Faiz (%)" : "Monthly Interest (%)";
if (calcLoanBtn) calcLoanBtn.textContent = isTr ? "Krediyi Hesapla" : "Calculate Loan";
if (versionButtonText) versionButtonText.textContent = isTr ? "Sürüm 1.1" : "Version 1.1";
document.getElementById("versionEyebrow").textContent = isTr ? "GÜNCELLEME GÜNLÜĞÜ" : "UPDATE LOG";
document.getElementById("versionModalTitle").textContent = isTr ? "Sürüm geçmişi" : "Version history";
document.getElementById("releaseStatus").textContent = isTr ? "GÜNCEL" : "CURRENT";
document.getElementById("releaseTitleV11").textContent = isTr
    ? "v1.1 · Kurulabilir web uygulaması"
    : "v1.1 · Installable web app";
document.getElementById("releaseDateV11").textContent = isTr ? "27 Kasım 2026" : "November 27, 2026";
document.getElementById("releaseSummaryV11").textContent = isTr
    ? "Uygulamayı desteklenen mobil cihazlara ve bilgisayarlara tarayıcı üzerinden yükleyin."
    : "Install the app from the browser on supported mobile devices and desktop computers.";
document.getElementById("releaseItemV11a").textContent = isTr
    ? "Android ve masaüstü tarayıcılarda ana ekrana/uygulama menüsüne yükleme"
    : "Install from supported Android and desktop browsers";
document.getElementById("releaseItemV11b").textContent = isTr
    ? "iPhone ve iPad için ana ekrana ekleme yönergeleri"
    : "Add-to-Home-Screen instructions for iPhone and iPad";
document.getElementById("releaseItemV11c").textContent = isTr
    ? "Çevrimdışı açılış için önbelleğe alınan uygulama arayüzü"
    : "A cached app shell for offline launch";
document.getElementById("previousReleaseStatus").textContent = isTr ? "ÖNCEKİ SÜRÜM" : "PREVIOUS RELEASE";
document.getElementById("releaseTitleV10").textContent = isTr
    ? "v1.0 · Bütçe yönetimi"
    : "v1.0 · Budget management";
document.getElementById("releaseDateV10").textContent = isTr ? "27 Kasım 2026" : "November 27, 2026";
document.getElementById("releaseSummaryV10").textContent = isTr
    ? "Aylık analiz, işlem yönetimi, birikim hedefleri ve koyu tema."
    : "Monthly analytics, transaction management, savings goals, and dark mode.";
document.getElementById("roadmapLabel").textContent = isTr ? "ÜRÜN YOL HARİTASI" : "PRODUCT ROADMAP";
document.getElementById("roadmapV12").textContent = isTr
    ? "Günlük kullanım iyileştirmeleri ve erişilebilirlik"
    : "Everyday usability and accessibility improvements";
document.getElementById("roadmapV13").textContent = isTr
    ? "Daha kapsamlı raporlar ve veri yedekleme"
    : "Richer reports and data backup";
document.getElementById("roadmapV20").textContent = isTr
    ? "Kapsamlı, güvenilir ana sürüm hedefi"
    : "Target for a complete, dependable major release";
document.getElementById("roadmapDisclaimer").textContent = isTr
    ? "Yol haritası kullanıcı geri bildirimine göre değişebilir. v2.0 son büyük sürüm hedefidir; gerekli bakım ve güvenlik güncellemeleri sonrasında da devam edebilir."
    : "The roadmap may change based on user feedback. v2.0 is the target final major release; maintenance and security updates may continue afterward.";
document.getElementById("installHelpTitle").textContent = isTr ? "UYGULAMAYI KURMA" : "HOW TO INSTALL";
document.getElementById("installHelpText").textContent = isTr
    ? "Android ve masaüstü: tarayıcıdaki “Uygulamayı yükle” seçeneğini kullanın. iPhone/iPad: Safari’de Paylaş → Ana Ekrana Ekle. Kurulum için internet gerekir. Çevrimdışı açılışta API hesap ve kayıt işlemleri kullanılamaz."
    : "Android and desktop: use your browser’s Install option. iPhone/iPad: in Safari, tap Share → Add to Home Screen. Installation requires internet. Account and data features need an internet connection.";
installButtonText.textContent = isTr ? "Uygulamayı yükle" : "Install app";
installButton.setAttribute("aria-label", isTr ? "Uygulamayı yükle" : "Install app");
closeVersionButton.setAttribute("aria-label", isTr ? "Kapat" : "Close");
applyTheme();
renderCategoryFilterOptions();
renderFilteredTransactions();
renderMonthlyAnalysis(currentTransactions);
renderSavingsGoals(currentSavingsGoals);
if (currentUser) {
if (currentUser.isGuest) {
welcomeUser.textContent = isTr ? "⚡ Misafir (Kaydetmez)" : "⚡ Guest (Not Saved)";
}
loadTransactions();
loadSavingsGoals();
}
}
if (languageButton) languageButton.addEventListener("click", toggleLanguage);
if (authLangBtn) authLangBtn.addEventListener("click", toggleLanguage);

const versionButton = document.getElementById("versionButton");
const versionButtonText = document.getElementById("versionButtonText");
const versionModal = document.getElementById("versionModal");
const closeVersionButton = document.getElementById("closeVersionButton");
const versionBackdrop = document.getElementById("versionBackdrop");
let pendingInstallPrompt = null;

function openVersionModal() {
    versionModal.classList.remove("hidden");
    document.body.classList.add("modal-open");
    closeVersionButton.focus();
}

function closeVersionModal() {
    versionModal.classList.add("hidden");
    document.body.classList.remove("modal-open");
    versionButton.focus();
}

versionButton.addEventListener("click", openVersionModal);
closeVersionButton.addEventListener("click", closeVersionModal);
versionBackdrop.addEventListener("click", closeVersionModal);
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !versionModal.classList.contains("hidden")) {
        closeVersionModal();
    }
});

function isAppInstalled() {
    return window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;
}

if (isAppInstalled()) {
    installButton.classList.add("hidden");
}

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    pendingInstallPrompt = event;
    installButton.classList.remove("hidden");
});

window.addEventListener("appinstalled", () => {
    pendingInstallPrompt = null;
    installButton.classList.add("hidden");
});

installButton.addEventListener("click", async () => {
    if (!pendingInstallPrompt) {
        openVersionModal();
        document.getElementById("installHelp").scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
    }

    try {
        pendingInstallPrompt.prompt();
        const choice = await pendingInstallPrompt.userChoice;
        pendingInstallPrompt = null;
        if (choice.outcome === "accepted") {
            installButton.classList.add("hidden");
            return;
        }
    } catch (error) {
        console.error("App installation prompt failed:", error);
        pendingInstallPrompt = null;
    }

    openVersionModal();
    document.getElementById("installHelp").scrollIntoView({ behavior: "smooth", block: "nearest" });
});

if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
            .catch((error) => console.error("Service worker registration failed:", error));
    });
}
// Start Application
checkSession();
