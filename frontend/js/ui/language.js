import { dom } from "../core/dom.js";
import { state } from "../core/state.js";
import { renderMonthlyAnalysis } from "../features/analytics.js";
import { loadSavingsGoals, renderSavingsGoals } from "../features/savings-goals.js";
import { renderCategoryFilterOptions, renderCategoryOptions, renderFilteredTransactions, loadTransactions } from "../features/transactions.js";
import { applyTheme } from "./theme.js";

const {
    usernameInput,
    passwordInput,
    loginBtn,
    registerBtn,
    guestBtn,
    logoutBtn,
    exportButton,
    exportButtonLabel,
    installButton,
    installButtonText,
    versionButtonText,
    closeVersionButton,
    versionBackdrop,
    welcomeUser,
    description,
    amount,
    type,
    category,
    addButton,
    transactionSearch,
    transactionTypeFilter,
    transactionCategoryFilter,
    transactionDateFrom,
    transactionDateTo,
    clearFiltersButton,
    cancelEditButton,
    analysisMonth,
    showGoalFormButton,
    goalNameInput,
    goalTargetInput,
    saveGoalButton,
    loanAmountInput,
    loanMonthsInput,
    interestRateInput,
    calcLoanBtn,
    languageButton,
    authLangBtn,
    authTitle,
    authSubtitle,
    title,
    balanceTitle,
    totalIncomeLabel,
    totalExpenseLabel,
    incomeOption,
    expenseOption,
    analyticsTitle,
    categorySummaryTitle,
    simTitle,
    guideKicker,
    guideTitle,
    guideIntro,
    guidePlanTitle,
    guideNeedsTitle,
    guideNeedsText,
    guideWantsTitle,
    guideWantsText,
    guideSavingsTitle,
    guideSavingsText,
    guidePlanNote,
    guideActionLabel
} = dom;

