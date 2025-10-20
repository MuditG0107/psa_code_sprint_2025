import React, { useState, useEffect } from 'react';
import './App.css';
import DashboardPage from './pages/DashboardPage';
import ChatbotPage from './pages/ChatbotPage';
import UpdatePage from './pages/UpdatePage';

const DashboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
);
const ChatbotIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8V4H8"/><rect x="4" y="12" width="8" height="8" rx="2"/><path d="M20 12v4h-4"/><path d="m18 18-4-4"/><path d="M12 12h8v8h-8z"/>
    </svg>
);
const UpdateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path>
        <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon>
    </svg>
);

const PsaIcon = () => (
    <img src="../public/psa_logo_2.png" alt="PSA" width={70} height={70} style={{ objectFit: "contain" }}  />
);


function NavigationBar({ setCurrentPage, toggleTheme, themeToggleButton, theme }) {
    const navStyles = {
        container: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 2rem',
            backgroundColor: '#0a0a0a',
            color: 'white',
            height: '60px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            borderBottom: '1px solid #333',
            position: 'sticky',
            top: 0,
            zIndex: 1000
        },
        logo: {
            fontSize: '1.5rem',
            fontWeight: 'bold',
            letterSpacing: '1px',
            cursor: 'pointer'
        },
        navLinks: {
            display: 'flex',
            gap: '1.5rem',
            alignItems: 'center',
        },
        navButton: {
            background: 'none',
            border: 'none',
            color: '#aaa',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            transition: 'background-color 0.3s, color 0.3s',
        }
    };

    const handleMouseEnter = (e) => { e.currentTarget.style.backgroundColor = '#333'; e.currentTarget.style.color = 'white'; };
    const handleMouseLeave = (e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#aaa'; };

    return (
        <nav style={navStyles.container}>
            <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
              <div style={navStyles.logo} onClick={() => setCurrentPage('dashboard')}>
                <PsaIcon />
              </div>
              <h2>PSA Employee Growth Platform</h2>
              <button onClick={toggleTheme} style={themeToggleButton}>
                  Switch to {theme == 'light' ? 'Dark' : 'Light'} Mode
              </button>
            </div>
            
            <div style={navStyles.navLinks}>
                <button style={navStyles.navButton} onClick={() => setCurrentPage('dashboard')} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}><DashboardIcon /> Dashboard</button>
                <button style={navStyles.navButton} onClick={() => setCurrentPage('chatbot')} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}><ChatbotIcon /> AI Assistant</button>
                <button style={navStyles.navButton} onClick={() => setCurrentPage('update')} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}><UpdateIcon /> Update</button>
            </div>
        </nav>
    );
}

// --- 4. Main APP Component (with Routing Logic) ---
function App() {
    const [currentPage, setCurrentPage] = useState('dashboard');
    // For prototype we stick to first user, we assume the login is connected to Microsoft login with the domain globalpsa.com
    const currentEmployeeId = "EMP-20001";

    const [theme, setTheme] = useState('dark'); // 'light' or 'dark'
    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };
    const currentStyles = getStyles();

    // This function determines which page component to render
    const renderPage = () => {
        switch (currentPage) {
            case 'chatbot':
                return <ChatbotPage employeeId={currentEmployeeId} theme={theme} />;
            case 'update':
                return <UpdatePage employeeId={currentEmployeeId} theme={theme} />;
            case 'dashboard':
            default:
                return <DashboardPage employeeId={currentEmployeeId} navigateTo={setCurrentPage} theme={theme} />;
        }
    };

    return (
        // Using a React fragment to avoid an extra div that might break styles
        <>
            <NavigationBar setCurrentPage={setCurrentPage} toggleTheme={toggleTheme} themeToggleButton={currentStyles.themeToggleButton} theme={theme} />
            {renderPage()}
        </>
    );
}

const themes = {
    light: {
        background: '#f4f7f9',
        cardBg: 'white',
        text: '#333',
        subtleText: '#555',
        headerBg: '#000000ff',
        headerText: 'white',
        accent: '#007bff',
        borderColor: '#e0e0e0',
        chatAreaBg: '#fafafa',
        botMessageBg: '#e9ecef',
    },
    dark: {
        background: '#121212',
        cardBg: '#1e1e1e',
        text: '#e0e0e0',
        subtleText: '#a0a0a0',
        headerBg: '#000000ff',
        headerText: 'white',
        accent: '#0099ff',
        borderColor: '#333',
        chatAreaBg: '#2a2a2a',
        botMessageBg: '#333',
    }
};

const getStyles = () => ({
    themeToggleButton: {
        background: 'linear-gradient(135deg, #2575fc 0%, #6a11cb 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '18px',
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        fontSize: '0.9rem',
        height: '100%',
    },
});

export default App;