const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

let doomedCount = 0;

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

async function init() {
    const tabs = await chrome.tabs.query({});
    const now = Date.now();

    doomedCount = tabs.filter(tab =>
        !tab.pinned &&
        tab.lastAccessed &&
        (now - tab.lastAccessed) > FIVE_DAYS_MS
    ).length;

    const countEl       = document.getElementById("doomed-count");
    const mainLabel     = document.getElementById("count-main-label");
    const subLabel      = document.getElementById("count-sub-label");
    const countDisplay  = document.getElementById("count-display");
    const reapBtn       = document.getElementById("btn-reap");

    countEl.textContent = doomedCount;

    if (doomedCount === 0) {
        countDisplay.classList.add("clear");
        mainLabel.textContent = "all souls are active";
        subLabel.textContent  = "nothing to harvest today";
        // button stays disabled
    } else {
        mainLabel.textContent = `soul${doomedCount === 1 ? "" : "s"} awaiting judgement`;
        subLabel.textContent  = "inactive for 5+ days";
        reapBtn.disabled = false;
    }
}

document.getElementById("btn-reap").addEventListener("click", () => {
    document.getElementById("confirm-count").textContent = doomedCount;
    document.getElementById("confirm-plural").textContent = doomedCount === 1 ? "" : "s";
    showScreen("screen-confirm");
});

document.getElementById("btn-confirm").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "REAP" });
    showScreen("screen-done");
    setTimeout(() => window.close(), 2200);
});

document.getElementById("btn-cancel").addEventListener("click", () => {
    showScreen("screen-default");
});

init();