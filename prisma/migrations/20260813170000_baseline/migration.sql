-- CreateTable
CREATE TABLE `utilisateur` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NULL,
    `prenom` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `motDePasse` VARCHAR(191) NOT NULL,
    `role` ENUM('VISITEUR', 'UTILISATEUR', 'ADMINISTRATEUR') NOT NULL DEFAULT 'UTILISATEUR',
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `derniereActivite` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `consentementRGPD` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `utilisateur_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `information` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titre` VARCHAR(191) NOT NULL,
    `texte` TEXT NOT NULL,
    `categorie` VARCHAR(191) NULL,
    `datePublication` DATETIME(3) NULL,
    `idCreateur` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questionnaire` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titre` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `idCreateur` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diagnostic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `questionnaireId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `texte` VARCHAR(191) NOT NULL,
    `pointsAssocies` INTEGER NOT NULL,
    `questionnaireId` INTEGER NULL,
    `diagnosticId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reponse` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `texte` VARCHAR(191) NOT NULL,
    `valeur` INTEGER NOT NULL,
    `questionId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resultat_diagnostic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dateRealisation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `score` INTEGER NOT NULL,
    `interpretation` VARCHAR(191) NULL,
    `utilisateurId` INTEGER NOT NULL,
    `diagnosticId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action` VARCHAR(191) NOT NULL,
    `actorId` INTEGER NULL,
    `targetId` INTEGER NULL,
    `ip` VARCHAR(191) NULL,
    `metadata` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_log_actorId_idx`(`actorId`),
    INDEX `audit_log_targetId_idx`(`targetId`),
    INDEX `audit_log_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rate_limit_attempt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `keyHash` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `rate_limit_attempt_keyHash_createdAt_idx`(`keyHash`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tracker_emotion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `emotion` VARCHAR(191) NOT NULL,
    `intensite` INTEGER NOT NULL,
    `note` TEXT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `utilisateurId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `information` ADD CONSTRAINT `information_idCreateur_fkey` FOREIGN KEY (`idCreateur`) REFERENCES `utilisateur`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questionnaire` ADD CONSTRAINT `questionnaire_idCreateur_fkey` FOREIGN KEY (`idCreateur`) REFERENCES `utilisateur`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diagnostic` ADD CONSTRAINT `diagnostic_questionnaireId_fkey` FOREIGN KEY (`questionnaireId`) REFERENCES `questionnaire`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question` ADD CONSTRAINT `question_questionnaireId_fkey` FOREIGN KEY (`questionnaireId`) REFERENCES `questionnaire`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question` ADD CONSTRAINT `question_diagnosticId_fkey` FOREIGN KEY (`diagnosticId`) REFERENCES `diagnostic`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reponse` ADD CONSTRAINT `reponse_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resultat_diagnostic` ADD CONSTRAINT `resultat_diagnostic_utilisateurId_fkey` FOREIGN KEY (`utilisateurId`) REFERENCES `utilisateur`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resultat_diagnostic` ADD CONSTRAINT `resultat_diagnostic_diagnosticId_fkey` FOREIGN KEY (`diagnosticId`) REFERENCES `diagnostic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tracker_emotion` ADD CONSTRAINT `tracker_emotion_utilisateurId_fkey` FOREIGN KEY (`utilisateurId`) REFERENCES `utilisateur`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
