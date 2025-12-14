document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');

  // This will hold the conversation history
  const conversation = [];

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userMessage = userInput.value.trim();
    if (!userMessage) {
      return;
    }

    // Add user message to conversation and display it
    // Note: The backend expects 'content', but we'll use 'text' for consistency with the Gemini API response structure.
    // We will map it to the correct format before sending.
    conversation.push({ role: 'user', content: userMessage });
    appendMessage('user', userMessage);

    // Clear the input and show thinking indicator
    userInput.value = '';
    const thinkingMessageElement = appendMessage('bot', 'Thinking...');

    try {
      // The backend expects a 'conversation' array with objects having 'role' and 'content'.
      // Your current backend seems to only process the last message.
      // For a stateful chat, you would send the whole `conversation` array.
      const payload = {
        conversation: [{ role: 'user', content: userMessage }],
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Try to get a more specific error from the server's JSON response
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to get response from server.');
      }

      const data = await response.json();

      if (data.result) {
        // Add AI response to conversation and update the UI
        conversation.push({ role: 'model', content: data.result });
        thinkingMessageElement.textContent = data.result;
      } else {
        thinkingMessageElement.textContent = 'Sorry, no response received.';
      }
    } catch (error) {
      console.error('Error:', error);
      thinkingMessageElement.textContent = error.message;
      thinkingMessageElement.parentElement.classList.add('error'); // Optional: for styling errors
    }
  });

  /**
   * Adds a message to the chat box UI.
   * @param {string} sender - 'user' or 'bot'.
   * @param {string} content - The message content.
   * @returns {HTMLElement} The created paragraph element holding the message text.
   */
  function appendMessage(sender, content) {
    const messageElement = document.createElement('div');
    // Use the class names from your style.css
    messageElement.classList.add('message', sender);

    const messageContent = document.createElement('p');
    messageContent.textContent = content;

    messageElement.appendChild(messageContent);
    chatBox.appendChild(messageElement);

    // Scroll to the bottom of the chat box
    chatBox.scrollTop = chatBox.scrollHeight;

    return messageContent; // Return the <p> element for easy text updates
  }
});
