// ==========================================
// KONFIGURASI API
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbwExLvQEE0ge9m277E6z_mLHEVlLmpZ2tWf0QrpFUvYZoFrX1f14y7_-DTldpgscCCgYg/exec"; 

// Variabel Global
const customModal = document.getElementById('customModal');
let markDeadIndex = -1; 

// --- SISTEM SECURITY & LOGIN (TETAP SAMA) ---
function getDeviceId() {
    let deviceId = localStorage.getItem("gogo_device_id");
    if (!deviceId) {
        deviceId = "DEV-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
        localStorage.setItem("gogo_device_id", deviceId);
    }
    return deviceId;
}

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
    statusMsg.classList.remove('text-red-400', 'text-green-500');
    statusMsg.innerText = "Verifying session...";
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
            showAlert('Sesi Berakhir', 'Sesi login Anda telah berakhir. Silakan login ulang.');
            localStorage.removeItem("gogo_access_code");
            statusMsg.innerText = data.message;
            statusMsg.classList.remove('text-gray-400');
            statusMsg.classList.add('text-red-400');
            showLogin(); 
        }
    })
    .catch(error => {
        showAlert('Koneksi Gagal', 'Gagal terhubung ke server.');
        statusMsg.innerText = "Gagal koneksi.";
        showLogin();
    });
}

function handleLogin() {
    const codeInput = document.getElementById("accessCode").value.trim();
    const btn = document.getElementById("btnLogin");
    const statusMsg = document.getElementById("loginStatus");
    const deviceId = getDeviceId();

    if (!codeInput) { showAlert('Akses Ditolak', 'Masukkan kode dulu!'); return; }

    btn.innerText = "⏳ Mengecek...";
    btn.disabled = true;

    const formData = new FormData();
    formData.append("action", "login");
    formData.append("code", codeInput);
    formData.append("device_id", deviceId);

    fetch(API_URL, { method: "POST", body: formData })
    .then(response => response.json())
    .then(data => {
        btn.innerText = "MASUK SEKARANG";
        btn.disabled = false;

        if (data.status === true) {
            localStorage.setItem("gogo_access_code", data.data.code);
            showApp();
        } else {
            statusMsg.innerText = data.message;
            statusMsg.classList.add('text-red-400');
        }
    })
    .catch(error => {
        btn.innerText = "MASUK SEKARANG";
        btn.disabled = false;
        statusMsg.innerText = "Error Koneksi!";
    });
}

function handleLogoutConfirm() {
    hideModal();
    localStorage.removeItem("gogo_access_code");
    location.reload(); 
}

function doLogout() {
    showModal('Konfirmasi Keluar', 'Yakin mau keluar?', handleLogoutConfirm, true);
}

function showLogin() {
    document.getElementById("loginPage").classList.remove("hidden");
    document.getElementById("appPage").classList.add("hidden");
}
function showApp() {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("appPage").classList.remove("hidden");
}

// --- HELPER MODAL ---
function showModal(title, message, confirmHandler, isConfirmation = true) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = message;
    
    const btnCancel = document.getElementById('btnCancel');
    const btnConfirm = document.getElementById('btnConfirm');
    
    btnConfirm.onclick = confirmHandler;

    if (isConfirmation) {
        btnCancel.classList.remove('hidden');
        btnConfirm.innerText = "Ya, Lanjut";
        btnConfirm.classList.remove('bg-blue-600'); 
        btnConfirm.classList.add('bg-red-600'); 
    } else {
        btnCancel.classList.add('hidden');
        btnConfirm.innerText = "OK";
        btnConfirm.classList.remove('bg-red-600');
        btnConfirm.classList.add('bg-blue-600'); 
        btnConfirm.onclick = hideModal;
    }

    customModal.classList.remove('hidden');
    customModal.querySelector('div').classList.remove('scale-95', 'opacity-0');
    customModal.querySelector('div').classList.add('scale-100', 'opacity-100');
}

function showAlert(title, message) {
    showModal(title, message, hideModal, false);
}

function hideModal() {
    customModal.querySelector('div').classList.remove('scale-100', 'opacity-100');
    customModal.querySelector('div').classList.add('scale-95', 'opacity-0');
    setTimeout(() => { customModal.classList.add('hidden'); }, 300);
}


