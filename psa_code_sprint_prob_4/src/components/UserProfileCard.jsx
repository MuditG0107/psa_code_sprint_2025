import React, { useState, useEffect } from 'react';

function UserProfileCard({ employeeId }) {
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
        <div className="card">
            <h2 className="card-title">Your Profile</h2>
            {loading && <p>Loading profile...</p>}
            {error && <p className="error-message">Error: {error}</p>}
            {employee && Object.keys(employee).length > 0 ? (
                <div className='card-text'>
                    <p><strong>Title:</strong> {employee.job_title}</p>
                    <p><strong>Department:</strong> {employee.department}</p>
                    <p><strong>Manager:</strong> {employee.line_manager}</p>
                </div>
            ) : (
                !loading && !error && <p>No employee data found.</p>
            )}
        </div>
    );
}

export default UserProfileCard;

