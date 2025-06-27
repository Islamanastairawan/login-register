// Variabel Global
let users = [];
let currentUser = null;
let otpData = null;
let isLogin = true;
let encryptionKeys = null;
let customEncryption = null;

// Inisialisasi enkripsi dengan kunci rahasia
async function loadKeys() {
  try {
    const response = await fetch("key.json");
    encryptionKeys = await response.json();
    // Inisialisasi enkripsi dengan kunci dari file
    customEncryption = new encryption(encryptionKeys.encryptionKey);
  } catch (error) {
    console.error("Failed to load encryption keys:", error);
  }
}

/**
 * Mengenkripsi password menggunakan custom Vigenere
 */
function encryptPassword(password) {
  return customEncryption.encrypt(password);
}

/**
 * Mengenkripsi data menggunakan Vigenere
 */
function encryptData(data, key) {
  // Inisialisasi object enkripsi Vigenere kita
  const tempEncryption = new encryption(key);
  
  try {
    // Ubah objek menjadi string JSON
    const jsonString = JSON.stringify(data);
    // Encode string JSON menjadi Base64
    const base64String = btoa(jsonString);
    // Enkripsi string Base64 yang aman
    return tempEncryption.encrypt(base64String);
  } catch (e) {
    console.error("Encryption failed:", e);
    return null;
  }
}

/**
 * Mendekripsi data menggunakan Vigenere
 */
function decryptData(encryptedData, key) {
  // Inisialisasi object enkripsi Vigenere kita
  const tempEncryption = new encryption(key);

  try {
    // Dekripsi data untuk mendapatkan kembali string Base64
    const base64String = tempEncryption.decrypt(encryptedData);
    // Decode string Base64 untuk mendapatkan kembali string JSON
    const jsonString = atob(base64String);
    // Parse string JSON untuk mendapatkan kembali objek asli
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Decryption failed:", e);
    return null; 
  }
}

/**
 * Menyimpan data ke file JSON
 */
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

function saveToFile(newUser) {
  try {
    // Ambil data yang ada
    const existingData = loadFromFile();

    // Tambahkan pengguna baru ke data yang ada
    existingData.push(newUser);

    // Enkripsi dan simpan semua data
    const encryptedData = encryptData(
      existingData,
      encryptionKeys.fileStorageKey
    );
    localStorage.setItem("usersData", encryptedData);

    // simpan JSON
    const dataForFile = existingData.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      createdAt: user.createdAt,
    }));

    downloadJSON(dataForFile, "users.json");
    console.log("Data saved successfully");
  } catch (e) {
    console.error("Failed to save data:", e);
  }
}

/**
 * Memuat data dari file
 */
function loadFromFile() {
  try {
    const encryptedData = localStorage.getItem("usersData");
    if (encryptedData && encryptionKeys) {
      const data = decryptData(encryptedData, encryptionKeys.fileStorageKey);
      return data || [];
    }
    return [];
  } catch (e) {
    console.error("Failed to load data:", e);
    return [];
  }
}

/**
 * Inisialisasi aplikasi
 */
async function initializeApp() {
  console.log("Initializing Login Register System...");

  // Memuat kunci enkripsi terlebih dahulu
  await loadKeys();

  // Memuat user yang ada
  users = loadFromFile();
  console.log(`Loaded ${users.length} users from storage`);

  // Melakukan setup event listeners
  setupEventListeners();

  // Menunjukkan halaman login dengan default
  showPage("loginPage");

  console.log("Application initialized successfully");
}

/**
 * Menghasilkan 6 digit kode OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Mengirim OTP melalui email
 */
function sendOTP(email, otp) {
  // Inisialisasi EmailJS dengan Public Key Anda
  emailjs.init("LFq2jIxG6ezQpu-OQ"); // Ganti dengan public key Anda dari EmailJS

  const templateParams = {
    to_email: email,
    otp_code: otp,
    to_name: email.split("@")[0], // Menggunakan bagian sebelum @ sebagai nama
    message: `Kode OTP Anda adalah: ${otp}. Kode ini akan kedaluwarsa dalam 5 menit.`,
  };

  // Kirim email menggunakan EmailJS
  emailjs.send("service_ntk0kmb", "template_0e9ek24", templateParams).then(
    function (response) {
      console.log("Email berhasil dikirim:", response);
      showAlert(
        otpData?.type === "login" ? "loginAlert" : "registerAlert",
        "Kode OTP telah dikirim ke email Anda",
        "success"
      );
    },
    function (error) {
      console.error("Gagal mengirim email:", error);
      showAlert(
        otpData?.type === "login" ? "loginAlert" : "registerAlert",
        "Gagal mengirim OTP, silakan coba lagi",
        "danger"
      );
    }
  );
}

/**
 * Memvalidasi masa berlaku OTP
 */
