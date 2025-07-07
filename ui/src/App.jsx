import { useState, useEffect } from 'react'
import { createBrowserRouter, RouterProvider, Link, Outlet } from "react-router-dom";
import './App.css'
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ErrorPage from './pages/ErrorPage';
import Login from './components/Login';
import NotificationContainer from './components/NotificationContainer';
import Register from './components/Register';
import ItemDetail from './pages/ItemDetail';

// Import Redux hooks and the loadAuthState action
import { useDispatch } from 'react-redux';
import { loadAuthState } from './features/auth/authSlice';
import ProtectedRoutes from './components/ProtectedRoutes';
import ReportItem from './pages/ReportItem';
import MyItemsPage from './pages/MyItemsPage';




const Wrapper = ({ children }) => {
  return (
    <div className="wrapper">
      {children}
    </div>
  );
};

const HeadAndFooter = () => {
  return (
    <>
      <Header />
      <Wrapper >
        <Outlet />
      </Wrapper>
      <Footer />
      <NotificationContainer />
    </>
  );
}


// The guide 
const guide = createBrowserRouter([
  {
    path: '/', element: <HeadAndFooter />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/items/:id', element: <ItemDetail /> },

      {
        path: '/report', element: (
          <ProtectedRoutes >
            <ReportItem />
          </ProtectedRoutes>
        )
      },


      {
        path: '/my-items', element: (
          <ProtectedRoutes>
            <MyItemsPage />
          </ProtectedRoutes>
        )
      },


      { path: '*', element: <ErrorPage /> }
    ]
  }
]);


function App() {
  const dispatch = useDispatch();

  // Effect to load auth state from localStorage on initial render
  useEffect(() => {
    dispatch(loadAuthState());
  }, [dispatch]); // Only run once on mount

  return (
    <>
      <RouterProvider router={guide} />
    </>
  )
}

export default App