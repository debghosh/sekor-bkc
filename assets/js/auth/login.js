// Login JavaScript

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const role = document.getElementById('role').value;
    
    // Find user or create temporary session
    let user = DATA_STORE.getUserByEmail(email);
    
    if (!user) {
      // Create temporary reader account
      user = {
        id: Date.now(),
        name: email.split('@')[0],
        email: email,
        role: role,
        avatar: 'https://i.pravatar.cc/150?img=8'
      };
    }
    
    // Store session
    sessionStorage.setItem('kcc_user', JSON.stringify(user));
    sessionStorage.setItem('kcc_role', role);
    
    // Redirect based on role
    redirectToPortal(role);
  });
});

function redirectToPortal(role) {
  switch(role) {
    case 'admin':
      window.location.href = 'admin/admin.html';
      break;
    case 'author':
    case 'editor':
      window.location.href = 'creator/creator.html';
      break;
    case 'reader':
    default:
      window.location.href = 'reader/home.html'; // Changed from index.html
      break;
  }
}

// Check if already logged in
function checkSession() {
  const user = sessionStorage.getItem('kcc_user');
  if (user) {
    const role = sessionStorage.getItem('kcc_role');
    if (window.location.pathname.includes('login.html')) {
      redirectToPortal(role);
    }
  }
}

checkSession();