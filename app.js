// Инициализация WebApp
let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.expand();
}

// ==========================================
// 👑 БЛОК АДМИНИСТРАТОРА
// ==========================================
const ADMIN_ID = 8544752152;
let isAdmin = true; // По умолчанию ставим true для тестов, чтобы сразу всё работало!
let isSubscribedUser = true; 

let isConnected = false;
let isTariffsOpen = false;
let isPromoOpen = false;
let isRefOpen = false;
let allCitiesList = [];
let currentRefPercent = 5.0;
const maxRefPercent = 40.0;
let isGameRunning = false;

// Пытаемся получить реальный ID из телеграма
try {
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const userId = tg.initDataUnsafe.user.id;
        if (userId === ADMIN_ID) {
            isAdmin = true;
            isSubscribedUser = true;
        } else {
            isAdmin = false;
            isSubscribedUser = false; // Обычный юзер
        }
    }
} catch (e) {
    console.log("Ошибка получения данных TG, работаем в тест-режиме админа");
}

// Тарифы
const originalPrices = { 1: 150, 3: 400, 6: 650, 12: 990 };
let activeDiscounts = { 1: 0, 3: 0, 6: 0, 12: 0 };

// Навешиваем события сразу после загрузки DOM, максимально безопасно
document.addEventListener("DOMContentLoaded", () => {
    // 1. Запуск космоса
    try { initSpaceFX(); } catch(e) { console.error("Ошибка космоса:", e); }

    // 2. Инициализация карты
    try { initMap3D(); } catch(e) { console.error("Ошибка карты:", e); }

    // 3. Навешиваем клик на кнопку подключения
    const connectBtn = document.getElementById("connect-btn");
    if (connectBtn) {
        connectBtn.addEventListener("click", () => {
            try { triggerLiquidSplash(); } catch(e){}
            if (isConnected) {
                disconnectVPN();
            } else {
                connectVPN();
            }
        });
    }

    // 4. Проверяем статус админа для интерфейса
    applyAdminStatusUI();
});

// 👑 ВИЗУАЛ АДМИНА
function applyAdminStatusUI() {
    if (isAdmin) {
        isSubscribedUser = true;
        const subDays = document.getElementById("sub-days-left");
        const progressBar = document.getElementById("sub-progress-bar");
        
        if (subDays) subDays.innerHTML = "👑 Создатель (∞ Безлимит)";
        if (progressBar) {
            progressBar.style.width = "100%";
            progressBar.style.background = "linear-gradient(90deg, #f59e0b, #a855f7)";
        }
        checkGameLockStatus();
    }
}

// 🪐 КОСМОС
function initSpaceFX() {
    const starBox = document.getElementById("stardust-box");
    if (!starBox) return;

    let starHTML = "";
    for (let i = 0; i < 25; i++) {
        const top = Math.random() * 95;
        const left = Math.random() * 95;
        starHTML += `<div class="star-dot" style="top:${top}%; left:${left}%; width:2px; height:2px; --duration:3s; animation-delay:${Math.random()*2}s;"></div>`;
    }
    starBox.innerHTML = starHTML;
}

// 🗺️ КАРТА
function initMap3D() {
    const continentsGroup = document.getElementById("map-continents-group");
    const citiesGroup = document.getElementById("all-cities-group");
    if (!continentsGroup || !citiesGroup) return;

    // Отрисовка материков
    continentsGroup.innerHTML = `
        <path class="continent-shape" d="M 50 120 C 60 90, 100 80, 150 70 C 200 60, 270 65, 305 85 C 325 105, 305 130, 275 145 Z" />
        <path class="continent-shape" d="M 430 145 C 450 120, 490 90, 560 80 C 640 70, 760 65, 850 85 C 910 100, 940 125, 940 160 Z" />
    `;

    allCitiesList = [];
    let citiesHTML = "";
    
    // Создаем тестовые точки городов
    for (let i = 0; i < 40; i++) {
        const cx = 100 + Math.random() * 700;
        const cy = 80 + Math.random() * 300;
        allCitiesList.push({ x: cx, y: cy, id: i });
        citiesHTML += `<circle cx="${cx}" cy="${cy}" r="2" class="city-point" id="city-node-${i}" style="opacity: 0.6; fill: #3b82f6;"/>`;
    }
    citiesGroup.innerHTML = citiesHTML;
}

// ⚡️ ПОДКЛЮЧЕНИЕ
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
    }, 1500);
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

// 📁 ВСПЛЫВАЮЩИЕ КАРТОЧКИ (ПРОМО / РЕФ)
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
        alert("🎉 Промокод успешно активирован!");
        isSubscribedUser = true;
        checkGameLockStatus();
        togglePromoCard();
    } else {
        alert("❌ Промокод не существует");
    }
}

function copyRefLinkDirect() {
    const field = document.getElementById("ref-link-field");
    if (field) {
        navigator.clipboard.writeText(field.value);
        alert("👥 Реферальная ссылка скопирована!");
    }
}

// ТАРИФЫ
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
    alert(`Вы выбрали тариф на ${months} мес.`);
    isSubscribedUser = true;
    checkGameLockStatus();
}

// ИГРЫ
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
    alert("🛰️ Поиск комет запущен!");
}

// ИНФО FAQ
function answerFAQ(id) {
    const terminal = document.getElementById("terminal-text");
    const answers = {
        1: "Перейдите во вкладку 'Тоннель' и нажмите круглую кнопку по центру.",
        2: "Ключ появится под кнопкой подключения после успешного старта.",
        5: "Рефералка увеличивается за счет активности в играх и приглашения друзей.",
        6: "Игры открываются сразу после покупки подписки.",
        7: "Нажимайте на пролетающие кометы на радаре для их уничтожения."
    };
    if (terminal && answers[id]) {
        terminal.innerText = answers[id];
    }
}

// 🧭 НАВИГАЦИЯ
function switchNav(index, screenId) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    
    const activeScreen = document.getElementById(`screen-${screenId}`);
    const activeNavBtn = document.getElementById(`btn-nav-${index}`);
    
    if (activeScreen) activeScreen.classList.add("active");
    if (activeNavBtn) activeNavBtn.classList.add("active");

    const navBox = document.getElementById("nav-liquid-box");
    if (activeNavBtn && navBox) {
        navBox.style.left = `${activeNavBtn.offsetLeft + (activeNavBtn.offsetWidth / 2) - (navBox.offsetWidth / 2)}px`;
    }

    if (screenId === 'games') checkGameLockStatus();
}

// Заглушка для совместимости
function triggerLiquidSplash() {}