
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const apiKeyInput = document.getElementById('apiKey');
const providerSelect = document.getElementById('providerSelect');

// Load saved API key and provider
const savedApiKey = localStorage.getItem('api_key');
const savedProvider = localStorage.getItem('provider') || 'groq';
if (savedApiKey) {
  apiKeyInput.value = savedApiKey;
}
providerSelect.value = savedProvider;

// Update placeholder based on provider
function updatePlaceholder() {
  const provider = providerSelect.value;
  if (provider === 'groq') {
    apiKeyInput.placeholder = 'Enter your Groq API key (get free key at console.groq.com)';
  } else {
    apiKeyInput.placeholder = 'Enter your OpenRouter API key (get free key at openrouter.ai)';
  }
}

updatePlaceholder();

// Save API key and provider on change
apiKeyInput.addEventListener('change', () => {
  localStorage.setItem('api_key', apiKeyInput.value);
});

providerSelect.addEventListener('change', () => {
  localStorage.setItem('provider', providerSelect.value);
  updatePlaceholder();
});

// Auto-resize textarea
messageInput.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = this.scrollHeight + 'px';
});

function addMessage(content, type = 'user') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = type === 'user' ? 'U' : 'AI';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = content;
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(contentDiv);
  chatContainer.appendChild(messageDiv);
  
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addLoadingIndicator() {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message ai';
  loadingDiv.id = 'loading-indicator';
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = 'AI';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  const loading = document.createElement('div');
  loading.className = 'loading';
  loading.innerHTML = '<span></span><span></span><span></span>';
  
  contentDiv.appendChild(loading);
  loadingDiv.appendChild(avatar);
  loadingDiv.appendChild(contentDiv);
  chatContainer.appendChild(loadingDiv);
  
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoadingIndicator() {
  const loading = document.getElementById('loading-indicator');
  if (loading) loading.remove();
}

async function sendMessage() {
  const message = messageInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  const provider = providerSelect.value;
  
  if (!message) return;
  
  if (!apiKey) {
    addMessage('Please enter your API key first!', 'error');
    return;
  }
  
  addMessage(message, 'user');
  messageInput.value = '';
  messageInput.style.height = 'auto';
  sendButton.disabled = true;
  
  addLoadingIndicator();
  
  const result = await window.electronAPI.sendMessage(message, apiKey, provider);
  
  removeLoadingIndicator();
  
  if (result.success) {
    addMessage(result.response, 'ai');
  } else {
    addMessage(`Error: ${result.error}`, 'error');
  }
  
  sendButton.disabled = false;
  messageInput.focus();
}

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});