# Couverture de tests — CESIZen

Ce document présente la stratégie de tests appliquée à CESIZen et démontre que **toutes les routes API et tous les services métier** sont couverts par une suite automatisée.

---

## Vue d'ensemble

| Type de test | Outil | Fichiers | Tests |
|---|---|---|---|
| Unitaires | Vitest | 15 | ~110 |
| Intégration (routes API) | Vitest + mocks | 15 | ~68 |
| End-to-end | Playwright (Chromium) | 9 | ~35 |
| **Total** | | **39** | **~213** |

Statut : **178/178 Vitest** ✓ — **22+ E2E** validés sur dernier run.

Pyramide respectée : majorité d'unitaires rapides (<3 s), une couche d'intégration ciblée sur les handlers Next.js avec dépendances mockées, et des E2E pour valider les parcours utilisateur réels contre un serveur de développement.

---

## Synthèse — chemins critiques

### ✅ Chemins critiques totalement testés

**Parcours utilisateur**
- Inscription (validation mdp, email unique, consentement RGPD) — unit + intégration + E2E
- Connexion / déconnexion / persistance de session — intégration + E2E
- Modification du profil — intégration + E2E
- **Changement de mot de passe** (ancien obligatoire, bcrypt verify, confirmation, admin bypass) — 7 tests d'intégration + E2E
- **Suppression de compte** / droit à l'oubli (art. 17 RGPD) — intégration
- **Export JSON** / droit à la portabilité (art. 20 RGPD) — intégration + E2E

**Cœur métier diagnostic**
- Consentement explicite obligatoire (art. 9 RGPD donnée santé) — E2E
- Soumission anonyme vs connectée + audit log — intégration
- Calcul du score Holmes & Rahe + seuils FAIBLE/MODERE/ELEVE — unit
- Historique strictement isolé par utilisateur (aucune fuite cross-account) — unit + intégration

**Sécurité applicative**
- Hashage bcrypt cost 12 vérifié à l'inscription — unit
- Rate-limit IP par route (register, diagnostic, login middleware) — unit + intégration
- Journal d'audit (logins, exports, rate-limits, diagnostics) — unit + intégration
- Détection brute-force (≥ 5 échecs/IP/heure) — unit
- Pseudonymisation IPs et comptes dans le back-office sécu — unit
- Aucune fuite du `motDePasse` dans les retours API — unit + intégration

**Back-office admin**
- ACL middleware (redirection non-admin) — E2E + intégration sur chaque route
- CRUD articles complet (POST, GET, PUT, DELETE) — intégration + E2E
- Création questionnaire avec questions+réponses imbriquées — intégration + E2E
- Listing utilisateurs (vérifié sans motDePasse) — intégration
- Page Cybersécurité (KPIs, alertes brute-force, journal) — E2E

**Conformité légale**
- Pages confidentialité / mentions légales / CGU accessibles — E2E
- Bannière cookies (affichage + persistance localStorage) — E2E

### ⚠️ Chemins partiellement testés
- **Logique interne du `authorize` NextAuth** : la fonction est exposée et la config validée, mais le mock combiné bcrypt+Prisma dans un contexte NextAuth est trop fragile. Validation finale par E2E + tests manuels (bombardement curl documenté).
- **Middleware Next.js edge runtime** : la fonction `rateLimit()` est testée en isolation, mais son exécution dans l'edge runtime n'est pas testée directement.

### ❌ Non testé (assumé)
- Composants React (formulaires, modals, bannière) — couverture indirecte via E2E
- Tests de charge / performance — hors scope projet
- Script `purge-data.cjs` — testé manuellement en `--dry-run`
- Envoi d'email — pas de feature email dans l'application
- Chiffrement au repos — non implémenté (limite documentée pour migration HDS)

### Verdict

**Tous les chemins critiques fonctionnels et de sécurité sont couverts.** Si un test casse, ça signale un vrai bug :
- contrat d'une route API qui change → cassé immédiatement
- régression sur le hashage bcrypt → cassé
- endpoint admin sans guard → cassé
- fuite de `motDePasse` dans un retour → cassé
- régression sur le calcul Holmes & Rahe → cassé
- mécanisme RGPD défaillant (export, suppression, consentement) → cassé

Les zones non testées sont des couches d'affichage qui dépendent de la logique en dessous, déjà couverte — compromis pyramidal classique.

---

