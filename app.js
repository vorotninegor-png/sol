const tg = window.Telegram.WebApp;
tg.expand();

// ==========================================
// 👑 БЛОК АДМИНИСТРАТОРА (ТВОЙ ID ТУТ)
// ==========================================
const ADMIN_ID = 8544752152;

let isAdmin = false;
let userData = null;
let isConnected = false;
let isTariffsOpen = false;
let isPromoOpen = false;
let isRefOpen = false;
let activeLaserAnim = null;
let allCitiesList = [];

// Системный стейт рефералки и комет
let currentRefPercent = 5.0;
const maxRefPercent = 40.0;
let isGameRunning = false;
let isSubscribedUser = false; // Флаг подписки

// Инициализация данных пользователя Telegram
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    userData = tg.initDataUnsafe.user;
    if (userData.id === ADMIN_ID) {
        isAdmin = true;
        isSubscribedUser = true; // Админу подписка активна всегда!
    }
} else {
    // Вне телеграма (на ПК) для твоего удобства тестирования тоже делаем админ-режим:
    isAdmin = true;
    isSubscribedUser = true;
}

// Тарифы и оригинальные цены
const originalPrices = { 1: 150, 3: 400, 6: 650, 12: 990 };
let activeDiscounts = { 1: 0, 3: 0, 6: 0, 12: 0 };

// 🌟 1. КОСМОС
function initSpaceFX() {
    const starBox = document.getElementById("stardust-box");
    const meteorBox = document.getElementById("meteors-box");

    let starHTML = "";
    for (let i = 0; i < 38; i++) {
        const top = Math.random() * 95;
        const left = Math.random() * 95;
        const duration = 2 + Math.random() * 3.5;
        const delay = Math.random() * 3;
        const starType = Math.random();

        if (starType < 0.70) {
            const size = 1 + Math.random() * 2.2;
            starHTML += `<div class="star-dot" style="top:${top}%; left:${left}%; width:${size}px; height:${size}px; --duration:${duration}s; animation-delay:${delay}s;"></div>`;
        } else {
            starHTML += `<div class="cross-star" style="top:${top}%; left:${left}%; animation-delay:${delay}s;"></div>`;
        }
    }
    starBox.innerHTML = starHTML;

    meteorBox.innerHTML = `
        <div class="meteor-item meteor-1"></div>
        <div class="meteor-item meteor-2"></div>
    `;

    const microWavesBox = document.getElementById("micro-waves-box");
    if (microWavesBox) {
        let wavesHTML = "";
        for (let i = 0; i < 10; i++) {
            const speed = 2 + (i * 0.3);
            const delay = i * 0.25;
            wavesHTML += `<div class="micro-wave" style="--speed:${speed}s; --delay:${delay}s;"></div>`;
        }
        microWavesBox.innerHTML = wavesHTML;
    }
}