export function toggleLanguage() {
    state.currentLang = state.currentLang === "tr" ? "en" : "tr";
    const isTr = state.currentLang === "tr";
    document.documentElement.lang = state.currentLang;
    document.getElementById("appFooterDock").setAttribute("aria-label", isTr ? "Uygulama bağlantıları" : "App links");
    versionBackdrop.setAttribute("aria-label", isTr ? "Sürüm geçmişini kapat" : "Close version history");
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
    if (guideTitle) guideTitle.textContent = isTr ? "Ailece hedeflere doğru" : "Family goals, made together";
    if (guideIntro) guideIntro.textContent = isTr
        ? "Geliri ihtiyaçlara, keyfe ve geleceğe dengeli ayırın."
        : "Balance today's needs, little joys, and tomorrow's goals.";
    if (guidePlanTitle) guidePlanTitle.textContent = isTr ? "Gelirine göre önerilen hedefler" : "Suggested targets from income";
    if (guideNeedsTitle) guideNeedsTitle.textContent = isTr ? "Temel ihtiyaçlar" : "Needs";
    if (guideNeedsText) guideNeedsText.textContent = isTr
        ? "Kira, faturalar, market, ulaşım ve diğer"
        : "Housing, bills, groceries, transport, other";
    if (guideWantsTitle) guideWantsTitle.textContent = isTr ? "İstekler ve keyif" : "Wants and fun";
    if (guideWantsText) guideWantsText.textContent = isTr
        ? "Yeme-içme, giyim, eğlence"
        : "Dining, clothing, entertainment";
    if (guideSavingsTitle) guideSavingsTitle.textContent = isTr ? "Kalan bakiye" : "Remaining balance";
    if (guideSavingsText) guideSavingsText.textContent = isTr
        ? "Gelirin %20'si birikim hedefi"
        : "20% of income is the savings target";
    if (guidePlanNote) guidePlanNote.textContent = isTr
        ? "Tüm kayıtlı işlemlere göre hesaplanır; aylık değildir. Ailenize göre uyarlayın."
        : "Based on all recorded transactions, not monthly. Adjust it to your family.";
    if (guideActionLabel) guideActionLabel.textContent = isTr ? "İlk işlemini ekle" : "Add your first transaction";
    if (title) title.textContent = isTr ? "💰 Aile Bütçe Asistanı" : "💰 Family Budget Assistant";
    if (balanceTitle) balanceTitle.textContent = isTr ? "Toplam Bakiye" : "Total Balance";
    if (totalIncomeLabel) totalIncomeLabel.textContent = isTr ? "Bu Ayın Geliri" : "Income This Month";
    if (totalExpenseLabel) totalExpenseLabel.textContent = isTr ? "Bu Ayın Gideri" : "Expenses This Month";
    if (categorySummaryTitle) categorySummaryTitle.textContent = isTr ? "🧾 Harcama Kategorileri" : "🧾 Spending Categories";
    if (description) description.placeholder = isTr ? "Açıklama (Örn: Market, Maaş)" : "Description (e.g. Grocery, Salary)";
    if (amount) amount.placeholder = isTr ? "Tutar (TL)" : "Amount (TL)";
    if (incomeOption) incomeOption.textContent = isTr ? "Gelir (+)" : "Income (+)";
    if (expenseOption) expenseOption.textContent = isTr ? "Gider (-)" : "Expense (-)";
    if (category) {
        category.setAttribute("aria-label", isTr ? "İşlem kategorisi" : "Transaction category");
        renderCategoryOptions(category.value);
    }
    if (addButton) {
        addButton.textContent = state.editingTransactionId !== null
            ? (isTr ? "Değişikliği Kaydet" : "Save Changes")
            : (isTr ? "İşlemi Ekle" : "Add Transaction");
    }
    if (cancelEditButton) cancelEditButton.textContent = isTr ? "Düzenlemeyi iptal et" : "Cancel editing";
    if (logoutBtn) logoutBtn.textContent = isTr ? "Çıkış" : "Logout";
    if (exportButtonLabel) exportButtonLabel.textContent = isTr ? "İndir" : "Export";
    if (exportButton) exportButton.setAttribute("aria-label", isTr ? "İşlemleri indir" : "Download transactions");
    if (analyticsTitle) analyticsTitle.textContent = isTr ? "📊 Bütçe Analizi & Kredi" : "📊 Budget Analytics & Loan";
    document.getElementById("monthlyAnalysisTitle").textContent = isTr ? "📅 Aylık finansal analiz" : "📅 Monthly financial analysis";
    document.getElementById("monthlyComparisonLabel").textContent = isTr ? "Önceki aya göre" : "Compared with previous month";
    document.getElementById("topExpenseCategoryLabel").textContent = isTr ? "En çok harcanan kategori" : "Top spending category";
    document.getElementById("monthlySavingsRateLabel").textContent = isTr ? "Tasarruf oranı" : "Savings rate";
    analysisMonth.setAttribute("aria-label", isTr ? "Analiz ayı" : "Analysis month");
    transactionSearch.placeholder = isTr ? "İşlemlerde ara" : "Search transactions";
    transactionSearch.setAttribute("aria-label", transactionSearch.placeholder);
    transactionTypeFilter.setAttribute("aria-label", isTr ? "İşlem türüne göre filtrele" : "Filter by transaction type");
    transactionCategoryFilter.setAttribute("aria-label", isTr ? "Kategoriye göre filtrele" : "Filter by category");
    document.getElementById("filterAllTypes").textContent = isTr ? "Tüm türler" : "All types";
    document.getElementById("filterIncomeType").textContent = isTr ? "Gelir" : "Income";
    document.getElementById("filterExpenseType").textContent = isTr ? "Gider" : "Expense";
    transactionDateFrom.setAttribute("aria-label", isTr ? "Başlangıç tarihi" : "Start date");
    transactionDateTo.setAttribute("aria-label", isTr ? "Bitiş tarihi" : "End date");
    document.querySelector(".transaction-filters").setAttribute("aria-label", isTr ? "İşlem filtreleri" : "Transaction filters");
    clearFiltersButton.textContent = isTr ? "Filtreleri temizle" : "Clear filters";
    showGoalFormButton.textContent = isTr ? "+ Hedef" : "+ Goal";
    document.getElementById("savingsGoalsTitle").textContent = isTr ? "🎯 Birikim hedeflerim" : "🎯 My savings goals";
    goalNameInput.placeholder = isTr ? "Hedef adı (Örn: Tatil)" : "Goal name (e.g. Vacation)";
    goalTargetInput.placeholder = isTr ? "Hedef tutarı (TL)" : "Target amount (TL)";
    saveGoalButton.textContent = isTr ? "Hedefi kaydet" : "Save goal";
    if (simTitle) simTitle.textContent = isTr ? "🏦 Kredi & Taksit Simülatörü" : "🏦 Loan & Installment Simulator";
    if (loanAmountInput) loanAmountInput.placeholder = isTr ? "Kredi Tutarı (Örn: 1000000 TL)" : "Loan Amount (e.g. 1000000 TL)";
    if (loanMonthsInput) loanMonthsInput.placeholder = isTr ? "Vade (Ay - Örn: 24)" : "Term (Months - e.g. 24)";
    if (interestRateInput) interestRateInput.placeholder = isTr ? "Aylık Faiz (%)" : "Monthly Interest (%)";
    if (calcLoanBtn) calcLoanBtn.textContent = isTr ? "Krediyi Hesapla" : "Calculate Loan";
    if (versionButtonText) versionButtonText.textContent = isTr ? "Sürüm 1.1" : "Version 1.1";
    document.getElementById("versionEyebrow").textContent = isTr ? "GÜNCELLEME GÜNLÜĞÜ" : "UPDATE LOG";
    document.getElementById("versionModalTitle").textContent = isTr ? "Sürüm geçmişi" : "Version history";
    document.getElementById("releaseStatus").textContent = isTr ? "GÜNCEL" : "CURRENT";
    document.getElementById("releaseTitleV11").textContent = isTr
        ? "v1.1 · Kurulabilir web uygulaması"
        : "v1.1 · Installable web app";
    document.getElementById("releaseDateV11").textContent = isTr ? "27 Kasım 2026" : "November 27, 2026";
    document.getElementById("releaseSummaryV11").textContent = isTr
        ? "Uygulamayı desteklenen mobil cihazlara ve bilgisayarlara tarayıcı üzerinden yükleyin."
        : "Install the app from the browser on supported mobile devices and desktop computers.";
    document.getElementById("releaseItemV11a").textContent = isTr
        ? "Android ve masaüstü tarayıcılarda ana ekrana/uygulama menüsüne yükleme"
        : "Install from supported Android and desktop browsers";
    document.getElementById("releaseItemV11b").textContent = isTr
        ? "iPhone ve iPad için ana ekrana ekleme yönergeleri"
        : "Add-to-Home-Screen instructions for iPhone and iPad";
    document.getElementById("releaseItemV11c").textContent = isTr
        ? "Çevrimdışı açılış için önbelleğe alınan uygulama arayüzü"
        : "A cached app shell for offline launch";
    document.getElementById("previousReleaseStatus").textContent = isTr ? "ÖNCEKİ SÜRÜM" : "PREVIOUS RELEASE";
    document.getElementById("releaseTitleV10").textContent = isTr
        ? "v1.0 · Bütçe yönetimi"
        : "v1.0 · Budget management";
    document.getElementById("releaseDateV10").textContent = isTr ? "27 Kasım 2026" : "November 27, 2026";
    document.getElementById("releaseSummaryV10").textContent = isTr
        ? "Aylık analiz, işlem yönetimi, birikim hedefleri ve koyu tema."
        : "Monthly analytics, transaction management, savings goals, and dark mode.";
    document.getElementById("roadmapLabel").textContent = isTr ? "ÜRÜN YOL HARİTASI" : "PRODUCT ROADMAP";
    document.getElementById("roadmapV12").textContent = isTr
        ? "Günlük kullanım iyileştirmeleri ve erişilebilirlik"
        : "Everyday usability and accessibility improvements";
    document.getElementById("roadmapV13").textContent = isTr
        ? "Daha kapsamlı raporlar ve veri yedekleme"
        : "Richer reports and data backup";
    document.getElementById("roadmapV20").textContent = isTr
        ? "Kapsamlı, güvenilir ana sürüm hedefi"
        : "Target for a complete, dependable major release";
    document.getElementById("roadmapDisclaimer").textContent = isTr
        ? "Yol haritası kullanıcı geri bildirimine göre değişebilir. v2.0 son büyük sürüm hedefidir; gerekli bakım ve güvenlik güncellemeleri sonrasında da devam edebilir."
        : "The roadmap may change based on user feedback. v2.0 is the target final major release; maintenance and security updates may continue afterward.";
    document.getElementById("installHelpTitle").textContent = isTr ? "UYGULAMAYI KURMA" : "HOW TO INSTALL";
    document.getElementById("installHelpText").textContent = isTr
        ? "Android ve masaüstü: tarayıcıdaki “Uygulamayı yükle” seçeneğini kullanın. iPhone/iPad: Safari’de Paylaş → Ana Ekrana Ekle. Kurulum için internet gerekir. Çevrimdışı açılışta API hesap ve kayıt işlemleri kullanılamaz."
        : "Android and desktop: use your browser’s Install option. iPhone/iPad: in Safari, tap Share → Add to Home Screen. Installation requires internet. Account and data features need an internet connection.";
    installButtonText.textContent = isTr ? "Uygulamayı yükle" : "Install app";
    installButton.setAttribute("aria-label", isTr ? "Uygulamayı yükle" : "Install app");
    closeVersionButton.setAttribute("aria-label", isTr ? "Kapat" : "Close");
    applyTheme();
    renderCategoryFilterOptions();
    renderFilteredTransactions();
    renderMonthlyAnalysis(state.currentTransactions);
    renderSavingsGoals(state.currentSavingsGoals);
    if (state.currentUser) {
    if (state.currentUser.isGuest) {
    welcomeUser.textContent = isTr ? "⚡ Misafir (Kaydetmez)" : "⚡ Guest (Not Saved)";
    }
    loadTransactions();
    loadSavingsGoals();
    }
}

export function initializeLanguage() {
    if (languageButton) languageButton.addEventListener("click", toggleLanguage);
    if (authLangBtn) authLangBtn.addEventListener("click", toggleLanguage);
}
