// --- Global Variables ---
// RENDER_API_BASE_URL: Aapka Backend URL
const RENDER_API_BASE_URL = "https://gemi-backend.onrender.com"; 

// Session ID generate karna
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
// Menu & Theme Elements
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
  
  // User ka message dikhayein
  appendMessage(text, "user"); 
  userInput.value = ""; 
  userInput.focus(); 
  
  // Backend function call karein
  gemiReply(text); 
}

// ====== Message Append Helper ======
// Ab ye HTML support karega (images ke liye)
function appendMessage(content, sender, isImage = false) {
  const div = document.createElement("div");
  div.className = sender === 'user' ? "sent msg" : "received msg"; 
  
  if (isImage) {
      div.innerHTML = content; // Image HTML sidha dalenge
      div.classList.add("image-msg"); // CSS styling ke liye
  } else {
      div.textContent = content; // Text safety ke liye
  }
  
  messages.appendChild(div);
  scrollToBottom();
  return div; // Div return kar rahe hain taki baad me edit kar sakein
}

// ====== MAIN AI LOGIC (Chat + Image) ======
async function gemiReply(userMessage) {
  
  // 1. Determine Endpoint (Chat ya Image?)
  const lowerMsg = userMessage.toLowerCase();
  let apiEndpoint = `${RENDER_API_BASE_URL}/api/chat`; // Default: Text Chat
  let isImageRequest = false;

  // Agar user image maang raha hai
  if (lowerMsg.includes("draw") || lowerMsg.includes("generate image") || lowerMsg.includes("create image") || lowerMsg.startsWith("image of")) {
      isImageRequest = true;
      apiEndpoint = `${RENDER_API_BASE_URL}/api/generate-image`;
  }

  // 2. Typing Indicator dikhayein
  const typingDiv = document.createElement("div");
  typingDiv.className = "received msg typing-anim";
  typingDiv.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
  messages.appendChild(typingDiv);
  scrollToBottom();

  try {
      // 3. Prompt Clean karna (Sirf Image ke liye)
      // "Draw a cat" -> "a cat" (Taaki AI confuse na ho)
      let finalPrompt = userMessage;
      if (isImageRequest) {
          finalPrompt = userMessage.replace(/draw|generate image of|create image of|make an image of/gi, "").trim();
      }

      // 4. API Call
      const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              prompt: finalPrompt, // Backend "prompt" expect karta hai
              sessionId: currentSessionId
          })
      });

      const data = await response.json();
      
      // Typing hatayein
      typingDiv.remove();

      if (response.ok) {
          if (isImageRequest && data.imageUrl) {
              // --- IMAGE HANDLING ---
              const imgHTML = `
                <div class="ai-image-container">
                    <img src="${data.imageUrl}" alt="Generated Art" onload="scrollToBottom()">
                    <a href="${data.imageUrl}" download="gemi-art.jpg" class="download-btn">Download HD</a>
                </div>
              `;
              appendMessage(imgHTML, "bot", true);
          } else {
              // --- TEXT HANDLING (Rich Text) ---
              // Typewriter effect ke sath formatting
              typeWriterWithFormatting(data.reply || data.text, "bot");
          }
      } else {
          appendMessage(`Error: ${data.error || "Kuch gadbad ho gayi."}`, "bot");
      }

  } catch (error) {
      typingDiv.remove();
      appendMessage(`Network Error: Server se connect nahi ho pa raha. (Shayad Server Sleep mode me hai, 1 min baad try karein).`, "bot");
      console.error(error);
  }
}

// ====== Smart Typewriter (Markdown Support) ======
function typeWriterWithFormatting(text, sender) {
    const div = document.createElement("div");
    div.className = "received msg";
    messages.appendChild(div);

    let i = 0;
    // Speed thoda tez kiya hai (20ms) taki boring na lage
    const interval = setInterval(() => {
        // Hum plain text type karenge pehle
        div.textContent = text.slice(0, i++);
        scrollToBottom();

        if (i > text.length) {
            clearInterval(interval);
            // JAB TYPING KHATAM HO JAYE -> FORMATTING APPLY KAREIN
            // Ye function text ko HTML me badal dega (Bold, Code, etc.)
            div.innerHTML = parseMarkdown(text); 
        }
    }, 20);
}

// ====== Markdown Parser (Text ko sundar banane ke liye) ======
function parseMarkdown(text) {
    if (!text) return "";
    return text
        // Bold: **text** -> <b>text</b>
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        // Italic: *text* -> <i>text</i>
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        // Code Block: ```code``` -> <pre>code</pre>
        .replace(/```([\s\S]*?)```/g, '<div class="code-block"><pre>$1</pre></div>')
        // Inline Code: `text` -> <code>text</code>
        .replace(/`(.*?)`/g, '<code>$1</code>')
        // New Lines: \n -> <br>
        .replace(/\n/g, '<br>');
}

// ====== Scroll Helper ======
function scrollToBottom() {
  messages.scrollTop = messages.scrollHeight;
}

// ====== Theme & Menu Logic (Purana Code) ======
themeSwitch.onclick = () => { document.body.classList.toggle("light"); };

wallpaperBtn.onclick = () => {
  wallpaperMenu.style.display = wallpaperMenu.style.display === "flex" ? "none" : "flex";
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

// Mobile Keyboard Adjustments
userInput.addEventListener("focus", () => {
  setTimeout(() => {
    scrollToBottom();
    // Scroll view adjustment
    if(document.querySelector(".chat-input-form")) {
        document.querySelector(".chat-input-form").scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, 300);
});
