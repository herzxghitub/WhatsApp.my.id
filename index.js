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
let globalChatActive = false;
let globalOnlineUsers = [];
let botActive = false;
let botTyping = false;

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
const globalChatHeader = document.getElementById('globalChatHeader');
const globalOnlineCount = document.getElementById('globalOnlineCount');
const backFromGlobal = document.getElementById('backFromGlobal');
const globalInfoBtn = document.getElementById('globalInfoBtn');

// ==================== FUNGSI UTILITAS ====================

async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'Unknown';
    }
}

function showModal(title, message, isHTML = false) {
    document.getElementById('modalTitle').textContent = title;
    if (isHTML) {
        document.getElementById('modalMessage').innerHTML = message;
    } else {
        document.getElementById('modalMessage').textContent = message;
    }
    document.getElementById('notificationModal').classList.remove('hidden');
}

// ==================== FIX LOGIN AKUN Taher ====================

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showModal('Error', 'Username dan password harus diisi');
        return;
    }
    
    try {
        // Cek khusus untuk akun Taher (owner)
        if (username === 'Taher' && password === 'owner') {
            // Cek apakah akun Taher sudah ada di database
            const taherSnapshot = await database.ref('users').orderByChild('username').equalTo('Taher').once('value');
            
            if (!taherSnapshot.exists()) {
                // Buat akun Taher jika belum ada
                const userIP = await getUserIP();
                const newUserRef = database.ref('users').push();
                const userId = newUserRef.key;
                
                const userData = {
                    id: userId,
                    username: 'Taher',
                    password: 'owner',
                    online: true,
                    banned: false,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    ipAddress: userIP,
                    avatar: null,
                    isOwner: true
                };
                
                await newUserRef.set(userData);
                
                currentUser = {
                    id: userId,
                    username: 'Taher',
                    isOwner: true
                };
                
                showModal('Success', 'Akun Owner Taher berhasil dibuat! ✅');
            } else {
                // Akun Taher sudah ada, cek password
                const userData = Object.values(taherSnapshot.val())[0];
                
                if (userData.password !== password) {
                    showModal('Error', 'Password salah untuk akun Taher');
                    return;
                }
                
                currentUser = {
                    id: userData.id,
                    username: userData.username,
                    isOwner: true
                };
            }
        } else {
            // Login untuk user biasa
            const userRef = database.ref('users');
            const snapshot = await userRef.orderByChild('username').equalTo(username).once('value');
            
            if (!snapshot.exists()) {
                showModal('Error', 'Username tidak ditemukan');
                return;
            }
            
            const userData = Object.values(snapshot.val())[0];
            
            if (userData.password !== password) {
                showModal('Error', 'Password salah');
                return;
            }
            
            if (userData.banned) {
                localStorage.setItem('whatsappLite_bannedUser', JSON.stringify(userData));
                showBannedPage(userData);
                return;
            }
            
            currentUser = {
                id: userData.id,
                username: userData.username,
                isOwner: false
            };
        }
        
        // Update status online di database
        await database.ref(`users/${currentUser.id}`).update({
            online: true,
            lastLogin: new Date().toISOString()
        });
        
        setupOnlineStatus(currentUser.id);
        localStorage.setItem('whatsappLite_currentUser', JSON.stringify(currentUser));
        showChatPage();
        
        if (currentUser.isOwner) {
            ownerBtn.classList.remove('hidden');
            setupOwnerPanel();
        }
        
        initGlobalChat();
        initBotAI();
        loadContacts();
        
    } catch (error) {
        console.error('Login error:', error);
        showModal('Error', 'Terjadi kesalahan saat login');
    }
});

// ==================== BOT AI WHATSAPP ====================

function initBotAI() {
    if (!currentUser) return;
    
    // Tambahkan bot ke daftar kontak
    const botContact = document.createElement('div');
    botContact.className = 'contact-item bot-chat-item';
    botContact.id = 'botContact';
    botContact.innerHTML = `
        <div class="contact-avatar bot-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="contact-info">
            <h4>🤖 Taher AI Assistant <span class="bot-badge">BOT</span></h4>
            <p>Tanya apa saja ke AI</p>
        </div>
        <div class="online-indicator" style="background: #25d366"></div>
    `;
    
    botContact.addEventListener('click', openBotChat);
    contactsList.appendChild(botContact);
}

