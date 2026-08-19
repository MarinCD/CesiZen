-- Les retours fonctionnels sont conservés séparément des journaux techniques.
CREATE TABLE `retour_utilisateur` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('PROPOSITION', 'ANOMALIE') NOT NULL,
    `estBloquant` BOOLEAN NOT NULL DEFAULT false,
    `emplacement` VARCHAR(191) NOT NULL,
    `pageUrl` VARCHAR(500) NULL,
    `description` TEXT NOT NULL,
    `statut` ENUM('NOUVEAU', 'EN_COURS', 'TRAITE') NOT NULL DEFAULT 'NOUVEAU',
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateMiseAJour` DATETIME(3) NOT NULL,
    `utilisateurId` INTEGER NULL,

    INDEX `retour_utilisateur_statut_dateCreation_idx`(`statut`, `dateCreation`),
    INDEX `retour_utilisateur_type_estBloquant_idx`(`type`, `estBloquant`),
    INDEX `retour_utilisateur_utilisateurId_idx`(`utilisateurId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `retour_utilisateur`
ADD CONSTRAINT `retour_utilisateur_utilisateurId_fkey`
FOREIGN KEY (`utilisateurId`) REFERENCES `utilisateur`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;
