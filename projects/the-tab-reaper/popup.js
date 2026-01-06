document.getElementById("reap").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "REAP" });;
    window.close();
});