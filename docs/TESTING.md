# Couverture de tests — CESIZen

Ce document présente la stratégie de tests appliquée à CESIZen et démontre que l'ensemble des fonctionnalités critiques (RGPD, sécurité, métier) est couvert par une suite automatisée.

---

## Vue d'ensemble

| Type de test | Outil | Nombre de fichiers | Nombre de tests |
|---|---|---|---|
| Unitaires | Vitest | 12 | ~70 |
| Intégration | Vitest + mocks | 7 | ~40 |
| End-to-end | Playwright (Chromium) | 9 | ~25 |
| **Total** | | **28** | **~135** |

Pyramide de tests respectée : beaucoup d'unitaires rapides, une couche d'intégration ciblée sur les routes API, et quelques E2E pour valider les parcours utilisateur réels.

---

## 1. Tests unitaires

Les tests unitaires valident la logique pure : schémas de validation, fonctions de calcul, services isolés. Ils s'exécutent en moins de 3 secondes et tournent sans serveur ni base de données (Prisma est mocké).

### Authentification et utilisateurs
- **`unit/auth/register-schema.test.ts`** — règles de mot de passe (8c min, majuscule, chiffre), email valide, consentement RGPD obligatoire, longueur du nom.
- **`unit/auth/login-schema.test.ts`** — email obligatoire, mot de passe requis.
- **`unit/auth/update-user-schema.test.ts`** — modification partielle, ancien mot de passe accepté, refus rôles inconnus.

### Diagnostic (échelle Holmes & Rahe)
- **`unit/diagnostics/diagnostic-schema.test.ts`** — payload de soumission (ids positifs, au moins une question).
- **`unit/diagnostics/questionnaire-schema.test.ts`** — création de questionnaire avec questions et réponses imbriquées, contraintes de longueur, validation récursive.
- **`unit/diagnostics/interpreter-score.test.ts`** — **seuils Holmes & Rahe** (FAIBLE < 150, MODERE 150-299, ELEVE ≥ 300), tests aux frontières.

### Sécurité applicative
- **`unit/security/rateLimit.test.ts`** — limite respectée, blocage après dépassement, headers `Retry-After` / `X-RateLimit-*`, isolation des buckets par IP et par route, reset après la fenêtre temporelle, gestion des chaînes de proxies (`x-forwarded-for`).
- **`unit/security/securityService.test.ts`** — **conformité RGPD du back-office sécurité** :
  - masquage IPv4 (`192.168.1.42` → `192.168.x.x`)
  - pseudonymisation stable des emails (FNV-1a → `acct-xxxxxxxx`)
  - aucun email ne fuit dans `recentEvents`
  - détection de brute-force (≥ 5 échecs/IP/heure)
  - exclusion des événements de santé (`DIAGNOSTIC_SUBMIT`) du dashboard cyber.
- **`unit/security/audit.test.ts`** — sérialisation JSON des metadata, résilience aux erreurs BDD (le log ne doit jamais casser une route fonctionnelle).

### Articles d'information
- **`unit/informations/information-schema.test.ts`** — validation des champs titre, contenu, catégorie.

---

## 2. Tests d'intégration

Ces tests appellent directement les handlers Next.js des routes API avec des `NextRequest` mockés et vérifient les codes HTTP, le contrôle d'accès et l'orchestration des services. Les dépendances externes (Prisma, NextAuth, bcrypt, audit) sont mockées.

### Comptes utilisateur
- **`integration/utilisateurs/register.test.ts`** — inscription nominale 201, doublon email 409, payload invalide 400, consentement RGPD obligatoire.
- **`integration/utilisateurs/register-ratelimit.test.ts`** — vérifie que le rate-limit déclenche un `429` **et** un événement `RATE_LIMIT_HIT` dans l'audit.
- **`integration/utilisateurs/change-password.test.ts`** — couvre toute la matrice de sécurité du changement de mot de passe :
  - rejet si le nouveau mdp est fourni sans l'ancien
  - rejet si l'ancien mdp est incorrect (vérifié via `bcrypt.compare`)
  - succès si l'ancien mdp est correct
  - **un admin peut modifier le mdp d'un autre compte sans connaître l'ancien**
  - refus 403 si un utilisateur tente de modifier le compte d'un autre
  - refus 403 si un utilisateur tente de changer son rôle
  - mise à jour des autres champs sans toucher au mot de passe