function isOTPValid(timestamp) {
  const EXPIRY_TIME = 300000; // 5 menit dalam milidetik
  return Date.now() - timestamp <= EXPIRY_TIME;
}

/**
 * Menampilkan pesan peringatan
 */
function showAlert(containerId, message, type = "danger") {
  const alertContainer = document.getElementById(containerId);
  const iconClass =
    type === "success" ? "check-circle" : "exclamation-triangle";

  alertContainer.innerHTML = `
        <div class="alert alert-${type}">
            <i class="fas fa-${iconClass}"></i>
            ${message}
        </div>
    `;
}

/**
 * Menampilkan halaman tertentu dan menyembunyikan yang lain
 */
function showPage(pageId) {
  // Sembunyikan semua halaman
  document.querySelectorAll(".auth-container, .container").forEach((el) => {
    el.classList.add("hidden");
  });

  // Tampilkan halaman yang dipilih
  document.getElementById(pageId).classList.remove("hidden");
}

/**
 * Menghapus semua input form
 */
function clearForms() {
  document.querySelectorAll("form").forEach((form) => form.reset());
  document
    .querySelectorAll('[id$="Alert"]')
    .forEach((alert) => (alert.innerHTML = ""));
}

/**
 * Memvalidasi format email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Memvalidasi kekuatan password
 */
function isValidPassword(password) {
  // Minimal 6 karakter, harus ada huruf kapital di awal, dan harus ada angka
  const passwordRegex = /^[A-Z].*\d+.*$/;
  return password.length >= 6 && passwordRegex.test(password);
}

/**
 * Memeriksa apakah pengguna ada
 */
function userExists(email) {
  return users.some((user) => user.email === email);
}

/**
 * Mencari pengguna berdasarkan email dan password
 */
function findUser(email, password) {
  return (
    users.find(
      (u) => u.email === email && u.password === encryptPassword(password)
    ) || null
  );
}

/**
 * Menangani register user
 */
function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Validasi
  if (!name) {
    showAlert("registerAlert", "Nama lengkap harus diisi!");
    return;
  }

  if (!isValidEmail(email)) {
    showAlert("registerAlert", "Format email tidak valid!");
    return;
  }

  if (!isValidPassword(password)) {
    showAlert(
      "registerAlert",
      "Password harus minimal 6 karakter, diawali huruf kapital, dan mengandung angka!"
    );
    return;
  }

  if (password !== confirmPassword) {
    showAlert("registerAlert", "Password tidak cocok!");
    return;
  }

  if (userExists(email)) {
    showAlert("registerAlert", "Email sudah terdaftar!");
    return;
  }

  // Buat user baru dengan password terenkripsi
  const newUser = {
    id: Date.now(),
    name: name,
    email: email,
    password: encryptPassword(password),
    createdAt: new Date().toISOString(),
  };

  // Simpan user baru
  saveToFile(newUser);
  currentUser = newUser;

  // Memuat ulang data pengguna
  users = loadFromFile();

  showAlert("registerAlert", "Registrasi berhasil!", "success");
  setTimeout(() => {
    showPage("loginPage");
  }, 1500);
}

/**
 * Menangani login user
 */
function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  // Validasi
  if (!isValidEmail(email)) {
    showAlert("loginAlert", "Format email tidak valid!");
    return;
  }

  const user = findUser(email, password);

  if (!user) {
    showAlert("loginAlert", "Email atau password salah!");
    return;
  }

  // Generate OTP untuk verifikasi login
  const otp = generateOTP();
  otpData = {
    type: "login",
    user,
    otp,
    timestamp: Date.now(),
  };

  sendOTP(email, otp);
  showPage("otpPage");
}

/**
 * Menangani verifikasi OTP
 */
function handleOTPVerification(e) {
  e.preventDefault();

  const otpInputs = document.querySelectorAll(".otp-input");
  const enteredOTP = Array.from(otpInputs)
    .map((input) => input.value)
    .join("");

  // Periksa apakah data OTP ada dan valid
  if (!otpData || otpData.type !== "login") {
    showAlert("otpAlert", "Data OTP tidak ditemukan!");
    return;
  }

  if (!isOTPValid(otpData.timestamp)) {
    showAlert("otpAlert", "OTP telah kedaluwarsa!");
    return;
  }

  if (enteredOTP !== otpData.otp) {
    showAlert("otpAlert", "Kode OTP salah!");
    return;
  }

  // Login berhasil
  currentUser = otpData.user;
  showAlert("otpAlert", "Login berhasil!", "success");
  setTimeout(() => {
    document.getElementById(
      "welcomeUser"
    ).textContent = `Selamat Datang, ${currentUser.name}!`;
    showPage("dashboardPage");
  }, 1500);

  otpData = null;
}

/**
 * Menangani pengiriman ulang OTP
 */
