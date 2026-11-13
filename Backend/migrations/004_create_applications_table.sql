CREATE TABLE applications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    job_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX ix_applications_candidate_id (candidate_id),
    INDEX ix_applications_job_id (job_id),
    CONSTRAINT uq_applications_candidate_job
        UNIQUE (candidate_id, job_id),
    CONSTRAINT fk_applications_candidate_id
        FOREIGN KEY (candidate_id) REFERENCES users (user_id),
    CONSTRAINT fk_applications_job_id
        FOREIGN KEY (job_id) REFERENCES jobs (job_id)
);
