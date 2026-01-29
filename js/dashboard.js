// Wait for Supabase to be ready
async function initDashboard() {
    try {
        // Check if user is logged in
        const { data: { user }, error } = await window.supabase.auth.getUser();
        
        if (error || !user) {
            window.location.href = '/'; // Redirect to home if not logged in
            return;
        }

        // Display user email
        document.getElementById('userEmail').textContent = user.email;

        // Load all dashboard data
        await Promise.all([
            loadStats(user.id),
            loadBookStatus(user.id),
            loadSongs(user.id),
            loadPurchaseHistory(user.id)
        ]);

    } catch (error) {
        console.error('Dashboard init error:', error);
        alert('Failed to load dashboard. Please refresh the page.');
    }
}

// Load statistics
async function loadStats(userId) {
    try {
        // Get total songs purchased
        const { data: purchases, error: purchasesError } = await window.supabase
            .from('purchases')
            .select('song_id, credits_remaining')
            .eq('user_id', userId)
            .eq('status', 'paid');

        if (purchasesError) throw purchasesError;

        // Count unique songs (exclude bundle_credits)
        const uniqueSongs = new Set(
            purchases
                .filter(p => p.song_id !== 'bundle_credits')
                .map(p => p.song_id)
        );

        // Calculate total credits
        const totalCredits = purchases
            .filter(p => p.credits_remaining > 0)
            .reduce((sum, p) => sum + p.credits_remaining, 0);

        // Get progress data
        const { data: progress, error: progressError } = await window.supabase
            .from('song_progress')
            .select('status')
            .eq('user_id', userId);

        if (progressError) throw progressError;

        const completed = progress.filter(p => p.status === 'completed').length;
        const inProgress = progress.filter(p => p.status === 'in_progress').length;

        // Update UI
        document.getElementById('totalSongs').textContent = uniqueSongs.size;
        document.getElementById('completedSongs').textContent = completed;
        document.getElementById('inProgressSongs').textContent = inProgress;
        document.getElementById('creditsRemaining').textContent = totalCredits;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load book verification status
async function loadBookStatus(userId) {
    try {
        const { data: profile, error } = await window.supabase
            .from('profiles')
            .select('is_book_owner, books_owned')
            .eq('id', userId)
            .single();

        if (error) throw error;

        const container = document.getElementById('bookStatus');

        if (!profile.is_book_owner || !profile.books_owned || profile.books_owned.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📖</div>
                    <p>You haven't verified any book codes yet.</p>
                    <a href="verify-book.html" class="cta-btn">Verify Book Code</a>
                </div>
            `;
        } else {
            const badges = profile.books_owned
                .map(book => `<span class="book-badge">✓ ${book}</span>`)
                .join('');
            container.innerHTML = `
                <div style="padding: 20px;">
                    <p style="margin-bottom: 15px; color: #666;">You own these books and get discounted pricing:</p>
                    ${badges}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading book status:', error);
        document.getElementById('bookStatus').innerHTML = '<p style="color: red;">Error loading book status</p>';
    }
}

// Load songs with progress
async function loadSongs(userId) {
    try {
        // Get all purchased songs
        const { data: purchases, error: purchasesError } = await window.supabase
            .from('purchases')
            .select('song_id, created_at')
            .eq('user_id', userId)
            .eq('status', 'paid')
            .neq('song_id', 'bundle_credits')
            .order('created_at', { ascending: false });

        if (purchasesError) throw purchasesError;

        // Get progress for all songs
        const { data: progressData, error: progressError } = await window.supabase
            .from('song_progress')
            .select('song_id, status')
            .eq('user_id', userId);

        if (progressError) throw progressError;

        // Create progress map
        const progressMap = {};
        progressData.forEach(p => {
            progressMap[p.song_id] = p.status;
        });

        const container = document.getElementById('songsList');

        if (purchases.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🎵</div>
                    <p>You haven't purchased any songs yet.</p>
                    <a href="/" class="cta-btn">Browse Songs</a>
                </div>
            `;
            return;
        }

        // Render songs
        container.innerHTML = purchases.map(purchase => {
            const songId = purchase.song_id;
            const songName = songId.replace('song:', '').replace(/([A-Z])/g, ' $1').trim();
            const currentStatus = progressMap[songId] || 'not_started';
            const purchaseDate = new Date(purchase.created_at).toLocaleDateString();

            return `
                <div class="song-item" data-song-id="${songId}">
                    <div class="song-info">
                        <div class="song-title">${songName}</div>
                        <div class="song-meta">Purchased: ${purchaseDate}</div>
                    </div>
                    <div class="progress-selector">
                        <button class="progress-btn not_started ${currentStatus === 'not_started' ? 'active' : ''}" 
                                onclick="updateProgress('${songId}', 'not_started')">
                            Not Started
                        </button>
                        <button class="progress-btn in_progress ${currentStatus === 'in_progress' ? 'active' : ''}" 
                                onclick="updateProgress('${songId}', 'in_progress')">
                            In Progress
                        </button>
                        <button class="progress-btn completed ${currentStatus === 'completed' ? 'active' : ''}" 
                                onclick="updateProgress('${songId}', 'completed')">
                            Completed
                        </button>
                    </div>
                    <button class="play-btn" onclick="playSong('${songId}')">
                        ▶ Play
                    </button>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading songs:', error);
        document.getElementById('songsList').innerHTML = '<p style="color: red;">Error loading songs</p>';
    }
}

// Update song progress
async function updateProgress(songId, newStatus) {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) return;

        const updateData = {
            user_id: user.id,
            song_id: songId,
            status: newStatus,
            updated_at: new Date().toISOString()
        };

        if (newStatus === 'in_progress' && !updateData.started_at) {
            updateData.started_at = new Date().toISOString();
        }

        if (newStatus === 'completed') {
            updateData.completed_at = new Date().toISOString();
        }

        // Upsert (insert or update)
        const { error } = await window.supabase
            .from('song_progress')
            .upsert(updateData, { onConflict: 'user_id,song_id' });

        if (error) throw error;

        // Update UI
        const songItem = document.querySelector(`[data-song-id="${songId}"]`);
        const buttons = songItem.querySelectorAll('.progress-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.toLowerCase().replace(' ', '_') === newStatus) {
                btn.classList.add('active');
            }
        });

        // Reload stats
        await loadStats(user.id);

    } catch (error) {
        console.error('Error updating progress:', error);
        alert('Failed to update progress. Please try again.');
    }
}