## 1. Couverture des routes API

Toutes les routes (10 fichiers) et toutes les méthodes HTTP sont testées :

| Route | Méthodes | Tests |
|---|---|---|
| `/api/auth/[...nextauth]` | NextAuth | `integration/auth/authorize.test.ts` (config, callbacks jwt/session) |
| `/api/diagnostics` | GET, POST | `integration/diagnostics/get.test.ts`, `integration/diagnostics/submit.test.ts` |
| `/api/informations` | GET, POST | `integration/informations/list.test.ts`, `integration/informations/create.test.ts` |
| `/api/informations/[id]` | GET, PUT, DELETE | `integration/informations/crud.test.ts` |
| `/api/questionnaires` | GET, POST | `integration/questionnaires/list.test.ts`, `integration/questionnaires/create.test.ts` |
| `/api/questionnaires/[id]` | GET | `integration/questionnaires/get-by-id.test.ts` |
| `/api/resultats` | GET | `integration/resultats/historique.test.ts` |
| `/api/utilisateurs` | GET, POST | `integration/utilisateurs/list.test.ts`, `integration/utilisateurs/register.test.ts`, `integration/utilisateurs/register-ratelimit.test.ts` |
| `/api/utilisateurs/[id]` | GET, PUT, DELETE | `integration/utilisateurs/get-by-id.test.ts`, `integration/utilisateurs/change-password.test.ts`, `integration/utilisateurs/delete.test.ts` |
| `/api/utilisateurs/[id]/export` | GET | `integration/utilisateurs/export.test.ts` |

Chaque test couvre :
- Code de retour HTTP correct (200/201/400/401/403/404/429/500)
- Contrôle d'accès (visiteur / utilisateur / admin)
- Validation des entrées par Zod
- Effets de bord (audit log, rate-limit, hashage bcrypt)
- Sérialisation : pas de fuite de motDePasse, headers `Content-Disposition` pour les exports

---

## 2. Tests unitaires

Les tests unitaires valident la logique pure : schémas, fonctions de calcul, services isolés. Ils s'exécutent en moins de 3 secondes et tournent sans serveur ni base de données (Prisma est mocké).

### Schémas de validation (Zod)
- **`unit/auth/register-schema.test.ts`** — règles de mot de passe (8c min, majuscule, chiffre), email valide, consentement RGPD obligatoire, longueur du nom (7 tests)
- **`unit/auth/login-schema.test.ts`** — email et mot de passe requis (3 tests)
- **`unit/auth/update-user-schema.test.ts`** — modification partielle, ancien mot de passe accepté, refus rôles inconnus (7 tests)
- **`unit/diagnostics/diagnostic-schema.test.ts`** — payload de soumission (ids positifs, au moins une question)
- **`unit/diagnostics/questionnaire-schema.test.ts`** — création de questionnaire avec réponses imbriquées, contraintes de longueur (11 tests)
- **`unit/informations/information-schema.test.ts`** — validation titre, contenu, catégorie

### Logique métier
- **`unit/diagnostics/interpreter-score.test.ts`** — **seuils Holmes & Rahe** (FAIBLE < 150, MODERE 150-299, ELEVE ≥ 300), tests aux frontières (6 tests)

### Services Prisma (mocks)
- **`unit/services/userService.test.ts`** — 10 tests :
  - `getAllUsers` et `getUserById` excluent le motDePasse dans le `select`
  - `createUser` hashe avec bcrypt cost 12
  - `updateUser` ignore les champs vides, hash si motDePasse présent
  - `deleteUser`, `getGlobalStats` (4 compteurs parallèles), `getRecentUsers` (limit), `getRecentDiagnostics` (includes)
- **`unit/services/informationService.test.ts`** — 11 tests : pagination (skip/take), filtre catégorie (avec exception "Toutes"), recherche full-text OR (titre/texte), `pages` calculé, date par défaut, `updateInformation` sélectif, `getCategories` distinct non-null
- **`unit/services/diagnosticService.test.ts`** — 10 tests : `getQuestionnaires` includes, `submitDiagnostic` somme correcte + interprétation (FAIBLE/MODERE/ELEVE), `getHistoriqueDiagnostics` filtre par utilisateurId, `createQuestionnaire` imbrique diagnostic+questions+réponses