function openBotChat() {
    botActive = true;
    chatPlaceholder.classList.add('hidden');
    
    // Buat header khusus bot
    const botHeaderHTML = `
        <div class="contact-back">
            <button id="backFromBot"><i class="fas fa-arrow-left"></i></button>
        </div>
        <div class="contact-info-chat">
            <div class="contact-avatar-chat bot-avatar-chat">
                <i class="fas fa-robot"></i>
            </div>
            <div>
                <h4>🤖 Taher AI Assistant</h4>
                <p id="botStatus">Online - Mengetik...</p>
            </div>
        </div>
    `;
    
    // Update UI untuk chat bot
    messagesList.innerHTML = '';
    chatHeader.innerHTML = botHeaderHTML;
    chatHeader.classList.remove('hidden');
    messagesContainer.classList.remove('hidden');
    messageInputContainer.classList.remove('hidden');
    
    // Event listener untuk kembali
    document.getElementById('backFromBot').addEventListener('click', () => {
        botActive = false;
        chatHeader.classList.add('hidden');
        chatPlaceholder.classList.remove('hidden');
        messagesContainer.classList.add('hidden');
        messageInputContainer.classList.add('hidden');
    });
    
    // Update placeholder
    messageInput.placeholder = "Tanya apa saja ke AI...";
    
    // Kirim welcome message
    setTimeout(() => {
        addBotMessage("Halo! Saya Taher AI Assistant 🤖\n\nSaya bisa membantu Anda dengan:\n• Informasi umum\n• Jawaban pertanyaan\n• Rekomendasi\n• Percakapan santai\n\nApa yang bisa saya bantu?");
    }, 500);
    
    // Simulasi bot sedang online
    document.getElementById('botStatus').textContent = 'Online';
}

function addBotMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message received bot-message';
    
    messageDiv.innerHTML = `
        <div class="message-sender">🤖 Taher AI</div>
        <div class="message-text">${text.replace(/\n/g, '<br>')}</div>
        <div class="message-info">
            <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
    `;
    
    messagesList.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function simulateBotTyping() {
    if (!botTyping) {
        botTyping = true;
        const botStatus = document.getElementById('botStatus');
        if (botStatus) botStatus.textContent = 'Online - Mengetik...';
        
        setTimeout(() => {
            if (botStatus) botStatus.textContent = 'Online';
            botTyping = false;
        }, 1500);
    }
}

