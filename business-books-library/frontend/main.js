// main.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/books';
let allBooks = [];
let favoriteBooks = JSON.parse(localStorage.getItem('bbl_favorites')) || [];
let currentCategory = '';
let currentSearch = '';
let showingFavorites = false;

// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const categoryFilters = document.getElementById('categoryFilters');
const searchInput = document.getElementById('searchInput');
const favoritesToggle = document.getElementById('favoritesToggle');

const skeletonLoader = document.getElementById('skeletonLoader');
const booksGrid = document.getElementById('booksGrid');
const noResults = document.getElementById('noResults');
const recommendedSection = document.getElementById('recommendedSection');
const recommendedGrid = document.getElementById('recommendedGrid');
const mainSectionTitle = document.getElementById('mainSectionTitle');

// Modal Elements
const bookModal = document.getElementById('bookModal');
const closeModalBtn = document.getElementById('closeModal');
const modalBody = document.getElementById('modalBody');

// SVGs
const MOON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
const SUN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
const HEART_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Initial Setup
function init() {
    setupTheme();
    setupEventListeners();
    generateSkeletons(8);
    fetchBooks();
}

// Theme Handling
function setupTheme() {
    const savedTheme = localStorage.getItem('bbl_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeIcon.innerHTML = savedTheme === 'dark' ? SUN_SVG : MOON_SVG;

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('bbl_theme', newTheme);
        themeIcon.innerHTML = newTheme === 'dark' ? SUN_SVG : MOON_SVG;
    });
}

// Event Listeners
function setupEventListeners() {
    // Search
    searchInput.addEventListener('input', debounce((e) => {
        currentSearch = e.target.value;
        fetchBooks(currentSearch);
    }, 500));

    // Category Filters
    categoryFilters.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.dataset.category;
            filterAndRender();
        }
    });

    // Favorites Toggle
    favoritesToggle.addEventListener('click', () => {
        showingFavorites = !showingFavorites;
        favoritesToggle.classList.toggle('active', showingFavorites);
        
        mainSectionTitle.textContent = showingFavorites ? "Mis Libros Favoritos" : "Catálogo de Libros";
        
        if (showingFavorites) {
            recommendedSection.style.display = 'none';
        }

        filterAndRender();
    });

    // Modal Close
    closeModalBtn.addEventListener('click', () => {
        bookModal.classList.remove('show');
        setTimeout(() => bookModal.style.display = 'none', 300);
    });

    bookModal.addEventListener('click', (e) => {
        if (e.target === bookModal) {
            bookModal.classList.remove('show');
            setTimeout(() => bookModal.style.display = 'none', 300);
        }
    });
}

