
CREATE DATABASE IF NOT EXISTS student_prediction;

DROP USER IF EXISTS 'student_app'@'localhost';
CREATE USER 'student_app'@'localhost' IDENTIFIED BY 'student_app_password';
GRANT ALL PRIVILEGES ON student_prediction.* TO 'student_app'@'localhost';
FLUSH PRIVILEGES;

USE student_prediction;


CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') DEFAULT 'student' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);


CREATE TABLE IF NOT EXISTS student_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    attendance_pct FLOAT NULL,
    study_hours_week FLOAT NULL,
    assignment_score FLOAT NULL,
    internal_marks FLOAT NULL,
    prev_sem_cgpa FLOAT NULL,
    activity_score FLOAT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    attendance_pct FLOAT NOT NULL,
    study_hours_week FLOAT NOT NULL,
    assignment_score FLOAT NOT NULL,
    internal_marks FLOAT NOT NULL,
    prev_sem_cgpa FLOAT NOT NULL,
    activity_score FLOAT NOT NULL,
    predicted_final_marks FLOAT NOT NULL,
    model_name VARCHAR(120) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS what_if_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    current_prediction FLOAT NOT NULL,
    what_if_prediction FLOAT NOT NULL,
    predicted_change FLOAT NOT NULL,
    current_features JSON NOT NULL,
    what_if_features JSON NOT NULL,
    changed_features JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


SHOW TABLES;
DESCRIBE users;
DESCRIBE student_profiles;
DESCRIBE predictions;
DESCRIBE what_if_predictions;

select * from what_if_predictions;
select * from predictions;