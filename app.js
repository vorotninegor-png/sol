const tg = window.Telegram.WebApp;
tg.expand();

// ==========================================
// 👑 БЛОК АДМИНИСТРАТОРА
// ==========================================
const ADMIN_ID = 8544752152;

let isAdmin = false;
let userData = null;
let isConnected = false;

// СОСТОЯНИЯ ВКЛАДОК
let isTariffsOpen = false;
let isPromoOpen = false;
let isRefOpen = false;

let activeLaserAnim = null;
let allCitiesList = [];

// Стейт рефералки и игр
let currentRefPercent = 5.0;
const maxRefPercent = 40.0;
let isGameRunning = false;
let isSubscribedUser = false; 
let isScanAvailable = true;   
let caughtCount = 0;          
let hasDiscountDroppedInGame = false;

// 👑 СТЕЙТ АДМИН-ПАНЕЛИ
let adminSelectedTypes = { days: false, discount: false };// Независимые кнопки
let adminLimitType = 'lifetime_days'; 
let calcValue = 7;
let calcHoldTimer = null;
let touchStartX = 0;

// База промокодов, создаваемых в Админке
let createdPromos = {}; 

// Список пользователей (очищен под будущий бот)
let approvedUsers = [];
let allUsersList = [];

// Telegram данные
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    userData = tg.initDataUnsafe.user;
    if (userData.id === ADMIN_ID) {
        isAdmin = true;
        isSubscribedUser = true; 
    }
} else {
    isAdmin = true;
    isSubscribedUser = true;
}

// Тарифы и базовые цены
const originalPrices = { 1: 150, 3: 400, 6: 650, 12: 990 };
let activeDiscounts = { 1: 0, 3: 0, 6: 0, 12: 0 };

