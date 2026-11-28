import { categories } from "../core/categories.js";
import { transactionDateValue } from "../core/formatting.js";
import { dom } from "../core/dom.js";
import { state } from "../core/state.js";
import { restoreBackup } from "../services/api.js";
import { loadSavingsGoals } from "./savings-goals.js";
import { loadTransactions } from "./transactions.js";

const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
const MAX_TRANSACTIONS = 20000;
const MAX_SAVINGS_GOALS = 1000;
let pendingBackup = null;

const isTurkish = () => state.currentLang === "tr";

function showBackupMessage(message, isError = false) {
    dom.backupMessage.textContent = message;
    dom.backupMessage.classList.toggle("is-error", isError);
}

function normalizeBackup(value) {
    if (!value || value.schemaVersion !== 1 ||
        !Array.isArray(value.transactions) || !Array.isArray(value.savingsGoals) ||
        value.transactions.length > MAX_TRANSACTIONS || value.savingsGoals.length > MAX_SAVINGS_GOALS) {
        throw new Error(isTurkish()
            ? "Yedek dosyası biçimi tanınmıyor veya desteklenen boyutu aşıyor."
            : "The backup format is invalid or exceeds the supported size.");
    }

    const transactions = value.transactions.map((item) => {
        if (!item || typeof item.description !== "string" ||
            item.description.trim().length === 0 || item.description.trim().length > 200 ||
            !Number.isFinite(item.amount) || item.amount <= 0 ||
            (item.type !== "gelir" && item.type !== "gider") ||
            !Object.prototype.hasOwnProperty.call(categories, item.category)) {
            throw new Error(isTurkish()
                ? "Yedekte geçersiz bir işlem var."
                : "The backup contains an invalid transaction.");
        }

        let createdAt = null;
        if (item.createdAt !== null && item.createdAt !== undefined && item.createdAt !== "") {
            if (typeof item.createdAt !== "string") {
                throw new Error(isTurkish() ? "Yedekte geçersiz bir tarih var." : "The backup contains an invalid date.");
            }
            const date = transactionDateValue(item.createdAt);
            const parsedDate = new Date(date + "T00:00:00.000Z");
            if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
                throw new Error(isTurkish() ? "Yedekte geçersiz bir tarih var." : "The backup contains an invalid date.");
            }
            createdAt = parsedDate.toISOString();
        }

        return {
            description: item.description.trim(),
            amount: item.amount,
            type: item.type,
            category: item.category,
            createdAt
        };
    });

    const savingsGoals = value.savingsGoals.map((goal) => {
        if (!goal || typeof goal.name !== "string" ||
            goal.name.trim().length === 0 || goal.name.trim().length > 60 ||
            !Number.isFinite(goal.targetAmount) || goal.targetAmount <= 0 ||
            !Number.isFinite(goal.savedAmount) || goal.savedAmount < 0) {
            throw new Error(isTurkish()
                ? "Yedekte geçersiz bir birikim hedefi var."
                : "The backup contains an invalid savings goal.");
        }
        return {
            name: goal.name.trim(),
            targetAmount: goal.targetAmount,
            savedAmount: goal.savedAmount
        };
    });

    return { schemaVersion: 1, transactions, savingsGoals };
}

