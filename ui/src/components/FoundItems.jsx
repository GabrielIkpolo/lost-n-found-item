import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './foundItems.css'; // Import the custom CSS file
import itemImage from '../assets/images/logo-1.png';

// Mock data for demonstration purposes
const mockItems = [
  {
    id: '1',
    name: 'Laptop',
    category: 'ELECTRONICS_GADGETS',
    image: itemImage,
    status: 'UNCLAIMED',
    description: 'A black Dell laptop with a sticker on the back.',
  },
  {
    id: '2',
    name: 'Wallet',
    category: 'PERSONAL_ACCESSORIES',
    image: 'https://via.placeholder.com/150',
    status: 'UNCLAIMED',
    description: 'A brown leather wallet with a keychain attached.',
  },
  {
    id: '3',
    name: 'Long Note',
    category: 'ACADEMIC_SUPPLIES',
    image: 'https://via.placeholder.com/150',
    status: 'UNCLAIMED',
    description: 'My long brown note.',
  },
  {
    id: '4',
    name: 'Bag',
    category: 'CLOTHING',
    image: 'https://via.placeholder.com/150',
    status: 'UNCLAIMED',
    description: 'A beautiful brown bag.',
  },
  {
    id: '5',
    name: 'Eye Glasses',
    category: 'HEALTH_WELLNESS',
    image: 'https://via.placeholder.com/150',
    status: 'UNCLAIMED',
    description: 'An eye glass with a black frame.',
  },
  {
    id: '6',
    name: 'Water Bottle',
    category: 'OTHER',
    image: 'https://via.placeholder.com/150',
    status: 'UNCLAIMED',
    description: 'A water bottle.',
  },
  // Add more mock items as needed
];

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
  const [items, setItems] = useState(mockItems); // State to hold lost items
  const [searchTerm, setSearchTerm] = useState(''); // State for search term
  const [selectedCategory, setSelectedCategory] = useState(null); // State for selected category
  const [currentPage, setCurrentPage] = useState(1); // State for current page
  const [itemsPerPage] = useState(5); // Number of items per page
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Calculate total pages
  const totalPages = Math.ceil(items.length / itemsPerPage);

  // Get items for the current page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    // Filter items based on category
    if (category) {
      setItems(mockItems.filter((item) => item.category === category));
    } else {
      setItems(mockItems); // Reset to all items
    }
  };

  // Handle search input
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    // Filter items based on search term
    const filteredItems = mockItems.filter((item) =>
      item.name.toLowerCase().includes(event.target.value.toLowerCase())
    );
    setItems(filteredItems);
  };

  // Handle pagination
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Fetch real data from API (mocked here)
  useEffect(() => {
    // Replace with actual API call
    // axios.get('/api/lost-items').then((response) => setItems(response.data));
    setItems(mockItems);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="main-cover">
      {/* Sidebar */}
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
            Found Items
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
            Found Items
          </button>
        </aside>
      )}

      {/* Main Content */}
      <main className="main-content">
        <h1 className="headerOne">
          Lost items within the University Campus
        </h1>

        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by Name"
            value={searchTerm}
            onChange={handleSearchChange}
            className="input-search"
          />
        </div>

        {/* Item List */}
        <div className="item-list">
          {currentItems.map((item) => (
            <div key={item.id} className="item-card">
              <h2>{item.name}</h2>
              <img src={item.image} alt={item.name} className="item-image" />
              <p>
                <strong>Status:</strong> {item.status}
              </p>
              <p>{item.description}</p>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="pagination">
          <nav aria-label="Pagination">
            <ul>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <li key={page}>
                  <button
                    onClick={() => paginate(page)}
                    className={currentPage === page ? 'active' : ''}
                  >
                    {page}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>
    </div>
  );
};


// const FoundItems = () => {
//   const [items, setItems] = useState(mockItems);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(5);
//   const [isMobile, setIsMobile] = useState();

//   const totalPages = Math.ceil(items.length / itemsPerPage);
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

//   const handleCategorySelect = (category) => {
//     console.log("Selected Category:", category);
//     setSelectedCategory(category);
//     if (category) {
//       const filteredItems = mockItems.filter((item) => item.category === category);
//       console.log("Filtered Items:", filteredItems);
//       setItems(filteredItems);
//     } else {
//       console.log("Resetting to all items");
//       setItems(mockItems);
//     }
//   };

//   const handleSearchChange = (event) => {
//     setSearchTerm(event.target.value);
//     const filteredItems = mockItems.filter((item) =>
//       item.name.toLowerCase().includes(event.target.value.toLowerCase())
//     );
//     setItems(filteredItems);
//   };

//   const paginate = (pageNumber) => setCurrentPage(pageNumber);

//   useEffect(() => {
//     setItems(mockItems);
//   }, []);

//   useEffect(() => {
//     const handleResize = () => {
//       setIsMobile(window.innerWidth <= 768);
//     };
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   return (
//     <div className="main-cover">
//       {isMobile ? (
//         <div className="mobile-sidebar">
//           <h2>Search by Category</h2>
//           <ul>
//             {categories.map((category) => (
//               <li
//                 key={category.value}
//                 className={selectedCategory === category.value ? 'active' : ''}
//                 onClick={() => handleCategorySelect(category.value)}
//               >
//                 {category.label}
//               </li>
//             ))}
//           </ul>
//           <button className="btn-foundItems" onClick={() => handleCategorySelect(null)}>
//             Found Items
//           </button>
//         </div>
//       ) : (
//         <aside className="sidebar">
//           <h2>Search by Category</h2>
//           <ul>
//             {categories.map((category) => (
//               <li
//                 key={category.value}
//                 className={selectedCategory === category.value ? 'active' : ''}
//                 onClick={() => handleCategorySelect(category.value)}
//               >
//                 {category.label}
//               </li>
//             ))}
//           </ul>
//           <button className="btn-foundItems" onClick={() => handleCategorySelect(null)}>
//             Found Items
//           </button>
//         </aside>
//       )}

//       <main className="main-content">
//         <h1 className="headerOne">
//           Lost items within the University Campus
//         </h1>

//         <div className="search-bar">
//           <input
//             type="text"
//             placeholder="Search by Name"
//             value={searchTerm}
//             onChange={handleSearchChange}
//             className="input-search"
//           />
//         </div>

//         <div className="item-list">
//           {currentItems.map((item) => (
//             <div key={item.id} className="item-card">
//               <h2>{item.name}</h2>
//               <img src={item.image} alt={item.name} className="item-image" />
//               <p>
//                 <strong>Status:</strong> {item.status}
//               </p>
//               <p>{item.description}</p>
//             </div>
//           ))}
//         </div>

//         <div className="pagination">
//           <nav aria-label="Pagination">
//             <ul>
//               {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
//                 <li key={page}>
//                   <button
//                     onClick={() => paginate(page)}
//                     className={currentPage === page ? 'active' : ''}
//                   >
//                     {page}
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           </nav>
//         </div>
//       </main>
//     </div>
//   );
// };

export default FoundItems;