import { registerUser, loginUser, fetchTransactions, createTransaction, removeTransaction } from "./api.js";
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
const welcomeUser = document.getElementById("welcomeUser");

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
const guideTipTitle1 = document.getElementById("guideTipTitle1");
const guideTipText1 = document.getElementById("guideTipText1");
const guideTipTitle2 = document.getElementById("guideTipTitle2");
const guideTipText2 = document.getElementById("guideTipText2");
const guideTipTitle3 = document.getElementById("guideTipTitle3");
const guideTipText3 = document.getElementById("guideTipText3");
const guideActionButton = document.getElementById("guideActionButton");
const guideActionLabel = document.getElementById("guideActionLabel");

// Application State
let currentUser = JSON.parse(localStorage.getItem("budgetUser")) || null;
let guestTransactions = [];
let currentTransactions = [];
let balance = 0;
let currentLang = "tr";

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
        currentTransactions = [];
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
            renderTransactionItem(item.id, item.description, item.amount, item.type, item.category);
        });

        totalBalance.textContent = balance.toLocaleString("tr-TR") + " TL";
        if (totalIncomeAmount) totalIncomeAmount.textContent = "+" + totalIncome.toLocaleString("tr-TR") + " TL";
        if (totalExpenseAmount) totalExpenseAmount.textContent = "-" + totalExpense.toLocaleString("tr-TR") + " TL";

        updateChart(totalIncome, totalExpense, currentLang === "tr");
        renderCategorySummary(transactions);
    } catch (error) {
        console.error("Error loading transactions:", error);
    }
}

function downloadTransactions() {
    const isTr = currentLang === "tr";
    const delimiter = ";";
    const rows = [
        isTr ? ["Açıklama", "Tür", "Kategori", "Tutar (TL)"] : ["Description", "Type", "Category", "Amount (TL)"],
        ...currentTransactions.map((transaction) => [
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

function renderTransactionItem(id, descValue, amnt, typeValue, categoryValue) {
    const listItem = document.createElement("li");

    const descriptionGroup = document.createElement("div");
    descriptionGroup.className = "transaction-description";
    const descSpan = document.createElement("span");
    descSpan.className = "transaction-name";
    descSpan.textContent = descValue;
    const categorySpan = document.createElement("span");
    categorySpan.className = "transaction-category";
    categorySpan.textContent = categoryLabel(categoryValue);
    descriptionGroup.append(descSpan, categorySpan);

    const rightDiv = document.createElement("div");
    rightDiv.className = "item-right";

    const amountSpan = document.createElement("span");
    const isIncome = typeValue === "gelir";
    amountSpan.textContent = (isIncome ? "+" : "-") + amnt.toLocaleString("tr-TR") + " TL";
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
                    type: typeValue,
                    category: categoryValue
                });
            } else {
                await createTransaction({
                    userId: currentUser.userId,
                    description: descValue,
                    amount: amnt,
                    type: typeValue,
                    category: categoryValue
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
if (guideTitle) guideTitle.textContent = isTr ? "Birlikte daha dengeli bir bütçe" : "A more balanced budget, together";
if (guideIntro) guideIntro.textContent = isTr
    ? "Küçük alışkanlıklar, ailece büyük fark yaratır."
    : "Small habits can make a big difference for your family.";
if (guideTipTitle1) guideTipTitle1.textContent = isTr ? "Listeyle alışveriş yapın" : "Shop with a list";
if (guideTipText1) guideTipText1.textContent = isTr
    ? "Alışverişten önce ihtiyaçları birlikte belirleyin."
    : "Agree on what you need before heading to the store.";
if (guideTipTitle2) guideTipTitle2.textContent = isTr ? "Haftada 10 dakika ayırın" : "Set aside 10 minutes a week";
if (guideTipText2) guideTipText2.textContent = isTr
    ? "Gelir ve giderlerinize ailece göz atın."
    : "Review your income and spending together.";
if (guideTipTitle3) guideTipTitle3.textContent = isTr ? "Küçük birikimle başlayın" : "Start with a small saving";
if (guideTipText3) guideTipText3.textContent = isTr
    ? "Her gelirden ortak hedefiniz için pay ayırın."
    : "Put aside a little from each income for a shared goal.";
if (guideActionLabel) guideActionLabel.textContent = isTr ? "İlk işlemini ekle" : "Add your first transaction";
if (title) title.textContent = isTr ? "💰 Aile Bütçe Asistanı" : "💰 Family Budget Assistant";
if (balanceTitle) balanceTitle.textContent = isTr ? "Toplam Bakiye" : "Total Balance";
if (totalIncomeLabel) totalIncomeLabel.textContent = isTr ? "Toplam Gelir" : "Total Income";
if (totalExpenseLabel) totalExpenseLabel.textContent = isTr ? "Toplam Gider" : "Total Expense";
if (categorySummaryTitle) categorySummaryTitle.textContent = isTr ? "🧾 Harcama Kategorileri" : "🧾 Spending Categories";
if (description) description.placeholder = isTr ? "Açıklama (Örn: Market, Maaş)" : "Description (e.g. Grocery, Salary)";
if (amount) amount.placeholder = isTr ? "Tutar (TL)" : "Amount (TL)";
if (incomeOption) incomeOption.textContent = isTr ? "Gelir (+)" : "Income (+)";
if (expenseOption) expenseOption.textContent = isTr ? "Gider (-)" : "Expense (-)";
if (category) {
    category.setAttribute("aria-label", isTr ? "İşlem kategorisi" : "Transaction category");
    renderCategoryOptions(category.value);
}
if (addButton) addButton.textContent = isTr ? "İşlemi Ekle" : "Add Transaction";
if (logoutBtn) logoutBtn.textContent = isTr ? "Çıkış" : "Logout";
if (exportButtonLabel) exportButtonLabel.textContent = isTr ? "İndir" : "Export";
if (exportButton) exportButton.setAttribute("aria-label", isTr ? "İşlemleri indir" : "Download transactions");
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
}
}
if (languageButton) languageButton.addEventListener("click", toggleLanguage);
if (authLangBtn) authLangBtn.addEventListener("click", toggleLanguage);
// Start Application
checkSession();
