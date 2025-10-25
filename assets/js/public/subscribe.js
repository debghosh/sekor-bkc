// subscribe.js - Updated to work with existing HTML structure

let selectedPlan = 'premium';
let selectedFrequency = 'daily';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  setupFormHandlers();
});

function setupFormHandlers() {
  const form = document.getElementById('newsletterForm');
  if (form) {
    form.addEventListener('submit', handleSubscription);
  }
}

// Plan Selection
function selectPlan(plan) {
  selectedPlan = plan;
  
  // Update UI
  document.querySelectorAll('.plan-card').forEach(card => {
    card.classList.remove('selected');
  });
  const selectedCard = document.querySelector(`[data-plan="${plan}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }
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

  // Generate confirmation token
  const token = generateToken();

  // Create subscription object
  const subscription = {
    token: token,
    name: name,
    email: email,
    plan: selectedPlan,
    frequency: selectedFrequency,
    interests: interests,
    subscribedAt: new Date().toISOString(),
    confirmed: false
  };

  // Save to localStorage (simulating backend)
  saveSubscription(subscription);

  // Generate confirmation URL
  const confirmUrl = `${window.location.origin}/confirm.html?token=${token}`;

  // Show success message with email preview
  showSuccessMessage(email, confirmUrl);
}

function generateToken() {
  return 'sub_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function saveSubscription(subscription) {
  const subs = JSON.parse(localStorage.getItem('kcc_pending_subscriptions') || '{}');
  subs[subscription.token] = subscription;
  localStorage.setItem('kcc_pending_subscriptions', JSON.stringify(subs));
}

function showSuccessMessage(email, confirmUrl) {
  // Hide form
  const subscribeForm = document.getElementById('subscribeForm');
  if (subscribeForm) {
    subscribeForm.style.display = 'none';
  }
  
  // Get or create success message container
  let successDiv = document.getElementById('successMessage');
  if (!successDiv) {
    // Create it if doesn't exist
    successDiv = document.createElement('div');
    successDiv.id = 'successMessage';
    const container = document.querySelector('.subscribe-card') || document.querySelector('.subscribe-body');
    if (container) {
      container.appendChild(successDiv);
    }
  }
  
  // Fill with content
  successDiv.innerHTML = `
    <div style="text-align: center; padding: 40px 20px; max-width: 800px; margin: 0 auto;">
      <div style="font-size: 5em; margin-bottom: 24px;">📧</div>
      <h2 style="font-size: 2em; margin-bottom: 16px; color: var(--text-dark); font-family: 'Playfair Display', serif;">Check Your Email!</h2>
      <p style="color: var(--text-medium); font-size: 1.1em; line-height: 1.6; margin-bottom: 24px;">
        We've sent a confirmation email to <strong style="color: var(--primary);">${email}</strong><br>
        Click the link in the email to confirm your subscription and set up your account.
      </p>

      <!-- Demo: Email Preview -->
      <div style="background: #f8f9fa; border: 2px dashed #e0e0e0; border-radius: 12px; padding: 30px; margin-top: 32px; text-align: left;">
        <h3 style="font-size: 1.2em; margin-bottom: 16px; color: var(--text-dark); text-align: center;">📬 Email Preview (Demo Only)</h3>
        <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="font-size: 0.9em; color: var(--text-medium); margin-bottom: 12px; border-bottom: 1px solid #e0e0e0; padding-bottom: 12px;">
            <strong>From:</strong> Kolkata Chronicle &lt;hello@kolkatachronicle.com&gt;<br>
            <strong>To:</strong> ${email}<br>
            <strong>Subject:</strong> Confirm your subscription to শেকড়
          </p>
          <div style="padding: 20px 0;">
            <h4 style="font-size: 1.3em; margin-bottom: 16px; color: var(--text-dark);">Welcome to The Kolkata Chronicle!</h4>
            <p style="font-size: 1em; color: var(--text-dark); margin-bottom: 16px; line-height: 1.6;">
              Thanks for subscribing! We're excited to have you as part of our community.
            </p>
            <p style="font-size: 1em; color: var(--text-dark); margin-bottom: 24px; line-height: 1.6;">
              Click the button below to confirm your subscription and set up your account:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${confirmUrl}" style="display: inline-block; padding: 16px 40px; background: #DC143C; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1.1em; box-shadow: 0 4px 12px rgba(220, 20, 60, 0.3);">
                ✓ Confirm My Subscription
              </a>
            </div>
            <p style="font-size: 0.85em; color: var(--text-light); margin-top: 24px; text-align: center; line-height: 1.5;">
              This link is valid for 48 hours. If you didn't subscribe to The Kolkata Chronicle, you can safely ignore this email.
            </p>
          </div>
        </div>
        <p style="font-size: 0.85em; color: var(--text-medium); margin-top: 16px; text-align: center; font-style: italic;">
          ⬆️ In production, this email would be sent to your inbox. For now, click the button above to continue.
        </p>
      </div>

      <div style="margin-top: 40px;">
        <a href="index.html" style="color: var(--primary); text-decoration: none; font-weight: 600; font-size: 1em;">
          ← Back to Home
        </a>
      </div>
    </div>
  `;
  
  // Show the success div
  successDiv.style.display = 'block';
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // In production, this would send an actual email via backend API
  console.log('Confirmation email would be sent to:', email);
  console.log('Confirmation URL:', confirmUrl);
}