// 🗺️ 2. ВЕКТОРНАЯ КАРТА МИРА
function initMap3D() {
    const continentsGroup = document.getElementById("map-continents-group");
    const citiesGroup = document.getElementById("all-cities-group");

    continentsGroup.innerHTML = `
        <path class="continent-shape" d="M 50 120 C 60 90, 100 80, 150 70 C 200 60, 270 65, 305 85 C 325 105, 305 130, 275 145 C 250 155, 230 165, 215 215 C 195 205, 180 180, 150 170 C 120 160, 75 155, 50 120 Z" />
        <path class="continent-shape" d="M 315 50 C 340 35, 380 35, 405 60 C 395 85, 365 100, 330 90 C 310 80, 305 60, 315 50 Z" />
        <path class="continent-shape" d="M 230 225 C 265 230, 315 250, 345 280 C 360 320, 335 380, 295 430 C 275 455, 260 435, 250 385 C 235 335, 215285, 230 225 Z" />
        <path class="continent-shape" d="M 430 145 C 450 120, 490 90, 560 80 C 640 70, 760 65, 850 85 C 910 100, 960 125, 940 160 C 910 185, 860 210, 800 225 C 740 245, 690 255, 630 230 C 570 210, 520 190, 470 180 C 430 175, 415 160, 430 145 Z" />
        <path class="continent-shape" d="M 485 80 C 500 60, 525 60, 535 85 C 520 105, 495 105, 485 80 Z" />
        <path class="continent-shape" d="M 435 110 C 450 100, 460 110, 450 127 C 435 130, 430 120, 435 110 Z" />
        <path class="continent-shape" d="M 435 185 C 480 175, 545 195, 565 235 C 580 275, 555 335, 510 370 C 475 380, 445 325, 435 275 C 420 235, 410 205, 435 185 Z" />
        <path class="continent-shape" d="M 570 295 C 585 285, 595 305, 580 335 C 565 335, 560 315, 570 295 Z" />
        <path class="continent-shape" d="M 570 175 C 605 170, 625 185, 615 220 C 590 215, 570 200, 570 175 Z" />
        <path class="continent-shape" d="M 660 195 C 690 190, 715 205, 700 245 C 675 250, 655 225, 660 195 Z" />
        <path class="continent-shape" d="M 740 240 C 770 230, 800 245, 785 265 C 760 270, 735 255, 740 240 Z" />
        <path class="continent-shape" d="M 800 250 C 830 245, 850 260, 835 275 C 810 280, 795 265, 800 250 Z" />
        <path class="continent-shape" d="M 760 315 C 810 295, 865 310, 880 340 C 890 375, 855 415, 795 410 C 755 400, 740 355, 760 315 Z" />
        <path class="continent-shape" d="M 910 390 C 920 380, 930 400, 920 420 C 905 420, 900 400, 910 390 Z" />
    `;

    allCitiesList = [];

    const clusters = [
        { minX: 450, maxX: 870, minY: 80, maxY: 140 },
        { minX: 80,  maxX: 280, minY: 75, maxY: 150 },
        { minX: 240, maxX: 330, minY: 240, maxY: 380 },
        { minX: 450, maxX: 560, minY: 190, maxY: 340 },
        { minX: 620, maxX: 850, minY: 150, maxY: 250 },
        { minX: 760, maxX: 870, minY: 310, maxY: 390 }
    ];

    for (let i = 0; i < 135; i++) {
        const cluster = clusters[i % clusters.length];
        const rx = cluster.minX + Math.random() * (cluster.maxX - cluster.minX);
        const ry = cluster.minY + Math.random() * (cluster.maxY - cluster.minY);
        
        const size = (1.1 + Math.random() * 0.8).toFixed(1);
        const opacity = (0.35 + Math.random() * 0.6).toFixed(2);

        allCitiesList.push({
            x: Math.round(rx),
            y: Math.round(ry),
            size: size,
            opacity: opacity,
            id: `node-city-${i}`
        });
    }

    let citiesHTML = "";
    allCitiesList.forEach(city => {
        citiesHTML += `<circle cx="${city.x}" cy="${city.y}" r="${city.size}" style="opacity: ${city.opacity};" class="city-point" id="city-${city.id}"/>`;
    });

    citiesGroup.innerHTML = citiesHTML;
    alignNavBox(0);
}

// 💧 3. КАПЛИ
function triggerLiquidSplash() {
    const dropsBox = document.getElementById("liquid-drops-box");
    if (!dropsBox) return;

    const count = 9 + Math.floor(Math.random() * 4);
    let dropsHTML = "";

    for (let i = 0; i < count; i++) {
        dropsHTML += `<div class="edge-drop" id="e-drop-${i}"></div>`;
    }
    dropsBox.innerHTML = dropsHTML;

    setTimeout(() => {
        const radius = 55;
        for (let i = 0; i < count; i++) {
            const drop = document.getElementById(`e-drop-${i}`);
            if (drop) {
                const angle = (i / count) * (2 * Math.PI) + (Math.random() * 0.2);
                const startX = Math.cos(angle) * radius;
                const startY = Math.sin(angle) * radius;
                const targetX = Math.cos(angle) * (radius + 20 + Math.random() * 16);
                const targetY = Math.sin(angle) * (radius + 20 + Math.random() * 16);

                drop.style.transform = `translate(${startX}px, ${startY}px) scale(0.5)`;
                drop.style.opacity = "1";

                setTimeout(() => {
                    drop.style.transform = `translate(${targetX}px, ${targetY}px) scale(${0.8 + Math.random() * 0.4})`;
                    drop.style.opacity = "0.85";

                    setTimeout(() => {
                        drop.style.transform = `translate(${startX}px, ${startY}px) scale(0.2)`;
                        drop.style.opacity = "0";
                    }, 350);
                }, 30);
            }
        }
    }, 10);
}

