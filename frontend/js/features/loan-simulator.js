import { dom } from "../core/dom.js";
import { formatMoney } from "../core/formatting.js";
import { state } from "../core/state.js";
import { calculateLoan } from "./chart.js";

let lastLoanResult = null;

function renderLoanResult() {
    if (!lastLoanResult) return;
    const monthly = formatMoney(Math.round(lastLoanResult.monthlyPayment));
    const total = formatMoney(Math.round(lastLoanResult.totalPayment));
    const interest = formatMoney(Math.round(lastLoanResult.totalInterest));
    dom.simResult.classList.remove("hidden");
    if (state.currentLang === "tr") {
        dom.simResult.innerHTML = "📅 Aylık Taksit: " + monthly + "<br>💰 Toplam Geri Ödeme: " + total + "<br>📈 Toplam Faiz Maliyeti: " + interest;
    } else {
        dom.simResult.innerHTML = "📅 Monthly Payment: " + monthly + "<br>💰 Total Payback: " + total + "<br>📈 Total Interest Paid: " + interest;
    }
}

export function initializeLoanSimulator() {
    if (!dom.calcLoanBtn) return;

    window.addEventListener("budget:currencychange", renderLoanResult);
    dom.calcLoanBtn.addEventListener("click", () => {
        const principal = Number(dom.loanAmountInput.value);
        const months = Number(dom.loanMonthsInput.value);
        const ratePercent = Number(dom.interestRateInput.value);
        if (principal <= 0 || months <= 0 || ratePercent < 0) {
            alert(state.currentLang === "tr" ? "Geçerli kredi tutarı ve vade girin!" : "Enter valid loan amount and months!");
            return;
        }
        const result = calculateLoan(principal, months, ratePercent);
        lastLoanResult = result;
        renderLoanResult();
    });
}