// ==========================================
// 🔥 LOGIC GAME PREDIKSI (REVISI V2) 🔥
// ==========================================
let enemies = []; 
let currentIndex = 0; 
let isFull = false; 

function addEnemy() {
    const input = document.getElementById('enemyInput');
    const name = input.value.trim();
    if (!name) return;

    enemies.push({ name: name, isDead: false });
    input.value = "";
    
    renderList();
    const listContainer = document.getElementById('enemyListContainer');
    listContainer.scrollTop = listContainer.scrollHeight; 

    updateInfo();

    if (enemies.length === 7) startPredictionMode();
}

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
});

function startPredictionMode() {
    isFull = true;
    document.getElementById('inputSection').classList.add('hidden');
    document.getElementById('controlSection').classList.remove('hidden');
    
    const statusEl = document.getElementById('roundStatus');
    statusEl.innerText = "Fase: PREDIKSI AKTIF";
    statusEl.classList.remove('bg-gray-600');
    statusEl.classList.add('bg-neon-green', 'text-gray-900');
    
    showPrediction();
}

// 🟢 BUTTON 1: LAWAN SESUAI PREDIKSI
// Logic: Geser index ke musuh berikutnya
function nextRound() { 
    moveIndexNext(); 
    showPrediction(); 
}

// 🟡 BUTTON 2: KETEMU MIRROR (FIXED LOGIC)
// Logic: JANGAN geser index. Target ronde depan TETAP musuh yang seharusnya dilawan sekarang.
function metMirror() {
    // Kita TIDAK memanggil moveIndexNext()
    
    // Hanya update visual
    const display = document.getElementById('predictionDisplay');
    const originalText = display.innerText;
    
    display.innerText = "MIRROR (Target Tetap)";
    display.classList.remove('text-3xl', 'text-neon-green');
    display.classList.add('text-yellow-400', 'text-lg');
    
    // Beri notif pop-up agar user paham
    showAlert("Info Mirror", "Ketemu Mirror tidak mengubah antrian rotasi. Target selanjutnya tetap: " + originalText);

    setTimeout(() => {
        display.innerText = originalText;
        display.classList.remove('text-yellow-400', 'text-lg');
        display.classList.add('text-3xl', 'text-neon-green');
        // Tidak perlu showPrediction() karena index tidak berubah
    }, 1500);
}

// ⚫ BUTTON 3: CREEP / FATEBOX
// Logic: Tidak mengubah apa-apa, hanya lewat
function skipRound() { 
    showAlert('Fase Dilewati', "Fase Creep/Fatebox tidak mengubah target rotasi.");
}

// ⚙️ FUNGSI INTI ROTASI
function moveIndexNext() {
    // Geser index 1 langkah
    currentIndex++;
    if (currentIndex >= 7) currentIndex = 0;
    
    // Jika mendarat di musuh mati, cari yang hidup berikutnya
    skipDeadEnemies();
}

function skipDeadEnemies() {
    let attempts = 0;
    // Loop max 8 kali untuk mencegah infinite loop jika semua mati
    while (enemies[currentIndex].isDead && attempts < 8) {
        currentIndex++;
        if (currentIndex >= 7) currentIndex = 0;
        attempts++;
    }
}

function showPrediction() {
    if (!isFull) return;
    
    // Pastikan index saat ini valid (bukan mayat)
    skipDeadEnemies();
    
    const aliveEnemies = enemies.filter(e => !e.isDead).length;
    if (aliveEnemies === 0) {
        document.getElementById('predictionDisplay').innerText = "🏆 WINNER!";
        document.getElementById('predictionDisplay').classList.add('text-yellow-500');
        return;
    }

    const target = enemies[currentIndex];
    document.getElementById('predictionDisplay').innerText = target.name;
    
    // Render ulang list untuk update highlight target
    renderList();
}

// 🔴 FUNGSI ELIMINASI MUSUH
function handleMarkDeadConfirm() {
    hideModal();
    if (markDeadIndex !== -1) {
        enemies[markDeadIndex].isDead = true;
        
        // Jika yang mati adalah target saat ini, otomatis geser ke target hidup berikutnya
        if (isFull && markDeadIndex === currentIndex) {
            moveIndexNext(); 
        }
        
        renderList();
        updateInfo();
        if (isFull) showPrediction();
    }
    markDeadIndex = -1; 
}