// ⚡️ 4. ПОДКЛЮЧЕНИЕ
const connectBtn = document.getElementById("connect-btn");
const statusBadge = document.getElementById("status-badge");
const statusText = document.getElementById("status-text");
const copyKeyBtn = document.getElementById("copy-key-btn");
const telemetryBar = document.getElementById("telemetry-bar");

if (connectBtn) {
    connectBtn.addEventListener("click", () => {
        triggerLiquidSplash();
        if (isConnected) {
            disconnectVPN();
        } else {
            connectVPN();
        }
    });
}

function generateLongSmartPath() {
    let selectedNodes = [];
    let attempts = 0;

    while (selectedNodes.length < 5 && attempts < 200) {
        attempts++;
        const candidate = allCitiesList[Math.floor(Math.random() * allCitiesList.length)];

        if (selectedNodes.length === 0) {
            selectedNodes.push(candidate);
        } else {
            const lastNode = selectedNodes[selectedNodes.length - 1];
            const dist = Math.hypot(candidate.x - lastNode.x, candidate.y - lastNode.y);

            if (dist >= 120 && !selectedNodes.includes(candidate)) {
                selectedNodes.push(candidate);
            }
        }
    }

    if (selectedNodes.length < 5) {
        const shuffled = [...allCitiesList].sort(() => 0.5 - Math.random());
        selectedNodes = shuffled.slice(0, 5);
    }

    return selectedNodes;
}

function connectVPN() {
    isConnected = false;
    statusText.innerText = "ПОДКЛЮЧЕНИЕ...";
    statusBadge.className = "status-badge connecting";
    if (telemetryBar) telemetryBar.classList.add("hidden");

    document.querySelectorAll(".city-point").forEach(el => {
        el.className = "city-point";
    });

    const pathNodes = generateLongSmartPath();

    let pathD = `M ${pathNodes[0].x} ${pathNodes[0].y}`;
    for (let i = 1; i < pathNodes.length; i++) {
        const prev = pathNodes[i - 1];
        const curr = pathNodes[i];
        const curveDirection = (i % 2 === 0) ? 1 : -1;
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2 + (curveDirection * (20 + Math.random() * 25));
        pathD += ` Q ${midX} ${midY}, ${curr.x} ${curr.y}`;
    }

    const connectionsGroup = document.getElementById("connections-group");
    connectionsGroup.innerHTML = `<path id="laser-path" class="laser-line" d="${pathD}" />`;

    const laserPath = document.getElementById("laser-path");
    const pathLength = laserPath.getTotalLength();
    laserPath.style.strokeDasharray = pathLength;
    laserPath.style.strokeDashoffset = pathLength;

    flashCity(pathNodes[0].id);

    if (activeLaserAnim) activeLaserAnim.pause();

    activeLaserAnim = anime({
        targets: '#laser-path',
        strokeDashoffset: [pathLength, 0],
        easing: 'easeInOutCubic',
        duration: 2300,
        update: function(anim) {
            const p = anim.progress;
            if (p > 20 && p < 30) flashCity(pathNodes[1].id);
            if (p > 45 && p < 55) flashCity(pathNodes[2].id);
            if (p > 70 && p < 80) flashCity(pathNodes[3].id);
        },
        complete: function() {
            isConnected = true;
            statusText.innerText = "ПОДКЛЮЧЕНО";
            statusBadge.className = "status-badge connected";
            connectBtn.classList.add("connected");

            if (telemetryBar) {
                document.getElementById("ping-val").innerText = Math.floor(18 + Math.random() * 12);
                telemetryBar.classList.remove("hidden");
            }

            const finalNode = document.getElementById(`city-${pathNodes[4].id}`);
            if (finalNode) finalNode.className = "city-point target-connected";

            copyKeyBtn.classList.remove("hidden-slide");
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
        }
    });
}

