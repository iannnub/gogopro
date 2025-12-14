// ==========================================
// KONFIGURASI API (FINAL)
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbwExLvQEE0ge9m277E6z_mLHEVlLmpZ2tWf0QrpFUvYZoFrX1f14y7_-DTldpgscCCgYg/exec"; 

// Variabel Global
const customModal = document.getElementById('customModal');
let markDeadIndex = -1; // Untuk menyimpan index musuh yang akan dimatikan

// --- SISTEM SECURITY & LOGIN ---

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

    fetch(API_URL, {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === true) {
            console.log("Session Valid: " + data.message);
            showApp(); 
        } else {
            // Mengganti alert browser dengan custom modal
            showAlert('Sesi Berakhir', 'Sesi login Anda telah berakhir. Silakan login ulang.');
            localStorage.removeItem("gogo_access_code");
            statusMsg.innerText = data.message;
            statusMsg.classList.remove('text-gray-400');
            statusMsg.classList.add('text-red-400');
            showLogin(); 
        }
    })
    .catch(error => {
        console.error("Gagal verifikasi session:", error);
        showAlert('Koneksi Gagal', 'Gagal terhubung ke server. Cek koneksi internet!');
        statusMsg.innerText = "Gagal terhubung ke server. Cek koneksi internet!";
        statusMsg.classList.remove('text-gray-400');
        statusMsg.classList.add('text-red-400');
        showLogin();
    });
}

function handleLogin() {
    const codeInput = document.getElementById("accessCode").value.trim();
    const btn = document.getElementById("btnLogin");
    const statusMsg = document.getElementById("loginStatus");
    const deviceId = getDeviceId();

    if (!codeInput) { showAlert('Akses Ditolak', 'Masukkan kode dulu bro!'); return; }

    btn.innerText = "⏳ Mengecek...";
    btn.disabled = true;
    statusMsg.innerText = "";

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
            statusMsg.innerText = "Login Berhasil!";
            statusMsg.classList.remove('text-red-400', 'text-gray-400');
            statusMsg.classList.add('text-green-500');

            localStorage.setItem("gogo_access_code", data.data.code);
            showApp();
        } else {
            statusMsg.innerText = data.message;
            statusMsg.classList.remove('text-green-500', 'text-gray-400');
            statusMsg.classList.add('text-red-400');
        }
    })
    .catch(error => {
        btn.innerText = "MASUK SEKARANG";
        btn.disabled = false;
        statusMsg.innerText = "Error Koneksi!";
        statusMsg.classList.add('text-red-400');
    });
}

// LOGIC KHUSUS LOGOUT DENGAN CUSTOM MODAL
function handleLogoutConfirm() {
    hideModal();
    localStorage.removeItem("gogo_access_code");
    location.reload(); 
}

function doLogout() {
    // Mengganti confirm browser
    showModal('Konfirmasi Keluar', 'Yakin mau keluar? Kode harus dimasukkan lagi nanti.', handleLogoutConfirm, true);
}

function showLogin() {
    document.getElementById("loginPage").classList.remove("hidden");
    document.getElementById("appPage").classList.add("hidden");
}
function showApp() {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("appPage").classList.remove("hidden");
}

// --- HELPER UNTUK CUSTOM MODAL (Updated Flexible Modal) ---

// Fungsi utama untuk menampilkan modal (bisa Confirm atau Alert)
function showModal(title, message, confirmHandler, isConfirmation = true) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = message;
    
    const btnCancel = document.getElementById('btnCancel');
    const btnConfirm = document.getElementById('btnConfirm');
    
    // Set handler untuk tombol Ya/OK
    btnConfirm.onclick = confirmHandler;

    if (isConfirmation) {
        // Confirmation Mode (Ya/Batal)
        btnCancel.classList.remove('hidden');
        btnConfirm.innerText = "Ya, Lanjut";
        btnConfirm.classList.remove('bg-blue-600'); 
        btnConfirm.classList.add('bg-red-600'); 
    } else {
        // Alert Mode (OK)
        btnCancel.classList.add('hidden');
        btnConfirm.innerText = "OK";
        btnConfirm.classList.remove('bg-red-600');
        btnConfirm.classList.add('bg-blue-600'); 
        // Untuk Alert, handler OK otomatis hideModal
        btnConfirm.onclick = hideModal;
    }

    customModal.classList.remove('hidden');
    // Animasi masuk
    customModal.querySelector('div').classList.remove('scale-95', 'opacity-0');
    customModal.querySelector('div').classList.add('scale-100', 'opacity-100');
}

// Helper untuk Alert sederhana (OK)
function showAlert(title, message) {
    showModal(title, message, hideModal, false);
}

function hideModal() {
    // Animasi keluar
    customModal.querySelector('div').classList.remove('scale-100', 'opacity-100');
    customModal.querySelector('div').classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        customModal.classList.add('hidden');
    }, 300); // Tunggu animasi selesai
}


