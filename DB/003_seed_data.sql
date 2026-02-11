-- ============================================================================
-- LMS + RECRUITMENT PLATFORM - SEED DATA
-- ============================================================================
-- Author: Database Architecture Team
-- Date: February 09, 2026
-- Description: Initial seed data for testing and development
-- ============================================================================

-- ============================================================================
-- SECTION 1: SKILLS
-- ============================================================================

INSERT INTO skills (name, slug, category, description) VALUES
-- Programming Languages
('JavaScript', 'javascript', 'Programming', 'High-level, dynamic programming language'),
('Python', 'python', 'Programming', 'General-purpose programming language'),
('Java', 'java', 'Programming', 'Object-oriented programming language'),
('TypeScript', 'typescript', 'Programming', 'Typed superset of JavaScript'),
('C++', 'cpp', 'Programming', 'General-purpose programming language'),
('C#', 'csharp', 'Programming', 'Multi-paradigm programming language'),
('Go', 'golang', 'Programming', 'Statically typed, compiled language'),
('Rust', 'rust', 'Programming', 'Systems programming language'),
('PHP', 'php', 'Programming', 'Server-side scripting language'),
('Ruby', 'ruby', 'Programming', 'Dynamic, object-oriented language'),
('Swift', 'swift', 'Programming', 'Programming language for iOS/macOS'),
('Kotlin', 'kotlin', 'Programming', 'Cross-platform programming language'),

-- Frontend
('React', 'react', 'Frontend', 'JavaScript library for building UIs'),
('Vue.js', 'vuejs', 'Frontend', 'Progressive JavaScript framework'),
('Angular', 'angular', 'Frontend', 'TypeScript-based web framework'),
('Next.js', 'nextjs', 'Frontend', 'React framework for production'),
('HTML', 'html', 'Frontend', 'Markup language for web pages'),
('CSS', 'css', 'Frontend', 'Style sheet language'),
('Tailwind CSS', 'tailwindcss', 'Frontend', 'Utility-first CSS framework'),
('SASS', 'sass', 'Frontend', 'CSS preprocessor'),

-- Backend
('Node.js', 'nodejs', 'Backend', 'JavaScript runtime environment'),
('Express.js', 'expressjs', 'Backend', 'Web framework for Node.js'),
('Django', 'django', 'Backend', 'Python web framework'),
('Flask', 'flask', 'Backend', 'Python micro framework'),
('FastAPI', 'fastapi', 'Backend', 'Modern Python web framework'),
('Spring Boot', 'spring-boot', 'Backend', 'Java-based framework'),
('Ruby on Rails', 'rails', 'Backend', 'Ruby web framework'),
('.NET', 'dotnet', 'Backend', 'Microsoft development platform'),

-- Database
('SQL', 'sql', 'Database', 'Structured Query Language'),
('PostgreSQL', 'postgresql', 'Database', 'Open source relational database'),
('MySQL', 'mysql', 'Database', 'Relational database management system'),
('MongoDB', 'mongodb', 'Database', 'NoSQL document database'),
('Redis', 'redis', 'Database', 'In-memory data structure store'),
('Elasticsearch', 'elasticsearch', 'Database', 'Search and analytics engine'),

-- Cloud & DevOps
('AWS', 'aws', 'Cloud', 'Amazon Web Services'),
('Google Cloud', 'gcp', 'Cloud', 'Google Cloud Platform'),
('Azure', 'azure', 'Cloud', 'Microsoft Azure'),
('Docker', 'docker', 'DevOps', 'Container platform'),
('Kubernetes', 'kubernetes', 'DevOps', 'Container orchestration'),
('CI/CD', 'cicd', 'DevOps', 'Continuous Integration/Deployment'),
('Terraform', 'terraform', 'DevOps', 'Infrastructure as code'),
('Linux', 'linux', 'DevOps', 'Open source operating system'),

-- Data Science & ML
('Machine Learning', 'machine-learning', 'Data Science', 'AI subset for learning from data'),
('Deep Learning', 'deep-learning', 'Data Science', 'Neural network-based ML'),
('TensorFlow', 'tensorflow', 'Data Science', 'ML framework by Google'),
('PyTorch', 'pytorch', 'Data Science', 'ML framework by Facebook'),
('Pandas', 'pandas', 'Data Science', 'Python data analysis library'),
('NumPy', 'numpy', 'Data Science', 'Python numerical computing'),
('Data Analysis', 'data-analysis', 'Data Science', 'Analyzing datasets'),
('Data Visualization', 'data-visualization', 'Data Science', 'Visual representation of data'),
('Tableau', 'tableau', 'Data Science', 'Data visualization tool'),
('Power BI', 'powerbi', 'Data Science', 'Business analytics tool'),

-- Design
('UI Design', 'ui-design', 'Design', 'User Interface Design'),
('UX Design', 'ux-design', 'Design', 'User Experience Design'),
('Figma', 'figma', 'Design', 'Collaborative design tool'),
('Adobe XD', 'adobe-xd', 'Design', 'UI/UX design tool'),
('Sketch', 'sketch', 'Design', 'Digital design toolkit'),
('User Research', 'user-research', 'Design', 'Understanding user needs'),
('Prototyping', 'prototyping', 'Design', 'Creating interactive mockups'),

