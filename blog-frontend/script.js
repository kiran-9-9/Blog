// API Configuration
const API_URL = 'https://blog-0d0r.onrender.com'; // Change to your deployed backend URL

// State Management
let currentUser = null;
let currentPostId = null;

// DOM Elements
const authButtons = document.getElementById('authButtons');
const userMenu = document.getElementById('userMenu');
const usernameDisplay = document.getElementById('usernameDisplay');
const postsSection = document.getElementById('postsSection');
const postDetailSection = document.getElementById('postDetailSection');
const postFormSection = document.getElementById('postFormSection');
const postsList = document.getElementById('postsList');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadPosts();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Auth buttons
    document.getElementById('loginBtn').addEventListener('click', () => showModal('login'));
    document.getElementById('registerBtn').addEventListener('click', () => showModal('register'));
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('newPostBtn').addEventListener('click', () => showPostForm());
    
    // Modal switches
    document.getElementById('switchToRegister').addEventListener('click', (e) => {
        e.preventDefault();
        showModal('register');
    });
    document.getElementById('switchToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        showModal('login');
    });
    
    // Close modals
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });
    
    // Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('postForm').addEventListener('submit', handlePostSubmit);
    document.getElementById('cancelFormBtn').addEventListener('click', () => {
        showSection('posts');
    });
    document.getElementById('backBtn').addEventListener('click', () => {
        showSection('posts');
    });
}

// Auth Functions
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        currentUser = JSON.parse(user);
        updateUIForAuth();
    }
}

