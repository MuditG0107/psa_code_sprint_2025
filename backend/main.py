# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pyodbc
#from openai import AzureOpenAI
import requests
from typing import Optional, List, Dict
import joblib  # For loading the model
import numpy as np # For data manipulation
from datetime import datetime # For calculating tenure

# --- Database & API Key Setup ---
# (Add your database connection details and API key here)
conn_str = (
    r'DRIVER={ODBC Driver 17 for SQL Server};' # Or another driver like '{ODBC Driver 17 for SQL Server}'
    r'SERVER=LAPTOP-PD6OCT58\SQLEXPRESS12;'
    r'DATABASE=PSA_Hackathon_2025;'
    r'Trusted_Connection=yes;'
    r'MARS_Connection=yes;'
)
sql_db = pyodbc.connect(conn_str)

try:
    model = joblib.load('leadership_model.pkl')
    scaler = joblib.load('scaler.pkl')
    print("✅ Leadership model and scaler loaded successfully.")
except FileNotFoundError:
    model = None
    scaler = None
    print("⚠️ WARNING: leadership_model.pkl or scaler.pkl not found. Prediction endpoint will not work.")

HACKATHON_API_URL = "https://psacodesprint2025.azure-api.net/openai/deployments/gpt-5-mini/chat/completions?api-version=2025-01-01-preview"
HACKATHON_API_KEY = "ae8a38fbbef5413dab639f0355ede6a8" 

# This tells FastAPI exactly what the JSON body should look like.
class ChatRequest(BaseModel):
    message: str
    employee_id: str
    state: Optional[str] = None
    history: List[Dict[str, str]] = []

class Period(BaseModel):
    start: Optional[str] = None
    end: Optional[str] = None

class Experience(BaseModel):
    experience_id: Optional[int] = None # For identifying existing experiences
    type: str
    organization: str
    program: str
    period: Period
    focus: str

class UpdateInfoRequest(BaseModel):
    skills: List[str]
    experiences: List[Experience]

def get_full_employee_context(cursor, employee_id: str) -> str:
    """Queries all relevant tables to build a comprehensive context string for the AI."""
    
    # Basic Info
    cursor.execute("SELECT name, job_title, department FROM employees WHERE employee_id = ?", employee_id)
    employee = cursor.fetchone()
    if not employee:
        return "No employee data found."

    context = f"Employee Profile:\n- Name: {employee.name}\n- Job Title: {employee.job_title}\n- Department: {employee.department}\n"

    # Skills
    cursor.execute("""
        SELECT s.skill_name FROM skills s
        JOIN employee_skills es ON s.skill_id = es.skill_id
        WHERE es.employee_id = ?
    """, employee_id)
    skills = [row.skill_name for row in cursor.fetchall()]
    if skills:
        context += f"- Skills: {', '.join(skills)}\n"

    # Position History
    cursor.execute("SELECT TOP 3 role_title, start_date, end_date FROM position_history WHERE employee_id = ? ORDER BY start_date DESC", employee_id)
    history = [f"{row.role_title} (From {row.start_date} to {row.end_date or 'Present'})" for row in cursor.fetchall()]
    if history:
        context += f"- Recent Roles: {'; '.join(history)}\n"

    # Add other queries for projects, competencies etc. here
    
    return context

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# --- API Endpoints ---
@app.get("/api/employee/{employee_id}")
def get_employee_info(employee_id: str):
    print("1")
    """Fetches core employee data from the SQL database."""
    cursor = sql_db.cursor()
    cursor.execute("SELECT * FROM employees WHERE employee_id = ?", employee_id)
    
    row = cursor.fetchone()
    if not row:
        return {}
        
    # 1. Get the column names from the cursor's description.
    columns = [column[0] for column in cursor.description]
    
    # 2. Zip the column names (keys) with the row's values to create key-value pairs.
    employee_dict = dict(zip(columns, row))
    
    return employee_dict

