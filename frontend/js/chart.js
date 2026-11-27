let budgetChartInstance = null;

// Render or update the Income vs Expense doughnut chart
export function updateChart(income, expense, isTurkish) {
    const canvas = document.getElementById("budgetChart");
    if (!canvas) return;
    
    // Check if Chart library loaded from internet
    if (typeof Chart === "undefined") {
        console.warn("Chart.js could not be loaded (check internet connection).");
        return;
    }

    const ctx = canvas.getContext("2d");

    if (budgetChartInstance) {
        budgetChartInstance.destroy();
    }

    budgetChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: isTurkish ? ["Gelir", "Gider"] : ["Income", "Expense"],
            datasets: [{
                data: [income, expense],
                backgroundColor: ["#10b981", "#ef4444"],
                borderWidth: 0
            }]
        },
        options: {
            plugins: {
                legend: { labels: { color: "#f8fafc" } }
            }
        }
    });
}

// Bank Loan Amortization Formula
export function calculateLoan(principal, months, monthlyRatePercent) {
    const r = monthlyRatePercent / 100;

    if (r === 0) {
        return {
            monthlyPayment: principal / months,
            totalPayment: principal,
            totalInterest: 0
        };
    }

    const factor = Math.pow(1 + r, months);
    const monthlyPayment = principal * ((r * factor) / (factor - 1));
    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - principal;

    return {
        monthlyPayment,
        totalPayment,
        totalInterest
    };
}