-- Marketing
('SEO', 'seo', 'Marketing', 'Search Engine Optimization'),
('Content Marketing', 'content-marketing', 'Marketing', 'Creating valuable content'),
('Digital Marketing', 'digital-marketing', 'Marketing', 'Online marketing strategies'),
('Social Media Marketing', 'social-media-marketing', 'Marketing', 'Marketing on social platforms'),
('Google Analytics', 'google-analytics', 'Marketing', 'Web analytics service'),

-- Soft Skills
('Communication', 'communication', 'Soft Skills', 'Effective communication'),
('Leadership', 'leadership', 'Soft Skills', 'Leading teams and projects'),
('Problem Solving', 'problem-solving', 'Soft Skills', 'Analytical thinking'),
('Teamwork', 'teamwork', 'Soft Skills', 'Collaborative work'),
('Time Management', 'time-management', 'Soft Skills', 'Managing time effectively'),
('Project Management', 'project-management', 'Soft Skills', 'Managing projects'),
('Agile', 'agile', 'Soft Skills', 'Agile methodology'),
('Scrum', 'scrum', 'Soft Skills', 'Scrum framework');

-- Skill Synonyms
INSERT INTO skill_synonyms (skill_id, synonym) VALUES
((SELECT skill_id FROM skills WHERE slug = 'javascript'), 'JS'),
((SELECT skill_id FROM skills WHERE slug = 'typescript'), 'TS'),
((SELECT skill_id FROM skills WHERE slug = 'cpp'), 'C++'),
((SELECT skill_id FROM skills WHERE slug = 'csharp'), 'C#'),
((SELECT skill_id FROM skills WHERE slug = 'golang'), 'Golang'),
((SELECT skill_id FROM skills WHERE slug = 'nodejs'), 'Node'),
((SELECT skill_id FROM skills WHERE slug = 'postgresql'), 'Postgres'),
((SELECT skill_id FROM skills WHERE slug = 'kubernetes'), 'K8s'),
((SELECT skill_id FROM skills WHERE slug = 'machine-learning'), 'ML'),
((SELECT skill_id FROM skills WHERE slug = 'deep-learning'), 'DL'),
((SELECT skill_id FROM skills WHERE slug = 'user-research'), 'UX Research');

-- ============================================================================
-- SECTION 2: CATEGORIES
-- ============================================================================

INSERT INTO categories (name, slug, description, display_order) VALUES
-- Main Categories
('Programming', 'programming', 'Learn programming languages and software development', 1),
('Web Development', 'web-development', 'Frontend and backend web development', 2),
('Data Science', 'data-science', 'Data analysis, machine learning, and AI', 3),
('Design', 'design', 'UI/UX design and creative tools', 4),
('Cloud Computing', 'cloud-computing', 'Cloud platforms and services', 5),
('Mobile Development', 'mobile-development', 'iOS and Android app development', 6),
('DevOps', 'devops', 'Development operations and automation', 7),
('Marketing', 'marketing', 'Digital marketing and growth', 8),
('Business', 'business', 'Business skills and management', 9),
('Personal Development', 'personal-development', 'Soft skills and career growth', 10);

-- Subcategories
INSERT INTO categories (name, slug, description, parent_category_id, display_order) VALUES
-- Programming Subcategories
('Python Programming', 'python-programming', 'Python language and ecosystem', 
 (SELECT category_id FROM categories WHERE slug = 'programming'), 1),
('JavaScript Programming', 'javascript-programming', 'JavaScript and modern ES6+', 
 (SELECT category_id FROM categories WHERE slug = 'programming'), 2),

-- Web Dev Subcategories
('Frontend Development', 'frontend-development', 'Client-side web development', 
 (SELECT category_id FROM categories WHERE slug = 'web-development'), 1),
('Backend Development', 'backend-development', 'Server-side development', 
 (SELECT category_id FROM categories WHERE slug = 'web-development'), 2),
('Full Stack Development', 'fullstack-development', 'End-to-end web development', 
 (SELECT category_id FROM categories WHERE slug = 'web-development'), 3),

-- Data Science Subcategories
('Machine Learning', 'machine-learning-category', 'ML algorithms and applications', 
 (SELECT category_id FROM categories WHERE slug = 'data-science'), 1),
('Data Analysis', 'data-analysis-category', 'Data exploration and visualization', 
 (SELECT category_id FROM categories WHERE slug = 'data-science'), 2);

-- ============================================================================
-- SECTION 3: USERS & PROFILES
-- ============================================================================

-- Admin Users
INSERT INTO users (email, password_hash, user_type, status, email_verified) VALUES
('admin@recruitlms.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3UJHyLpMPgSVn2', 'admin', 'active', TRUE),
('content.admin@recruitlms.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3UJHyLpMPgSVn2', 'admin', 'active', TRUE),
('recruit.admin@recruitlms.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3UJHyLpMPgSVn2', 'admin', 'active', TRUE);

INSERT INTO admins (user_id, first_name, last_name, role, department) VALUES
(1, 'Super', 'Admin', 'super_admin', 'Administration'),
(2, 'Content', 'Manager', 'content_manager', 'Content'),
(3, 'Recruitment', 'Manager', 'recruitment_manager', 'Recruitment');

-- Student Users
INSERT INTO users (email, password_hash, user_type, status, email_verified) VALUES
('alex.johnson@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3UJHyLpMPgSVn2', 'student', 'active', TRUE),
('sarah.williams@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3UJHyLpMPgSVn2', 'student', 'active', TRUE),
('james.lee@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3UJHyLpMPgSVn2', 'student', 'active', TRUE),
('emily.davis@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3UJHyLpMPgSVn2', 'student', 'active', TRUE),
('michael.brown@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3UJHyLpMPgSVn2', 'student', 'active', TRUE),
('sophia.martinez@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3UJHyLpMPgSVn2', 'student', 'active', TRUE);

