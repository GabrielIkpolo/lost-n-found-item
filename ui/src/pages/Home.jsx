import React from 'react'
import "./home.css";
import smallLogo from '../assets/images/logo-1.png';


const Home = () => {
    return (
        <>
            <div>Home This is home</div>
            <div className="logo">
                <img src={smallLogo} alt="Logo" />
            </div>
        </>
    )
}

export default Home