// Fetch Books
async function fetchBooks(query = '') {
    showLoading(true);
    try {
        const searchQuery = query ? `subject:business ${query}` : 'subject:business';
        const response = await fetch(`${API_URL}?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) throw new Error('API fetch error');
        const data = await response.json();
        
        // Enhance data and fix missing categories or ensure they are present
        allBooks = data.map(book => ({
            ...book,
            rating: book.rating || (Math.random() * 2 + 3).toFixed(1) // add random decent rating if missing for UI flair
        }));

        filterAndRender();

        if (!query && !showingFavorites) {
            renderRecommended();
        }
    } catch (error) {
        console.error('Error:', error);
        booksGrid.innerHTML = `<p style="color:var(--text-secondary); grid-column: 1 / -1;">Error al cargar los libros. Asegúrate de tener el backend corriendo en http://localhost:3000</p>`;
        showLoading(false);
    }
}

function filterAndRender() {
    let filtered = allBooks;

    // Apply Favorites filter
    if (showingFavorites) {
        filtered = filtered.filter(book => favoriteBooks.includes(book.id));
    }

    // Apply Category filter inside local data if search doesn't handle it
    if (currentCategory) {
        filtered = filtered.filter(book => 
            book.category && book.category.toLowerCase().includes(currentCategory.toLowerCase())
        );
    }
    
    // In search mode, also hide recommended section
    if (currentSearch || showingFavorites || currentCategory) {
        recommendedSection.style.display = 'none';
    } else {
        recommendedSection.style.display = 'block';
    }

    renderBooks(filtered, booksGrid);
    showLoading(false);

    if (filtered.length === 0) {
        noResults.style.display = 'block';
        booksGrid.style.display = 'none';
    } else {
        noResults.style.display = 'none';
        booksGrid.style.display = 'grid';
    }
}

function renderRecommended() {
    // Pick top rated or random items for recommended
    const recommended = [...allBooks].sort((a, b) => b.rating - a.rating).slice(0, 4);
    if(recommended.length > 0) {
        recommendedSection.style.display = 'block';
        renderBooks(recommended, recommendedGrid);
    } else {
         recommendedSection.style.display = 'none';
    }
}

function renderBooks(books, container) {
    container.innerHTML = '';
    books.forEach(book => {
        container.insertAdjacentHTML('beforeend', createBookCard(book));
    });

    // Attach Details Event
    container.querySelectorAll('.btn-details').forEach(btn => {
        btn.addEventListener('click', () => openModal(btn.dataset.id));
    });

    // Attach Fav Event
    container.querySelectorAll('.btn-fav').forEach(btn => {
        btn.addEventListener('click', (e) => toggleFavorite(e, btn.dataset.id));
    });
}

function createBookCard(book) {
    const isFav = favoriteBooks.includes(book.id);
    const starColor = 'var(--gold)';
    
    return `
        <article class="book-card" data-id="${book.id}">
            <img class="book-cover" src="${book.coverImage}" alt="${book.title}" loading="lazy"/>
            <button class="btn-fav ${isFav ? 'active' : ''}" data-id="${book.id}" aria-label="Favorito">
                ${HEART_SVG}
            </button>
            <div class="book-info">
                <span class="book-category">${book.category || 'Negocios'}</span>
                <h3 class="book-title" title="${book.title}">${book.title}</h3>
                <p class="book-author">${book.author}</p>
                <div class="book-meta">
                    <span class="book-rating">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${starColor}" stroke="${starColor}" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        ${Number(book.rating).toFixed(1)}
                    </span>
                    <span class="book-price">${book.price}</span>
                </div>
                <button class="btn-details" data-id="${book.id}">Ver Detalles</button>
            </div>
        </article>
    `;
}

// Favorites logic
function toggleFavorite(e, bookId) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const index = favoriteBooks.indexOf(bookId);
    
    let isAdded = false;
    if (index === -1) {
        favoriteBooks.push(bookId);
        isAdded = true;
    } else {
        favoriteBooks.splice(index, 1);
    }
    
    localStorage.setItem('bbl_favorites', JSON.stringify(favoriteBooks));
    btn.classList.toggle('active', isAdded);

    // Update matching cards in DOM if there are duplicates (e.g., in recommended and main grid)
    document.querySelectorAll(`.btn-fav[data-id="${bookId}"]`).forEach(el => {
        if(isAdded) el.classList.add('active');
        else el.classList.remove('active');
    });

    if (showingFavorites && !isAdded) {
        filterAndRender(); // Re-render if we unfavorited in the favorites view
    }
}

// Modal handling
function openModal(bookId) {
    const book = allBooks.find(b => b.id === bookId);
    if (!book) return;

    modalBody.innerHTML = `
        <div class="modal-img">
            <img src="${book.coverImage}" alt="${book.title}" />
        </div>
        <div class="modal-info">
            <span class="modal-category">${book.category || 'Negocios'}</span>
            <h2 class="modal-title">${book.title}</h2>
            <p class="modal-author">${book.author}</p>
            <div class="modal-description">
                ${book.description}
            </div>
            <div class="modal-footer">
                <div>
                    <span class="modal-price" style="display:block;">${book.price}</span>
                    <span class="modal-rating" style="margin-top:0.5rem">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="var(--gold)" stroke="var(--gold)" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        ${Number(book.rating).toFixed(1)} / 5.0
                    </span>
                </div>
                <a href="${book.infoLink || '#'}" target="_blank" rel="noopener noreferrer" class="modal-buy-btn">
                    Conseguir Libro
                </a>
            </div>
        </div>
    `;

    bookModal.style.display = 'flex';
    // Small timeout for structural reflow
    setTimeout(() => {
        bookModal.classList.add('show');
    }, 10);
}

// UI State handling
function showLoading(isLoading) {
    if (isLoading) {
        skeletonLoader.style.display = 'grid';
        booksGrid.style.display = 'none';
        noResults.style.display = 'none';
    } else {
        skeletonLoader.style.display = 'none';
    }
}

function generateSkeletons(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton">
                <div class="skeleton-img"></div>
                <div class="skeleton-info">
                    <div class="skeleton-text short"></div>
                    <div class="skeleton-text medium"></div>
                    <div class="skeleton-text short" style="margin-bottom: auto;"></div>
                    <div class="skeleton-button"></div>
                </div>
            </div>
        `;
    }
    skeletonLoader.innerHTML = html;
}

// Start
document.addEventListener('DOMContentLoaded', init);
