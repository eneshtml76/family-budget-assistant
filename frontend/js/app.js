import { registerUser, loginUser, fetchTransactions, createTransaction, removeTransaction } from "./api.js";
import { updateChart, calculateLoan } from "./chart.js";
import { seferihisarDonerSpots } from "./foodData.js";

// Auth DOM Elements
const authSection = document.getElementById("authSection");
const dashboardSection = document.getElementById("dashboardSection");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const guestBtn = document.getElementById("guestBtn");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeUser = document.getElementById("welcomeUser");

// Budget DOM Elements
const totalBalance = document.getElementById("totalBalance");
const totalIncomeAmount = document.getElementById("totalIncomeAmount");
const totalExpenseAmount = document.getElementById("totalExpenseAmount");
const description = document.getElementById("description");
const amount = document.getElementById("amount");
const type = document.getElementById("type");
const addButton = document.getElementById("addButton");
const transactionList = document.getElementById("transactionList");

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
const simTitle = document.getElementById("simTitle");
const foodGuideTitle = document.getElementById("foodGuideTitle");
const foodGuideSub = document.getElementById("foodGuideSub");
const locationBadge = document.getElementById("locationBadge");

// Application State
let currentUser = JSON.parse(localStorage.getItem("budgetUser")) || null;
let guestTransactions = []; // Temporary RAM list for Guest Mode (not saved to server)
let balance = 0;
let currentLang = "tr";

// Check if user is already logged in on page load
function checkSession() {
    if (currentUser) {
        authSection.classList.add("hidden");
        dashboardSection.classList.remove("hidden");
        if (currentUser.isGuest) {
            welcomeUser.textContent = currentLang === "tr" ? "⚡ Misafir (Kaydetmez)" : "⚡ Guest (Not Saved)";
        } else {
            welcomeUser.textContent = `👤 ${currentUser.username}`;
        }
        loadTransactions();
        renderLocalFoodList();
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
        checkSession();
    });
}

