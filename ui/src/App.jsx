import { useState } from 'react'
import { createBrowserRouter, RouterProvider, Link, Outlet  } from "react-router-dom";
import './App.css'
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ErrorPage from './pages/ErrorPage';
import Login from './components/Login';

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
    </>
  );
}


// The guide 
const guide = createBrowserRouter([
  {
    path: '/', element: <HeadAndFooter />,
    children: [
      { path: '/', element: <Home /> }, 
      {path: '/login', element: <Login />},     
      { path: '*', element: <ErrorPage /> }
    ]
  }
]);


function App() {


  return (
    <>
      <RouterProvider router={guide} />
    </>
  )
}

export default App
