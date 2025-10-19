# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pyodbc
#from openai import AzureOpenAI
import requests
from typing import Optional

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

HACKATHON_API_URL = "https://psacodesprint2025.azure-api.net/openai/deployments/gpt-5-mini/chat/completions?api-version=2025-01-01-preview"
HACKATHON_API_KEY = "ae8a38fbbef5413dab639f0355ede6a8" 

#client = OpenAI(
#    api_key="ae8a38fbbef5413dab639f0355ede6a8",
#    base_url=HACKATHON_API_URL
#)

#client = AzureOpenAI(
    # Get the endpoint from an environment variable or the hackathon docs
#    azure_endpoint= HACKATHON_API_URL, 
    
    # The API version provided in the hackathon docs
#    api_version="2025-01-01-preview",
    
    # Your primary key from the hackathon dashboard
#    api_key=
#)

# This tells FastAPI exactly what the JSON body should look like.
class ChatRequest(BaseModel):
    message: str
    employee_id: str
    state: Optional[str] = None

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
    print("2")
    """Finds potential next roles by calculating skill overlap."""
    cursor = sql_db.cursor()
    
    # Corrected: Use 'TOP 3' for SQL Server and '?' for parameters
    sql_query = """
    SELECT TOP 3
        s.specialization_name AS recommended_role, -- We use the alias 'recommended_role' so the frontend doesn't need to change
        COUNT(sk.skill_id) AS skill_overlap
    FROM 
        specializations s
    JOIN 
        skills sk ON s.specialization_id = sk.specialization_id
    WHERE 
        sk.skill_id IN (
            -- Subquery to get all skill IDs for the given employee
            SELECT skill_id FROM employee_skills WHERE employee_id = ?
        )
    GROUP BY 
        s.specialization_name
    ORDER BY 
        skill_overlap DESC;
    """
    
    cursor.execute(sql_query, employee_id)
    
    # Corrected: Manually convert list of tuples to list of dictionaries
    results_as_tuples = cursor.fetchall()
    columns = [column[0] for column in cursor.description]
    recommendations = [dict(zip(columns, row)) for row in results_as_tuples]
    
    return {"recommendations": recommendations}

@app.post("/api/chatbot")
def chat_with_bot(request_data: ChatRequest):
    """Orchestrates the conversation based on the user's state."""
    
    employee_id = request_data.employee_id
    message = request_data.message
    state = request_data.state or "START" # Default to START if state is null
    
    cursor = sql_db.cursor()

    # --- Initial Check: Does the employee exist? ---
    cursor.execute("SELECT name FROM employees WHERE employee_id = ?", employee_id)
    employee = cursor.fetchone()

    if not employee:
        return {
            "reply": "I'm sorry, that employee ID was not found. Please enter a valid Employee ID to begin.",
            "next_state": "START"
        }

    employee_name = employee.name

    # --- State Machine: Decide what to do based on the current state ---
    
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
        if "1" in message or "pathway" in message.lower():
            recommendations_data = get_career_recommendations(employee_id)
            recs = recommendations_data.get('recommendations', [])
            if recs:
                rec_text = ", ".join([r['recommended_role'] for r in recs])
                reply = f"Based on your skills, you could explore specializations like: {rec_text}."
            else:
                reply = "I couldn't find any specific recommendations for you at this time."
            
            return {"reply": reply, "next_state": "MAIN_MENU"}
        
        elif "2" in message or "upskill" in message.lower():
            return {
                "reply": "Great! To generate an upskilling plan, which job role or specialization are you aiming for?",
                "next_state": "AWAITING_UPSKILL_TARGET"
            }
        
        # --- IF THE USER ASKS A GENERAL QUESTION, CALL THE AI ---
        else:
            print("--- Making a call to the external AI for a general query ---")
            # This section uses your existing, working API call logic.
            headers = {"Content-Type": "application/json", "api-key": HACKATHON_API_KEY}
            body = {
                "model": "gpt-5-mini",
                "messages": [
                    {"role": "system", "content": f"You are a helpful career coach for PSA. You are speaking with employee {employee_name} ({employee_id})."},
                    {"role": "user", "content": message}
                ]
            }
            try:
                response = requests.post(HACKATHON_API_URL, headers=headers, json=body)
                response.raise_for_status()
                data = response.json()
                return {"reply": data['choices'][0]['message']['content'], "next_state": "MAIN_MENU"}
            except requests.exceptions.RequestException as e:
                print(f"API Error: {e}")
                return {"reply": "Sorry, there was an error connecting to the AI service.", "next_state": "MAIN_MENU"}
    
    # State 4: User has provided a target role for upskilling
    elif state == "AWAITING_UPSKILL_TARGET":
        target_role = message
        # TODO: Add logic here to find skill gaps for the target_role.
        reply = f"To move into a role in '{target_role}', you would need to develop skills in [Skill A, Skill B, Skill C]. Would you like me to suggest some resources?"
        return {"reply": reply, "next_state": "MAIN_MENU"}

    # Default fallback if the state is unknown
    return {
        "reply": "I'm not sure how to handle that. Let's go back to the main menu.",
        "next_state": "MAIN_MENU"
    }


#@app.post("/api/chatbot")
#def chat_with_bot(request_data: ChatRequest):
#
#    print("--- Chatbot endpoint was successfully called! ---")
#
#    """Handles conversational interaction using the hackathon's API gateway."""
#
#    # Define the headers for the request, including the subscription key
#    headers = {
#        "Content-Type": "application/json",
#        "api-key": HACKATHON_API_KEY
#    }
#
#    # Define the body of the request
#    body = {
#        "model": "gpt-5-mini",
#        "messages": [
#            {"role": "system", "content": f"You are a helpful career coach for PSA. You are speaking with employee {request_data.employee_id}."},
#            {"role": "user", "content": request_data.message}
#        ]
#    }
#
#    try:
#        # Make the POST request to the hackathon's URL
#        response = requests.post(HACKATHON_API_URL, headers=headers, json=body)
#        response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
#
#        data = response.json()
#        reply = data['choices'][0]['message']['content']
#        return {"reply": reply}
#
#    except requests.exceptions.RequestException as e:
#        print(f"API Error: {e}")
#        return {"reply": "Sorry, there was an error connecting to the AI service."}