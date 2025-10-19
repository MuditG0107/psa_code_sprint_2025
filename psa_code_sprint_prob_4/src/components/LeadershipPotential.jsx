import React, { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const API_BASE_URL = 'http://127.0.0.1:8000';

function LeadershipPotentialCard({ employeeId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPotential = async () => {
            if (!employeeId) return;
            try {
                const response = await fetch(`${API_BASE_URL}/api/employee/${employeeId}/leadership_potential`);
                if (!response.ok) throw new Error("Could not fetch leadership data.");
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPotential();
    }, [employeeId]);

    if (loading) return <div className="card"><p>Analyzing leadership potential...</p></div>;
    if (error) return <div className="card error-message"><p>Could not load potential score.</p></div>;

    const chartData = [{ name: 'score', value: data.score }];
    const scoreColor = data.score > 66 ? '#00E676' : data.score > 33 ? '#FFC371' : '#FF5F6D';

    return (
        <div className="card">
            <h2 className="card-title">Leadership Potential</h2>
            <div style={{ width: '100%', height: 150 }}>
                <ResponsiveContainer>
                    <RadialBarChart
                        innerRadius="70%"
                        outerRadius="100%"
                        data={chartData}
                        startAngle={180}
                        endAngle={0}
                        barSize={20}
                    >
                        <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            angleAxisId={0}
                            tick={false}
                        />
                        <RadialBar
                            background
                            clockWise
                            dataKey="value"
                            cornerRadius={10}
                            fill={scoreColor}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
            </div>
            <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                Score: {data.score} / 100
            </p>
            <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                <h4 style={{ marginBottom: '0.5rem', textAlign: 'left' }}>Key Contributing Factors:</h4>
                <ul>
                    {data.positive_factors.map((factor, index) => (
                        <li key={index} style={{ marginBottom: '0.5rem' }}>{factor}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default LeadershipPotentialCard;