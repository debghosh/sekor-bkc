// home.js - Authenticated Homepage JavaScript
// Enhanced version with full save functionality and tag management

// ============================================================================
// CONSTANTS (Unique to home.js)
// ============================================================================
const HOME_STORAGE_KEYS = {
  USER: 'kcc_user',
  ROLE: 'kcc_role',
  FOLLOWED_AUTHORS: 'kcc_followed_authors',
  SAVED_STORIES: 'kcc_saved_stories'
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
  followedAuthors: new Set(),
  savedStories: new Map(),
  currentStoryToSave: null,
  currentStoryTags: [],
  currentFilter: 'all'
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
    if (!content) return HOME_LIMITS.DEFAULT_READING_TIME;
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
      // Don't remove followed authors or saved stories - keep them for next login
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

  loadSavedStories() {
    const saved = Utils.safeLocalStorageGet(HOME_STORAGE_KEYS.SAVED_STORIES, []);
    if (Array.isArray(saved)) {
      saved.forEach(item => {
        AppState.savedStories.set(item.articleId, {
          articleId: item.articleId,
          tags: item.tags || [],
          savedAt: item.savedAt || new Date().toISOString()
        });
      });
    }
  },

  saveSavedStories() {
    const storiesArray = Array.from(AppState.savedStories.values());
    Utils.safeLocalStorageSet(HOME_STORAGE_KEYS.SAVED_STORIES, storiesArray);
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
  },

  getAllTags() {
    const tags = new Set();
    AppState.savedStories.forEach(saved => {
      saved.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  },

  getTagCount(tag) {
    let count = 0;
    AppState.savedStories.forEach(saved => {
      if (saved.tags.includes(tag)) count++;
    });
    return count;
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
    const forYouTab = document.querySelector('.nav-tab[data-tab="for-you"]');
    const followingTab = document.querySelector('.nav-tab[data-tab="following"]');
    const savedTab = document.querySelector('.nav-tab[data-tab="saved"]');

    if (!forYouTab || !followingTab || !savedTab) return;

    if (AppState.isAuthenticated) {
      [forYouTab, followingTab, savedTab].forEach(tab => {
        tab.style.opacity = '1';
        tab.style.cursor = 'pointer';
        tab.title = '';
      });
    } else {
      [forYouTab, followingTab, savedTab].forEach(tab => {
        tab.style.opacity = '0.5';
        tab.style.cursor = 'not-allowed';
        tab.title = 'Login to access this feature';
      });
    }
  },

  createStoryCard(article) {
    const card = document.createElement('article');
    card.className = 'story-card';
    card.dataset.articleId = article.id;

    const isFollowing = AppState.followedAuthors.has(article.authorId);
    const isSaved = AppState.savedStories.has(article.id);
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
        <span class="story-action save-btn ${isSaved ? 'saved' : ''}" data-article-id="${article.id}">
          ${isSaved ? '✓ Saved' : '🔖 Save'}
        </span>
      </div>
    `;

    return card;
  },

  createSavedStoryCard(article, tags) {
    const card = document.createElement('article');
    card.className = 'story-card';
    card.dataset.articleId = article.id;

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
      </div>
      <span class="category-tag">${Utils.escapeHtml(article.category)}</span>
      ${tags.length > 0 ? `
        <div class="story-tags">
          ${tags.map(tag => `<span class="story-tag">${Utils.escapeHtml(tag)}</span>`).join('')}
        </div>
      ` : ''}
      <h2 class="story-title">${Utils.escapeHtml(article.title)}</h2>
      <p class="story-summary">${Utils.escapeHtml(article.summary)}</p>
      <div class="story-actions">
        <span class="story-action">⏱️ ${readingTime} min read</span>
        <span class="story-action">💬 ${article.engagement}</span>
        <span class="story-action unsave-btn" data-article-id="${article.id}">
          ✓ Saved
        </span>
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
        const isSaved = AppState.savedStories.has(article.id);
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
              <span class="story-action save-btn ${isSaved ? 'saved' : ''}" data-article-id="${article.id}">
                ${isSaved ? '✓ Saved' : '🔖 Save'}
              </span>
            </div>
          </div>
        `;

        container.appendChild(storyDiv);

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
  },

  loadSavedStories() {
    const grid = document.getElementById('savedStoriesGrid');
    if (!grid) return;

    if (AppState.savedStories.size === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="font-size: 5em; margin-bottom: 20px; opacity: 0.3;">🔖</div>
          <h3 style="font-size: 1.8rem; margin-bottom: 12px; color: #1a1a1a;">No saved stories yet</h3>
          <p style="font-size: 1.1rem; color: #666; margin-bottom: 24px;">Save stories to read them later with custom tags</p>
          <a href="#" class="btn-primary" onclick="showTab('home'); return false;">
            Browse Stories
          </a>
        </div>
      `;
      SavedStories.updateTagFilters();
      return;
    }

    // Filter stories based on current filter
    let filteredStories = Array.from(AppState.savedStories.entries());
    
    if (AppState.currentFilter !== 'all') {
      filteredStories = filteredStories.filter(([_, saved]) => 
        saved.tags.includes(AppState.currentFilter)
      );
    }

    if (filteredStories.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="font-size: 5em; margin-bottom: 20px; opacity: 0.3;">🏷️</div>
          <h3 style="font-size: 1.8rem; margin-bottom: 12px; color: #1a1a1a;">No stories with "${Utils.escapeHtml(AppState.currentFilter)}" tag</h3>
          <p style="font-size: 1.1rem; color: #666;">Try selecting a different tag.</p>
        </div>
      `;
    } else {
      grid.innerHTML = '';
      filteredStories.forEach(([articleId, saved]) => {
        const article = DATA_STORE.getArticleById(articleId);
        if (article) {
          const card = UI.createSavedStoryCard(article, saved.tags);
          grid.appendChild(card);
        }
      });
    }

    SavedStories.updateTagFilters();
  }
};

// ============================================================================
// SAVED STORIES MODULE
// ============================================================================
const SavedStories = {
  openModal(article) {
    AppState.currentStoryToSave = article;
    AppState.currentStoryTags = [];
    
    document.getElementById('modalStoryTitle').textContent = article.title;
    document.getElementById('tagsDisplay').innerHTML = '';
    document.getElementById('tagInput').value = '';
    document.getElementById('saveModal').style.display = 'flex';
    
    // Focus on input
    setTimeout(() => {
      document.getElementById('tagInput').focus();
    }, 100);
  },

  closeModal() {
    document.getElementById('saveModal').style.display = 'none';
    AppState.currentStoryToSave = null;
    AppState.currentStoryTags = [];
  },

  handleTagInput(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      const input = document.getElementById('tagInput');
      const tag = input.value.trim();
      
      if (tag && !AppState.currentStoryTags.includes(tag)) {
        AppState.currentStoryTags.push(tag);
        this.renderTags();
        input.value = '';
      }
    }
  },

  addSuggestedTag(tag) {
    if (!AppState.currentStoryTags.includes(tag)) {
      AppState.currentStoryTags.push(tag);
      this.renderTags();
    }
  },

  removeTag(tag) {
    AppState.currentStoryTags = AppState.currentStoryTags.filter(t => t !== tag);
    this.renderTags();
  },

  renderTags() {
    const display = document.getElementById('tagsDisplay');
    display.innerHTML = AppState.currentStoryTags.map(tag => `
      <span class="tag-pill">
        ${Utils.escapeHtml(tag)}
        <button class="tag-remove" onclick="SavedStories.removeTag('${Utils.escapeHtml(tag).replace(/'/g, "\\'")}')">&times;</button>
      </span>
    `).join('');
  },

  confirmSave() {
    if (!AppState.currentStoryToSave) return;

    const articleId = AppState.currentStoryToSave.id;
    
    AppState.savedStories.set(articleId, {
      articleId: articleId,
      tags: [...AppState.currentStoryTags],
      savedAt: new Date().toISOString()
    });

    DataManager.saveSavedStories();

    // Update all save buttons for this story
    document.querySelectorAll(`[data-article-id="${articleId}"]`).forEach(btn => {
      if (btn.classList.contains('save-btn')) {
        btn.textContent = '✓ Saved';
        btn.classList.add('saved');
      }
    });

    this.closeModal();

    // Show success message
    alert('Story saved successfully!');

    // Reload saved stories if on that tab
    const savedTab = document.querySelector('.nav-tab[data-tab="saved"]');
    if (savedTab?.classList.contains('active')) {
      ContentLoader.loadSavedStories();
    }
  },

  unsaveStory(articleId) {
    if (!confirm('Remove this story from your saved list?')) return;

    AppState.savedStories.delete(articleId);
    DataManager.saveSavedStories();

    // Update all save buttons
    document.querySelectorAll(`[data-article-id="${articleId}"]`).forEach(btn => {
      if (btn.classList.contains('save-btn') || btn.classList.contains('unsave-btn')) {
        btn.textContent = '🔖 Save';
        btn.classList.remove('saved');
        btn.classList.remove('unsave-btn');
        btn.classList.add('save-btn');
      }
    });

    // Reload saved stories
    ContentLoader.loadSavedStories();
  },

  updateTagFilters() {
    const tagFiltersContainer = document.getElementById('tagFilters');
    const allCountSpan = document.getElementById('allCount');

    if (!tagFiltersContainer || !allCountSpan) return;

    // Update all count
    allCountSpan.textContent = AppState.savedStories.size;

    // Get all unique tags with counts
    const allTags = DataManager.getAllTags();

    if (allTags.length === 0) {
      tagFiltersContainer.innerHTML = '';
      return;
    }

    // Render tag filters
    tagFiltersContainer.innerHTML = allTags.map(tag => {
      const count = DataManager.getTagCount(tag);
      const isActive = AppState.currentFilter === tag;
      return `
        <button class="filter-btn ${isActive ? 'active' : ''}" data-filter="${Utils.escapeHtml(tag)}" onclick="filterSavedStories('${Utils.escapeHtml(tag).replace(/'/g, "\\'")}')">
          ${Utils.escapeHtml(tag)} <span>${count}</span>
        </button>
      `;
    }).join('');
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

  handleSaveClick(btn) {
    if (!btn) return;

    const articleId = parseInt(btn.dataset.articleId);
    const article = DATA_STORE.getArticleById(articleId);
    
    if (!article) return;

    if (!AppState.isAuthenticated) {
      alert('Please login to save articles');
      window.location.href = '../../login.html';
      return;
    }

    if (AppState.savedStories.has(articleId)) {
      // Already saved - unsave it
      SavedStories.unsaveStory(articleId);
    } else {
      // Open modal to add tags
      SavedStories.openModal(article);
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
        if ((tabName === 'for-you' || tabName === 'following' || tabName === 'saved') && !AppState.isAuthenticated) {
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
    } else if (tabName === 'saved') {
      ContentLoader.loadSavedStories();
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
          !e.target.closest('.save-btn') &&
          !e.target.closest('.unsave-btn')) {
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
        Actions.handleSaveClick(e.target);
      }
    });

    // Unsave buttons
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('unsave-btn')) {
        e.stopPropagation();
        const articleId = parseInt(e.target.dataset.articleId);
        SavedStories.unsaveStory(articleId);
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
// GLOBAL FUNCTIONS (for onclick handlers in HTML)
// ============================================================================
function showTab(tabName) {
  Navigation.showTab(tabName);
}

function closeSaveModal() {
  SavedStories.closeModal();
}

function handleTagInput(event) {
  SavedStories.handleTagInput(event);
}

function addSuggestedTag(tag) {
  SavedStories.addSuggestedTag(tag);
}

function confirmSaveStory() {
  SavedStories.confirmSave();
}

function filterSavedStories(filter) {
  AppState.currentFilter = filter;
  
  // Update active state on filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.filter === filter) {
      btn.classList.add('active');
    }
  });

  // Reload saved stories with filter
  ContentLoader.loadSavedStories();
}

// ============================================================================
// INITIALIZATION
// ============================================================================
function init() {
  try {
    DataManager.loadFollowedAuthors();
    DataManager.loadSavedStories();
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