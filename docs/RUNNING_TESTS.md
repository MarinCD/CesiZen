# Comment lancer les tests — CESIZen

Toutes les commandes sont à exécuter depuis la racine du projet.

## Pré-requis

```bash
# Si tu utilises nvm
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh"

# Dépendances installées
npm install
```

Pour les tests E2E uniquement :
- Base MySQL accessible (`.env` configuré avec `DATABASE_URL`)
- Seed appliqué : `npx prisma db seed`
- Comptes de test présents en base : `admin@cesizen.fr / Admin1234!` et `user@cesizen.fr / User1234!`

---

## Tests unitaires + intégration (Vitest)

Rapide, ~3 s. Tourne sans serveur ni base réelle (tout est mocké).

```bash
npm test                  # tout, une fois
npm run test:watch        # mode watch (relance auto au save)
npm run test:coverage     # rapport de couverture (texte + lcov HTML)
```

### Lancer un seul fichier ou un seul test
```bash
# Un fichier précis
npx vitest run tests/integration/utilisateurs/export.test.ts

# Filtrer par nom de test (regex sur le nom de l'it/describe)
npx vitest run -t "ancien mdp"

# Tous les tests d'un dossier
npx vitest run tests/unit/security
```

### Voir le rapport HTML de couverture
```bash
npm run test:coverage
# puis ouvrir coverage/index.html dans le navigateur
```

---

## Tests end-to-end (Playwright)

Nécessitent le serveur Next.js en marche.

```bash
# 1. Dans un terminal, lancer le serveur
npm run dev

# 2. Dans un autre terminal, lancer les E2E
npm run test:e2e          # tous les E2E (mode headless)
npm run test:e2e:ui       # interface graphique Playwright (debug interactif)
```

### Lancer un seul fichier E2E
```bash
npx playwright test e2e/web/profil/change-password.spec.ts
```

### Voir le rapport HTML après un run
```bash
npx playwright show-report
```

### Cas Ubuntu 26.04
Playwright n'a pas de binaire officiel pour cette version. Le projet utilise le Chrome fourni par Puppeteer (cf. `playwright.config.ts`). Si tu changes de machine, vérifie que le chemin `executablePath` pointe vers un Chrome valide.

---

## Tester le rate-limit en dev

Par défaut, le rate-limit est **désactivé en `NODE_ENV !== production`** pour ne pas faire échouer les E2E (toutes les requêtes viennent de `localhost`). Pour le tester réellement :

```bash
RATE_LIMIT_ENABLED=1 npm run dev
```

Puis bombarder une route (ex : inscription) pour observer les `429` :

```bash
for i in {1..10}; do
  curl -s -o /dev/null -w "%{http_code} " \
    -X POST http://localhost:3000/api/utilisateurs \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: 1.2.3.4" \
    -d '{"nom":"X","prenom":"Y","email":"a'$i'@b.fr","motDePasse":"Aa1!aaaaaa","consentementRGPD":true}'
done
echo
```

Attendu : 5×201, puis 5×429.

---

## Résumé des scripts npm

| Commande | Action |
|---|---|
| `npm test` | Vitest une seule fois |
| `npm run test:watch` | Vitest en mode watch |
| `npm run test:coverage` | Vitest + rapport de couverture |
| `npm run test:e2e` | Playwright headless |
| `npm run test:e2e:ui` | Playwright interface graphique |

Pour comprendre ce qui est testé et pourquoi, voir [`TESTING.md`](./TESTING.md).
