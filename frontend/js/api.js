const isLocalFrontend =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

const configuredApiUrl = document
    .querySelector('meta[name="api-base-url"]')
    ?.content
    ?.trim();

// Set api-base-url in frontend/index.html to the public Railway/hosting URL.
// Local development automatically uses the ASP.NET Core API on port 5098.
const BASE_URL = configuredApiUrl
    ? configuredApiUrl.replace(/\/$/, "") + "/api"
    : isLocalFrontend
        ? "http://localhost:5098/api"
        : "/api";

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

// Delete a transaction by ID from cloud database
export async function removeTransaction(id) {
    const response = await fetch(`${BASE_URL}/transactions/${id}`, {
        method: "DELETE"
    });
    if (!response.ok) throw new Error("Failed to delete transaction");
}
