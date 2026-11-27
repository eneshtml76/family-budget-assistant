import { state } from "../core/state.js";
import { dom } from "../core/dom.js";

let currentTheme = localStorage.getItem("budgetTheme") === "dark" ? "dark" : "light";

export function applyTheme() {
    document.body.classList.toggle("dark-theme", currentTheme === "dark");
    const themeColor = document.querySelector('meta[name="theme-color"]');
    themeColor.content = currentTheme === "dark" ? "#101713" : "#f5f7f2";
    dom.themeToggleButtons.forEach((button) => {
        button.textContent = currentTheme === "dark" ? "☀️" : "🌙";
        button.setAttribute(
            "aria-label",
            currentTheme === "dark"
                ? (state.currentLang === "tr" ? "Açık temayı aç" : "Switch to light theme")
                : (state.currentLang === "tr" ? "Koyu temayı aç" : "Switch to dark theme")
        );
    });
}

export function initializeTheme() {
    dom.themeToggleButtons.forEach((button) => {
        button.addEventListener("click", () => {
            currentTheme = currentTheme === "dark" ? "light" : "dark";
            localStorage.setItem("budgetTheme", currentTheme);
            applyTheme();
        });
    });
    applyTheme();
}