function disconnectVPN() {
    isConnected = false;
    statusText.innerText = "ОТКЛЮЧЕНО";
    statusBadge.className = "status-badge disconnected";
    connectBtn.classList.remove("connected");
    if (telemetryBar) telemetryBar.classList.add("hidden");

    copyKeyBtn.classList.add("hidden-slide");

    document.querySelectorAll(".city-point").forEach(el => {
        el.className = "city-point";
    });

    const laserPath = document.getElementById("laser-path");
    if (laserPath) {
        const pathLength = laserPath.getTotalLength();
        if (activeLaserAnim) activeLaserAnim.pause();

        activeLaserAnim = anime({
            targets: '#laser-path',
            strokeDashoffset: [0, pathLength],
            easing: 'easeOutQuad',
            duration: 700,
            complete: function() {
                document.getElementById("connections-group").innerHTML = "";
            }
        });
    }
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");
}

function flashCity(cityId) {
    const node = document.getElementById(`city-${cityId}`);
    if (node && !node.classList.contains("flash-green")) {
        node.classList.add("flash-green");
        setTimeout(() => node.classList.remove("flash-green"), 450);
    }
}

// 🔑 5. КОПИРОВАНИЕ КЛЮЧА
function copyVlessKey() {
    const dummyKey = "vless://sol-vpn-node-amsterdam-secure-key-9981273";
    navigator.clipboard.writeText(dummyKey);
    alert("✨ Ключ VLESS скопирован в буфер обмена!");
}

// 🎁 6. ПРОМОКОДЫ
function togglePromoCard() {
    const drawer = document.getElementById("promo-drawer");
    const promoCardTrigger = document.getElementById("promo-trigger-card");
    const inputField = document.getElementById("promo-input-field");

    isPromoOpen = !isPromoOpen;

    if (isPromoOpen) {
        if (isTariffsOpen) toggleTariffs();
        if (isRefOpen) toggleRefCard();
        drawer.classList.remove("hidden-drawer");
        promoCardTrigger.classList.add("active-card");
        setTimeout(() => { inputField.focus(); }, 200);
    } else {
        drawer.classList.add("hidden-drawer");
        promoCardTrigger.classList.remove("active-card");
        inputField.blur();
        resetPromoStyles();
    }
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
}

function resetPromoStyles() {
    const card = document.getElementById("promo-card-element");
    const statusMsg = document.getElementById("promo-status-msg");
    const input = document.getElementById("promo-input-field");
    const btn = document.getElementById("promo-apply-btn");
    const headerText = document.getElementById("promo-header-text");

    card.className = "promo-card-box";
    statusMsg.className = "promo-status-msg";
    statusMsg.innerText = "";
    input.className = "";
    btn.className = "apply-promo-btn";
    headerText.style.color = "#c084fc";
    headerText.innerText = "🎁 ВВЕДИТЕ ПРОМОКОД";
}