// --- LOGIKA GAME PREDIKSI ---
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

// Listener untuk Tombol ENTER agar stabil
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
    document.getElementById('roundStatus').innerText = "Fase: PREDIKSI AKTIF";
    
    document.getElementById('roundStatus').classList.remove('bg-gray-600');
    document.getElementById('roundStatus').classList.add('bg-neon-green', 'text-gray-900');
    
    showPrediction();
}

function nextRound() { moveIndexNext(); showPrediction(); }

function metMirror() {
    moveIndexNext();
    showPrediction();
    const display = document.getElementById('predictionDisplay');
    const originalText = display.innerText;
    
    display.innerText = "ROTASI DIGESER (MIRROR)";
    display.classList.remove('text-3xl', 'text-neon-green');
    display.classList.add('text-yellow-400', 'text-lg');
    
    setTimeout(() => {
        display.innerText = originalText;
        display.classList.remove('text-yellow-400', 'text-lg');
        display.classList.add('text-3xl', 'text-neon-green');
        showPrediction(); 
    }, 1200);
}

// LOGIC KHUSUS SKIP ROUND DENGAN CUSTOM ALERT
function skipRound() { 
    showAlert('Fase Dilewati', "Fase Skip (Creep/Fatebox). Rotasi dan target tetap sama.");
}

function moveIndexNext() {
    currentIndex++;
    if (currentIndex >= 7) currentIndex = 0;
    skipDeadEnemies();
}

function skipDeadEnemies() {
    let attempts = 0;
    while (enemies[currentIndex].isDead && attempts < 8) {
        currentIndex++;
        if (currentIndex >= 7) currentIndex = 0;
        attempts++;
    }
}

function showPrediction() {
    if (!isFull) return;
    skipDeadEnemies();
    
    const aliveEnemies = enemies.filter(e => !e.isDead).length;
    if (aliveEnemies === 0) {
        document.getElementById('predictionDisplay').innerText = "🏆 WINNER!";
        document.getElementById('predictionDisplay').classList.add('text-yellow-500');
        return;
    }

    const target = enemies[currentIndex];
    document.getElementById('predictionDisplay').innerText = target.name;
    renderList();
}

// LOGIC KHUSUS MARK DEAD DENGAN CUSTOM MODAL
function handleMarkDeadConfirm() {
    hideModal();
    if (markDeadIndex !== -1) {
        enemies[markDeadIndex].isDead = true;
        renderList();
        updateInfo();
        if (isFull && markDeadIndex === currentIndex) showPrediction();
    }
    markDeadIndex = -1; // Reset index
}

function markDead(index) {
    // Menyimpan index sementara sebelum konfirmasi
    markDeadIndex = index; 
    const name = enemies[index].name;
    // Mengganti confirm browser
    showModal('Konfirmasi Eliminasi', `Yakin ${name} sudah eliminasi?`, handleMarkDeadConfirm, true);
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
        const isActive = (isFull && index === currentIndex && !enemy.isDead);
        
        div.className = `flex justify-between items-center p-3 rounded-lg ${enemy.isDead ? 'opacity-50 line-through bg-gray-900' : 'bg-gray-800'} ${isActive ? 'ring-2 ring-neon-green border border-neon-green' : 'border border-gray-700'}`;
        
        div.innerHTML = `
            <span class="text-sm">
                <small class="text-gray-500 mr-2">#${index + 1}</small> 
                ${enemy.name}
            </span>
            ${!enemy.isDead ? 
                // Handler markDead tetap di HTML karena butuh index
                `<button class="text-xs bg-red-600/20 text-red-400 border border-red-400/50 px-2 py-1 rounded-md hover:bg-red-600 hover:text-white" onclick="markDead(${index})">
                    MATI 💀
                </button>` : 
                '<span class="text-sm text-gray-600">🪦</span>'}
        `;
        container.appendChild(div);
    });
}

// LOGIC KHUSUS RESET ALL DENGAN CUSTOM MODAL
function resetGameState() {
    enemies = []; 
    currentIndex = 0; 
    isFull = false; 

    document.getElementById('inputSection').classList.remove('hidden');
    document.getElementById('controlSection').classList.add('hidden');

    document.getElementById('predictionDisplay').innerText = "...";
    
    document.getElementById('roundStatus').innerText = "Fase Input";
    document.getElementById('roundStatus').classList.remove('bg-neon-green', 'text-gray-900');
    document.getElementById('roundStatus').classList.add('bg-gray-600'); 
    
    renderList(); 
    updateInfo(); 
}

function handleResetConfirm() {
    hideModal(); 
    resetGameState();
}

function resetAll() {
    showModal('Konfirmasi Reset', 'Yakin ingin mereset semua data permainan dan memulai game baru?', handleResetConfirm, true);
}

// JALANKAN CEK LOGIN SAAT HALAMAN DIBUKA
checkLogin();