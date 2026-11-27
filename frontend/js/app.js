import { initializeAuthentication } from "./features/authentication.js";
import { initializeFamilyGuide } from "./features/family-guide.js";
import { initializeLoanSimulator } from "./features/loan-simulator.js";
import { initializeSavingsGoals } from "./features/savings-goals.js";
import { initializeTransactions } from "./features/transactions.js";
import { initializeAppInstallation } from "./ui/app-installation.js";
import { initializeLanguage } from "./ui/language.js";
import { initializeTheme } from "./ui/theme.js";

initializeTheme();
initializeTransactions();
initializeSavingsGoals();
initializeLoanSimulator();
initializeFamilyGuide();
initializeLanguage();
initializeAppInstallation();
initializeAuthentication();
