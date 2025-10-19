// Admin Portal JavaScript

let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  loadUserInfo();
  loadDashboard();
  setupNavigation();
  setupFilters();
  updateReviewBadge();
});

function checkAuth() {
  const user = sessionStorage.getItem('kcc_user');
  if (!user) {
    window.location.href = '../login.html';
    return;
  }
  currentUser = JSON.parse(user);
}

function loadUserInfo() {
  const userNameEl = document.getElementById('userName');
  const userAvatarEl = document.getElementById('userAvatar');
  
  if (currentUser) {
    userNameEl.textContent = currentUser.name;
    userAvatarEl.textContent = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}

function updateReviewBadge() {
  const reviewCount = DATA_STORE.getArticlesByStatus('review').length;
  const badge = document.getElementById('reviewBadge');
  if (reviewCount > 0) {
    badge.textContent = reviewCount;
    badge.style.display = 'inline-block';
    badge.style.background = 'var(--danger)';
    badge.style.color = 'white';
    badge.style.padding = '2px 8px';
    badge.style.borderRadius = '12px';
    badge.style.fontSize = '0.75em';
    badge.style.marginLeft = 'auto';
  } else {
    badge.style.display = 'none';
  }
}

function loadDashboard() {
  loadStats();
  loadRecentArticles();
  loadTopArticles();
}

function loadStats() {
  const statsGrid = document.getElementById('statsGrid');
  const stats = DATA_STORE.getStats();
  
  statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Articles</div>
      <div class="stat-value">${stats.totalArticles}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Published</div>
      <div class="stat-value" style="color: var(--success)">${stats.published}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Pending Review</div>
      <div class="stat-value" style="color: var(--warning)">${stats.review}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Authors</div>
      <div class="stat-value" style="color: #9b59b6">${stats.totalAuthors}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Views</div>
      <div class="stat-value" style="color: #3498db">${stats.totalViews.toLocaleString()}</div>
    </div>
  `;
}

function loadRecentArticles() {
  const container = document.getElementById('recentArticles');
  const articles = DATA_STORE.getArticles().slice(0, 4);
  
  container.innerHTML = articles.map(article => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 12px;">
      <div style="flex: 1;">
        <div style="font-weight: 600; font-size: 0.95em; margin-bottom: 4px;">${article.title}</div>
        <div style="font-size: 0.8em; color: var(--text-medium);">${article.author} • ${article.category}</div>
      </div>
      <span class="badge badge-${article.status}">${article.status}</span>
    </div>
  `).join('');
}