function downloadBackup() {
    if (!state.transactionsLoaded || !state.savingsGoalsLoaded) {
        showBackupMessage(isTurkish()
            ? "Veriler yüklenmeden yedek oluşturulamaz. Bağlantını kontrol edip tekrar dene."
            : "A backup cannot be created until your data loads. Check your connection and try again.", true);
        return;
    }
    const backup = {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        transactions: state.currentTransactions.map((item) => ({
            description: item.description,
            amount: Number(item.amount),
            type: item.type,
            category: item.category,
            createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null
        })),
        savingsGoals: state.currentSavingsGoals.map((goal) => ({
            name: goal.name,
            targetAmount: Number(goal.targetAmount),
            savedAmount: Number(goal.savedAmount)
        }))
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "family-budget-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showBackupMessage(isTurkish() ? "Yedek dosyası indirildi." : "Backup downloaded.");
}

function resetRestorePanel() {
    pendingBackup = null;
    dom.backupFileInput.value = "";
    dom.restorePasswordInput.value = "";
    dom.confirmRestoreButton.disabled = false;
    dom.confirmRestoreButton.setAttribute("aria-busy", "false");
    dom.cancelRestoreButton.disabled = false;
    dom.restorePanel.classList.add("hidden");
}

async function readBackupFile() {
    pendingBackup = null;
    dom.restorePanel.classList.add("hidden");
    dom.restorePasswordInput.value = "";
    showBackupMessage("");
    const file = dom.backupFileInput.files?.[0];
    if (!file) return;
    if (!state.transactionsLoaded || !state.savingsGoalsLoaded) {
        showBackupMessage(isTurkish()
            ? "Önce hesap verilerinin yüklenmesini bekle."
            : "Wait for your account data to finish loading first.", true);
        dom.backupFileInput.value = "";
        return;
    }
    if (file.size > MAX_BACKUP_BYTES) {
        showBackupMessage(isTurkish()
            ? "Yedek dosyası 10 MB sınırını aşıyor."
            : "The backup file exceeds the 10 MB limit.", true);
        dom.backupFileInput.value = "";
        return;
    }

    try {
        pendingBackup = normalizeBackup(JSON.parse(await file.text()));
        dom.restorePasswordInput.value = "";
        dom.restorePasswordLabel.classList.toggle("hidden", state.currentUser.isGuest);
        dom.restorePasswordInput.classList.toggle("hidden", state.currentUser.isGuest);
        dom.restorePanel.classList.remove("hidden");
        showBackupMessage(isTurkish()
            ? pendingBackup.transactions.length + " işlem ve " + pendingBackup.savingsGoals.length +
                " hedef bulundu. Devam edersen mevcut verilerin bu yedekle değiştirilecek."
            : pendingBackup.transactions.length + " transactions and " + pendingBackup.savingsGoals.length +
                " goals found. Continuing will replace your current data with this backup.");
        if (!state.currentUser.isGuest) dom.restorePasswordInput.focus();
        else dom.confirmRestoreButton.focus();
    } catch (error) {
        console.error("Could not read backup file:", error);
        pendingBackup = null;
        showBackupMessage(error instanceof SyntaxError
            ? (isTurkish() ? "Dosya geçerli bir JSON yedeği değil." : "The file is not valid backup JSON.")
            : error.message, true);
        dom.backupFileInput.value = "";
    }
}

async function confirmRestore() {
    if (!pendingBackup) return;
    const password = state.currentUser.isGuest ? "" : dom.restorePasswordInput.value;
    if (!state.currentUser.isGuest && !password) {
        showBackupMessage(isTurkish() ? "Geri yüklemek için hesap şifreni gir." : "Enter your account password to restore.", true);
        dom.restorePasswordInput.focus();
        return;
    }

    const message = isTurkish()
        ? "Devam edersen mevcut işlemlerin ve birikim hedeflerin yedek dosyasındaki verilerle değiştirilecek. Emin misin?"
        : "Your current transactions and savings goals will be replaced by the backup. Continue?";
    if (!window.confirm(message)) return;

    const backup = pendingBackup;
    dom.confirmRestoreButton.disabled = true;
    dom.cancelRestoreButton.disabled = true;
    dom.confirmRestoreButton.setAttribute("aria-busy", "true");
    showBackupMessage(isTurkish() ? "Yedek geri yükleniyor…" : "Restoring backup…");
    try {
        if (state.currentUser.isGuest) {
            state.guestTransactions = backup.transactions.map((item, index) => ({
                ...item,
                id: Date.now() + index
            }));
            state.guestSavingsGoals = backup.savingsGoals.map((goal, index) => ({
                ...goal,
                id: Date.now() + index
            }));
        } else {
            await restoreBackup(state.currentUser.userId, state.currentUser.username, password, backup);
        }

        const [transactionsLoaded, goalsLoaded] = await Promise.all([
            loadTransactions(),
            loadSavingsGoals()
        ]);
        resetRestorePanel();
        if (!transactionsLoaded || !goalsLoaded) {
            showBackupMessage(isTurkish()
                ? "Yedek kaydedildi ancak ekran yenilenemedi. Lütfen sayfayı yenile."
                : "The backup was restored, but the dashboard could not refresh. Reload the page.", true);
            return;
        }
        showBackupMessage(isTurkish() ? "Yedek başarıyla geri yüklendi." : "Backup restored successfully.");
    } catch (error) {
        console.error("Could not restore backup:", error);
        dom.restorePasswordInput.value = "";
        showBackupMessage((isTurkish() ? "Yedek geri yüklenemedi: " : "Could not restore backup: ") + error.message, true);
    } finally {
        dom.confirmRestoreButton.disabled = false;
        dom.confirmRestoreButton.setAttribute("aria-busy", "false");
        dom.cancelRestoreButton.disabled = false;
    }
}

export function initializeBackupTools() {
    dom.backupButton.addEventListener("click", downloadBackup);
    dom.restoreButton.addEventListener("click", () => {
        resetRestorePanel();
        dom.backupFileInput.click();
    });
    dom.backupFileInput.addEventListener("change", readBackupFile);
    dom.confirmRestoreButton.addEventListener("click", confirmRestore);
    dom.cancelRestoreButton.addEventListener("click", resetRestorePanel);
}
