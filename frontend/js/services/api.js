const isLocalFrontend =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

const configuredApiUrl = document
    .querySelector('meta[name="api-base-url"]')
    ?.content
    ?.trim();

// The meta tag can override the production API URL. Local development uses port 5098.
const BASE_URL = configuredApiUrl
    ? configuredApiUrl.replace(/\/$/, "") + "/api"
    : isLocalFrontend
        ? "http://localhost:5098/api"
        : "https://family-budget-assistant-production.up.railway.app/api";

// Register a new user account on cloud SQLite
export async function registerUser(username, password) {
    const response = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || "Registration failed");
    }
    return await response.json();
}

// Login to an existing user account
export async function loginUser(username, password) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    if (!response.ok) {
        throw new Error("Invalid username or password.");
    }
    return await response.json();
}

// Fetch all transactions for a specific user from cloud database
export async function fetchTransactions(userId) {
    const response = await fetch(`${BASE_URL}/transactions/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch transactions");
    return await response.json();
}

// Create a new transaction on cloud database
export async function createTransaction(transactionData) {
    const response = await fetch(`${BASE_URL}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData)
    });
    if (!response.ok) throw new Error("Failed to save transaction");
    return await response.json();
}

// Update a transaction, including its selected transaction date.
export async function updateTransaction(id, transactionData) {
    const response = await fetch(`${BASE_URL}/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData)
    });
    if (!response.ok) throw new Error("Failed to update transaction");
    return await response.json();
}

// Delete a transaction by ID from cloud database
export async function removeTransaction(id) {
    const response = await fetch(`${BASE_URL}/transactions/${id}`, {
        method: "DELETE"
    });
    if (!response.ok) throw new Error("Failed to delete transaction");
}

export async function fetchSavingsGoals(userId) {
    const response = await fetch(`${BASE_URL}/savingsgoals/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch savings goals");
    return await response.json();
}

export async function createSavingsGoal(goalData) {
    const response = await fetch(`${BASE_URL}/savingsgoals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalData)
    });
    if (!response.ok) throw new Error("Failed to save savings goal");
    return await response.json();
}

export async function contributeToSavingsGoal(id, userId, contributionAmount) {
    const response = await fetch(`${BASE_URL}/savingsgoals/${id}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount: contributionAmount })
    });
    if (!response.ok) throw new Error("Failed to update savings goal");
    return await response.json();
}

export async function removeSavingsGoal(id, userId) {
    const response = await fetch(`${BASE_URL}/savingsgoals/${id}?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE"
    });
    if (!response.ok) throw new Error("Failed to delete savings goal");
}

export async function restoreBackup(userId, username, password, backup) {
    const response = await fetch(`${BASE_URL}/backups/${userId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...backup, username, password })
    });
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to restore backup");
    }
    return await response.json();
}
