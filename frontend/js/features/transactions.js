import {
    createTransaction,
    fetchTransactions,
    removeTransaction,
    updateTransaction
} from "../services/api.js";
import { categories, categoryLabel } from "../core/categories.js";
import { formatMoney, currentMonthValue, localDateValue, transactionDateValue } from "../core/formatting.js";
import { state } from "../core/state.js";
import { dom } from "../core/dom.js";
import {
    renderBudgetPlan,
    renderCategorySummary,
    renderMonthlyAnalysis
} from "./analytics.js";

const {
    addButton,
    amount,
    analysisMonth,
    cancelEditButton,
    category,
    clearFiltersButton,
    description,
    exportButton,
    transactionDate,
    totalBalance,
    transactionCategoryFilter,
    transactionDateFrom,
    transactionDateTo,
    transactionEmptyMessage,
    transactionList,
    transactionSearch,
    transactionTypeFilter,
    type
} = dom;

export function renderCategoryOptions(selectedCategory) {
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

export function renderCategoryFilterOptions() {
    const selectedCategory = transactionCategoryFilter.value;
    transactionCategoryFilter.replaceChildren();
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = state.currentLang === "tr" ? "Tüm kategoriler" : "All categories";
    transactionCategoryFilter.appendChild(allOption);
    Object.entries(categories).forEach(([categoryId]) => {
        const option = document.createElement("option");
        option.value = categoryId;
        option.textContent = categoryLabel(categoryId);
        transactionCategoryFilter.appendChild(option);
    });
    transactionCategoryFilter.value = selectedCategory || "all";
}

export function renderFilteredTransactions() {
    const searchText = transactionSearch.value.trim().toLocaleLowerCase(state.currentLang === "tr" ? "tr-TR" : "en-US");
    const typeFilter = transactionTypeFilter.value;
    const categoryFilter = transactionCategoryFilter.value;
    const fromDate = transactionDateFrom.value;
    const toDate = transactionDateTo.value;
    const filteredTransactions = state.currentTransactions.filter((item) => {
        const searchableText = (item.description + " " + categoryLabel(item.category))
            .toLocaleLowerCase(state.currentLang === "tr" ? "tr-TR" : "en-US");
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
        transactionEmptyMessage.textContent = state.currentTransactions.length === 0
            ? (state.currentLang === "tr" ? "Henüz işlem yok." : "No transactions yet.")
            : (state.currentLang === "tr" ? "Bu filtrelerle eşleşen işlem bulunamadı." : "No transactions match these filters.");
    }
}

export async function loadTransactions() {
    if (!state.currentUser) {
        state.transactionsLoaded = false;
        return false;
    }
    try {
        const transactions = state.currentUser.isGuest
            ? state.guestTransactions
            : await fetchTransactions(state.currentUser.userId);

        state.currentTransactions = transactions;
        state.transactionsLoaded = true;
        state.balance = 0;
        let totalIncome = 0;

        transactions.forEach((item) => {
            if (item.type === "gelir") {
                state.balance += item.amount;
                totalIncome += item.amount;
            } else {
                state.balance -= item.amount;
            }
        });

        totalBalance.textContent = formatMoney(state.balance);
        renderMonthlyAnalysis(transactions);
        renderFilteredTransactions();
        renderCategorySummary(transactions);
        renderBudgetPlan(transactions, totalIncome, state.balance);
        return true;
    } catch (error) {
        state.transactionsLoaded = false;
        console.error("Error loading transactions:", error);
        transactionEmptyMessage.classList.remove("hidden");
        transactionEmptyMessage.textContent = state.currentLang === "tr"
            ? "İşlemler yüklenemedi: " + error.message
            : "Could not load transactions: " + error.message;
        return false;
    }
}

function downloadTransactions() {
    const isTr = state.currentLang === "tr";
    const delimiter = ";";
    const rows = [
        isTr ? ["Tarih", "Açıklama", "Tür", "Kategori", "Tutar (TL)"] : ["Date", "Description", "Type", "Category", "Amount (TL)"],
        ...state.currentTransactions.map((transaction) => [
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

export function resetTransactionForm() {
    state.editingTransactionId = null;
    description.value = "";
    amount.value = "";
    transactionDate.value = localDateValue(new Date());
    renderCategoryOptions();
    addButton.textContent = state.currentLang === "tr" ? "İşlemi Ekle" : "Add Transaction";
    cancelEditButton.classList.add("hidden");
}

function startEditingTransaction(item) {
    state.editingTransactionId = item.id;
    description.value = item.description;
    amount.value = item.amount;
    transactionDate.value = item.createdAt ? transactionDateValue(item.createdAt) : "";
    type.value = item.type;
    renderCategoryOptions(item.category);
    addButton.textContent = state.currentLang === "tr" ? "Değişikliği Kaydet" : "Save Changes";
    cancelEditButton.classList.remove("hidden");
    description.scrollIntoView({ behavior: "smooth", block: "center" });
    description.focus({ preventScroll: true });
}

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
    if (item.createdAt) {
        const [year, month, day] = transactionDateValue(item.createdAt).split("-").map(Number);
        dateSpan.textContent = new Date(year, month - 1, day)
            .toLocaleDateString(state.currentLang === "tr" ? "tr-TR" : "en-US");
    } else {
        dateSpan.textContent = state.currentLang === "tr" ? "Tarih bilgisi yok" : "Date unavailable";
    }
    descriptionGroup.append(descSpan, categorySpan, dateSpan);

    const rightDiv = document.createElement("div");
    rightDiv.className = "item-right";

    const amountSpan = document.createElement("span");
    const isIncome = item.type === "gelir";
    amountSpan.textContent = (isIncome ? "+" : "-") + formatMoney(item.amount);
    amountSpan.className = isIncome ? "income-text" : "expense-text";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = state.currentLang === "tr" ? "Düzenle" : "Edit";
    editButton.className = "edit-btn";
    editButton.setAttribute("aria-label", state.currentLang === "tr" ? "İşlemi düzenle" : "Edit transaction");
    editButton.addEventListener("click", () => startEditingTransaction(item));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "✕";
    deleteButton.className = "delete-btn";
    deleteButton.setAttribute("aria-label", state.currentLang === "tr" ? "İşlemi sil" : "Delete transaction");
    deleteButton.addEventListener("click", async () => {
        try {
            if (state.currentUser.isGuest) {
                state.guestTransactions = state.guestTransactions.filter((transaction) => transaction.id !== item.id);
            } else {
                await removeTransaction(item.id);
            }
            if (state.editingTransactionId === item.id) resetTransactionForm();
            await loadTransactions();
        } catch (error) {
            console.error("Error deleting transaction:", error);
            alert(state.currentLang === "tr" ? "İşlem silinemedi: " + error.message : "Could not delete transaction: " + error.message);
        }
    });

    rightDiv.append(amountSpan, editButton, deleteButton);
    listItem.appendChild(descriptionGroup);
    listItem.appendChild(rightDiv);
    transactionList.prepend(listItem);
}

export function initializeTransactions() {
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
    analysisMonth.addEventListener("change", () => renderMonthlyAnalysis(state.currentTransactions));
    transactionDate.value = localDateValue(new Date());
    type.addEventListener("change", () => renderCategoryOptions());
    renderCategoryOptions();

    if (exportButton) exportButton.addEventListener("click", downloadTransactions);
    window.addEventListener("budget:currencychange", () => {
        if (!state.transactionsLoaded) return;
        totalBalance.textContent = formatMoney(state.balance);
        const totalIncome = state.currentTransactions
            .filter((item) => item.type === "gelir")
            .reduce((total, item) => total + item.amount, 0);
        renderMonthlyAnalysis(state.currentTransactions);
        renderFilteredTransactions();
        renderCategorySummary(state.currentTransactions);
        renderBudgetPlan(state.currentTransactions, totalIncome, state.balance);
    });
    if (cancelEditButton) cancelEditButton.addEventListener("click", resetTransactionForm);
    if (addButton) {
        addButton.addEventListener("click", async () => {
            const descValue = description.value.trim();
            const amnt = Number(amount.value);
            const typeValue = type.value;
            const categoryValue = category.value;

            if (descValue === "" || !Number.isFinite(amnt) || amnt <= 0 || !transactionDate.value) {
                alert(state.currentLang === "tr"
                    ? "Açıklama, geçerli tutar ve işlem tarihi girin."
                    : "Enter a description, valid amount, and transaction date.");
                return;
            }

            try {
                const transactionData = {
                    userId: state.currentUser.userId,
                    description: descValue,
                    amount: amnt,
                    type: typeValue,
                    category: categoryValue,
                    createdAt: new Date(transactionDate.value + "T00:00:00.000Z").toISOString()
                };
                if (state.editingTransactionId !== null) {
                    if (state.currentUser.isGuest) {
                        state.guestTransactions = state.guestTransactions.map((item) =>
                            item.id === state.editingTransactionId
                                ? { ...item, ...transactionData }
                                : item
                        );
                    } else {
                        await updateTransaction(state.editingTransactionId, transactionData);
                    }
                } else if (state.currentUser.isGuest) {
                    state.guestTransactions.push({
                        ...transactionData,
                        id: Date.now()
                    });
                } else {
                    await createTransaction(transactionData);
                }
                resetTransactionForm();
                await loadTransactions();
            } catch (error) {
                console.error("Error saving transaction:", error);
                alert(state.currentLang === "tr" ? "İşlem kaydedilemedi: " + error.message : "Could not save transaction: " + error.message);
            }
        });
    }
}
