// ==========================================
// 1. KONFIGURASI SYSTEM & UTILITIES
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbwExLvQEE0ge9m277E6z_mLHEVlLmpZ2tWf0QrpFUvYZoFrX1f14y7_-DTldpgscCCgYg/exec"; 

// State Management
let enemies = []; 
let currentIndex = 0; 
let isFull = false; 
let markDeadIndex = -1; 

// --- Haptic Feedback ---
function triggerHaptic() {
    if (navigator.vibrate) navigator.vibrate(15);
}

// --- Generate Device ID ---
function getDeviceId() {
    let deviceId = localStorage.getItem("gogo_device_id");
    if (!deviceId) {
        deviceId = "DEV-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
        localStorage.setItem("gogo_device_id", deviceId);
    }
    return deviceId;
}

// ==========================================
// 2. AUTHENTICATION FLOW
// ==========================================
function checkLogin() {
    const savedCode = localStorage.getItem("gogo_access_code");
    const devIdDisplay = document.getElementById("displayDeviceId");
    if(devIdDisplay) devIdDisplay.innerText = getDeviceId();

    if (savedCode) {
        verifySession(savedCode);
    } else {
        showLogin();
    }
}

function verifySession(code) {
    const statusMsg = document.getElementById("loginStatus");
    statusMsg.innerText = "Verifying...";
    statusMsg.classList.add('text-gray-400');
    
    const formData = new FormData();
    formData.append("action", "login");
    formData.append("code", code);
    formData.append("device_id", getDeviceId());

    fetch(API_URL, { method: "POST", body: formData })
    .then(response => response.json())
    .then(data => {
        if (data.status === true) {
            showApp(); 
        } else {
            showAlert('Sesi Berakhir', 'Silakan login ulang untuk keamanan.');
            localStorage.removeItem("gogo_access_code");
            showLogin(); 
        }
    })
    .catch(() => {
        showLogin();
    });
}

function handleLogin() {
    triggerHaptic();
    const codeInput = document.getElementById("accessCode").value.trim();
    if (!codeInput) { showAlert('Gagal', 'Masukkan kode akses dulu!'); return; }
    
    const btn = document.getElementById("btnLogin");
    const statusMsg = document.getElementById("loginStatus");
    
    btn.innerHTML = `<i class="ph-bold ph-spinner animate-spin"></i> MEMPROSES...`;
    btn.disabled = true;

    const formData = new FormData();
    formData.append("action", "login");
    formData.append("code", codeInput);
    formData.append("device_id", getDeviceId());

    fetch(API_URL, { method: "POST", body: formData })
    .then(response => response.json())
    .then(data => {
        btn.innerHTML = `<i class="ph-bold ph-sign-in"></i> MASUK SEKARANG`;
        btn.disabled = false;
        if (data.status === true) {
            localStorage.setItem("gogo_access_code", data.data.code);
            showApp();
        } else {
            statusMsg.innerText = data.message;
            statusMsg.classList.add('text-red-400');
        }
    })
    .catch(() => {
        btn.innerHTML = `<i class="ph-bold ph-sign-in"></i> MASUK SEKARANG`;
        btn.disabled = false;
        statusMsg.innerText = "Gagal terhubung ke server!";
    });
}

function showLogin() {
    document.getElementById("loginPage").classList.remove("hidden");
    document.getElementById("appPage").classList.add("hidden");
}
function showApp() {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("appPage").classList.remove("hidden");
}


// ==========================================
// 3. UI HELPER & MODAL SYSTEM (UI MATCHING FIX)
// ==========================================

