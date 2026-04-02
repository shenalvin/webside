// --- 1. 即時時間更新 ---
function updateClock() {
    const timeDisplay = document.getElementById('current-time');
    if (!timeDisplay) return;
    const now = new Date();
    
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    
    const hour = now.getHours();
    const ap = hour < 12 ? '上午' : '下午';
    const displayHour = String(hour % 12 || 12).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');

    timeDisplay.innerText = `${yyyy}/${mm}/${dd} \n ${ap} ${displayHour}:${mins}:${secs}`;
}

// --- 模組：資料顯示初始化 ---
function initDataDisplay() {
    const region = localStorage.getItem('user_region') || '臺北市';
    
    // 更新所有標題中的地區名稱
    document.querySelectorAll('.region-name-display').forEach(el => {
        el.innerText = `(${region})`;
    });

    // 將所有即時數值設為 --
    document.querySelectorAll('.value').forEach(el => {
        if (!el.closest('.status-card')) return; // 跳過控制面板的數值
        el.innerText = '--';
    });
}

// --- 模組：進階氣象圖表 ---
function initAdvancedCharts() {
    if (!document.getElementById('temp-north')) return;

    // 生成未來 7 天日期 (yyyy/mm/dd)
    const dateLabels = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dateLabels.push(`${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`);
    }

    const chartConfig = (id, tempDataHigh, tempDataLow, rainData) => {
        const ctx = document.getElementById(id);
        if (!ctx) return;
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dateLabels,
                datasets: [
                    { label: '最高溫', data: tempDataHigh, borderColor: '#e74c3c', yAxisID: 'y' },
                    { label: '最低溫', data: tempDataLow, borderColor: '#3498db', yAxisID: 'y' },
                    { label: '降雨機率', data: rainData, backgroundColor: 'rgba(21, 176, 242, 0.2)', fill: true, type: 'bar', yAxisID: 'y1' }
                ]
            },
            options: {
                scales: {
                    y: { type: 'linear', position: 'left', title: { display: true, text: '溫度 (°C)' } },
                    y1: { type: 'linear', position: 'right', title: { display: true, text: '降雨 (%)' }, grid: { drawOnChartArea: false } }
                }
            }
        });
    };

    // 範例呼叫 (數據可改為從 localStorage 讀取之地區對應數值)
    chartConfig('temp-north', [28, 30, 29, 32, 31, 28, 27], [22, 23, 22, 24, 23, 21, 20], [10, 20, 50, 30, 10, 0, 5]);
}

// --- 模組：設備控制中心 ---
const devices = ['power', 'fan', 'sprinkler', 'motor'];

function updateDeviceUI() {
    devices.forEach(dev => {
        const status = localStorage.getItem(`dev_${dev}`) === 'on';
        const led = document.getElementById(`led-${dev}`);
        const btn = document.getElementById(`btn-${dev}`);
        if (led) led.className = status ? 'led on' : 'led';
        if (btn) btn.innerText = status ? '關閉' : '啟動';
    });
}

window.toggleDevice = function(devName) {
    const current = localStorage.getItem(`dev_${devName}`) === 'on';
    localStorage.setItem(`dev_${devName}`, current ? 'off' : 'on');
    updateDeviceUI();
};

// --- 模組：數據狀態處理 ---
function updateDataDisplay(dataObj) {
    // dataObj 格式範例: { soilTemp: 35, humidity: null }
    const sensors = {
        'soil-temp': { val: dataObj.soilTemp, threshold: 30, unit: '°C' },
        'humidity': { val: dataObj.humidity, threshold: 50, unit: '%' }
    };

    for (let id in sensors) {
        const el = document.getElementById(id);
        const card = el?.closest('.info-card');
        if (!el || !card) continue;

        const sensor = sensors[id];
        
        if (sensor.val === null || sensor.val === undefined) {
            // 無資料狀態
            el.innerText = '--';
            card.querySelector('.desc').innerText = '狀態：載入中...';
            card.className = 'info-card status-card status-normal';
        } else {
            // 有資料：判定異常 (這裡你可以針對不同 ID 寫不同判斷式)
            el.innerText = sensor.val + sensor.unit;
            const isAbnormal = sensor.val > sensor.threshold; 
            
            card.querySelector('.desc').innerText = isAbnormal ? '狀態：異常' : '狀態：正常';
            card.className = isAbnormal ? 'info-card status-card status-danger' : 'info-card status-card status-success';
        }
    }
}

function resetDataDisplay() {
    document.querySelectorAll('.info-card.status-card').forEach(card => {
        const valEl = card.querySelector('.value');
        const descEl = card.querySelector('.desc');
        if (valEl) valEl.innerText = '--';
        if (descEl) descEl.innerText = '狀態：載入中...';
        // 移除異常顏色類別，回歸預設美觀樣式
        card.classList.remove('status-danger', 'status-success');
        card.classList.add('status-normal');
    });
}

// --- 模組：設備定時與開關 ---
// --- 模組 3：自動化與週期定時邏輯 ---
function checkAutomatedSystems(currentTemp) {
    const target = parseFloat(document.getElementById('fan-target-temp')?.value || 28);
    // 類似冷氣設定：超過設定溫度啟動，低於則停止
    if (currentTemp >= target) {
        setDeviceStatus('fan', 'on');
    } else {
        setDeviceStatus('fan', 'off');
    }
}

