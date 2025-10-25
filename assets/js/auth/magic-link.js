// magic-link.js - Magic Link Authentication System
// For demo purposes, this simulates backend behavior using localStorage

const AUTH_STORAGE = {
  PENDING_TOKENS: 'kcc_pending_tokens',
  USER_SESSION: 'kcc_user',
  ROLE: 'kcc_role'
};

const TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateToken() {
  return 'ml_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function hashEmail(email) {
  // Simple hash for demo - in production, use proper backend
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function saveToken(email, token) {
  const tokens = JSON.parse(localStorage.getItem(AUTH_STORAGE.PENDING_TOKENS) || '{}');
  tokens[token] = {
    email: email,
    createdAt: Date.now(),
    expiresAt: Date.now() + TOKEN_EXPIRY,
    used: false
  };
  localStorage.setItem(AUTH_STORAGE.PENDING_TOKENS, JSON.stringify(tokens));
  return token;
}

function verifyToken(token) {
  const tokens = JSON.parse(localStorage.getItem(AUTH_STORAGE.PENDING_TOKENS) || '{}');
  const tokenData = tokens[token];
  
  if (!tokenData) {
    return { valid: false, reason: 'Token not found' };
  }
  
  if (tokenData.used) {
    return { valid: false, reason: 'Token already used' };
  }
  
  if (Date.now() > tokenData.expiresAt) {
    return { valid: false, reason: 'Token expired' };
  }
  
  // Mark token as used
  tokenData.used = true;
  tokens[token] = tokenData;
  localStorage.setItem(AUTH_STORAGE.PENDING_TOKENS, JSON.stringify(tokens));
  
  return { valid: true, email: tokenData.email };
}

function createUserSession(email) {
  // Check if user exists, otherwise create new user
  const userId = hashEmail(email);
  const name = email.split('@')[0]; // Use email prefix as default name
  
  const user = {
    id: userId,
    email: email,
    name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
    createdAt: Date.now()
  };
  
  // Store in session
  sessionStorage.setItem(AUTH_STORAGE.USER_SESSION, JSON.stringify(user));
  sessionStorage.setItem(AUTH_STORAGE.ROLE, 'reader');
  
  return user;
}

// ============================================================================
// UI STATE MANAGEMENT
// ============================================================================

function showState(stateName) {
  const states = ['loginForm', 'successState', 'loadingState', 'errorState'];
  states.forEach(state => {
    document.getElementById(state).style.display = 'none';
  });
  document.getElementById(stateName).style.display = 'block';
}

function resetForm() {
  document.getElementById('magicLinkForm').reset();
  showState('loginForm');
}

// ============================================================================
// MAGIC LINK FLOW
// ============================================================================

function sendMagicLink(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const submitBtn = document.getElementById('submitBtn');
  
  // Validate email
  if (!email || !email.includes('@')) {
    alert('Please enter a valid email address');
    return;
  }
  
  // Disable button
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';
  
  // Simulate API delay
  setTimeout(() => {
    // Generate and save token
    const token = generateToken();
    saveToken(email, token);
    
    // Create magic link URL
    const magicLinkUrl = `${window.location.origin}${window.location.pathname}?token=${token}`;
    
    // Update UI
    document.getElementById('sentToEmail').textContent = email;
    document.getElementById('demoMagicLink').href = magicLinkUrl;
    document.getElementById('demoMagicLink').dataset.token = token;
    
    // Show success state
    showState('successState');
    
    // Re-enable button
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Magic Link';
    
    // In production, this would send an actual email via backend
    console.log('Magic link generated:', magicLinkUrl);
    console.log('Token:', token);
  }, 800);
}

function handleMagicLinkClick(event) {
  event.preventDefault();
  const token = event.target.dataset.token;
  
  // Show loading
  showState('loadingState');
  
  // Simulate verification delay
  setTimeout(() => {
    const result = verifyToken(token);
    
    if (result.valid) {
      // Create session
      createUserSession(result.email);
      
      // Redirect to home page
      window.location.href = 'reader/home.html';
    } else {
      // Show error
      showState('errorState');
      console.error('Token verification failed:', result.reason);
    }
  }, 1500);
}

function checkForToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    // User clicked magic link
    showState('loadingState');
    
    setTimeout(() => {
      const result = verifyToken(token);
      
      if (result.valid) {
        createUserSession(result.email);
        
        // Clean URL and redirect
        window.history.replaceState({}, document.title, window.location.pathname);
        
        setTimeout(() => {
          window.location.href = 'reader/home.html';
        }, 500);
      } else {
        showState('errorState');
      }
    }, 1000);
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Check if user arrived via magic link
  checkForToken();
  
  // Auto-focus email input
  const emailInput = document.getElementById('email');
  if (emailInput && document.getElementById('loginForm').style.display !== 'none') {
    emailInput.focus();
  }
});

// Cleanup expired tokens periodically
setInterval(() => {
  const tokens = JSON.parse(localStorage.getItem(AUTH_STORAGE.PENDING_TOKENS) || '{}');
  const now = Date.now();
  let changed = false;
  
  for (const [token, data] of Object.entries(tokens)) {
    if (now > data.expiresAt) {
      delete tokens[token];
      changed = true;
    }
  }
  
  if (changed) {
    localStorage.setItem(AUTH_STORAGE.PENDING_TOKENS, JSON.stringify(tokens));
  }
}, 60000); // Check every minute