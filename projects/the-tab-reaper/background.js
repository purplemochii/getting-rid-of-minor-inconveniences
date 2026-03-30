const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

// ── Alarm setup ────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create("weeklyReap", {
        periodInMinutes: 7 * 24 * 60
    });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "weeklyReap") {
        notifyBeforeReaping(); // ask first, don't just nuke tabs silently
    }
});

// ── Manual reap trigger from popup ────────────────────────────────────────
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "REAP") {
        reapTabs();
    }
});

// ── Scheduled reap: ask first via notification ─────────────────────────────
function notifyBeforeReaping() {
    chrome.tabs.query({}, (tabs) => {
        const now = Date.now();
        const doomedCount = tabs.filter(t =>
            !t.pinned && t.lastAccessed && (now - t.lastAccessed) > FIVE_DAYS_MS
        ).length;

        if (doomedCount === 0) return;

        chrome.notifications.create("reapConfirm", {
            type: "basic",
            iconUrl: "icon.png",
            title: "⚰️ The Reaper Stirs",
            message: `${doomedCount} tab${doomedCount === 1 ? "" : "s"} have gone cold. Shall they be harvested?`,
            buttons: [
                { title: "Begin the Reaping" },
                { title: "Spare Them (for now)" }
            ],
            requireInteraction: true
        });
    });
}

chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
    if (notifId === "reapConfirm") {
        if (btnIdx === 0) reapTabs();
        chrome.notifications.clear(notifId);
    }
});

// ── Core reaping logic ─────────────────────────────────────────────────────
function reapTabs() {
    chrome.tabs.query({}, (tabs) => {
        const now = Date.now();
        chrome.storage.local.get({ tabSouls: [] }, (result) => {
            const existingSouls = result.tabSouls;
            const newSouls = [];
            const tabsToClose = [];

            tabs.forEach((tab) => {
                if (!tab.lastAccessed || tab.pinned) return;

                if ((now - tab.lastAccessed) > FIVE_DAYS_MS) {
                    newSouls.push({
                        id: crypto.randomUUID(),
                        title: tab.title || "Unnamed Soul",
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

            const updatedSouls = [...existingSouls, ...newSouls];

            chrome.storage.local.set({ tabSouls: updatedSouls }, () => {
                exportMonthlyPurgatory(updatedSouls);
                tabsToClose.forEach(id => chrome.tabs.remove(id));
            });
        });
    });
}

// ── Monthly HTML export (once per month, not every reap cycle) ─────────────
function exportMonthlyPurgatory(allSouls) {
    const now = new Date();
    const month = now.toISOString().slice(0, 7); // yyyy-mm

    chrome.storage.local.get({ lastExportMonth: null }, (result) => {
        if (result.lastExportMonth === month) return; // already exported this month, chill

        const monthlySouls = allSouls.filter(s => s.dateHarvested.startsWith(month));
        if (monthlySouls.length === 0) return;

        const html = generatePurgatoryHTML(monthlySouls, month);
        const encoded = encodeURIComponent(html);
        const dataUrl = `data:text/html;charset=utf-8,${encoded}`;

        chrome.downloads.download({
            url: dataUrl,
            filename: `tab-purgatory-${month}.html`,
            saveAs: false
        }, () => {
            chrome.storage.local.set({ lastExportMonth: month });
        });
    });
}

// ── HTML purgatory page generation ────────────────────────────────────────
function generatePurgatoryHTML(souls, month) {
    const cards = souls.map(soul => `
        <div class="soul-card">
            <div class="soul-header">
                ${soul.favicon
                    ? `<img class="favicon" src="${soul.favicon}" onerror="this.style.display='none'" alt="">`
                    : `<span class="favicon-ghost">☠</span>`
                }
                <a class="soul-title" href="${escapeHTML(soul.url)}" target="_blank" rel="noopener">
                    ${escapeHTML(soul.title)}
                </a>
            </div>
            <div class="soul-url">${escapeHTML(soul.url)}</div>
            <div class="soul-meta">
                <span>Harvested ${new Date(soul.dateHarvested).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric"
                })}</span>
                <span class="soul-status">${soul.status}</span>
            </div>
        </div>
    `).join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Tab Purgatory — ${month}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            background: #0a0a0a;
            color: #c9c9c9;
            font-family: 'Segoe UI', system-ui, sans-serif;
            min-height: 100vh;
            padding: 48px 20px;
        }

        header {
            text-align: center;
            margin-bottom: 48px;
        }

        header h1 {
            font-size: 2.2rem;
            color: #e8d5c4;
            letter-spacing: 0.06em;
            margin-bottom: 8px;
        }

        header .chronicle {
            color: #555;
            font-size: 0.9rem;
            margin-bottom: 16px;
        }

        .soul-count-badge {
            display: inline-block;
            background: #1a0a0a;
            border: 1px solid #3d1515;
            color: #c0392b;
            padding: 5px 16px;
            border-radius: 20px;
            font-size: 0.82rem;
            letter-spacing: 0.04em;
        }

        .souls-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 14px;
            max-width: 1100px;
            margin: 0 auto;
        }

        .soul-card {
            background: #111;
            border: 1px solid #1e1e1e;
            border-radius: 10px;
            padding: 16px;
            transition: border-color 0.2s, transform 0.15s;
        }

        .soul-card:hover {
            border-color: #3d1515;
            transform: translateY(-1px);
        }

        .soul-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
            overflow: hidden;
        }

        .favicon {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
            border-radius: 3px;
        }

        .favicon-ghost {
            flex-shrink: 0;
            font-size: 13px;
            opacity: 0.4;
        }

        .soul-title {
            color: #e8d5c4;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
        }

        .soul-title:hover { color: #c0392b; }

        .soul-url {
            font-size: 0.72rem;
            color: #3a3a3a;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 12px;
        }

        .soul-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.72rem;
            color: #444;
        }

        .soul-status {
            background: #140606;
            border: 1px solid #2a1010;
            color: #6b2828;
            padding: 2px 9px;
            border-radius: 12px;
            text-transform: uppercase;
            font-size: 0.62rem;
            letter-spacing: 0.1em;
        }

        footer {
            text-align: center;
            margin-top: 64px;
            color: #2a2a2a;
            font-size: 0.78rem;
        }
    </style>
</head>
<body>
    <header>
        <h1>Tab Purgatory</h1>
        <p class="chronicle">${month} — the chronicle of the forgotten</p>
        <span class="soul-count-badge">${souls.length} soul${souls.length === 1 ? "" : "s"} harvested</span>
    </header>
    <div class="souls-grid">
        ${cards}
    </div>
    <footer>
        <p>archived by tab reaper · the machine remembers what you forgot</p>
    </footer>
</body>
</html>`;
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}