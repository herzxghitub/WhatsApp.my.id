// Inisialisasi Firebase dengan konfigurasi Anda
const firebaseConfig = {
    apiKey: "AIzaSyAlMyO9iybb7Zc3-JWpaJTOU6mp7dVZw7A",
    authDomain: "taher-online.firebaseapp.com",
    databaseURL: "https://taher-online-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "taher-online",
    storageBucket: "taher-online.firebasestorage.app",
    messagingSenderId: "254196950669",
    appId: "1:254196950669:web:ea7dc25e29e459e791e4c4",
    measurementId: "G-W288VV18S2"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const storage = firebase.storage();

// Variabel Global
let currentUser = null;
let currentChatUser = null;
let bannedWords = ["Udin", "Adam", "HAER", "Nisa", "tut", "Tuti", "Haer"];


// DOM Elements
const authPage = document.getElementById('authPage');
const chatPage = document.getElementById('chatPage');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const bannedPage = document.getElementById('bannedPage');
const ownerPanel = document.getElementById('ownerPanel');
const profilePanel = document.getElementById('profilePanel');
const settingsPanel = document.getElementById('settingsPanel');
const menuBtn = document.getElementById('menuBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
const ownerBtn = document.getElementById('ownerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const profileBtn = document.getElementById('profileBtn');
const settingsBtn = document.getElementById('settingsBtn');
const closeOwnerBtn = document.getElementById('closeOwnerBtn');
const closeProfileBtn = document.getElementById('closeProfileBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const contactsList = document.getElementById('contactsList');
const messagesList = document.getElementById('messagesList');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const backToContacts = document.getElementById('backToContacts');
const chatHeader = document.getElementById('chatHeader');
const chatPlaceholder = document.getElementById('chatPlaceholder');
const messagesContainer = document.getElementById('messagesContainer');
const messageInputContainer = document.getElementById('messageInputContainer');
const currentUsername = document.getElementById('currentUsername');
const appealMessage = document.getElementById('appealMessage');
const sendAppealBtn = document.getElementById('sendAppealBtn');
const bannedUsersList = document.getElementById('bannedUsersList');
const appealsList = document.getElementById('appealsList');
const onlineUsersList = document.getElementById('onlineUsersList');
const changeAvatarBtn = document.getElementById('changeAvatarBtn');
const avatarInput = document.getElementById('avatarInput');
const clearStorageBtn = document.getElementById('clearStorageBtn');

// Fungsi untuk mendapatkan IP pengguna
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error getting IP:', error);
        return 'Unknown';
    }
}

// Fungsi untuk menampilkan modal notifikasi
function showModal(title, message) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('notificationModal').classList.remove('hidden');
}

// Event listener untuk modal
document.getElementById('closeModalBtn').addEventListener('click', () => {
    document.getElementById('notificationModal').classList.add('hidden');
});

document.getElementById('modalOkBtn').addEventListener('click', () => {
    document.getElementById('notificationModal').classList.add('hidden');
});

// Tab Auth
loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
});

registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
});

// Event Listener untuk Form Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showModal('Error', 'Username dan password harus diisi');
        return;
    }
    
    try {
        // Cek user di database
        const userRef = database.ref('users');
        const snapshot = await userRef.orderByChild('username').equalTo(username).once('value');
        
        if (!snapshot.exists()) {
            showModal('Error', 'Username tidak ditemukan');
            return;
        }
        
        const userData = Object.values(snapshot.val())[0];
        
        // Verifikasi password
        if (userData.password !== password) {
            showModal('Error', 'Password salah');
            return;
        }
        
        // Cek apakah user dibanned
        if (userData.banned) {
            // Simpan user ke localStorage untuk akses di banned page
            localStorage.setItem('whatsappLite_bannedUser', JSON.stringify(userData));
            showBannedPage(userData);
            return;
        }
        
        // Login berhasil
        currentUser = {
            id: userData.id,
            username: userData.username,
            isOwner: username === 'Taher' && password === 'owner'
        };
        
        // Update status online
        await database.ref(`users/${userData.id}`).update({
            online: true,
            lastLogin: new Date().toISOString()
        });
        
        // Set online status listener
        setupOnlineStatus(userData.id);
        
        // Simpan ke localStorage
        localStorage.setItem('whatsappLite_currentUser', JSON.stringify(currentUser));
        
        // Tampilkan halaman chat
        showChatPage();
        
        // Jika owner, tampilkan fitur owner
        if (currentUser.isOwner) {
            ownerBtn.classList.remove('hidden');
            setupOwnerPanel();
        }
        
        // Load kontak
        loadContacts();
        
    } catch (error) {
        console.error('Login error:', error);
        showModal('Error', 'Terjadi kesalahan saat login');
    }
});

