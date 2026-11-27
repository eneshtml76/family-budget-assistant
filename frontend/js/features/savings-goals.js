import {
    contributeToSavingsGoal,
    createSavingsGoal,
    fetchSavingsGoals,
    removeSavingsGoal
} from "../services/api.js";
import { formatMoney } from "../core/formatting.js";
import { state } from "../core/state.js";
import { dom } from "../core/dom.js";

const { goalForm, goalNameInput, goalTargetInput, saveGoalButton, savingsGoalsList, showGoalFormButton } = dom;

export function renderSavingsGoals(goals) {
    savingsGoalsList.replaceChildren();
    if (goals.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "category-empty";
        emptyMessage.textContent = state.currentLang === "tr"
            ? "Henüz birikim hedefi eklemedin."
            : "You have not added a savings goal yet.";
        savingsGoalsList.appendChild(emptyMessage);
        return;
    }

    goals.forEach((goal) => {
        const card = document.createElement("article");
        card.className = "savings-goal-card";
        const heading = document.createElement("div");
        heading.className = "savings-goal-card-heading";
        const name = document.createElement("strong");
        name.textContent = goal.name;
        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.type = "button";
        deleteButton.textContent = "✕";
        deleteButton.setAttribute("aria-label", state.currentLang === "tr" ? "Hedefi sil" : "Delete goal");
        deleteButton.addEventListener("click", async () => {
            const confirmed = confirm(state.currentLang === "tr" ? "Bu birikim hedefi silinsin mi?" : "Delete this savings goal?");
            if (!confirmed) return;
            try {
                if (state.currentUser.isGuest) {
                    state.guestSavingsGoals = state.guestSavingsGoals.filter((item) => item.id !== goal.id);
                } else {
                    await removeSavingsGoal(goal.id, state.currentUser.userId);
                }
                await loadSavingsGoals();
            } catch (error) {
                console.error("Error deleting savings goal:", error);
                alert(state.currentLang === "tr" ? "Hedef silinemedi: " + error.message : "Could not delete goal: " + error.message);
            }
        });
        heading.append(name, deleteButton);

        const target = Number(goal.targetAmount);
        const saved = Number(goal.savedAmount);
        const progress = Math.max(0, Math.min(100, target > 0 ? (saved / target) * 100 : 0));
        const amountLabel = document.createElement("p");
        amountLabel.className = "savings-goal-amount";
        amountLabel.textContent = formatMoney(saved) + " / " + formatMoney(target);
        const meter = document.createElement("div");
        meter.className = "savings-goal-meter";
        meter.setAttribute("role", "progressbar");
        meter.setAttribute("aria-valuemin", "0");
        meter.setAttribute("aria-valuemax", "100");
        meter.setAttribute("aria-valuenow", progress.toFixed(0));
        const fill = document.createElement("span");
        fill.style.width = progress + "%";
        meter.appendChild(fill);

        const remaining = document.createElement("p");
        remaining.className = "savings-goal-remaining";
        remaining.textContent = state.currentLang === "tr"
            ? "Kalan: " + formatMoney(Math.max(0, target - saved)) + " · %" + progress.toFixed(0)
            : "Remaining: " + formatMoney(Math.max(0, target - saved)) + " · " + progress.toFixed(0) + "%";

        const contributionRow = document.createElement("div");
        contributionRow.className = "savings-contribution-row";
        const contributionInput = document.createElement("input");
        contributionInput.type = "number";
        contributionInput.min = "0.01";
        contributionInput.step = "any";
        contributionInput.placeholder = state.currentLang === "tr" ? "Eklenecek tutar" : "Amount to add";
        contributionInput.setAttribute("aria-label", state.currentLang === "tr" ? goal.name + " hedefine eklenecek tutar" : "Amount to add to " + goal.name);
        const contributionButton = document.createElement("button");
        contributionButton.type = "button";
        contributionButton.className = "small-action-btn";
        contributionButton.textContent = state.currentLang === "tr" ? "Ekle" : "Add";
        contributionButton.addEventListener("click", async () => {
            const contributionAmount = Number(contributionInput.value);
            if (!Number.isFinite(contributionAmount) || contributionAmount <= 0) {
                alert(state.currentLang === "tr" ? "Pozitif bir tutar gir." : "Enter an amount greater than zero.");
                return;
            }
            try {
                if (state.currentUser.isGuest) {
                    state.guestSavingsGoals = state.guestSavingsGoals.map((item) =>
                        item.id === goal.id
                            ? { ...item, savedAmount: item.savedAmount + contributionAmount }
                            : item
                    );
                } else {
                    await contributeToSavingsGoal(goal.id, state.currentUser.userId, contributionAmount);
                }
                await loadSavingsGoals();
            } catch (error) {
                console.error("Error adding savings contribution:", error);
                alert(state.currentLang === "tr" ? "Birikim eklenemedi: " + error.message : "Could not add contribution: " + error.message);
            }
        });
        contributionRow.append(contributionInput, contributionButton);
        card.append(heading, amountLabel, meter, remaining, contributionRow);
        savingsGoalsList.appendChild(card);
    });
}

export async function loadSavingsGoals() {
    if (!state.currentUser) return;
    try {
        state.currentSavingsGoals = state.currentUser.isGuest
            ? state.guestSavingsGoals
            : await fetchSavingsGoals(state.currentUser.userId);
        renderSavingsGoals(state.currentSavingsGoals);
    } catch (error) {
        console.error("Error loading savings goals:", error);
        savingsGoalsList.textContent = state.currentLang === "tr"
            ? "Birikim hedefleri yüklenemedi: " + error.message
            : "Could not load savings goals: " + error.message;
    }
}

export function initializeSavingsGoals() {
    if (showGoalFormButton) {
        showGoalFormButton.addEventListener("click", () => {
            goalForm.classList.toggle("hidden");
            if (!goalForm.classList.contains("hidden")) goalNameInput.focus();
        });
    }

    if (saveGoalButton) {
        saveGoalButton.addEventListener("click", async () => {
            const name = goalNameInput.value.trim();
            const targetAmount = Number(goalTargetInput.value);
            if (!name || !Number.isFinite(targetAmount) || targetAmount <= 0) {
                alert(state.currentLang === "tr" ? "Hedef adı ve pozitif hedef tutarı gir." : "Enter a goal name and a target greater than zero.");
                return;
            }

            try {
                if (state.currentUser.isGuest) {
                    state.guestSavingsGoals.push({
                        id: Date.now(),
                        name,
                        targetAmount,
                        savedAmount: 0
                    });
                } else {
                    await createSavingsGoal({
                        userId: state.currentUser.userId,
                        name,
                        targetAmount
                    });
                }
                goalNameInput.value = "";
                goalTargetInput.value = "";
                goalForm.classList.add("hidden");
                await loadSavingsGoals();
            } catch (error) {
                console.error("Error creating savings goal:", error);
                alert(state.currentLang === "tr" ? "Hedef kaydedilemedi: " + error.message : "Could not save goal: " + error.message);
            }
        });
    }
}
