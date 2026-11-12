CREATE TABLE jobs (
    job_id INT AUTO_INCREMENT PRIMARY KEY,
    recruiter_id INT NOT NULL,
    title VARCHAR(140) NOT NULL,
    company VARCHAR(200) NOT NULL,
    location VARCHAR(100) NOT NULL,
    job_type VARCHAR(50) NOT NULL,
    skills JSON NOT NULL,
    min_salary FLOAT NOT NULL,
    max_salary FLOAT NOT NULL,
    description TEXT NOT NULL,
    `date` DATE NOT NULL,
    `open` BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    INDEX ix_jobs_recruiter_id (recruiter_id),
    CONSTRAINT fk_jobs_recruiter_id_users
        FOREIGN KEY (recruiter_id) REFERENCES users (user_id)
);
