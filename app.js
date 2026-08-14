// Инициализация Telegram WebApp
let tg = null;
let userId = null;
let username = "Пользователь";
let isAdmin = false;
let isSubscribedUser = false;

if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.expand();
    
    // Пытаемся получить реальные данные из Telegram
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        userId = tg.initDataUnsafe.user.id;
        username = tg.initDataUnsafe.user.username || tg.initDataUnsafe.user.first_name || "Пользователь";
    }
}

// Твой ID Telegram для проверки на права Создателя
const ADMIN_ID = 8544752152;

if (userId === ADMIN_ID) {
    isAdmin = true;
    isSubscribedUser = true; // Создателю доступен безлимит всегда
}

// Системный стейт приложения
let isConnected = false;
let isTariffsOpen = false;
let isPromoOpen = false;
let isRefOpen = false;
let currentRefPercent = 5.0;
const maxRefPercent = 40.0;
let isGameRunning = false;

// Исходные цены тарифов
const originalPrices = { 1: 150, 3: 400, 6: 650, 12: 990 };
let activeDiscounts = { 1: 0, 3: 0, 6: 0, 12: 0 };

// Запуск инициализации при полной загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    initSpaceFX();
    initMap3D();
    applyUserStatusUI();
    
    // Навешиваем клик на кнопку подключения
    const connectBtn = document.getElementById("connect-btn");
    if (connectBtn) {
        connectBtn.addEventListener("click", () => {
            if (isConnected) {
                disconnectVPN();
            } else {
                connectVPN();
            }
        });
    }
    
    // Выравниваем индикатор навигации на первой вкладке
    alignNavBox(0);
});

// Настройка интерфейса в зависимости от роли (Создатель / Пользователь)
function applyUserStatusUI() {
    const subDays = document.getElementById("sub-days-left");
    const progressBar = document.getElementById("sub-progress-bar");
    
    if (isAdmin) {
        if (subDays) subDays.innerHTML = "👑 Создатель (∞ Безлимит)";
        if (progressBar) {
            progressBar.style.width = "100%";
            progressBar.style.background = "linear-gradient(90deg, #f59e0b, #a855f7)";
        }
    } else {
        if (subDays) subDays.innerHTML = "Не активна";
        if (progressBar) progressBar.style.width = "0%";
    }
    checkGameLockStatus();
}

// Космический фон (звезды)
function initSpaceFX() {
    const starBox = document.getElementById("stardust-box");
    if (!starBox) return;

    let starHTML = "";
    for (let i = 0; i < 30; i++) {
        const top = Math.random() * 95;
        const left = Math.random() * 95;
        starHTML += `<div class="star-dot" style="top:${top}%; left:${left}%; width:2px; height:2px; --duration:3s; animation-delay:${Math.random()*2}s;"></div>`;
    }
    starBox.innerHTML = starHTML;
}

// Карта мира (материки и узлы сети)
function initMap3D() {
    const continentsGroup = document.getElementById("map-continents-group");
    const citiesGroup = document.getElementById("all-cities-group");
    if (!continentsGroup || !citiesGroup) return;

    continentsGroup.innerHTML = `
        <path class="continent-shape" d="M 50 120 C 60 90, 100 80, 150 70 C 200 60, 270 65, 305 85 C 325 105, 305 130, 275 145 Z" />
        <path class="continent-shape" d="M 430 145 C 450 120, 490 90, 560 80 C 640 70, 760 65, 850 85 C 910 100, 940 125, 940 160 Z" />
    `;

    let citiesHTML = "";
    for (let i = 0; i < 30; i++) {
        const cx = 100 + Math.random() * 700;
        const cy = 80 + Math.random() * 300;
        citiesHTML += `<circle cx="${cx}" cy="${cy}" r="2.5" class="city-point" id="city-node-${i}" style="opacity: 0.6; fill: #3b82f6;"/>`;
    }
    citiesGroup.innerHTML = citiesHTML;
}

// Логика подключения VPN
function connectVPN() {
    const statusText = document.getElementById("status-text");
    const statusBadge = document.getElementById("status-badge");
    const connectBtn = document.getElementById("connect-btn");
    const copyKeyBtn = document.getElementById("copy-key-btn");

    if (statusText) statusText.innerText = "ПОДКЛЮЧЕНИЕ...";
    if (statusBadge) statusBadge.className = "status-badge connecting";

    setTimeout(() => {
        isConnected = true;
        if (statusText) statusText.innerText = "ПОДКЛЮЧЕНО";
        if (statusBadge) statusBadge.className = "status-badge connected";
        if (connectBtn) connectBtn.classList.add("connected");
        if (copyKeyBtn) copyKeyBtn.classList.remove("hidden-slide");
        
        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
    }, 1200);
}

function disconnectVPN() {
    const statusText = document.getElementById("status-text");
    const statusBadge = document.getElementById("status-badge");
    const connectBtn = document.getElementById("connect-btn");
    const copyKeyBtn = document.getElementById("copy-key-btn");

    isConnected = false;
    if (statusText) statusText.innerText = "ОТКЛЮЧЕНО";
    if (statusBadge) statusBadge.className = "status-badge disconnected";
    if (connectBtn) connectBtn.classList.remove("connected");
    if (copyKeyBtn) copyKeyBtn.classList.add("hidden-slide");

    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");
}

function copyVlessKey() {
    const dummyKey = "vless://sol-vpn-node-amsterdam-secure-key-9981273";
    navigator.clipboard.writeText(dummyKey);
    alert("✨ Ключ VLESS скопирован!");
}

