import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000';

// A form component for adding/editing an experience
const ExperienceForm = ({ onAdd, onCancel }) => {
    const [exp, setExp] = useState({ type: '', program: '', start: '', end: '', focus: '' });

    const handleChange = (e) => {
        setExp({ ...exp, [e.target.name]: e.target.value });
    };

    const handleAdd = () => {
        // Basic validation
        if (exp.type && exp.program && exp.start && exp.focus) {
            onAdd({
                type: exp.type,
                organization: 'PSA Singapore', // Hardcoded for simplicity
                program: exp.program,
                period: { start: exp.start, end: exp.end || null },
                focus: exp.focus
            });
        } else {
            alert('Please fill in all required fields (Type, Program, Start Date, Focus).');
        }
    };

    return (
        <div className="experience-form card">
            <h4>Add New Experience</h4>
            <div className="form-group">
                <label>Type (e.g., Program, Project)</label>
                <input name="type" value={exp.type} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
                <label>Program / Project Name</label>
                <input name="program" value={exp.program} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Start Date</label>
                    <input type="date" name="start" value={exp.start} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                    <label>End Date (optional)</label>
                    <input type="date" name="end" value={exp.end} onChange={handleChange} className="form-input" />
                </div>
            </div>
            <div className="form-group">
                <label>Focus / Description</label>
                <textarea name="focus" value={exp.focus} onChange={handleChange} className="form-input" rows="3"></textarea>
            </div>
            <div className="form-actions">
                <button type="button" onClick={handleAdd} className="add-button">Add Experience</button>
                <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
            </div>
        </div>
    );
};

function UpdatePage({ employeeId, theme }) {
    const [skills, setSkills] = useState([]);
    const [experiences, setExperiences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newSkill, setNewSkill] = useState('');
    const [isAddingExperience, setIsAddingExperience] = useState(false);
    

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/employee/${employeeId}/details`);
                if (!response.ok) throw new Error("Failed to fetch your details.");
                const data = await response.json();
                setSkills(data.skills || []);
                setExperiences(data.experiences || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [employeeId]);
    
    const handleAddSkill = (e) => {
        e.preventDefault();
        if (newSkill && !skills.includes(newSkill)) {
            setSkills([...skills, newSkill.trim()]);
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setSkills(skills.filter(skill => skill !== skillToRemove));
    };
    
    const handleAddExperience = (newExp) => {
        setExperiences([...experiences, newExp]);
        setIsAddingExperience(false);
    };

    const handleRemoveExperience = (indexToRemove) => {
        setExperiences(experiences.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/api/employee/${employeeId}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skills, experiences })
            });
            if (!response.ok) throw new Error("Failed to update profile.");
            alert("Profile updated successfully!");
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };
    
    if (loading) return <div className="page-content"><p>Loading your profile for editing...</p></div>;
    if (error) return <div className="page-content error-message"><p>Error: {error}</p></div>;

    const currentStyles = getStyles(theme);

    return (
        <div class={theme} style={currentStyles.appContainer}>
            
            <div className="page-content">
                <h2 className="card-title">Update Your Details</h2>
                <form onSubmit={handleSubmit} className="update-form">
                    {/* Skills Card */}
                    <div className="card">
                        <h3 className="card-title">Your Skills</h3>
                        <div className="skills-list">
                            {skills.map(skill => (
                                <div key={skill} className="skill-tag">
                                    {skill}
                                    <button type="button" onClick={() => handleRemoveSkill(skill)}>×</button>
                                </div>
                            ))}
                            {skills.length === 0 && <p>No skills listed. Add some below!</p>}
                        </div>
                        <div className="form-group add-skill-group">
                            <input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Type a skill and press Enter or Add" className="form-input" />
                            <button onClick={handleAddSkill} className="add-button">Add Skill</button>
                        </div>
                    </div>

                    {/* Experiences Card */}
                    <div className="card">
                        <h3 className="card-title">Work Experiences</h3>
                        <div className="experiences-list">
                            {experiences.map((exp, index) => (
                                <div key={index} className="experience-item">
                                    <div>
                                        <h4>{exp.program} <span className="experience-type">({exp.type})</span></h4>
                                        <p>{exp.focus}</p>
                                        <small>{exp.period.start} to {exp.period.end || 'Present'}</small>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveExperience(index)} className="remove-button">Remove</button>
                                </div>
                            ))}
                            {experiences.length === 0 && <p>No experiences listed. Add one below!</p>}
                        </div>
                        {isAddingExperience ? (
                            <ExperienceForm onAdd={handleAddExperience} onCancel={() => setIsAddingExperience(false)} />
                        ) : (
                            <button type="button" onClick={() => setIsAddingExperience(true)} className="add-button">Add New Experience</button>
                        )}
                    </div>

                    <button type="submit" className="save-button">Save All Changes</button>
                </form>
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

export default UpdatePage;