// Render Seferihisar Local Food Guide on the Left Card
function renderLocalFoodList() {
    const listContainer = document.getElementById("localFoodList");
    if (!listContainer) return;

    const isTr = currentLang === "tr";
    listContainer.innerHTML = "";

    seferihisarDonerSpots.forEach((spot) => {
        const card = document.createElement("div");
        card.className = "food-item";

        card.innerHTML = `
            <div class="food-top">
                <span class="food-name">${spot.name}</span>
                <span class="food-rating">⭐ ${spot.rating}</span>
            </div>
            <div class="food-desc">${spot.item} — ${isTr ? spot.noteTr : spot.noteEn}</div>
            <div class="food-bottom">
                <span class="food-price">${spot.price} TL</span>
                <button class="quick-spend-btn" type="button">
                    ${isTr ? "Bütçeden Düş (-)" : "Deduct (-)"}
                </button>
            </div>
        `;

        // Deduct meal cost from budget (Guest RAM or Cloud SQLite)
        const btn = card.querySelector(".quick-spend-btn");
        btn.addEventListener("click", async () => {
            if (!currentUser) return;
            try {
                if (currentUser.isGuest) {
                    guestTransactions.push({
                        id: Date.now(),
                        description: `${spot.name} (${spot.item})`,
                        amount: spot.price,
                        type: "gider"
                    });
                } else {
                    await createTransaction({
                        userId: currentUser.userId,
                        description: `${spot.name} (${spot.item})`,
                        amount: spot.price,
                        type: "gider"
                    });
                }
                await loadTransactions();
            } catch (error) {
                alert(isTr ? "Sunucuya bağlanılamadı!" : "Could not connect to server!");
            }
        });

        listContainer.appendChild(card);
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

        transactionList.innerHTML = "";
        balance = 0;
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach((item) => {
            if (item.type === "gelir") {
                balance += item.amount;
                totalIncome += item.amount;
            } else {
                balance -= item.amount;
                totalExpense += item.amount;
            }
            renderTransactionItem(item.id, item.description, item.amount, item.type);
        });

        totalBalance.textContent = `${balance.toLocaleString("tr-TR")} TL`;
        if (totalIncomeAmount) totalIncomeAmount.textContent = `+${totalIncome.toLocaleString("tr-TR")} TL`;
        if (totalExpenseAmount) totalExpenseAmount.textContent = `-${totalExpense.toLocaleString("tr-TR")} TL`;

        updateChart(totalIncome, totalExpense, currentLang === "tr");
    } catch (error) {
        console.error("Error loading transactions:", error);
    }
}

function renderTransactionItem(id, descValue, amnt, typeValue) {
    const listItem = document.createElement("li");

    const descSpan = document.createElement("span");
    descSpan.textContent = descValue;

    const rightDiv = document.createElement("div");
    rightDiv.className = "item-right";

    const amountSpan = document.createElement("span");
    const isIncome = typeValue === "gelir";
    amountSpan.textContent = `${isIncome ? "+" : "-"}${amnt.toLocaleString("tr-TR")} TL`;
    amountSpan.className = isIncome ? "income-text" : "expense-text";

    const delBtn = document.createElement("button");
    delBtn.textContent = "✕";
    delBtn.className = "delete-btn";
    delBtn.onclick = async () => {
        if (currentUser.isGuest) {
            guestTransactions = guestTransactions.filter(t => t.id !== id);
        } else {
            await removeTransaction(id);
        }
        await loadTransactions();
    };

    rightDiv.appendChild(amountSpan);
    rightDiv.appendChild(delBtn);
    listItem.appendChild(descSpan);
    listItem.appendChild(rightDiv);
    transactionList.prepend(listItem);
}

// Add transaction linked to currentUser
if (addButton) {
    addButton.addEventListener("click", async () => {
        const descValue = description.value.trim();
        const amnt = Number(amount.value);
const typeValue = type.value;
if (descValue === "" || amnt <= 0) {
alert(currentLang === "tr" ? "Geçerli bilgi girin!" : "Enter valid info!");
return;
}
try {
if (currentUser.isGuest) {
guestTransactions.push({
id: Date.now(),
description: descValue,
amount: amnt,
type: typeValue
});
} else {
await createTransaction({
userId: currentUser.userId,
description: descValue,
amount: amnt,
type: typeValue
});
}
description.value = "";
amount.value = "";
await loadTransactions();
} catch (error) {
alert(currentLang === "tr" ? "Sunucuya bağlanılamadı!" : "Could not connect to server!");
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
simResult.classList.remove("hidden");
if (currentLang === "tr") {
simResult.innerHTML = <div>📅 <strong>Aylık Taksit:</strong> ${Math.round(result.monthlyPayment).toLocaleString("tr-TR")} TL</div> <div>💰 <strong>Toplam Geri Ödeme:</strong> ${Math.round(result.totalPayment).toLocaleString("tr-TR")} TL</div> <div>📈 <strong>Toplam Faiz Maliyeti:</strong> ${Math.round(result.totalInterest).toLocaleString("tr-TR")} TL</div>;
} else {
simResult.innerHTML = <div>📅 <strong>Monthly Payment:</strong> ${Math.round(result.monthlyPayment).toLocaleString("tr-TR")} TL</div> <div>💰 <strong>Total Payback:</strong> ${Math.round(result.totalPayment).toLocaleString("tr-TR")} TL</div> <div>📈 <strong>Total Interest Paid:</strong> ${Math.round(result.totalInterest).toLocaleString("tr-TR")} TL</div>;
}
});
}
// Language Toggle Function (Safe & Crash-Proof)
function toggleLanguage() {
currentLang = currentLang === "tr" ? "en" : "tr";
const isTr = currentLang === "tr";
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
if (foodGuideTitle) foodGuideTitle.textContent = isTr ? "🥙 Seferihisar Döner Rehberi" : "🥙 Seferihisar Doner Guide";
if (locationBadge) locationBadge.textContent = isTr ? "📍 Konum: Seferihisar / İzmir" : "📍 Location: Seferihisar / Izmir";
if (foodGuideSub) foodGuideSub.textContent = isTr
? "Güncel menü fiyatları ve puanlar. Tek tıkla bütçenden düşebilirsin."
: "Live menu prices & ratings. Deduct from your budget in one click.";
if (title) title.textContent = isTr ? "💰 Aile Bütçe Asistanı" : "💰 Family Budget Assistant";
if (balanceTitle) balanceTitle.textContent = isTr ? "Toplam Bakiye" : "Total Balance";
if (totalIncomeLabel) totalIncomeLabel.textContent = isTr ? "Toplam Gelir" : "Total Income";
if (totalExpenseLabel) totalExpenseLabel.textContent = isTr ? "Toplam Gider" : "Total Expense";
if (description) description.placeholder = isTr ? "Açıklama (Örn: Market, Maaş)" : "Description (e.g. Grocery, Salary)";
if (amount) amount.placeholder = isTr ? "Tutar (TL)" : "Amount (TL)";
if (incomeOption) incomeOption.textContent = isTr ? "Gelir (+)" : "Income (+)";
if (expenseOption) expenseOption.textContent = isTr ? "Gider (-)" : "Expense (-)";
if (addButton) addButton.textContent = isTr ? "İşlemi Ekle" : "Add Transaction";
if (logoutBtn) logoutBtn.textContent = isTr ? "Çıkış" : "Logout";
if (analyticsTitle) analyticsTitle.textContent = isTr ? "📊 Bütçe Analizi & Kredi" : "📊 Budget Analytics & Loan";
if (simTitle) simTitle.textContent = isTr ? "🏦 Kredi & Taksit Simülatörü" : "🏦 Loan & Installment Simulator";
if (loanAmountInput) loanAmountInput.placeholder = isTr ? "Kredi Tutarı (Örn: 1000000 TL)" : "Loan Amount (e.g. 1000000 TL)";
if (loanMonthsInput) loanMonthsInput.placeholder = isTr ? "Vade (Ay - Örn: 24)" : "Term (Months - e.g. 24)";
if (interestRateInput) interestRateInput.placeholder = isTr ? "Aylık Faiz (%)" : "Monthly Interest (%)";
if (calcLoanBtn) calcLoanBtn.textContent = isTr ? "Krediyi Hesapla" : "Calculate Loan";
if (currentUser) {
if (currentUser.isGuest) {
welcomeUser.textContent = isTr ? "⚡ Misafir (Kaydetmez)" : "⚡ Guest (Not Saved)";
}
loadTransactions();
renderLocalFoodList();
}
}
if (languageButton) languageButton.addEventListener("click", toggleLanguage);
if (authLangBtn) authLangBtn.addEventListener("click", toggleLanguage);
// Start Application
checkSession();        
