
// --- Global Variables (Yahan Render URL dalna hai) ---
// RENDER_API_BASE_URL: Aapka live Render URL (Example: 'https://gemi-assistant.onrender.com')
const RENDER_API_BASE_URL = "https://gemi-backend.onrender.com";
// Session ID: Chat history ko maintain karne ke liye zaruri
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
// ... (Baaki DOM elements jo aapke HTML mein hain) ...
const themeSwitch = document.getElementById("themeSwitch");
const wallpaperBtn = document.getElementById("wallpaperBtn");
const wallpaperMenu = document.getElementById("wallpaperMenu");
const uploadWallpaper = document.getElementById("uploadWallpaper");
const menuToggle = document.getElementById("menuToggle");
const menuPanel = document.getElementById("menuPanel");
// ====== Send Message (Main Entry Point) ======
sendBtn.onclick = sendMessage;
userInput.addEventListener("keypress", (e) => {
if (e.key === "Enter") sendMessage();
});
function sendMessage() {
const text = userInput.value.trim();
if (!text) return;
appendMessage(text, "user"); // User ka message screen par dikhao
userInput.value = ""; // Input box khali karo
userInput.focus(); // Mobile keyboard ko active rakho
gemiReply(text); // Backend ko call karo
}
// ====== Message Append (No change) ======
function appendMessage(text, sender) {
const div = document.createElement("div");
// Yahan aapko className ko apne CSS ke hisaab se adjust karna padega
// Aapke CSS/HTML mein shayad 'user msg' ya 'received msg' class hogi
div.className = sender === 'user' ? "sent msg" : "received msg";
div.textContent = text;
messages.appendChild(div);
scrollToBottom();
}
// ====== Gemi Reply: Ab API Call karega ======
async function gemiReply(userMessage) {
if (!RENDER_API_BASE_URL.startsWith('http')) {
// Safety check agar URL dalna bhool gaye ho
typeWriter("ERROR: Render API URL set nahi hai! Please URL daalein.", "bot");
return;
}
// 1. Typing indicator
const typing = document.createElement("div");
typing.className = "bot msg"; // CSS mein 'bot msg' aur uske andar 'typing' class define karein
typing.innerHTML = <div class="typing"><span></span><span></span><span></span></div>;
messages.appendChild(typing);
scrollToBottom();
try {
// 2. API Call (Python Backend ko)
const response = await fetch(${RENDER_API_BASE_URL}/chat, {
method: 'POST',
headers: {
'Content-Type': 'application/json'
},
body: JSON.stringify({
message: userMessage,
sessionId: currentSessionId // Har request ke saath session ID bhej rahe hain
})
});
code
Code
// 3. Response ka data
  const data = await response.json();
  
  // 4. Typing indicator ko hatao
  typing.remove();

  if (response.ok) {
      // Success: Gemi ka jawab typeWriter se dikhao
      typeWriter(data.reply, "bot");
  } else {
      // Error: Error message dikhao
      typeWriter(`API Error: ${data.reply}`, "bot");
  }
} catch (error) {
// 4. Typing indicator ko hatao
typing.remove();
// Network ya CORS error
typeWriter(Network Error: Backend se baat nahi ho paayi. Error: ${error.message}, "bot");
}
}
// ====== Type Writer (No change - Ab asli jawab type karega) ======
function typeWriter(text, sender) {
const div = document.createElement("div");
// Yahan bhi CSS classes ko adjust karein
div.className = sender === 'user' ? "sent msg" : "received msg";
messages.appendChild(div);
let i = 0;
const interval = setInterval(() => {
div.textContent = text.slice(0, i++);
scrollToBottom();
if (i > text.length) clearInterval(interval);
}, 35);
}
// ====== Scroll Always to Bottom (No change) ======
function scrollToBottom() {
messages.scrollTop = messages.scrollHeight;
}
// ====== Theme Switch, Wallpaper, Menu Toggle (No change) ======
// ... (Aapka baki ka sara JavaScript code jaisa ka waisa rahega) ...
themeSwitch.onclick = () => {
document.body.classList.toggle("light");
};
// ====== Wallpaper Menu ======
wallpaperBtn.onclick = () => {
wallpaperMenu.style.display =
wallpaperMenu.style.display === "flex" ? "none" : "flex";
};
document.querySelectorAll(".wallpaper-menu img").forEach((img) => {
img.onclick = () => {
chatBox.style.backgroundImage = url(${img.src});
wallpaperMenu.style.display = "none";
};
});
uploadWallpaper.onchange = (e) => {
const file = e.target.files[0];
if (!file) return;
const reader = new FileReader();
reader.onload = (e2) => {
chatBox.style.backgroundImage = url(${e2.target.result});
};
reader.readAsDataURL(file);
wallpaperMenu.style.display = "none";
};
// ====== Hamburger Menu Toggle ======
menuToggle.addEventListener("click", () => {
menuToggle.classList.toggle("active");
menuPanel.classList.toggle("show");
wallpaperMenu.style.display = "none"; // close wallpaper menu if open
});
// ====== Close menu when clicking outside ======
document.addEventListener("click", (e) => {
if (!menuPanel.contains(e.target) && !menuToggle.contains(e.target)) {
menuPanel.classList.remove("show");
menuToggle.classList.remove("active");
}
});
// ====== Mobile Keyboard Behavior (No change) ======
userInput.addEventListener("focus", () => {
setTimeout(() => {
scrollToBottom();
document.querySelector(".chat-input-form").scrollIntoView({ // Input area ka parent
behavior: "smooth",
block: "end"
});
}, 300);
});
// Prevent layout jump when keyboard hides
window.visualViewport?.addEventListener("resize", () => {
scrollToBottom();
});
// Initial focus to trigger mobile keyboard on load
userInput.focus()
