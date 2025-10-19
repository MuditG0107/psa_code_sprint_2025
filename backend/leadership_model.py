import pyodbc
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import joblib
from datetime import datetime

# --- 1. Database Connection ---
# Use the same connection details as your main.py
DB_CONFIG = {
    'driver': '{ODBC Driver 17 for SQL Server}', # Or another driver like '{ODBC Driver 17 for SQL Server}'
    'server': r'LAPTOP-PD6OCT58\SQLEXPRESS12',
    'database': 'PSA_Hackathon_2025',
    'Trusted_Connection': 'yes',
    'MARS_Connection': 'yes'
}

def train_and_save_model():
    """
    Connects to the database, engineers features, trains a leadership
    prediction model, and saves it to a file.
    """
    print("Connecting to the database...")
    conn_str = ';'.join(f'{k}={v}' for k, v in DB_CONFIG.items())
    conn = pyodbc.connect(conn_str)

    # --- 2. Feature Engineering ---
    # We'll gather data from various tables to build features.
    print("Fetching data and engineering features...")
    
    # Get basic employee info like tenure
    employees_query = "SELECT employee_id, hire_date, job_title FROM employees"
    employees_df = pd.read_sql(employees_query, conn)
    employees_df['hire_date'] = pd.to_datetime(employees_df['hire_date'])
    employees_df['days_with_company'] = (datetime.now() - employees_df['hire_date']).dt.days

    # Get number of promotions (position changes)
    promotions_query = "SELECT employee_id, COUNT(history_id) - 1 AS num_promotions FROM position_history GROUP BY employee_id"
    promotions_df = pd.read_sql(promotions_query, conn)

    # Get number of skills
    skills_query = "SELECT employee_id, COUNT(id) AS num_skills FROM employee_skills GROUP BY employee_id"
    skills_df = pd.read_sql(skills_query, conn)

    # Merge all data into a single DataFrame
    df = pd.merge(employees_df, promotions_df, on='employee_id', how='left')
    df = pd.merge(df, skills_df, on='employee_id', how='left')
    df.fillna(0, inplace=True)

    # --- 3. Define the Target Variable (What is "Leadership"?) ---
    # For this model, we'll define a leader as anyone with "Manager", "Lead", or "Architect" in their title.
    # In a real-world scenario, this would be based on more robust performance data.
    leader_keywords = ['Manager', 'Lead', 'Architect']
    df['is_leader'] = df['job_title'].apply(lambda x: 1 if any(keyword in x for keyword in leader_keywords) else 0)

    # --- 4. Model Training ---
    print("Training the leadership potential model...")
    
    # Define features and target
    features = ['days_with_company', 'num_promotions', 'num_skills']
    X = df[features]
    y = df['is_leader']

    # Scale the features for better performance
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train a simple logistic regression model
    model = LogisticRegression(random_state=42, class_weight='balanced')
    model.fit(X_scaled, y)

    # --- 5. Save the Model and Scaler ---
    # We save both so we can make predictions on new data later.
    joblib.dump(model, 'leadership_model.pkl')
    joblib.dump(scaler, 'scaler.pkl')
    print("✅ Model and scaler have been saved to 'leadership_model.pkl' and 'scaler.pkl'.")

if __name__ == "__main__":
    train_and_save_model()
