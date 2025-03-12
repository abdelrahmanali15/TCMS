-- Create a default user if none exists
INSERT INTO auth.users (id, email, created_at, updated_at)
SELECT '00000000-0000-0000-0000-000000000000', 'default@example.com', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000');

-- Create a corresponding public.users entry
INSERT INTO public.users (id, email)
SELECT '00000000-0000-0000-0000-000000000000', 'default@example.com'
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE id = '00000000-0000-0000-0000-000000000000');

-- Create default project if none exists
INSERT INTO projects (name, description, created_by)
SELECT 'Default Project', 'Default project for test cases', '00000000-0000-0000-0000-000000000000'
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
INSERT INTO releases (name, description, created_by)
SELECT 'v1.0.0 - Initial Release', 'Initial release for testing', '00000000-0000-0000-0000-000000000000'
WHERE NOT EXISTS (SELECT 1 FROM releases LIMIT 1);