// ==========================================
// 🌟 1. КОСМОС
// ==========================================
function initSpaceFX() {
    const starBox = document.getElementById("stardust-box");
    const meteorBox = document.getElementById("meteors-box");

    if (!starBox || !meteorBox) return;

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

// ==========================================
// 🗺 2. ВЕКТОРНАЯ КАРТА (135 ТОЧЕК)
// ==========================================
function initMap3D() {
    const continentsGroup = document.getElementById("map-continents-group");
    const citiesGroup = document.getElementById("all-cities-group");

    if (!continentsGroup || !citiesGroup) return;

    continentsGroup.innerHTML = `
        <path class="continent-shape" d="M 50 120 C 60 90, 100 80, 150 70 C 200 60, 270 65, 305 85 C 325 105, 305 130, 275 145 C 250 155, 230 165, 215 215 C 195 205, 180 180, 150 170 C 120 160, 75 155, 50 120 Z" />
        <path class="continent-shape" d="M 315 50 C 340 35, 380 35, 405 60 C 395 85, 365 100, 330 90 C 310 80, 305 60, 315 50 Z" />
        <path class="continent-shape" d="M 230 225 C 265 230, 315 250, 345 280 C 360 320, 335 380, 295 430 C 275 455, 260 435, 250 385 C 235 335, 215 285, 230 225 Z" />
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
}

// ==========================================
// 💧 3. КАПЛИ
// ==========================================
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

// ==========================================
// ⚡️ 4. ПОДКЛЮЧЕНИЕ ТОННЕЛЯ (ОДИН ОДИНОЧНЫЙ ЛУЧ)
// ==========================================
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

function connectVPN() {
    isConnected = false;
    statusText.innerText = "ПОДКЛЮЧЕНИЕ...";
    statusBadge.className = "status-badge connecting";
    if (telemetryBar) telemetryBar.classList.add("hidden");

    const connectionsGroup = document.getElementById("connections-group");
    if (connectionsGroup) connectionsGroup.innerHTML = "";

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

    connectionsGroup.innerHTML = `<path id="laser-path" class="laser-line" d="${pathD}" />`;

    const laserPath = document.getElementById("laser-path");
    if (!laserPath) return;

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
        setTimeout(() => {
            if (node) node.classList.remove("flash-green");
        }, 450);
    }
}

// 🔑 5. КОПИРОВАНИЕ КЛЮЧА
function copyVlessKey() {
    const dummyKey = "vless://sol-vpn-node-amsterdam-secure-key-9981273";
    navigator.clipboard.writeText(dummyKey);
    alert("✨ Ключ VLESS скопирован в буфер обмена!");
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
}

// ==========================================
// 🎁 6. ПРОМОКОДЫ И РЕФЕРАЛКА С СОХРАНЕНИЕМ СОСТОЯНИЯ
// ==========================================
function togglePromoCard(forceState = null) {
    const drawer = document.getElementById("promo-drawer");
    const promoCardTrigger = document.getElementById("promo-trigger-card");
    const inputField = document.getElementById("promo-input-field");

    if (forceState !== null) {
        isPromoOpen = forceState;
    } else {
        isPromoOpen = !isPromoOpen;
    }

    if (isPromoOpen) {
        if (isRefOpen) toggleRefCard(false);
        if (drawer) drawer.classList.remove("hidden-drawer");
        if (promoCardTrigger) promoCardTrigger.classList.add("active-card");
        setTimeout(() => { if (inputField) inputField.focus(); }, 200);
    } else {
        if (drawer) drawer.classList.add("hidden-drawer");
        if (promoCardTrigger) promoCardTrigger.classList.remove("active-card");
        if (inputField) inputField.blur();
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

    if (card) card.className = "promo-card-box";
    if (statusMsg) {
        statusMsg.className = "promo-status-msg";
        statusMsg.innerText = "";
    }
    if (input) input.className = "";
    if (btn) btn.className = "apply-promo-btn";
    if (headerText) {
        headerText.style.color = "#c084fc";
        headerText.innerText = "🎁 ВВЕДИТЕ ПРОМОКОД";
    }
}

function applyPromoCode() {
    const inputField = document.getElementById("promo-input-field");
    const card = document.getElementById("promo-card-element");
    const statusMsg = document.getElementById("promo-status-msg");
    const btn = document.getElementById("promo-apply-btn");
    const headerText = document.getElementById("promo-header-text");
    
    if (!inputField) return;
    const val = inputField.value.trim().toUpperCase();

    if (!val) {
        if (card) {
            card.classList.add("error-glow");
            setTimeout(() => card.classList.remove("error-glow"), 350);
        }
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("error");
        return;
    }

    if (createdPromos[val]) {
        const promoData = createdPromos[val];

        if (card) card.className = "promo-card-box success-glow";
        if (inputField) inputField.className = "success-border";
        if (btn) btn.className = "apply-promo-btn success-btn";
        if (headerText) {
            headerText.innerText = "🎉 УСПЕШНО!";
            headerText.style.color = "#10b981";
        }

        if (promoData.hasDays) {
            isSubscribedUser = true;
            const leftVal = document.getElementById("sub-days-left");
            const bar = document.getElementById("sub-progress-bar");
            if (leftVal) leftVal.innerText = `${promoData.val} дней`;
            if (bar) bar.style.width = "100%";
        }
        
        if (promoData.hasDiscount) {
            activeDiscounts[1] = promoData.val;
            activeDiscounts[3] = promoData.val;
            updateTariffPricesUI();
        }

        if (statusMsg) {
            statusMsg.innerText = "АКТИВИРОВАН!";
            statusMsg.className = "promo-status-msg show-msg success-txt";
        }

        checkGameLockStatus();
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");

        setTimeout(() => {
            inputField.value = "";
            togglePromoCard(false);
        }, 1800);
    } else {
        if (card) card.className = "promo-card-box error-glow";
        if (inputField) inputField.className = "error-border";
        if (statusMsg) {
            statusMsg.innerText = "НЕ ДЕЙСТВИТЕЛЕН";
            statusMsg.className = "promo-status-msg show-msg error-txt";
        }
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("error");
    }
}

function toggleRefCard(forceState = null) {
    const drawer = document.getElementById("ref-drawer");
    const refCardTrigger = document.getElementById("ref-trigger-card");

    if (forceState !== null) {
        isRefOpen = forceState;
    } else {
        isRefOpen = !isRefOpen;
    }

    if (isRefOpen) {
        if (isPromoOpen) togglePromoCard(false);
        if (drawer) drawer.classList.remove("hidden-drawer");
        if (refCardTrigger) refCardTrigger.classList.add("active-card");
    } else {
        if (drawer) drawer.classList.add("hidden-drawer");
        if (refCardTrigger) refCardTrigger.classList.remove("active-card");
    }
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
}

function copyRefLinkDirect() {
    const field = document.getElementById("ref-link-field");
    if (!field) return;
    navigator.clipboard.writeText(field.value);
    alert("🚀 Реферальная ссылка скопирована в буфер обмена!");
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
}

function checkGameLockStatus() {
    const lockScreen = document.getElementById("game-lock-screen");
    if (isSubscribedUser) {
        if (lockScreen) lockScreen.classList.add("hidden");
    } else {
        if (lockScreen) lockScreen.classList.remove("hidden");
    }
}

// ==========================================
// 🎮 7. ИГРЫ (ИСПРАВЛЕННЫЕ КОМЕТЫ)
// ==========================================
function startCatchGame() {
    if (isGameRunning) return;

    if (!isScanAvailable && !isAdmin) {
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("error");
        alert("🚨 Лимит сканирования исчерпан! Сканер перезаряжается. Возвращайтесь завтра!");
        return;
    }

    isGameRunning = true;
    caughtCount = 0; 
    hasDiscountDroppedInGame = false;

    const stage = document.getElementById("radar-stage");
    const startBtn = document.getElementById("start-radar-btn");

    if (stage) stage.innerHTML = `<div class="radar-circle-glow"><div class="radar-line-scanner"></div></div>`;
    
    if (startBtn) {
        startBtn.className = "liquid-reveal-btn radar-active";
        startBtn.innerText = "ИДЕТ СКАНИРОВАНИЕ...";
    }

    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");

    const middleContainer = document.getElementById("game-loot-middle-row");
    if (middleContainer) {
        middleContainer.innerHTML = "";
        
        const crystalArea = document.createElement("div");
        crystalArea.id = "crystal-loot-under-btn";
        crystalArea.className = "crystal-container-row";
        middleContainer.appendChild(crystalArea);
        
        for (let i = 0; i < 5; i++) {
            const slot = document.createElement("div");
            slot.className = "crystal-loot-slot";
            slot.id = `loot-slot-${i}`;
            crystalArea.appendChild(slot);
        }

        setTimeout(() => {
            crystalArea.classList.add("show-row");
        }, 50);
    }

    const cometCount = 5;
    for (let i = 0; i < cometCount; i++) {
        setTimeout(() => {
            if (isGameRunning) {
                const randomSpeed = 1800 + Math.random() * 1600;
                spawnComet(i, randomSpeed);
            }
        }, i * 1100);
    }

    setTimeout(() => {
        isGameRunning = false;
        
        if (startBtn) {
            if (!isAdmin) {
                isScanAvailable = false;
                startBtn.className = "liquid-reveal-btn radar-locked";
                startBtn.innerText = "ЛИМИТ ИСЧЕРПАН (ЖДЕМ 24ч)";
            } else {
                startBtn.className = "liquid-reveal-btn radar-ready";
                startBtn.innerText = "ЗАПУСТИТЬ СКАНИРОВАНИЕ";
            }
        }
    }, 7000);
}

function spawnComet(index, speed) {
    const stage = document.getElementById("radar-stage");
    if (!stage) return;const comet = document.createElement("div");
    comet.className = "comet";
    
    const colors = ["#3b82f6", "#10b981", "#ffffff", "#c084fc"];
    const randColor = colors[Math.floor(Math.random() * colors.length)];
    comet.style.boxShadow = `0 0 15px ${randColor}`;

    const stageW = stage.offsetWidth || 340;
    const stageH = stage.offsetHeight || 220;

    const startFromLeft = Math.random() > 0.5;
    const startX = startFromLeft ? -30 : stageW + 30;
    const startY = Math.random() * (stageH - 60) + 30; 
    
    const targetX = startFromLeft ? stageW + 30 : -30;
    const targetY = Math.random() * (stageH - 60) + 30;

    comet.style.left = `${startX}px`;
    comet.style.top = `${startY}px`;

    const angle = Math.atan2(targetY - startY, targetX - startX) * (180 / Math.PI);
    comet.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

    stage.appendChild(comet);

    const animMove = anime({
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

    const onHit = (e) => {
        e.stopPropagation();
        animMove.pause();

        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("heavy");
        
        const slot = document.getElementById(`loot-slot-${caughtCount}`);
        if (slot) {
            caughtCount++;
            
            const cometRect = comet.getBoundingClientRect();
            const stageRect = stage.getBoundingClientRect();
            const hitX = cometRect.left - stageRect.left + cometRect.width / 2;
            const hitY = cometRect.top - stageRect.top + cometRect.height / 2;
            
            triggerBigCometExplosion(hitX, hitY, randColor);
            comet.remove();

            slot.innerHTML = `<div class="crystal-core" style="background: ${randColor}; box-shadow: 0 0 12px ${randColor}; opacity: 0; transform: scale(0.2) rotate(45deg);"></div>`;
            
            const core = slot.querySelector(".crystal-core");
            if (core) {
                anime({
                    targets: core,
                    opacity: 1,
                    scale: 1,
                    duration: 400,
                    easing: 'easeOutBack'
                });
            }

            slot.addEventListener("click", () => breakCrystal(slot, randColor));
        }
    };

    comet.addEventListener("mousedown", onHit);
    comet.addEventListener("touchstart", onHit);
}

function triggerBigCometExplosion(x, y, color) {
    const stage = document.getElementById("radar-stage");
    if (!stage) return;

    const particleCount = 18;
    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement("div");
        p.className = "shatter-dust";
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        p.style.background = color;
        p.style.boxShadow = `0 0 12px ${color}`;
        
        stage.appendChild(p);

        const angle = (i / particleCount) * (Math.PI * 2) + Math.random() * 0.5;
        const distance = 35 + Math.random() * 55; 

        anime({
            targets: p,
            left: x + Math.cos(angle) * distance,
            top: y + Math.sin(angle) * distance,
            opacity: [1, 0],
            scale: [1.5, 0],
            duration: 550,
            easing: 'easeOutQuart',
            complete: () => p.remove()
        });
    }
}

function breakCrystal(slot, randColor) {
    if (slot.classList.contains("broken")) return;
    slot.classList.add("broken");
    slot.innerHTML = ""; 

    const rect = slot.getBoundingClientRect();
    const stage = document.getElementById("radar-stage");
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    const x = rect.left - stageRect.left + rect.width / 2;
    const y = rect.top - stageRect.top + rect.height / 2;

    triggerBigCometExplosion(x, y, randColor);

    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("heavy");
    determineLoot(x, y, slot, randColor);
}

function determineLoot(x, y, slot, randColor) {
    const roll = Math.random();
    let prizeHTML = "";

    if (!hasDiscountDroppedInGame && roll > 0.82) {
        hasDiscountDroppedInGame = true;
        const randomDiscount = Math.floor(10 + Math.random() * 21);
        createFloatingText(x, y, `🔥 -${randomDiscount}%!`, 'green-text');
        prizeHTML = `<span style="color: ${randColor}; font-weight: bold;">-${randomDiscount}%</span>`;

        setTimeout(() => { spinSpaceSlot(randomDiscount); }, 200);

    } else if (roll < 0.45) {
        const addPercent = parseFloat((1.0 + Math.random() * 2.0).toFixed(1));
        currentRefPercent = Math.min(maxRefPercent, currentRefPercent + addPercent);
        updateRefUI();
        createFloatingText(x, y, `+${addPercent}%`, 'green-text');
        prizeHTML = `<span style="color: #10b981; font-weight: 700;">+${addPercent}%</span>`;

    } else if (roll < 0.70) {
        const subPercent = parseFloat((1.0 + Math.random() * 2.0).toFixed(1));
        currentRefPercent = Math.max(5.0, currentRefPercent - subPercent);
        updateRefUI();
        createFloatingText(x, y, `-${subPercent}%`, 'red-text');
        prizeHTML = `<span style="color: #ef4444; font-weight: 700;">-${subPercent}%</span>`;

    } else {
        createFloatingText(x, y, `0%`, 'yellow-text');
        prizeHTML = `<span style="color: #eab308; font-weight: 700;">0.0%</span>`;
    }

    slot.innerHTML = `<div class="loot-surprise-node" style="animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;">${prizeHTML}</div>`;
}

function spinSpaceSlot(discountValue) {
    const slotContainer = document.getElementById("wheel-container");
    const reel = document.getElementById("roulette-wheel");

    if (!reel || !slotContainer) return;

    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("heavy");

    const roll = Math.random() * 100;
    let targetIndex = 0; 
    let targetSegment = 1;

    if (roll < 50) { targetIndex = 0; targetSegment = 1; }
    else if (roll < 75) { targetIndex = 1; targetSegment = 3; }
    else if (roll < 90) { targetIndex = 2; targetSegment = 6; }
    else { targetIndex = 3; targetSegment = 12; }

    const cardHeight = 40;
    const cycleOffset = 3; 
    const targetGlobalIndex = cycleOffset * 4 + targetIndex;
    const finalTranslateY = -(targetGlobalIndex * cardHeight);

    reel.style.transition = 'none';
    reel.style.transform = 'translateY(0)';

    setTimeout(() => {
        reel.style.transition = 'transform 4.2s cubic-bezier(0.15, 0.85, 0.15, 1)'; 
        reel.style.transform = `translateY(${finalTranslateY}px)`;
    }, 50);

    setTimeout(() => {
        const neons = { 1: '#3b82f6', 3: '#a855f7', 6: '#10b981', 12: '#f59e0b' };
        
        slotContainer.style.borderColor = neons[targetSegment];
        slotContainer.style.boxShadow = `0 0 35px ${neons[targetSegment]}, inset 0 0 15px ${neons[targetSegment]}`;

        activeDiscounts[targetSegment] = discountValue;
        
        updateTariffPricesUI();

        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");

        setTimeout(() => {
            slotContainer.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            slotContainer.style.boxShadow = '0 8px 25px rgba(0,0,0,0.5), inset 0 0 12px rgba(255, 255, 255, 0.08)';
        }, 3000);
    }, 4500);
}

function updateRefUI() {
    const label = document.getElementById("ref-percent-val");
    const gameLabel = document.getElementById("game-ref-percent");
    if (label) label.innerText = `${currentRefPercent.toFixed(1)}%`;
    if (gameLabel) gameLabel.innerText = `${currentRefPercent.toFixed(1)}% / 40%`;
}

function createFloatingText(x, y, text, cssClass) {
    const stage = document.getElementById("radar-stage");
    if (!stage) return;
    const el = document.createElement("div");
    el.className = `floating-drop-text ${cssClass}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.innerText = text;
    stage.appendChild(el);
    setTimeout(() => el.remove(), 1200);
}

function fillReelCards() {
    const reel = document.getElementById("roulette-wheel");
    if (!reel) return;

    const segments = [
        { class: 'card-1m', text: '1 МЕСЯЦ' },
        { class: 'card-3m', text: '3 МЕСЯЦА' },
        { class: 'card-6m', text: '6 МЕСЯЦЕВ' },
        { class: 'card-12m', text: 'VIP ДОСТУП' }
    ];

    let itemsHTML = "";
    for (let i = 0; i < 5; i++) {
        segments.forEach(seg => {
            itemsHTML += `<div class="slot-card ${seg.class}">${seg.text}</div>`;
        });
    }
    reel.innerHTML = itemsHTML;

    const randomIndex = Math.floor(Math.random() * 4);
    reel.style.transform = `translateY(-${randomIndex * 40}px)`;
}

function updateTariffPricesUI() {
    const types = [1, 3, 6, 12];
    const neons = { 1: '#3b82f6', 3: '#a855f7', 6: '#10b981', 12: '#f59e0b' };

    types.forEach(t => {
        const priceEl = document.getElementById(`price-${t}m`);
        const cardEl = document.getElementById(`tariff-${t}m`);
        const tagEl = document.getElementById(`discount-tag-${t}m`);

        if (activeDiscounts[t] > 0 && priceEl && cardEl) {
            const finalPrice = Math.round(originalPrices[t] * (1 - activeDiscounts[t] / 100));
            
            priceEl.innerText = `${finalPrice} ₽`;
            
            if (tagEl) {
                tagEl.innerText = `🔥 -${activeDiscounts[t]}%`;
                tagEl.style.color = neons[t];
                tagEl.style.textShadow = `0 0 8px ${neons[t]}`;
                tagEl.className = "tariff-discount-tag show-tag";
            }

            const isCurrentlyShown = cardEl.classList.contains("show-card");
            cardEl.className = `tariff-card discounted-neon-${t}m ${isCurrentlyShown ? 'show-card' : ''}`;
        }
    });
}

// ==========================================
// 👑 8. ЛОГИКА АДМИН-ПАНЕЛИ (ГОРИЗОНТАЛЬНЫЙ СПИННЕР)
// ==========================================
function initAdminPanel() {
    if (!isAdmin) return;

    const nav = document.getElementById("app-bottom-nav");
    const adminBtn = document.getElementById("btn-nav-4");
    
    if (nav) nav.classList.add("nav-5-items");
    if (adminBtn) adminBtn.classList.remove("hidden");

    initCalcTouchAndWheel();
    renderApprovedUsersDrum();
    renderAllUsersList();
    updateCalcDisplay();
}

function toggleAdminPromoType(type) {
    adminSelectedTypes[type] = !adminSelectedTypes[type];
    const btn = document.getElementById(`btn-mode-${type}`);

    if (btn) {
        if (adminSelectedTypes[type]) {
            btn.classList.add("active-green");
        } else {
            btn.classList.remove("active-green");
        }
    }
    updateCalcDisplay();
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
}

function setAdminLimitType(type) {
    adminLimitType = type;
    const btnDays = document.getElementById("btn-limit-days");
    const btnCount = document.getElementById("btn-limit-count");

    if (type === 'lifetime_days') {
        if (btnDays) btnDays.className = "admin-type-btn sub-mode active-green";
        if (btnCount) btnCount.className = "admin-type-btn sub-mode";
    } else {
        if (btnDays) btnDays.className = "admin-type-btn sub-mode";
        if (btnCount) btnCount.className = "admin-type-btn sub-mode active-green";
    }
    updateCalcDisplay();
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
}

// 🎡 ГОРИЗОНТАЛЬНОЕ ОБНОВЛЕНИЕ ЧИСЕЛ В БАРАБАНЕ
function updateCalcDisplay() {
    const title = document.getElementById("calc-field-title");
    const numPrev = document.getElementById("num-prev");
    const numCenter = document.getElementById("num-center");
    const numNext = document.getElementById("num-next");

    let textTitle = "ЗНАЧЕНИЕ: ";
    if (adminSelectedTypes.days && adminSelectedTypes.discount) textTitle += "ДНИИ + СКИДКА";
    else if (adminSelectedTypes.days) textTitle += "БЕСПЛАТНЫЕ ДНИ";
    else if (adminSelectedTypes.discount) textTitle += "СКИДКА В %";
    else textTitle += "ВЫБЕРИТЕ ТИП ВЫШЕ";

    let maxVal = 100;
    if (adminLimitType === 'lifetime_days') {
        textTitle += " (СРОК: 1-31 ДН.)";
        maxVal = 31;
    } else {
        textTitle += " (ЛИМИТ: 1-1000 ЧЕЛ.)";
        maxVal = 1000;
    }

    calcValue = Math.max(1, Math.min(maxVal, calcValue));

    if (title) title.innerText = textTitle;

    if (numCenter) numCenter.innerText = calcValue;
    if (numPrev) numPrev.innerText = (calcValue > 1) ? calcValue - 1 : "";
    if (numNext) numNext.innerText = (calcValue < maxVal) ? calcValue + 1 : "";
}

function changeCalcVal(delta) {
    calcValue += delta;
    updateCalcDisplay();
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("selection_change");
}

function startCalcHold(delta) {
    changeCalcVal(delta);
    calcHoldTimer = setInterval(() => {
        changeCalcVal(delta);
    }, 120);
}

function stopCalcHold() {
    if (calcHoldTimer) clearInterval(calcHoldTimer);
}

function initCalcTouchAndWheel() {
    const area = document.getElementById("calc-touch-area");
    if (!area) return;

    area.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
    });

    area.addEventListener("touchmove", (e) => {
        const currentX = e.touches[0].clientX;
        const diff = touchStartX - currentX;

        if (Math.abs(diff) > 18) {
            if (diff > 0) changeCalcVal(1);
            else changeCalcVal(-1);
            touchStartX = currentX;
        }
    });

    area.addEventListener("wheel", (e) => {
        if (e.deltaY < 0) changeCalcVal(1);
        else changeCalcVal(-1);
    });
}

