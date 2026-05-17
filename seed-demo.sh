#!/bin/bash
set -e

DB_PATH="./prisma/db.sqlite"

# Delete existing demo data
sqlite3 "$DB_PATH" << 'EOSQL'
DELETE FROM goal WHERE userId IN ('emp1', 'mgr1', 'adm1');
DELETE FROM "user" WHERE id IN ('emp1', 'mgr1', 'adm1');

-- Insert demo users
INSERT INTO "user" (id, email, name, role, department, createdAt, updatedAt) VALUES
  ('emp1', 'employee@demo.com', 'Sarah Employee', 'EMPLOYEE', 'Engineering', datetime('now'), datetime('now')),
  ('mgr1', 'manager@demo.com', 'Mike Manager', 'MANAGER', 'Management', datetime('now'), datetime('now')),
  ('adm1', 'admin@demo.com', 'HR Admin', 'ADMIN', 'Administration', datetime('now'), datetime('now'));

-- Insert demo goals for employee
INSERT INTO goal (id, userId, thrustArea, title, description, uom, target, weightage, status, createdAt, updatedAt) VALUES
  ('goal1', 'emp1', 'Q4 Sales', 'Increase Monthly Revenue', 'Drive revenue growth', 'NUMERIC', '50000', 60, 'LOCKED', datetime('now'), datetime('now')),
  ('goal2', 'emp1', 'Customer Success', 'Improve CSAT Score', 'Enhance satisfaction', 'PERCENTAGE', '85', 40, 'LOCKED', datetime('now'), datetime('now'));

-- Insert demo check-ins
INSERT INTO "checkIn" (id, goalId, quarter, actualAchievement, progressStatus, progressScore, createdAt, updatedAt) VALUES
  ('checkin1', 'goal1', 'Q3', '32000', 'ON_TRACK', 64, datetime('now'), datetime('now')),
  ('checkin2', 'goal2', 'Q3', '72', 'ON_TRACK', 85, datetime('now'), datetime('now'));
EOSQL

echo "✅ Demo data seeded!"
