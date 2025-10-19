import React, { useState, useEffect } from 'react';
import UserProfileCard from '../components/UserProfileCard';
import CareerRecommendations from '../components/CareerRecommendations';
import ChatbotWidget from '../components/ChatbotWidget';

function DashboardPage({ employeeId }) {
    // 1. Add state to manage the current theme
    const [theme, setTheme] = useState('light'); // 'light' or 'dark'

    // 2. Function to toggle the theme
    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };
    
    // 3. Get the current theme's styles
    const currentStyles = getStyles(theme);

    return (
        <div style={currentStyles.appContainer}>
            <header style={currentStyles.header}>
                <h1>PSA Employee Growth Platform</h1>
                {/* 4. Add the theme toggle button */}
                <button onClick={toggleTheme} style={currentStyles.themeToggleButton}>
                    Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
                </button>
            </header>
            <div style={currentStyles.dashboardLayout}>
                {/* Top section with two equal columns */}
                <div style={currentStyles.topRow}>
                    <div style={currentStyles.topCard}>
                        {/* 5. Pass the dynamic styles down to children */}
                        <UserProfileCard employeeId={employeeId} styles={currentStyles} theme={theme} />
                    </div>
                    <div style={currentStyles.topCard}>
                        <CareerRecommendations employeeId={employeeId} styles={currentStyles} theme={theme} />
                    </div>
                </div>

                {/* Bottom section for the chatbot */}
                <div style={currentStyles.bottomRow}>
                    <ChatbotWidget employeeId={employeeId} styles={currentStyles} theme={theme} />
                </div>
            </div>
        </div>
    );
}

const themes = {
    light: {
        background: '#f4f7f9',
        cardBg: 'white',
        text: '#333',
        subtleText: '#555',
        headerBg: '#003366',
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
        headerBg: '#002244',
        headerText: 'white',
        accent: '#0099ff',
        borderColor: '#333',
        chatAreaBg: '#2a2a2a',
        botMessageBg: '#333',
    }
};

const getStyles = (theme) => ({
    appContainer: {
        fontFamily: "'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
        backgroundColor: themes[theme].background,
        minHeight: '100vh',
        color: themes[theme].text,
        transition: 'background-color 0.3s, color 0.3s',
    },
    header: {
        backgroundColor: themes[theme].headerBg,
        color: themes[theme].headerText,
        padding: '1rem 2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    themeToggleButton: {
        backgroundColor: themes[theme].accent,
        color: 'white',
        border: 'none',
        borderRadius: '18px',
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        fontSize: '0.9rem',
    },
    dashboardLayout: {
        padding: '2rem',
    },
    topRow: {
        display: 'flex',
        gap: '2rem',
        marginBottom: '2rem',
    },
    topCard: {
        flex: 1,
    },
    bottomRow: {
        width: '100%',
    },
    card: {
        backgroundColor: themes[theme].cardBg,
        borderRadius: '8px',
        padding: '1.5rem',
        boxShadow: `0 4px 12px ${theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.4)'}`,
        height: '100%',
        transition: 'background-color 0.3s',
    },
    cardTitle: {
        marginTop: 0,
        color: themes[theme].headerBg,
        borderBottom: `2px solid ${themes[theme].borderColor}`,
        paddingBottom: '0.5rem',
        marginBottom: '1rem',
    },
    cardText: {
        color: themes[theme].subtleText,
        lineHeight: 1.6,
    },
    recommendationItem: {
        padding: '0.5rem 0',
        borderBottom: `1px solid ${themes[theme].borderColor}`,
    },
    chatbotContainer: {
        display: 'flex',
        flexDirection: 'column',
        height: '60vh',
    },
    chatMessages: {
        flexGrow: 1,
        overflowY: 'auto',
        padding: '1rem',
        border: `1px solid ${themes[theme].borderColor}`,
        borderRadius: '8px',
        marginBottom: '1rem',
        backgroundColor: themes[theme].chatAreaBg,
    },
    message: {
        padding: '0.75rem 1rem',
        borderRadius: '18px',
        marginBottom: '0.75rem',
        maxWidth: '75%',
        lineHeight: 1.5,
    },
    botMessage: {
        backgroundColor: themes[theme].botMessageBg,
        color: themes[theme].text,
        alignSelf: 'flex-start',
        borderTopLeftRadius: '4px',
    },
    userMessage: {
        backgroundColor: themes[theme].accent,
        color: 'white',
        alignSelf: 'flex-end',
        marginLeft: 'auto',
        borderTopRightRadius: '4px',
    },
    chatForm: {
        display: 'flex',
        gap: '0.5rem',
    },
    chatInput: {
        flexGrow: 1,
        border: `1px solid ${themes[theme].borderColor}`,
        backgroundColor: themes[theme].cardBg,
        color: themes[theme].text,
        borderRadius: '18px',
        padding: '0.75rem 1rem',
        fontSize: '1rem',
    },
    chatButton: {
        border: 'none',
        backgroundColor: themes[theme].accent,
        color: 'white',
        borderRadius: '18px',
        padding: '0.75rem 1.5rem',
        fontSize: '1rem',
        cursor: 'pointer',
    }
});

export default DashboardPage;