function createAdminPromo() {
    const input = document.getElementById("admin-promo-name");
    if (!input) return;
    const name = input.value.trim().toUpperCase();

    if (!name) {
        alert("🚨 Введите название промокода!");
        return;
    }

    createdPromos[name] = {
        hasDays: adminSelectedTypes.days,
        hasDiscount: adminSelectedTypes.discount,
        val: calcValue,
        limitType: adminLimitType
    };

    alert(`🎉 Промокод ${name} успешно сохранен!\nДни: ${adminSelectedTypes.days ? 'ДА' : 'НЕТ'}\nСкидка: ${adminSelectedTypes.discount ? 'ДА' : 'НЕТ'}\nЗначение: ${calcValue}`);
    input.value = "";
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
}

// ❌ ОДОБРЕННЫЕ ПОЛЬЗОВАТЕЛИ (С КРЕСТИКОМ УДАЛЕНИЯ)
function renderApprovedUsersDrum() {
    const drum = document.getElementById("approved-users-drum");
    if (!drum) return;

    if (approvedUsers.length === 0) {
        drum.innerHTML = `<div class="empty-list-msg">Список одобренных пользователей пуст</div>`;
        return;
    }

    let html = "";
    approvedUsers.forEach((user, idx) => {
        html += `
            <div class="drum-item">
                <span>${user}</span>
                <span class="remove-user-btn" onclick="removeApprovedUser(${idx})">✕</span>
            </div>
        `;
    });
    drum.innerHTML = html;
}

