# Durcissement de sécurité — août 2026

## Second passage (audit du 13 août 2026)

### Secrets
- `NEXTAUTH_SECRET` est soumis au même contrôle que les clés HMAC : `lib/env.ts` refuse le
  démarrage en production sur une valeur courte, devinable (nom du projet, `change-me`,
  valeur de CI) ou pauvre en entropie. Le contrôle est levé pendant `next build`, où les
  secrets d'exécution ne sont pas encore injectés.
- `npm run security:configure-env -- --rotate` génère et remplace les valeurs faibles sans
  jamais les afficher. La CI génère des secrets jetables à chaque exécution.
- Toute rotation invalide les sessions en cours : c'est le comportement attendu.

### Identification du client
- L'IP est lue sur `CF-Connecting-IP`, sinon sur le saut de confiance de `X-Forwarded-For`
  désigné par `TRUSTED_PROXY_HOPS`. La première valeur de l'en-tête est fournie par le
  client : la lire offrait un compteur de rate-limit neuf à chaque requête et permettait
  d'empoisonner les alertes brute-force du back-office.
- La connexion est limitée par IP (10/min) **et** par compte (10/15 min) : le compteur par
  compte reste efficace face à un brute-force distribué.
- Le compteur persistant insère avant de compter ; l'ordre inverse laissait passer toutes
  les requêtes concurrentes émises avant la première écriture.

### Sessions
- Durée de vie ramenée à 2 h avec glissement toutes les 15 min.
- Le jeton est revalidé en base au maximum toutes les 5 min : rôle rafraîchi, compte
  supprimé révoqué, jeton antérieur à un changement de mot de passe révoqué
  (`utilisateur.motDePasseModifieLe`). Un jeton révoqué produit une session vide, donc un
  `getServerSession()` à `null`.

### Traçabilité
- Modification de compte, changement de rôle, suppression de compte et opérations sur les
  contenus sont journalisés (`USER_UPDATED`, `USER_ROLE_CHANGED`, `USER_DELETED`,
  `CONTENT_*`) et affichés dans le back-office Cybersécurité. Les métadonnées ne portent que
  la nature de l'action, jamais les valeurs saisies.

### Divers
- Les journaux Prisma passent à `error`/`warn` en production : le niveau `query` déversait
  emails et écritures de résultats dans les logs applicatifs.
- Les paramètres d'URL sont validés (`lib/validations/params.ts`) : un identifiant ou une
  page non numérique renvoie 400 au lieu de provoquer une erreur Prisma en 500.
- Un changement d'adresse email sur son propre compte exige le mot de passe actuel.
- `/api/questionnaires` n'expose plus l'identité des créateurs aux visiteurs anonymes.
- `X-XSS-Protection` passe à `0` : l'auditeur legacy est obsolète, la CSP à nonce protège.
- Conflit d'email en modification : 409 au lieu de 500.

### Reste à traiter hors du code
- Renouveler `NEXTAUTH_SECRET` dans les variables d'environnement Dokploy, puis laisser la
  commande de déploiement appliquer `npx prisma migrate deploy` pour la colonne
  `motDePasseModifieLe`.
- Restreindre l'origine aux plages Cloudflare : si l'IP du serveur reste joignable en
  direct, la protection du CDN se contourne.
- Aucun flux de réinitialisation de mot de passe : un utilisateur ayant perdu le sien dépend
  d'un administrateur. Nécessite un service d'envoi d'email avant d'être implémenté.

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