function loadTopArticles() {
  const container = document.getElementById('topArticles');
  const articles = DATA_STORE.getArticlesByStatus('published')
    .sort((a, b) => b.views - a.views)
    .slice(0, 4);
  
  container.innerHTML = articles.map(article => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 12px;">
      <div style="flex: 1;">
        <div style="font-weight: 600; font-size: 0.95em; margin-bottom: 4px;">${article.title}</div>
        <div style="font-size: 0.8em; color: var(--text-medium);">
          👁️ ${article.views.toLocaleString()} views • 💬 ${article.engagement}
        </div>
      </div>
    </div>
  `).join('');
}

function loadAllArticles(filter = '') {
  const container = document.getElementById('allArticlesList');
  let articles = DATA_STORE.getArticles();
  
  if (filter) {
    articles = articles.filter(a => a.status === filter);
  }
  
  const searchTerm = document.getElementById('searchArticles').value.toLowerCase();
  if (searchTerm) {
    articles = articles.filter(a => 
      a.title.toLowerCase().includes(searchTerm) ||
      a.author.toLowerCase().includes(searchTerm) ||
      a.category.toLowerCase().includes(searchTerm)
    );
  }
  
  container.innerHTML = articles.map(article => `
    <div class="article-list-item">
      <img src="${article.image}" alt="" class="article-thumbnail">
      <div class="article-content">
        <div class="article-badges">
          <span class="badge badge-${article.status}">${article.status.toUpperCase()}</span>
          <span class="category-tag">${article.category}</span>
        </div>
        <h3 class="article-list-title">${article.title}</h3>
        <p class="article-list-summary">${article.summary}</p>
        <div class="article-meta-info">
          <span>✍️ ${article.author}</span>
          <span>👁️ ${article.views} views</span>
          <span>💬 ${article.engagement} comments</span>
          ${article.publishDate ? `<span>📅 ${article.publishDate}</span>` : ''}
        </div>
      </div>
      <div class="article-actions">
        <button class="btn-icon" onclick="editArticle(${article.id})" title="Edit">
          ✏️
        </button>
        <button class="btn-icon" onclick="viewArticle(${article.id})" title="View">
          👁️
        </button>
        <button class="btn-icon btn-danger" onclick="deleteArticle(${article.id})" title="Delete">
          🗑️
        </button>
      </div>
    </div>
  `).join('');
}

function loadReviewArticles() {
  const container = document.getElementById('reviewArticlesList');
  const articles = DATA_STORE.getArticlesByStatus('review');
  
  if (articles.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px; color: var(--text-medium);">
        <div style="font-size: 4em; margin-bottom: 20px; opacity: 0.3;">⏰</div>
        <h3 style="font-size: 1.3em; margin-bottom: 12px;">No articles pending review</h3>
        <p>All submissions have been reviewed!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = articles.map(article => `
    <div style="border: 2px solid var(--warning); background: #fffbf0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <div style="display: flex; gap: 20px;">
        <img src="${article.image}" alt="" style="width: 180px; height: 180px; object-fit: cover; border-radius: 8px;">
        <div style="flex: 1;">
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <span class="badge badge-review">PENDING REVIEW</span>
            <span class="category-tag">${article.category}</span>
          </div>
          <h3 style="font-size: 1.6em; font-weight: 700; margin-bottom: 12px;">${article.title}</h3>
          <p style="color: var(--text-medium); margin-bottom: 16px; line-height: 1.6;">${article.summary}</p>
          <div style="margin-bottom: 20px; font-size: 0.9em; color: var(--text-medium);">
            <strong>Author:</strong> ${article.author}
          </div>
          <div style="display: flex; gap: 12px;">
            <button class="btn-primary btn-success" onclick="approveArticle(${article.id})">
              ✓ Approve & Publish
            </button>
            <button class="btn-primary btn-warning" onclick="requestChanges(${article.id})">
              ✏️ Request Changes
            </button>
            <button class="btn-primary btn-danger" onclick="rejectArticle(${article.id})">
              ✗ Reject
            </button>
            <button class="btn-secondary" onclick="viewArticle(${article.id})">
              👁️ Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function loadUsers() {
  const container = document.getElementById('usersList');
  const users = DATA_STORE.getUsers();
  
  container.innerHTML = users.map(user => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px; border: 1px solid var(--border); border-radius: 12px; margin-bottom: 16px;">
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #9b59b6); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.3em;">
          ${user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </div>
        <div>
          <div style="font-weight: 600; font-size: 1.1em; margin-bottom: 4px;">${user.name}</div>
          <div style="font-size: 0.9em; color: var(--text-medium);">${user.email}</div>
        </div>
      </div>
      <div style="display: flex; gap: 40px; align-items: center;">
        <div style="text-align: center;">
          <div style="font-size: 0.8em; color: var(--text-medium);">Role</div>
          <div style="font-weight: 600; text-transform: capitalize;">${user.role}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 0.8em; color: var(--text-medium);">Articles</div>
          <div style="font-weight: 600;">${user.articles}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 0.8em; color: var(--text-medium);">Followers</div>
          <div style="font-weight: 600;">${user.followers}</div>
        </div>
        <button class="btn-icon" onclick="editUser(${user.id})" title="Edit">
          ✏️
        </button>
      </div>
    </div>
  `).join('');
}

function loadAnalytics() {
  const stats = DATA_STORE.getStats();
  const publishedArticles = DATA_STORE.getArticlesByStatus('published');
  
  document.getElementById('totalViewsAnalytics').textContent = stats.totalViews.toLocaleString();
  document.getElementById('avgEngagementAnalytics').textContent = publishedArticles.length > 0 
    ? Math.round(stats.totalEngagement / publishedArticles.length)
    : 0;
  document.getElementById('avgViewsAnalytics').textContent = publishedArticles.length > 0
    ? Math.round(stats.totalViews / publishedArticles.length)
    : 0;
  
  // Category stats
  const categories = {};
  publishedArticles.forEach(article => {
    if (!categories[article.category]) {
      categories[article.category] = 0;
    }
    categories[article.category] += article.views;
  });
  
  const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const maxViews = sortedCategories[0]?.[1] || 1;
  
  document.getElementById('categoryStats').innerHTML = sortedCategories.map(([cat, views]) => `
    <div style="margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: 600;">${cat}</span>
        <span style="color: var(--text-medium);">${views.toLocaleString()} views</span>
      </div>
      <div style="width: 100%; height: 32px; background: var(--bg-light); border-radius: 16px; overflow: hidden;">
        <div style="height: 100%; background: linear-gradient(90deg, var(--primary), #9b59b6); width: ${(views / maxViews) * 100}%; display: flex; align-items: center; justify-content: flex-end; padding-right: 16px; color: white; font-weight: 600; font-size: 0.9em;">
          ${Math.round((views / maxViews) * 100)}%
        </div>
      </div>
    </div>
  `).join('');
  
  // Author stats
  const authors = DATA_STORE.getUsers().filter(u => u.role === 'author');
  document.getElementById('authorStats').innerHTML = authors.map((author, idx) => {
    const authorArticles = DATA_STORE.getArticlesByAuthor(author.id);
    const totalViews = authorArticles.reduce((sum, a) => sum + a.views, 0);
    const avgEngagement = authorArticles.length > 0 
      ? Math.round(authorArticles.reduce((sum, a) => sum + a.engagement, 0) / authorArticles.length)
      : 0;
    
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border: 1px solid var(--border); border-radius: 12px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="font-size: 1.5em; font-weight: 700; color: var(--text-light); width: 40px;">
            #${idx + 1}
          </div>
          <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #9b59b6); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700;">
            ${author.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div style="font-weight: 600; font-size: 1.05em;">${author.name}</div>
            <div style="font-size: 0.85em; color: var(--text-medium);">${author.articles} articles</div>
          </div>
        </div>
        <div style="display: flex; gap: 40px;">
          <div style="text-align: center;">
            <div style="font-weight: 700; font-size: 1.3em;">${totalViews.toLocaleString()}</div>
            <div style="font-size: 0.8em; color: var(--text-medium);">Total Views</div>
          </div>
          <div style="text-align: center;">
            <div style="font-weight: 700; font-size: 1.3em;">${avgEngagement}</div>
            <div style="font-size: 0.8em; color: var(--text-medium);">Avg Engagement</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setupNavigation() {
  const links = document.querySelectorAll('.portal-sidebar-link');
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const view = this.dataset.view;
      showView(view);
      
      links.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

function showView(viewName) {
  document.querySelectorAll('.portal-view').forEach(view => {
    view.style.display = 'none';
  });
  
  const targetView = document.getElementById(viewName + 'View');
  if (targetView) {
    targetView.style.display = 'block';
    
    if (viewName === 'articles') {
      loadAllArticles();
    } else if (viewName === 'review') {
      loadReviewArticles();
    } else if (viewName === 'users') {
      loadUsers();
    } else if (viewName === 'analytics') {
      loadAnalytics();
    } else if (viewName === 'dashboard') {
      loadDashboard();
    }
  }
}

function setupFilters() {
  const searchInput = document.getElementById('searchArticles');
  const filterSelect = document.getElementById('filterStatus');
  
  if (searchInput) {
    searchInput.addEventListener('input', () => loadAllArticles(filterSelect.value));
  }
  
  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => loadAllArticles(e.target.value));
  }
}

function approveArticle(articleId) {
  if (confirm('Approve and publish this article?')) {
    DATA_STORE.updateArticleStatus(articleId, 'published');
    loadReviewArticles();
    loadDashboard();
    updateReviewBadge();
    alert('Article approved and published!');
  }
}

function requestChanges(articleId) {
  const feedback = prompt('Please provide feedback for the author:');
  if (feedback) {
    alert('Feedback sent to author. Article status updated to draft.');
    DATA_STORE.updateArticleStatus(articleId, 'draft');
    loadReviewArticles();
    updateReviewBadge();
  }
}

function rejectArticle(articleId) {
  const reason = prompt('Reason for rejection:');
  if (reason && confirm('Are you sure you want to reject this article?')) {
    DATA_STORE.deleteArticle(articleId);
    loadReviewArticles();
    loadDashboard();
    updateReviewBadge();
    alert('Article rejected and removed.');
  }
}

function viewArticle(articleId) {
  window.open(`article.html?id=${articleId}`, '_blank');
}

function editArticle(articleId) {
  alert('Edit functionality coming soon!');
}

function deleteArticle(articleId) {
  if (confirm('Are you sure you want to delete this article permanently?')) {
    DATA_STORE.deleteArticle(articleId);
    loadAllArticles();
    loadDashboard();
    updateReviewBadge();
  }
}

function editUser(userId) {
  alert('Edit user functionality coming soon!');
}

function logout() {
  sessionStorage.removeItem('kcc_user');
  sessionStorage.removeItem('kcc_role');
  window.location.href = '../login.html';
}