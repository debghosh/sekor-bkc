// Subscribe Page JavaScript

let selectedPlan = 'premium';
let selectedFrequency = 'daily';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  setupFormHandlers();
  loadExistingSubscriber();
});

function setupFormHandlers() {
  const form = document.getElementById('newsletterForm');
  form.addEventListener('submit', handleSubscription);
}

// Plan Selection
function selectPlan(plan) {
  selectedPlan = plan;
  
  // Update UI
  document.querySelectorAll('.subscription-card').forEach(card => {
    card.classList.remove('selected');
  });
  document.querySelector(`[data-plan="${plan}"]`).classList.add('selected');
}

// Frequency Selection
function selectFrequency(button, frequency) {
  selectedFrequency = frequency;
  
  // Remove selected class from all buttons
  document.querySelectorAll('.frequency-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  
  // Add selected class to clicked button
  button.classList.add('selected');
}

// Handle Form Submission
function handleSubscription(e) {
  e.preventDefault();

  const name = document.getElementById('subscriberName').value;
  const email = document.getElementById('subscriberEmail').value;
  
  // Get selected interests
  const interests = Array.from(document.querySelectorAll('input[name="interests"]:checked'))
    .map(cb => cb.value);

  // Validate at least one interest selected
  if (interests.length === 0) {
    alert('Please select at least one content preference');
    return;
  }

  // Create subscription object
  const subscription = {
    name,
    email,
    plan: selectedPlan,
    frequency: selectedFrequency,
    interests,
    subscribedAt: new Date().toISOString(),
    status: 'active'
  };

  // Save to localStorage
  saveSubscription(subscription);

  // Show success message
  showSuccessMessage();

  // Log for debugging
  console.log('New subscription:', subscription);
}

// Save Subscription to LocalStorage
function saveSubscription(subscription) {
  // Get existing subscribers
  const subscribers = JSON.parse(localStorage.getItem('kcc_subscribers') || '[]');
  
  // Check if email already exists
  const existingIndex = subscribers.findIndex(sub => sub.email === subscription.email);
  
  if (existingIndex !== -1) {
    // Update existing subscription
    subscribers[existingIndex] = subscription;
  } else {
    // Add new subscription
    subscribers.push(subscription);
  }
  
  // Save back to localStorage
  localStorage.setItem('kcc_subscribers', JSON.stringify(subscribers));
  
  // Also create a user account if premium
  if (subscription.plan === 'premium') {
    createUserAccount(subscription);
  }
}

// Create User Account for Premium Subscribers
function createUserAccount(subscription) {
  const user = {
    id: Date.now(),
    name: subscription.name,
    email: subscription.email,
    role: 'reader',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(subscription.name)}&background=DC143C&color=fff`,
    subscribedAt: subscription.subscribedAt,
    subscriptionPlan: subscription.plan,
    subscriptionStatus: 'active'
  };

  // Save to data store if it exists
  if (typeof DATA_STORE !== 'undefined') {
    // Check if user already exists
    const existingUser = DATA_STORE.getUserByEmail(subscription.email);
    if (!existingUser) {
      DATA_STORE.users.push(user);
      DATA_STORE.saveToLocalStorage();
    }
  }
}

// Show Success Message
function showSuccessMessage() {
  document.getElementById('subscribeForm').style.display = 'none';
  document.getElementById('successMessage').classList.add('active');
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Load Existing Subscriber Info (if coming from login page)
function loadExistingSubscriber() {
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');
  
  if (email) {
    document.getElementById('subscriberEmail').value = email;
  }
}

// Get Subscriber by Email (utility function)
function getSubscriberByEmail(email) {
  const subscribers = JSON.parse(localStorage.getItem('kcc_subscribers') || '[]');
  return subscribers.find(sub => sub.email === email);
}

// Check if Email is Already Subscribed
function isEmailSubscribed(email) {
  const subscriber = getSubscriberByEmail(email);
  return subscriber && subscriber.status === 'active';
}

// Unsubscribe Function (for future use)
function unsubscribe(email) {
  const subscribers = JSON.parse(localStorage.getItem('kcc_subscribers') || '[]');
  const index = subscribers.findIndex(sub => sub.email === email);
  
  if (index !== -1) {
    subscribers[index].status = 'unsubscribed';
    subscribers[index].unsubscribedAt = new Date().toISOString();
    localStorage.setItem('kcc_subscribers', JSON.stringify(subscribers));
    return true;
  }
  return false;
}

// Export functions for use in other pages
if (typeof window !== 'undefined') {
  window.SubscriptionManager = {
    getSubscriberByEmail,
    isEmailSubscribed,
    unsubscribe,
    selectPlan,
    selectFrequency
  };
}