function handleResendOTP() {
  if (!otpData) {
    showAlert("otpAlert", "Tidak ada data OTP untuk dikirim ulang!");
    return;
  }

  const newOTP = generateOTP();
  otpData.otp = newOTP;
  otpData.timestamp = Date.now();

  const email =
    otpData.type === "register" ? otpData.email : otpData.user.email;
  sendOTP(email, newOTP);
  showAlert("otpAlert", "OTP baru telah dikirim!", "success");
}

/**
 * Menangani logout pengguna
 */
function handleLogout() {
  currentUser = null;
  otpData = null;
  clearForms();
  showPage("loginPage");
  console.log("Pengguna berhasil logout");
}

/**
 * Menangani navigasi input OTP
 */
function setupOTPNavigation() {
  const otpInputs = document.querySelectorAll(".otp-input");

  otpInputs.forEach((input, index) => {
    // Pindah ke input berikutnya saat digit dimasukkan
    input.addEventListener("input", function () {
      // Hanya izinkan angka
      this.value = this.value.replace(/[^0-9]/g, "");

      if (this.value.length === 1 && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    // Pindah ke input sebelumnya saat backspace
    input.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && this.value === "" && index > 0) {
        otpInputs[index - 1].focus();
      }
    });

    // Pindah ke input saat fokus
    input.addEventListener("focus", function () {
      this.select();
    });

    // Mencegah paste konten non-numerik
    input.addEventListener("paste", function (e) {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData("text");
      const numbers = paste.replace(/[^0-9]/g, "");

      if (numbers.length > 0) {
        // Isi input OTP dengan angka yang ditempel
        for (
          let i = 0;
          i < Math.min(numbers.length, otpInputs.length - index);
          i++
        ) {
          if (otpInputs[index + i]) {
            otpInputs[index + i].value = numbers[i];
          }
        }

        // Pindah ke input berikutnya
        const nextIndex = Math.min(
          index + numbers.length,
          otpInputs.length - 1
        );
        otpInputs[nextIndex].focus();
      }
    });
  });
}

/**
 * Menghapus semua input OTP
 */
function clearOTPInputs() {
  document.querySelectorAll(".otp-input").forEach((input) => {
    input.value = "";
  });
  document.querySelector(".otp-input").focus();
}

/**
 * Menangani pengaturan semua event listener
 */
function setupEventListeners() {
  // Navigasi antara login dan register
  document
    .getElementById("showRegister")
    .addEventListener("click", function (e) {
      e.preventDefault();
      clearForms;
      showPage("registerPage");
      isLogin = false;
    });

  document.getElementById("showLogin").addEventListener("click", function (e) {
    e.preventDefault();
    clearForms();
    showPage("loginPage");
    isLogin = true;
  });

  document.getElementById("backToAuth").addEventListener("click", function (e) {
    e.preventDefault();
    clearForms();
    showPage(isLogin ? "loginPage" : "registerPage");
    clearOTPInputs();
  });

  // Form submissions
  document
    .getElementById("registerForm")
    .addEventListener("submit", handleRegister);
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document
    .getElementById("otpForm")
    .addEventListener("submit", handleOTPVerification);

  // Tema
  const themeToggle = document.getElementById("themeToggle");
  const icon = themeToggle.querySelector("i");

  // Periksa preferensi tema yang disimpan atau default ke 'light'
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  icon.className = savedTheme === "dark" ? "fas fa-sun" : "fas fa-moon";

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);

    // Update icon
    icon.className = newTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
  });

  // Resend OTP
  document.getElementById("resendOTP").addEventListener("click", function (e) {
    e.preventDefault();
    handleResendOTP();
  });

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);

  // Melakukan setup navigasi OTP
  setupOTPNavigation();
}

/**
 * Format tanggal untuk ditampilkan
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Mendapatkan statistik pengguna
 */
function getUserStats() {
  return {
    totalUsers: users.length,
    currentUser: currentUser ? currentUser.name : null,
    lastLogin: currentUser ? formatDate(currentUser.createdAt) : null,
  };
}

/**
 * Men-debug state aplikasi
 */
function debugState() {
  console.log("=== DEBUG STATE ===");
  console.log("Users:", users);
  console.log("Current User:", currentUser);
  console.log("OTP Data:", otpData);
  console.log("Is Login Mode:", isLogin);
  console.log("==================");
}

// Membuat fungsi debug tersedia secara global untuk pengembangan
window.debugState = debugState;

// Mulai aplikasi saat DOM sepenuhnya dimuat
document.addEventListener("DOMContentLoaded", initializeApp);

// Menangani perubahan visibilitas halaman (opsional)
document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    console.log("Page hidden - pausing timers");
  } else {
    console.log("Page visible - resuming timers");
  }
});

// Menangani event beforeunload
window.addEventListener("beforeunload", function (e) {
  if (currentUser) {
    console.log("User session will be cleared on page reload");
  }
});
