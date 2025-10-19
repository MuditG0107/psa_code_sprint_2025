# AI for Employee Growth & Engagement (PSA Code Sprint)

This project is an AI-powered platform designed to support employee career development at PSA. It features a personalized dashboard, a conversational AI assistant for career coaching and well-being, career path recommendations, and a leadership potential predictor.

## Prerequisites 🛠️

Before you begin, ensure you have the following software installed on your machine:

1.  **Node.js and npm**: For running the React frontend. [Download Node.js](https://nodejs.org/)
2.  **Python (3.10+ recommended)**: For running the FastAPI backend and machine learning scripts. [Download Python](https://www.python.org/downloads/)
3.  **Microsoft SQL Server Express Edition**: The database for storing all application data. [Download SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
4.  **SQL Server Management Studio (SSMS)**: The tool for managing your SQL Server database. [Download SSMS](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)
5.  **ODBC Driver 17 for SQL Server**: The driver Python uses to connect to the database. [Download ODBC Driver](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)

---

## Setup Instructions ⚙️

Follow these steps carefully to get the project running locally.

### 1. Database Setup (Using SSMS)

The provided SQL script will create the database and populate it with all the necessary data in one step.

1.  **Find Your Server Name**:
    * Open **SSMS**. The "Connect to Server" window will appear.
    * The text in the "**Server name:**" box is your server name. **Copy this**, as you will need it for the Python scripts. It often looks like `LAPTOP-NAME\SQLEXPRESS`.
    * Connect using **Windows Authentication**.

2.  **Run the Database Script**:
    * Open the `sql\psa_db.sql` file in SSMS (**File > Open > File...**).
    * Click the **Execute** button to run the entire script.
    * This will automatically create the `PSA_Hackathon_2025` database and all its tables and data. You can verify this by right-clicking on the **Databases** folder in the Object Explorer and selecting **Refresh**.

### 2. Backend Setup (Python)

Now, let's configure and run the backend.

1.  **Navigate to the `backend` folder** in your terminal.

2.  **Create and Activate a Virtual Environment**:
    ```bash
    # Create the virtual environment
    python -m venv venv

    # Activate it (on Windows)
    .\venv\Scripts\activate
    ```

3.  **Install Dependencies**:
    * Make sure you have a `requirements.txt` file in your `backend` folder with all necessary packages.
    * Run the installation command:
        ```bash
        pip install -r requirements.txt
        ```

4.  **Configure Database Connection**:
    * Open all Python files in the `backend` folder (`main.py`, `leadership_model.py`, etc.).
    * Find the `DB_CONFIG` dictionary or `conn_str` variable at the top of each file.
    * You **must change** the `server` value to the server name you copied from SSMS.
    * Ensure the `database` name is `PSA_Hackathon_2025`.

    ```python
    # Example from a Python file
    'server': r'YOUR_SERVER_NAME_HERE',      # <--- CHANGE THIS
    'database': 'PSA_Hackathon_2025', # <--- Verify this is correct
    ```

5.  **API Key Information**:
    * The API key for the language model is pre-configured in `main.py`. You do not need to change it for this project to run.

6.  **Train the ML Model**:
    * Run the model training script if `leadership_model.pkl` and `scaler.pkl` does not exist in the backend folder. This will create `leadership_model.pkl` and `scaler.pkl` in your `backend` folder.
    ```bash
    python leadership_model.py
    ```

### 3. Frontend Setup (React)

Finally, set up the user interface.

1.  **Navigate to the `frontend` folder** in a new terminal.

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

---

## Running the Application ▶️

You need two terminals running simultaneously. **Important:** Ensure the specified ports are not being used by another application.

1.  **Start the Backend Server**:
    * In your backend terminal (with the virtual environment activated), run:
    ```bash
    uvicorn main:app --reload
    ```
    * The server will run on a fixed port: **`http://127.0.0.1:8000`**.

2.  **Start the Frontend Server**:
    * In your frontend terminal, run:
    ```bash
    npm run dev
    ```
    * Your web browser should automatically open to the application, which will run on a fixed port (usually **`http://localhost:5173`**).

The application should now be fully functional.