INSERT INTO students (user_id, first_name, last_name, bio, headline, location, education, experience_years, availability_status, salary_expectation_min, salary_expectation_max) VALUES
(4, 'Alex', 'Johnson', 'Passionate about data science and web development. Currently building skills to transition into a full-time tech role.', 'Aspiring Full Stack Developer', 'San Francisco, CA', 'B.S. Computer Science, UC Berkeley', 1, TRUE, 800000, 1200000),
(5, 'Sarah', 'Williams', 'Creative frontend developer with a passion for building beautiful user interfaces.', 'Frontend Developer', 'New York, NY', 'B.A. Digital Media, NYU', 2, TRUE, 1000000, 1500000),
(6, 'James', 'Lee', 'Data enthusiast with strong analytical skills. Looking for data analyst roles.', 'Data Analyst', 'Austin, TX', 'M.S. Statistics, UT Austin', 3, TRUE, 1200000, 1800000),
(7, 'Emily', 'Davis', 'UX designer focused on creating intuitive and accessible user experiences.', 'UX Designer', 'Seattle, WA', 'B.F.A. Interaction Design, RISD', 2, TRUE, 900000, 1400000),
(8, 'Michael', 'Brown', 'Backend developer with expertise in Node.js and cloud technologies.', 'Backend Developer', 'Denver, CO', 'B.S. Software Engineering, CU Boulder', 2, TRUE, 1100000, 1600000),
(9, 'Sophia', 'Martinez', 'Marketing professional transitioning to data analytics.', 'Marketing Analyst', 'Los Angeles, CA', 'B.B.A. Marketing, UCLA', 1, TRUE, 700000, 1100000);

-- Add skills to students
INSERT INTO student_skills (student_id, skill_id, proficiency_level) VALUES
-- Alex Johnson
(1, (SELECT skill_id FROM skills WHERE slug = 'python'), 4),
(1, (SELECT skill_id FROM skills WHERE slug = 'javascript'), 4),
(1, (SELECT skill_id FROM skills WHERE slug = 'react'), 3),
(1, (SELECT skill_id FROM skills WHERE slug = 'sql'), 4),
(1, (SELECT skill_id FROM skills WHERE slug = 'data-analysis'), 3),
(1, (SELECT skill_id FROM skills WHERE slug = 'machine-learning'), 2),

-- Sarah Williams
(2, (SELECT skill_id FROM skills WHERE slug = 'react'), 5),
(2, (SELECT skill_id FROM skills WHERE slug = 'javascript'), 5),
(2, (SELECT skill_id FROM skills WHERE slug = 'typescript'), 4),
(2, (SELECT skill_id FROM skills WHERE slug = 'css'), 5),
(2, (SELECT skill_id FROM skills WHERE slug = 'nodejs'), 3),

-- James Lee
(3, (SELECT skill_id FROM skills WHERE slug = 'python'), 5),
(3, (SELECT skill_id FROM skills WHERE slug = 'sql'), 5),
(3, (SELECT skill_id FROM skills WHERE slug = 'tableau'), 4),
(3, (SELECT skill_id FROM skills WHERE slug = 'data-analysis'), 5),
(3, (SELECT skill_id FROM skills WHERE slug = 'machine-learning'), 3),

-- Emily Davis
(4, (SELECT skill_id FROM skills WHERE slug = 'figma'), 5),
(4, (SELECT skill_id FROM skills WHERE slug = 'ui-design'), 5),
(4, (SELECT skill_id FROM skills WHERE slug = 'ux-design'), 5),
(4, (SELECT skill_id FROM skills WHERE slug = 'user-research'), 4),
(4, (SELECT skill_id FROM skills WHERE slug = 'prototyping'), 5),

-- Michael Brown
(5, (SELECT skill_id FROM skills WHERE slug = 'nodejs'), 5),
(5, (SELECT skill_id FROM skills WHERE slug = 'postgresql'), 4),
(5, (SELECT skill_id FROM skills WHERE slug = 'docker'), 4),
(5, (SELECT skill_id FROM skills WHERE slug = 'aws'), 3),
(5, (SELECT skill_id FROM skills WHERE slug = 'typescript'), 4),

-- Sophia Martinez
(6, (SELECT skill_id FROM skills WHERE slug = 'python'), 3),
(6, (SELECT skill_id FROM skills WHERE slug = 'tableau'), 4),
(6, (SELECT skill_id FROM skills WHERE slug = 'sql'), 3),
(6, (SELECT skill_id FROM skills WHERE slug = 'digital-marketing'), 4);

-- Company Users
INSERT INTO users (email, password_hash, user_type, status, email_verified) VALUES
('hr@techstart.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3UJHyLpMPgSVn2', 'company', 'active', TRUE),
('careers@designhub.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3UJHyLpMPgSVn2', 'company', 'active', TRUE),
('hr@dataviz.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3UJHyLpMPgSVn2', 'company', 'active', TRUE),
('talent@cloudscale.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3UJHyLpMPgSVn2', 'company', 'active', TRUE);

