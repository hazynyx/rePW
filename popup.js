document.addEventListener('DOMContentLoaded', () => {
    const showTrueTimeToggle = document.getElementById('show-truetime');
    const darkModeToggle = document.getElementById('dark-mode');
    const speedDropdown = document.getElementById('speed-dropdown');

    // Load saved settings
    chrome.storage.local.get({
        showTrueTime: true,
        darkMode: false,
        customSpeed: 1.0
    }, (items) => {
        if (showTrueTimeToggle) showTrueTimeToggle.checked = items.showTrueTime;
        if (darkModeToggle) darkModeToggle.checked = items.darkMode;
        if (speedDropdown) speedDropdown.value = items.customSpeed;
    });

    // Handle toggles
    if (showTrueTimeToggle) {
        showTrueTimeToggle.addEventListener('change', (e) => {
            chrome.storage.local.set({ showTrueTime: e.target.checked });
        });
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            chrome.storage.local.set({ darkMode: e.target.checked });
        });
    }

    if (speedDropdown) {
        speedDropdown.addEventListener('change', (e) => {
            const speed = parseFloat(e.target.value);
            chrome.storage.local.set({ customSpeed: speed });
            
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "setSpeed", speed: speed }).catch(() => {});
                }
            });
        });
    }

    const openAnalysisBtn = document.getElementById('open-analysis-btn');
    if (openAnalysisBtn) {
        openAnalysisBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('analysis.html') });
        });
    }

    // Load Today's Study Time
    const displayEl = document.getElementById('study-time-display');
    if (displayEl) {
        chrome.storage.local.get({ dailyHistory: {} }, (res) => {
            // Adjust to local ISO string
            const offset = new Date().getTimezoneOffset() * 60000;
            const todayIso = (new Date(Date.now() - offset)).toISOString().slice(0, 10);
            
            const seconds = res.dailyHistory[todayIso] || 0;
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            displayEl.textContent = `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
        });
    }
});
