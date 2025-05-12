// src/components/LoginRegister.js

import React from 'react';
import './login.css';

const Login = () => {
    return (
        <div className="container">
            {/* Header */}
            <div className="login-header">
                <a href="#login">Login</a> |  
                <a href="#register">Register</a>
            </div>

            {/* Form Section */}
            <div className="form-container">
                <h2>Login</h2>
                <form action="#" method="post">
                    <input type="email" name="email" placeholder="Email" required />
                    <input type="password" name="password" placeholder="Password" required />
                    <button type="submit">Login</button>
                </form>

                {/* Social Login */}
                <div className="social-login">
                    <button className="google-btn">
                        <i className="fab fa-google"></i> Google Login
                    </button>
                    <button className="facebook-btn">
                        <i className="fab fa-facebook-f"></i> Facebook Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;