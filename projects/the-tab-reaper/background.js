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

/*
function downloadJSON(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);

    chrome.downloads.download({
        url,
        filename: `tab-purgatory-${new Date().toISOString().slice(0, 10)}.json`,
        saveAs: false
    });

    //no memory leaks in this household
    URL.revokeObjectURL(url);
}
*/
//okay clearly its been a minute since i last tried to make an extension bc why are there so many random things i cant do now tf -_-
//ive to make url a function i think
function downloadJSON(data) {
    const json = JSON.stringify(data, null, 2);
    const encoded = encodeURIComponent(json);
    const dataUrl = `data:application/json;charset=utf-8,${encoded}`;

    chrome.downloads.download({
        url: dataUrl,
        filename: `tab-purgatory-${new Date().toISOString().slice(0, 10)}.json`,
        saveAs: false
    });
}
//ts better work istg