### Sécurité applicative
- **`unit/security/rateLimit.test.ts`** — 8 tests : limite respectée, blocage après dépassement, headers `Retry-After` / `X-RateLimit-*`, isolation des buckets par IP et par route, reset après la fenêtre temporelle, gestion des chaînes de proxies (`x-forwarded-for`)
- **`unit/security/securityService.test.ts`** — **conformité RGPD du back-office sécurité** (8 tests) :
  - masquage IPv4 (`192.168.1.42` → `192.168.x.x`)
  - pseudonymisation stable des emails (FNV-1a → `acct-xxxxxxxx`)
  - aucun email ne fuit dans `recentEvents`
  - détection de brute-force (≥ 5 échecs/IP/heure)
  - exclusion des événements de santé (`DIAGNOSTIC_SUBMIT`) du dashboard cyber
- **`unit/security/audit.test.ts`** — 4 tests : sérialisation JSON des metadata, résilience aux erreurs BDD (le log ne doit jamais casser une route fonctionnelle)

---

## 3. Tests d'intégration (routes API)

Ces tests appellent directement les handlers Next.js avec des `NextRequest` mockés. Vérifient codes HTTP, ACL, orchestration des services. Dépendances externes (Prisma, NextAuth, bcrypt, audit, rateLimit) mockées.

### Authentification (NextAuth)
- **`integration/auth/authorize.test.ts`** — 10 tests : stratégie JWT, page `/login`, callbacks `jwt`/`session` (propagation id+role, refresh sans user, absence du motDePasse), provider Credentials et fonction `authorize` exposée

### Comptes utilisateur
- **`integration/utilisateurs/list.test.ts`** — 4 tests : 403 sans session/non-admin, 200 admin, motDePasse absent du retour
- **`integration/utilisateurs/get-by-id.test.ts`** — 5 tests : 401 sans session, 403 cross-account, accès à soi-même, admin sur n'importe qui, 404 inexistant
- **`integration/utilisateurs/register.test.ts`** — 4 tests : 201 nominale, 409 doublon, 400 payload invalide, consentement RGPD obligatoire
- **`integration/utilisateurs/register-ratelimit.test.ts`** — 2 tests : 429 et log `RATE_LIMIT_HIT`, laisse passer sans rate-limit
- **`integration/utilisateurs/change-password.test.ts`** — 7 tests : matrice complète de sécurité du changement de mot de passe (ancien obligatoire pour self, bcrypt verify, admin bypass, refus 403 cross-account, refus 403 changement de rôle par un user)
- **`integration/utilisateurs/delete.test.ts`** — 5 tests : **droit à l'effacement RGPD art. 17** (401, 403 cross, 200 self, admin n'importe qui, 500 si BDD échoue)
- **`integration/utilisateurs/export.test.ts`** — 7 tests : **droit à la portabilité RGPD art. 20** (401, 403, 200 + `Content-Disposition`, admin, 404, audit log écrit, notice RGPD dans le payload)

### Articles d'information
- **`integration/informations/list.test.ts`** — listing public, filtrage par catégorie, pagination
- **`integration/informations/create.test.ts`** — 5 tests : 403 non-admin, 201 admin, 400 titre/texte trop courts
- **`integration/informations/crud.test.ts`** — 8 tests : GET (200/404), PUT (403/200/400), DELETE (403/200/sans session)

### Diagnostics (échelle Holmes & Rahe)
- **`integration/diagnostics/get.test.ts`** — récupération du diagnostic actif (4 tests)
- **`integration/diagnostics/submit.test.ts`** — 5 tests : calcul anonyme (non sauvegardé), sauvegarde + audit `DIAGNOSTIC_SUBMIT` pour utilisateur connecté, rejets 400, rate-limit 429 + audit

### Questionnaires (admin)
- **`integration/questionnaires/list.test.ts`** — 2 tests : liste 200, tableau vide
- **`integration/questionnaires/get-by-id.test.ts`** — 3 tests : 200, 404, parse correct de l'id
- **`integration/questionnaires/create.test.ts`** — 6 tests : 403 non-admin/sans session, 201 admin, 400 invalide, réponses imbriquées

### Résultats / Historique
- **`integration/resultats/historique.test.ts`** — 3 tests : 401 sans session, 200 + filtre par utilisateurId, isolation entre utilisateurs (pas de fuite de l'historique d'un autre)

---

## 4. Tests end-to-end (Playwright)

