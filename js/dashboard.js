// Song ID to Display Name mapping
const SONG_NAMES = {
    'song:badeacche': 'Bade Achhe Lagte Hain',
    'song:kalho': 'Kal Ho Naa Ho',
    'song:haiapna': 'Hai Apna Dil Toh Awaara',
    'song:ekladki': 'Ek Ladki Bheegi Bhaagi Si',
    'song:gulaabi': 'Gulaabi Aankhen',
    'song:chookar': 'Chookar Mere Mann Ko',
    'song:aaogejab': 'Aaoge Jab Tum Sajna',
    'song:jashnebahaara': 'Jashn-e-Bahaara',
    'song:goregore': 'Gore Gore Mukhde Pe',
    'song:darling': 'Darling',
    'song:allahkebande': 'Allah Ke Bande',
    'song:palpalharpal': 'Pal Pal Har Pal',
    'song:zoobiedoobie': 'Zoobie Doobie',
    'song:meresaamne': 'Mere Saamne Wali Khidki',
    'song:jaanekahan': 'Jaane Kahan Mera Jigar Gaya Ji',
    'song:aajkal': 'Aaj Kal Tere Mere Pyaar Ke Charche',
    'song:aehairate': 'Ae Hairate Aashiqui',
    'song:piyubole': 'Piyu Bole',
    'song:raatkali': 'Raat Kali Ek Khwaab Mein Aayi',
    'song:khwaabho': 'Khwaab ho Tum Ya Koi Haqeeqat',
    'song:kaisipaheli': 'Kaisi Paheli Zindagani'
};

// Book name mapping
const BOOK_NAMES = {
    'soulful': 'Soulful Bollywood Melodies',
    'peppy': 'Peppy Bollywood Melodies',
    'romantic': 'Romantic Bollywood Melodies',
    'classic': 'Classic Bollywood Melodies'
};

// Book cover images mapping
const BOOK_COVERS = {
  soulful: 'Soulful.jpg',
  peppy: 'peppy.jpg',
  romantic: 'romantic.jpg',
  classic: 'classic.jpg'
};

// Song to Book category mapping
const SONG_CATEGORIES = {
    'song:meresaamne': 'romantic',
    'song:jaanekahan': 'peppy',
    'song:aajkal': 'romantic',
    'song:aehairate': 'soulful',
    'song:piyubole': 'romantic',
    'song:raatkali': 'romantic',
    'song:khwaabho': 'romantic',
    'song:kaisipaheli': 'peppy',
    'song:jashnebahaara': 'soulful',
    'song:goregore': 'peppy',
    'song:darling': 'peppy',
    'song:allahkebande': 'soulful',
    'song:badeacche': 'romantic',
    'song:kalho': 'classic',
    'song:palpalharpal': 'peppy',
    'song:zoobiedoobie': 'peppy',
    'song:ekladki': 'classic',
    'song:haiapna': 'classic',
    'song:gulaabi': 'classic',
    'song:chookar': 'classic',
    'song:aaogejab': 'classic'
};
const DEFAULT_AVATAR = 'default-avatar.png';

function setAvatar(src) {
  const img = document.getElementById('userAvatar');
  if (!img) return;

  img.src = src || DEFAULT_AVATAR;
  img.onerror = () => { img.src = DEFAULT_AVATAR; };
}