@app.get("/api/employee/{employee_id}/career_recommendations")
def get_career_recommendations(employee_id: str):
    """
    Finds potential next specializations by calculating a match percentage,
    excluding specializations the user is already proficient in.
    """
    cursor = sql_db.cursor()
    
    # This improved query calculates a match percentage and excludes current specializations.
    sql_query = """
    WITH SpecializationSkillCounts AS (
        -- Step 1: Count total skills for each specialization
        SELECT s.specialization_id, COUNT(sk.skill_id) AS total_skills
        FROM specializations s
        JOIN skills sk ON s.specialization_id = sk.specialization_id
        GROUP BY s.specialization_id
    ),
    EmployeeSkillOverlap AS (
        -- Step 2: Count overlapping skills between the employee and each specialization
        SELECT 
            sk.specialization_id,
            COUNT(sk.skill_id) AS overlap_count
        FROM skills sk
        WHERE sk.skill_id IN (SELECT skill_id FROM employee_skills WHERE employee_id = ?)
        GROUP BY sk.specialization_id
    )
    -- Step 3: Join the data, calculate percentage, and filter
    SELECT TOP 3
        s.specialization_name AS recommended_role,
        (CAST(eso.overlap_count AS FLOAT) * 100.0 / ssc.total_skills) AS skill_overlap_percent
    FROM 
        specializations s
    JOIN 
        SpecializationSkillCounts ssc ON s.specialization_id = ssc.specialization_id
    JOIN 
        EmployeeSkillOverlap eso ON s.specialization_id = eso.specialization_id
    WHERE
        -- Exclude specializations where the user has a high match already
        (CAST(eso.overlap_count AS FLOAT) * 100.0 / ssc.total_skills) < 90
    ORDER BY 
        skill_overlap_percent DESC;
    """
    
    cursor.execute(sql_query, employee_id)
    
    results_as_tuples = cursor.fetchall()
    columns = [column[0] for column in cursor.description]
    recommendations = [dict(zip(columns, row)) for row in results_as_tuples]
    
    return {"recommendations": recommendations}

@app.get("/api/employee/{employee_id}/leadership_potential")
def get_leadership_potential(employee_id: str):
    """
    Predicts the leadership potential for a given employee using the pre-trained model.
    """
    if not model or not scaler:
        raise HTTPException(status_code=500, detail="Leadership model is not loaded.")

    cursor = sql_db.cursor()

    # --- 1. Fetch the same features used for training ---
    cursor.execute("SELECT hire_date FROM employees WHERE employee_id = ?", employee_id)
    hire_date_row = cursor.fetchone()
    if not hire_date_row:
        raise HTTPException(status_code=404, detail="Employee not found.")
    days_with_company = (datetime.now().date() - hire_date_row.hire_date).days

    cursor.execute("SELECT COUNT(history_id) - 1 FROM position_history WHERE employee_id = ?", employee_id)
    num_promotions = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(id) FROM employee_skills WHERE employee_id = ?", employee_id)
    num_skills = cursor.fetchone()[0]

    # --- 2. Prepare data and make a prediction ---
    features_array = np.array([[days_with_company, num_promotions, num_skills]])
    features_scaled = scaler.transform(features_array)
    
    # Predict the probability of being in the 'leader' class (class 1)
    probability = model.predict_proba(features_scaled)[0][1]
    score = int(probability * 100)

    # --- 3. Explain the score ---
    explanation = {
        "score": score,
        "positive_factors": [
            f"Strong tenure of {days_with_company // 365} years with the company.",
            f"Demonstrated growth with {num_promotions if num_promotions > 0 else 0} promotion(s).",
            f"Broad expertise with {num_skills} skills on record."
        ]
    }
    return explanation