function applyPromoCode() {
    const inputField = document.getElementById("promo-input-field");
    const card = document.getElementById("promo-card-element");
    const statusMsg = document.getElementById("promo-status-msg");
    const btn = document.getElementById("promo-apply-btn");
    const headerText = document.getElementById("promo-header-text");
    
    const val = inputField.value.trim().toUpperCase();

    if (!val) {
        card.classList.add("error-glow");
        setTimeout(() => card.classList.remove("error-glow"), 350);
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("error");
        return;
    }

    if (val === "SOL2025" || val === "VIP") {
        card.className = "promo-card-box success-glow";
        inputField.className = "success-border";
        btn.className = "apply-promo-btn success-btn";
        headerText.innerText = "🎉 УСПЕШНО!";
        headerText.style.color = "#10b981";

        statusMsg.innerText = "АКТИВИРОВАН +7 ДНЕЙ!";
        statusMsg.className = "promo-status-msg show-msg success-txt";

        if (!isAdmin) {
            isSubscribedUser = true;
            document.getElementById("sub-days-left").innerText = "28дней";
            document.getElementById("sub-progress-bar").style.width = "85%";
        }

        checkGameLockStatus();

        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");

        setTimeout(() => {
            inputField.value = "";
            togglePromoCard();
        }, 1800);
    } else {
        card.className = "promo-card-box error-glow";
        inputField.className = "error-border";
        statusMsg.innerText = "НЕ ДЕЙСТВИТЕЛЕН";
        statusMsg.className = "promo-status-msg show-msg error-txt";
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("error");
    }
}

// 👥 7. РЕФЕРАЛКА
function toggleRefCard() {
    const drawer = document.getElementById("ref-drawer");
    const refCardTrigger = document.getElementById("ref-trigger-card");

    isRefOpen = !isRefOpen;

    if (isRefOpen) {
        if (isTariffsOpen) toggleTariffs();
        if (isPromoOpen) togglePromoCard();
        drawer.classList.remove("hidden-drawer");
        refCardTrigger.classList.add("active-card");
    } else {
        drawer.classList.add("hidden-drawer");
        refCardTrigger.classList.remove("active-card");
    }
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
}

function copyRefLinkDirect() {
    const field = document.getElementById("ref-link-field");
    navigator.clipboard.writeText(field.value);
    alert("🚀 Реферальная ссылка скопирована в буфер обмена!");
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
}

// 🔐 ПРОВЕРКА БЛОКИРОВКИ ИГР
function checkGameLockStatus() {
    const lockScreen = document.getElementById("game-lock-screen");
    if (isSubscribedUser) {
        if (lockScreen) lockScreen.classList.add("hidden");
    } else {
        if (lockScreen) lockScreen.classList.remove("hidden");
    }
}

// 🎮 8. ОХОТА НА КОМЕТЫ
function startCatchGame() {
    if (isGameRunning) return;
    
    document.getElementById("wheel-container").classList.add("hidden-wheel");

    isGameRunning = true;
    const stage = document.getElementById("radar-stage");
    const hint = document.getElementById("radar-hint");
    const startBtn = document.getElementById("start-radar-btn");

    stage.innerHTML = "";
    hint.innerText = "🛰️ Сканирование... Перехватываю траектории!";
    startBtn.style.opacity = "0.5";
    startBtn.innerText = "ИДЕТ СКАНИРОВАНИЕ...";

    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");

    const cometCount = 5;
    for (let i = 0; i < cometCount; i++) {
        setTimeout(() => {
            if (isGameRunning) {
                const randomSpeed = 2000 + Math.random() * 2000;
                spawnComet(i + 1, randomSpeed);
            }
        }, i * 1100);
    }

    setTimeout(() => {
        isGameRunning = false;
        hint.innerText = "🛰️ Сканирование завершено. Ждем новые аномалии!";
        startBtn.style.opacity = "1";
        startBtn.innerText = "ЗАПУСТИТЬ СКАНИРОВАНИЕ";
    }, 7000);
}

