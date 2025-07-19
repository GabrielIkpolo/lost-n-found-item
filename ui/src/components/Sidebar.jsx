
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './sidebar.css';

const categories = [
    { label: 'Electronics and Gadgets', value: 'ELECTRONICS_GADGETS' },
    { label: 'Personal Items & Accessories', value: 'PERSONAL_ACCESSORIES' },
    { label: 'Academic Supplies', value: 'ACADEMIC_SUPPLIES' },
    { label: 'Clothing', value: 'CLOTHING' },
    { label: 'Health and Wellness', value: 'HEALTH_WELLNESS' },
    { label: 'Others', value: 'OTHER' },
];

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleCategorySelect = (categoryValue) => {
        const isLostPage = location.pathname.includes('lost-items');
        const status = isLostPage ? 'LOST' : 'FOUND';

        navigate(isLostPage ? '/lost-items' : '/', {
            state: {
                category: categoryValue,
                status
            }
        });
    };

    return (
        <aside className="sidebar">
            {isMobile ? (
                <div className="mobile-sidebar">
                    <h2>Search by Category</h2>
                    <ul>
                        {categories.map((category) => (
                            <li
                                key={category.value}
                                className={location.state?.category === category.value && 
                                location.state?.status === (location.pathname.includes('lost-items') ? 'LOST' : 'FOUND') 
                                ? 'active' : ''}
                                onClick={() => handleCategorySelect(category.value)}
                            >
                                {category.label}
                            </li>
                        ))}
                    </ul>
                    <div className="sidebar-buttons">
                        <button 
                            className={`btn-sidebar ${!location.pathname.includes('lost-items') ? 'active' : ''}`}
                            onClick={() => navigate('/')}
                        >
                            All Found Items
                        </button>
                        <button 
                            className={`btn-sidebar ${location.pathname.includes('lost-items') ? 'active' : ''}`}
                            onClick={() => navigate('/lost-items')}
                        >
                            All Lost Items
                        </button>
                        <button className="btn-sidebar" onClick={() => navigate('/report')}>
                            Report Item (Lost | Found)
                        </button>
                    </div>
                </div>
            ) : (
                <div className="desktop-sidebar">
                    <h2>Search by Category</h2>
                    <ul>
                        {categories.map((category) => (
                            <li
                                key={category.value}
                                className={location.state?.category === category.value ? 'active' : ''}
                                onClick={() => handleCategorySelect(category.value)}
                            >
                                {category.label}
                            </li>
                        ))}
                    </ul>
                    <div className="sidebar-buttons">
                        <button 
                            className={`btn-sidebar ${!location.pathname.includes('lost-items') ? 'active' : ''}`}
                            onClick={() => navigate('/')}
                        >
                            All Found Items
                        </button>
                        <button 
                            className={`btn-sidebar ${location.pathname.includes('lost-items') ? 'active' : ''}`}
                            onClick={() => navigate('/lost-items')}
                        >
                            All Lost Items
                        </button>
                        <button className="btn-sidebar" onClick={() => navigate('/report')}>
                            Report Item (Lost | Found)
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
