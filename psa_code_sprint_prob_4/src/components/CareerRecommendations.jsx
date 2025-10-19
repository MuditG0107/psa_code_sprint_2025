import React, { useState, useEffect } from 'react';

function CareerRecommendations({ employeeId }) {
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        // Define an async function to fetch the data
        const fetchRecommendations = async () => {
            if (!employeeId) {
                setLoading(false);
                return;
            }
            try {
                // Use the environment variable for the API endpoint
                const response = await fetch(`http://127.0.0.1:8000/api/employee/${employeeId}/career_recommendations`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const data = await response.json();
                setRecommendations(data.recommendations || []); // Ensure recommendations is always an array

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [employeeId]);

    return (
        <div className="recommendations-container">
            <h3>Recommended Next Roles</h3>
            {recommendations.map((rec, index) => (
                <div className="card recommendation-card" key={index}>
                    <h4>{rec.recommended_role}</h4>
                    <p>This role is a good match based on your current skills.</p>
                    <button>Explore Path</button>
                </div>
            ))}
        </div>
    );
}

export default CareerRecommendations;