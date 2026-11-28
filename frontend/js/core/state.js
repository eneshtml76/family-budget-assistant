export const state = {
    currentUser: JSON.parse(localStorage.getItem("budgetUser")) || null,
    guestTransactions: [],
    currentTransactions: [],
    transactionsLoaded: false,
    guestSavingsGoals: [],
    currentSavingsGoals: [],
    savingsGoalsLoaded: false,
    editingTransactionId: null,
    balance: 0,
    currentLang: "tr",
    currentCurrency: "TRY",
    currencyRates: { TRY: 1 },
    currencyRateDate: null
};
