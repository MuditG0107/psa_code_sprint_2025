import React from 'react';
import './App.css'; // Your main stylesheet
import DashboardPage from './pages/DashboardPage'; // Import the dashboard page

const FeedbackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
);
const UpdateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path>
        <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon>
    </svg>
);
const MessagesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>
    </svg>
);
const SupportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);

function App() {
  const currentEmployeeId = "EMP-20001";

  const appStyles = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
    margin: 0,
    padding: 0,
  };

  return (
    <>
      <NavigationBar />
      <DashboardPage employeeId={currentEmployeeId} />
    </>
  );
}



function NavigationBar() {
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
        },
        logo: {
            fontSize: '1.5rem',
            fontWeight: 'bold',
            letterSpacing: '1px',
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

    // Hover effect logic
    const handleMouseEnter = (e) => {
        e.currentTarget.style.backgroundColor = '#333';
        e.currentTarget.style.color = 'white';
    };
    const handleMouseLeave = (e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = '#aaa';
    };

    return (
        <nav style={navStyles.container}>
            <div style={navStyles.logo}>PSA</div>
            <div style={navStyles.navLinks}>
                <button style={navStyles.navButton} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}><FeedbackIcon /> Feedback</button>
                <button style={navStyles.navButton} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}><UpdateIcon /> Update</button>
                <button style={navStyles.navButton} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}><MessagesIcon /> Messages</button>
                <button style={navStyles.navButton} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}><SupportIcon /> Support</button>
            </div>
        </nav>
    );
}
export default App;