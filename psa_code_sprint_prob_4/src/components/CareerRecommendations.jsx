import React, { useState, useEffect } from 'react';

// A simple, reusable progress bar component for visualizing the score
const ProgressBar = ({ value }) => {
    const percentage = Math.round(value);
    return (
        <div className="progress-bar-container">
            <div 
                className="progress-bar-filler" 
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
};

function CareerRecommendations({ employeeId }) {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!employeeId) {
                setLoading(false);
                setError("No employee ID provided.");
                return;
            }
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/employee/${employeeId}/career_recommendations`);
                if (!response.ok) throw new Error(`Network response was not ok. Status: ${response.status}`);
                const data = await response.json();
                setRecommendations(data.recommendations || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchRecommendations();
    }, [employeeId]);

    // Placeholder for when a user clicks a recommendation
    const handleRecommendationClick = (role) => {
        alert(`You've selected to explore the path for: ${role}. This can now trigger a conversation with the chatbot or open a new page.`);
    };

    return (
        <div className="card">
            <h2 className="card-title">Your Career Compass</h2>
            {loading && <p>Loading recommendations...</p>}
            {error && <p className="error-message">Error: {error}</p>}
            {recommendations.length > 0 ? (
                recommendations.map(rec => (
                    <div 
                        key={rec.recommended_role} 
                        className="recommendation-item"
                        onClick={() => handleRecommendationClick(rec.recommended_role)}
                    >
                        <h4>{rec.recommended_role}</h4>
                        <ProgressBar value={rec.skill_overlap_percent} />
                        <p style={{textAlign: 'right', fontSize: '0.9em', color: '#6c757d'}}>
                            {Math.round(rec.skill_overlap_percent)}% Match
                        </p>
                    </div>
                ))
            ) : (
                !loading && !error && <p>No new recommendations available right now. Your skills are a strong match for your current path!</p>
            )}
        </div>
    );
}

export default CareerRecommendations;