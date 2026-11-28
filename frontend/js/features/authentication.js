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

function showAuthMessage(message, isError = false) {
    dom.authMessage.textContent = message;
    dom.authMessage.classList.toggle("is-error", isError);
}

function setAuthBusy(isBusy) {
    dom.loginBtn.disabled = isBusy;
    dom.registerBtn.disabled = isBusy;
    dom.loginBtn.setAttribute("aria-busy", String(isBusy));
    dom.registerBtn.setAttribute("aria-busy", String(isBusy));
}

function clearPasswordInput() {
    dom.passwordInput.value = "";
    dom.passwordInput.type = "password";
    dom.passwordVisibilityButton.setAttribute("aria-pressed", "false");
    dom.passwordVisibilityButton.textContent = state.currentLang === "tr" ? "Göster" : "Show";
    dom.passwordVisibilityButton.setAttribute(
        "aria-label",
        state.currentLang === "tr" ? "Şifreyi göster" : "Show password"
    );
}

export function initializeAuthentication() {
    window.addEventListener("budget:auth-expired", () => {
        state.currentUser = null;
        state.currentTransactions = [];
        state.currentSavingsGoals = [];
        state.transactionsLoaded = false;
        state.savingsGoalsLoaded = false;
        checkSession();
        showAuthMessage(
            state.currentLang === "tr"
                ? "Oturum süren doldu. Lütfen yeniden giriş yap."
                : "Your session expired. Please sign in again.",
            true
        );
    });

    [dom.usernameInput, dom.passwordInput].forEach((input) => {
        input.addEventListener("input", () => showAuthMessage(""));
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") dom.loginBtn.click();
        });
    });

    dom.passwordVisibilityButton.addEventListener("click", () => {
        const shouldShow = dom.passwordInput.type === "password";
        dom.passwordInput.type = shouldShow ? "text" : "password";
        dom.passwordVisibilityButton.setAttribute("aria-pressed", String(shouldShow));
        dom.passwordVisibilityButton.setAttribute(
            "aria-label",
            state.currentLang === "tr"
                ? (shouldShow ? "Şifreyi gizle" : "Şifreyi göster")
                : (shouldShow ? "Hide password" : "Show password")
        );
        dom.passwordVisibilityButton.textContent = state.currentLang === "tr"
            ? (shouldShow ? "Gizle" : "Göster")
            : (shouldShow ? "Hide" : "Show");
    });

    if (dom.guestBtn) {
        dom.guestBtn.addEventListener("click", () => {
            showAuthMessage("");
            state.currentUser = { userId: 0, username: "Misafir", isGuest: true };
            state.guestTransactions = [];
            state.guestSavingsGoals = [];
            checkSession();
        });
    }

    if (dom.registerBtn) {
        dom.registerBtn.addEventListener("click", async () => {
            const user = dom.usernameInput.value.trim();
            const pass = dom.passwordInput.value;
            if (!user || !pass) {
                showAuthMessage(
                    state.currentLang === "tr" ? "Kullanıcı adı ve şifre girin." : "Enter your username and password.",
                    true
                );
                (!user ? dom.usernameInput : dom.passwordInput).focus();
                return;
            }

            showAuthMessage("");
            setAuthBusy(true);
            try {
                const data = await registerUser(user, pass);
                localStorage.setItem("budgetUser", JSON.stringify(data));
                state.currentUser = data;
                clearPasswordInput();
                checkSession();
            } catch (error) {
                showAuthMessage(
                    (state.currentLang === "tr" ? "Hesap oluşturulamadı: " : "Could not create account: ") + error.message,
                    true
                );
            } finally {
                setAuthBusy(false);
            }
        });
    }

    if (dom.loginBtn) {
        dom.loginBtn.addEventListener("click", async () => {
            const user = dom.usernameInput.value.trim();
            const pass = dom.passwordInput.value;
            if (!user || !pass) {
                showAuthMessage(
                    state.currentLang === "tr" ? "Kullanıcı adı ve şifre girin." : "Enter your username and password.",
                    true
                );
                (!user ? dom.usernameInput : dom.passwordInput).focus();
                return;
            }

            showAuthMessage("");
            setAuthBusy(true);
            try {
                const data = await loginUser(user, pass);
                localStorage.setItem("budgetUser", JSON.stringify(data));
                state.currentUser = data;
                clearPasswordInput();
                checkSession();
            } catch (error) {
                showAuthMessage(
                    (state.currentLang === "tr" ? "Giriş yapılamadı: " : "Could not sign in: ") + error.message,
                    true
                );
            } finally {
                setAuthBusy(false);
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
            state.transactionsLoaded = false;
            state.savingsGoalsLoaded = false;
            dom.backupFileInput.value = "";
            dom.restorePasswordInput.value = "";
            dom.restorePanel.classList.add("hidden");
            dom.backupMessage.textContent = "";
            dom.backupMessage.classList.remove("is-error");
            resetTransactionForm();
            dom.transactionList.replaceChildren();
            dom.transactionEmptyMessage.classList.add("hidden");
            dom.savingsGoalsList.replaceChildren();
            dom.goalForm.classList.add("hidden");
            dom.goalNameInput.value = "";
            dom.goalTargetInput.value = "";
            dom.usernameInput.value = "";
            clearPasswordInput();
            showAuthMessage("");
            checkSession();
        });
    }

    checkSession();
}