// Wait for Supabase to be ready
async function initDashboard() {
    try {
        // Check if user is logged in
        const { data: { user }, error } = await window.supabase.auth.getUser();
        
        if (error || !user) {
            window.location.href = '/'; // Redirect to home if not logged in
            return;
        }

        // Get user's display name
        const { data: profile } = await window.supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .single();

        const displayName = profile?.display_name || user.email.split('@')[0];
        document.getElementById('userEmail').textContent = `👋 ${displayName}`;
        setAvatar(DEFAULT_AVATAR);

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

// ✅ UPDATED: Load statistics with both credit types
async function loadStats(userId) {
    try {
        // Get total songs purchased
        const { data: purchases, error: purchasesError } = await window.supabase
            .from('purchases')
            .select('song_id, credits_remaining')
            .eq('user_id', userId)
            .eq('status', 'paid');

        if (purchasesError) throw purchasesError;

        // Count unique songs (exclude pack:5 and bundle_credits)
        const uniqueSongs = new Set(
            purchases
                .filter(p => p.song_id !== 'bundle_credits' && p.song_id !== 'pack:5')
                .map(p => p.song_id)
        );

        // Calculate bundle credits (from purchases table)
        const bundleCredits = purchases
            .filter(p => p.credits_remaining > 0)
            .reduce((sum, p) => sum + p.credits_remaining, 0);

        // ✅ NEW: Get book bonus credits (from user_credits table)
        const { data: bookCreditsData } = await window.supabase
            .from('user_credits')
            .select('balance')
            .eq('user_id', userId)
            .single();

        const bookCredits = bookCreditsData?.balance || 0;

        // Total credits = bundle + book bonus
        const totalCredits = bundleCredits + bookCredits;

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
        
        // ✅ Show total credits with breakdown on hover
        const creditsEl = document.getElementById('creditsRemaining');
        creditsEl.textContent = totalCredits;
        
        if (bundleCredits > 0 || bookCredits > 0) {
            creditsEl.title = `Bundle: ${bundleCredits} | Book Bonus: ${bookCredits}`;
        }

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ✅ UPDATED: Load book verification status with images and add-to-collection feature
async function loadBookStatus(userId) {
    try {
        const { data: profile, error } = await window.supabase
            .from('profiles')
            .select('is_book_owner, books_owned, video_bonus_claimed')
            .eq('id', userId)
            .single();

        if (error) throw error;

        // Also check for book bonus credits
        const { data: creditsData } = await window.supabase
            .from('user_credits')
            .select('balance')
            .eq('user_id', userId)
            .single();

        const bookCredits = creditsData?.balance || 0;

        const container = document.getElementById('bookStatus');

        if (!profile.is_book_owner || !profile.books_owned || profile.books_owned.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📖</div>
                    <p>You have not verified any books yet.</p>
                    <a href="verify-book.html" style="
                        display: inline-block;
                        padding: 12px 24px;
                        background: linear-gradient(135deg, rgba(255,120,160,0.26), rgba(155,110,255,0.20));
                        color: #2b1140;
                        font-weight: 700;
                        border-radius: 14px;
                        text-decoration: none;
                        margin-top: 10px;
                    ">Verify Your Book</a>
                </div>
            `;
        } else {
            const ownedBooks = profile.books_owned || [];
            const allBooks = ['soulful', 'peppy', 'romantic', 'classic'];
            const notOwnedBooks = allBooks.filter(book => !ownedBooks.includes(book));
            
     const bookCards = ownedBooks.map(book => `
  <div style="
      display: inline-block;
      margin: 8px;
      padding: 12px;
      border: 2px solid rgba(40,167,69,0.3);
      border-radius: 16px;
      background: rgba(40,167,69,0.08);
      text-align: center;
      min-width: 140px;
      position: relative;
  ">
      <img src="${BOOK_COVERS[book]}" alt="${BOOK_NAMES[book]}" style="
          width: 100px;
          height: 140px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      ">
      <div style="font-size: 13px; font-weight: 600; color: #2b1140;">
          ${BOOK_NAMES[book]}
      </div>
      <div style="font-size: 11px; color: #059669; margin-top: 4px;">
          ✓ In Collection
      </div>

      <button onclick="removeBookFromCollection('${book}')" style="
          margin-top: 10px;
          padding: 6px 12px;
          border: 1px solid rgba(220,38,38,0.25);
          background: white;
          border-radius: 999px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          color: #b91c1c;
          transition: all 0.2s;
      " onmouseover="this.style.background='rgba(220,38,38,0.06)'" onmouseout="this.style.background='white'">
          Remove
      </button>
  </div>
`).join('');

            
            const creditBadge = bookCredits > 0 
                ? `<div style="margin-top: 15px; padding: 12px; background: rgba(255,200,100,0.15); border: 1px solid rgba(255,200,100,0.3); border-radius: 12px;">
                     <strong>🎁 Book Bonus Credits: ${bookCredits}</strong>
                     <div style="font-size: 13px; color: var(--muted); margin-top: 4px;">
                       Earned from video reviews
                     </div>
                   </div>`
                : '';

            const addBookSection = notOwnedBooks.length > 0 
                ? `<div style="margin-top: 20px; padding: 16px; background: rgba(155,110,255,0.05); border: 1px solid rgba(155,110,255,0.2); border-radius: 12px;">
                     <div style="font-weight: 600; margin-bottom: 10px; color: #2b1140;">
                       📚 Got another book? Add it to your collection:
                     </div>
                     <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                       ${notOwnedBooks.map(book => `
                         <button onclick="addBookToCollection('${book}')" style="
                           padding: 8px 16px;
                           border: 1px solid rgba(155,110,255,0.3);
                           background: white;
                           border-radius: 999px;
                           cursor: pointer;
                           font-size: 13px;
                           font-weight: 600;
                           color: #2b1140;
                           transition: all 0.2s;
                         " onmouseover="this.style.background='rgba(155,110,255,0.1)'" onmouseout="this.style.background='white'">
                           + ${BOOK_NAMES[book]}
                         </button>
                       `).join('')}
                     </div>
                     <div style="font-size: 12px; color: var(--muted); margin-top: 8px;">
                       Note: This just adds the book to your collection. You already have discounted pricing!
                     </div>
                   </div>`
                : '';

            container.innerHTML = `
                <div style="padding: 20px;">
                    <p style="margin-bottom: 15px; color: #666; font-weight: 600;">Your Book Collection:</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-start;">
                        ${bookCards}
                    </div>
                    ${creditBadge}
                    ${addBookSection}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading book status:', error);
        document.getElementById('bookStatus').innerHTML = '<p style="color: red;">Error loading book status</p>';
    }
}

// Add book to collection (no verification needed)
async function addBookToCollection(bookType) {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await window.supabase
            .from('profiles')
            .select('books_owned')
            .eq('id', user.id)
            .single();

        const currentBooks = profile?.books_owned || [];
        
        if (currentBooks.includes(bookType)) {
            alert('You already have this book in your collection!');
            return;
        }

        const updatedBooks = [...currentBooks, bookType];

        const { error } = await window.supabase
            .from('profiles')
            .update({ 
                books_owned: updatedBooks,
                is_book_owner: true
            })
            .eq('id', user.id);

        if (error) throw error;

        alert('Book added to your collection! 📚');
        await loadBookStatus(user.id);

    } catch (error) {
        console.error('Error adding book:', error);
        alert('Failed to add book. Please try again.');
    }
}

// Remove book from collection
async function removeBookFromCollection(bookType) {
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) return;

    const ok = confirm(`Remove "${BOOK_NAMES[bookType] || bookType}" from your collection?`);
    if (!ok) return;

    const { data: profile, error: fetchError } = await window.supabase
      .from('profiles')
      .select('books_owned')
      .eq('id', user.id)
      .single();

    if (fetchError) throw fetchError;

    const currentBooks = profile?.books_owned || [];
    if (!currentBooks.includes(bookType)) {
      alert('That book is not in your collection.');
      return;
    }

    const updatedBooks = currentBooks.filter(b => b !== bookType);
    const isBookOwner = updatedBooks.length > 0;

    const { error: updateError } = await window.supabase
      .from('profiles')
      .update({
        books_owned: updatedBooks,
        is_book_owner: isBookOwner
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    alert('Removed from your collection.');
    await loadBookStatus(user.id);
  } catch (error) {
    console.error('Error removing book:', error);
    alert('Failed to remove book. Please try again.');
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
            .neq('song_id', 'pack:5')
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
                    <a href="/" style="
                        display: inline-block;
                        padding: 12px 24px;
                        background: linear-gradient(135deg, rgba(255,120,160,0.26), rgba(155,110,255,0.20));
                        color: #2b1140;
                        font-weight: 700;
                        border-radius: 14px;
                        text-decoration: none;
                        margin-top: 10px;
                    ">Browse Songs</a>
                </div>
            `;
            return;
        }

        // Render songs
        container.innerHTML = purchases.map(purchase => {
            const songId = purchase.song_id;
            const songName = SONG_NAMES[songId] || songId.replace('song:', '');
            const category = SONG_CATEGORIES[songId];
            const bookName = category ? BOOK_NAMES[category] : 'Unknown Book';
            const currentStatus = progressMap[songId] || 'not_started';
            const purchaseDate = new Date(purchase.created_at).toLocaleDateString();

            return `
                <div class="song-item" data-song-id="${songId}">
                    <div class="song-info">
                        <div class="song-title">${songName}</div>
                        <div class="song-meta">From: ${bookName} • Purchased: ${purchaseDate}</div>
                    </div>
                    <div class="song-actions">
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
                    </div>
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

// ✅ UPDATED: Load purchase history (exclude pack:5 from individual display)
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
            const amount = purchase.amount > 0 
                ? `${purchase.currency} ${(purchase.amount / 100).toFixed(2)}`
                : 'FREE';
            
            let displayName = '';
            let badge = '';
            
            if (purchase.song_id === 'bundle_credits' || purchase.song_id === 'pack:5') {
                displayName = '5-Song Bundle';
                badge = `<span style="font-size: 12px; color: #10b981;">✓ ${purchase.credits_remaining || 5} credits</span>`;
            } else if (purchase.provider === 'credit_redemption' || purchase.provider === 'book_bonus_redemption') {
                displayName = SONG_NAMES[purchase.song_id] || purchase.song_id.replace('song:', '');
                badge = `<span style="font-size: 12px; color: #f59e0b;">🎁 Redeemed with credit</span>`;
            } else {
                displayName = SONG_NAMES[purchase.song_id] || purchase.song_id.replace('song:', '');
            }

            return `
                <div class="purchase-item">
                    <div>
                        <div style="font-weight: 600; margin-bottom: 5px;">${displayName}</div>
                        ${badge ? `<div style="margin-bottom: 4px;">${badge}</div>` : ''}
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