// Event Listener untuk Form Registrasi
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!username || !password) {
        showModal('Error', 'Username dan password harus diisi');
        return;
    }
    
    if (password !== confirmPassword) {
        showModal('Error', 'Password tidak cocok');
        return;
    }
    
    if (password.length < 4) {
        showModal('Error', 'Password minimal 4 karakter');
        return;
    }
    
    // Cek kata terlarang
    const hasBannedWord = bannedWords.some(word => 
        username.toLowerCase().includes(word.toLowerCase())
    );
    
    if (hasBannedWord) {
        showModal('Error', 'USERNAME MENGANDUNG KATA KASAR❌');
        return;
    }
    
    try {
        // Cek apakah username sudah ada
        const userRef = database.ref('users');
        const snapshot = await userRef.orderByChild('username').equalTo(username).once('value');
        
        if (snapshot.exists()) {
            showModal('Error', 'Username sudah digunakan');
            return;
        }
        
        // Dapatkan IP
        const userIP = await getUserIP();
        
        // Buat user baru
        const newUserRef = database.ref('users').push();
        const userId = newUserRef.key;
        
        const userData = {
            id: userId,
            username: username,
            password: password,
            online: true,
            banned: false,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            ipAddress: userIP,
            avatar: null
        };
        
        await newUserRef.set(userData);
        
        // Login otomatis setelah registrasi
        currentUser = {
            id: userId,
            username: username,
            isOwner: username === 'Taher' && password === 'owner'
        };
        
        // Simpan ke localStorage
        localStorage.setItem('whatsappLite_currentUser', JSON.stringify(currentUser));
        
        // Setup online status
        setupOnlineStatus(userId);
        
        // Tampilkan halaman chat
        showChatPage();
        
        // Load kontak
        loadContacts();
        
        showModal('Success', 'Akun berhasil dibuat!✅');
        
    } catch (error) {
        console.error('Registration error:', error);
        showModal('Error', 'Terjadi kesalahan saat membuat akun');
    }
});

// Fungsi untuk menampilkan halaman banned
function showBannedPage(userData) {
    authPage.classList.add('hidden');
    chatPage.classList.remove('hidden');
    bannedPage.classList.remove('hidden');
    
    document.getElementById('bannedReason').textContent = 
        `Alasan: Username mengandung kata terlarang`;
}

// Event Listener untuk kirim appeal
sendAppealBtn.addEventListener('click', async () => {
    const message = appealMessage.value.trim();
    
    if (!message) {
        showModal('Error', 'Silakan ketik pesan banding');
        return;
    }
    
    try {
        const bannedUser = JSON.parse(localStorage.getItem('whatsappLite_bannedUser'));
        
        // Kirim appeal ke database
        const appealRef = database.ref('appeals').push();
        await appealRef.set({
            userId: bannedUser.id,
            username: bannedUser.username,
            message: message,
            timestamp: new Date().toISOString(),
            status: 'pending'
        });
        
        showModal('Success', 'Pesan banding telah dikirim ke admin');
        appealMessage.value = '';
        
    } catch (error) {
        console.error('Error sending appeal:', error);
        showModal('Error', 'Gagal mengirim pesan banding');
    }
});

