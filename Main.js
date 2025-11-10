// ====== DOM Elements ======
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const messages = document.getElementById("messages");
const themeSwitch = document.getElementById("themeSwitch");
const chatBox = document.getElementById("chatBox");
const wallpaperBtn = document.getElementById("wallpaperBtn");
const wallpaperMenu = document.getElementById("wallpaperMenu");
const uploadWallpaper = document.getElementById("uploadWallpaper");
const menuToggle = document.getElementById("menuToggle");
const menuPanel = document.getElementById("menuPanel");

// ====== Send Message ======
sendBtn.onclick = sendMessage;
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;
  appendMessage(text, "user");
  userInput.value = "";
  gemiReply(text);
}

function appendMessage(text, sender) {
  const div = document.createElement("div");
  div.className = sender + " msg";
  div.textContent = text;
  messages.appendChild(div);
  scrollToBottom();
}

function gemiReply(text) {
  // Typing indicator
  const typing = document.createElement("div");
  typing.className = "bot msg";
  typing.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
  messages.appendChild(typing);
  scrollToBottom();

  // Simulate bot typing delay
  setTimeout(() => {
    typing.remove();
    typeWriter("Hmm... interesting! You said: " + text, "bot");
  }, 1500);
}

function typeWriter(text, sender) {
  const div = document.createElement("div");
  div.className = sender + " msg";
  messages.appendChild(div);
  let i = 0;
  const interval = setInterval(() => {
    div.textContent = text.slice(0, i++);
    scrollToBottom();
    if (i > text.length) clearInterval(interval);
  }, 35);
}

// ====== Scroll Always to Bottom ======
function scrollToBottom() {
  messages.scrollTop = messages.scrollHeight;
}

// ====== Theme Switch ======
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

// ====== Mobile Keyboard Behavior ======
userInput.addEventListener("focus", () => {
  setTimeout(() => {
    scrollToBottom();
    document.querySelector(".input-area").scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  }, 300);
});

// Prevent layout jump when keyboard hides
window.visualViewport?.addEventListener("resize", () => {
  scrollToBottom();
});
