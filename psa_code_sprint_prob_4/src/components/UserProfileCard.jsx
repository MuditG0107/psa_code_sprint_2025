import React, { useState, useEffect } from 'react';

function UserProfileCard({ employeeId, styles, theme }) {
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Define an async function to fetch the employee's profile.
        const fetchEmployeeData = async () => {
            if (!employeeId) {
                setLoading(false);
                return;
            }
            try {
                // 1. Make the actual API call to your backend.
                const response = await fetch(`http://127.0.0.1:8000/api/employee/${employeeId}`);

                // 2. Check if the request was successful.
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                // 3. Update the state with the fetched data.
                setEmployee(data);

            } catch (err) {
                // 4. If an error occurs, save the error message.
                setError(err.message);

            } finally {
                // 5. Always set loading to false after the fetch is complete.
                setLoading(false);
            }
        };

        // Call the fetch function.
        fetchEmployeeData();
    }, [employeeId]); // This effect re-runs if the employeeId prop changes.

    // --- Conditional Rendering ---
    // Show a loading message while fetching.
    if (loading) {
        return <div className="card">Loading Profile...</div>;
    }

    // Show an error message if the fetch failed.
    if (error) {
        return <div className="card error">Error: {error}</div>;
    }

    // Show a message if no employee data was found.
    if (!employee) {
        return <div className="card">No employee data found.</div>;
    }

    return (
        <div className="card">
            <img src="/profile_avatar.png" alt="Profile" style={{ borderRadius: '50%', width: '100px' }} />
            <h2 style={{color: (theme == "dark") ? 'white' : 'blue'}}>{employee.name}</h2>
            <p>{employee.job_title}</p>
            <p><strong>Department:</strong> {employee.department}</p>
            <p><strong>Manager:</strong> {employee.line_manager}</p>
            <hr />
            <h3>My Skills</h3>
            {/* You would map over the employee's skills here */}
            <span className="skill-tag">Cloud Architecture</span>
            <span className="skill-tag">DevOps</span>
            <span className="skill-tag">Network Architecture</span>
        </div>
    );
}

export default UserProfileCard;