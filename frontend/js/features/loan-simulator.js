import { dom } from "../core/dom.js";
import { state } from "../core/state.js";
import { calculateLoan } from "./chart.js";

export function initializeLoanSimulator() {
    if (!dom.calcLoanBtn) return;

    dom.calcLoanBtn.addEventListener("click", () => {
        const principal = Number(dom.loanAmountInput.value);
        const months = Number(dom.loanMonthsInput.value);
        const ratePercent = Number(dom.interestRateInput.value);
        if (principal <= 0 || months <= 0 || ratePercent < 0) {
            alert(state.currentLang === "tr" ? "Geçerli kredi tutarı ve vade girin!" : "Enter valid loan amount and months!");
            return;
        }
        const result = calculateLoan(principal, months, ratePercent);
        const monthlyStr = Math.round(result.monthlyPayment).toLocaleString("tr-TR");
        const totalStr = Math.round(result.totalPayment).toLocaleString("tr-TR");
        const interestStr = Math.round(result.totalInterest).toLocaleString("tr-TR");
        dom.simResult.classList.remove("hidden");
        if (state.currentLang === "tr") {
            dom.simResult.innerHTML = "📅 Aylık Taksit: " + monthlyStr + " TL<br>💰 Toplam Geri Ödeme: " + totalStr + " TL<br>📈 Toplam Faiz Maliyeti: " + interestStr + " TL";
        } else {
            dom.simResult.innerHTML = "📅 Monthly Payment: " + monthlyStr + " TL<br>💰 Total Payback: " + totalStr + " TL<br>📈 Total Interest Paid: " + interestStr + " TL";
        }
    });
}
