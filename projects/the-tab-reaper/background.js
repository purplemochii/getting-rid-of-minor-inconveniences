const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create("weeklyReap", {
        periodInMinutes: 7 * 24 * 60 //1 wk
    });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "weeklyReap") {
        reapTabs();
    }
});

/*
i think it would be better to have to sort through the tabs once a month,
so i'll get the reaper to do its job like once a week and then instead of 
having a json file downloaded weekly, i store all the reaped tabs and then
have them all downloaded once a month. ik im still gonna change the logic fml
*/
function reapTabs() {
    chrome.tabs.query({}, (tabs) => {
        const now = Date.now();
        chrome.storage.local.get({ tabSouls: [] }, (result) => {
            const existingSouls = result.tabSouls;
            const newSouls = [];
            const tabsToClose = [];

            tabs.forEach((tab) => {
                if (!tab.lastAccessed) return;
                if (tab.pinned) return;

                const inactiveFor = now - tab.lastAccessed;

                if (inactiveFor > FIVE_DAYS_MS) {
                    newSouls.push({
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

            if (newSouls.length === 0) return;

            const updatedSouls = existingSouls.concat(newSouls);

            chrome.storage.local.set({ tabSouls: updatedSouls }, () => {
                exportMonthlyPurgatory(updatedSouls);
                tabsToClose.forEach(id => chrome.tabs.remove(id));
            });
        }),
    });
}

//motnhly download fn
function exportMonthlyPurgatory(allSouls) {
    const now = new Date();
    const month = now.toISOString().slice(0, 7); //yyyy-mm

    const monthlySouls = allSouls.filter(soul =>
        soul.dateHarvested.startsWith(month)
    );

    if (monthlySouls.length === 0) return;

    const json = JSON.stringify(monthlySouls, null, 2);
    const encoded = encodeURIComponent(json);
    const dataUrl = `data:application/json; charset = utf-8, ${encoded}`;

    chrome.downloads.download({
        url: dataUrl,
        filename: `tab-purgatory-${month}.json`,
        saveAs: false
    });
}


//idek why im keeping ts🥀 i have a hoarding problem fr
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
*/

