import json
import pyodbc

# --- 1. CONFIGURE YOUR DATABASE CONNECTION ---
# IMPORTANT: Replace these with your actual SQL Server details.
# For Windows Authentication, you might use 'Trusted_Connection=yes' instead of UID and PWD.
DB_CONFIG = {
    'driver': '{ODBC Driver 17 for SQL Server}', # Or another driver like '{ODBC Driver 17 for SQL Server}'
    'server': r'LAPTOP-PD6OCT58\SQLEXPRESS12',
    'database': 'PSA_Hackathon_2025',
    'Trusted_Connection': 'yes'
}

# --- 2. THE MAIN SCRIPT LOGIC ---
def ingest_employee_data(json_path):
    """
    Reads employee profiles from a JSON file and inserts them into the SQL Server database.
    """
    try:
        # Establish connection
        conn_str = ';'.join(f'{k}={v}' for k, v in DB_CONFIG.items())
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        print("✅ Successfully connected to the database.")

        # Load the JSON data
        with open(json_path, 'r') as f:
            employee_profiles = json.load(f)

        # Cache to avoid re-inserting the same skill and getting its ID
        skill_id_cache = {}

        # Process each employee profile
        for employee in employee_profiles:
            emp_id = employee['employee_id']
            print(f"\nProcessing employee: {employee['personal_info']['name']} ({emp_id})")

            # A. Insert into 'employees' table
            info = employee['personal_info']
            emp_info = employee['employment_info']
            cursor.execute("""
                INSERT INTO employees (employee_id, name, email, office_location, line_manager, 
                                     job_title, department, unit, hire_date, in_role_since)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, 
            emp_id, info['name'], info['email'], info.get('office_location'), 
            emp_info.get('line_manager'), emp_info['job_title'], emp_info['department'],
            emp_info['unit'], emp_info['hire_date'], emp_info['in_role_since'])

            # B. Insert into 'skills' and 'employee_skills'
            for skill in employee['skills']:
                skill_name = skill['skill_name']
                if skill_name not in skill_id_cache:
                    # Check if skill already exists in the DB from a previous run
                    cursor.execute("SELECT skill_id FROM skills WHERE skill_name = ?", skill_name)
                    row = cursor.fetchone()
                    if row:
                        skill_id_cache[skill_name] = row.skill_id
                    else:
                        # Insert new skill and get its ID
                        sql_insert_skill = """
                            INSERT INTO skills (skill_name, function_area, specialization)
                            OUTPUT Inserted.skill_id
                            VALUES (?, ?, ?);
                        """
                        # This single command now inserts the skill AND returns the new ID
                        new_skill_id = cursor.execute(
                            sql_insert_skill, 
                            skill_name, 
                            skill.get('function_area'), 
                            skill.get('specialization')
                        ).fetchone()[0]

                        skill_id_cache[skill_name] = new_skill_id
                
                # Link skill to employee
                cursor.execute("INSERT INTO employee_skills (employee_id, skill_id) VALUES (?, ?)", 
                               emp_id, skill_id_cache[skill_name])

            # C. Insert into 'position_history'
            for pos in employee['positions_history']:
                cursor.execute("""
                    INSERT INTO position_history (employee_id, role_title, organization, 
                                                start_date, end_date, focus_areas)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, emp_id, pos['role_title'], pos['organization'], pos['period']['start'],
                   pos['period'].get('end'), ', '.join(pos.get('focus_areas', [])))

            # D. Insert into 'projects' and 'project_members'
            for proj in employee.get('projects', []):
                # Insert new project and get its ID using the OUTPUT clause
                sql_insert_project = """
                    INSERT INTO projects (project_name, start_date, end_date, description, outcomes)
                    OUTPUT Inserted.project_id
                    VALUES (?, ?, ?, ?, ?);
                """
                project_id = cursor.execute(
                    sql_insert_project,
                    proj['project_name'], 
                    proj['period']['start'], 
                    proj['period'].get('end'),
                    proj.get('description'), 
                    ', '.join(proj.get('outcomes', []))
                ).fetchone()[0] # This will now correctly capture the new project ID
                
                # Link the employee to the project
                cursor.execute("""
                    INSERT INTO project_members (project_id, employee_id, role_in_project)
                    VALUES (?, ?, ?)
                """, project_id, emp_id, proj.get('role'))

            # E. Insert into 'experiences', 'education', 'competencies', 'languages'
            # (Following the same pattern as above for each section)
            for exp in employee.get('experiences', []):
                cursor.execute("INSERT INTO experiences (employee_id, experience_type, program_name, organization, start_date, end_date, focus) VALUES (?, ?, ?, ?, ?, ?, ?)",
                               emp_id, exp.get('type'), exp.get('program'), exp.get('organization'), exp['period'].get('start'), exp['period'].get('end'), exp.get('focus'))

            for edu in employee.get('education', []):
                cursor.execute("INSERT INTO education (employee_id, degree, institution, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
                               emp_id, edu.get('degree'), edu.get('institution'), edu['period'].get('start'), edu['period'].get('end'))

            for comp in employee.get('competencies', []):
                cursor.execute("INSERT INTO employee_competencies (employee_id, competency_name, proficiency_level) VALUES (?, ?, ?)",
                               emp_id, comp.get('name'), comp.get('level'))

            for lang in employee['personal_info'].get('languages', []):
                cursor.execute("INSERT INTO employee_languages (employee_id, language, proficiency) VALUES (?, ?, ?)",
                               emp_id, lang.get('language'), lang.get('proficiency'))

        # Commit the transaction to save all changes
        conn.commit()
        print("\n🎉 All data has been successfully ingested into the database!")

    except pyodbc.Error as ex:
        sqlstate = ex.args[0]
        print(f"❌ Database Error Occurred: {sqlstate}")
        print(ex)

    finally:
        if 'conn' in locals() and conn:
            conn.close()
            print("Connection closed.")

# --- 3. RUN THE SCRIPT ---
if __name__ == "__main__":
    ingest_employee_data('Employee_Profiles.json')