function spawnComet(id, speed) {
    const stage = document.getElementById("radar-stage");
    if (!stage) return;

    const comet = document.createElement("div");
    comet.className = "comet";
    comet.id = `comet-${id}`;

    const startFromLeft = Math.random() > 0.5;
    const startX = startFromLeft ? -30 : stage.offsetWidth + 30;
    const startY = Math.random() * (stage.offsetHeight - 50) + 25;
    
    const targetX = startFromLeft ? stage.offsetWidth + 30 : -30;
    const targetY = Math.random() * (stage.offsetHeight - 50) + 25;

    comet.style.left = `${startX}px`;
    comet.style.top = `${startY}px`;

    const angle = Math.atan2(targetY - startY, targetX - startX) * (180 / Math.PI);
    comet.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

    stage.appendChild(comet);

    const onHit = (e) => {
        e.stopPropagation();
        crackComet(comet, id, e);
    };

    comet.addEventListener("mousedown", onHit);
    comet.addEventListener("touchstart", onHit);

    anime({
        targets: comet,
        left: targetX,
        top: targetY,
        easing: 'linear',
        duration: speed,
        complete: function() {
            if (comet && comet.parentNode) {
                comet.remove();
            }
        }
    });
}

function crackComet(cometEl, id, event) {
    if (cometEl.classList.contains("cracked")) return;
    cometEl.classList.add("cracked");

    for (let i = 0; i < 3; i++) {
        const crack = document.createElement("div");
        crack.className = "crack-line";
        crack.style.transform = `rotate(${Math.random() * 360}deg)`;
        cometEl.appendChild(crack);
    }

    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");

    anime({
        targets: cometEl,
        translateX: [-3, 3, -2, 2, 0],
        duration: 180,
        complete: () => {
            triggerCometExplosion(cometEl, event);
        }
    });
}

function triggerCometExplosion(cometEl, event) {
    const stage = document.getElementById("radar-stage");
    const rect = cometEl.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const hitX = rect.left - stageRect.left + (rect.width / 2);
    const hitY = rect.top - stageRect.top + (rect.height / 2);

    for (let i = 0; i < 10; i++) {
        const dust = document.createElement("div");
        dust.className = "shatter-dust";
        dust.style.left = `${hitX}px`;
        dust.style.top = `${hitY}px`;
        stage.appendChild(dust);

        anime({
            targets: dust,
            left: hitX + (Math.random() - 0.5) * 80,
            top: hitY + (Math.random() - 0.5) * 80,
            opacity: [1, 0],
            scale: [1, 0.2],
            duration: 500,
            easing: 'easeOutQuad',
            complete: () => dust.remove()
        });
    }

    cometEl.remove();
    determineLoot(hitX, hitY);
}

function determineLoot(x, y) {
    const roll = Math.random();
    const hint = document.getElementById("radar-hint");

    if (roll < 0.40) {
        // 🟢 Зеленый дроп: + Рефералка (1 - 3 в десятичных)
        const addPercent = parseFloat((1.0 + Math.random() * 2.0).toFixed(1));
        currentRefPercent = Math.min(maxRefPercent, currentRefPercent + addPercent);
        updateRefUI();
        createFloatingText(x, y, `+${addPercent}%`, 'green-text');
        hint.innerText = `💫 УСПЕХ! +${addPercent}% к рефералке!`;

    } else if (roll < 0.65) {
        // 🔴 Красный дроп: - Рефералка (1 - 3 в десятичных)
        const subPercent = parseFloat((1.0 + Math.random() * 2.0).toFixed(1));
        currentRefPercent = Math.max(5.0, currentRefPercent - subPercent);
        updateRefUI();
        createFloatingText(x, y, `-${subPercent}%`, 'red-text');
        hint.innerText = `💥 КРИТ! Процент рефералки снижен на -${subPercent}%`;

    } else if (roll < 0.85) {
        // 🟡 Желтый дроп: 0% пустышка
        createFloatingText(x, y, `0%`, 'yellow-text');
        hint.innerText = `🕳️ Комета пуста. Никаких бонусов.`;

    } else {
        // 🎡 Скидка (10% - 30% в целых) и рулетка тарифов
        const randomDiscount = Math.floor(10 + Math.random() * 21);
        createFloatingText(x, y, `🔥 -${randomDiscount}%!`, 'green-text');
        hint.innerText = `🔥 Выбита скидка -${randomDiscount}%. Запуск колеса!`;
        setTimeout(() => { spinTariffWheel(randomDiscount); }, 1200);
    }
}

