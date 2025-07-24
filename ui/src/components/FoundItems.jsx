import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { fetchItems } from '../features/items/itemsSlice';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';
import './foundItems.css';
import itemImage from '../assets/images/logo-1.png';
import { Link, useNavigate } from 'react-router-dom';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const navigate = useNavigate();

 // The debounce effect to handle non-empty searches
  useEffect(() => {
    if (searchInput.trim() === '') return;

    const handler = setTimeout(() => {
      dispatch(fetchItems({
        page: 1, // Reset to page 1
        limit: pagination.itemsPerPage,
        category: selectedCategory,
        search: searchInput.trim(),
        status: 'FOUND',
      }));
    }, 500);

    return () => clearTimeout(handler);
  }, [searchInput, dispatch]);

   // --- EFFECT 2: Fetch items based on filters and debounced search term ---
  useEffect(() => {
    console.log(`Fetching items with params: Page: ${pagination.currentPage}, Category: ${selectedCategory}, Search: "${debouncedSearchTerm}"`);
    dispatch(fetchItems({
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      category: selectedCategory,
      search: debouncedSearchTerm,
      status: 'FOUND',
    }));
  }, [dispatch, pagination.currentPage, pagination.itemsPerPage, selectedCategory, debouncedSearchTerm]);


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
      console.log(`Category changed to ${categoryValue}, fetching page 1.`);
      dispatch(fetchItems({
        page: 1, // Reset to page 1
        limit: pagination.itemsPerPage,
        category: categoryValue,
        search: debouncedSearchTerm,
        status: 'FOUND',
      }));
    }
  };

  const handleSearchChange = (event) => {
    const newSearchTerm = event.target.value.trim();
    setSearchInput(newSearchTerm);
    console.log('Search input changed, resetting to page 1.');
    // Only dispatch fetchItems immediately if the search term is empty (to clear)
    if (newSearchTerm === '') {
      dispatch(fetchItems({
        page: 1, // Reset to page 1
        limit: pagination.itemsPerPage,
        category: selectedCategory,
        search: newSearchTerm,
        status: 'FOUND',
      }));

    }
  };

  const paginate = (pageNumber) => {
    if (pageNumber !== pagination.currentPage) {
      console.log(`Paginating to page ${pageNumber}`);
      dispatch(fetchItems({
        page: pageNumber,
        limit: pagination.itemsPerPage,
        category: selectedCategory,
        search: debouncedSearchTerm,
        status: 'FOUND',
      }));
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
  const { totalPages, currentPage } = pagination;


  return (
    <div className="main-cover">
      {/* ... Sidebar JSX ... */}
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
          <button className="btn-foundItems" onClick={() => handleCategorySelect(null)}>
            All Found Items
          </button>

          <button className="btn-foundItems" onClick={() => navigate('/lost-items')}>
            All Lost Items
          </button>

          <button className="btn-foundItems" onClick={() => navigate('/report')}>
            Report Item (Lost | Found)
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
          <button className="btn-foundItems" onClick={() => handleCategorySelect(null)}>
            All Found Items
          </button>

          <button className="btn-foundItems" onClick={() => navigate('/lost-items')}>
            All Lost Items
          </button>

          <button className="btn-foundItems" onClick={() => navigate('/report')}>
            Report Item (Lost | Found)
          </button>

        </aside>
      )}


      {/* Main Content */}
      <main className="main-content">
        <h1 className="headerOne">
          Found items within the University Campus
        </h1>

        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by Name or Description"
            value={searchInput} // Bind to searchInput
            onChange={handleSearchChange} // Update searchInput
            className="input-search"
          />
        </div>

        {/* --- LOADING, ERROR, AND ITEM LIST RENDERING --- */}
        {isLoading && <p style={{ textAlign: 'center' }}>Loading items...</p>}
        {!isLoading && itemsToDisplay.length === 0 && !error && (
          <p style={{ textAlign: 'center' }}>No items found matching your criteria.</p>
        )}

        {!isLoading && !error && itemsToDisplay.length > 0 && (
          <div className="item-list">
            {itemsToDisplay.map((item) => (
              <div key={item.id} className="item-card">
                <h2>{item.title}</h2>
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
                {/* Make the button a Link */}
                <Link to={`/items/${item.id}`} className="btn-details">
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
        {/* --------------------------------------------- */}


        {/* Pagination - Only show if there are items and more than one page */}
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