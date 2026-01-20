const API_URL = '/api';

const confessionFeed = document.getElementById('confessionFeed');
const confessionInput = document.getElementById('confessionInput');
const submitBtn = document.getElementById('submitBtn');
const refreshBtn = document.getElementById('refreshBtn');

// Fetch Confessions
async function fetchConfessions() {
    try {
        const response = await fetch(`${API_URL}/confessions`);
        if (!response.ok) throw new Error('Failed to fetch');

        const confessions = await response.json();
        renderConfessions(confessions);
    } catch (error) {
        console.error('Error:', error);
        confessionFeed.innerHTML = `<div class="glass-card" style="text-align:center; color:#ef4444;">Error loading confessions. Make sure the backend is running!</div>`;
    }
}

// Render Confessions to the Feed
function renderConfessions(confessions) {
    if (confessions.length === 0) {
        confessionFeed.innerHTML = `<div class="glass-card" style="text-align:center;">No confessions yet. Be the first!</div>`;
        return;
    }

    confessionFeed.innerHTML = confessions.map(c => `
        <div class="glass-card confession-card" id="card-${c.id}">
            <p class="confession-content">${escapeHTML(c.content)}</p>
            <div class="confession-footer">
                <span style="font-size: 0.8rem;">${formatDate(c.timestamp)}</span>
                <div style="display:flex; gap: 1rem;">
                     <button class="action-btn like-btn ${isLiked(c.id) ? 'liked' : ''}" onclick="toggleLike(${c.id})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path>
                        </svg>
                        <span id="likes-count-${c.id}">${c.likes}</span>
                    </button>
                    <button class="action-btn" onclick="toggleComments(${c.id})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"></path>
                        </svg>
                        ${c.comments.length}
                    </button>
                </div>
            </div>

            <!-- Comments Section -->
            <div class="comments-section" id="comments-${c.id}">
                <div class="comments-list" id="comments-list-${c.id}">
                    ${c.comments.map(renderComment).join('')}
                </div>
                <div class="comment-input-wrapper">
                    <input type="text" class="comment-input" id="comment-input-${c.id}" placeholder="Reply anonymously..." onkeydown="if(event.key==='Enter') postComment(${c.id})">
                    <button class="comment-submit-btn" onclick="postComment(${c.id})">Send</button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderComment(comment) {
    return `
        <div class="comment">
            <div class="comment-header">
                <span>Anonymous</span>
                <span>${new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            ${escapeHTML(comment.content)}
        </div>
    `;
}

// Logic: Likes
function isLiked(id) {
    return localStorage.getItem(`liked_${id}`) === 'true';
}

async function toggleLike(id) {
    const btn = document.querySelector(`#card-${id} .like-btn`);
    const countSpan = document.getElementById(`likes-count-${id}`);

    // Optimistic Update
    const currentlyLiked = isLiked(id);
    if (currentlyLiked) return; // Prevent double liking mostly for UX simplicity here

    btn.classList.add('liked');
    let newCount = parseInt(countSpan.innerText) + 1;
    countSpan.innerText = newCount;
    localStorage.setItem(`liked_${id}`, 'true');

    try {
        await fetch(`${API_URL}/confessions/${id}/like`, { method: 'POST' });
    } catch (e) {
        console.error("Failed to like", e);
    }
}

// Logic: Comments
function toggleComments(id) {
    const section = document.getElementById(`comments-${id}`);
    section.classList.toggle('active');
}

async function postComment(id) {
    const input = document.getElementById(`comment-input-${id}`);
    const content = input.value.trim();
    if (!content) return;

    input.disabled = true;

    try {
        const response = await fetch(`${API_URL}/confessions/${id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });

        if (response.ok) {
            const newComment = await response.json();
            const list = document.getElementById(`comments-list-${id}`);
            list.innerHTML += renderComment(newComment);
            input.value = '';

            // Re-fetch to update comment count button text correctness if needed, or just increment
            // ensuring simple UX
        }
    } catch (e) {
        alert('Failed to post comment');
    } finally {
        input.disabled = false;
        input.focus();
    }
}


// Post a New Confession
async function postConfession() {
    const content = confessionInput.value.trim();
    if (!content) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    try {
        const response = await fetch(`${API_URL}/confessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
        });

        if (response.ok) {
            confessionInput.value = '';
            fetchConfessions();
        } else {
            alert('Failed to post confession.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Could not connect to the backend.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Post Secretly';
    }
}

// Helpers
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Event Listeners
submitBtn.addEventListener('click', postConfession);
refreshBtn.addEventListener('click', fetchConfessions);

// Initial Load
fetchConfessions();
