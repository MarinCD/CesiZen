# Durcissement de sécurité — août 2026

## Mesures appliquées

- Next.js 16.3.0, React 19.2.8 et NextAuth 4.24.15 remplacent les versions signalées par `npm audit`.
- Le rate-limit de production est partagé via MySQL et n'enregistre qu'un HMAC de l'IP.
- Les adresses IP et comptes présents dans les audits sont pseudonymisés avant écriture.
- Les scores de diagnostic ne sont plus copiés dans les journaux techniques.
- La CSP de production utilise un nonce neuf par requête et interdit `unsafe-inline`/`eval` pour les scripts.
- Le middleware refuse les requêtes API mutatives provenant d'une origine différente.
- Les questions soumises sont uniques et doivent appartenir au questionnaire du diagnostic.
- Le build n'effectue plus de téléchargement Google Fonts.
- La purge des comptes utilise la dernière connexion réussie, pas la date de création.

## Limite HDS

Alwaysdata n'est pas présenté comme un hébergeur certifié HDS pour ce projet pédagogique. En
production, l'historisation des résultats est donc désactivée tant que
`HDS_COMPLIANT_STORAGE=1` n'a pas été positionné après validation contractuelle et technique
de l'hébergement. Le calcul anonyme reste disponible sans conservation du résultat.

Cette variable est une barrière opérationnelle, pas une preuve de conformité. Avant activation,
il faut conserver le certificat HDS, le contrat de sous-traitance, la localisation des données,
les durées de conservation, la procédure d'incident et le résultat d'un test de restauration.
