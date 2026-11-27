const BASE_URL = "https://railway.app";


// Register a new user account
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
        const msg = await response.text();
        throw new Error(msg || "Login failed");
    }
    return await response.json();
}

// Fetch all transactions for a specific user
export async function fetchTransactions(userId) {
    const response = await fetch(`${BASE_URL}/transactions/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch transactions");
    return await response.json();
}


// Create a new transaction linked to the user
export async function createTransaction(transactionData) {
    const response = await fetch(`${BASE_URL}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData)
    });
    if (!response.ok) throw new Error("Failed to save transaction");
    return await response.json();
}

// Delete a transaction by ID
export async function removeTransaction(id) {
    const response = await fetch(`${BASE_URL}/transactions/${id}`, {
        method: "DELETE"
    });
    if (!response.ok) throw new Error("Failed to delete transaction");
}