// FUNGSI MODAL PINTAR (UPDATED: Support Custom Text)
function showModal(title, message, confirmHandler, theme = 'info', isConfirmation = true, customText = null) {
    const modal = document.getElementById('customModal');
    const backdrop = document.getElementById('modalBackdrop');
    const panel = document.getElementById('modalPanel');
    
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = message;
    
    const btnConfirm = document.getElementById('btnConfirm');
    const btnCancel = document.getElementById('btnCancel');
    const iconContainer = document.getElementById('modalIconContainer');
    const icon = document.getElementById('modalIcon');
    const footerContainer = document.getElementById('modalFooterContainer') || btnConfirm.parentElement;

    // Reset base classes
    const baseBtnClass = "inline-flex w-full justify-center items-center rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all btn-press border-b-4 active:border-b-0 active:translate-y-1 ";
    iconContainer.className = "mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full mb-3 transition-colors duration-300 border-2 shadow-inner ";

    let themeClasses = "";
    let defaultText = "";

    if (theme === 'danger') {
        // MERAH
        themeClasses = "bg-red-600 hover:bg-red-500 border-red-800 shadow-red-900/20";
        iconContainer.classList.add('bg-red-500/10', 'border-red-500/20');
        icon.className = "ph-duotone ph-warning-octagon text-3xl text-red-500";
        defaultText = `<i class="ph-bold ph-trash mr-2"></i> Hapus`;
    } 
    else if (theme === 'warning') {
        // KUNING
        themeClasses = "bg-yellow-500 hover:bg-yellow-400 border-yellow-700 shadow-yellow-900/20 text-white";
        iconContainer.classList.add('bg-yellow-500/10', 'border-yellow-500/20');
        icon.className = "ph-duotone ph-hand-palm text-3xl text-yellow-500";
        defaultText = `<i class="ph-bold ph-hand-palm mr-2"></i> Tahan`;
    } 
    else {
        // BIRU
        themeClasses = "bg-blue-600 hover:bg-blue-500 border-blue-800 shadow-blue-900/20";
        iconContainer.classList.add('bg-blue-500/10', 'border-blue-500/20');
        icon.className = "ph-duotone ph-info text-3xl text-blue-500";
        defaultText = "OK, Siap";
    }

    btnConfirm.className = baseBtnClass + themeClasses;

    // LOGIC TEKS TOMBOL: Pakai customText jika ada, kalau tidak pakai defaultText
    if(isConfirmation) {
        btnConfirm.innerHTML = customText || defaultText;
    } else {
        btnConfirm.innerHTML = "OK, Siap";
    }

    // Clone node & Listener Setup
    const newConfirm = btnConfirm.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newConfirm, btnConfirm);

    newConfirm.onclick = () => {
        triggerHaptic();
        confirmHandler();
    };

    if(btnCancel) {
        btnCancel.onclick = () => {
            triggerHaptic();
            hideModal();
        };
    }

    // Layout Control
    if (isConfirmation) {
        if(btnCancel) btnCancel.classList.remove('hidden');
        footerContainer.classList.remove('grid-cols-1');
        footerContainer.classList.add('grid-cols-2');
    } else {
        if(btnCancel) btnCancel.classList.add('hidden');
        footerContainer.classList.remove('grid-cols-2');
        footerContainer.classList.add('grid-cols-1');
    }

    // Animation
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
    });
}

function showAlert(title, message) {
    showModal(title, message, hideModal, 'info', false);
}

