-- Invalidation des sessions JWT émises avant un changement de mot de passe.
ALTER TABLE `utilisateur` ADD COLUMN `motDePasseModifieLe` DATETIME(3) NULL;