async function processBotMessage(userMessage) {
    simulateBotTyping();
    
    // Simpan pesan user
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'message sent';
    userMessageDiv.innerHTML = `
        <div class="message-text">${userMessage}</div>
        <div class="message-info">
            <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span><i class="fas fa-check-double"></i></span>
        </div>
    `;
    messagesList.appendChild(userMessageDiv);
    
    // Delay untuk simulasi bot berpikir
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Response AI sederhana
    const responses = {
        halo: ["Halo juga! Ada yang bisa saya bantu?", "Hai! Senang berbicara dengan Anda!", "Halo! Bagaimana kabar Anda hari ini?"],
        nama: ["Saya Taher AI Assistant, asisten virtual yang siap membantu Anda!", "Nama saya Taher AI, teman virtual Anda di WhatsApp Lite!"],
        kabar: ["Saya baik-baik saja, selalu siap membantu Anda!", "Sangat baik! Terima kasih sudah bertanya. Ada yang bisa saya bantu?"],
        bantuan: ["Saya bisa membantu dengan:\n• Jawaban pertanyaan umum\n• Rekomendasi\n• Percakapan santai\n• Informasi\n\nCoba tanyakan sesuatu!"],
        terimakasih: ["Sama-sama! Senang bisa membantu 😊", "Terima kasih kembali! Jangan ragu untuk bertanya lagi!"],
        bye: ["Sampai jumpa! Jangan lupa kembali ya 👋", "Selamat tinggal! Semoga hari Anda menyenangkan!"],
        fitur: ["WhatsApp Lite memiliki fitur:\n• Chat pribadi\n• Chat Global\n• Bot AI (saya!)\n• Sistem banned\n• Upload foto\n• Owner control panel"],
        owner: ["Fitur owner hanya untuk akun Taher dengan password: owner\n\nFitur:\n• Lihat user online\n• Ban/unban user\n• Lihat appeals"],
        default: ["Menarik pertanyaannya! Bisa jelaskan lebih detail?", "Saya masih dalam tahap pengembangan. Coba tanyakan hal lain!", "Maaf, saya belum paham maksud Anda. Coba tanyakan tentang fitur aplikasi ini!"]
    };
    
    const lowerMsg = userMessage.toLowerCase();
    let response = responses.default[0];
    
    if (lowerMsg.includes('halo') || lowerMsg.includes('hi')) response = responses.halo[Math.floor(Math.random() * responses.halo.length)];
    else if (lowerMsg.includes('nama')) response = responses.nama[Math.floor(Math.random() * responses.nama.length)];
    else if (lowerMsg.includes('kabar')) response = responses.kabar[Math.floor(Math.random() * responses.kabar.length)];
    else if (lowerMsg.includes('bantu')) response = responses.bantuan[0];
    else if (lowerMsg.includes('makasih') || lowerMsg.includes('terima kasih')) response = responses.terimakasih[Math.floor(Math.random() * responses.terimakasih.length)];
    else if (lowerMsg.includes('bye') || lowerMsg.includes('dadah')) response = responses.bye[Math.floor(Math.random() * responses.bye.length)];
    else if (lowerMsg.includes('fitur')) response = responses.fitur[0];
    else if (lowerMsg.includes('owner')) response = responses.owner[0];
    
    addBotMessage(response);
}

// ==================== GLOBAL CHAT FIX ====================

