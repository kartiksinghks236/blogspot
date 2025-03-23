import { app } from './firebase-config.js';
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth(app);
// Theme Toggle Function with Enhanced Features
const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Update theme attribute and storage
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update Bootstrap theme variables
    document.documentElement.style.setProperty('--bs-body-bg', newTheme === 'dark' ? '#0f172a' : '#f8f9fa');
    document.documentElement.style.setProperty('--bs-body-color', newTheme === 'dark' ? '#f8fafc' : '#212529');

    // Force update Bootstrap components
    document.querySelectorAll('.btn').forEach(btn => {
        btn.classList.toggle('btn-dark', newTheme === 'dark');
        btn.classList.toggle('btn-light', newTheme === 'light');
    });
    
    // Add smooth transition to body
    document.body.classList.add('theme-transition');
    setTimeout(() => {
        document.body.classList.remove('theme-transition');
    }, 500);
};

// Enhanced Publish Handler with Validation
const handlePublish = () => {
    const titleInput = document.getElementById('postTitle');
    const title = titleInput.value.trim();
    const content = tinymce.get('editor').getContent().trim();

    if (!title || !content) {
        showAlert('Please fill both title and content!', 'danger');
        titleInput.focus();
        return;
    }

    const newPost = {
        title,
        content,
        date: new Date().toLocaleString('en-IN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }),
        tags: extractTags(content),
        featuredImage: getFirstImage(content),
        id: Date.now().toString(),
        views: 0
    };

    savePostToStorage(newPost);
    updatePublishUI();
    redirectToBlog();
};

// Improved Post Saving Function
const savePostToStorage = (post) => {
    const posts = JSON.parse(localStorage.getItem('posts')) || [];
    posts.unshift(post);
    localStorage.setItem('posts', JSON.stringify(posts));
};

// Enhanced Delete Function with Archive
const deletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
        const response = await fetch(`api.php?action=deletePost&id=${postId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            showAlert('Post deleted successfully!', 'success');
            loadEditablePosts(); // Refresh the posts list
        } else {
            throw new Error(result.message || 'Delete failed');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
};

// UI Update Functions
const updatePublishUI = () => {
    const publishDate = document.getElementById('publishDate');
    const publishButton = document.querySelector('[onclick="handlePublish()"]');
    
    publishDate.innerHTML = `Published: <strong>${new Date().toLocaleDateString()}</strong>`;
    publishButton.innerHTML = '<i class="bi bi-check-circle"></i> Published!';
    publishButton.classList.add('published-animation');
    
    setTimeout(() => {
        publishButton.innerHTML = '<i class="bi bi-cloud-upload"></i> Publish';
        publishButton.classList.remove('published-animation');
    }, 1500);
};

// Enhanced Edit Function
const editPost = (postId) => {
    const posts = JSON.parse(localStorage.getItem('posts')) || [];
    const post = posts[postId];

    document.getElementById('postTitle').value = post.title;
    tinymce.get('editor').setContent(post.content);

    const publishButton = document.querySelector('[onclick="handlePublish()"]');
    publishButton.innerHTML = '<i class="bi bi-arrow-repeat"></i> Update Post';
    publishButton.setAttribute('onclick', `updatePost(${postId})`);
    publishButton.classList.add('pulse-animation');

    // Show editor section and hide editable posts section
    document.getElementById('editorSection').style.display = 'block';
    document.getElementById('editablePosts').style.display = 'none';
};

// Improved Update Function
const updatePost = (postId) => {
    const posts = JSON.parse(localStorage.getItem('posts')) || [];
    const updatedPost = {
        ...posts[postId],
        title: document.getElementById('postTitle').value.trim(),
        content: tinymce.get('editor').getContent().trim(),
        date: new Date().toLocaleString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    };

    posts[postId] = updatedPost;
    localStorage.setItem('posts', JSON.stringify(posts));
    showAlert('Post updated successfully!', 'success');
    setTimeout(() => window.location.reload(), 1000);
};

// Utility Functions
const extractTags = (content) => {
    return [...new Set(content.match(/#\w+/g) || [])].map(tag => tag.slice(1)).slice(0, 5);
};

const getFirstImage = (content) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    return tempDiv.querySelector('img')?.src || null;
};

const showAlert = (message, type) => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
};

// Initialize Theme with System Preference
const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', savedTheme || (systemPrefersDark ? 'dark' : 'light'));

    // Initialize Bootstrap theme variables
    const currentTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.style.setProperty('--bs-body-bg', currentTheme === 'dark' ? '#0f172a' : '#f8f9fa');
    document.documentElement.style.setProperty('--bs-body-color', currentTheme === 'dark' ? '#f8fafc' : '#212529');
};

// Load Editable Posts
const loadEditablePosts = () => {
    document.getElementById('editorSection').style.display = 'none';
    document.getElementById('editablePosts').style.display = 'block';
    
    const posts = JSON.parse(localStorage.getItem('posts')) || [];
    const tbody = document.getElementById('postsTableBody');
    
    tbody.innerHTML = posts.map((post, index) => `
        <tr>
            <td>${post.title}</td>
            <td>${post.date}</td>
            <td>${post.views}</td>
            <td class="post-actions-cell">
                <button class="btn btn-sm btn-warning" onclick="editPost(${index})">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deletePost(${index})">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
};

const loadPosts = async () => {
    const response = await fetch('api.php?action=getPosts');
    return await response.json();
};

// Save Post
const savePost = async (postData) => {
    const response = await fetch('api.php?action=savePost', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(postData)
    });
    return await response.json();
};

// Event Listeners and Initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    tinymce.init({
        selector: '#editor',
        plugins: 'image media link code emoticons',
        toolbar: 'undo redo | bold italic | emoticons | image media link | code',
        images_upload_url: 'api.php?action=upload',
        content_css: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : ''
    });
});

window.addEventListener('storage', (e) => {
    if (e.key === 'theme') {
        document.documentElement.setAttribute('data-theme', e.newValue);
    }
    tinymce.init({
        selector: '#editor',
        plugins: 'image media link code emoticons',
        toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | image media link | code | emoticons',
        images_upload_url: 'api.php?action=upload',
        images_upload_handler: function (blobInfo, success, failure) {
            let formData = new FormData();
            formData.append('file', blobInfo.blob(), blobInfo.filename());
        
            fetch('api.php?action=upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(result => {
                if(result.location) {
                    success(result.location);
                } else {
                    failure('Upload failed');
                }
            })
            .catch(error => failure(error.message));
        }
    });
    // blog.js में यह फंक्शन जोड़ें/अपडेट करें
// लॉगआउट फ़ंक्शन अपडेट करें
function handleLogout() {
    signOut(auth).then(() => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Logout Error:', error);
    });
}

});// blog.js में यह फंक्शन जोड़ें/अपडेट करे
    // Cross-tab communication
    if(window.opener) {
        window.opener.postMessage('forceLogout', '*');
        // Close after short delay
        setTimeout(() => window.close(), 300);
    }




// Message listener for popup windows
window.addEventListener('message', function(e) {
    if(e.data === 'forceLogout') {
        localStorage.removeItem('currentUser');
        window.location.href = 'auth.html?auth=true';
        window.location.reload();
    }
});

// Add message listener for cross-window communication
window.addEventListener('message', function(e) {
    if(e.data === 'logout') {
        localStorage.removeItem('currentUser');
        window.location.reload();
    }
});