- **`integration/utilisateurs/export.test.ts`** — **droit à la portabilité (art. 20 RGPD)** :
  - 401 sans session, 403 si tentative d'export d'un autre compte
  - 200 + `Content-Disposition: attachment` pour son propre export
  - un admin peut exporter le compte d'un autre
  - une entrée `EXPORT_USER_DATA` est créée dans l'audit log
  - le payload contient la notice RGPD obligatoire.

### Articles d'information (CRUD admin)
- **`integration/informations/list.test.ts`** — listing public, filtrage par catégorie, pagination.
- **`integration/informations/crud.test.ts`** — GET / PUT / DELETE :
  - 403 si non-admin sur PUT et DELETE
  - 200 si admin sur PUT et DELETE
  - 400 si payload invalide sur PUT
  - 404 si article inexistant sur GET.

### Diagnostics (échelle de stress)
- **`integration/diagnostics/get.test.ts`** — récupération du diagnostic actif.
- **`integration/diagnostics/submit.test.ts`** — soumission complète :
  - calcul du score et interprétation pour un visiteur anonyme (non sauvegardé)
  - sauvegarde + audit `DIAGNOSTIC_SUBMIT` pour un utilisateur connecté
  - rejet 400 si `questionIds` vide ou `diagnosticId` non positif
  - retour 429 + log `RATE_LIMIT_HIT` quand le rate-limit s'active.

### Questionnaires (création admin)
- **`integration/questionnaires/create.test.ts`** — refus 403 non-admin, création nominale 201, validation Zod, acceptation des questions avec réponses imbriquées.

---

## 3. Tests end-to-end (Playwright)

Les tests E2E utilisent Chromium (via le binaire Puppeteer pour contourner la non-compatibilité de Playwright avec Ubuntu 26.04) et valident les parcours utilisateur réels contre le serveur Next.js de développement.

### Parcours d'authentification
- **`e2e/web/auth/login.spec.ts`** — connexion réussie, erreur sur credentials invalides, déconnexion + perte de session.
- **`e2e/web/auth/register.spec.ts`** — inscription d'un nouvel utilisateur.

### Contrôle d'accès
- **`e2e/web/admin/protected.spec.ts`** — un utilisateur lambda ne peut pas accéder à `/admin/*`.
- **`e2e/web/admin/securite.spec.ts`** — la page `/admin/securite` :
  - redirige un non-admin vers `/login`
  - affiche le titre « Cybersécurité », les KPIs et le journal d'audit pour un admin
  - le lien apparaît dans la sidebar admin
  - la page de création de questionnaire est accessible.

### Conformité RGPD
- **`e2e/web/legal/pages.spec.ts`** — politique de confidentialité (mention des droits portabilité/effacement/CNIL), mentions légales (hébergeur), CGU (numéro de prévention 3114), liens du footer fonctionnels.
- **`e2e/web/rgpd/cookie-banner.spec.ts`** — la bannière s'affiche à la première visite, disparaît après acceptation, et reste fermée après rechargement (persistance localStorage).
- **`e2e/web/diagnostic/consent.spec.ts`** — **consentement explicite avant tout traitement de donnée de santé (art. 9 RGPD)** :
  - écran de consentement affiché avant le questionnaire
  - bouton « Commencer » désactivé tant que la case n'est pas cochée
  - lien vers la politique de confidentialité présent
  - le questionnaire ne démarre qu'après acceptation.

### Espace utilisateur
- **`e2e/web/profil/change-password.spec.ts`** :
  - erreur affichée si l'ancien mot de passe est incorrect
  - erreur en direct si les deux nouveaux mots de passe diffèrent
  - le bouton « Exporter mes données » est visible et pointe vers `/api/utilisateurs/{id}/export`.

### Articles
- **`e2e/web/informations/list.spec.ts`** — liste publique, filtres, navigation.

---

## 4. Couverture par fonctionnalité

| Fonctionnalité | Unit | Intégration | E2E |
|---|:-:|:-:|:-:|
| Inscription | ✓ | ✓ | ✓ |
| Connexion / déconnexion | ✓ | — | ✓ |
| Modification de profil | ✓ | ✓ | ✓ |
| Changement de mot de passe (avec ancien) | ✓ | ✓ | ✓ |
| Export RGPD des données utilisateur | — | ✓ | ✓ |
| Suppression de compte | — | — | ✓ |
| Diagnostic — soumission | ✓ | ✓ | — |
| Diagnostic — consentement explicite | — | — | ✓ |
| Diagnostic — interprétation du score | ✓ | — | — |
| Création de questionnaire (admin) | ✓ | ✓ | ✓ |
| CRUD articles d'information | ✓ | ✓ | ✓ |
| Rate-limiting inscription / diagnostic | ✓ | ✓ | — |
| Journal d'audit | ✓ | ✓ | — |
| Détection brute-force | ✓ | — | — |
| Pseudonymisation IP / comptes | ✓ | — | — |
| Page cybersécurité admin | — | — | ✓ |
| Bannière cookies | — | — | ✓ |
| Pages légales (confidentialité / CGU / mentions) | — | — | ✓ |
| Contrôle d'accès admin | — | ✓ | ✓ |

