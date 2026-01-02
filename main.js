// --- Global Variables ---
// RENDER_API_BASE_URL: Aapka Backend URL
const RENDER_API_BASE_URL = "https://gemi-backend.onrender.com"; 

// Session ID logic (Same as before)
let currentSessionId = localStorage.getItem('sessionId');
if (!currentSessionId) {
    currentSessionId = 'session_' + Date.now() + Math.floor(Math.random() * 100000);
    localStorage.setItem('sessionId', currentSessionId);
}

// ====== DOM Elements (Same as before) ======
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const messages = document.getElementById("messages");
const chatBox = document.getElementById("chatBox");
const themeSwitch = document.getElementById("themeSwitch");
const wallpaperBtn = document.getElementById("wallpaperBtn");
const wallpaperMenu = document.getElementById("wallpaperMenu");
const uploadWallpaper = document.getElementById("uploadWallpaper");
const menuToggle = document.getElementById("menuToggle");
const menuPanel = document.getElementById("menuPanel");


// ====== Send Message Logic (Same as before) ======
sendBtn.onclick = sendMessage;
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;
  appendMessage(text, "user"); 
  userInput.value = ""; 
  userInput.focus(); 
  
  gemiReply(text); // Backend Call
}

// ====== Message Append (Thoda update kiya images ke liye) ======
function appendMessage(content, sender, isImage = false) {
  const div = document.createElement("div");
  // Classes wahi hain jo aapne di thin
  div.className = sender === 'user' ? "sent msg" : "received msg"; 
  
  if (isImage) {
    // Agar image hai to HTML set karo
    div.innerHTML = content;
    div.style.background = "transparent"; // Image ke piche background hataya
    div.style.padding = "0";
  } else {
    // Agar text hai to text set karo
    div.textContent = content; 
  }
  
  messages.appendChild(div);
  scrollToBottom();
  return div;
}

// ====== Gemi Reply: MAIN LOGIC (Yahan Naya Feature Joda Hai) ======
async function gemiReply(userMessage) {
  
  // 1. Check: User Image mang raha hai ya Text?
  const lowerMsg = userMessage.toLowerCase();
  let apiEndpoint = `${RENDER_API_BASE_URL}/api/chat`; // Default: Chat
  let isImageRequest = false;

  // Agar user ne 'draw' ya 'generate image' likha hai
  if (lowerMsg.includes("draw") || lowerMsg.includes("generate image") || lowerMsg.includes("create image")) {
      isImageRequest = true;
      apiEndpoint = `${RENDER_API_BASE_URL}/api/generate-image`;
  }
    
  // 2. Typing indicator (Wahi purana wala)
  const typing = document.createElement("div");
  typing.className = "received msg"; 
  typing.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
  messages.appendChild(typing);
  scrollToBottom();

  try {
      // Prompt ko saaf karna (Agar image hai)
      let finalPrompt = userMessage;
      if (isImageRequest) {
          finalPrompt = userMessage.replace(/draw|generate image of|create image of/gi, "").trim();
      }

      // 3. API Call
      const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
              prompt: finalPrompt,  // NOTE: Yahan 'message' ki jagah 'prompt' bheja hai taki Python backend samjh sake
              sessionId: currentSessionId 
          })
      });

      const data = await response.json();
      
      // Typing hatao
      typing.remove();

      if (response.ok) {
          if (isImageRequest && data.imageUrl) {
             // === IMAGE AAYI HAI ===
             const imgHTML = `
                <div class="ai-image-container" style="border-radius:10px; overflow:hidden;">
                    <img src="${data.imageUrl}" style="width:100%; display:block;" alt="Generated Art">
                    <a href="${data.imageUrl}" download="art.jpg" style="display:block; background:#007AFF; color:white; text-align:center; padding:8px; text-decoration:none; font-size:14px;">Download Image</a>
                </div>
             `;
             appendMessage(imgHTML, "bot", true);

          } else {
             // === TEXT AAYA HAI ===
             // (data.reply) aapke naye backend se aa raha hai
             typeWriter(data.reply || data.text, "bot");
          }
      } else {
          typeWriter(`Error: ${data.error || "Server issue"}`, "bot");
      }

  } catch (error) {
      typing.remove();
      typeWriter(`Network Error: ${error.message}. Check console.`, "bot");
  }
}


// ====== Type Writer (Markdown Formatter Joda Hai) ======
function typeWriter(text, sender) {
  const div = document.createElement("div");
  div.className = sender === 'user' ? "sent msg" : "received msg"; 
  messages.appendChild(div);
  
  let i = 0;
  // Speed 35ms se 20ms kar di thodi fast typing ke liye
  const interval = setInterval(() => {
    // Jab tak type ho raha hai, plain text dikhao
    div.textContent = text.slice(0, i++);
    scrollToBottom();
    
    if (i > text.length) {
        clearInterval(interval);
        // === TYPING KHATAM HONE PAR FORMATTING LAGA DO ===
        // Ye **bold** ko <b>bold</b> me badal dega
        div.innerHTML = parseSimpleMarkdown(text);
    }
  }, 20);
}

// === Chota sa function Text ko sundar banane ke liye ===
function parseSimpleMarkdown(text) {
    if(!text) return "";
    return text
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')   // Bold
        .replace(/\*(.*?)\*/g, '<i>$1</i>')       // Italic
        .replace(/```([\s\S]*?)```/g, '<pre style="background:#222; color:#0f0; padding:10px; border-radius:5px; overflow-x:auto;">$1</pre>') // Code Block
        .replace(/\n/g, '<br>');                  // New lines
}


// ====== Scroll Always to Bottom (Same) ======
function scrollToBottom() {
  messages.scrollTop = messages.scrollHeight;
}

// ====== Theme, Wallpaper, Menu Logic (Bilkul Waisa Hi) ======
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

userInput.addEventListener("focus", () => {
  setTimeout(() => {
    scrollToBottom();
    const form = document.querySelector(".chat-input-form"); // Agar class alag hai to check kar lena
    if(form) form.scrollIntoView({ behavior: "smooth", block: "end" });
  }, 300);
});

window.visualViewport?.addEventListener("resize", () => {
  scrollToBottom();
});

userInput.focus();
