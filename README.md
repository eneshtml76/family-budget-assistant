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
* **📅 Monthly Financial Analysis:** Review monthly income and expenses, compare them with the previous month, see the top spending category, and track the savings rate.
* **🧾 Transaction Management:** Search and filter transactions by type, category, and date; edit entries and export them as CSV.
* **🎯 Savings Goals:** Create named savings targets, add contributions, and track remaining amounts and progress.
* **🌙 Dark Mode:** Switch between light and dark themes; the selected theme is remembered in the browser.
* **🧾 Spending Categories:** Categorize expenses and review spending totals by category.
* **🏦 Bank Loan & Installment Simulator:** Calculates exact monthly installments, total payback, and total compound interest cost using standard banking amortization formulas.
* **👨‍👩‍👧‍👦 Family Budget Guide:** A live 50/30/20 budget plan based on recorded transactions; monthly reports are shown separately.
* **🛡️ Security First:** Built with DOM XSS protection (`textContent` sanitization), input validation, and user-level data isolation (`UserId` filtering).
* **🌐 Bilingual Interface:** Instant switching between Turkish (`TR`) and English (`EN`).

---

## 🚀 Sürüm Geçmişi

### v1.0 — Kararlı sürüm (27 Kasım 2026)

- Aylık gelir/gider analizi, önceki ay karşılaştırması ve tasarruf oranı
- İşlem düzenleme, arama, kategori/tür/tarih filtreleme ve CSV dışa aktarma
- Araba, tatil ve acil durum birikim hedefleri
- Koyu tema tercihi ve mobil uyumluluk
- Uygulama altındaki sürüm geçmişi penceresi

Gelecek sürüm (`v2.0`) için bildirimler, ayrıntılı grafikler veya yeni kullanıcı özellikleri eklenebilir.

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

New transactions receive a creation date for monthly reports and date filters. Existing transactions without a stored date remain available in the transaction list, but are excluded from monthly analysis and date-filtered results.

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