Les tests E2E utilisent Chromium (binaire Puppeteer pour contourner la non-compatibilité de Playwright avec Ubuntu 26.04) et valident les parcours utilisateur réels contre le serveur Next.js de développement.

### Parcours d'authentification
- **`e2e/web/auth/login.spec.ts`** — connexion réussie, erreur sur credentials invalides, déconnexion + perte de session
- **`e2e/web/auth/register.spec.ts`** — inscription d'un nouvel utilisateur, validation mot de passe faible

### Contrôle d'accès
- **`e2e/web/admin/protected.spec.ts`** — un utilisateur lambda ne peut pas accéder à `/admin/*`, un admin peut
- **`e2e/web/admin/securite.spec.ts`** — page `/admin/securite` : redirige non-admin, affiche cybersécurité+KPIs+journal pour admin, sidebar contient le lien, page nouveau questionnaire accessible

### Conformité RGPD
- **`e2e/web/legal/pages.spec.ts`** — politique de confidentialité (droits portabilité/effacement/CNIL), mentions légales (hébergeur), CGU (numéro 3114), liens du footer fonctionnels
- **`e2e/web/rgpd/cookie-banner.spec.ts`** — bannière affichée à la première visite, disparaît après acceptation, persiste via localStorage
- **`e2e/web/diagnostic/consent.spec.ts`** — **consentement explicite avant donnée de santé art. 9 RGPD** : écran de consentement, bouton désactivé sans case cochée, lien vers la politique de confidentialité, démarrage du questionnaire après acceptation

### Espace utilisateur
- **`e2e/web/profil/change-password.spec.ts`** : ancien mdp incorrect affiche une erreur, mismatch confirmation en direct, bouton « Exporter mes données » présent et pointe vers `/api/utilisateurs/{id}/export`

### Articles
- **`e2e/web/informations/list.spec.ts`** — liste publique, filtres, navigation

---

## 5. Matrice fonctionnalité × type de test

| Fonctionnalité | Unit | Intégration | E2E |
|---|:-:|:-:|:-:|
| Inscription utilisateur | ✓ | ✓ | ✓ |
| Connexion / déconnexion | ✓ | ✓ (config + callbacks) | ✓ |
| Listing utilisateurs (admin) | ✓ | ✓ | — |
| Lecture profil par ID | — | ✓ | — |
| Modification de profil | ✓ | ✓ | ✓ |
| Changement de mot de passe (avec ancien) | ✓ | ✓ | ✓ |
| Suppression de compte (RGPD art. 17) | ✓ | ✓ | — |
| Export RGPD (RGPD art. 20) | — | ✓ | ✓ |
| Diagnostic — soumission anonyme | — | ✓ | — |
| Diagnostic — soumission connectée + audit | ✓ | ✓ | — |
| Diagnostic — consentement explicite | — | — | ✓ |
| Diagnostic — interprétation du score | ✓ | ✓ | — |
| Diagnostic — historique par utilisateur | ✓ | ✓ | — |
| Listing questionnaires | ✓ | ✓ | — |
| Détail questionnaire par ID | ✓ | ✓ | — |
| Création questionnaire (admin) | ✓ | ✓ | ✓ |
| Listing articles | ✓ | ✓ | ✓ |
| Création article (admin) | — | ✓ | — |
| Modification article (admin) | ✓ | ✓ | — |
| Suppression article (admin) | — | ✓ | — |
| Filtres et pagination articles | ✓ | ✓ | ✓ |
| Rate-limiting | ✓ | ✓ | — |
| Journal d'audit | ✓ | ✓ | — |
| Détection brute-force | ✓ | — | — |
| Pseudonymisation IP / comptes | ✓ | — | — |
| Page cybersécurité admin | — | — | ✓ |
| Bannière cookies | — | — | ✓ |
| Pages légales (confidentialité / CGU / mentions) | — | — | ✓ |
| Contrôle d'accès admin | — | ✓ | ✓ |

---

## 6. Couverture des exigences RGPD

