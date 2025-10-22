// public/script.js

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. INITIALIZATION & DOM ELEMENTS ---

    const socket = io(); // Socket.IO connection shuru karna

    // Saare zaroori HTML elements ko select karna
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const messagesContainer = document.getElementById('chat-messages-container');
    const sendButton = document.querySelector('.send-btn');

    // --- 2. SOCKET.IO EVENT LISTENERS ---

    // Server se naye message aane par
    socket.on('new message', (msg) => {
        // Typing indicator ko hatana
        removeTypingIndicator();
        // Bot ka message screen par dikhana
        appendMessage(msg);
        // Form ko phir se enable karna
        setFormEnabled(true);
    });

    // Server se bot ke typing status aane par
    socket.on('bot typing', () => {
        showTypingIndicator();
    });
    
    // Connection successful hone par
    socket.on('connect', () => {
        console.log('Successfully connected to the server!');
    });

    // Connection tootne par
    socket.on('disconnect', () => {
        console.warn('Disconnected from the server.');
    });


    // --- 3. UI EVENT LISTENERS ---

    // Message form submit hone par
    messageForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const messageText = messageInput.value.trim();

        if (messageText) {
            // User ka message turant UI me dikhana (instant feedback)
            const userMessage = {
                text: messageText,
                sender: 'You',
                type: 'text'
            };
            appendMessage(userMessage);

            // Message ko server par bhejna
            socket.emit('user message', messageText);

            // Input field khali karna aur form disable karna
            messageInput.value = '';
            setFormEnabled(false);
        }
    });


    // --- 4. HELPER FUNCTIONS (DOM Manipulation & UI) ---

    /**
     * Naya message UI me add karta hai.
     * @param {object} msg - Message object { text, sender, type, data }
     */
    function appendMessage(msg) {
        const { text, sender, type, data } = msg;
        const messageTypeClass = (sender === 'You') ? 'sent' : 'received';

        // Message ka HTML structure banana
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', messageTypeClass);
        
        let messageContentHTML = '';
        
        // Image message ke liye alag HTML
        if (type === 'image' && data) {
            messageContentHTML = `
                <p>${text}</p>
                <img src="${data}" alt="Generated Image" style="max-width: 100%; border-radius: 10px; margin-top: 8px;">
            `;
        } else {
            messageContentHTML = text;
        }

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            ${sender !== 'You' ? `<div class="sender-name">${sender}</div>` : ''}
            <div class="message-bubble">${messageContentHTML}</div>
            <span class="timestamp">${timestamp}</span>
        `;

        messagesContainer.appendChild(messageElement);
        scrollToBottom();
    }
    
    /** Bot ke liye typing indicator dikhata hai */
    function showTypingIndicator() {
        // Agar pehle se hai to dobara na banaye
        if (document.querySelector('.typing-indicator')) return;

        const indicatorElement = document.createElement('div');
        indicatorElement.classList.add('message', 'received', 'typing-indicator');
        indicatorElement.innerHTML = `
            <div class="sender-name">Gemibot</div>
            <div class="message-bubble">
                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
        `;
        messagesContainer.appendChild(indicatorElement);
        scrollToBottom();
    }

    /** Typing indicator ko hatata hai */
    function removeTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /** Chat window ko hamesha neeche scroll karke rakhta hai */
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /** Form input aur button ko enable/disable karta hai */
    function setFormEnabled(isEnabled) {
        messageInput.disabled = !isEnabled;
        sendButton.disabled = !isEnabled;
        if (isEnabled) {
            messageInput.focus();
        }
    }
    
    // Shuru me window ko scroll karke neeche rakhein
    scrollToBottom();
});
