// --- 1. 即時時間更新 ---
function updateClock() {
    const timeDisplay = document.getElementById('current-time');
    if (!timeDisplay) return;
    const now = new Date();
    const options = { 
        year: 'numeric', month: 'numeric', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit', 
        hour12: true 
    };
    timeDisplay.innerText = now.toLocaleString('zh-TW', options);
}

// --- 2. 氣象圖表設定 ---
function initWeatherCharts() {
    // 檢查頁面上是否有圖表元件，若無則跳過（避免其他頁面報錯）
    if (!document.getElementById('temp-north')) return;

    const weekLabels = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

    function createWeatherChart(id, label, data, color, type, fill = false) {
        const ctx = document.getElementById(id);
        if (!ctx) return;
        new Chart(ctx, {
            type: type,
            data: {
                labels: weekLabels,
                datasets: [{
                    label: label,
                    data: data,
                    borderColor: color,
                    backgroundColor: color + '33',
                    fill: fill,
                    tension: 0.4,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: false },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 渲染各區數據
    createWeatherChart('temp-north', '最高溫', [25, 27, 26, 30, 28, 26, 25], '#e74c3c', 'line');
    createWeatherChart('rain-north', '降雨機率', [10, 20, 80, 40, 10, 5, 0], '#15b0f2', 'bar');
    createWeatherChart('temp-central', '最高溫', [28, 29, 31, 33, 30, 29, 28], '#e74c3c', 'line');   
    createWeatherChart('rain-central', '降雨機率', [0, 0, 5, 10, 0, 0, 0], '#3498db', 'bar');
    createWeatherChart('temp-south', '最高溫', [25, 27, 26, 30, 28, 26, 25], '#e74c3c', 'line');
    createWeatherChart('rain-south', '降雨機率', [10, 20, 80, 40, 10, 5, 0], '#3498db', 'bar');
    createWeatherChart('temp-east', '最高溫', [25, 27, 26, 30, 28, 26, 25], '#e74c3c', 'line');
    createWeatherChart('rain-east', '降雨機率', [10, 20, 80, 40, 10, 5, 0], '#3498db', 'bar');
}

// --- 3. 登入與安全邏輯 ---
//let currentCaptcha = "";
const MAX_FAILS = 5;
const LOCK_TIME_MINS = 5;
/*
function generateCaptcha() {
    const display = document.getElementById('captcha-code');
    const input = document.getElementById('captcha-input');
    if (!display) return;

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    currentCaptcha = code;
    display.innerText = code;
    if (input) input.value = "";
}*/

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
function saveRegionSettings() {
    const selector = document.getElementById('region-selector');
    if (selector) {
        const selectedRegion = selector.value;
        localStorage.setItem('user_region', selectedRegion);
        alert(`地區已成功設定為：${selectedRegion}`);
        location.reload(); 
    }
}

function logout() {
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('adminName');
    window.location.href = 'login.html';
}

// --- 5. 事件監聽與初始化 ---
document.addEventListener('DOMContentLoaded', async () => {
    // 啟動時鐘
    updateClock();
    setInterval(updateClock, 1000);

    // 初始化圖表
    initWeatherCharts();

    // LED 切換功能 (首頁)
    const led = document.getElementById('myLed');
    if (led) {
        led.onclick = () => led.classList.toggle('on');
    }

    // --- 登入頁面邏輯 ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        generateCaptcha();
        document.getElementById('btn-refresh-captcha').onclick = generateCaptcha;
        
        // 密碼顯示切換
        const togglePass = document.getElementById('togglePassword');
        const passInput = document.getElementById('password');
        if (togglePass && passInput) {
            togglePass.onclick = () => {
                const isPass = passInput.type === 'password';
                passInput.type = isPass ? 'text' : 'password';
                togglePass.innerText = isPass ? '🙈' : '👁️';
            };
        }

        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const msgDisplay = document.getElementById('login-msg');
            // const captchaInput = document.getElementById('captcha-input');
            const usernameInput = document.getElementById('username');

            // 驗證碼檢查
            /*
            if (captchaInput.value.toUpperCase() !== currentCaptcha) {
                msgDisplay.innerText = "驗證碼錯誤！";
                msgDisplay.className = "error";
                generateCaptcha();
                return;
            }*/

            // 取得或讀取 Config
            let config = JSON.parse(sessionStorage.getItem('globalConfig'));
            if (!config) config = await fetchConfig();

            if (!config) {
                msgDisplay.innerText = "系統設定載入失敗。";
                return;
            }

            const user = config.admins.find(u => 
                u.username === usernameInput.value && 
                u.password === String(passInput.value)
            );

            if (user) {
                sessionStorage.setItem('isAdmin', 'true');
                sessionStorage.setItem('adminName', user.displayName);
                window.location.href = 'admin.html';
            } else {
                msgDisplay.innerText = "帳號或密碼錯誤！";
                msgDisplay.className = "error";
                loginForm.reset();
                generateCaptcha();
            }
        };
    }

    // --- 管理員介面安全檢查 ---
    if (window.location.pathname.includes('admin.html')) {
        if (sessionStorage.getItem('isAdmin') !== 'true') {
            window.location.href = 'login.html';
        } else {
            const adminName = sessionStorage.getItem('adminName') || '管理員';
            const welcomeMsg = document.getElementById('admin-welcome');
            if (welcomeMsg) welcomeMsg.innerText = `歡迎回來，${adminName}`;

            const savedRegion = localStorage.getItem('user_region') || '臺北市';
            const selector = document.getElementById('region-selector');
            if (selector) selector.value = savedRegion;
        }
    }
});