INSERT INTO companies (user_id, company_name, description, industry, company_size, founded_year, headquarters_location, website_url, is_verified) VALUES
(10, 'TechStart Inc.', 'TechStart Inc. is a leading technology company focused on building innovative solutions for the modern workforce. We believe in nurturing talent and creating opportunities for growth.', 'Technology', '50-200 employees', 2018, 'San Francisco, CA', 'https://techstart.example.com', TRUE),
(11, 'DesignHub', 'Creative design agency specializing in user experience and digital products.', 'Design', '20-50 employees', 2015, 'New York, NY', 'https://designhub.example.com', TRUE),
(12, 'DataViz Corp.', 'Data analytics and visualization company helping businesses make data-driven decisions.', 'Technology', '100-500 employees', 2012, 'Austin, TX', 'https://dataviz.example.com', TRUE),
(13, 'CloudScale Solutions', 'Cloud infrastructure and DevOps consulting firm.', 'Technology', '50-200 employees', 2016, 'Seattle, WA', 'https://cloudscale.example.com', TRUE);

-- ============================================================================
-- SECTION 4: INSTRUCTORS
-- ============================================================================

INSERT INTO users (email, password_hash, user_type, status, email_verified) VALUES
('sarah.chen@instructors.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3UJHyLpMPgSVn2', 'instructor', 'active', TRUE),
('mark.rivera@instructors.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3UJHyLpMPgSVn2', 'instructor', 'active', TRUE),
('lisa.park@instructors.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3UJHyLpMPgSVn2', 'instructor', 'active', TRUE),
('james.white@instructors.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3UJHyLpMPgSVn2', 'instructor', 'active', TRUE);

INSERT INTO instructors (user_id, first_name, last_name, bio, headline, expertise_areas, is_internal, is_active) VALUES
(14, 'Dr. Sarah', 'Chen', 'Dr. Sarah Chen is a data scientist with over 10 years of experience in machine learning and AI. She has worked at top tech companies and now dedicates her time to teaching.', 'Data Science Expert & AI Researcher', ARRAY['Python', 'Machine Learning', 'Data Science'], TRUE, TRUE),
(15, 'Mark', 'Rivera', 'Full-stack developer and tech educator with a passion for web technologies. Has built applications used by millions of users.', 'Full Stack Developer & Tech Educator', ARRAY['JavaScript', 'React', 'Node.js', 'Web Development'], TRUE, TRUE),
(16, 'Lisa', 'Park', 'Award-winning UX designer with experience at Fortune 500 companies. Specializes in user-centered design and design systems.', 'Senior UX Designer & Design Educator', ARRAY['UX Design', 'UI Design', 'Figma', 'User Research'], FALSE, TRUE),
(17, 'Dr. James', 'White', 'Machine learning researcher and former professor at Stanford. Specializes in deep learning and neural networks.', 'ML Researcher & Former Stanford Professor', ARRAY['Machine Learning', 'Deep Learning', 'Python', 'TensorFlow'], FALSE, TRUE);

-- ============================================================================
-- SECTION 5: MENTORS
-- ============================================================================

INSERT INTO users (email, password_hash, user_type, status, email_verified) VALUES
('mentor.raj@recruitlms.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3UJHyLpMPgSVn2', 'mentor', 'active', TRUE),
('mentor.priya@recruitlms.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3UJHyLpMPgSVn2', 'mentor', 'active', TRUE);

INSERT INTO mentors (user_id, first_name, last_name, bio, headline, expertise_areas, years_of_experience, current_company, role_title, session_duration_minutes, session_price, is_free, is_active, is_verified) VALUES
(18, 'Raj', 'Patel', 'Senior software engineer at Google with 8+ years of experience. Passionate about helping aspiring developers navigate their career.', 'Senior SWE @ Google', ARRAY['System Design', 'DSA', 'Career Guidance'], 8, 'Google', 'Senior Software Engineer', 45, 2500.00, FALSE, TRUE, TRUE),
(19, 'Priya', 'Sharma', 'Product manager at Microsoft. Previously worked at startups and large tech companies. Loves mentoring on product careers.', 'PM @ Microsoft', ARRAY['Product Management', 'Career Transition', 'Interview Prep'], 6, 'Microsoft', 'Product Manager', 30, 0.00, TRUE, TRUE, TRUE);

-- ============================================================================
-- SECTION 6: COURSES
-- ============================================================================

INSERT INTO courses (title, slug, description, short_description, category_id, difficulty_level, instructor_id, pricing_model, price, duration_hours, total_modules, total_lessons, is_published, published_at) VALUES
-- Course 1: Python for Data Science
('Python for Data Science', 'python-for-data-science', 
'Master Python programming for data science applications. This comprehensive course covers Python fundamentals, data manipulation with Pandas, numerical computing with NumPy, and data visualization. Perfect for beginners looking to start their data science journey.',
'Learn Python programming for data analysis and visualization.',
(SELECT category_id FROM categories WHERE slug = 'data-science'), 'intermediate', 1, 'one_time', 4999.00, 32.00, 8, 48, TRUE, CURRENT_TIMESTAMP),

-- Course 2: Web Development Fundamentals
('Web Development Fundamentals', 'web-development-fundamentals',
'Start your web development journey with this comprehensive course covering HTML, CSS, and JavaScript. Learn to build responsive websites from scratch.',
'Learn HTML, CSS, and JavaScript to build modern websites.',
(SELECT category_id FROM categories WHERE slug = 'web-development'), 'beginner', 2, 'free', 0.00, 24.00, 6, 36, TRUE, CURRENT_TIMESTAMP),

