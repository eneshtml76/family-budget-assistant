# 💰 Family Budget & Financial Assistant (Full-Stack)

[![License: MIT](https://shields.io)](https://opensource.org)
[![.NET](https://shields.io)](https://microsoft.com)
[![JavaScript](https://shields.io)](https://mozilla.org)

🌐 **Live Frontend Preview:** [ https://eneshtml76.github.io/family-budget-assistant/]( https://eneshtml76.github.io/family-budget-assistant/)

A modern, responsive, and bilingual (**EN / TR**) full-stack personal finance and budget management application built with **C# (.NET Web API)**, **Entity Framework Core (SQLite)**, and **Modular Vanilla JavaScript**.

---

## ✨ Key Features

* **🔐 Secure Authentication & Persistent Sessions:** User registration and login system protected with cryptographic **SHA-256 password hashing** and persistent browser session storage (`localStorage`).
* **📊 Real-Time Analytics & Charts:** Interactive Income vs. Expense doughnut chart powered by **Chart.js** alongside live balance and summary cards.
* **🏦 Bank Loan & Installment Simulator:** Calculates exact monthly installments, total payback, and total compound interest cost using standard banking amortization formulas.
* **🥙 Local Food & Expense Quick-Deduct:** Integrated Seferihisar local dining guide with ratings and menu prices that deducts meal costs directly from the user's database balance in one click.
* **🛡️ Security First:** Built with DOM XSS protection (`textContent` sanitization), input validation, and user-level data isolation (`UserId` filtering).
* **🌐 Bilingual Interface:** Instant switching between Turkish (`TR`) and English (`EN`).

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 (Glassmorphism UI), Vanilla JavaScript (ES6 Modules), Chart.js
* **Backend:** C#, ASP.NET Core Web API
* **Database:** SQLite with Entity Framework Core

---

## ⚙️ How to Run Locally

### 1. Start the C# Backend API
```bash
cd backend/BudgetApi
dotnet run
```
*The API server will start listening on `http://localhost:5098` and automatically generate the `budget.db` SQLite database.*

### 2. Start the Frontend
Open the `frontend` folder using **VS Code Live Server** or run a local Python HTTP server:
```bash
cd frontend
python -m http.server 8080
```
Navigate to `http://localhost:8080` in your browser.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
