import { dom } from "../core/dom.js";

let pendingInstallPrompt = null;

function openVersionModal() {
    dom.versionModal.classList.remove("hidden");
    document.body.classList.add("modal-open");
    dom.closeVersionButton.focus();
}

function closeVersionModal() {
    dom.versionModal.classList.add("hidden");
    document.body.classList.remove("modal-open");
    dom.versionButton.focus();
}

function isAppInstalled() {
    return window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;
}

export function initializeAppInstallation() {
    dom.versionButton.addEventListener("click", openVersionModal);
    dom.closeVersionButton.addEventListener("click", closeVersionModal);
    dom.versionBackdrop.addEventListener("click", closeVersionModal);
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !dom.versionModal.classList.contains("hidden")) {
            closeVersionModal();
        }
    });

    if (isAppInstalled()) {
        dom.installButton.classList.add("hidden");
    }

    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        pendingInstallPrompt = event;
        dom.installButton.classList.remove("hidden");
    });

    window.addEventListener("appinstalled", () => {
        pendingInstallPrompt = null;
        dom.installButton.classList.add("hidden");
    });

    dom.installButton.addEventListener("click", async () => {
        if (!pendingInstallPrompt) {
            openVersionModal();
            document.getElementById("installHelp").scrollIntoView({ behavior: "smooth", block: "nearest" });
            return;
        }

        try {
            pendingInstallPrompt.prompt();
            const choice = await pendingInstallPrompt.userChoice;
            pendingInstallPrompt = null;
            if (choice.outcome === "accepted") {
                dom.installButton.classList.add("hidden");
                return;
            }
        } catch (error) {
            console.error("App installation prompt failed:", error);
            pendingInstallPrompt = null;
        }

        openVersionModal();
        document.getElementById("installHelp").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    if ("serviceWorker" in navigator && window.isSecureContext) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("./service-worker.js")
                .catch((error) => console.error("Service worker registration failed:", error));
        });
    }
}