// Play song (redirect to song page)
function playSong(songId) {
    const songSlug = songId.replace('song:', '');
    window.location.href = `/${songSlug}.html`;
}

// Load purchase history
async function loadPurchaseHistory(userId) {
    try {
        const { data: purchases, error } = await window.supabase
            .from('purchases')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'paid')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const container = document.getElementById('purchaseHistory');

        if (purchases.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💳</div>
                    <p>No purchases yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = purchases.map(purchase => {
            const date = new Date(purchase.created_at).toLocaleDateString();
            const amount = `${purchase.currency} ${(purchase.amount / 100).toFixed(2)}`;
            const isBundletext = purchase.song_id === 'bundle_credits' ? '(5-Song Bundle)' : '';
            const songName = purchase.song_id === 'bundle_credits' 
                ? 'Bundle Credits' 
                : purchase.song_id.replace('song:', '').replace(/([A-Z])/g, ' $1').trim();

            return `
                <div class="purchase-item">
                    <div>
                        <div style="font-weight: 600; margin-bottom: 5px;">${songName} ${isBundletext}</div>
                        <div class="purchase-date">${date}</div>
                    </div>
                    <div class="purchase-amount">${amount}</div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading purchase history:', error);
        document.getElementById('purchaseHistory').innerHTML = '<p style="color: red;">Error loading purchases</p>';
    }
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}
