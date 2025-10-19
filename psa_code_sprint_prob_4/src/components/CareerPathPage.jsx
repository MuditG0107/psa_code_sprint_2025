import React from 'react';

// This data would come from an API call that compares the user's skills
// with the skills required for the target role.
const skillGapData = {
    currentRole: "Senior Systems Engineer",
    targetRole: "Cloud Solutions Architect",
    skillGaps: ["Enterprise Architecture", "Securing Cloud Infrastructure"],
    recommendedActions: [
        "Join the 'Project Phoenix' cloud security workstream.",
        "Take the 'Advanced Cloud Architecture' internal course.",
        "Find a mentor in the Infrastructure Architecture unit."
    ]
};

function CareerPathPage() {
    return (
        <div style={{ padding: '2rem' }}>
            <h1>Your Path to Cloud Solutions Architect</h1>
            <p>Here's a personalized plan to help you bridge the gap from your current role.</p>

            <div className="path-step">
                <h3>Step 1: Master These Skills</h3>
                <div className="skill-gap-container">
                    {skillGapData.skillGaps.map(skill => (
                        <div className="skill-gap-card" key={skill}>
                            <strong>Skill to Develop:</strong> {skill}
                        </div>
                    ))}
                </div>
            </div>

            <div className="path-step">
                <h3>Step 2: Take Action</h3>
                <ul>
                    {skillGapData.recommendedActions.map(action => (
                        <li key={action}>{action}</li>
                    ))}
                </ul>
            </div>
             <button>Add to My Development Plan</button>
        </div>
    );
}

export default CareerPathPage;