function initGlobalChat() {
    console.log('Initializing Global Chat...');
    
    // Cek apakah sudah ada
    if (document.getElementById('globalChatContact')) return;
    
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
        <div class="online-indicator" id="globalOnlineIndicator" style="display: none"></div>
    `;
    
    globalContactItem.addEventListener('click', openGlobalChat);
    if (contactsList.firstChild) {
        contactsList.insertBefore(globalContactItem, contactsList.firstChild);
    } else {
        contactsList.appendChild(globalContactItem);
    }
    
    // Setup listeners
    backFromGlobal.addEventListener('click', closeGlobalChat);
    globalInfoBtn.addEventListener('click', showGlobalInfo);
    setupGlobalChatRealtime();
}

function setupGlobalChatRealtime() {
    const globalMessagesRef = database.ref('global_messages');
    const globalUsersRef = database.ref('global_online_users');
    
    globalMessagesRef.limitToLast(50).on('value', (snapshot) => {
        if (globalChatActive) updateGlobalChat(snapshot.val());
    });
    
    globalUsersRef.on('value', (snapshot) => {
        const users = snapshot.val() || {};
        globalOnlineUsers = Object.keys(users);
        updateGlobalOnlineCount();
        
        const indicator = document.getElementById('globalOnlineIndicator');
        if (indicator) indicator.style.display = globalOnlineUsers.length > 0 ? 'block' : 'none';
    });
}

function updateGlobalOnlineCount() {
    const count = globalOnlineUsers.length;
    globalOnlineCount.textContent = `${count} online`;
    
    const indicator = document.getElementById('globalOnlineIndicator');
    if (indicator) {
        indicator.style.display = count > 0 ? 'block' : 'none';
        indicator.title = `${count} users online`;
    }
}

function openGlobalChat() {
    globalChatActive = true;
    botActive = false;
    
    chatPlaceholder.classList.add('hidden');
    globalChatHeader.classList.remove('hidden');
    messagesContainer.classList.remove('hidden');
    messageInputContainer.classList.remove('hidden');
    chatHeader.classList.add('hidden');
    
    messageInput.placeholder = "Ketik pesan ke CHAT GLOBAL...";
    
    // Join global chat
    if (currentUser) {
        database.ref(`global_online_users/${currentUser.id}`).set({
            username: currentUser.username,
            joined: new Date().toISOString()
        });
        
        database.ref(`global_online_users/${currentUser.id}`).onDisconnect().remove();
        
        database.ref('global_messages').push().set({
            type: 'notification',
            message: `${currentUser.username} joined the global chat`,
            timestamp: new Date().toISOString()
        });
    }
    
    loadGlobalMessages();
}

function closeGlobalChat() {
    globalChatActive = false;
    
    globalChatHeader.classList.add('hidden');
    chatPlaceholder.classList.remove('hidden');
    messagesContainer.classList.add('hidden');
    messageInputContainer.classList.add('hidden');
    
    messageInput.placeholder = "Ketik pesan...";
    
    if (currentUser) {
        database.ref(`global_online_users/${currentUser.id}`).remove();
        database.ref('global_messages').push().set({
            type: 'notification',
            message: `${currentUser.username} left the global chat`,
            timestamp: new Date().toISOString()
        });
    }
}

function loadGlobalMessages() {
    messagesList.innerHTML = '';
    database.ref('global_messages').limitToLast(50).once('value')
        .then((snapshot) => updateGlobalChat(snapshot.val()));
}

function updateGlobalChat(messages) {
    if (!messages || !globalChatActive) return;
    
    messagesList.innerHTML = '';
    Object.values(messages).forEach(msg => {
        if (msg.type === 'notification') {
            const notificationDiv = document.createElement('div');
            notificationDiv.className = 'global-notification';
            notificationDiv.textContent = msg.message;
            messagesList.appendChild(notificationDiv);
        } else {
            const isSent = msg.userId === currentUser?.id;
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
            
            messageDiv.innerHTML = `
                ${!isSent ? `<div class="message-sender">${msg.username}</div>` : ''}
                <div class="message-text">${msg.text}</div>
                <div class="message-info">
                    <span>${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    ${isSent ? '<span><i class="fas fa-check-double"></i></span>' : ''}
                </div>
            `;
            messagesList.appendChild(messageDiv);
        }
    });
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendGlobalMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentUser) return;
    
    database.ref('global_messages').push().set({
        userId: currentUser.id,
        username: currentUser.username,
        text: text,
        timestamp: new Date().toISOString()
    });
    
    messageInput.value = '';
}

// ==================== OVERRIDE SEND MESSAGE ====================

const originalSendMessage = sendMessage;
sendMessage = function() {
    if (botActive) {
        const text = messageInput.value.trim();
        if (!text) return;
        
        processBotMessage(text);
        messageInput.value = '';
    } else if (globalChatActive) {
        sendGlobalMessage();
    } else {
        originalSendMessage();
    }
};

// ==================== SETUP CHAT LISTENERS ====================

function setupChatListeners() {
    sendMessageBtn.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    backToContacts.addEventListener('click', () => {
        chatPlaceholder.classList.remove('hidden');
        chatHeader.classList.add('hidden');
        messagesContainer.classList.add('hidden');
        messageInputContainer.classList.add('hidden');
        currentChatUser = null;
        botActive = false;
        globalChatActive = false;
    });
}

// ==================== FUNGSI LAINNYA (Tetap sama) ====================

// [Fungsi-fungsi lainnya seperti registerForm, showBannedPage, setupOnlineStatus, loadContacts, openChat, loadMessages, addMessageToUI, menu dropdown, owner panel, upload avatar, clear storage TETAP SAMA seperti sebelumnya]

// ==================== INITIALIZATION ====================

document.getElementById('closeModalBtn').addEventListener('click', () => {
    document.getElementById('notificationModal').classList.add('hidden');
});

document.getElementById('modalOkBtn').addEventListener('click', () => {
    document.getElementById('notificationModal').classList.add('hidden');
});

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

// Auto login
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
        
        // Inisialisasi fitur
        initGlobalChat();
        initBotAI();
        
        if (currentUser.isOwner) {
            ownerBtn.classList.remove('hidden');
            setupOwnerPanel();
        }
        
        loadContacts();
    }
});