// Fungsi untuk menampilkan halaman chat
function showChatPage() {
    authPage.classList.add('hidden');
    chatPage.classList.remove('hidden');
    bannedPage.classList.add('hidden');
    
    // Tampilkan username
    currentUsername.textContent = currentUser.username;
    
    // Setup event listeners untuk chat
    setupChatListeners();
}

// Fungsi untuk setup status online
function setupOnlineStatus(userId) {
    // Update status online
    database.ref(`users/${userId}`).update({
        online: true
    });
    
    // Setup onDisconnect untuk status offline
    database.ref(`users/${userId}/online`).onDisconnect().set(false);
}

// Fungsi untuk load kontak
async function loadContacts() {
    try {
        const usersRef = database.ref('users');
        
        // Listen untuk perubahan data user
        usersRef.on('value', (snapshot) => {
            contactsList.innerHTML = '';
            const users = snapshot.val();
            
            if (!users) return;
            
            Object.values(users).forEach(user => {
                // Jangan tampilkan user yang sama atau yang banned
                if (user.id === currentUser.id || user.banned) return;
                
                // Tampilkan hanya yang online atau punya chat history
                const contactItem = document.createElement('div');
                contactItem.className = 'contact-item';
                contactItem.dataset.userId = user.id;
                
                // Cek apakah ada chat history dengan user ini
                const hasChatHistory = localStorage.getItem(`chat_${currentUser.id}_${user.id}`) || 
                                      localStorage.getItem(`chat_${user.id}_${currentUser.id}`);
                
                if (user.online || hasChatHistory) {
                    contactItem.innerHTML = `
                        <div class="contact-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="contact-info">
                            <h4>${user.username}</h4>
                            <p>${user.online ? 'Online' : 'Offline'}</p>
                        </div>
                        ${user.online ? '<div class="online-indicator"></div>' : ''}
                    `;
                    
                    contactItem.addEventListener('click', () => openChat(user));
                    contactsList.appendChild(contactItem);
                }
            });
        });
        
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

// Fungsi untuk buka chat dengan user
function openChat(user) {
    currentChatUser = user;
    
    // Update UI
    document.getElementById('chatContactName').textContent = user.username;
    document.getElementById('chatContactStatus').textContent = user.online ? 'online' : 'offline';
    
    // Tampilkan area chat
    chatPlaceholder.classList.add('hidden');
    chatHeader.classList.remove('hidden');
    messagesContainer.classList.remove('hidden');
    messageInputContainer.classList.remove('hidden');
    
    // Load pesan
    loadMessages(user.id);
}

// Fungsi untuk load pesan
function loadMessages(targetUserId) {
    messagesList.innerHTML = '';
    
    // Cek di localStorage untuk pesan sementara
    const chatKey1 = `chat_${currentUser.id}_${targetUserId}`;
    const chatKey2 = `chat_${targetUserId}_${currentUser.id}`;
    
    const savedMessages = localStorage.getItem(chatKey1) || localStorage.getItem(chatKey2);
    
    if (savedMessages) {
        const messages = JSON.parse(savedMessages);
        messages.forEach(msg => {
            addMessageToUI(msg, msg.senderId === currentUser.id);
        });
    }
    
    // Scroll ke bawah
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Fungsi untuk menambah pesan ke UI
function addMessageToUI(message, isSent) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    
    const time = new Date(message.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
        ${!isSent ? `<div class="message-sender">${message.senderName}</div>` : ''}
        <div class="message-text">${message.text}</div>
        <div class="message-info">
            <span>${time}</span>
            ${isSent ? '<span><i class="fas fa-check-double"></i></span>' : ''}
        </div>
    `;
    
    messagesList.appendChild(messageDiv);
    
    // Scroll ke bawah
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Setup chat listeners
function setupChatListeners() {
    // Kirim pesan
    sendMessageBtn.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Kembali ke daftar kontak
    backToContacts.addEventListener('click', () => {
        chatPlaceholder.classList.remove('hidden');
        chatHeader.classList.add('hidden');
        messagesContainer.classList.add('hidden');
        messageInputContainer.classList.add('hidden');
        currentChatUser = null;
    });
}

// Fungsi untuk kirim pesan
function sendMessage() {
    const text = messageInput.value.trim();
    
    if (!text || !currentChatUser) return;
    
    const message = {
        senderId: currentUser.id,
        senderName: currentUser.username,
        receiverId: currentChatUser.id,
        text: text,
        timestamp: new Date().toISOString()
    };
    
    // Tambah ke UI
    addMessageToUI(message, true);
    
    // Simpan ke localStorage (sementara)
    const chatKey = `chat_${currentUser.id}_${currentChatUser.id}`;
    const savedMessages = localStorage.getItem(chatKey);
    const messages = savedMessages ? JSON.parse(savedMessages) : [];
    messages.push(message);
    localStorage.setItem(chatKey, JSON.stringify(messages));
    
    // Kirim ke Firebase (untuk realtime sync)
    database.ref('messages').push().set({
        ...message,
        read: false
    });
    
    // Kosongkan input
    messageInput.value = '';
}

// Menu Dropdown
menuBtn.addEventListener('click', () => {
    dropdownMenu.classList.toggle('show');
});

// Tutup dropdown saat klik di luar
document.addEventListener('click', (e) => {
    if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove('show');
    }
});

// Profile Button
profileBtn.addEventListener('click', () => {
    dropdownMenu.classList.remove('show');
    profilePanel.classList.remove('hidden');
    
    // Isi data profil
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileJoined').textContent = new Date().toLocaleDateString('id-ID');
});

// Settings Button
settingsBtn.addEventListener('click', () => {
    dropdownMenu.classList.remove('show');
    settingsPanel.classList.remove('hidden');
});

// Owner Button
ownerBtn.addEventListener('click', () => {
    dropdownMenu.classList.remove('show');
    ownerPanel.classList.remove('hidden');
});

// Close buttons
closeOwnerBtn.addEventListener('click', () => {
    ownerPanel.classList.add('hidden');
});

closeProfileBtn.addEventListener('click', () => {
    profilePanel.classList.add('hidden');
});

closeSettingsBtn.addEventListener('click', () => {
    settingsPanel.classList.add('hidden');
});

// Logout
logoutBtn.addEventListener('click', async () => {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        // Update status offline
        if (currentUser) {
            await database.ref(`users/${currentUser.id}`).update({
                online: false
            });
        }
        
        // Clear localStorage
        localStorage.removeItem('whatsappLite_currentUser');
        
        // Clear loading flag untuk tampilkan loading lagi
        if (typeof window.clearLoadingFlag === 'function') {
            window.clearLoadingFlag();
        }
        
        // Redirect ke index.html
        window.location.href = 'index.html';
    }
});

// Setup Owner Panel
async function setupOwnerPanel() {
    // Load banned users
    database.ref('users').orderByChild('banned').equalTo(true).on('value', (snapshot) => {
        bannedUsersList.innerHTML = '';
        const users = snapshot.val();
        
        if (!users) {
            bannedUsersList.innerHTML = '<p>Tidak ada pengguna yang diblokir</p>';
            return;
        }
        
        Object.values(users).forEach(user => {
            const bannedUserDiv = document.createElement('div');
            bannedUserDiv.className = 'banned-user';
            bannedUserDiv.innerHTML = `
                <div>
                    <strong>${user.username}</strong><br>
                    <small>${user.ipAddress || 'IP tidak tersedia'}</small>
                </div>
                <div class="user-actions">
                    <button class="unban-btn" data-userid="${user.id}">Buka Ban</button>
                </div>
            `;
            
            bannedUsersList.appendChild(bannedUserDiv);
        });
        
        // Add event listeners untuk unban buttons
        document.querySelectorAll('.unban-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = e.target.dataset.userid;
                await database.ref(`users/${userId}`).update({
                    banned: false
                });
                showModal('Success', 'User berhasil di-unban');
            });
        });
    });
    
    // Load appeals
    database.ref('appeals').on('value', (snapshot) => {
        appealsList.innerHTML = '';
        const appeals = snapshot.val();
        
        if (!appeals) {
            appealsList.innerHTML = '<p>Tidak ada pesan banding</p>';
            return;
        }
        
        Object.entries(appeals).forEach(([key, appeal]) => {
            const appealDiv = document.createElement('div');
            appealDiv.className = 'appeal-item';
            appealDiv.innerHTML = `
                <div>
                    <strong>${appeal.username}</strong><br>
                    <small>${new Date(appeal.timestamp).toLocaleString('id-ID')}</small><br>
                    <p>${appeal.message}</p>
                </div>
                <div class="user-actions">
                    <button class="unban-btn" data-userid="${appeal.userId}" data-appealid="${key}">Unban</button>
                    <button class="delete-appeal-btn" data-appealid="${key}">Hapus</button>
                </div>
            `;
            
            appealsList.appendChild(appealDiv);
        });
        
        // Add event listeners
        document.querySelectorAll('.unban-btn[data-appealid]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = e.target.dataset.userid;
                const appealId = e.target.dataset.appealid;
                
                await Promise.all([
                    database.ref(`users/${userId}`).update({ banned: false }),
                    database.ref(`appeals/${appealId}`).remove()
                ]);
                
                showModal('Success', 'User berhasil di-unban dan appeal dihapus');
            });
        });
        
        document.querySelectorAll('.delete-appeal-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const appealId = e.target.dataset.appealid;
                await database.ref(`appeals/${appealId}`).remove();
                showModal('Success', 'Appeal berhasil dihapus');
            });
        });
    });
    
    // Load online users
    database.ref('users').orderByChild('online').equalTo(true).on('value', (snapshot) => {
        onlineUsersList.innerHTML = '';
        const users = snapshot.val();
        
        if (!users) {
            onlineUsersList.innerHTML = '<p>Tidak ada pengguna online</p>';
            return;
        }
        
        Object.values(users).forEach(user => {
            if (user.id === currentUser.id) return;
            
            const onlineUserDiv = document.createElement('div');
            onlineUserDiv.className = 'online-user';
            onlineUserDiv.innerHTML = `
                <div>
                    <strong>${user.username}</strong><br>
                    <small>IP: ${user.ipAddress || 'Tidak tersedia'}</small>
                </div>
                <div class="user-actions">
                    <button class="unban-btn" data-userid="${user.id}">Ban</button>
                </div>
            `;
            
            onlineUsersList.appendChild(onlineUserDiv);
        });
        
        // Add event listeners untuk ban buttons
        document.querySelectorAll('.unban-btn[data-userid]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = e.target.dataset.userid;
                await database.ref(`users/${userId}`).update({
                    banned: true
                });
                showModal('Success', 'User berhasil di-ban');
            });
        });
    });
    
    // Load owner info
    const ownerSnapshot = await database.ref('users').orderByChild('username').equalTo('Taher').once('value');
    if (ownerSnapshot.exists()) {
        const ownerData = Object.values(ownerSnapshot.val())[0];
        document.getElementById('ownerIP').textContent = ownerData.ipAddress || 'Tidak tersedia';
        document.getElementById('ownerFirstLogin').textContent = 
            new Date(ownerData.createdAt).toLocaleString('id-ID');
    }
}

// Upload avatar
changeAvatarBtn.addEventListener('click', () => {
    avatarInput.click();
});

avatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showModal('Error', 'File harus berupa gambar');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showModal('Error', 'Ukuran gambar maksimal 5MB');
        return;
    }
    
    try {
        // Upload ke Firebase Storage
        const storageRef = storage.ref(`avatars/${currentUser.id}`);
        await storageRef.put(file);
        const downloadURL = await storageRef.getDownloadURL();
        
        // Update di database
        await database.ref(`users/${currentUser.id}`).update({
            avatar: downloadURL
        });
        
        // Update preview
        const avatarPreview = document.getElementById('avatarPreview');
        avatarPreview.innerHTML = `<img src="${downloadURL}" alt="Avatar">`;
        
        showModal('Success', 'Foto profil berhasil diubah');
        
    } catch (error) {
        console.error('Error uploading avatar:', error);
        showModal('Error', 'Gagal mengupload foto profil');
    }
});

// Clear storage
clearStorageBtn.addEventListener('click', () => {
    if (confirm('Hapus semua data lokal? Chat akan hilang tapi akun tetap aman.')) {
        // Hapus semua data chat dari localStorage
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('chat_')) {
                localStorage.removeItem(key);
            }
        });
        
        showModal('Success', 'Data lokal berhasil dihapus');
    }
});

// Auto login jika ada session
window.addEventListener('load', async () => {
    const savedUser = localStorage.getItem('whatsappLite_currentUser');
    
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        
        // Cek apakah user dibanned
        const userSnapshot = await database.ref(`users/${currentUser.id}`).once('value');
        const userData = userSnapshot.val();
        
        if (userData && userData.banned) {
            localStorage.setItem('whatsappLite_bannedUser', JSON.stringify(userData));
            showBannedPage(userData);
            return;
        }
        
        // Update status online
        if (userData) {
            await database.ref(`users/${currentUser.id}`).update({
                online: true,
                lastLogin: new Date().toISOString()
            });
            
            setupOnlineStatus(currentUser.id);
        }
        
        showChatPage();
        
        // Jika owner, tampilkan fitur owner
        if (currentUser.isOwner) {
            ownerBtn.classList.remove('hidden');
            setupOwnerPanel();
        }
        
        loadContacts();
    }
});

// ==================== GLOBAL CHAT FUNGSIONALITAS ====================

// Variabel global chat
let globalChatActive = false;
let globalOnlineUsers = [];
let globalMessagesRef = null;
let globalUsersRef = null;

// DOM Elements untuk global chat
const globalChatHeader = document.getElementById('globalChatHeader');
const globalOnlineCount = document.getElementById('globalOnlineCount');
const backFromGlobal = document.getElementById('backFromGlobal');
const globalInfoBtn = document.getElementById('globalInfoBtn');

// Fungsi untuk inisialisasi global chat
function initGlobalChat() {
    // Tambahkan item global chat ke contacts list
    const globalContactItem = document.createElement('div');
    globalContactItem.className = 'contact-item global-chat-item';
    globalContactItem.id = 'globalChatContact';
    globalContactItem.innerHTML = `
        <div class="contact-avatar">
            <i class="fas fa-globe"></i>
        </div>
        <div class="contact-info">
            <h4>CHAT GLOBAL || PUBLIC ROOM🎟️ <span class="global-badge">PUBLIC</span></h4>
            <p>Chat dengan semua pengguna online</p>
        </div>
        <div class="online-indicator" id="globalOnlineIndicator"></div>
    `;
    
    globalContactItem.addEventListener('click', openGlobalChat);
    contactsList.insertBefore(globalContactItem, contactsList.firstChild);
    
    // Setup event listeners
    backFromGlobal.addEventListener('click', closeGlobalChat);
    globalInfoBtn.addEventListener('click', showGlobalInfo);
    
    // Setup realtime database listeners
    setupGlobalChatRealtime();
}

// Setup realtime global chat
function setupGlobalChatRealtime() {
    // Reference untuk global messages
    globalMessagesRef = database.ref('global_messages');
    globalUsersRef = database.ref('global_online_users');
    
    // Listen untuk messages
    globalMessagesRef.limitToLast(50).on('value', (snapshot) => {
        if (globalChatActive) {
            updateGlobalChat(snapshot.val());
        }
    });
    
    // Listen untuk online users
    globalUsersRef.on('value', (snapshot) => {
        const users = snapshot.val() || {};
        globalOnlineUsers = Object.keys(users);
        updateGlobalOnlineCount();
        
        // Update indicator
        const indicator = document.getElementById('globalOnlineIndicator');
        if (indicator) {
            indicator.style.display = globalOnlineUsers.length > 0 ? 'block' : 'none';
        }
    });
}

// Update online count
function updateGlobalOnlineCount() {
    const count = globalOnlineUsers.length;
    globalOnlineCount.textContent = `${count} online`;
    
    // Update di contact list juga
    const indicator = document.getElementById('globalOnlineIndicator');
    if (indicator) {
        indicator.style.display = count > 0 ? 'block' : 'none';
        indicator.title = `${count} users online`;
    }
}

// Buka global chat
function openGlobalChat() {
    globalChatActive = true;
    
    // Update UI
    chatPlaceholder.classList.add('hidden');
    globalChatHeader.classList.remove('hidden');
    messagesContainer.classList.remove('hidden');
    messageInputContainer.classList.remove('hidden');
    chatHeader.classList.add('hidden');
    
    // Update title
    document.getElementById('messageInput').placeholder = "Ketik pesan ke CHAT GLOBAL...";
    
    // Join global chat
    joinGlobalChat();
    
    // Load messages
    loadGlobalMessages();
}

// Tutup global chat
function closeGlobalChat() {
    globalChatActive = false;
    
    // Update UI
    globalChatHeader.classList.add('hidden');
    chatPlaceholder.classList.remove('hidden');
    messagesContainer.classList.add('hidden');
    messageInputContainer.classList.add('hidden');
    
    // Reset placeholder
    document.getElementById('messageInput').placeholder = "Ketik pesan...";
    
    // Leave global chat
    leaveGlobalChat();
}

// Join global chat
function joinGlobalChat() {
    if (!currentUser) return;
    
    // Update online status di global
    database.ref(`global_online_users/${currentUser.id}`).set({
        username: currentUser.username,
        joined: new Date().toISOString()
    });
    
    // Set disconnect handler
    database.ref(`global_online_users/${currentUser.id}`).onDisconnect().remove();
    
    // Post join notification
    const notificationRef = database.ref('global_messages').push();
    notificationRef.set({
        type: 'notification',
        message: `${currentUser.username} joined the global chat`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id
    });
}

// Leave global chat
function leaveGlobalChat() {
    if (!currentUser) return;
    
    // Remove from online users
    database.ref(`global_online_users/${currentUser.id}`).remove();
    
    // Post leave notification
    const notificationRef = database.ref('global_messages').push();
    notificationRef.set({
        type: 'notification',
        message: `${currentUser.username} left the global chat`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id
    });
}

// Load global messages
function loadGlobalMessages() {
    messagesList.innerHTML = '';
    
    database.ref('global_messages').limitToLast(50).once('value')
        .then((snapshot) => {
            updateGlobalChat(snapshot.val());
        });
}

// Update global chat UI
function updateGlobalChat(messages) {
    if (!messages || !globalChatActive) return;
    
    messagesList.innerHTML = '';
    
    Object.values(messages).forEach(msg => {
        if (msg.type === 'notification') {
            // Notification message
            const notificationDiv = document.createElement('div');
            notificationDiv.className = `global-notification ${msg.message.includes('left') ? 'global-user-left' : 'global-user-joined'}`;
            notificationDiv.textContent = msg.message;
            messagesList.appendChild(notificationDiv);
        } else {
            // Normal message
            const isSent = msg.userId === currentUser.id;
            const messageDiv = document.createElement('div');
            messageDiv.className = `message global-message ${isSent ? 'sent' : 'received'}`;
            
            const time = new Date(msg.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            messageDiv.innerHTML = `
                ${!isSent ? `<div class="message-sender">${msg.username}</div>` : ''}
                <div class="message-text">${msg.text}</div>
                <div class="message-info">
                    <span>${time}</span>
                    ${isSent ? '<span><i class="fas fa-check-double"></i></span>' : ''}
                </div>
            `;
            
            messagesList.appendChild(messageDiv);
        }
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Kirim pesan ke global
function sendGlobalMessage() {
    const text = messageInput.value.trim();
    
    if (!text || !currentUser) return;
    
    const messageRef = database.ref('global_messages').push();
    messageRef.set({
        userId: currentUser.id,
        username: currentUser.username,
        text: text,
        timestamp: new Date().toISOString()
    });
    
    messageInput.value = '';
}

// Override send message function
const originalSendMessage = sendMessage;
sendMessage = function() {
    if (globalChatActive) {
        sendGlobalMessage();
    } else {
        originalSendMessage();
    }
};

// Show global chat info
function showGlobalInfo() {
    const modal = document.getElementById('notificationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    
    modalTitle.textContent = '📢 CHAT GLOBAL INFO';
    modalMessage.innerHTML = `
        <div class="global-rules-content">
            <h3><i class="fas fa-globe"></i> CHAT GLOBAL || PUBLIC ROOM🎟️</h3>
            <p><strong>Online Users:</strong> <span class="online-count">${globalOnlineUsers.length} <i class="fas fa-user-friends"></i></span></p>
            
            <h4><i class="fas fa-rules"></i> Rules:</h4>
            <ul>
                <li>Dilarang spam atau flood pesan</li>
                <li>Hormati semua pengguna</li>
                <li>Dilarang konten SARA atau pornografi</li>
                <li>Owner bisa ban user yang melanggar</li>
            </ul>
            
            <h4><i class="fas fa-info-circle"></i> Info:</h4>
            <p>• Chat ini permanen dan publik</p>
            <p>• Semua pesan tersimpan di database</p>
            <p>• User online: ${globalOnlineUsers.length} orang</p>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

// ==================== UPDATE RULES FIREBASE ====================

// Rules Firebase untuk global chat
const updatedFirebaseRules = {
  "rules": {
    "users": {
      ".read": true,
      ".write": true,
      ".indexOn": ["username", "online"]
    },
    "messages": {
      ".read": true,
      ".write": true
    },
    "appeals": {
      ".read": true,
      ".write": true
    },
    "global_messages": {
      ".read": true,
      ".write": true,
      ".indexOn": ["timestamp"]
    },
    "global_online_users": {
      ".read": true,
      ".write": true
    }
  }
};

// ==================== INITIALIZATION ====================

// Update window.onload untuk inisialisasi global chat
const originalWindowLoad = window.onload;
window.onload = function() {
    if (originalWindowLoad) originalWindowLoad();
    
    // Inisialisasi global chat jika user sudah login
    setTimeout(() => {
        if (currentUser) {
            initGlobalChat();
        }
    }, 1000);
};

// Update auto login untuk inisialisasi global chat
window.addEventListener('load', async () => {
    const savedUser = localStorage.getItem('whatsappLite_currentUser');
    
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        
        const userSnapshot = await database.ref(`users/${currentUser.id}`).once('value');
        const userData = userSnapshot.val();
        
        if (userData && userData.banned) {
            localStorage.setItem('whatsappLite_bannedUser', JSON.stringify(userData));
            showBannedPage(userData);
            return;
        }
        
        if (userData) {
            await database.ref(`users/${currentUser.id}`).update({
                online: true,
                lastLogin: new Date().toISOString()
            });
            
            setupOnlineStatus(currentUser.id);
        }
        
        showChatPage();
        
        // INI YANG PENTING: Inisialisasi global chat
        initGlobalChat();
        
        if (currentUser.isOwner) {
            ownerBtn.classList.remove('hidden');
            setupOwnerPanel();
        }
        
        loadContacts();
    }
});