function hideModal() {
    const modal = document.getElementById('customModal');
    const backdrop = document.getElementById('modalBackdrop');
    const panel = document.getElementById('modalPanel');

    backdrop.classList.add('opacity-0');
    panel.classList.remove('scale-100', 'opacity-100');
    panel.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

// UPDATE STATUS BADGE UI (UI FIX: Kotak bukan Bulat)
function updateStatusBadge(type) {
    const statusEl = document.getElementById('roundStatus');
    // UI FIX: Ganti 'rounded-full' jadi 'rounded-md' biar match sama UI baru
    const baseClass = "flex items-center gap-2 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase transition-all duration-300";
    
    let themeClass = "", textHTML = "";

    if (type === 'INPUT') {
        themeClass = "bg-gray-700/50 border-gray-600 text-gray-300";
        textHTML = `INPUT FASE`;
    } else if (type === 'PREDICTION') {
        themeClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
        textHTML = `<span class="relative flex h-1.5 w-1.5 mr-1"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></span> TARGET AKTIF`;
    } else if (type === 'GHOST') {
        themeClass = "bg-purple-500/10 border-purple-500/30 text-purple-400";
        textHTML = `<i class="ph-fill ph-ghost text-xs"></i> GHOST SLOT`;
    }
    
    statusEl.className = `${baseClass} ${themeClass}`;
    statusEl.innerHTML = textHTML;
}


// ==========================================
// 4. LOGIC GAMEPLAY & INTERACTION
// ==========================================

function doLogout() {
    triggerHaptic();
    showModal(
        'Konfirmasi Keluar', 
        'Yakin mau keluar? Sesi Anda akan berakhir.', 
        () => {
            hideModal();
            localStorage.removeItem("gogo_access_code");
            location.reload();
        }, 
        'danger', // Tema Merah
        true,     // Mode Konfirmasi
        `<i class="ph-bold ph-sign-out mr-2"></i> Keluar` // Custom Text: KELUAR
    );
}

function resetAll() {
    triggerHaptic();
    showModal(
        'Reset Game', 
        'Mulai game baru? Data musuh akan dihapus.', 
        () => {
            hideModal();
            enemies = []; 
            currentIndex = 0; 
            isFull = false; 

            const controlSec = document.getElementById('controlSection');
            controlSec.style.opacity = '0';
            setTimeout(() => {
                controlSec.classList.add('hidden');
                const inputSec = document.getElementById('inputSection');
                inputSec.classList.remove('hidden');
                requestAnimationFrame(() => { inputSec.style.opacity = '1'; });
            }, 300);

            document.getElementById('predictionDisplay').innerText = "...";
            updateStatusBadge('INPUT');
            renderList(); 
            updateInfo(); 
        }, 
        'danger', // Tema Merah
        true,     // Mode Konfirmasi
        `<i class="ph-bold ph-arrows-counter-clockwise mr-2"></i> Reset` // Custom Text: RESET
    );
}

function metMirror() {
    triggerHaptic();
    showModal('Rotasi Ditahan', 'Bertemu Mirror / Creep? Rotasi target tidak akan berubah.', () => {
        const display = document.getElementById('predictionDisplay');
        display.classList.add('text-yellow-400', 'blur-[2px]');
        setTimeout(() => {
            display.classList.remove('text-yellow-400', 'blur-[2px]');
        }, 500);
        hideModal();
    }, 'warning');
}

function markDead(index) {
    triggerHaptic();
    markDeadIndex = index; 
    const name = enemies[index].name;
    showModal('Eliminasi', `Yakin ${name} sudah mati?`, () => {
        hideModal();
        if (markDeadIndex !== -1) {
            enemies[markDeadIndex].isDead = true;
            renderList();
            if (isFull) showPrediction();
        }
        markDeadIndex = -1; 
    }, 'danger');
}

// --- STANDARD GAME LOGIC ---

function addEnemy() {
    const input = document.getElementById('enemyInput');
    const name = input.value.trim();
    if (!name) return;
    
    triggerHaptic();
    enemies.push({ name: name, isDead: false });
    input.value = "";
    input.focus(); 
    
    renderList();
    updateInfo();

    const listContainer = document.getElementById('enemyListContainer');
    listContainer.scrollTo({ top: listContainer.scrollHeight, behavior: 'smooth' });

    if (enemies.length === 7) startPredictionMode();
}

function startPredictionMode() {
    isFull = true;
    const inputSec = document.getElementById('inputSection');
    const controlSec = document.getElementById('controlSection');
    
    inputSec.style.opacity = '0';
    setTimeout(() => {
        inputSec.classList.add('hidden');
        controlSec.classList.remove('hidden');
        controlSec.style.opacity = '0';
        controlSec.style.transform = 'translateY(10px)';
        requestAnimationFrame(() => {
            controlSec.style.transition = 'all 0.5s ease';
            controlSec.style.opacity = '1';
            controlSec.style.transform = 'translateY(0)';
        });
    }, 300);

    showPrediction();
}

function nextRound() { 
    triggerHaptic();
    currentIndex++;
    if (currentIndex >= 7) currentIndex = 0;
    showPrediction(); 
}

function showPrediction() {
    if (!isFull) return;
    const target = enemies[currentIndex];
    const display = document.getElementById('predictionDisplay');

    display.className = "w-full transition-all duration-300";

    if (target.isDead) {
        updateStatusBadge('GHOST');
        display.innerHTML = `
            <div class="flex flex-col items-center justify-center py-2 animate-pulse opacity-70">
                <div class="flex items-center gap-2 text-purple-400 mb-1">
                     <i class="ph-duotone ph-ghost text-xl"></i>
                     <span class="text-xl font-bold tracking-wider">MIRROR RANDOM</span>
                </div>
                <span class="text-[10px] text-purple-300/50 uppercase tracking-widest font-mono">Mirror Potensial</span>
            </div>
        `;
    } else {
        updateStatusBadge('PREDICTION');
        display.innerHTML = `<div class="text-3xl font-black text-white tracking-tight drop-shadow-md break-words leading-tight text-center">${target.name}</div>`;
    }
    renderList();
}

function setManualTarget(index) {
    triggerHaptic();
    const targetName = enemies[index].name;
    showModal('Koreksi Target', `Paksa target ronde ini ke ${targetName}?`, () => {
        currentIndex = index;
        showPrediction();
        hideModal();
    }, 'warning');
}

// ==========================================
// 5. RENDER LIST & INFO
// ==========================================

function updateInfo() {
    const aliveEnemies = enemies.filter(e => !e.isDead).length;
    const totalAlive = aliveEnemies + 1; 
    const isGanjil = totalAlive % 2 !== 0;
    
    const countEl = document.getElementById('playerCount');
    countEl.innerText = `${totalAlive} Players`;
    
    const alertBox = document.getElementById('mirrorAlert');
    if (isGanjil && isFull) alertBox.classList.remove('hidden');
    else alertBox.classList.add('hidden');
}

function renderList() {
    const container = document.getElementById('enemyListContainer');
    container.innerHTML = "";

    if (enemies.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-600 py-6 flex flex-col items-center gap-2 border border-dashed border-gray-700/50 rounded-lg m-1">
                <i class="ph-duotone ph-list-dashes text-2xl opacity-40"></i>
                <span class="text-xs font-medium">Belum ada data</span>
            </div>`;
        return;
    }

    enemies.forEach((enemy, index) => {
        const isTarget = (isFull && index === currentIndex);
        const div = document.createElement('div');
        
        // UI FIX: Warna lebih gelap & solid untuk list item
        let wrapperClass = "flex justify-between items-center p-3 rounded-lg border transition-all duration-300 relative overflow-hidden group mb-1.5 ";
        
        if (enemy.isDead) {
            wrapperClass += "bg-[#0f1115] border-dashed border-red-500/10 opacity-60 hover:opacity-100 hover:border-red-500/30";
        } else if (isTarget) {
            wrapperClass += "bg-emerald-900/20 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.05)]";
        } else {
            wrapperClass += "bg-gray-800/40 border-gray-700/50 hover:bg-gray-800";
        }

        div.className = wrapperClass;
        div.innerHTML = `
            ${isTarget ? '<div class="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>' : ''}
            <div class="flex items-center gap-3 overflow-hidden pl-1">
                <span class="text-[10px] font-mono w-4 ${enemy.isDead ? 'text-gray-700' : 'text-gray-500'}">#${index + 1}</span> 
                <div class="flex flex-col">
                    <span class="text-sm font-bold truncate max-w-[120px] ${enemy.isDead ? 'line-through text-red-900/50 decoration-red-900/50' : 'text-gray-200'}">
                        ${enemy.name}
                    </span>
                    ${isTarget 
                        ? (enemy.isDead 
                            ? '<span class="text-[9px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1"><i class="ph-fill ph-ghost"></i> Ghost</span>' 
                            : '<span class="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1"><i class="ph-fill ph-crosshair"></i> Target</span>')
                        : (enemy.isDead ? '<span class="text-[9px] text-gray-600 font-mono">Eliminated</span>' : '')}
                </div>
            </div>
            <div class="flex gap-2 z-10">
                ${!enemy.isDead && isFull && !isTarget ? 
                    `<button class="w-7 h-7 rounded-md bg-gray-700/50 hover:bg-emerald-600 text-gray-400 hover:text-white transition-all flex items-center justify-center border border-gray-600 hover:border-emerald-500 btn-press" onclick="setManualTarget(${index})">
                        <i class="ph-bold ph-crosshair-simple"></i>
                    </button>` : ''
                }
                ${!enemy.isDead ? 
                    `<button class="w-7 h-7 rounded-md bg-gray-700/50 hover:bg-red-500 text-gray-400 hover:text-white transition-all flex items-center justify-center border border-gray-600 hover:border-red-500 btn-press" onclick="markDead(${index})">
                        <i class="ph-bold ph-skull"></i>
                    </button>` : 
                    '<div class="w-7 h-7 flex items-center justify-center"><i class="ph-fill ph-skull text-gray-800 text-lg"></i></div>'
                }
            </div>
        `;
        container.appendChild(div);
    });
}

// Initial Listeners
document.addEventListener('DOMContentLoaded', () => {
    const enemyInput = document.getElementById('enemyInput');
    if (enemyInput) {
        enemyInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && !document.getElementById("inputSection").classList.contains('hidden')) {
                e.preventDefault(); 
                addEnemy();
            }
        });
    }
    checkLogin();
});