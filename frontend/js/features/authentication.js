import { loginUser, registerUser } from "../services/api.js";
import { state } from "../core/state.js";
import { dom } from "../core/dom.js";
import { loadSavingsGoals } from "./savings-goals.js";
import { loadTransactions, resetTransactionForm } from "./transactions.js";

function checkSession() {
    if (state.currentUser) {
        dom.authSection.classList.add("hidden");
        dom.dashboardSection.classList.remove("hidden");
        if (state.currentUser.isGuest) {
            dom.welcomeUser.textContent = state.currentLang === "tr" ? "⚡ Misafir (Kaydetmez)" : "⚡ Guest (Not Saved)";
        } else {
            dom.welcomeUser.textContent = "👤 " + state.currentUser.username;
        }
        loadTransactions();
        loadSavingsGoals();
    } else {
        dom.authSection.classList.remove("hidden");
        dom.dashboardSection.classList.add("hidden");
    }
}

export function initializeAuthentication() {
    if (dom.guestBtn) {
        dom.guestBtn.addEventListener("click", () => {
            state.currentUser = { userId: 0, username: "Misafir", isGuest: true };
            state.guestTransactions = [];
            state.guestSavingsGoals = [];
            checkSession();
        });
    }

    if (dom.registerBtn) {
        dom.registerBtn.addEventListener("click", async () => {
            const user = dom.usernameInput.value.trim();
            const pass = dom.passwordInput.value.trim();
            if (!user || !pass) {
                alert(state.currentLang === "tr" ? "Kullanıcı adı ve şifre girin!" : "Enter username and password!");
                return;
            }

            try {
                const data = await registerUser(user, pass);
                localStorage.setItem("budgetUser", JSON.stringify(data));
                state.currentUser = data;
                checkSession();
            } catch (error) {
                alert((state.currentLang === "tr" ? "Kayıt hatası: " : "Registration error: ") + error.message);
            }
        });
    }

    if (dom.loginBtn) {
        dom.loginBtn.addEventListener("click", async () => {
            const user = dom.usernameInput.value.trim();
            const pass = dom.passwordInput.value.trim();
            if (!user || !pass) {
                alert(state.currentLang === "tr" ? "Kullanıcı adı ve şifre girin!" : "Enter username and password!");
                return;
            }

            try {
                const data = await loginUser(user, pass);
                localStorage.setItem("budgetUser", JSON.stringify(data));
                state.currentUser = data;
                checkSession();
            } catch (error) {
                alert(state.currentLang === "tr" ? "Giriş başarısız! Kullanıcı adı veya şifre hatalı." : "Login failed! Invalid username or password.");
            }
        });
    }

    if (dom.logoutBtn) {
        dom.logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("budgetUser");
            state.currentUser = null;
            state.guestTransactions = [];
            state.guestSavingsGoals = [];
            state.currentTransactions = [];
            state.currentSavingsGoals = [];
            resetTransactionForm();
            dom.transactionList.replaceChildren();
            dom.transactionEmptyMessage.classList.add("hidden");
            dom.savingsGoalsList.replaceChildren();
            dom.goalForm.classList.add("hidden");
            dom.goalNameInput.value = "";
            dom.goalTargetInput.value = "";
            dom.usernameInput.value = "";
            dom.passwordInput.value = "";
            checkSession();
        });
    }

    checkSession();
}
