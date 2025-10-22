// public/script.js

// DOM elements ko select karna
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('chat-messages-container');

// Form submit hone par event listener
messageForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Page reload hone se rokna
    const userInput = messageInput.value.trim();

    if (userInput === '') return; // Agar input khali hai to kuchh na karein

    // User ka message turant UI me dikhana
    appendMessage(userInput, 'sent');
    messageInput.value = ''; // Input field clear karna
    scrollToBottom();

    // Loading indicator dikhana
    appendLoadingIndicator();

    try {
        // Backend ko request bhejna
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userInput }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const botData = await response.json();
        
        // Loading indicator hatana
        removeLoadingIndicator();
        
        // Backend se aaye response ko UI me dikhana
        appendMessage(botData.reply, 'received', botData.type, botData.data);

    } catch (error) {
        console.error('Error:', error);
        removeLoadingIndicator();
        appendMessage("Sorry, I couldn't connect. Please try again.", 'received', 'error');
    }
});

/**
 * Naya message UI me add karne wala function
 * @param {string} text - Message ka content
 * @param {string} type - 'sent' ya 'received'
 * @param {string} [dataType='text'] - 'text', 'image', ya 'error'
 * @param {string} [dataUrl=''] - Image ka URL
 */
function appendMessage(text, type, dataType = 'text', dataUrl = '') {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', type);

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('message-bubble');

    if (dataType === 'image' && dataUrl) {
        // Image ke liye content
        const p = document.createElement('p');
        p.textContent = text;
        const img = document.createElement('img');
        img.src = dataUrl;
        img.alt = 'Generated Image';
        img.style.maxWidth = '100%';
        img.style.borderRadius = '10px';
        img.style.marginTop = '8px';
        bubbleDiv.appendChild(p);
        bubbleDiv.appendChild(img);
    } else {
        // Normal text ke liye
        bubbleDiv.textContent = text;
    }

    const timestampSpan = document.createElement('span');
    timestampSpan.classList.add('timestamp');
    const now = new Date();
    timestampSpan.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    messageDiv.appendChild(bubbleDiv);
    messageDiv.appendChild(timestampSpan);
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

/** Loading indicator add karne wala function */
function appendLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('message', 'received', 'loading-indicator');
    loadingDiv.innerHTML = `
        <div class="message-bubble">
            <span>.</span><span>.</span><span>.</span>
        </div>
    `;
    messagesContainer.appendChild(loadingDiv);
    scrollToBottom();
}

/** Loading indicator hatane wala function */
function removeLoadingIndicator() {
    const indicator = document.querySelector('.loading-indicator');
    if (indicator) {
        indicator.remove();
    }
}

/** Chat ko neeche scroll karne wala function */
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Initial scroll to bottom
window.onload = scrollToBottom;
