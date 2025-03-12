-- Disable foreign key constraints for created_by in projects table
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_created_by_fkey;

-- Disable foreign key constraints for created_by in releases table
ALTER TABLE releases DROP CONSTRAINT IF EXISTS releases_created_by_fkey;

-- Create default project if none exists
INSERT INTO projects (name, description)
SELECT 'Default Project', 'Default project for test cases'
WHERE NOT EXISTS (SELECT 1 FROM projects LIMIT 1);

-- Create default module if none exists
INSERT INTO modules (name, description, project_id)
SELECT 'Default Module', 'Default module for test cases', id
FROM projects
WHERE name = 'Default Project'
AND NOT EXISTS (SELECT 1 FROM modules LIMIT 1);

-- Create default feature if none exists
INSERT INTO features (name, description, module_id)
SELECT 'Default Feature', 'Default feature for test cases', id
FROM modules
WHERE name = 'Default Module'
AND NOT EXISTS (SELECT 1 FROM features LIMIT 1);

-- Create default release if none exists
INSERT INTO releases (name, description)
SELECT 'v1.0.0 - Initial Release', 'Initial release for testing'
WHERE NOT EXISTS (SELECT 1 FROM releases LIMIT 1);
