import { useEffect, useState } from 'react'
import { createBrowserRouter, RouterProvider, Link, Outlet } from "react-router-dom";
import './App.css'
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ErrorPage from './pages/ErrorPage';
import Login from './components/Login';
// Import the NotificationContainer component
import NotificationContainer from './components/NotificationContainer';
import Register from './components/Register';
import { useDispatch } from 'react-redux';
import { loadAuthState } from './features/auth/authSlice';

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
      { path: '*', element: <ErrorPage /> }
    ]
  }
]);


function App() {

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadAuthState());
  }, [dispatch]);


  return (
    <>
      <RouterProvider router={guide} />
    </>
  )
}

export default App
