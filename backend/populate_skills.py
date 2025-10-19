import csv
import pyodbc

# --- 1. CONFIGURE YOUR DATABASE CONNECTION ---
# Update these details to match your SQL Server setup.
DB_CONFIG = {
    'driver': '{ODBC Driver 17 for SQL Server}', # Or another driver like '{ODBC Driver 17 for SQL Server}'
    'server': r'LAPTOP-PD6OCT58\SQLEXPRESS12',
    'database': 'PSA_Hackathon_2025',
    'Trusted_Connection': 'yes'
}

# NEW, CORRECTED HELPER FUNCTION
def get_or_create_id(cursor, table_name, id_column, value_column, value, parent_id_data=None):
    """
    A helper function to get the ID of a value if it exists, or create it if it doesn't.
    Now correctly uses the specified ID column name.
    Returns the ID of the row.
    """
    # Check if the item exists
    cursor.execute(f"SELECT {id_column} FROM {table_name} WHERE {value_column} = ?", value)
    row = cursor.fetchone()
    
    if row:
        return row[0]
    else:
        # Item does not exist, so insert it
        parent_col_name, parent_id = (None, None)
        if parent_id_data:
            parent_col_name, parent_id = parent_id_data

        if parent_col_name:
            sql_insert = f"""
                INSERT INTO {table_name} ({value_column}, {parent_col_name})
                OUTPUT Inserted.{id_column}
                VALUES (?, ?);
            """
            return cursor.execute(sql_insert, value, parent_id).fetchone()[0]
        else:
            sql_insert = f"""
                INSERT INTO {table_name} ({value_column})
                OUTPUT Inserted.{id_column}
                VALUES (?);
            """
            return cursor.execute(sql_insert, value).fetchone()[0]

def ingest_normalized_skills(csv_path):
    try:
        conn_str = ';'.join(f'{k}={v}' for k, v in DB_CONFIG.items())
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        print("✅ Successfully connected to the database.")

        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader) # Skip the header row
            
            for row in reader:
                function_name = row[0].strip()
                spec_and_skill = row[1].strip()

                # --- Hierarchical Parsing Logic ---
                parts = spec_and_skill.split(':')
                if len(parts) > 1:
                    specialization_name = parts[0].strip()
                    skill_name = parts[1].strip()
                else:
                    # If no colon, the specialization and skill are the same
                    specialization_name = spec_and_skill
                    skill_name = spec_and_skill
                
                # --- Get or Create IDs for each level of the hierarchy ---
                # 1. Function Area (top level) - Pass 'function_id'
                func_id = get_or_create_id(cursor, 'function_areas', 'function_id', 'function_name', function_name)

                # 2. Specialization (linked to Function Area) - Pass 'specialization_id'
                spec_id = get_or_create_id(cursor, 'specializations', 'specialization_id', 'specialization_name', specialization_name, ('function_id', func_id))

                # 3. Skill (linked to Specialization) - Pass 'skill_id'
                get_or_create_id(cursor, 'skills', 'skill_id', 'skill_name', skill_name, ('specialization_id', spec_id))

        conn.commit()
        print(f"\n🎉 Hierarchical skill tables populated successfully.")

    except Exception as e:
        print(f"❌ An error occurred: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()
            print("Connection closed.")

# --- 3. RUN THE SCRIPT ---
if __name__ == "__main__":
    # Ensure the filename here matches your CSV file
    ingest_normalized_skills('Functions & Skills.csv')