function addApprovedUser() {
    const input = document.getElementById("admin-approved-input");
    if (!input) return;
    const val = input.value.trim();

    if (val && !approvedUsers.includes(val)) {
        approvedUsers.unshift(val.startsWith("@") ? val : `@${val}`);
        renderApprovedUsersDrum();
        input.value = "";
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
    }
}

function removeApprovedUser(index) {
    approvedUsers.splice(index, 1);
    renderApprovedUsersDrum();
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");
}

// 👥 ВСЕ ПОЛЬЗОВАТЕЛИ
function renderAllUsersList() {
    const container = document.getElementById("all-users-container");
    if (!container) return;

    if (allUsersList.length === 0) {
        container.innerHTML = `<div class="empty-list-msg">Пользователи бота будут отображаться здесь</div>`;
        return;
    }

    let html = "";
    allUsersList.forEach(u => {
        const subClass = u.hasSub ? "active-sub" : "";
        const statusTxt = u.hasSub ? "ПОДПИСКА АКТИВНА" : "НЕТ ПОДПИСКИ";
        const statusColor = u.hasSub ? "sub-on" : "sub-off";

        html += `
            <div class="user-row-card ${subClass}" onclick="toggleGiftDrawer(this)">
                <div class="user-row-main">
                    <div>
                        <div class="user-row-name">${u.name} (${u.username})</div>
                    </div>
                    <div class="user-row-status ${statusColor}">${statusTxt}</div>
                </div>
                <div class="user-gift-drawer">
                    <button class="gift-btn" onclick="giftPromoToUser('${u.username}', event)">🎁 ПОДАРИТЬ ПРОМОКОД</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function toggleGiftDrawer(cardEl) {
    cardEl.classList.toggle("open-gift");
}

function giftPromoToUser(username, e) {
    e.stopPropagation();
    const promoCode = prompt(`Введите название промокода для ${username}:`);
    if (promoCode) {
        alert(`🎁 Промокод "${promoCode.toUpperCase()}" успешно отправлен пользователю ${username}!`);
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
    }
}

// ==========================================
// 💡 9. БАЗА ЗНАНИЙ
// ==========================================
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
            setTimeout(() => { if (word) word.classList.add("dip-shrink"); }, idx * 12);
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
        setTimeout(() => { if (span) span.classList.remove("dip-shrink"); }, 40 + idx * 20);
    });
}

function answerFAQ(id) {
    const text = faqAnswers[id];
    if (text) {
        animateDipText(text);
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
    }
}

// ==========================================
// 📂 10. ТАРИФЫ
// ==========================================
function toggleTariffs() {
    const flowContainer = document.getElementById("tariffs-flow");
    const cards = document.querySelectorAll(".tariff-card");
    if (!flowContainer || cards.length === 0) return;

    isTariffsOpen = !isTariffsOpen;

    if (isTariffsOpen) {
        if (isPromoOpen) togglePromoCard(false);
        if (isRefOpen) toggleRefCard(false);
        flowContainer.classList.remove("hidden-flow");
        cards.forEach((card, index) => {
            setTimeout(() => { if (card) card.classList.add("show-card"); }, index * 90);
        });
    } else {
        const reversedCards = Array.from(cards).reverse();
        reversedCards.forEach((card, index) => {
            setTimeout(() => { if (card) card.classList.remove("show-card"); }, index * 70);
        });
        setTimeout(() => { flowContainer.classList.add("hidden-flow"); }, cards.length * 70 + 200);
    }
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
}

function selectTariff(months) {
    let displayValue = (months === 12) ? "∞ Безлимит" : `${months * 30} дней`;

    alert(`Вы успешно приобрели тариф на ${months} мес. (Тестовая покупка)!`);
    isSubscribedUser = true;
    
    const leftVal = document.getElementById("sub-days-left");
    const bar = document.getElementById("sub-progress-bar");
    if (leftVal) leftVal.innerText = displayValue;
    if (bar) bar.style.width = "100%";
    
    checkGameLockStatus();
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
}

// ==========================================
// 🧭 11. НАВИГАЦИЯ С СОХРАНЕНИЕМ СОСТОЯНИЙ
// ==========================================
function switchNav(index, screenId) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    
    const activeScreen = document.getElementById(`screen-${screenId}`);
    const activeNavBtn = document.getElementById(`btn-nav-${index}`);
    
    if (activeScreen) activeScreen.classList.add("active");
    if (activeNavBtn) activeNavBtn.classList.add("active");

    alignNavBox(index);

    if (screenId === 'profile') {
        if (isPromoOpen) togglePromoCard(true);
        if (isRefOpen) toggleRefCard(true);
    }

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

// ==========================================
// 🏁 12. ТОЧКА ВХОДА
// ==========================================
window.onload = () => {
    initSpaceFX();
    initMap3D();
    fillReelCards();
    initAdminPanel();

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
};