---

## 5. Couverture des exigences RGPD

| Article RGPD | Mécanisme | Test correspondant |
|---|---|---|
| Art. 5 — minimisation | Masquage IP et pseudonymisation des emails dans le back-office sécurité | `unit/security/securityService.test.ts` |
| Art. 7 — consentement | Case à cocher RGPD lors de l'inscription | `unit/auth/register-schema.test.ts` |
| Art. 9 — données de santé | Consentement explicite avant le diagnostic | `e2e/web/diagnostic/consent.spec.ts` |
| Art. 15 — droit d'accès | Affichage des données sur le profil | `e2e/web/profil/change-password.spec.ts` |
| Art. 16 — rectification | Formulaire de modification du profil | `integration/utilisateurs/change-password.test.ts` |
| Art. 17 — effacement | Suppression de compte avec cascade Prisma | E2E logout/login |
| Art. 20 — portabilité | Export JSON complet | `integration/utilisateurs/export.test.ts` + E2E |
| Art. 25 — privacy by design | Validation Zod stricte, ACL côté API | toutes les `integration/*.test.ts` |
| Art. 32 — sécurité | Bcrypt, rate-limit, audit log, headers CSP/HSTS | `unit/security/*` + `integration/*ratelimit*` |

---

## 6. Couverture des exigences sécurité

| Mesure | Test |
|---|---|
| Hashage bcrypt | implicite via `bcrypt.compare` mocké dans `change-password` |
| Rate-limit anti brute-force (login, register, diagnostic) | `unit/security/rateLimit.test.ts` + tests d'intégration |
| Journalisation des tentatives de connexion | `unit/security/audit.test.ts` |
| Détection automatique de brute-force | `unit/security/securityService.test.ts` |
| Validation stricte des entrées (anti-injection) | tous les `unit/*-schema.test.ts` |
| Contrôle d'accès basé sur les rôles | `integration/*` + `e2e/web/admin/*` |
| Pas de fuite de données sensibles dans les logs admin | `unit/security/securityService.test.ts` (vérif. métadonnées sanitisées) |
| Verification de l'ancien mot de passe avant changement | `integration/utilisateurs/change-password.test.ts` |
| Protection contre la modification de rôle par un user lambda | `integration/utilisateurs/change-password.test.ts` |

---

## 7. Comment lancer les tests

```bash
# Unitaires + intégration (rapide, ~3s)
npm test

# Avec couverture de code
npm run test:coverage

# E2E (nécessite le serveur lancé sur localhost:3000)
npm run dev &
npm run test:e2e

# Tous les tests E2E avec UI
npm run test:e2e:ui
```

### Pré-requis E2E

- Node 18+, base MySQL accessible, seed appliqué (`npx prisma db seed`)
- Comptes de test : `admin@cesizen.fr / Admin1234!` et `user@cesizen.fr / User1234!`
- Sur Ubuntu 26.04, Playwright utilise le binaire Chromium fourni par Puppeteer (cf. `playwright.config.ts`)

---

## 8. Ce que les tests NE couvrent pas (assumé)

Par honnêteté intellectuelle, voici ce qui n'est pas couvert et pourquoi :

- **Test de charge / performance** : hors scope projet pédagogique. Le rate-limit est testé fonctionnellement mais pas sous stress réel.
- **Test du middleware Next.js** (rate-limit login) : nécessite un environnement edge runtime spécifique. Le mécanisme est validé indirectement via `unit/security/rateLimit.test.ts` qui partage la même fonction.
- **Test du script `purge-data.cjs`** : c'est un script CLI à lancer en cron, testé manuellement en mode `--dry-run`.
- **Test d'envoi d'email** : pas d'emails transactionnels dans l'application actuelle.
- **Test du chiffrement au repos** : non implémenté (limite documentée dans `confidentialite/page.tsx` — nécessiterait une migration HDS).