@app.post("/api/chatbot")
def chat_with_bot(request_data: ChatRequest):
    """
    Orchestrates a stateful conversation with full employee context and memory.
    """
    employee_id = request_data.employee_id
    message = request_data.message
    state = request_data.state or "START"
    history = request_data.history
    
    cursor = sql_db.cursor()

    # --- Initial Check ---
    cursor.execute("SELECT name FROM employees WHERE employee_id = ?", employee_id)
    employee = cursor.fetchone()
    if not employee:
        return {"reply": "I'm sorry, that employee ID was not found.", "next_state": "START"}

    employee_name = employee.name

    # --- 1. MENTAL WELL-BEING KEYWORD DETECTION ---
    # This check happens on every message, regardless of the conversation state.
    mental_wellbeing_keywords = ["stress", "anxious", "overwhelmed", "burnt out", "unhappy", "sad"]
    if any(keyword in message.lower() for keyword in mental_wellbeing_keywords) and state != "SUPPORT_MODE":
        print("--- Mental well-being keyword detected. Entering support mode. ---")
        
        # This is a pre-written, empathetic opening that invites conversation.
        reply = (
            f"It sounds like you're going through a tough time, {employee_name}. I'm here to listen if you'd like to share more. "
            "Please remember, I'm an AI assistant and not a healthcare professional. "
            "Whenever you're ready, I can also provide you with some official, confidential company resources."
        )
        
        # Transition to the dedicated support state
        return {"reply": reply, "next_state": "SUPPORT_MODE"}

    # --- 2. STATE MACHINE FOR CONVERSATIONAL FLOW ---
    
    # State for dedicated, continuous support conversation
    if state == "SUPPORT_MODE":
        print("--- Continuing conversation in support mode. ---")
        
        # Check for keywords to exit support mode and return to the main menu
        exit_keywords = ["thanks", "thank you", "ok", "menu", "career", "skills", "pathway"]
        if any(keyword in message.lower() for keyword in exit_keywords):
            return {
                "reply": f"You're welcome, {employee_name}. What can I help you with now?\n1. Explore Career Pathways\n2. Get an Upskilling Plan\n3. Assess Leadership Potential\n4. Find a Mentor",
                "next_state": "MAIN_MENU"
            }
            
        # This system prompt is for being a supportive listener.
        system_prompt = (
            "You are a compassionate and supportive AI assistant for PSA. Your primary role is to be an empathetic listener. "
            "STRICT RULES: Acknowledge and validate the user's feelings (e.g., 'That sounds really difficult,' 'I'm sorry to hear you're feeling that way'). "
            "DO NOT give advice. DO NOT act like a therapist. DO NOT ask probing questions. "
            "You can ask gentle, open-ended questions like 'Is there anything else you'd like to share?' or simply say 'Thank you for sharing.' "
            "If you haven't already, gently offer to provide the official, confidential company resources."
        )
        
        resources_text = (
            "Here are some confidential resources available to you anytime:\n"
            "- **PSA HR Support Line:** +65 12345678\n"
            "- **Employee Assistance Program (EAP) Helpline:** +65 98765432\n"
            "- **Email HR Wellness Team:** hr_wellness@globalpsa.com"
        )
        
        full_prompt_for_ai = system_prompt + "\n\nHere are the resources to offer if the user asks or if it feels appropriate:\n" + resources_text

        headers = {"Content-Type": "application/json", "api-key": HACKATHON_API_KEY}
        messages_payload = [{"role": "system", "content": full_prompt_for_ai}] + history + [{"role": "user", "content": message}]
        body = {"model": "gpt-5-mini", "messages": messages_payload}
        
        try:
            response = requests.post(HACKATHON_API_URL, headers=headers, json=body)
            response.raise_for_status()
            data = response.json()
            # The bot remains in support mode until the user decides to exit.
            return {"reply": data['choices'][0]['message']['content'], "next_state": "SUPPORT_MODE"}
        except requests.exceptions.RequestException:
            return {"reply": "I'm having trouble connecting right now, but please know that help is available through PSA's official channels.", "next_state": "SUPPORT_MODE"}
    # --- State Machine Logic ---
    
    # State 1: Start of the conversation
    if state == "START":
        cursor.execute("SELECT 1 FROM employee_skills WHERE employee_id = ?", employee_id)
        has_skills = cursor.fetchone()
        
        if not has_skills: # First-time user
            return {
                "reply": f"Welcome, {employee_name}! It looks like this is your first time. To personalize your experience, please tell me about your skills. You can list them separated by commas.",
                "next_state": "ONBOARDING_SKILLS"
            }
        else: # Returning user
            return {
                "reply": f"Welcome back, {employee_name}! What can I help you with today?\n1. Explore Career Pathways\n2. Get an Upskilling Plan\n3. Assess Leadership Potential\n4. Find a Mentor",
                "next_state": "MAIN_MENU"
            }

    # State 2: User has submitted their skills for the first time
    elif state == "ONBOARDING_SKILLS":
        # TODO: Add logic here to parse the message, find skill IDs, and INSERT into employee_skills table.
        print(f"TODO: Add skills for {employee_id}: {message}")
        return {
            "reply": "Thank you for sharing your skills! Your profile is now set up. What can I help you with today?\n1. Explore Career Pathways\n2. Get an Upskilling Plan\n3. Assess Leadership Potential\n4. Find a Mentor",
            "next_state": "MAIN_MENU"
        }

    # State 3: User is at the main menu
    elif state == "MAIN_MENU":
        if message == "1" or "pathway" in message.lower():
            recommendations_data = get_career_recommendations(employee_id)
            recs = recommendations_data.get('recommendations', [])
            if recs:
                rec_text = ", ".join([r['recommended_role'] for r in recs])
                reply = f"Based on your skills, you could explore specializations like: {rec_text}."
            else:
                reply = "I couldn't find any specific recommendations for you at this time."
            
            return {"reply": reply, "next_state": "MAIN_MENU"}
        
        elif message == "2" or "upskill" in message.lower():
            return {
                "reply": "Great! To generate an upskilling plan, which job role or specialization are you aiming for?",
                "next_state": "AWAITING_UPSKILL_TARGET"
            }
        
        elif message == "3" or "leadership" in message.lower():
            try:
                prediction_data = get_leadership_potential(employee_id)
                score = prediction_data['score']
                
                reply = (
                    f"Based on your career history, your leadership potential score is estimated at **{score} out of 100**. "
                    "This score reflects factors like your tenure, number of promotions, and skills. "
                    "Would you like some suggestions on how to further develop your leadership capabilities?"
                )
                return {"reply": reply, "next_state": "AWAITING_LEADERSHIP_IMPROVEMENT"}
            except Exception as e:
                print(f"Leadership prediction error: {e}")
                return {"reply": "Sorry, I was unable to calculate the leadership potential score at this time.", "next_state": "MAIN_MENU"}
        
        elif message == "4" or "mentor" in message.lower():
            return {
                "reply": "I can help with that! To find the best match, what specific skill are you looking to develop, or what job title are you interested in?",
                "next_state": "AWAITING_MENTOR_QUERY"
            }
        
        # --- IF THE USER ASKS A GENERAL QUESTION, CALL THE AI ---
        else:
            print("--- Making a call to the external AI for a general query ---")
            employee_context = get_full_employee_context(cursor, employee_id)
            system_prompt = (
                "You are an expert career coach for PSA. You must follow these rules strictly:\n"
                "1. **Be concise:** Keep your answers short and directly to the point.\n"
                "2. **Answer ONLY the user's direct question:** Do not add extra information, suggestions, or recommendations unless the user explicitly asks for them.\n"
                "3. **Use the provided context:** Use the employee profile below to inform your answer, but do not simply repeat it.\n"
                "4. **Maintain a professional tone:** Refer to the user by their name if appropriate.\n\n"
                "--- EMPLOYEE CONTEXT ---\n"
                f"{employee_context}"
                "\n--- END CONTEXT ---"
            )
            headers = {"Content-Type": "application/json", "api-key": HACKATHON_API_KEY}
            messages_payload = [{"role": "system", "content": system_prompt}] + history + [{"role": "user", "content": message}]
            body = {"model": "gpt-5-mini", "messages": messages_payload}
            
            try:
                response = requests.post(HACKATHON_API_URL, headers=headers, json=body)
                response.raise_for_status()
                data = response.json()
                return {"reply": data['choices'][0]['message']['content'], "next_state": "MAIN_MENU"}
            except requests.exceptions.RequestException as e:
                print(f"API Error: {e}")
                return {"reply": "Sorry, there was an error connecting to the AI service.", "next_state": "MAIN_MENU"}
    
    # State 4: User has provided a target role for upskilling
    elif state == "AWAITING_MENTOR_QUERY":
        search_term = message.strip()
        
        # This query finds senior employees who have the requested skill and are not the user or their manager.
        query = """
            SELECT TOP 3 e.name, e.email, e.job_title FROM employees e
            JOIN employee_skills es ON e.employee_id = es.employee_id
            JOIN skills s ON es.skill_id = s.skill_id
            WHERE 
              s.skill_name LIKE ?
            GROUP BY
                e.name, e.email, e.job_title, e.in_role_since
            ORDER BY e.in_role_since ASC;
        """
        cursor.execute(query, f"%{search_term}%")
        mentors = cursor.fetchall()

        if not mentors:
            reply = f"I couldn't find any potential mentors with the skill '{search_term}'. You could try searching for a related skill."
            return {"reply": reply, "next_state": "AWAITING_MENTOR_QUERY"}
        else:
            reply = f"Here are a few colleagues with expertise in '{search_term}' who you could reach out to:\n\n---\n"
            for mentor in mentors:
                reply += (
                    f"**{mentor.name}**\n\n"
                    f"*{mentor.job_title}*\n\n"
                    f"Email: {mentor.email}\n\n"
                    "---\n"
                )
        
        return {"reply": reply, "next_state": "MAIN_MENU"}
    
    elif state == "AWAITING_UPSKILL_TARGET":
        target_role = message.strip()
        
        # --- 1. Get the skills required for the target role/specialization ---
        required_skills_query = """
            SELECT sk.skill_name
            FROM skills sk
            JOIN specializations s ON sk.specialization_id = s.specialization_id
            WHERE s.specialization_name LIKE ?
        """
        cursor.execute(required_skills_query, f"%{target_role}%")
        required_skills = {row.skill_name for row in cursor.fetchall()}

        if not required_skills:
            return {
                "reply": f"I'm sorry, I couldn't find any information on the role or specialization '{target_role}'. Please try another.",
                "next_state": "AWAITING_UPSKILL_TARGET" # Stay in this state to let the user try again
            }

        # --- 2. Get the employee's current skills ---
        current_skills_query = """
            SELECT s.skill_name 
            FROM skills s
            JOIN employee_skills es ON s.skill_id = es.skill_id
            WHERE es.employee_id = ?
        """
        cursor.execute(current_skills_query, employee_id)
        current_skills = {row.skill_name for row in cursor.fetchall()}

        # --- 3. Calculate the skill gap ---
        skill_gap = required_skills - current_skills

        # --- 4. Format the reply ---
        if not skill_gap:
            reply = f"That's great news! Based on your profile, you already possess all the necessary skills for a role in '{target_role}'."
        else:
            skills_to_learn = ", ".join(skill_gap)
            reply = f"To move into a role related to '{target_role}', you would need to develop the following skills: **{skills_to_learn}**. Would you like me to suggest some resources to learn these?"
        
        return {"reply": reply, "next_state": "AWAITING_RESOURCE_REQUEST"}
    
    elif state == "AWAITING_RESOURCE_REQUEST":
        affirmative_responses = ["yes", "ok", "sure", "please", "yeah"]
        if any(word in message.lower() for word in affirmative_responses):
            # In a real system, you could query a database of learning materials here.
            reply = "Great! I recommend checking out the **PSA Learning Hub** for internal courses on these topics. You can also look for relevant projects on the internal opportunities board to get hands-on experience."
        else:
            reply = "Alright. If you change your mind or need anything else, just let me know!"
        
        # After answering, return to the main menu.
        return {"reply": reply, "next_state": "MAIN_MENU"}

    elif state == "AWAITING_LEADERSHIP_IMPROVEMENT":
        if "yes" in message.lower():
            reply = "Great! To improve your leadership potential, I recommend focusing on these areas:\n1. **Lead a project initiative:** Proactively take ownership of a new project, even a small one.\n2. **Mentor a junior colleague:** Sharing your expertise is a key leadership trait.\n3. **Develop strategic skills:** Consider learning more about 'Enterprise Architecture' or 'Financial Modeling' to broaden your business acumen."
        else:
            reply = "Alright. If you change your mind or need anything else, just let me know!"
        
        return {"reply": reply, "next_state": "MAIN_MENU"}
    # Default fallback
    return {
        "reply": "I'm not sure how to handle that. Let's go back to the main menu.",
        "next_state": "MAIN_MENU"
    }

