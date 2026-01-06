const FIVE_DAYS_MS =5 * 24 * 60 * 60 * 1000;

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "REAP") {
        reapTabs();
    }
});

function reapTabs() {
    chrome.tabs.query({}, (tabs) => {
        const now = Date.now();
        const harvested = []
        const tabsToClose = [];

        tabs.forEach((tab) => {
            if (!tab.lastAccessed) return;

            const inactiveFor = now - tab.lastAccessed;

            if (inactiveFor > FIVE_DAYS_MS) {
                harvested.push({
                    id: crypto.randomUUID(),
                    title: tab.title,
                    url: tab.url,
                    favicon: tab.favIconUrl || null,
                    lastAccessed: tab.lastAccessed,
                    dateHarvested: new Date().toISOString(),
                    status: "purgatory"
                });

                tabsToClose.push(tab.id);
            }
        });

        if (harvested.length === 0) return;

        downloadJSON(harvested);

        tabsToClose.forEach((id) => chrome.tabs.remove(id));
    });
}

function downloadJSON(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
    });

    const url = URL.createdObjectURL(blob);

    chrome.downloads.download({
        url,
        filename: `tab-purgatory-${new Date().toISOString().slice(0, 10)}.json`,
        saveAs: false
    });
}
