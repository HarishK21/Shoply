import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth/Auth.css'; // Correct relative path

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="auth" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="auth__card" style={{ textAlign: 'center', padding: '60px 40px' }}>
                <h1 style={{ fontSize: '72px', color: 'var(--accent-color)', marginBottom: '10px', marginTop: 0 }}>404</h1>
                <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Page Not Found</h2>
                <p style={{ color: 'var(--home-subtext)', marginBottom: '30px' }}>
                    Oops! The page you are looking for does not exist or has been moved.
                </p>
                <button
                    className="auth__button"
                    onClick={() => navigate('/home')}
                    style={{ maxWidth: '200px', margin: '0 auto' }}
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
};

export default NotFound;