// 週期定時器檢查 (每一分鐘檢查一次)
setInterval(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const currentDay = now.getDay(); // 0 是週日

    ['fan', 'sprinkler'].forEach(dev => {
        const setTime = document.getElementById(`${dev}-timer-time`)?.value;
        const setType = document.getElementById(`${dev}-timer-type`)?.value;

        if (setTime === currentTime) {
            if (setType === 'daily' || (setType === 'weekly' && currentDay === 1)) { // 範例：每周一
                setDeviceStatus(dev, 'on');
            }
        }
    });
}, 60000);


// --- 模組 2：美化版氣象趨勢圖 ---
function initAdvancedWeatherChart(id, dataHigh, dataLow, dataRain) {
    const ctx = document.getElementById(id);
    if (!ctx) return;

    // 生成未來 7 天日期標籤
    const labels = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
    });

    new Chart(ctx, {
        data: {
            labels: labels,
            datasets: [
                { type: 'line', label: '最高溫', data: dataHigh, borderColor: '#e74c3c', yAxisID: 'yTemp' },
                { type: 'line', label: '最低溫', data: dataLow, borderColor: '#3498db', yAxisID: 'yTemp' },
                { type: 'bar', label: '降雨機率', data: dataRain, backgroundColor: 'rgba(52, 152, 219, 0.2)', yAxisID: 'yRain' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                yTemp: { type: 'linear', position: 'left', title: { display: true, text: '溫度 (°C)' } },
                yRain: { type: 'linear', position: 'right', max: 100, title: { display: true, text: '降雨 (%)' } }
            }
        }
    });
}

// --- 3. 登入與安全邏輯 ---
const MAX_FAILS = 5;
const LOCK_TIME_MINS = 5;


// --- 3. 核心功能：讀取 Config (登入關鍵) ---
async function fetchConfig() {
    try {
        // 注意：請確保你的目錄下有 data/config.json 檔案
        const response = await fetch('data/config.json');
        if (!response.ok) throw new Error('檔案讀取失敗');
        const data = await response.json();
        sessionStorage.setItem('globalConfig', JSON.stringify(data));
        return data;
    } catch (error) {
        console.error("無法讀取 config.json:", error);
        // 備用方案：若 fetch 失敗，可在此填寫預設帳密供測試
        return { admins: [{ username: "admin", password: "123", displayName: "管理員" }] };
    }
}

// --- 4. 管理員頁面功能 ---
window.saveRegionSettings = function() {
    const selector = document.getElementById('region-selector');
    if (selector) {
        localStorage.setItem('user_region', selector.value);
        alert(`地區已成功設定為：${selector.value}`);
        location.reload(); 
    }
};

window.logout = function() {
    sessionStorage.clear();
    window.location.href = 'login.html';
};

document.addEventListener('DOMContentLoaded', async () => {
    
    updateClock();
    setInterval(updateClock, 1000);
    initDataDisplay();
    initAdvancedCharts();
    if (document.getElementById('admin-welcome')) updateDeviceUI();
    
    // [登入頁面邏輯]
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const passwordInput = document.getElementById('password'); 
        const togglePassword = document.getElementById('togglePassword'); 

        if (togglePassword && passwordInput) {
            togglePassword.onclick = () => {
                const isPass = passwordInput.type === 'password';
                passwordInput.type = isPass ? 'text' : 'password';
                togglePassword.innerText = isPass ? '🙈' : '👁️';
            };
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const msgDisplay = document.getElementById('login-msg');
            const usernameInput = document.getElementById('username');

            let config;
            try {
                const response = await fetch('data/config.json');
                if (!response.ok) throw new Error();
                config = await response.json();
            } catch (err) {
                // 備用帳密供測試
                config = { admins: [{ username: "admin", password: "123", displayName: "管理員" }] };
            }

            // 修正比對邏輯中的變數名稱
            const user = config.admins.find(u => 
                u.username === usernameInput.value && 
                String(u.password) === String(passwordInput.value)
            );

            if (user) {
                sessionStorage.setItem('isAdmin', 'true');
                sessionStorage.setItem('adminName', user.displayName);
                window.location.href = 'admin.html';
            } else {
                if (msgDisplay) {
                    msgDisplay.innerText = "帳號或密碼錯誤！";
                    msgDisplay.className = "error";
                }
            }
        });
    }

    // [管理頁面初始化與安全檢查]
    if (window.location.pathname.includes('admin.html')) {
        if (sessionStorage.getItem('isAdmin') !== 'true') {
            window.location.href = 'login.html';
        } else {
            const adminName = sessionStorage.getItem('adminName') || '管理員';
            const welcomeMsg = document.getElementById('admin-welcome');
            if (welcomeMsg) welcomeMsg.innerText = `歡迎回來，${adminName}`;

            const selector = document.getElementById('region-selector');
            if (selector) {
                selector.value = localStorage.getItem('user_region') || '臺北市';
            }
        }
    }
});