// confirm.js - Subscription Confirmation & Account Setup

const STORAGE_KEYS = {
  PENDING_SUBS: 'kcc_pending_subscriptions',
  USER_SESSION: 'kcc_user',
  ROLE: 'kcc_role'
};

let currentSubscription = null;
let selectedAuthMethod = 'magic';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

function showState(stateName) {
  const states = ['loadingState', 'successState', 'errorState'];
  states.forEach(state => {
    document.getElementById(state).style.display = 'none';
  });
  document.getElementById(stateName).style.display = 'block';
}

// ============================================================================
// CONFIRMATION FLOW
// ============================================================================

function verifyConfirmationToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (!token) {
    showState('errorState');
    return;
  }

  // Simulate API call delay
  setTimeout(() => {
    const subscription = getSubscriptionByToken(token);

    if (subscription && !subscription.confirmed) {
      // Mark as confirmed
      subscription.confirmed = true;
      subscription.confirmedAt = new Date().toISOString();
      saveSubscription(subscription);

      currentSubscription = subscription;
      displaySubscriptionDetails(subscription);
      showState('successState');
    } else {
      showState('errorState');
    }
  }, 1500);
}

function getSubscriptionByToken(token) {
  const subs = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_SUBS) || '{}');
  return subs[token];
}

function saveSubscription(subscription) {
  const subs = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_SUBS) || '{}');
  subs[subscription.token] = subscription;
  localStorage.setItem(STORAGE_KEYS.PENDING_SUBS, JSON.stringify(subs));
}

function displaySubscriptionDetails(subscription) {
  document.getElementById('userEmail').textContent = subscription.email;
  document.getElementById('userPlan').textContent = 
    subscription.plan === 'premium' ? 'Premium (₹99/month)' : 'Free Newsletter';
  document.getElementById('userFrequency').textContent = 
    subscription.frequency.charAt(0).toUpperCase() + subscription.frequency.slice(1);
}

// ============================================================================
// AUTH METHOD SELECTION
// ============================================================================

function selectAuthMethod(method) {
  selectedAuthMethod = method;

  // Update UI
  document.querySelectorAll('.auth-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  event.currentTarget.classList.add('selected');

  // Show/hide password setup
  const passwordSetup = document.getElementById('passwordSetup');
  const continueBtn = document.getElementById('continueBtn');

  if (method === 'password') {
    passwordSetup.classList.add('active');
    continueBtn.textContent = 'Create Account';
  } else {
    passwordSetup.classList.remove('active');
    continueBtn.textContent = 'Continue to Your Account';
  }
}

// ============================================================================
// PASSWORD STRENGTH CHECKER
// ============================================================================

function checkPasswordStrength() {
  const password = document.getElementById('newPassword').value;
  const strengthFill = document.getElementById('strengthFill');
  const strengthText = document.getElementById('strengthText');

  // Check requirements
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  // Update requirement checkmarks
  updateRequirement('req-length', hasLength);
  updateRequirement('req-uppercase', hasUpper);
  updateRequirement('req-lowercase', hasLower);
  updateRequirement('req-number', hasNumber);

  // Calculate strength
  const metRequirements = [hasLength, hasUpper, hasLower, hasNumber].filter(Boolean).length;

  // Update UI
  strengthFill.className = 'strength-fill';
  if (metRequirements === 0) {
    strengthText.textContent = '';
  } else if (metRequirements <= 2) {
    strengthFill.classList.add('strength-weak');
    strengthText.textContent = 'Weak password';
    strengthText.style.color = '#ef4444';
  } else if (metRequirements === 3) {
    strengthFill.classList.add('strength-medium');
    strengthText.textContent = 'Medium password';
    strengthText.style.color = '#f59e0b';
  } else {
    strengthFill.classList.add('strength-strong');
    strengthText.textContent = 'Strong password';
    strengthText.style.color = '#10b981';
  }
}

function updateRequirement(id, met) {
  const elem = document.getElementById(id);
  if (met) {
    elem.classList.add('met');
    elem.textContent = '✓ ' + elem.textContent.replace('✓ ', '');
  } else {
    elem.classList.remove('met');
    elem.textContent = elem.textContent.replace('✓ ', '');
  }
}

// ============================================================================
// COMPLETE SETUP
// ============================================================================

function completeSetup() {
  if (!currentSubscription) {
    alert('Error: No subscription data found');
    return;
  }

  if (selectedAuthMethod === 'password') {
    if (!validatePassword()) {
      return;
    }
  }

  // Create user account
  const user = {
    id: generateUserId(currentSubscription.email),
    email: currentSubscription.email,
    name: currentSubscription.name,
    authMethod: selectedAuthMethod,
    subscription: {
      plan: currentSubscription.plan,
      frequency: currentSubscription.frequency,
      interests: currentSubscription.interests
    },
    createdAt: new Date().toISOString()
  };

  // Save password if chosen
  if (selectedAuthMethod === 'password') {
    const password = document.getElementById('newPassword').value;
    // In production, this would be hashed and sent to backend
    localStorage.setItem(`kcc_password_${user.id}`, btoa(password)); // Simple base64 for demo
  }

  // Create session
  sessionStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(user));
  sessionStorage.setItem(STORAGE_KEYS.ROLE, 'reader');

  // Show success message and redirect
  alert('Account created successfully! Welcome to The Kolkata Chronicle.');
  
  setTimeout(() => {
    window.location.href = 'reader/home.html';
  }, 500);
}

function validatePassword() {
  const password = document.getElementById('newPassword').value;
  const confirm = document.getElementById('confirmPassword').value;

  // Check all requirements
  if (password.length < 8) {
    alert('Password must be at least 8 characters long');
    return false;
  }
  if (!/[A-Z]/.test(password)) {
    alert('Password must contain at least one uppercase letter');
    return false;
  }
  if (!/[a-z]/.test(password)) {
    alert('Password must contain at least one lowercase letter');
    return false;
  }
  if (!/[0-9]/.test(password)) {
    alert('Password must contain at least one number');
    return false;
  }
  if (password !== confirm) {
    alert('Passwords do not match');
    return false;
  }

  return true;
}

function generateUserId(email) {
  // Simple hash for demo
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'user_' + Math.abs(hash).toString(36);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  verifyConfirmationToken();
});