@app.get("/api/employee/{employee_id}/details")
def get_employee_details(employee_id: str):
    """Fetches the specific details an employee can update (skills and experiences)."""
    cursor = sql_db.cursor()
    
    # Fetch skills
    cursor.execute("""
        SELECT s.skill_name FROM skills s
        JOIN employee_skills es ON s.skill_id = es.skill_id
        WHERE es.employee_id = ?
    """, employee_id)
    skills = [row.skill_name for row in cursor.fetchall()]

    # Fetch experiences
    cursor.execute("SELECT experience_id, experience_type, organization, program_name, start_date, end_date, focus FROM experiences WHERE employee_id = ?", employee_id)
    experiences_raw = cursor.fetchall()
    experiences = [
        {
            "experience_id": row.experience_id,
            "type": row.experience_type,
            "organization": row.organization,
            "program": row.program_name,
            "period": {"start": str(row.start_date) if row.start_date else None, "end": str(row.end_date) if row.end_date else None},
            "focus": row.focus
        } for row in experiences_raw
    ]
    
    return {"skills": skills, "experiences": experiences}

@app.post("/api/employee/{employee_id}/update")
def update_employee_details(employee_id: str, data: UpdateInfoRequest):
    """Updates the employee's skills and experiences in the database."""
    try:
        cursor = sql_db.cursor()
        
        # 1. Update skills (delete all and re-insert)
        cursor.execute("DELETE FROM employee_skills WHERE employee_id = ?", employee_id)
        if data.skills:
            placeholders = ','.join('?' for _ in data.skills)
            cursor.execute(f"SELECT skill_id, skill_name FROM skills WHERE skill_name IN ({placeholders})", tuple(data.skills))
            skill_id_map = {row.skill_name: row.skill_id for row in cursor.fetchall()}

            for skill_name in data.skills:
                if skill_name in skill_id_map:
                    skill_id = skill_id_map[skill_name]
                    cursor.execute("INSERT INTO employee_skills (employee_id, skill_id) VALUES (?, ?)", employee_id, skill_id)
        
        # 2. Update experiences (delete all and re-insert)
        cursor.execute("DELETE FROM experiences WHERE employee_id = ?", employee_id)
        for exp in data.experiences:
            cursor.execute(
                "INSERT INTO experiences (employee_id, experience_type, organization, program_name, start_date, end_date, focus) VALUES (?, ?, ?, ?, ?, ?, ?)",
                employee_id, exp.type, exp.organization, exp.program, exp.period.start, exp.period.end, exp.focus
            )
            
        sql_db.commit()
        return {"message": "Profile updated successfully"}
    except Exception as e:
        print(f"Update Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile.")