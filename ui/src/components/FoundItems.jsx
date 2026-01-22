import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchItems } from '../features/items/itemsSlice';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';
import './foundItems.css';
import itemImage from '../assets/images/logo-1.png';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import SkeletonCard from './SkeletonCard';
import EmptyState from './EmptyState';

// Sidebar Categories (mapped to ItemCategory enum)
const categories = [
  { label: 'Electronics and Gadgets', value: 'ELECTRONICS_GADGETS' },
  { label: 'Personal Items & Accessories', value: 'PERSONAL_ACCESSORIES' },
  { label: 'Academic Supplies', value: 'ACADEMIC_SUPPLIES' },
  { label: 'Clothing', value: 'CLOTHING' },
  { label: 'Health and Wellness', value: 'HEALTH_WELLNESS' },
  { label: 'Others', value: 'OTHER' },
];

const FoundItems = () => {
  const dispatch = useDispatch();
  const { items, pagination, isLoading, error } = useSelector((state) => state.items);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const { isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // --- EFFECT 1: Debounce search input ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // --- EFFECT 2: Fetch items ---
  useEffect(() => {
    dispatch(fetchItems({
      page: currentPage,
      limit: pagination.itemsPerPage,
      category: selectedCategory,
      search: debouncedSearchTerm,
      status: 'FOUND',
    }));
  }, [dispatch, currentPage, pagination.itemsPerPage, selectedCategory, debouncedSearchTerm]);

  // --- SHOW ERROR NOTIFICATION ---
  useEffect(() => {
    if (error) {
      dispatch(addNotification({
        message: `Error fetching items: ${error}`,
        type: NotificationType.ERROR,
        duration: 5000,
      }));
    }
  }, [error, dispatch]);

  const handleCategorySelect = (categoryValue) => {
    if (selectedCategory !== categoryValue) {
      setSelectedCategory(categoryValue);
      setCurrentPage(1);
    }
  };

  const handleSearchChange = (event) => setSearchInput(event.target.value);

  const paginate = (pageNumber) => {
    if (pageNumber !== currentPage) setCurrentPage(pageNumber);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const itemsToDisplay = items;
  const { totalPages } = pagination;

  return (
    <div className="main-cover">
      {/* --- SIDEBAR --- */}
      {isMobile ? (
        <div className="mobile-sidebar">
          <h2>Search by Category</h2>
          <ul>
            {categories.map((category) => (
              <li
                key={category.value}
                className={selectedCategory === category.value ? 'active' : ''}
                onClick={() => handleCategorySelect(category.value)}
              >
                {category.label}
              </li>
            ))}
          </ul>
          <button className="btn-foundItems" onClick={() => handleCategorySelect(null)}>All Found Items</button>
          <button className="btn-foundItems" onClick={() => navigate('/lost-items')}>All Lost Items</button>
          <button className="btn-foundItems" onClick={() => navigate('/report')}>Report Item (Lost | Found)</button>
          {isAuthenticated && (
            <button className="btn-sidebar" onClick={() => navigate('/support')}>Contact Support</button>
          )}
        </div>
      ) : (
        <aside className="sidebar">
          <h2>Search by Category</h2>
          <ul>
            {categories.map((category) => (
              <li
                key={category.value}
                className={selectedCategory === category.value ? 'active' : ''}
                onClick={() => handleCategorySelect(category.value)}
              >
                {category.label}
              </li>
            ))}
          </ul>
          <button className="btn-foundItems" onClick={() => handleCategorySelect(null)}>All Found Items</button>
          <button className="btn-foundItems" onClick={() => navigate('/lost-items')}>All Lost Items</button>
          <button className="btn-foundItems" onClick={() => navigate('/report')}>Report Item (Lost | Found)</button>
          {isAuthenticated && (
            <button className="btn-sidebar" onClick={() => navigate('/support')}>Contact Support</button>
          )}
        </aside>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="main-content">
        <h1 className="headerOne">Found items within the University Campus</h1>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by Name or Description"
            value={searchInput}
            onChange={handleSearchChange}
            className="input-search"
          />
        </div>

        {/* --- 1. LOADING STATE: Show Skeletons --- */}
        {isLoading && (
          <div className="item-list">
            {/* Render 8 fake cards while loading */}
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        )}

        {/* --- 2. EMPTY STATE: Show Illustration --- */}
        {!isLoading && itemsToDisplay.length === 0 && !error && (
          <EmptyState message="We couldn't find any items matching your filters." />
        )}

        {/* --- 3. DATA STATE: Show Items --- */}
        {!isLoading && !error && itemsToDisplay.length > 0 && (
          <div className="item-list">
            {itemsToDisplay.map((item) => (
              <div key={item.id} className="item-card">
                <h2>{item.title}</h2>
                <img
                  src={item.imageUrlFront || itemImage}
                  alt={item.title}
                  className="item-image"
                  onError={(e) => { e.target.src = itemImage; }}
                />
                <p><strong>Status:</strong> {item.status}</p>
                <p>{item.description}</p>
                <p><strong>Category:</strong> {item.category}</p>
                <p><strong>Location:</strong> {item.location}</p>
                <Link to={`/items/${item.id}`} className="btn-details">
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* --- PAGINATION --- */}
        {!isLoading && !error && totalPages > 1 && (
          <div className="pagination">
            <nav aria-label="Pagination">
              <ul>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <li key={page}>
                    <button
                      onClick={() => paginate(page)}
                      className={currentPage === page ? 'active' : ''}
                      disabled={isLoading}
                    >
                      {page}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </main>
    </div>
  );
};

export default FoundItems;