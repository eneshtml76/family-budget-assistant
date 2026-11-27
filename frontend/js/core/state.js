export const state = {
    currentUser: JSON.parse(localStorage.getItem("budgetUser")) || null,
    guestTransactions: [],
    currentTransactions: [],
    guestSavingsGoals: [],
    currentSavingsGoals: [],
    editingTransactionId: null,
    balance: 0,
    currentLang: "tr"
};
