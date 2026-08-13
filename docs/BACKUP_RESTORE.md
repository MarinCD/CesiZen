# Sauvegarde et restauration — CESIZen

Cette procédure concerne chaque environnement séparément. Les sauvegardes contenant des
données personnelles doivent être chiffrées, stockées dans l'Union européenne et accessibles
uniquement au responsable d'exploitation.

## Objectifs

- Sauvegarde MySQL quotidienne, conservation glissante de 30 jours.
- RPO cible : 24 heures. RTO cible : 4 heures.
- Test de restauration mensuel sur une base isolée.
- Aucun secret ni fichier `.env` dans Git ou dans l'archive applicative.

## Sauvegarde

Pour une sauvegarde applicative ponctuelle chiffrée (notamment avant une migration) :

```bash
npm run db:backup
npm run db:backup:verify
```

Les archives et la clé locale sont créées avec des droits restreints dans `backups/`, ignoré par
Git. En production, fournir `BACKUP_ENCRYPTION_KEY` depuis un coffre de secrets et conserver la
clé séparément de l’archive. Cette vérification contrôle le déchiffrement, l’authenticité GCM,
l’empreinte et la lisibilité ; le test mensuel sur une base isolée reste obligatoire.

Pour la sauvegarde native complète MySQL, les valeurs sont fournies par le coffre de secrets de
l’hébergeur :

```bash
mysqldump \
  --single-transaction \
  --routines \
  --triggers \
  --set-gtid-purged=OFF \
  --host=DB_HOST \
  --user=DB_USER \
  --password \
  DB_NAME > cesizen-YYYYMMDD-HHMM.sql
```

L'archive est ensuite chiffrée avec l'outil de sauvegarde de l'hébergeur. Le journal
d'exploitation doit conserver la date, l'environnement, la taille, le résultat et la personne
ayant contrôlé l'opération, mais jamais le mot de passe ni le contenu des données.

## Restauration contrôlée

1. Ouvrir un ticket d'incident et identifier la dernière sauvegarde valide.
2. Placer l'application concernée en maintenance et bloquer les écritures.
3. Créer une base MySQL vide et isolée ; ne jamais écraser directement la base courante.
4. Restaurer l'archive avec `mysql --host=DB_HOST --user=DB_USER --password DB_NAME`.
5. Exécuter `npx prisma migrate deploy` avec les secrets de l'environnement.
6. Vérifier les comptes, articles, questionnaires et historiques avec des requêtes de contrôle.
7. Lancer les smoke tests, puis basculer l'application vers la base restaurée.
8. Surveiller les erreurs, clôturer le ticket et documenter le temps réel de restauration.

## Contrôle périodique

Une sauvegarde n'est considérée valide qu'après un test de restauration. Une tâche mensuelle
crée une base temporaire, restaure la dernière archive, exécute les contrôles puis détruit cette
base selon la procédure de l'hébergeur. Le résultat est attaché à un ticket GitHub de maintenance.

## Retour arrière applicatif

Chaque déploiement porte un tag Git. En cas de régression, redéployer le dernier tag sain. Une
migration destructive doit être précédée d'une migration compatible ascendante et d'une
sauvegarde vérifiée ; son rollback SQL doit être préparé et testé avant la mise en production.
