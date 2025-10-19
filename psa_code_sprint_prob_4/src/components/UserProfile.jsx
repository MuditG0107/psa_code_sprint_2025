// src/components/UserProfile.js

import React, { useState, useEffect } from 'react';

function UserProfile({ employeeId }) {
    const [employee, setEmployee] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch employee data from our FastAPI backend
        fetch(`/api/employee/${employeeId}`)
            .then(res => res.json())
            .then(data => {
                setEmployee(data);
                // After fetching profile, get career recommendations
                return fetch(`/api/employee/${employeeId}/career_recommendations`);
            })
            .then(res => res.json())
            .then(data => {
                setRecommendations(data.recommendations);
                setLoading(false);
            })
            .catch(error => console.error("Error fetching data:", error));
    }, [employeeId]);

    if (loading) {
        return <div>Loading profile...</div>;
    }

    return (
        <div>
            <h1>{employee.name}</h1>
            <p><strong>Title:</strong> {employee.job_title}</p>
            <hr />
            <h2>Recommended Next Roles</h2>
            {recommendations.length > 0 ? (
                <ul>
                    {recommendations.map((rec, index) => (
                        <li key={index}>
                            {rec.recommended_role} (Skill Overlap Score: {rec.skill_overlap})
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No recommendations available at this time.</p>
            )}
        </div>
    );
}

export default UserProfile;