// Chart.js Default Configurations for Dark Theme
Chart.defaults.color = '#a1a1aa';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.tooltip.backgroundColor = '#18181b';
Chart.defaults.plugins.tooltip.titleColor = '#ffffff';
Chart.defaults.plugins.tooltip.bodyColor = '#ffffff';
Chart.defaults.plugins.tooltip.borderColor = '#27272a';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 8;
Chart.defaults.plugins.tooltip.cornerRadius = 4;
Chart.defaults.scale.grid.color = '#27272a';
Chart.defaults.scale.grid.borderColor = 'transparent';

let timelineChart;
let selectedDate = new Date();
let selectedMonth = new Date();
let isAllTimeSaved = false;

document.addEventListener('DOMContentLoaded', () => {
    function formatTime(totalSeconds) {
        if (!totalSeconds || isNaN(totalSeconds)) return "0h 0m";
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }

    function formatTimeVerbose(totalSeconds) {
        if (!totalSeconds || isNaN(totalSeconds)) return "0h 0m 0s";
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = Math.floor(totalSeconds % 60);
        if (h > 0) return `${h}h ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    }

    function formatTimeCal(totalSeconds) {
        if (!totalSeconds || isNaN(totalSeconds)) return "0:00";
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        return `${h}:${m.toString().padStart(2, '0')}`;
    }

    function getIso(dateObj) {
        const offset = dateObj.getTimezoneOffset() * 60000;
        return (new Date(dateObj - offset)).toISOString().slice(0, 10);
    }

    function isSameDay(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    function calculateInsights(res) {
        const todayIso = getIso(new Date());
        let streak = 0;
        let activeDays = 0;
        let totalStudyAllTime = 0;
        let bestDayVal = 0;
        let bestDayIso = '--';
        
        for (const [date, seconds] of Object.entries(res.dailyHistory)) {
            if (seconds > 0) {
                totalStudyAllTime += seconds;
            }
            if (seconds >= 1800) {
                activeDays++;
                if (seconds > bestDayVal) {
                    bestDayVal = seconds;
                    bestDayIso = date;
                }
            }
        }

        let checkDate = new Date();
        if (!res.dailyHistory[todayIso] || res.dailyHistory[todayIso] < 1800) {
            checkDate.setDate(checkDate.getDate() - 1);
        }
        
        while (true) {
            const iso = getIso(checkDate);
            if (res.dailyHistory[iso] && res.dailyHistory[iso] >= 1800) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        const hourTotals = new Array(24).fill(0);
        for (const [date, hoursObj] of Object.entries(res.hourlyHistory)) {
            for (const [hourStr, seconds] of Object.entries(hoursObj)) {
                hourTotals[parseInt(hourStr)] += seconds;
            }
        }

        let bestHour = -1;
        let maxHourVal = 0;
        for (let i = 0; i < 24; i++) {
            if (hourTotals[i] > maxHourVal) {
                maxHourVal = hourTotals[i];
                bestHour = i;
            }
        }

        const avgDaily = activeDays > 0 ? totalStudyAllTime / activeDays : 0;
        
        let bestHourStr = '--:--';
        if (bestHour !== -1) {
            const ampm = bestHour >= 12 ? 'PM' : 'AM';
            const h12 = bestHour % 12 || 12;
            bestHourStr = `${h12}:00 ${ampm}`;
        }

        return { streak, avgDaily, bestDayVal, bestDayIso, bestHourStr };
    }

    function renderUI() {
        chrome.storage.local.get({
            detailedStudyTime: { lectures: 0, notes: 0, dpps: 0 },
            detailedTimeSaved: { customSpeed: 0, jumpcutter: 0 },
            dailyHistory: {},
            hourlyHistory: {},
            dailyCategoryHistory: {},
            dailySavedHistory: {}
        }, (res) => {
            const today = new Date();
            const selectedIso = getIso(selectedDate);
            const insights = calculateInsights(res);
            
            // --- METRICS ---
            const totalLectures = res.detailedStudyTime.lectures || 0;
            const totalDpps = res.detailedStudyTime.dpps || 0;
            const totalNotes = res.detailedStudyTime.notes || 0;
            const totalStudy = totalLectures + totalDpps + totalNotes;
            
            const totalSpeedSaved = res.detailedTimeSaved.customSpeed || 0;
            const totalJumpSaved = res.detailedTimeSaved.jumpcutter || 0;
            const totalSaved = totalSpeedSaved + totalJumpSaved;

            let efficiencyPct = 0;
            if (totalStudy > 0) efficiencyPct = Math.round((totalSaved / totalStudy) * 100);

            document.getElementById('top-total-time').textContent = formatTime(totalStudy);
            document.getElementById('top-lectures').textContent = formatTime(totalLectures);
            document.getElementById('top-dpps').textContent = formatTime(totalDpps);
            document.getElementById('top-notes').textContent = formatTime(totalNotes);
            document.getElementById('top-time-saved').textContent = formatTime(totalSaved);
            document.getElementById('top-efficiency').textContent = `${efficiencyPct}%`;

            const heroTodayEl = document.getElementById('hero-today-time');
            if (heroTodayEl) heroTodayEl.textContent = formatTime(res.dailyHistory[getIso(today)] || 0);

            // --- CHART ---
            const dayLabelEl = document.getElementById('current-day-label');
            dayLabelEl.textContent = isSameDay(selectedDate, today) ? "Today" : selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

            const hourly = res.hourlyHistory[selectedIso] || {};
            const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
            const hourData = Array.from({length: 24}, (_, i) => (hourly[i.toString()] || 0) / 60);

            if (timelineChart) timelineChart.destroy();
            timelineChart = new Chart(document.getElementById('dailyTimelineChart'), {
                type: 'bar', // bar chart looks flatter
                data: {
                    labels: hours,
                    datasets: [{
                        label: 'Minutes',
                        data: hourData,
                        backgroundColor: '#3b82f6',
                        borderRadius: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: { padding: { top: 10 } },
                    scales: {
                        x: { 
                            display: true,
                            grid: { display: false },
                            ticks: {
                                maxTicksLimit: 8,
                                font: { size: 10 },
                                callback: function(val, index) {
                                    const h = index; // The index is the hour (0-23)
                                    if (h === 0) return '12am';
                                    if (h === 12) return '12pm';
                                    return h > 12 ? (h - 12) + 'pm' : h + 'am';
                                }
                            }
                        },
                        y: { 
                            beginAtZero: true, 
                            suggestedMax: 60,
                            ticks: { maxTicksLimit: 5, font: {size: 10}, callback: v => v + 'm' }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: (ctx) => `${Math.round(ctx.raw)} mins` } }
                    }
                }
            });

            // --- INSIGHTS ---
            document.getElementById('insight-streak').textContent = `${insights.streak} Days`;
            document.getElementById('insight-avg').textContent = formatTime(insights.avgDaily);
            document.getElementById('insight-best-val').textContent = formatTime(insights.bestDayVal);
            document.getElementById('insight-best-date').textContent = insights.bestDayIso !== '--' ? 
                new Date(insights.bestDayIso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '--';
            document.getElementById('insight-hour-val').textContent = insights.bestHourStr;

            // --- TIME SAVED ---
            let effSpeed = 0, effJump = 0, effTotal = 0;
            if (isAllTimeSaved) {
                effSpeed = totalSpeedSaved; effJump = totalJumpSaved; effTotal = totalSaved;
            } else {
                const daySaved = res.dailySavedHistory[selectedIso] || { customSpeed: 0, jumpcutter: 0 };
                effSpeed = daySaved.customSpeed || 0; effJump = daySaved.jumpcutter || 0; effTotal = effSpeed + effJump;
            }

            document.getElementById('val-speed').textContent = formatTimeVerbose(effSpeed);
            document.getElementById('stat-total-saved').textContent = formatTimeVerbose(effTotal);

            const maxSaved = Math.max(effTotal, 1);
            document.getElementById('bar-speed').style.width = `${Math.min((effSpeed/maxSaved)*100, 100)}%`;

            // --- MONTHLY CALENDAR ---
            document.getElementById('current-month-label').textContent = selectedMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            
            const calGrid = document.querySelector('.calendar-grid');
            const headers = Array.from(calGrid.querySelectorAll('.cal-header'));
            calGrid.innerHTML = '';
            headers.forEach(h => calGrid.appendChild(h));

            const year = selectedMonth.getFullYear();
            const month = selectedMonth.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            
            let startOffset = firstDay.getDay() - 1;
            if (startOffset === -1) startOffset = 6; 

            for (let i = 0; i < startOffset; i++) {
                calGrid.appendChild(document.createElement('div'));
            }

            for (let i = 1; i <= lastDay.getDate(); i++) {
                const cellDate = new Date(year, month, i);
                const iso = getIso(cellDate);
                const seconds = res.dailyHistory[iso] || 0;

                let level = 0;
                if (seconds >= 1800) {
                    const hours = seconds / 3600;
                    if (hours >= 6) level = 4;
                    else if (hours >= 4) level = 3;
                    else if (hours >= 2) level = 2;
                    else level = 1;
                }

                const cell = document.createElement('div');
                cell.className = 'cal-cell';
                if (isSameDay(cellDate, today)) cell.classList.add('today');
                if (level > 0) cell.classList.add(`heat-${level}`);

                const timeStr = seconds > 0 ? formatTimeCal(seconds) : '0:00';
                cell.setAttribute('title', `${timeStr}`);
                cell.innerHTML = `<div class="cal-date">${i}</div>`;
                calGrid.appendChild(cell);
            }
        });
    }

    document.getElementById('prev-day').addEventListener('click', () => { selectedDate.setDate(selectedDate.getDate() - 1); renderUI(); });
    document.getElementById('next-day').addEventListener('click', () => { if (selectedDate < new Date()) { selectedDate.setDate(selectedDate.getDate() + 1); renderUI(); } });
    document.getElementById('toggle-daily').addEventListener('click', (e) => { isAllTimeSaved = false; e.target.classList.add('active'); document.getElementById('toggle-alltime').classList.remove('active'); renderUI(); });
    document.getElementById('toggle-alltime').addEventListener('click', (e) => { isAllTimeSaved = true; e.target.classList.add('active'); document.getElementById('toggle-daily').classList.remove('active'); renderUI(); });
    document.getElementById('prev-month').addEventListener('click', () => { selectedMonth.setMonth(selectedMonth.getMonth() - 1); renderUI(); });
    document.getElementById('next-month').addEventListener('click', () => { selectedMonth.setMonth(selectedMonth.getMonth() + 1); renderUI(); });

    renderUI();
    chrome.storage.onChanged.addListener((c, ns) => { if (ns === 'local') renderUI(); });
});