function updateRefUI() {
    document.getElementById("ref-percent-val").innerText = `${currentRefPercent.toFixed(1)}%`;
    document.getElementById("game-ref-percent").innerText = `${currentRefPercent.toFixed(1)}% / 40%`;
}

function createFloatingText(x, y, text, cssClass) {
    const stage = document.getElementById("radar-stage");
    const el = document.createElement("div");
    el.className = `floating-drop-text ${cssClass}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.innerText = text;
    stage.appendChild(el);
    setTimeout(() => el.remove(), 1200);
}

// 🎡 ВРАЩЕНИЕ КОЛЕСА ТАРИФОВ
function spinTariffWheel(discountValue) {
    const wheelContainer = document.getElementById("wheel-container");
    const wheel = document.getElementById("roulette-wheel");
    const hint = document.getElementById("radar-hint");

    wheelContainer.classList.remove("hidden-wheel");

    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("heavy");

    const roll = Math.random() * 100;
    let targetSegment = 1;
    let targetAngle = 0;

    // Шансы: 60% на 1м, 20% на 3м, 15% на 6м, 5% на 12м
    if (roll < 60) {
        targetSegment = 1;
        targetAngle = 360 * 5 + 45;
    } else if (roll < 80) {
        targetSegment = 3;
        targetAngle = 360 * 5 + 315;
    } else if (roll < 95) {
        targetSegment = 6;
        targetAngle = 360 * 5 + 225;
    } else {
        targetSegment = 12;
        targetAngle = 360 * 5 + 135;
    }

    anime({
        targets: wheel,
        rotate: targetAngle,
        duration: 4000,
        easing: 'easeOutQuint',
        complete: () => {
            activeDiscounts[targetSegment] = discountValue;
            updateTariffPricesUI();

            hint.innerText = `🎉 СКИДКА ${discountValue}% успешно применилась на тариф ${targetSegment} мес.!`;
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");

            setTimeout(() => {
                wheelContainer.classList.add("hidden-wheel");
                wheel.style.transform = "rotate(0deg)";
            }, 3000);
        }
    });
}

function updateTariffPricesUI() {
    const types = [1, 3, 6, 12];
    types.forEach(t => {
        const priceEl = document.getElementById(`price-${t}m`);
        const cardEl = document.getElementById(`tariff-${t}m`);
        const badgeEl = document.getElementById(`badge-${t}m`);

        if (activeDiscounts[t] > 0) {
            const finalPrice = Math.round(originalPrices[t] * (1 - activeDiscounts[t] / 100));
            priceEl.innerHTML = `<span style="text-decoration: line-through; opacity: 0.5; font-size:14px; margin-right:6px;">${originalPrices[t]} ₽</span> ${finalPrice} ₽`;
            cardEl.className = `tariff-card discounted-neon-${t}m show-card`;
            if (badgeEl) {
                badgeEl.innerText = `-${activeDiscounts[t]}% СКИДКА`;
                badgeEl.style.background = "#ef4444";
            }
        }
    });
}

// 💡 9. БАЗА ЗНАНИЙ
const defaultInfoText = "Нажмите на любой вопрос ниже. Ваш ответ появится здесь. Если нужной темы нет — напишите в нашу техподдержку.";

const faqAnswers = {
    1: "Для подключения перейдите на вкладку Тоннель и нажмите фиолетовую кнопку по центру. Дождитесь появления лазерного луча и статуса ПОДКЛЮЧЕНО.",
    2: "После подключения нажмите выехавшую кнопку Скопировать ключ VLESS. Вставьте его в ваше приложение-клиент V2Ray, Happ или Hiddify.",
    5: "📈 Чтобы увеличить процент реферальной программы перейдите во вкладку 'Игры', запускайте сканирование радара и ловите скоростные кометы! Каждая пойманная комета дает до +3.0% к вашей ставке.",
    6: "🚫 Доступ к Охоте на кометы заблокирован, если у вас нет активной подписки VPN. Приобретите любой тариф на вкладке Кабинет, чтобы разблокировать доступ к играм.",
    7: "☄️ Кометы пролетают через зону действия космического радара на разных скоростях. Успейте кликнуть (или тапнуть) по комете, чтобы она треснула, раскололась и принесла вам бонус!"
};

function animateDipText(newText) {
    const container = document.getElementById("terminal-text");
    if (!container) return;

    const currentWords = container.querySelectorAll(".word-glyph");

    if (currentWords.length > 0) {
        currentWords.forEach((word, idx) => {
            setTimeout(() => { word.classList.add("dip-shrink"); }, idx * 12);
        });
        setTimeout(() => { renderNewWordsWithExpand(newText); }, currentWords.length * 12 + 160);
    } else {
        renderNewWordsWithExpand(newText);
    }
}

function renderNewWordsWithExpand(text) {
    const container = document.getElementById("terminal-text");
    if (!container) return;

    container.innerHTML = "";
    const words = text.split(" ");

    words.forEach((word, idx) => {
        const span = document.createElement("span");
        span.className = "word-glyph dip-shrink";
        span.innerText = word;
        container.appendChild(span);
        setTimeout(() => { span.classList.remove("dip-shrink"); }, 40 + idx * 20);
    });
}

function answerFAQ(id) {
    const text = faqAnswers[id];
    if (text) {
        animateDipText(text);
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
    }
}

// 📂 10. ТАРИФЫ
function toggleTariffs() {
    const flowContainer = document.getElementById("tariffs-flow");
    const cards = document.querySelectorAll(".tariff-card");
    if (!flowContainer || cards.length === 0) return;

    isTariffsOpen = !isTariffsOpen;

    if (isTariffsOpen) {
        if (isPromoOpen) togglePromoCard();
        if (isRefOpen) toggleRefCard();
        flowContainer.classList.remove("hidden-flow");
        cards.forEach((card, index) => {
            setTimeout(() => { card.classList.add("show-card"); }, index * 90);
        });
    } else {
        const reversedCards = Array.from(cards).reverse();
        reversedCards.forEach((card, index) => {
            setTimeout(() => { card.classList.remove("show-card"); }, index * 70);
        });
        setTimeout(() => { flowContainer.classList.add("hidden-flow"); }, cards.length * 70 + 200);
    }
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
}

function selectTariff(months) {
    let displayValue = (months === 12) ? "∞ Безлимит" : `${months * 30} дней`;

    alert(`Вы успешно приобрели тариф на ${months} мес. (Тестовая покупка)!`);
    isSubscribedUser = true;
    document.getElementById("sub-days-left").innerText = displayValue;
    document.getElementById("sub-progress-bar").style.width = "100%";
    
    checkGameLockStatus();
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
}

// 🧭 11. НАВИГАЦИЯ
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
        setTimeout(() => { animateDipText(defaultInfoText); }, 100);
    }
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("selection_change");
}

function alignNavBox(index) {
    const targetBtn = document.getElementById(`btn-nav-${index}`);
    const navBox = document.getElementById("nav-liquid-box");
    if (targetBtn && navBox) {
        const centerOffset = targetBtn.offsetLeft + (targetBtn.offsetWidth / 2) - (navBox.offsetWidth / 2);
        navBox.style.left = `${centerOffset}px`;
    }
}

window.onload = () => {
    initSpaceFX();
    initMap3D();

    if (isAdmin) {
        isSubscribedUser = true;
        
        // Визуальное оформление для Создателя
        const subDays = document.getElementById("sub-days-left");
        const progressBar = document.getElementById("sub-progress-bar");
        
        if (subDays) subDays.innerHTML = "👑 Создатель (∞ Безлимит)";
        if (progressBar) {
            progressBar.style.width = "100%";
            progressBar.style.background = "linear-gradient(90deg, #f59e0b, #a855f7)";
        }
        checkGameLockStatus();
    }
};