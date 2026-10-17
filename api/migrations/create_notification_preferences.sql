CREATE TABLE IF NOT EXISTS notification_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    onesignal_player_id VARCHAR(255) DEFAULT NULL,

    -- Water Reminder Settings
    water_reminder_enabled TINYINT(1) DEFAULT 0,
    water_reminder_interval INT DEFAULT 60,
    water_reminder_start TIME DEFAULT '08:00:00',
    water_reminder_end TIME DEFAULT '22:00:00',

    -- Meal Reminder Settings
    meal_reminder_enabled TINYINT(1) DEFAULT 0,
    breakfast_time TIME DEFAULT '08:00:00',
    lunch_time TIME DEFAULT '12:30:00',
    dinner_time TIME DEFAULT '19:00:00',

    -- Period Reminder Settings (women only)
    period_reminder_enabled TINYINT(1) DEFAULT 0,
    period_reminder_days_before INT DEFAULT 2,

    -- Master Control
    notifications_paused TINYINT(1) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user (user_id)
);

CREATE TABLE IF NOT EXISTS notification_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'water', 'breakfast', 'lunch', 'dinner', 'period'
    sent_date DATE NOT NULL,
    sent_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_type_date (user_id, type, sent_date)
);