-- Course 3: UX/UI Design Mastery
('UX/UI Design Mastery', 'ux-ui-design-mastery',
'Become a professional UX/UI designer. Learn user research, wireframing, prototyping, and visual design using industry-standard tools like Figma.',
'Master UX/UI design with hands-on projects.',
(SELECT category_id FROM categories WHERE slug = 'design'), 'advanced', 3, 'one_time', 7999.00, 40.00, 10, 60, TRUE, CURRENT_TIMESTAMP),

-- Course 4: Machine Learning A-Z
('Machine Learning A-Z', 'machine-learning-a-z',
'Comprehensive machine learning course covering supervised and unsupervised learning, neural networks, and deep learning. Includes hands-on projects with real-world datasets.',
'Complete guide to machine learning and AI.',
(SELECT category_id FROM categories WHERE slug = 'data-science'), 'advanced', 4, 'one_time', 8999.00, 48.00, 12, 72, TRUE, CURRENT_TIMESTAMP),

-- Course 5: Digital Marketing Essentials
('Digital Marketing Essentials', 'digital-marketing-essentials',
'Learn digital marketing fundamentals including SEO, social media marketing, content marketing, and analytics. Perfect for beginners and marketers looking to expand their skills.',
'Master digital marketing strategies and tools.',
(SELECT category_id FROM categories WHERE slug = 'marketing'), 'beginner', 2, 'free', 0.00, 18.00, 5, 30, TRUE, CURRENT_TIMESTAMP),

-- Course 6: Cloud Architecture with AWS
('Cloud Architecture with AWS', 'cloud-architecture-with-aws',
'Learn to design and deploy scalable cloud architectures on AWS. Covers EC2, S3, Lambda, RDS, and more. Prepare for AWS certification.',
'Build scalable cloud solutions with AWS.',
(SELECT category_id FROM categories WHERE slug = 'cloud-computing'), 'intermediate', 1, 'one_time', 6999.00, 36.00, 9, 54, TRUE, CURRENT_TIMESTAMP);

-- Add skills to courses
INSERT INTO course_skills (course_id, skill_id, is_primary) VALUES
-- Python for Data Science
(1, (SELECT skill_id FROM skills WHERE slug = 'python'), TRUE),
(1, (SELECT skill_id FROM skills WHERE slug = 'pandas'), FALSE),
(1, (SELECT skill_id FROM skills WHERE slug = 'numpy'), FALSE),
(1, (SELECT skill_id FROM skills WHERE slug = 'data-visualization'), FALSE),

-- Web Development Fundamentals
(2, (SELECT skill_id FROM skills WHERE slug = 'html'), TRUE),
(2, (SELECT skill_id FROM skills WHERE slug = 'css'), TRUE),
(2, (SELECT skill_id FROM skills WHERE slug = 'javascript'), TRUE),

-- UX/UI Design Mastery
(3, (SELECT skill_id FROM skills WHERE slug = 'figma'), TRUE),
(3, (SELECT skill_id FROM skills WHERE slug = 'ui-design'), TRUE),
(3, (SELECT skill_id FROM skills WHERE slug = 'ux-design'), TRUE),
(3, (SELECT skill_id FROM skills WHERE slug = 'user-research'), FALSE),
(3, (SELECT skill_id FROM skills WHERE slug = 'prototyping'), FALSE),

-- Machine Learning A-Z
(4, (SELECT skill_id FROM skills WHERE slug = 'machine-learning'), TRUE),
(4, (SELECT skill_id FROM skills WHERE slug = 'python'), FALSE),
(4, (SELECT skill_id FROM skills WHERE slug = 'tensorflow'), FALSE),
(4, (SELECT skill_id FROM skills WHERE slug = 'deep-learning'), FALSE),

-- Digital Marketing Essentials
(5, (SELECT skill_id FROM skills WHERE slug = 'digital-marketing'), TRUE),
(5, (SELECT skill_id FROM skills WHERE slug = 'seo'), FALSE),
(5, (SELECT skill_id FROM skills WHERE slug = 'google-analytics'), FALSE),

-- Cloud Architecture with AWS
(6, (SELECT skill_id FROM skills WHERE slug = 'aws'), TRUE),
(6, (SELECT skill_id FROM skills WHERE slug = 'docker'), FALSE);

-- ============================================================================
-- SECTION 7: MODULES & LESSONS (Sample for first course)
-- ============================================================================

-- Modules for Python for Data Science
INSERT INTO modules (course_id, title, description, order_index, duration_minutes) VALUES
(1, 'Introduction to Python', 'Get started with Python programming basics', 1, 150),
(1, 'Data Types & Variables', 'Learn about Python data types and variables', 2, 180),
(1, 'Control Flow', 'Master conditional statements and loops', 3, 165),
(1, 'Functions & Modules', 'Create reusable code with functions', 4, 195),
(1, 'NumPy Fundamentals', 'Introduction to numerical computing with NumPy', 5, 210),
(1, 'Pandas for Data Analysis', 'Master data manipulation with Pandas', 6, 240),
(1, 'Data Visualization', 'Create stunning visualizations with Matplotlib and Seaborn', 7, 180),
(1, 'Statistics in Python', 'Apply statistical analysis in Python', 8, 225);

