// --- Global Variables ---
// RENDER_API_BASE_URL: Aapka Live Backend URL
const RENDER_API_BASE_URL = "https://gemi-backend.onrender.com"; 

// Session ID logic (optional but good for tracking)
let currentSessionId = localStorage.getItem('sessionId');
if (!currentSessionId) {
    currentSessionId = 'session_' + Date.now() + Math.floor(Math.random() * 100000);
    localStorage.setItem('sessionId', currentSessionId);
}

// ====== DOM Elements ======
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const messages = document.getElementById("messages");
const chatBox = document.getElementById("chatBox");

// Theme & Wallpaper Elements
const themeSwitch = document.getElementById("themeSwitch");
const wallpaperBtn = document.getElementById("wallpaperBtn");
const wallpaperMenu = document.getElementById("wallpaperMenu");
const uploadWallpaper = document.getElementById("uploadWallpaper");
const menuToggle = document.getElementById("menuToggle");
const menuPanel = document.getElementById("menuPanel");


// ====== Send Message Logic ======
sendBtn.onclick = sendMessage;
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;
  
  // User ka message screen par dikhao
  appendMessage(text, "user"); 
  userInput.value = ""; 
  userInput.focus(); 
  
  // Backend ko call karo
  gemiReply(text); 
}

// ====== Message Append Helper ======
function appendMessage(text, sender) {
  const div = document.createElement("div");
  // Classes wahi hain jo aapke CSS me thin ('sent msg' aur 'received msg')
  div.className = sender === 'user' ? "sent msg" : "received msg"; 
  div.textContent = text; 
  messages.appendChild(div);
  scrollToBottom();
}

// ====== Main API Call Function ======
async function gemiReply(userMessage) {
    
  // 1. Typing indicator dikhao
  const typing = document.createElement("div");
  typing.className = "received msg"; 
  typing.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
  messages.appendChild(typing);
  scrollToBottom();

  try {
      // 2. Fetch Request bhejo (Original Endpoint: /api/chat)
      const response = await fetch(`${RENDER_API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          // IMPORTANT: Backend 'prompt' maangta hai, isliye hum 'prompt' bhej rahe hain
          body: JSON.stringify({ 
              prompt: userMessage 
          })
      });

      const data = await response.json();
      
      // 3. Typing indicator hatao
      typing.remove();

      if (response.ok) {
          // Success: Text ko typewriter effect me dikhao
          typeWriter(data.reply, "bot");
      } else {
          // Error: Server error message dikhao
          typeWriter(`Error: ${data.error || "Something went wrong"}`, "bot");
      }

  } catch (error) {
      typing.remove();
      typeWriter(`Network Error: Backend connect nahi ho raha.`, "bot");
      console.error(error);
  }
}

// ====== Type Writer Effect (Original) ======
function typeWriter(text, sender) {
  const div = document.createElement("div");
  div.className = sender === 'user' ? "sent msg" : "received msg"; 
  messages.appendChild(div);
  
  let i = 0;
  const interval = setInterval(() => {
    div.textContent = text.slice(0, i++);
    scrollToBottom();
    if (i > text.length) clearInterval(interval);
  }, 30); // Speed control
}

// ====== Scroll Helper ======
function scrollToBottom() {
  messages.scrollTop = messages.scrollHeight;
}

// ====== UI Interaction Logic (Theme, Menu, etc.) ======
themeSwitch.onclick = () => {
  document.body.classList.toggle("light");
};

wallpaperBtn.onclick = () => {
  wallpaperMenu.style.display =
    wallpaperMenu.style.display === "flex" ? "none" : "flex";
};

document.querySelectorAll(".wallpaper-menu img").forEach((img) => {
  img.onclick = () => {
    chatBox.style.backgroundImage = `url(${img.src})`;
    wallpaperMenu.style.display = "none";
  };
});

uploadWallpaper.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e2) => {
    chatBox.style.backgroundImage = `url(${e2.target.result})`;
  };
  reader.readAsDataURL(file);
  wallpaperMenu.style.display = "none";
};

menuToggle.addEventListener("click", () => {
  menuToggle.classList.toggle("active");
  menuPanel.classList.toggle("show");
  wallpaperMenu.style.display = "none"; 
});

document.addEventListener("click", (e) => {
  if (!menuPanel.contains(e.target) && !menuToggle.contains(e.target)) {
    menuPanel.classList.remove("show");
    menuToggle.classList.remove("active");
  }
});

// Mobile Keyboard Focus Fix
userInput.addEventListener("focus", () => {
  setTimeout(() => {
    scrollToBottom();
    const form = document.querySelector(".input-area"); 
    if(form) form.scrollIntoView({ behavior: "smooth", block: "end" });
  }, 300);
});

window.visualViewport?.addEventListener("resize", () => {
  scrollToBottom();
});

userInput.focus();
