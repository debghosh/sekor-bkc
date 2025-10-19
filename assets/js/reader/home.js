// home.js - Authenticated Homepage JavaScript
// Refactored version with all fixes applied

// ============================================================================
// CONSTANTS (Unique to home.js)
// ============================================================================
const HOME_STORAGE_KEYS = {
  USER: 'kcc_user',
  ROLE: 'kcc_role',
  FOLLOWED_AUTHORS: 'kcc_followed_authors'
};

const HOME_LIMITS = {
  FOR_YOU_ARTICLES: 5,
  WORDS_PER_MINUTE: 200,
  DEFAULT_READING_TIME: 6
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
const AppState = {
  currentUser: null,
  isAuthenticated: false,
  followedAuthors: new Set()
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const Utils = {
  safeJSONParse(str, fallback = null) {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.error('JSON parse error:', e);
      return fallback;
    }
  },

  safeLocalStorageGet(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? this.safeJSONParse(value, fallback) : fallback;
    } catch (e) {
      console.error('localStorage get error:', e);
      return fallback;
    }
  },

  safeLocalStorageSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('localStorage set error:', e);
      return false;
    }
  },

  safeSessionStorageGet(key, fallback = null) {
    try {
      const value = sessionStorage.getItem(key);
      return value ? this.safeJSONParse(value, fallback) : fallback;
    } catch (e) {
      console.error('sessionStorage get error:', e);
      return fallback;
    }
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  formatDate(dateString) {
    if (!dateString) return 'Draft';
    try {
      const date = new Date(dateString);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}`;
    } catch (e) {
      return 'Invalid Date';
    }
  },

  getReadingTime(content) {
    if (!content) return LIMITS.DEFAULT_READING_TIME;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / HOME_LIMITS.WORDS_PER_MINUTE) || HOME_LIMITS.DEFAULT_READING_TIME;
  }
};

// ============================================================================
// AUTHENTICATION MODULE
// ============================================================================
const Auth = {
  checkSession() {
    const userStr = Utils.safeSessionStorageGet(HOME_STORAGE_KEYS.USER);
    if (userStr) {
      AppState.currentUser = userStr;
      AppState.isAuthenticated = true;
      UI.updateHeaderForLoggedInUser();
      UI.updateAuthState();
    } else {
      AppState.isAuthenticated = false;
      UI.updateAuthState();
    }
  },

  logout() {
    if (!confirm('Are you sure you want to logout?')) return;
    
    try {
      sessionStorage.removeItem(HOME_STORAGE_KEYS.USER);
      sessionStorage.removeItem(HOME_STORAGE_KEYS.ROLE);
      localStorage.removeItem(HOME_STORAGE_KEYS.FOLLOWED_AUTHORS);
      // Redirect to landing page
      window.location.href = '../index.html';
    } catch (e) {
      console.error('Logout error:', e);
      alert('Error logging out. Please try again.');
    }
  }
};

// ============================================================================
// DATA MODULE
// ============================================================================
const DataManager = {
  getUserAvatar(authorId) {
    try {
      const user = DATA_STORE.getUserById(authorId);
      return user?.avatar || 'https://i.pravatar.cc/150?img=1';
    } catch (e) {
      console.error('Error getting user avatar:', e);
      return 'https://i.pravatar.cc/150?img=1';
    }
  },

  loadFollowedAuthors() {
    const savedFollows = Utils.safeLocalStorageGet(HOME_STORAGE_KEYS.FOLLOWED_AUTHORS, []);
    if (Array.isArray(savedFollows)) {
      savedFollows.forEach(id => AppState.followedAuthors.add(id));
    }
  },

  saveFollowedAuthors() {
    Utils.safeLocalStorageSet(
      HOME_STORAGE_KEYS.FOLLOWED_AUTHORS,
      [...AppState.followedAuthors]
    );
  },

  getAuthorTopics(authorId) {
    try {
      const articles = DATA_STORE.getArticlesByAuthor(authorId);
      const categories = [...new Set(articles.map(a => a.category))];
      return categories.slice(0, 3);
    } catch (e) {
      console.error('Error getting author topics:', e);
      return [];
    }
  }
};

// ============================================================================
// UI MODULE
// ============================================================================
const UI = {
  updateHeaderForLoggedInUser() {
    const headerAuthSection = document.getElementById('headerAuthSection');
    if (!AppState.currentUser || !headerAuthSection) return;

    try {
      const nameParts = AppState.currentUser.name.split(' ');
      const initials = nameParts.map(n => n[0]).join('').toUpperCase();
      
      headerAuthSection.innerHTML = `
        <div class="user-info-display">
          <div class="user-avatar-small">${Utils.escapeHtml(initials)}</div>
          <span style="font-weight: 600; font-size: 0.95em;">${Utils.escapeHtml(AppState.currentUser.name)}</span>
          <a href="#" class="btn-logout-header">Logout</a>
        </div>
      `;

      // Attach event listener for logout
      const logoutBtn = headerAuthSection.querySelector('.btn-logout-header');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          Auth.logout();
        });
      }
    } catch (e) {
      console.error('Error updating header:', e);
    }
  },

  updateAuthState() {
    const forYouTab = document.getElementById('forYouTab');
    const followingTab = document.getElementById('followingTab');
    const loginPrompt = document.getElementById('loginPrompt');

    if (!forYouTab || !followingTab) return;

    if (AppState.isAuthenticated) {
      forYouTab.style.opacity = '1';
      forYouTab.style.cursor = 'pointer';
      forYouTab.title = '';
      followingTab.style.opacity = '1';
      followingTab.style.cursor = 'pointer';
      followingTab.title = '';
      if (loginPrompt) loginPrompt.style.display = 'none';
    } else {
      forYouTab.style.opacity = '0.5';
      forYouTab.style.cursor = 'not-allowed';
      forYouTab.title = 'Login to access personalized recommendations';
      followingTab.style.opacity = '0.5';
      followingTab.style.cursor = 'not-allowed';
      followingTab.title = 'Login to follow authors';
      if (loginPrompt) loginPrompt.style.display = 'block';
    }
  },

  createStoryCard(article) {
    const card = document.createElement('article');
    card.className = 'story-card';
    card.dataset.articleId = article.id;

    const isFollowing = AppState.followedAuthors.has(article.authorId);
    const avatar = DataManager.getUserAvatar(article.authorId);
    const formattedDate = Utils.formatDate(article.publishDate);
    const readingTime = Utils.getReadingTime(article.content);

    card.innerHTML = `
      <img src="${Utils.escapeHtml(article.image)}" alt="${Utils.escapeHtml(article.title)}" class="story-image">
      <div class="story-meta">
        <img src="${Utils.escapeHtml(avatar)}" alt="${Utils.escapeHtml(article.author)}" class="author-avatar">
        <span class="author-name">${Utils.escapeHtml(article.author)}</span>
        <span>•</span>
        <span>${Utils.escapeHtml(formattedDate)}</span>
        <button class="btn-follow ${isFollowing ? 'following' : ''}" data-author-id="${article.authorId}">
          ${isFollowing ? 'Following' : '+ Follow'}
        </button>
      </div>
      <span class="category-tag">${Utils.escapeHtml(article.category)}</span>
      <h2 class="story-title">${Utils.escapeHtml(article.title)}</h2>
      <p class="story-summary">${Utils.escapeHtml(article.summary)}</p>
      <div class="story-actions">
        <span class="story-action">⏱️ ${readingTime} min read</span>
        <span class="story-action">💬 ${article.engagement}</span>
        <span class="story-action save-btn">📖 Save</span>
      </div>
    `;

    return card;
  }
};

// ============================================================================
// CONTENT LOADERS
// ============================================================================
const ContentLoader = {
  loadStories() {
    const storyGrid = document.getElementById('storyGrid');
    if (!storyGrid) return;

    try {
      const publishedArticles = DATA_STORE.getArticlesByStatus('published');
      storyGrid.innerHTML = '';

      publishedArticles.forEach(article => {
        const storyCard = UI.createStoryCard(article);
        storyGrid.appendChild(storyCard);
      });
    } catch (e) {
      console.error('Error loading stories:', e);
      storyGrid.innerHTML = '<p>Error loading stories. Please refresh the page.</p>';
    }
  },

  loadForYouContent() {
    const container = document.getElementById('forYouArticles');
    if (!container) return;

    container.innerHTML = '';

    try {
      const publishedArticles = DATA_STORE.getArticlesByStatus('published');

      publishedArticles.slice(0, HOME_LIMITS.FOR_YOU_ARTICLES).forEach(article => {
        const isFollowing = AppState.followedAuthors.has(article.authorId);
        const avatar = DataManager.getUserAvatar(article.authorId);
        const readingTime = Utils.getReadingTime(article.content);

        const storyDiv = document.createElement('div');
        storyDiv.className = 'recommended-story';
        storyDiv.dataset.articleId = article.id;

        storyDiv.innerHTML = `
          <div class="story-meta" style="margin-bottom: 12px;">
            <img src="${Utils.escapeHtml(avatar)}" alt="${Utils.escapeHtml(article.author)}" class="author-avatar">
            <span class="author-name">${Utils.escapeHtml(article.author)}</span>
            <span>•</span>
            <button class="btn-follow ${isFollowing ? 'following' : ''}" data-author-id="${article.authorId}">
              ${isFollowing ? 'Following' : '+ Follow'}
            </button>
          </div>
          <div style="font-size: 0.85em; color: var(--text-medium); font-style: italic; margin-bottom: 12px;">
            💭 Recommended for you
          </div>
          <h3 style="font-family: 'Playfair Display', serif; font-size: 1.8em; font-weight: 700; line-height: 1.3; margin-bottom: 12px; color: var(--text-dark);">
            ${Utils.escapeHtml(article.title)}
          </h3>
          <p style="font-size: 1em; line-height: 1.6; color: var(--text-medium); margin-bottom: 16px;">
            ${Utils.escapeHtml(article.summary)}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 0.85em; color: var(--text-light);">
              ⏱️ ${readingTime} min read • 💬 ${article.engagement}
            </div>
            <div style="display: flex; gap: 16px;">
              <span class="story-action save-btn">📖 Save</span>
            </div>
          </div>
        `;

        container.appendChild(storyDiv);

        // Add click handler for navigation
        storyDiv.addEventListener('click', function(e) {
          if (e.target.classList.contains('btn-follow') || 
              e.target.classList.contains('save-btn')) {
            return;
          }
          window.location.href = `article.html?id=${article.id}`;
        });
      });
    } catch (e) {
      console.error('Error loading For You content:', e);
      container.innerHTML = '<p>Error loading recommendations. Please refresh the page.</p>';
    }
  },

  loadFollowingContent() {
    const emptyState = document.getElementById('followingEmptyState');
    const articlesList = document.getElementById('followingArticlesList');

    if (!emptyState || !articlesList) return;

    if (AppState.followedAuthors.size === 0) {
      emptyState.style.display = 'block';
      articlesList.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    articlesList.style.display = 'block';

    try {
      const allUsers = DATA_STORE.getUsers();
      const followedAuthorsList = allUsers.filter(user => 
        AppState.followedAuthors.has(user.id)
      );

      const authorsHTML = followedAuthorsList.map(author => {
        const authorArticles = DATA_STORE.getArticlesByAuthor(author.id);
        const publishedCount = authorArticles.filter(a => a.status === 'published').length;
        const topics = DataManager.getAuthorTopics(author.id);

        return `
          <div class="followed-author">
            <img src="${Utils.escapeHtml(author.avatar)}" alt="${Utils.escapeHtml(author.name)}" class="author-avatar-large">
            <h4>${Utils.escapeHtml(author.name)}</h4>
            <p class="author-bio">${Utils.escapeHtml(author.bio)}</p>
            <div class="author-stats">
              <div class="author-stat">
                <span class="stat-number-small">${publishedCount}</span>
                <span class="stat-label-small">Stories</span>
              </div>
              <div class="author-stat">
                <span class="stat-number-small">${author.followers}</span>
                <span class="stat-label-small">Followers</span>
              </div>
            </div>
            <div class="author-topics">
              ${topics.map(topic => `<span class="topic-tag">${Utils.escapeHtml(topic)}</span>`).join('')}
            </div>
            <button class="btn-unfollow" data-author-id="${author.id}">Unfollow</button>
          </div>
        `;
      }).join('');

      articlesList.innerHTML = `<div class="followed-list">${authorsHTML}</div>`;

      // Setup unfollow button event listeners
      articlesList.querySelectorAll('.btn-unfollow').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          Actions.handleUnfollow(parseInt(this.dataset.authorId));
        });
      });
    } catch (e) {
      console.error('Error loading following content:', e);
      articlesList.innerHTML = '<p>Error loading followed authors. Please refresh the page.</p>';
    }
  }
};

// ============================================================================
// USER ACTIONS
// ============================================================================
const Actions = {
  toggleFollow(btn) {
    if (!btn || !btn.dataset.authorId) return;

    const authorId = parseInt(btn.dataset.authorId);
    const wasFollowing = AppState.followedAuthors.has(authorId);

    if (wasFollowing) {
      AppState.followedAuthors.delete(authorId);
      btn.textContent = '+ Follow';
      btn.classList.remove('following');
    } else {
      AppState.followedAuthors.add(authorId);
      btn.textContent = 'Following';
      btn.classList.add('following');
    }

    DataManager.saveFollowedAuthors();

    // Update all follow buttons for this author
    document.querySelectorAll(`[data-author-id="${authorId}"]`).forEach(button => {
      if (button.classList.contains('btn-follow')) {
        if (AppState.followedAuthors.has(authorId)) {
          button.textContent = 'Following';
          button.classList.add('following');
        } else {
          button.textContent = '+ Follow';
          button.classList.remove('following');
        }
      }
    });

    // Reload following tab if active
    const followingContent = document.getElementById('following-content');
    if (followingContent?.classList.contains('active')) {
      ContentLoader.loadFollowingContent();
    }
  },

  handleUnfollow(authorId) {
    if (!confirm('Unfollow this author?')) return;

    AppState.followedAuthors.delete(authorId);
    DataManager.saveFollowedAuthors();

    // Update all follow buttons
    document.querySelectorAll(`[data-author-id="${authorId}"]`).forEach(button => {
      if (button.classList.contains('btn-follow')) {
        button.textContent = '+ Follow';
        button.classList.remove('following');
      }
    });

    ContentLoader.loadFollowingContent();
  },

  toggleSave(btn) {
    if (!btn) return;

    if (btn.textContent.includes('Save')) {
      btn.textContent = '✓ Saved';
      btn.style.color = 'var(--primary)';
    } else {
      btn.textContent = '📖 Save';
      btn.style.color = '';
    }
  }
};

// ============================================================================
// NAVIGATION MODULE
// ============================================================================
const Navigation = {
  setupTabNavigation() {
    const tabs = document.querySelectorAll('.nav-tab[data-tab]');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', function(e) {
        e.preventDefault();
        const tabName = this.dataset.tab;

        // Check authentication for protected tabs
        if ((tabName === 'for-you' || tabName === 'following') && !AppState.isAuthenticated) {
          alert('Please login to access this feature');
          window.location.href = '../../login.html';
          return;
        }

        Navigation.showTab(tabName);

        // Update active state
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
      });
    });
  },

  showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    // Show selected tab
    const targetContent = document.getElementById(tabName + '-content');
    if (!targetContent) return;

    targetContent.classList.add('active');

    // Load content for specific tabs
    if (tabName === 'for-you') {
      ContentLoader.loadForYouContent();
    } else if (tabName === 'following') {
      ContentLoader.loadFollowingContent();
    }
  }
};

// ============================================================================
// EVENT HANDLERS
// ============================================================================
const EventHandlers = {
  setupGlobalListeners() {
    // Story card clicks
    document.addEventListener('click', function(e) {
      const storyCard = e.target.closest('.story-card');
      if (storyCard && 
          !e.target.closest('.btn-follow') && 
          !e.target.closest('.save-btn')) {
        const articleId = storyCard.dataset.articleId;
        if (articleId) {
          window.location.href = `article.html?id=${articleId}`;
        }
      }
    });

    // Follow buttons
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('btn-follow')) {
        e.stopPropagation();
        
        if (!AppState.isAuthenticated) {
          alert('Please login to follow authors');
          window.location.href = '../../login.html';
          return;
        }
        
        Actions.toggleFollow(e.target);
      }
    });

    // Save buttons
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('save-btn')) {
        e.stopPropagation();
        
        if (!AppState.isAuthenticated) {
          alert('Please login to save articles');
          window.location.href = '../../login.html';
          return;
        }
        
        Actions.toggleSave(e.target);
      }
    });

    // Listen button (if exists)
    const listenBtn = document.querySelector('.btn-listen');
    if (listenBtn) {
      listenBtn.addEventListener('click', function() {
        alert('Audio feature coming soon!');
      });
    }
  }
};

// ============================================================================
// INITIALIZATION
// ============================================================================
function init() {
  try {
    DataManager.loadFollowedAuthors();
    Auth.checkSession();
    ContentLoader.loadStories();
    EventHandlers.setupGlobalListeners();
    Navigation.setupTabNavigation();
  } catch (e) {
    console.error('Initialization error:', e);
    alert('An error occurred while loading the page. Please refresh.');
  }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