-- Lessons for Module 1: Introduction to Python
INSERT INTO lessons (module_id, title, description, content_type, order_index, duration_minutes, video_external_id, video_external_platform, is_preview) VALUES
(1, 'Welcome to the Course', 'Course overview and what you will learn', 'video', 1, 10, 'dQw4w9WgXcQ', 'youtube', TRUE),
(1, 'Setting Up Your Environment', 'Install Python and set up your development environment', 'video', 2, 20, 'dQw4w9WgXcQ', 'youtube', TRUE),
(1, 'Your First Python Program', 'Write and run your first Python script', 'video', 3, 25, 'dQw4w9WgXcQ', 'youtube', FALSE),
(1, 'Python Syntax Basics', 'Learn Python syntax and conventions', 'video', 4, 30, 'dQw4w9WgXcQ', 'youtube', FALSE),
(1, 'Module 1 Quiz', 'Test your knowledge of Python basics', 'quiz', 5, 15, NULL, NULL, FALSE);

-- ============================================================================
-- SECTION 8: JOBS
-- ============================================================================

INSERT INTO jobs (company_id, title, slug, description, responsibilities, requirements, employment_type, remote_type, location, experience_min_years, experience_max_years, salary_min, salary_max, salary_is_visible, status, posted_at, deadline, price_per_candidate) VALUES
-- TechStart Inc. Jobs
(1, 'Junior Frontend Developer', 'junior-frontend-developer-techstart', 
'We are looking for a passionate Junior Frontend Developer to join our growing team. You will work on building user interfaces for our web applications using modern JavaScript frameworks.',
'Build responsive web applications using React and TypeScript. Collaborate with designers to implement UI/UX designs. Write clean, maintainable code. Participate in code reviews.',
'1+ years of experience with React. Proficiency in JavaScript/TypeScript. Understanding of HTML, CSS, and responsive design. Familiarity with Git.',
'full_time', 'remote', 'Remote', 1, 2, 800000, 1200000, TRUE, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days', 5000.00),

(1, 'Backend Engineer', 'backend-engineer-techstart',
'Join our backend team to build scalable APIs and services. You will work with Node.js, PostgreSQL, and AWS to power our platform.',
'Design and implement RESTful APIs. Optimize database queries and performance. Implement security best practices. Work with cloud infrastructure.',
'2+ years of experience with Node.js. Experience with PostgreSQL or similar databases. Familiarity with AWS services. Understanding of microservices architecture.',
'full_time', 'remote', 'Remote', 2, 4, 1200000, 1800000, TRUE, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '45 days', 7500.00),

-- DesignHub Jobs
(2, 'UX Design Intern', 'ux-design-intern-designhub',
'Exciting internship opportunity for aspiring UX designers. Learn from experienced designers while working on real client projects.',
'Assist in user research and usability testing. Create wireframes and prototypes. Participate in design critiques. Present designs to stakeholders.',
'Currently pursuing or recently completed a degree in Design, HCI, or related field. Proficiency in Figma or similar design tools. Strong portfolio showing design thinking.',
'internship', 'hybrid', 'New York, NY', 0, 1, 400000, 600000, TRUE, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', 3000.00),

-- DataViz Corp. Jobs
(3, 'Data Analyst', 'data-analyst-dataviz',
'We are seeking a Data Analyst to help our clients make data-driven decisions. You will work with large datasets and create insightful visualizations.',
'Analyze complex datasets using SQL and Python. Create dashboards and reports in Tableau. Communicate findings to non-technical stakeholders. Identify trends and patterns in data.',
'2+ years of experience in data analysis. Proficiency in SQL and Python. Experience with Tableau or similar BI tools. Strong analytical and communication skills.',
'full_time', 'on_site', 'Austin, TX', 2, 4, 1000000, 1500000, TRUE, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '45 days', 6000.00),

-- CloudScale Solutions Jobs
(4, 'Cloud Engineer', 'cloud-engineer-cloudscale',
'Join our team of cloud experts to help clients migrate and optimize their infrastructure on AWS. You will design and implement cloud solutions.',
'Design cloud architecture solutions. Implement infrastructure as code using Terraform. Set up CI/CD pipelines. Optimize cloud costs and performance.',
'3+ years of experience with AWS. Experience with Docker and Kubernetes. Familiarity with Terraform or CloudFormation. Strong problem-solving skills.',
'full_time', 'remote', 'Remote', 3, 5, 1500000, 2200000, TRUE, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days', 8000.00);

-- Add skills to jobs
INSERT INTO job_skills (job_id, skill_id, is_mandatory, min_experience_years) VALUES
-- Junior Frontend Developer
(1, (SELECT skill_id FROM skills WHERE slug = 'react'), TRUE, 1),
(1, (SELECT skill_id FROM skills WHERE slug = 'typescript'), TRUE, 0),
(1, (SELECT skill_id FROM skills WHERE slug = 'css'), TRUE, 1),

-- Backend Engineer
(2, (SELECT skill_id FROM skills WHERE slug = 'nodejs'), TRUE, 2),
(2, (SELECT skill_id FROM skills WHERE slug = 'postgresql'), TRUE, 1),
(2, (SELECT skill_id FROM skills WHERE slug = 'aws'), FALSE, 1),

-- UX Design Intern
(3, (SELECT skill_id FROM skills WHERE slug = 'figma'), TRUE, 0),
(3, (SELECT skill_id FROM skills WHERE slug = 'user-research'), FALSE, 0),

-- Data Analyst
(4, (SELECT skill_id FROM skills WHERE slug = 'python'), TRUE, 1),
(4, (SELECT skill_id FROM skills WHERE slug = 'sql'), TRUE, 2),
(4, (SELECT skill_id FROM skills WHERE slug = 'tableau'), TRUE, 1),

-- Cloud Engineer
(5, (SELECT skill_id FROM skills WHERE slug = 'aws'), TRUE, 3),
(5, (SELECT skill_id FROM skills WHERE slug = 'docker'), TRUE, 2),
(5, (SELECT skill_id FROM skills WHERE slug = 'kubernetes'), FALSE, 1);

-- ============================================================================
-- SECTION 9: ENROLLMENTS
-- ============================================================================

INSERT INTO enrollments (student_id, course_id, status, progress_percentage, enrolled_at, started_at) VALUES
-- Alex Johnson's enrollments
(1, 1, 'in_progress', 75.00, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '28 days'),
(1, 2, 'completed', 100.00, CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP - INTERVAL '58 days'),

-- Sarah Williams' enrollments
(2, 2, 'completed', 100.00, CURRENT_TIMESTAMP - INTERVAL '45 days', CURRENT_TIMESTAMP - INTERVAL '43 days'),
(2, 3, 'in_progress', 45.00, CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '18 days'),

-- James Lee's enrollments
(3, 1, 'completed', 100.00, CURRENT_TIMESTAMP - INTERVAL '90 days', CURRENT_TIMESTAMP - INTERVAL '88 days'),
(3, 4, 'in_progress', 60.00, CURRENT_TIMESTAMP - INTERVAL '40 days', CURRENT_TIMESTAMP - INTERVAL '38 days'),

-- Emily Davis' enrollments
(4, 3, 'in_progress', 80.00, CURRENT_TIMESTAMP - INTERVAL '35 days', CURRENT_TIMESTAMP - INTERVAL '33 days');

-- ============================================================================
-- SECTION 10: APPLICATIONS
-- ============================================================================

INSERT INTO applications (student_id, job_id, status, cover_letter, applied_at, admin_id, admin_notes, admin_match_score) VALUES
-- Applications
(1, 1, 'pending_admin_review', 'I am excited to apply for this position. My experience with React and TypeScript makes me a great fit.', CURRENT_TIMESTAMP - INTERVAL '3 days', NULL, NULL, NULL),
(2, 1, 'forwarded_to_company', 'As a frontend developer with 2 years of experience, I am confident I can contribute to your team.', CURRENT_TIMESTAMP - INTERVAL '5 days', 3, 'Strong candidate with excellent React skills. Recommended for interview.', 88.50),
(3, 4, 'under_company_review', 'My background in data analysis and Python programming aligns perfectly with this role.', CURRENT_TIMESTAMP - INTERVAL '7 days', 3, 'Excellent data skills. Forwarded to DataViz.', 92.00),
(4, 3, 'interview_scheduled', 'I am passionate about UX design and would love to learn from your team.', CURRENT_TIMESTAMP - INTERVAL '10 days', 3, 'Great portfolio. Scheduled for interview.', 95.00),
(5, 2, 'pending_admin_review', 'I have strong Node.js experience and am excited about cloud technologies.', CURRENT_TIMESTAMP - INTERVAL '2 days', NULL, NULL, NULL);

-- ============================================================================
-- SECTION 11: BADGES
-- ============================================================================

INSERT INTO badges (name, description, criteria_type, criteria_value, points) VALUES
('Python Pro', 'Mastered Python programming fundamentals', 'course_completion', '{"course_slug": "python-for-data-science"}', 100),
('Web Wizard', 'Completed web development fundamentals', 'course_completion', '{"course_slug": "web-development-fundamentals"}', 100),
('Quick Learner', 'Completed first course within 7 days', 'quick_completion', '{"days": 7}', 50),
('Streak Master', 'Maintained a 30-day learning streak', 'streak', '{"days": 30}', 150),
('Quiz Champion', 'Scored 90% or higher in 5 quizzes', 'quiz_score', '{"min_score": 90, "count": 5}', 75),
('First Steps', 'Completed your first lesson', 'first_lesson', '{}', 10),
('Course Explorer', 'Enrolled in 5 different courses', 'enrollment_count', '{"count": 5}', 50);

-- Award badges to students
INSERT INTO student_badges (student_id, badge_id, earned_at, trigger_type, trigger_reference_id) VALUES
(1, 1, CURRENT_TIMESTAMP - INTERVAL '15 days', 'course_completion', 1),
(1, 2, CURRENT_TIMESTAMP - INTERVAL '30 days', 'course_completion', 2),
(1, 6, CURRENT_TIMESTAMP - INTERVAL '60 days', 'first_lesson', NULL),
(2, 2, CURRENT_TIMESTAMP - INTERVAL '20 days', 'course_completion', 2),
(3, 1, CURRENT_TIMESTAMP - INTERVAL '45 days', 'course_completion', 1),
(3, 3, CURRENT_TIMESTAMP - INTERVAL '45 days', 'quick_completion', 1);

-- ============================================================================
-- SECTION 12: WEBINARS
-- ============================================================================

INSERT INTO webinars (title, description, host_name, instructor_id, scheduled_start, scheduled_end, status, join_url, pricing_model, price, max_attendees) VALUES
('Intro to Machine Learning', 'Dive into the basics of ML algorithms and learn how to build your first model.', 'Dr. Sarah Chen', 1, CURRENT_TIMESTAMP + INTERVAL '6 days', CURRENT_TIMESTAMP + INTERVAL '6 days' + INTERVAL '2 hours', 'scheduled', 'https://zoom.us/j/example1', 'free', 0.00, 500),
('Advanced React Patterns', 'Master compound components, render props, and custom hooks.', 'Mark Rivera', 2, CURRENT_TIMESTAMP + INTERVAL '9 days', CURRENT_TIMESTAMP + INTERVAL '9 days' + INTERVAL '90 minutes', 'scheduled', 'https://zoom.us/j/example2', 'one_time', 499.00, 200),
('Career in Tech Panel', 'Industry leaders share insights on breaking into the tech industry.', 'Panel Discussion', NULL, CURRENT_TIMESTAMP + INTERVAL '13 days', CURRENT_TIMESTAMP + INTERVAL '13 days' + INTERVAL '2 hours', 'scheduled', 'https://zoom.us/j/example3', 'free', 0.00, 1000),
('Python Best Practices', 'Learn clean code practices and PEP 8 conventions for Python.', 'Dr. James White', 4, CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP - INTERVAL '12 days' + INTERVAL '90 minutes', 'completed', 'https://zoom.us/j/example4', 'free', 0.00, 400);

-- ============================================================================
-- SECTION 13: PLACEMENT PACKAGES
-- ============================================================================

INSERT INTO placement_packages (name, description, features, validity_days, price, job_guarantee, is_active, display_order) VALUES
('Basic Placement', 'Essential placement support for job seekers', '["Resume Review", "1 Mock Interview", "Job Matching", "Email Support"]', 90, 4999.00, FALSE, TRUE, 1),
('Pro Placement', 'Comprehensive placement package with dedicated support', '["Resume Review & Optimization", "3 Mock Interviews", "Priority Job Matching", "Dedicated Mentor (2 sessions)", "LinkedIn Profile Review", "Priority Support"]', 180, 14999.00, FALSE, TRUE, 2),
('Premium Placement', 'Complete placement guarantee with unlimited support', '["Complete Resume Makeover", "Unlimited Mock Interviews", "Priority Job Matching", "Dedicated Mentor (Unlimited)", "LinkedIn + Portfolio Review", "Salary Negotiation Coaching", "24/7 Support", "Job Guarantee"]', 365, 49999.00, TRUE, TRUE, 3);

-- ============================================================================
-- SECTION 14: STUDENT PORTFOLIOS
-- ============================================================================

INSERT INTO student_portfolios (student_id, title, description, project_url, github_url, is_featured, display_order) VALUES
(1, 'Sales Forecast Dashboard', 'Interactive Tableau dashboard analyzing quarterly sales trends with predictive analytics.', 'https://public.tableau.com/example', NULL, TRUE, 1),
(1, 'Course Progress Tracker', 'React app for tracking learning milestones and badges with gamification elements.', 'https://course-tracker.example.com', 'https://github.com/alexj/course-tracker', FALSE, 2),
(2, 'E-commerce UI Kit', 'Complete UI kit for e-commerce applications built with Figma.', 'https://figma.com/example', NULL, TRUE, 1),
(4, 'Travel App Redesign', 'UX case study and redesign of a popular travel booking app.', 'https://behance.net/example', NULL, TRUE, 1);

-- Add skills to portfolios
INSERT INTO portfolio_skills (portfolio_id, skill_id) VALUES
(1, (SELECT skill_id FROM skills WHERE slug = 'tableau')),
(1, (SELECT skill_id FROM skills WHERE slug = 'sql')),
(1, (SELECT skill_id FROM skills WHERE slug = 'data-visualization')),
(2, (SELECT skill_id FROM skills WHERE slug = 'react')),
(2, (SELECT skill_id FROM skills WHERE slug = 'typescript')),
(3, (SELECT skill_id FROM skills WHERE slug = 'figma')),
(3, (SELECT skill_id FROM skills WHERE slug = 'ui-design')),
(4, (SELECT skill_id FROM skills WHERE slug = 'ux-design')),
(4, (SELECT skill_id FROM skills WHERE slug = 'user-research'));

-- ============================================================================
-- SECTION 15: NOTIFICATIONS
-- ============================================================================

INSERT INTO notifications (user_id, type, title, message, action_url, reference_type, reference_id) VALUES
(4, 'job_match', 'New Job Match!', 'A new Junior Frontend Developer position at TechStart Inc. matches your skills.', '/student/jobs/1', 'job', 1),
(5, 'application_update', 'Application Update', 'Your application for Junior Frontend Developer has been forwarded to the company.', '/student/profile/applications', 'application', 2),
(7, 'application_update', 'Interview Scheduled', 'Your interview for UX Design Intern at DesignHub has been scheduled.', '/student/profile/applications', 'application', 4),
(4, 'course_update', 'New Course Available', 'Check out the new Machine Learning A-Z course!', '/student/courses/4', 'course', 4);

-- ============================================================================
-- SECTION 16: SYSTEM SETTINGS
-- ============================================================================

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('platform_name', 'Recruit LMS', 'string', 'Name of the platform', TRUE),
('support_email', 'support@recruitlms.com', 'string', 'Support email address', TRUE),
('max_resume_size_mb', '10', 'number', 'Maximum resume file size in MB', TRUE),
('default_currency', 'INR', 'string', 'Default currency for pricing', TRUE),
('gst_percentage', '18', 'number', 'GST percentage for payments', FALSE),
('embedding_model', 'text-embedding-3-small', 'string', 'OpenAI embedding model for job matching', FALSE),
('matching_score_threshold', '70', 'number', 'Minimum matching score to recommend candidates', FALSE),
('session_timeout_minutes', '30', 'number', 'User session timeout in minutes', FALSE);

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
