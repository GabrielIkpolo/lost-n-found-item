import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './mainLayout.css';

const MainLayout = () => {
  return (
    <div className="main-layout-container">
      <div className="sidebar-wrapper">
        <Sidebar />
      </div>
      <main className="main-content-area">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;

