USE PSA_Hackathon_2025;

CREATE TABLE employees (
    employee_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    office_location VARCHAR(255),
    line_manager VARCHAR(255),
    job_title VARCHAR(255),
    department VARCHAR(255),
    unit VARCHAR(255),
    hire_date DATE,
    in_role_since DATE
);

CREATE TABLE position_history (
    history_id INT PRIMARY KEY IDENTITY(1,1),
    employee_id VARCHAR(20) NOT NULL,
    role_title VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE,
    focus_areas TEXT,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);

CREATE TABLE skills (
    skill_id INT PRIMARY KEY IDENTITY(1,1),
    skill_name VARCHAR(255) NOT NULL UNIQUE,
    function_area VARCHAR(255),
    specialization VARCHAR(255)
);

CREATE TABLE employee_skills (
    id INT PRIMARY KEY IDENTITY(1,1),
    employee_id VARCHAR(20) NOT NULL,
    skill_id INT NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id),
    UNIQUE (employee_id, skill_id) -- Prevents duplicate entries
);

CREATE TABLE employee_competencies (
    id INT PRIMARY KEY IDENTITY(1,1),
    employee_id VARCHAR(20) NOT NULL,
    competency_name VARCHAR(255) NOT NULL,
    proficiency_level VARCHAR(20) NOT NULL CHECK (proficiency_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);

CREATE TABLE projects (
    project_id INT PRIMARY KEY IDENTITY(1,1),
    project_name VARCHAR(255) NOT NULL,
    employee_id_lead VARCHAR(20), -- The employee who led the project
    start_date DATE,
    end_date DATE,
    description TEXT,
    outcomes TEXT,
    FOREIGN KEY (employee_id_lead) REFERENCES employees(employee_id)
);

CREATE TABLE project_members (
    id INT PRIMARY KEY IDENTITY(1,1),
    project_id INT NOT NULL,
    employee_id VARCHAR(20) NOT NULL,
    role_in_project VARCHAR(255),
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);

CREATE TABLE experiences (
    experience_id INT PRIMARY KEY IDENTITY(1,1),
    employee_id VARCHAR(20) NOT NULL,
    experience_type VARCHAR(100), -- e.g., 'Program', 'Rotation', 'Coaching'
    program_name VARCHAR(255),
    organization VARCHAR(255),
    start_date DATE,
    end_date DATE,
    focus TEXT,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);

CREATE TABLE education (
    education_id INT PRIMARY KEY IDENTITY(1,1),
    employee_id VARCHAR(20) NOT NULL,
    degree VARCHAR(255),
    institution VARCHAR(255),
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);

CREATE TABLE employee_languages (
    id INT PRIMARY KEY IDENTITY(1,1),
    employee_id VARCHAR(20) NOT NULL,
    language VARCHAR(100) NOT NULL,
    proficiency VARCHAR(100),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);

CREATE TABLE function_areas (
    function_id INT PRIMARY KEY IDENTITY(1,1),
    function_name VARCHAR(255) NOT NULL UNIQUE
);

-- 2. Create the sub-category table
CREATE TABLE specializations (
    specialization_id INT PRIMARY KEY IDENTITY(1,1),
    specialization_name VARCHAR(255) NOT NULL UNIQUE,
    function_id INT NOT NULL,
    FOREIGN KEY (function_id) REFERENCES function_areas(function_id)
);
