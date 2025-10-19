// app.js - Landing Page & Public View JavaScript
// Refactored version with all fixes applied

// ============================================================================
// CONSTANTS
// ============================================================================
const STORAGE_KEYS = {
  AUTH: 'isAuthenticated',
  USER: 'currentUser',
  FOLLOWED: 'followedAuthors',
  SAVED: 'savedStories'
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
const AppState = {
  currentUser: null,
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
      console.error(`localStorage get error for key "${key}":`, e);
      return fallback;
    }
  },

  safeLocalStorageSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`localStorage set error for key "${key}":`, e);
      return false;
    }
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}`;
    } catch (e) {
      return 'Invalid Date';
    }
  }
};

// ============================================================================
// AUTHENTICATION MODULE
// ============================================================================
const Auth = {
  checkAuthentication() {
    try {
      const authStatus = Utils.safeLocalStorageGet(STORAGE_KEYS.AUTH);
      const userData = Utils.safeLocalStorageGet(STORAGE_KEYS.USER);

      if (authStatus === true && userData) {
        AppState.currentUser = userData;
        this.loadUserData();
        UI.showAuthenticatedView();
      } else {
        UI.showPublicView();
      }
    } catch (e) {
      console.error('Error checking authentication:', e);
      UI.showPublicView();
    }
  },

  loadUserData() {
    try {
      const followedData = Utils.safeLocalStorageGet(STORAGE_KEYS.FOLLOWED, []);
      if (Array.isArray(followedData)) {
        followedData.forEach(id => AppState.followedAuthors.add(id));
      }

      const savedData = Utils.safeLocalStorageGet(STORAGE_KEYS.SAVED, []);
      if (Array.isArray(savedData)) {
        AppState.savedStories = new Map(savedData);
      }
    } catch (e) {
      console.error('Error loading user data:', e);
    }
  },

  logout() {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.reload();
    } catch (e) {
      console.error('Logout error:', e);
      alert('Error logging out. Please try again.');
    }
  }
};

// ============================================================================
// UI MODULE
// ============================================================================
const UI = {
  showPublicView() {
    const publicLanding = document.getElementById('publicLanding');
    const authenticatedHome = document.getElementById('authenticatedHome');
    const headerAuthSection = document.getElementById('headerAuthSection');

    if (publicLanding) publicLanding.style.display = 'block';
    if (authenticatedHome) authenticatedHome.style.display = 'none';
    if (headerAuthSection) {
      headerAuthSection.innerHTML = '<a href="login.html" class="btn-subscribe">Login / Subscribe</a>';
    }

    ContentLoader.loadPublicStories();
  },

  showAuthenticatedView() {
    const publicLanding = document.getElementById('publicLanding');
    const authenticatedHome = document.getElementById('authenticatedHome');
    const headerAuthSection = document.getElementById('headerAuthSection');

    if (publicLanding) publicLanding.style.display = 'none';
    if (authenticatedHome) authenticatedHome.style.display = 'block';
    if (headerAuthSection) {
      const logoutBtn = document.createElement('button');
      logoutBtn.className = 'btn-secondary';
      logoutBtn.textContent = 'Logout';
      logoutBtn.addEventListener('click', Auth.logout);
      headerAuthSection.innerHTML = '';
      headerAuthSection.appendChild(logoutBtn);
    }

    ContentLoader.loadHomeStories();
    Navigation.setupTabs();
  },

  createStoryCard(article, options = {}) {
    const {
      showFollowButton = true,
      showSaveButton = true
    } = options;

    const card = document.createElement('article');
    card.className = 'story-card';

    const isFollowing = AppState.followedAuthors.has(article.authorId);
    const isSaved = AppState.savedStories.has(article.id);

    let followButtonHTML = '';
    if (showFollowButton && AppState.currentUser) {
      followButtonHTML = `
        <button class="btn-follow ${isFollowing ? 'following' : ''}" data-author-id="${article.authorId}">
          ${isFollowing ? 'Following' : '+ Follow'}
        </button>
      `;
    }

    let saveButtonHTML = '';
    if (showSaveButton && AppState.currentUser) {
      saveButtonHTML = `
        <button class="story-action bookmark-btn ${isSaved ? 'saved' : ''}" data-story-id="${article.id}">
          ${isSaved ? '✓ Saved' : '📖 Save'}
        </button>
      `;
    }

    card.innerHTML = `
      <img src="${Utils.escapeHtml(article.image)}" alt="${Utils.escapeHtml(article.title)}" class="story-image">
      <div class="story-meta">
        <img src="${Utils.escapeHtml(article.author?.avatar || '')}" alt="${Utils.escapeHtml(article.author)}" class="author-avatar">
        <span class="author-name">${Utils.escapeHtml(article.author)}</span>
        <span>•</span>
        <span>${Utils.formatDate(article.publishDate)}</span>
        ${followButtonHTML}
      </div>
      <span class="category-tag">${Utils.escapeHtml(article.category)}</span>
      <h2 class="story-title">${Utils.escapeHtml(article.title)}</h2>
      <p class="story-summary">${Utils.escapeHtml(article.summary)}</p>
      <div class="story-actions">
        <span class="story-action">⏱️ 6 min read</span>
        <button class="audio-badge" data-article-title="${Utils.escapeHtml(article.title)}" data-article-summary="${Utils.escapeHtml(article.summary)}">🎧 Listen</button>
        <span class="story-action">💬 ${article.engagement || 0}</span>
        ${saveButtonHTML}
      </div>
    `;

    // Attach event listeners
    if (showFollowButton) {
      const followBtn = card.querySelector('.btn-follow');
      if (followBtn) {
        followBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          Actions.toggleFollow(article.authorId, followBtn);
        });
      }
    }

    if (showSaveButton) {
      const saveBtn = card.querySelector('.bookmark-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          Actions.handleSaveClick(article, saveBtn);
        });
      }
    }

    // Audio button
    const audioBtn = card.querySelector('.audio-badge');
    if (audioBtn) {
      audioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        Audio.playArticleAudio(
          audioBtn.dataset.articleTitle,
          audioBtn.dataset.articleSummary
        );
      });
    }

    return card;
  },

  createAuthorCard(author) {
    const card = document.createElement('div');
    card.className = 'author-card';

    card.innerHTML = `
      <img src="${Utils.escapeHtml(author.avatar)}" alt="${Utils.escapeHtml(author.name)}" class="author-card-avatar">
      <h3 class="author-card-name">${Utils.escapeHtml(author.name)}</h3>
      <p class="author-card-bio">${Utils.escapeHtml(author.bio)}</p>
      <div class="author-card-stats">
        <div><strong>${author.stories || 0}</strong> Stories</div>
        <div><strong>${(author.followers || 0).toLocaleString()}</strong> Followers</div>
      </div>
      <div class="author-card-topics">
        ${(author.topics || []).map(topic => `<span class="topic-tag">${Utils.escapeHtml(topic)}</span>`).join('')}
      </div>
      <button class="btn-unfollow" data-author-id="${author.id}">Unfollow</button>
    `;

    const unfollowBtn = card.querySelector('.btn-unfollow');
    if (unfollowBtn) {
      unfollowBtn.addEventListener('click', () => {
        Actions.toggleFollow(author.id);
        ContentLoader.loadFollowingAuthors();
      });
    }

    return card;
  }
};

// ============================================================================
// CONTENT LOADER MODULE
// ============================================================================
const ContentLoader = {
  loadPublicStories() {
    const grid = document.getElementById('publicStoriesGrid');
    if (!grid) return;

    try {
      // Mock data for public view
      const publicStories = [
        {
          id: 1,
          title: "The Resurrection of Park Street's Colonial Architecture",
          summary: "How conservation efforts are bringing new life to Kolkata's iconic colonial buildings.",
          author: "Priya Chatterjee",
          authorId: 1,
          image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800",
          category: "Heritage",
          publishDate: "2024-10-15",
          engagement: 89
        },
        {
          id: 2,
          title: "আড্ডা in the Digital Age",
          summary: "Exploring how Kolkata's beloved tradition adapts to modern technology.",
          author: "Arnab Sen",
          authorId: 2,
          image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
          category: "আড্ডা",
          publishDate: "2024-10-14",
          engagement: 234
        }
      ];

      grid.innerHTML = '';
      publicStories.forEach(story => {
        const card = UI.createStoryCard(story, {
          showFollowButton: false,
          showSaveButton: false
        });
        grid.appendChild(card);
      });
    } catch (e) {
      console.error('Error loading public stories:', e);
    }
  },

  loadHomeStories() {
    const grid = document.getElementById('homeStoriesGrid');
    if (!grid) return;

    try {
      // Load stories for authenticated users
      const stories = []; // Would fetch from DATA_STORE in real implementation
      grid.innerHTML = '';
      stories.forEach(story => {
        const card = UI.createStoryCard(story);
        grid.appendChild(card);
      });
    } catch (e) {
      console.error('Error loading home stories:', e);
    }
  },

  loadForYouStories() {
    const container = document.getElementById('forYouStories');
    if (!container) return;

    try {
      // Load personalized recommendations
      container.innerHTML = '<p>Loading recommendations...</p>';
    } catch (e) {
      console.error('Error loading For You stories:', e);
    }
  },

  loadFollowingAuthors() {
    const container = document.getElementById('followingAuthors');
    if (!container) return;

    try {
      if (AppState.followedAuthors.size === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>You're not following anyone yet</h3>
            <p>Follow authors to see their content here.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = '';
      // Would load actual author data in real implementation
    } catch (e) {
      console.error('Error loading following authors:', e);
    }
  },

  loadSavedStories() {
    const grid = document.getElementById('savedStoriesGrid');
    if (!grid) return;

    try {
      if (AppState.savedStories.size === 0) {
        grid.innerHTML = `
          <div class="empty-state">
            <h3>No saved stories yet</h3>
            <p>Save stories to read them later.</p>
          </div>
        `;
        Modal.updateTagFilters();
        return;
      }

      let filteredStories = [...AppState.savedStories.values()];
      if (AppState.currentFilter !== 'all') {
        filteredStories = filteredStories.filter(saved =>
          saved.tags.includes(AppState.currentFilter)
        );
      }

      if (filteredStories.length === 0) {
        grid.innerHTML = `
          <div class="empty-state">
            <h3>No stories with "${Utils.escapeHtml(AppState.currentFilter)}" tag</h3>
            <p>Try selecting a different tag.</p>
          </div>
        `;
      } else {
        grid.innerHTML = '';
        filteredStories.forEach(saved => {
          const card = this.createSavedStoryCard(saved.article, saved.tags);
          grid.appendChild(card);
        });
      }

      Modal.updateTagFilters();
    } catch (e) {
      console.error('Error loading saved stories:', e);
    }
  },

  createSavedStoryCard(article, tags) {
    const card = document.createElement('article');
    card.className = 'story-card';

    const tagsHTML = tags.length > 0
      ? `<div class="story-tags">${tags.map(tag => `<span class="tag-badge">${Utils.escapeHtml(tag)}</span>`).join('')}</div>`
      : '';

    card.innerHTML = `
      <img src="${Utils.escapeHtml(article.image)}" alt="${Utils.escapeHtml(article.title)}" class="story-image">
      <div class="story-meta">
        <img src="${Utils.escapeHtml(article.author?.avatar || '')}" alt="${Utils.escapeHtml(article.author)}" class="author-avatar">
        <span class="author-name">${Utils.escapeHtml(article.author)}</span>
        <span>•</span>
        <span>${Utils.formatDate(article.publishDate)}</span>
      </div>
      <span class="category-tag">${Utils.escapeHtml(article.category)}</span>
      <h2 class="story-title">${Utils.escapeHtml(article.title)}</h2>
      <p class="story-summary">${Utils.escapeHtml(article.summary)}</p>
      ${tagsHTML}
      <div class="story-actions">
        <span class="story-action">⏱️ 6 min read</span>
        <span class="story-action">💬 ${article.engagement || 0}</span>
        <button class="story-action bookmark-btn saved" data-story-id="${article.id}">✓ Saved</button>
      </div>
    `;

    return card;
  }
};

// ============================================================================
// USER ACTIONS MODULE
// ============================================================================
const Actions = {
  toggleFollow(authorId, button = null) {
    try {
      const id = parseInt(authorId);
      if (isNaN(id)) {
        console.error('Invalid author ID:', authorId);
        return;
      }

      const wasFollowing = AppState.followedAuthors.has(id);

      if (wasFollowing) {
        AppState.followedAuthors.delete(id);
        if (button) {
          button.textContent = '+ Follow';
          button.classList.remove('following');
        }
      } else {
        AppState.followedAuthors.add(id);
        if (button) {
          button.textContent = 'Following';
          button.classList.add('following');
        }
      }

      Utils.safeLocalStorageSet(STORAGE_KEYS.FOLLOWED, [...AppState.followedAuthors]);
    } catch (e) {
      console.error('Error toggling follow:', e);
    }
  },

  handleSaveClick(article, button) {
    try {
      if (AppState.savedStories.has(article.id)) {
        // Unsave
        AppState.savedStories.delete(article.id);
        button.textContent = '📖 Save';
        button.classList.remove('saved');
        Utils.safeLocalStorageSet(STORAGE_KEYS.SAVED, [...AppState.savedStories]);

        // Refresh Saved tab if active
        const savedTab = document.querySelector('.nav-tab[data-tab="saved"]');
        if (savedTab?.classList.contains('active')) {
          ContentLoader.loadSavedStories();
        }
      } else {
        // Open modal to add tags
        AppState.currentStoryToSave = article;
        AppState.currentStoryTags = [];
        Modal.openSaveModal(article);
      }
    } catch (e) {
      console.error('Error handling save click:', e);
    }
  }
};

// ============================================================================
// MODAL MODULE
// ============================================================================
const Modal = {
  openSaveModal(article) {
    const modal = document.getElementById('saveModal');
    const titleEl = document.getElementById('modalStoryTitle');
    const tagsDisplay = document.getElementById('tagsDisplay');
    const tagInput = document.getElementById('tagInput');

    if (!modal) return;

    if (titleEl) titleEl.textContent = article.title;
    if (tagsDisplay) tagsDisplay.innerHTML = '';
    if (tagInput) tagInput.value = '';

    modal.style.display = 'flex';
  },

  closeSaveModal() {
    const modal = document.getElementById('saveModal');
    if (modal) modal.style.display = 'none';
    AppState.currentStoryToSave = null;
    AppState.currentStoryTags = [];
  },

  handleTagInput(event) {
    if (event.key !== 'Enter') return;

    event.preventDefault();
    const input = document.getElementById('tagInput');
    if (!input) return;

    const tag = input.value.trim();
    if (tag && !AppState.currentStoryTags.includes(tag)) {
      AppState.currentStoryTags.push(tag);
      this.renderTags();
      input.value = '';
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
    if (!display) return;

    display.innerHTML = AppState.currentStoryTags.map(tag => {
      const escapedTag = Utils.escapeHtml(tag);
      const removeBtn = document.createElement('button');
      removeBtn.className = 'tag-remove';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => this.removeTag(tag));

      return `<span class="tag-pill">${escapedTag}<button class="tag-remove" data-tag="${escapedTag}">×</button></span>`;
    }).join('');

    // Attach event listeners to remove buttons
    display.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.removeTag(btn.dataset.tag);
      });
    });
  },

  confirmSaveStory() {
    if (!AppState.currentStoryToSave) return;

    try {
      AppState.savedStories.set(AppState.currentStoryToSave.id, {
        article: AppState.currentStoryToSave,
        tags: [...AppState.currentStoryTags]
      });

      Utils.safeLocalStorageSet(STORAGE_KEYS.SAVED, [...AppState.savedStories]);

      // Update all save buttons for this story
      document.querySelectorAll(`[data-story-id="${AppState.currentStoryToSave.id}"]`).forEach(btn => {
        btn.textContent = '✓ Saved';
        btn.classList.add('saved');
      });

      this.closeSaveModal();

      // Refresh Saved tab if active
      const savedTab = document.querySelector('.nav-tab[data-tab="saved"]');
      if (savedTab?.classList.contains('active')) {
        ContentLoader.loadSavedStories();
      }
    } catch (e) {
      console.error('Error saving story:', e);
      alert('Failed to save story. Please try again.');
    }
  },

  updateTagFilters() {
    const filtersContainer = document.getElementById('tagFilters');
    if (!filtersContainer) return;

    try {
      const allTags = new Set();
      AppState.savedStories.forEach(saved => {
        saved.tags.forEach(tag => allTags.add(tag));
      });

      const filters = ['all', ...Array.from(allTags)];
      filtersContainer.innerHTML = filters.map(filter => {
        const isActive = filter === AppState.currentFilter;
        return `<button class="filter-btn ${isActive ? 'active' : ''}" data-filter="${Utils.escapeHtml(filter)}">${Utils.escapeHtml(filter)}</button>`;
      }).join('');

      // Attach event listeners
      filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          AppState.currentFilter = btn.dataset.filter;
          ContentLoader.loadSavedStories();
        });
      });
    } catch (e) {
      console.error('Error updating tag filters:', e);
    }
  }
};

// ============================================================================
// AUDIO MODULE
// ============================================================================
const Audio = {
  playBriefAudio() {
    const textEl = document.getElementById('brief-tts');
    if (!textEl) return;

    try {
      const text = textEl.textContent;
      const utterance = new SpeechSynthesisUtterance(text);

      // Set Indian English voice if available
      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(voice =>
        voice.lang === 'en-IN' ||
        voice.name.includes('Indian') ||
        voice.name.includes('Rishi')
      );
      if (indianVoice) {
        utterance.voice = indianVoice;
      }
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Error playing audio:', e);
      alert('Audio playback failed. Please try again.');
    }
  },

  playArticleAudio(title, summary) {
    try {
      const text = `${title}. ${summary}`;
      const utterance = new SpeechSynthesisUtterance(text);

      // Set Indian English voice if available
      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(voice =>
        voice.lang === 'en-IN' ||
        voice.name.includes('Indian') ||
        voice.name.includes('Rishi')
      );
      if (indianVoice) {
        utterance.voice = indianVoice;
      }
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Error playing article audio:', e);
      alert('Audio playback failed. Please try again.');
    }
  }
};

// ============================================================================
// NAVIGATION MODULE
// ============================================================================
const Navigation = {
  setupTabs() {
    const tabs = document.querySelectorAll('.nav-tab[data-tab]');

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = tab.dataset.tab;

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });

        const content = document.getElementById(`${tabName}-content`);
        if (content) {
          content.classList.add('active');

          // Load content based on tab
          if (tabName === 'for-you') {
            ContentLoader.loadForYouStories();
          } else if (tabName === 'following') {
            ContentLoader.loadFollowingAuthors();
          } else if (tabName === 'saved') {
            ContentLoader.loadSavedStories();
          }
        }
      });
    });
  }
};

// ============================================================================
// INITIALIZATION
// ============================================================================
function init() {
  try {
    // Load voices for speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        window.speechSynthesis.getVoices();
      });
    }

    // Close modal when clicking outside
    const modal = document.getElementById('saveModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          Modal.closeSaveModal();
        }
      });
    }

    // Setup tag input handler
    const tagInput = document.getElementById('tagInput');
    if (tagInput) {
      tagInput.addEventListener('keydown', (e) => Modal.handleTagInput(e));
    }

    // Check authentication and load content
    Auth.checkAuthentication();
  } catch (e) {
    console.error('Initialization error:', e);
    alert('An error occurred while loading the page. Please refresh.');
  }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Export for use in HTML (if needed)
if (typeof window !== 'undefined') {
  window.AppActions = {
    playBriefAudio: Audio.playBriefAudio.bind(Audio),
    playArticleAudio: Audio.playArticleAudio.bind(Audio),
    addSuggestedTag: Modal.addSuggestedTag.bind(Modal),
    confirmSaveStory: Modal.confirmSaveStory.bind(Modal)
  };
}