// Управление карточками Промокодов и Реферальной программы
function togglePromoCard() {
    const drawer = document.getElementById("promo-drawer");
    const promoCardTrigger = document.getElementById("promo-trigger-card");
    if (!drawer) return;

    isPromoOpen = !isPromoOpen;
    if (isPromoOpen) {
        if (isRefOpen) toggleRefCard();
        if (isTariffsOpen) toggleTariffs();
        drawer.classList.remove("hidden-drawer");
        if (promoCardTrigger) promoCardTrigger.classList.add("active-card");
    } else {
        drawer.classList.add("hidden-drawer");
        if (promoCardTrigger) promoCardTrigger.classList.remove("active-card");
    }
}

function toggleRefCard() {
    const drawer = document.getElementById("ref-drawer");
    const refCardTrigger = document.getElementById("ref-trigger-card");
    if (!drawer) return;

    isRefOpen = !isRefOpen;
    if (isRefOpen) {
        if (isPromoOpen) togglePromoCard();
        if (isTariffsOpen) toggleTariffs();
        drawer.classList.remove("hidden-drawer");
        if (refCardTrigger) refCardTrigger.classList.add("active-card");
    } else {
        drawer.classList.add("hidden-drawer");
        if (refCardTrigger) refCardTrigger.classList.remove("active-card");
    }
}

function applyPromoCode() {
    const input = document.getElementById("promo-input-field");
    if (!input) return;
    const val = input.value.trim().toUpperCase();

    if (val === "SOL2025" || val === "VIP") {
        alert("🎉 Промокод успешно активирован на 7 дней!");
        isSubscribedUser = true;
        
        const subDays = document.getElementById("sub-days-left");
        if (subDays && !isAdmin) subDays.innerHTML = "7 дней";
        
        checkGameLockStatus();
        togglePromoCard();
    } else {
        alert("❌ Такого промокода не существует");
    }
}

function copyRefLinkDirect() {
    const field = document.getElementById("ref-link-field");
    if (field) {
        navigator.clipboard.writeText(field.value);
        alert("👥 Реферальная ссылка скопирована!");
    }
}

// Секция тарифов
function toggleTariffs() {
    const flowContainer = document.getElementById("tariffs-flow");
    const cards = document.querySelectorAll(".tariff-card");
    if (!flowContainer) return;

    isTariffsOpen = !isTariffsOpen;
    if (isTariffsOpen) {
        if (isPromoOpen) togglePromoCard();
        if (isRefOpen) toggleRefCard();
        flowContainer.classList.remove("hidden-flow");
        cards.forEach(c => c.classList.add("show-card"));
    } else {
        flowContainer.classList.add("hidden-flow");
        cards.forEach(c => c.classList.remove("show-card"));
    }
}

function selectTariff(months) {
    alert(`Вы выбрали покупку тарифа на ${months} мес. Для завершения оплаты перейдите в диалог с ботом!`);
    
    // Закрываем WebApp, чтобы пользователь увидел инвойс на оплату в чате бота
    if (tg) {
        tg.close();
    }
}

// Проверка блокировки игрового раздела
function checkGameLockStatus() {
    const lockScreen = document.getElementById("game-lock-screen");
    if (!lockScreen) return;
    if (isSubscribedUser) {
        lockScreen.classList.add("hidden");
    } else {
        lockScreen.classList.remove("hidden");
    }
}

function startCatchGame() {
    alert("🛰️ Космический радар запущен! Поиск аномалий...");
}

// Обработка Базы Знаний (FAQ)
function answerFAQ(id) {
    const terminal = document.getElementById("terminal-text");
    const answers = {
        1: "🌌 Чтобы подключиться к безопасному интернету, перейдите во вкладку 'Тоннель' и нажмите большую круглую кнопку по центру экрана.",
        2: "🔑 Ваш уникальный ключ VLESS автоматически генерируется после успешного подключения и отображается прямо под кнопкой старта.",
        5: "📈 Принимайте участие в мини-играх на вкладке 'Игры' и успешно уничтожайте летящие кометы — каждая из них дает постоянный прирост к реферальной ставке.",
        6: "🔒 Раздел космических игр становится доступным сразу после активации любой подписки на VPN в личном кабинете.",
        7: "☄️ Дождитесь появления кометы на экране радара и быстро кликните по ней до того, как она покинет зону видимости."
    };
    if (terminal && answers[id]) {
        terminal.innerText = answers[id];
    }
}

// Навигационная панель
function switchNav(index, screenId) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    
    const activeScreen = document.getElementById(`screen-${screenId}`);
    const activeNavBtn = document.getElementById(`btn-nav-${index}`);
    
    if (activeScreen) activeScreen.classList.add("active");
    if (activeNavBtn) activeNavBtn.classList.add("active");

    alignNavBox(index);

    if (screenId === 'games') {
        checkGameLockStatus();
    }
    if (screenId === 'info') {
        const terminal = document.getElementById("terminal-text");
        if (terminal) terminal.innerText = "Выберите интересующий вас вопрос из списка ниже, чтобы получить подробную инструкцию по настройке.";
    }
    
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred("light");
    }
}

function alignNavBox(index) {
    const targetBtn = document.getElementById(`btn-nav-${index}`);
    const navBox = document.getElementById("nav-liquid-box");
    if (targetBtn && navBox) {
        navBox.style.left = `${targetBtn.offsetLeft + (targetBtn.offsetWidth / 2) - (navBox.offsetWidth / 2)}px`;
    }
}

function triggerLiquidSplash() {}