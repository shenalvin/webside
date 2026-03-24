// --- 1. 即時時間更新 (全站) ---
function updateClock() {
    const timeDisplay = document.getElementById('current-time');
    if (!timeDisplay) return;
    const now = new Date();
    const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    timeDisplay.innerText = now.toLocaleString('zh-TW', options);
}
// 初始呼叫與每秒更新
updateClock();
setInterval(updateClock, 1000);


// --- 2. 漢堡選單邏輯 (手機版) ---
const menuToggle = document.getElementById('mobile-menu-icon');
const navMenu = document.getElementById('nav-menu');

if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function() {
        this.classList.toggle('open'); // Icon 變 X
        navMenu.classList.toggle('show'); // 選單滑出
    });

    // 點擊選單連結後自動收起選單
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('open');
            navMenu.classList.remove('show');
        });
    });
}


// --- 3. 首頁緊急告警堆疊邏輯 (僅在 index.html 執行) ---
document.addEventListener('DOMContentLoaded', () => {
    // 檢查是否在首頁 (判斷是否有 alert-container)
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;

    // 模擬的緊急資料 (真實情況應從 API 取得)
    const currentAlerts = {
        highTemp: { id: 'temp_01', type: 'warning', title: '🔥 高溫警報', msg: '今日北部預估突破 38°C，請注意撒水降溫。', dailyMute: true },
        earthquake: { id: 'eq_20240520_01', type: 'danger', title: '⚠️ 地震告警', msg: '偵測到顯著地震(規模5.2)，請檢查設施設備！', dailyMute: false }
    };

    const today = new Date().toDateString();

    // 處理高溫警報 (每日只需顯示一次)
    if (currentAlerts.highTemp) {
        const muteDate = localStorage.getItem(`mute_${currentAlerts.highTemp.id}`);
        if (muteDate !== today) {
            showAlertModal(currentAlerts.highTemp);
        }
    }

    // 處理地震告警 (每次進入都要顯示，除非手動關閉X)
    if (currentAlerts.earthquake) {
        // 地震通常不設置「今日不再顯示」，因為隨時可能發生新的。
        // 這裡直接顯示。
        showAlertModal(currentAlerts.earthquake);
    }
});

// 創建並顯示告警對話框
function showAlertModal(alertData) {
    const container = document.getElementById('alert-container');
    
    // 創建 Modal HTML
    const modalHTML = `
        <div class="modal-alert ${alertData.type}" id="modal-${alertData.id}">
            <button class="alert-close-x" onclick="closeSpecificAlert('modal-${alertData.id}')">&times;</button>
            <div class="alert-content">
                <h2>${alertData.title}</h2>
                <p>${alertData.msg}</p>
            </div>
            ${alertData.dailyMute ? `
                <div class="alert-action-row">
                    <button class="btn-mute-today" onclick="muteAlertToday('${alertData.id}', 'modal-${alertData.id}')">今日不再顯示</button>
                </div>
            ` : ''}
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', modalHTML);
}

// 關閉單個告警 (暫時關閉X)
function closeSpecificAlert(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.animation = 'slideOutUp 0.5s ease forwards';
        setTimeout(() => modal.remove(), 500);
    }
}

// 今日不再顯示邏輯
function muteAlertToday(alertId, modalId) {
    const today = new Date().toDateString();
    localStorage.setItem(`mute_${alertId}`, today);
    closeSpecificAlert(modalId);
}