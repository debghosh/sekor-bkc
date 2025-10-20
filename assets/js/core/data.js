// data.js - Central Data Store with Validation & Error Handling
// Refactored version with all fixes applied

// ============================================================================
// CONSTANTS
// ============================================================================
const STORAGE_KEYS = {
  ARTICLES: 'kcc_articles',
  USERS: 'kcc_users'
};

const ARTICLE_STATUS = {
  DRAFT: 'draft',
  REVIEW: 'review',
  PUBLISHED: 'published'
};

const USER_ROLES = {
  ADMIN: 'admin',
  AUTHOR: 'author',
  EDITOR: 'editor',
  READER: 'reader'
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================
const Validators = {
  isValidArticle(article) {
    if (!article || typeof article !== 'object') return false;
    
    const required = ['title', 'category', 'summary', 'content', 'author', 'authorId', 'status'];
    const hasRequired = required.every(field => article.hasOwnProperty(field));
    
    if (!hasRequired) return false;
    if (!Object.values(ARTICLE_STATUS).includes(article.status)) return false;
    if (typeof article.authorId !== 'number') return false;
    
    return true;
  },

  isValidUser(user) {
    if (!user || typeof user !== 'object') return false;
    
    const required = ['id', 'name', 'email', 'role'];
    const hasRequired = required.every(field => user.hasOwnProperty(field));
    
    if (!hasRequired) return false;
    if (!Object.values(USER_ROLES).includes(user.role)) return false;
    if (typeof user.id !== 'number') return false;
    
    return true;
  },

  sanitizeArticleUpdates(updates) {
    const allowed = [
      'title', 'category', 'image', 'summary', 'content', 
      'status', 'views', 'engagement', 'publishDate'
    ];
    
    const sanitized = {};
    for (const key of allowed) {
      if (updates.hasOwnProperty(key)) {
        sanitized[key] = updates[key];
      }
    }
    
    return sanitized;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const StorageUtils = {
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
      if (e.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded');
        alert('Storage limit reached. Please clear some data.');
      } else {
        console.error(`localStorage set error for key "${key}":`, e);
      }
      return false;
    }
  },

  generateUniqueId(existingIds = []) {
    // Generate timestamp-based ID with random component
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    let newId = timestamp * 10000 + random;
    
    // Ensure uniqueness
    while (existingIds.includes(newId)) {
      newId++;
    }
    
    return newId;
  }
};

// ============================================================================
// INITIAL DATA
// ============================================================================
const INITIAL_DATA = {
  users: [
    {
      id: 1,
      name: "Priya Chatterjee",
      email: "priya@kcc.in",
      role: USER_ROLES.AUTHOR,
      avatar: "https://i.pravatar.cc/150?img=1",
      bio: "Covering Kolkata's heritage & urban development",
      followers: 1243
    },
    {
      id: 2,
      name: "Arnab Sen",
      email: "arnab@kcc.in",
      role: USER_ROLES.AUTHOR,
      avatar: "https://i.pravatar.cc/150?img=2",
      bio: "Political correspondent & investigative journalist",
      followers: 2156
    },
    {
      id: 3,
      name: "Moumita Roy",
      email: "moumita@kcc.in",
      role: USER_ROLES.EDITOR,
      avatar: "https://i.pravatar.cc/150?img=3",
      bio: "Managing Editor focusing on arts & culture",
      followers: 876
    },
    {
      id: 4,
      name: "Arijit Mukherjee",
      email: "arijit@kcc.in",
      role: USER_ROLES.AUTHOR,
      avatar: "https://i.pravatar.cc/150?img=4",
      bio: "Food critic & cultural commentator",
      followers: 3421
    },
    {
      id: 5,
      name: "Shreya Das",
      email: "shreya@kcc.in",
      role: USER_ROLES.AUTHOR,
      avatar: "https://i.pravatar.cc/150?img=5",
      bio: "Metro correspondent covering local governance",
      followers: 987
    },
    {
      id: 6,
      name: "Rahul Bose",
      email: "rahul@kcc.in",
      role: USER_ROLES.AUTHOR,
      avatar: "https://i.pravatar.cc/150?img=6",
      bio: "Culinary economist analyzing food culture & business",
      followers: 512
    },
    {
      id: 7,
      name: "Admin User",
      email: "admin@kcc.in",
      role: USER_ROLES.ADMIN,
      avatar: "https://i.pravatar.cc/150?img=7",
      bio: "Administrator",
      followers: 0
    }
  ],

  articles: [
    {
      id: 1,
      title: "The Resurrection of Park Street's Colonial Architecture",
      category: "Heritage",
      image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800",
      summary: "How conservation efforts are bringing new life to Kolkata's iconic colonial buildings while preserving their historical essence.",
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
      author: "Priya Chatterjee",
      authorId: 1,
      status: ARTICLE_STATUS.PUBLISHED,
      publishDate: "2024-10-15",
      views: 1234,
      engagement: 89
    },
    {
      id: 2,
      title: "আড্ডা in the Digital Age: Can WhatsApp Replace the Chai Shop?",
      category: "আড্ডা",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
      summary: "Exploring how Kolkata's beloved tradition of casual conversation is adapting to modern technology.",
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
      author: "Arnab Sen",
      authorId: 2,
      status: ARTICLE_STATUS.PUBLISHED,
      publishDate: "2024-10-14",
      views: 2156,
      engagement: 234
    },
    {
      id: 3,
      title: "Metro Extension Blues: Why South Kolkata Remains Underserved",
      category: "Metro",
      image: "/metro.png",
      summary: "An investigation into the delays and challenges facing Kolkata's metro expansion plans.",
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
      author: "Rahul Bose",
      authorId: 6,
      status: ARTICLE_STATUS.PUBLISHED,
      publishDate: "2024-10-13",
      views: 876,
      engagement: 156
    },
    {
      id: 4,
      title: "মাছ-ভাত: The Soul Food Renaissance",
      category: "মাছ-ভাত",
      image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800",
      summary: "How young chefs are reinventing traditional Bengali fish and rice dishes for a new generation.",
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
      author: "Arijit Mukherjee",
      authorId: 4,
      status: ARTICLE_STATUS.PUBLISHED,
      publishDate: "2024-10-12",
      views: 3421,
      engagement: 298
    }
  ]
};

// ============================================================================
// MAIN DATA STORE
// ============================================================================
const DATA_STORE = {
  articles: [],
  users: [],

  // ========================================================================
  // INITIALIZATION
  // ========================================================================
  init() {
    try {
      this.loadFromLocalStorage();
      console.log('DATA_STORE initialized successfully');
    } catch (e) {
      console.error('Error initializing DATA_STORE:', e);
      this.articles = [...INITIAL_DATA.articles];
      this.users = [...INITIAL_DATA.users];
    }
  },

  // ========================================================================
  // ARTICLE GETTERS
  // ========================================================================
  getArticles() {
    return [...this.articles]; // Return copy to prevent direct mutation
  },

  getArticleById(id) {
    try {
      const articleId = parseInt(id);
      if (isNaN(articleId)) {
        console.error('Invalid article ID:', id);
        return null;
      }
      return this.articles.find(a => a.id === articleId) || null;
    } catch (e) {
      console.error('Error getting article by ID:', e);
      return null;
    }
  },

  getArticlesByAuthor(authorId) {
    try {
      const parsedId = parseInt(authorId);
      if (isNaN(parsedId)) {
        console.error('Invalid author ID:', authorId);
        return [];
      }
      return this.articles.filter(a => a.authorId === parsedId);
    } catch (e) {
      console.error('Error getting articles by author:', e);
      return [];
    }
  },

  getArticlesByStatus(status) {
    try {
      if (!Object.values(ARTICLE_STATUS).includes(status)) {
        console.error('Invalid status:', status);
        return [];
      }
      return this.articles.filter(a => a.status === status);
    } catch (e) {
      console.error('Error getting articles by status:', e);
      return [];
    }
  },

  // ========================================================================
  // USER GETTERS
  // ========================================================================
  getUsers() {
    return [...this.users]; // Return copy to prevent direct mutation
  },

  getUserById(id) {
    try {
      const userId = parseInt(id);
      if (isNaN(userId)) {
        console.error('Invalid user ID:', id);
        return null;
      }
      return this.users.find(u => u.id === userId) || null;
    } catch (e) {
      console.error('Error getting user by ID:', e);
      return null;
    }
  },

  getUserByEmail(email) {
    try {
      if (!email || typeof email !== 'string') {
        console.error('Invalid email:', email);
        return null;
      }
      const normalizedEmail = email.toLowerCase().trim();
      return this.users.find(u => u.email.toLowerCase() === normalizedEmail) || null;
    } catch (e) {
      console.error('Error getting user by email:', e);
      return null;
    }
  },

  // ========================================================================
  // ARTICLE MUTATIONS
  // ========================================================================
  addArticle(articleData) {
    try {
      if (!Validators.isValidArticle(articleData)) {
        console.error('Invalid article data:', articleData);
        return null;
      }

      const existingIds = this.articles.map(a => a.id);
      const newId = StorageUtils.generateUniqueId(existingIds);

      const newArticle = {
        id: newId,
        views: 0,
        engagement: 0,
        publishDate: null,
        ...articleData,
        createdAt: new Date().toISOString()
      };

      this.articles.push(newArticle);
      
      if (this.saveToLocalStorage()) {
        console.log('Article added successfully:', newId);
        return newArticle;
      } else {
        // Rollback if save failed
        this.articles.pop();
        console.error('Failed to save article');
        return null;
      }
    } catch (e) {
      console.error('Error adding article:', e);
      return null;
    }
  },

  updateArticle(articleId, updates) {
    try {
      const parsedId = parseInt(articleId);
      if (isNaN(parsedId)) {
        console.error('Invalid article ID:', articleId);
        return false;
      }

      const article = this.getArticleById(parsedId);
      if (!article) {
        console.error('Article not found:', parsedId);
        return false;
      }

      // Sanitize updates to only allow specific fields
      const sanitizedUpdates = Validators.sanitizeArticleUpdates(updates);
      
      // Create backup for rollback
      const backup = { ...article };
      
      // Apply updates
      Object.assign(article, sanitizedUpdates, {
        updatedAt: new Date().toISOString()
      });

      // Validate updated article
      if (!Validators.isValidArticle(article)) {
        console.error('Updated article failed validation');
        Object.assign(article, backup); // Rollback
        return false;
      }

      if (this.saveToLocalStorage()) {
        console.log('Article updated successfully:', parsedId);
        return true;
      } else {
        Object.assign(article, backup); // Rollback
        console.error('Failed to save updated article');
        return false;
      }
    } catch (e) {
      console.error('Error updating article:', e);
      return false;
    }
  },

  updateArticleStatus(articleId, newStatus) {
    try {
      if (!Object.values(ARTICLE_STATUS).includes(newStatus)) {
        console.error('Invalid status:', newStatus);
        return false;
      }

      const article = this.getArticleById(articleId);
      if (!article) {
        console.error('Article not found:', articleId);
        return false;
      }

      const oldStatus = article.status;
      article.status = newStatus;

      // Auto-set publish date when publishing
      if (newStatus === ARTICLE_STATUS.PUBLISHED && !article.publishDate) {
        article.publishDate = new Date().toISOString().split('T')[0];
      }

      if (this.saveToLocalStorage()) {
        console.log(`Article ${articleId} status changed: ${oldStatus} → ${newStatus}`);
        return true;
      } else {
        article.status = oldStatus; // Rollback
        console.error('Failed to save status update');
        return false;
      }
    } catch (e) {
      console.error('Error updating article status:', e);
      return false;
    }
  },

  deleteArticle(articleId) {
    try {
      const parsedId = parseInt(articleId);
      if (isNaN(parsedId)) {
        console.error('Invalid article ID:', articleId);
        return false;
      }

      const index = this.articles.findIndex(a => a.id === parsedId);
      if (index === -1) {
        console.error('Article not found:', parsedId);
        return false;
      }

      // Backup for rollback
      const deletedArticle = this.articles[index];
      
      this.articles.splice(index, 1);

      if (this.saveToLocalStorage()) {
        console.log('Article deleted successfully:', parsedId);
        return true;
      } else {
        // Rollback
        this.articles.splice(index, 0, deletedArticle);
        console.error('Failed to save after delete');
        return false;
      }
    } catch (e) {
      console.error('Error deleting article:', e);
      return false;
    }
  },

  // ========================================================================
  // STATISTICS
  // ========================================================================
  getStats() {
    try {
      return {
        totalArticles: this.articles.length,
        published: this.articles.filter(a => a.status === ARTICLE_STATUS.PUBLISHED).length,
        review: this.articles.filter(a => a.status === ARTICLE_STATUS.REVIEW).length,
        draft: this.articles.filter(a => a.status === ARTICLE_STATUS.DRAFT).length,
        totalViews: this.articles.reduce((sum, a) => sum + (a.views || 0), 0),
        totalEngagement: this.articles.reduce((sum, a) => sum + (a.engagement || 0), 0),
        totalAuthors: this.users.filter(u => u.role === USER_ROLES.AUTHOR).length
      };
    } catch (e) {
      console.error('Error calculating stats:', e);
      return {
        totalArticles: 0,
        published: 0,
        review: 0,
        draft: 0,
        totalViews: 0,
        totalEngagement: 0,
        totalAuthors: 0
      };
    }
  },

  getAuthorStats(authorId) {
    try {
      const parsedId = parseInt(authorId);
      if (isNaN(parsedId)) {
        console.error('Invalid author ID:', authorId);
        return this._getEmptyAuthorStats();
      }

      const articles = this.getArticlesByAuthor(parsedId);
      const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);
      const totalEngagement = articles.reduce((sum, a) => sum + (a.engagement || 0), 0);

      return {
        totalArticles: articles.length,
        published: articles.filter(a => a.status === ARTICLE_STATUS.PUBLISHED).length,
        totalViews,
        avgEngagement: articles.length > 0 
          ? Math.round(totalEngagement / articles.length)
          : 0
      };
    } catch (e) {
      console.error('Error calculating author stats:', e);
      return this._getEmptyAuthorStats();
    }
  },

  _getEmptyAuthorStats() {
    return {
      totalArticles: 0,
      published: 0,
      totalViews: 0,
      avgEngagement: 0
    };
  },

  // ========================================================================
  // PERSISTENCE
  // ========================================================================
  saveToLocalStorage() {
    try {
      const articlesSuccess = StorageUtils.safeLocalStorageSet(
        STORAGE_KEYS.ARTICLES, 
        this.articles
      );
      const usersSuccess = StorageUtils.safeLocalStorageSet(
        STORAGE_KEYS.USERS, 
        this.users
      );

      return articlesSuccess && usersSuccess;
    } catch (e) {
      console.error('Error saving to localStorage:', e);
      return false;
    }
  },

  loadFromLocalStorage() {
    try {
      const articles = StorageUtils.safeLocalStorageGet(
        STORAGE_KEYS.ARTICLES, 
        INITIAL_DATA.articles
      );
      const users = StorageUtils.safeLocalStorageGet(
        STORAGE_KEYS.USERS, 
        INITIAL_DATA.users
      );

      // Validate loaded data
      this.articles = Array.isArray(articles) ? articles : INITIAL_DATA.articles;
      this.users = Array.isArray(users) ? users : INITIAL_DATA.users;

      console.log(`Loaded ${this.articles.length} articles and ${this.users.length} users`);
    } catch (e) {
      console.error('Error loading from localStorage:', e);
      this.articles = [...INITIAL_DATA.articles];
      this.users = [...INITIAL_DATA.users];
    }
  },

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================
  clearAllData() {
    if (!confirm('This will delete ALL data. Are you sure?')) {
      return false;
    }

    try {
      localStorage.removeItem(STORAGE_KEYS.ARTICLES);
      localStorage.removeItem(STORAGE_KEYS.USERS);
      this.articles = [...INITIAL_DATA.articles];
      this.users = [...INITIAL_DATA.users];
      this.saveToLocalStorage();
      console.log('All data cleared and reset to initial state');
      return true;
    } catch (e) {
      console.error('Error clearing data:', e);
      return false;
    }
  },

  exportData() {
    try {
      return {
        articles: this.articles,
        users: this.users,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
    } catch (e) {
      console.error('Error exporting data:', e);
      return null;
    }
  },

  importData(data) {
    try {
      if (!data || !data.articles || !data.users) {
        console.error('Invalid import data format');
        return false;
      }

      // Validate all data before importing
      const articlesValid = data.articles.every(a => Validators.isValidArticle(a));
      const usersValid = data.users.every(u => Validators.isValidUser(u));

      if (!articlesValid || !usersValid) {
        console.error('Import data failed validation');
        return false;
      }

      // Create backup
      const backup = {
        articles: [...this.articles],
        users: [...this.users]
      };

      // Import
      this.articles = data.articles;
      this.users = data.users;

      if (this.saveToLocalStorage()) {
        console.log('Data imported successfully');
        return true;
      } else {
        // Rollback
        this.articles = backup.articles;
        this.users = backup.users;
        console.error('Failed to save imported data');
        return false;
      }
    } catch (e) {
      console.error('Error importing data:', e);
      return false;
    }
  }
};

// ============================================================================
// INITIALIZATION
// ============================================================================
DATA_STORE.init();

// Export for use in other modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DATA_STORE, ARTICLE_STATUS, USER_ROLES };
}