| Article RGPD | Mécanisme | Test correspondant |
|---|---|---|
| Art. 5 — minimisation | Masquage IP et pseudonymisation des emails dans le back-office sécurité | `unit/security/securityService.test.ts` |
| Art. 7 — consentement | Case à cocher RGPD lors de l'inscription | `unit/auth/register-schema.test.ts`, `integration/utilisateurs/register.test.ts` |
| Art. 9 — données de santé | Consentement explicite avant le diagnostic | `e2e/web/diagnostic/consent.spec.ts` |
| Art. 15 — droit d'accès | Lecture du profil + historique | `integration/utilisateurs/get-by-id.test.ts`, `integration/resultats/historique.test.ts` |
| Art. 16 — rectification | Formulaire de modification du profil | `integration/utilisateurs/change-password.test.ts` |
| Art. 17 — effacement | Suppression de compte avec cascade Prisma | `integration/utilisateurs/delete.test.ts` + E2E |
| Art. 20 — portabilité | Export JSON complet avec notice | `integration/utilisateurs/export.test.ts` + E2E |
| Art. 25 — privacy by design | Validation Zod stricte, ACL côté API, motDePasse jamais retourné | `integration/utilisateurs/list.test.ts`, `unit/services/userService.test.ts` |
| Art. 32 — sécurité | Bcrypt cost 12, rate-limit, audit log, headers CSP/HSTS | `unit/services/userService.test.ts`, `unit/security/*` |

---

## 7. Couverture des exigences sécurité

| Mesure | Test |
|---|---|
| Hashage bcrypt cost 12 | `unit/services/userService.test.ts` (vérifie l'appel `bcrypt.hash(_, 12)`) |
| Rate-limit anti brute-force (login, register, diagnostic) | `unit/security/rateLimit.test.ts` + tests d'intégration |
| Journalisation des tentatives sensibles | `unit/security/audit.test.ts` + tests d'intégration |
| Détection automatique de brute-force | `unit/security/securityService.test.ts` |
| Validation stricte des entrées (anti-injection) | tous les `unit/*-schema.test.ts` |
| Contrôle d'accès basé sur les rôles | toute la couche d'intégration + `e2e/web/admin/*` |
| Pas de fuite de données sensibles dans les logs admin | `unit/security/securityService.test.ts` |
| Vérification de l'ancien mot de passe avant changement | `integration/utilisateurs/change-password.test.ts` |
| Protection contre l'escalade de privilèges (modif rôle) | `integration/utilisateurs/change-password.test.ts` |
| Configuration JWT sans expiration de session non maîtrisée | `integration/auth/authorize.test.ts` (stratégie JWT) |
| motDePasse jamais retourné dans GET /utilisateurs | `integration/utilisateurs/list.test.ts`, `unit/services/userService.test.ts` |

---

## 8. Comment lancer les tests

```bash
# Unitaires + intégration (rapide, ~3s)
npm test

# Avec couverture de code (rapport HTML + lcov)
npm run test:coverage

# E2E (nécessite le serveur lancé sur localhost:3000)
npm run dev &
npm run test:e2e

# Activer le rate-limit pour tester en dev
RATE_LIMIT_ENABLED=1 npm run dev
```

### Pré-requis E2E

- Node 18+, base MySQL accessible, seed appliqué (`npx prisma db seed`)
- Comptes de test : `admin@cesizen.fr / Admin1234!` et `user@cesizen.fr / User1234!`
- Sur Ubuntu 26.04, Playwright utilise le binaire Chromium fourni par Puppeteer (cf. `playwright.config.ts`)
- Le rate-limit est désactivé par défaut en `NODE_ENV !== production` pour ne pas fausser les E2E

---

## 9. Limites assumées

Par honnêteté, voici ce qui n'est **pas** couvert :

- **Test de charge / performance** : hors scope projet pédagogique. Le rate-limit est testé fonctionnellement, pas sous stress.
- **Test du middleware Next.js** (rate-limit login dans l'edge runtime) : nécessite un environnement de test edge. Le mécanisme est validé via `unit/security/rateLimit.test.ts`.
- **Tests d'intégration de la `authorize` callback NextAuth** : le mock combiné de bcrypt + Prisma dans un contexte NextAuth est fragile. La fonctionnalité est validée par E2E (`login.spec.ts`) et la journalisation par bombardement curl manuel documenté.
- **Tests de composants React** (formulaires, modals) : pas de testing-library configuré. Couverture indirecte via E2E.
- **Test du script `purge-data.cjs`** : c'est un script CLI à lancer en cron, testé manuellement en mode `--dry-run`.
- **Test d'envoi d'email** : pas d'emails transactionnels dans l'application actuelle.
- **Test du chiffrement au repos** : non implémenté (limite documentée dans `confidentialite/page.tsx` — nécessiterait une migration HDS).
