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
        // Use innerHTML to correctly render newlines (\n) from the API response as <br> tags.
        thinkingMessageElement.innerHTML = simpleMarkdownToHtml(data.result);
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
    messageContent.innerHTML = content; // Use innerHTML to allow 'Thinking...' to be replaced by formatted HTML

    messageElement.appendChild(messageContent);
    chatBox.appendChild(messageElement);

    // Scroll to the bottom of the chat box
    chatBox.scrollTop = chatBox.scrollHeight;

    return messageContent; // Return the <p> element for easy text updates
  }

  /**
   * Converts a simple subset of Markdown to HTML.
   * - **bold** -> <strong>bold</strong>
   * - * list item -> <ul><li>list item</li></ul>
   * - 1. numbered item -> <ol><li>numbered item</li></ol>
   * - # Heading -> <h1>Heading</h1>
   * - Indented text -> nested <ul><li>
   * @param {string} text The text to convert.
   * @returns {string} The converted HTML string.
   */
  function simpleMarkdownToHtml(text) {
    const lines = text.split('\n');
    let html = '';
    let listStack = []; // To track nesting level of lists

    lines.forEach(line => {
      // Skip empty lines
      if (line.trim() === '') return;

      // Handle bold text: **text** -> <strong>text</strong>
      let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      // Handle headings
      const headingMatch = processedLine.trim().match(/^(#{1,6})\s(.*)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const content = headingMatch[2];
        html += `<h${level}>${content}</h${level}>`;
        return;
      }

      // Handle lists based on indentation
      const indentation = line.match(/^\s*/)[0].length;
      const currentLevel = Math.floor(indentation / 2); // Assuming 2 spaces per indent level

      // Close deeper lists if we are moving to a shallower level
      while (listStack.length > currentLevel) {
        html += `</${listStack.pop()}>`;
      }

      // Open new lists if we are moving to a deeper level
      while (listStack.length < currentLevel) {
        const listType = processedLine.trim().match(/^\d+\.\s/) ? 'ol' : 'ul';
        html += `<${listType}>`;
        listStack.push(listType);
      }

      // Add the list item
      const isNumbered = processedLine.trim().match(/^\d+\.\s/);
      const isBulleted = processedLine.trim().startsWith('* ');
      let content = processedLine.trim();
      if (isNumbered) {
        content = content.replace(/^\d+\.\s/, '');
      } else if (isBulleted) {
        content = content.substring(2);
      }

      if (listStack.length > 0) {
        html += `<li>${content}</li>`;
      } else {
        html += `<p>${content}</p>`; // Treat as a paragraph if not indented
      }
    });

    // Close any remaining open lists
    while (listStack.length > 0) {
      html += `</${listStack.pop()}>`;
    }

    return html;
  }
});
