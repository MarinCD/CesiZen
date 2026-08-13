# Stratégie de branches — CESIZen

## Branches permanentes

- `develop` est la branche d’intégration. Les fonctionnalités, corrections et mises à jour
  documentaires y sont fusionnées après validation de la CI.
- `main` est la branche stable. Elle constitue la source de l’environnement de recette Dokploy
  publié sur `https://cesizen.optihent.fr`.

Les deux branches sont protégées sur GitHub : pull request et contrôle
`quality-security-build` obligatoires, historique linéaire, conversations résolues, suppression
et force-push interdits. Le projet étant individuel, aucune approbation d’un second compte n’est
exigée.

## Changement normal

```text
develop
   └── feature/nom-court ou fix/nom-court
          └── pull request + CI vers develop
                 └── recette
                        └── pull request + CI develop vers main
                               └── déploiement Dokploy
```

1. Mettre `develop` à jour et créer une branche courte.
2. Lier le changement à une issue et définir les critères d’acceptation.
3. Développer avec des commits de type `feat:`, `fix:`, `test:`, `docs:` ou `chore:`.
4. Ouvrir une pull request vers `develop` et corriger tout contrôle CI en échec.
5. Réaliser la recette sur l’état intégré.
6. Ouvrir une pull request de `develop` vers `main` avec risques, preuves et retour arrière.
7. Après fusion, vérifier le déploiement Dokploy et clôturer le ticket.

## Correctif urgent

Une branche `hotfix/nom-court` part exceptionnellement de `main`. Après validation et fusion vers
`main`, le même correctif est immédiatement reporté vers `develop` afin d’éviter toute régression
lors de la prochaine promotion.

## Versions

Les versions suivent SemVer (`vMAJEUR.MINEUR.CORRECTIF`). Une release indique le commit, les
changements, les migrations, les limites connues et la procédure de retour arrière. Les secrets,
sauvegardes et artefacts locaux ne sont jamais versionnés.
