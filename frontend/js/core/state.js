const storedUser = JSON.parse(localStorage.getItem("budgetUser")) || null;
if (storedUser && !storedUser.isGuest && !storedUser.token) {
    localStorage.removeItem("budgetUser");
}

export const state = {
    currentUser: storedUser?.isGuest || storedUser?.token ? storedUser : null,
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
