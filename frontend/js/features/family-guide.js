import { dom } from "../core/dom.js";

export function initializeFamilyGuide() {
    if (!dom.guideActionButton) return;

    dom.guideActionButton.addEventListener("click", () => {
        dom.description.scrollIntoView({ behavior: "smooth", block: "center" });
        dom.description.focus({ preventScroll: true });
    });
}
