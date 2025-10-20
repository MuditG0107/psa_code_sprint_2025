import React, { useState, useEffect } from 'react';
import UserProfileCard from '../components/UserProfileCard';
import CareerRecommendations from '../components/CareerRecommendations';
import ChatbotPage from './ChatbotPage';
import LeadershipPotentialCard from '../components/LeadershipPotential';

function DashboardPage({ employeeId, navigateTo, theme }) {
    
    const currentStyles = getStyles(theme);

    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEmployeeData = async () => {
            if (!employeeId) {
                setLoading(false);
                setError("No employee ID provided.");
                return;
            }
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/employee/${employeeId}`);
                if (!response.ok) throw new Error(`Network response was not ok. Status: ${response.status}`);
                const data = await response.json();
                setEmployee(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployeeData();
    }, [employeeId]);

    return (
        <div class={theme} style={currentStyles.appContainer}>
        
            <div style={currentStyles.dashboardLayout}>
                {loading && <p>Loading profile...</p>}
                {error && <p className="error-message">Error: {error}</p>}
                {employee && Object.keys(employee).length > 0 ? (
                <div>
                    <h1 style={{textAlign: 'Left', margin: '20px', marginTop: '-10px', marginBottom: '30px'}}>Hi, {employee.name}!</h1>
                </div>
                ): (
                !loading && !error && <p>No employee data found.</p>
                )}
                <div style={currentStyles.topRow}>
                    <div style={currentStyles.topCard}>
                        <div style={{marginBottom: '30px'}}>
                            <UserProfileCard employeeId={employeeId} styles={currentStyles} theme={theme} />
                        </div>
                        <div>
                            <CareerRecommendations employeeId={employeeId} styles={currentStyles} theme={theme} />
                        </div>
                    </div>
                    <div style={currentStyles.topCard}>
                        <LeadershipPotentialCard employeeId={employeeId} />
                    </div>
                </div>
                <div style={{alignItems: 'center', marginLeft: '15px'}}>
                    <button className="ai-assistant-button" onClick={() => navigateTo('chatbot')}>
                        <span>🚀 Launch Your AI Assistant Now</span>
                    </button>
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
        height: '50px'
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
        margin: '20px'
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