function markDead(index) {
    markDeadIndex = index; 
    const name = enemies[index].name;
    showModal('Konfirmasi Eliminasi', `Yakin ${name} sudah eliminasi?`, handleMarkDeadConfirm, true);
}

// 🔵 FITUR BARU: KOREKSI MANUAL (SET TARGET)
// Gunakan ini jika prediksi sistem salah, user bisa klik tombol untuk sync ulang.
function setManualTarget(index) {
    if (confirm(`Prediksi Salah? Set ${enemies[index].name} sebagai target ronde ini?`)) {
        currentIndex = index;
        showPrediction();
    }
}

function updateInfo() {
    const aliveEnemies = enemies.filter(e => !e.isDead).length;
    const totalAlive = aliveEnemies + 1; 
    const isGanjil = totalAlive % 2 !== 0;
    document.getElementById('playerCount').innerText = `Players: ${totalAlive} (${isGanjil ? 'Ganjil' : 'Genap'})`;
    
    const alertBox = document.getElementById('mirrorAlert');
    if (isGanjil && isFull) alertBox.classList.remove('hidden');
    else alertBox.classList.add('hidden');
}

function renderList() {
    const container = document.getElementById('enemyListContainer');
    container.innerHTML = "";

    if (enemies.length === 0) {
        container.innerHTML = '<div class="text-center text-sm text-gray-600 py-5">Belum ada data musuh</div>';
        return;
    }
    enemies.forEach((enemy, index) => {
        const div = document.createElement('div');
        const isTarget = (isFull && index === currentIndex && !enemy.isDead);
        
        // Styling List Item
        div.className = `flex justify-between items-center p-3 rounded-lg mb-1 ${enemy.isDead ? 'opacity-50 bg-gray-900' : 'bg-gray-800'} ${isTarget ? 'ring-2 ring-neon-green border border-neon-green' : 'border border-gray-700'}`;
        
        div.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500">#${index + 1}</span> 
                <span class="text-sm font-semibold ${enemy.isDead ? 'line-through' : 'text-white'}">
                    ${enemy.name}
                    ${isTarget ? '<span class="ml-2 text-xs bg-neon-green text-black px-1 rounded font-bold">TARGET</span>' : ''}
                </span>
            </div>
            
            <div class="flex gap-2">
                ${!enemy.isDead && isFull && !isTarget ? 
                    // Tombol Koreksi (Hanya muncul jika mode prediksi aktif dan bukan target saat ini)
                    `<button class="text-xs bg-blue-600/20 text-blue-400 border border-blue-400/50 px-2 py-1 rounded hover:bg-blue-600 hover:text-white" onclick="setManualTarget(${index})" title="Jadikan Target (Koreksi)">
                        🎯 Set
                    </button>` : ''
                }
                
                ${!enemy.isDead ? 
                    `<button class="text-xs bg-red-600/20 text-red-400 border border-red-400/50 px-2 py-1 rounded hover:bg-red-600 hover:text-white" onclick="markDead(${index})">
                        💀
                    </button>` : 
                    '<span class="text-xs">🪦</span>'}
            </div>
        `;
        container.appendChild(div);
    });
}

function resetGameState() {
    enemies = []; 
    currentIndex = 0; 
    isFull = false; 

    document.getElementById('inputSection').classList.remove('hidden');
    document.getElementById('controlSection').classList.add('hidden');
    document.getElementById('predictionDisplay').innerText = "...";
    
    const statusEl = document.getElementById('roundStatus');
    statusEl.innerText = "Fase Input";
    statusEl.classList.remove('bg-neon-green', 'text-gray-900');
    statusEl.classList.add('bg-gray-600'); 
    
    renderList(); 
    updateInfo(); 
}

function handleResetConfirm() {
    hideModal(); 
    resetGameState();
}

function resetAll() {
    showModal('Konfirmasi Reset', 'Mulai game baru?', handleResetConfirm, true);
}

checkLogin();