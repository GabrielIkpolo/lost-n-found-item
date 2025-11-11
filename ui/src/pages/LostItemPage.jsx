import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { fetchItems } from '../features/items/itemsSlice';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';
import './lostItemPage.css';
import itemImage from '../assets/images/logo-1.png';
import { Link, useNavigate } from 'react-router-dom';

// Categories can be the same as FoundItems
const categories = [
  { label: 'Electronics and Gadgets', value: 'ELECTRONICS_GADGETS' },
  { label: 'Personal Items & Accessories', value: 'PERSONAL_ACCESSORIES' },
  { label: 'Academic Supplies', value: 'ACADEMIC_SUPPLIES' },
  { label: 'Clothing', value: 'CLOTHING' },
  { label: 'Health and Wellness', value: 'HEALTH_WELLNESS' },
  { label: 'Others', value: 'OTHER' },
];

const LostItemPage = () => {
  const dispatch = useDispatch();
  const { items, pagination, isLoading, error } = useSelector((state) => state.items);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  // FIX: Use local state to manage the page number, which then triggers the fetch effect
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const navigate = useNavigate();

  // --- EFFECT 1: Debounce search input and update fetching state ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchInput);
      setCurrentPage(1); // Reset page to 1 on new search term
    }, 500);

    return () => clearTimeout(handler);
  }, [searchInput]);


  // Fetch lost items based on filters and debounced search term
  useEffect(() => {
    // FIX: Depend on local state variables (currentPage, debouncedSearchTerm, selectedCategory)
    dispatch(fetchItems({
      page: currentPage,
      limit: pagination.itemsPerPage,
      category: selectedCategory,
      search: debouncedSearchTerm,
      status: 'LOST', // Only show LOST items
    }));
  }, [dispatch, currentPage, pagination.itemsPerPage, selectedCategory, debouncedSearchTerm]);

  // Show error notification
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
      setCurrentPage(1); // Reset page to 1
    }
  };


  const handleSearchChange = (event) => {
    // FIX: Only update the input state, let useEffect handle debouncing and fetching
    setSearchInput(event.target.value);
  };

  const paginate = (pageNumber) => {
    // FIX: Use local state for the current page
    if (pageNumber !== currentPage) {
      setCurrentPage(pageNumber);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const itemsToDisplay = items;
  const { totalPages } = pagination; // Read totalPages from Redux

  return (
    <div className="main-cover">
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
          <button className="btn-foundItems" onClick={() => navigate('/')}>
            All Found Items
          </button>

          <button className="btn-foundItems" onClick={() => navigate('/lost-items')}>
            All Lost Items
          </button>

          <button className="btn-foundItems" onClick={() => navigate('/report')}>
            Report Item (Lost | Found )
          </button>
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
          <button className="btn-foundItems" onClick={() => navigate('/')}>
            All Found Items
          </button>

          <button className="btn-foundItems" onClick={() => navigate('/lost-items')}>
            All Lost Items
          </button>

          <button className="btn-foundItems" onClick={() => navigate('/report')}>
            Report Item (Lost | Found )
          </button>
        </aside>
      )}

      <main className="main-content">
        <h1 className="headerOne">
          Lost items within the University Campus
        </h1>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by Name or Description"
            value={searchInput}
            onChange={handleSearchChange}
            className="input-search"
          />
        </div>

        {isLoading && <p style={{ textAlign: 'center' }}>Loading items...</p>}
        {!isLoading && itemsToDisplay.length === 0 && !error && (
          <p style={{ textAlign: 'center' }}>No lost items found matching your criteria.</p>
        )}

        {!isLoading && !error && itemsToDisplay.length > 0 && (
          <div className="item-list">
            {itemsToDisplay.map((item) => (
              <div key={item.id} className="item-card">
                <h2>{item.title}</h2>
                {/* <img
                  src={item.imageUrlFront || itemImage}
                  alt={item.title}
                  className="item-image"
                /> */}

                <img
                  src={item.imageUrlFront || itemImage}
                  alt={item.title}
                  className="item-image"
                  onError={(e) => {
                    e.target.src = itemImage;
                  }}
                />
                <p>
                  <strong>Status:</strong> {item.status}
                </p>
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

        {!isLoading && !error && totalPages > 1 && (
          <div className="pagination">
            <nav aria-label="Pagination">
              <ul>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <li key={page}>
                    <button
                      onClick={() => paginate(page)}
                      className={currentPage === page ? 'active' : ''} // Use local state
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

export default LostItemPage;