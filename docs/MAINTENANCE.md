# Stratégie de maintenance — CESIZen

## Objectif

La maintenance commence par un ticket traçable et se termine avec des preuves de validation.
Elle couvre les correctifs, vulnérabilités, dépendances, sauvegardes, performances et mises à jour
documentaires. Une intervention urgente n’exonère pas de documenter a posteriori la décision.

## Priorisation et engagements

| Priorité | Exemple | Prise en charge | Cible de correction |
|---|---|---:|---:|
| P1 critique | fuite de données, compromission, service indisponible | 1 heure | 24 heures |
| P2 élevée | vulnérabilité exploitable ou fonction majeure dégradée | 1 jour ouvré | 7 jours |
| P3 modérée | risque limité ou contournement acceptable | 3 jours ouvrés | 30 jours |
| P4 faible | dette technique, documentation, amélioration mineure | prochain tri | prochain cycle planifié |

La priorité combine la gravité technique, l’exposition, l’exploitabilité, les données touchées et
l’impact métier. Une donnée de santé ou un secret exposé augmente systématiquement la priorité.

## Cycle d’un ticket

1. **Détection** — Dependabot, `npm audit`, supervision, test, retour utilisateur ou revue.
2. **Qualification** — reproduire, borner les versions et données concernées, attribuer P1 à P4.
3. **Planification** — responsable, échéance, critères d’acceptation, sauvegarde et retour arrière.
4. **Correction** — branche dédiée et petite pull request liée au ticket.
5. **Validation** — revue, tests, typecheck, lint, build, audit et test de non-régression.
6. **Déploiement** — sauvegarde vérifiée, migration avec `prisma migrate deploy`, smoke tests.
7. **Clôture** — preuves, version déployée, date, éventuels écarts et documentation mise à jour.

États recommandés du tableau GitHub : `Backlog → Qualifié → En cours → En revue → Validé → Déployé`.

## Rythme

| Contrôle | Fréquence | Preuve attendue |
|---|---|---|
| Alertes de sécurité et disponibilité | continue | alerte ou ticket horodaté |
| Tri des tickets et Dependabot | hebdomadaire | ticket assigné et priorisé |
| `npm audit`, mises à jour mineures | hebdomadaire | résultat CI et PR |
| Sauvegarde de production | quotidienne | journal d’exploitation sans donnée sensible |
| Test de restauration isolé | mensuel | compte rendu et durées RPO/RTO |
| Revue des accès, secrets et journaux | trimestrielle | checklist signée |
| Mise à jour majeure | planifiée | environnement de préproduction et retour arrière testé |

## Responsabilités

- Le responsable applicatif qualifie, priorise et accepte le changement.
- Le développeur corrige, teste et documente le retour arrière.
- Le relecteur vérifie le code, les preuves et l’absence de secrets.
- L’exploitant sauvegarde, déploie, réalise les smoke tests et surveille.

Sur ce projet individuel, une même personne peut tenir plusieurs rôles, mais les étapes et preuves
restent séparées dans le ticket et la pull request.

## Démonstration : maintenance sécurité du 13 août 2026

Ticket de référence à créer avec le modèle **Maintenance** :

- **Titre** : `[SÉCURITÉ] Corriger les dépendances npm vulnérables`.
- **Priorité** : P1, car l’audit signalait une vulnérabilité critique en production.
- **Périmètre** : Next.js, NextAuth et dépendances transitives.
- **Critères** : audit à zéro, 180 tests réussis, typecheck/lint/build réussis, absence de régression
  d’authentification, procédure de migration documentée.
- **Retour arrière** : redéployer le tag précédent et restaurer la sauvegarde uniquement si les
  données ont été modifiées.
- **Résultat obtenu** : versions corrigées, audit sans vulnérabilité connue et chaîne CI ajoutée.

Les avis GHSA sont référencés dans le ticket sans copier de preuve d’exploitation sensible. Les
commandes `npm audit fix --force` restent interdites sans analyse des changements majeurs.

## Base de données

La procédure détaillée figure dans [BACKUP_RESTORE.md](./BACKUP_RESTORE.md). Pour une base
existante adoptée par Prisma, `db push` puis `migrate resolve` ne se font qu’une fois, après
sauvegarde. Les déploiements suivants utilisent exclusivement `npx prisma migrate deploy`.