function updateUIForAuth() {
    if (currentUser) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        usernameDisplay.textContent = `Hello, ${currentUser.username}!`;
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            updateUIForAuth();
            closeModals();
            loadPosts();
            showToast('🎉 Welcome back, ' + data.user.username + '!', 'success');
        } else {
            showToast('❌ ' + (data.message || 'Login failed'), 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('❌ Connection error. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            updateUIForAuth();
            closeModals();
            loadPosts();
            showToast('🎉 Welcome to BlogSpace, ' + data.user.username + '!', 'success');
        } else {
            showToast('❌ ' + (data.message || 'Registration failed'), 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('❌ Connection error. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign Up';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    updateUIForAuth();
    loadPosts();
    showToast('👋 Logged out successfully!', 'success');
}

// Post Functions
async function loadPosts() {
    try {
        // Show loading spinner
        postsList.innerHTML = '<div class="spinner"></div>';
        
        const response = await fetch(`${API_URL}/posts`);
        const posts = await response.json();
        
        // Simulate minimum loading time for smooth UX
        await new Promise(resolve => setTimeout(resolve, 300));
        
        displayPosts(posts);
    } catch (error) {
        console.error('Error loading posts:', error);
        postsList.innerHTML = `
            <div class="empty-state">
                <h3>❌ Error loading posts</h3>
                <p>Please check your connection and try again.</p>
                <button class="btn btn-primary" onclick="loadPosts()" style="margin-top: 1rem;">Retry</button>
            </div>
        `;
    }
}

function displayPosts(posts) {
    if (!Array.isArray(posts) || posts.length === 0) {
        postsList.innerHTML = `
            <div class="empty-state">
                <h3>📝 No posts yet</h3>
                <p>Be the first to create one!</p>
                ${currentUser ? '<button class="btn btn-primary" onclick="showPostForm()" style="margin-top: 1rem;">Create Post</button>' : ''}
            </div>
        `;
        return;
    }
    
    postsList.innerHTML = posts.map((post, index) => `
        <div class="post-card" onclick="viewPost('${post._id}')" style="animation-delay: ${index * 0.1}s">
            <h3>${escapeHtml(post.title)}</h3>
            <div class="post-meta">
                <strong>${escapeHtml(post.authorName)}</strong> • ${formatDate(post.createdAt)}
            </div>
            <p class="post-excerpt">${escapeHtml(truncate(post.content, 200))}</p>
            ${currentUser && (post.author && (currentUser.id === (post.author._id || post.author))) ? `
                <div class="post-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-outline" onclick="editPost('${post._id}')">✏️ Edit</button>
                    <button class="btn btn-danger" onclick="deletePost('${post._id}')">🗑️ Delete</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

async function viewPost(postId) {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}`);
        const post = await response.json();
        
        const isOwner = currentUser && (post.author && (currentUser.id === (post.author._id || post.author)));
        
        document.getElementById('postDetail').innerHTML = `
            <h1>${escapeHtml(post.title)}</h1>
            <div class="post-meta">
                By ${escapeHtml(post.authorName)} • ${formatDate(post.createdAt)}
                ${post.updatedAt && post.updatedAt !== post.createdAt ? ` • Updated ${formatDate(post.updatedAt)}` : ''}
            </div>
            <div class="post-content">${escapeHtml(post.content)}</div>
            ${isOwner ? `
                <div class="post-actions" style="margin-top: 2rem;">
                    <button class="btn btn-outline" onclick="editPost('${post._id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deletePost('${post._id}')">Delete</button>
                </div>
            ` : ''}
        `;
        
        showSection('detail');
    } catch (error) {
        console.error('Error loading post:', error);
        showToast('❌ Error loading post', 'error');
    }
}

function editPost(postId) {
    showPostForm(postId);
}

async function deletePost(postId) {
    if (!confirm('🗑️ Are you sure you want to delete this post? This action cannot be undone.')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showToast('🗑️ Post deleted successfully!', 'success');
            showSection('posts');
            loadPosts();
        } else {
            const data = await response.json();
            showToast('❌ ' + (data.message || 'Error deleting post'), 'error');
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        showToast('❌ Connection error. Please try again.', 'error');
    }
}

// Create / Update Post
async function handlePostSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('❌ Please login to create a post', 'error');
        return;
    }
    
    const postId = document.getElementById('postId').value;
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const token = localStorage.getItem('token');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = postId ? 'Updating...' : 'Publishing...';
    
    try {
        const url = postId ? `${API_URL}/posts/${postId}` : `${API_URL}/posts`;
        const method = postId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, content })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(postId ? '✅ Post updated successfully!' : '🎉 Post published successfully!', 'success');
            showSection('posts');
            loadPosts();
        } else {
            showToast('❌ ' + (data.message || 'Error saving post'), 'error');
        }
    } catch (error) {
        console.error('Error saving post:', error);
        showToast('❌ Connection error. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Publish';
    }
}

function showPostForm(postId = null) {
    if (!currentUser) {
        showToast('❌ Please login to create a post', 'error');
        showModal('login');
        return;
    }
    
    currentPostId = postId;
    
    if (postId) {
        document.getElementById('formTitle').textContent = 'Edit Post';
        loadPostForEdit(postId);
    } else {
        document.getElementById('formTitle').textContent = 'Create New Post';
        document.getElementById('postForm').reset();
        document.getElementById('postId').value = '';
    }
    
    showSection('form');
}

async function loadPostForEdit(postId) {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}`);
        const post = await response.json();
        
        document.getElementById('postId').value = post._id;
        document.getElementById('postTitle').value = post.title;
        document.getElementById('postContent').value = post.content;
    } catch (error) {
        console.error('Error loading post:', error);
        showToast('❌ Error loading post for edit', 'error');
    }
}

// UI Helper Functions
function showSection(section) {
    postsSection.style.display = 'none';
    postDetailSection.style.display = 'none';
    postFormSection.style.display = 'none';
    
    switch(section) {
        case 'posts':
            postsSection.style.display = 'block';
            break;
        case 'detail':
            postDetailSection.style.display = 'block';
            break;
        case 'form':
            postFormSection.style.display = 'block';
            break;
    }
}

function showModal(type) {
    closeModals();
    if (type === 'login') {
        loginModal.style.display = 'block';
    } else {
        registerModal.style.display = 'block';
    }
}

function closeModals() {
    loginModal.style.display = 'none';
    registerModal.style.display = 'none';
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function truncate(str, length) {
    if (typeof str !== 'string') return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

// Show success/error toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        padding: 1rem 2rem;
        background: ${type === 'success' ? 'var(--success)' : 'var(--danger)'};
        color: white;
        border-radius: 50px;
        box-shadow: var(--shadow-xl);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out, fadeOut 0.3s ease-out 2.7s;
        font-weight: 600;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Add toast animations to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);


