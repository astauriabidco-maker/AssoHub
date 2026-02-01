-- Script pour promouvoir un utilisateur en SUPER_ADMIN
-- Remplacez 'votre@email.com' par l'email de votre utilisateur

-- Option 1: Par email
UPDATE User SET role = 'SUPER_ADMIN' WHERE email = 'admin@assohub.fr';

-- Option 2: Par ID utilisateur
-- UPDATE User SET role = 'SUPER_ADMIN' WHERE id = 'votre-user-id';

-- Vérifier le résultat
SELECT id, email, role FROM User WHERE role = 'SUPER_ADMIN';
