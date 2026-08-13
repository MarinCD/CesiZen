## Contexte et risque

L’audit npm du 13 août 2026 signalait cinq vulnérabilités en production, dont une critique. Les
versions de Next.js et NextAuth exposées devaient être remplacées sans appliquer aveuglément
`npm audit fix --force`.

## Priorité

**P1 — critique**, en raison d’une vulnérabilité critique présente dans les dépendances de
production. Prise en charge immédiate et validation complète avant déploiement.

## Périmètre

- Mise à niveau de Next.js, NextAuth, React et dépendances transitives concernées.
- Revalidation de l’authentification, des routes API et des en-têtes de sécurité.
- Mise à jour du lockfile et documentation de la maintenance.

## Critères d’acceptation

- [x] `npm audit` ne signale aucune vulnérabilité connue.
- [x] Les 180 tests unitaires et d’intégration réussissent.
- [x] Le typecheck réussit.
- [x] Le lint ne contient aucune erreur bloquante.
- [x] Le build de production réussit.
- [x] La CSP avec nonce et la protection CSRF sont testées.
- [x] La procédure de maintenance et le retour arrière sont documentés.

## Validation obtenue

- Next.js `16.3.0`, NextAuth `4.24.15`, React `19.2.8`.
- Audit : 0 vulnérabilité sur 716 dépendances.
- Tests : 180/180 ; typecheck : succès ; lint : 0 erreur ; build : succès.
- Base Alwaysdata sauvegardée, synchronisée et migration baseline enregistrée.

## Retour arrière

Redéployer le dernier tag sain. Si une migration de données a eu lieu, restaurer uniquement sur
une base isolée depuis la sauvegarde vérifiée, exécuter les smoke tests, puis basculer la connexion.
Ne jamais écraser directement la base active.

## Références

- GHSA-7rqj-j65f-68wh
- GHSA-q4gf-8mx6-v5v3
- GHSA-c4j6-fc7j-m34r
- `docs/MAINTENANCE.md`
- `docs/BACKUP_RESTORE.md`
