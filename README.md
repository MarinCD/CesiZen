# CESIZen — L'application de votre santé mentale

Projet réalisé dans le cadre du Bachelor CDA (Concepteur Développeur d'Applications) au CESI, simulant une commande du **Ministère de la Santé et de la Prévention**.

CESIZen est une plateforme web de santé mentale permettant aux utilisateurs d'évaluer leur niveau de stress, de pratiquer des exercices de respiration et de suivre leurs émotions au quotidien.

---

## Fonctionnalités

| Module | Fonctionnalité | Accès |
|--------|---------------|-------|
| **Informations** | Consultation d'articles sur la santé mentale | Public |
| **Diagnostics** | Questionnaire de stress basé sur l'échelle de Holmes & Rahe | Public |
| **Diagnostics** | Historique et évolution du score de stress | Connecté |
| **Exercices** | Exercices de respiration et cohérence cardiaque | Public |
| **Tracker** | Journal d'émotions avec graphique d'évolution | Connecté |
| **Compte** | Inscription, connexion, gestion du profil | Connecté |
| **Admin** | Gestion des articles, questionnaires et utilisateurs | Administrateur |

---

## Stack technique

- **Framework** : [Next.js 14](https://nextjs.org/) (App Router) — TypeScript
- **Base de données** : MySQL via [Prisma ORM](https://www.prisma.io/)
- **Authentification** : [NextAuth.js](https://next-auth.js.org/) (JWT + sessions)
- **UI** : [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
- **Graphiques** : [Recharts](https://recharts.org/)
- **Validation** : [Zod](https://zod.dev/)

---

## Prérequis

- [Node.js](https://nodejs.org/) >= 18
- [MySQL](https://www.mysql.com/) >= 8
- npm >= 9

---

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/MarinCD/CesiZen.git
cd CesiZen
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Crée un fichier `.env` à la racine du projet :

```env
# Base de données MySQL
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/cesizen"

# NextAuth — clé secrète (générer avec : openssl rand -base64 32)
NEXTAUTH_SECRET="ta_cle_secrete_ici"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Créer la base de données

```bash
# Appliquer le schéma Prisma
npx prisma migrate dev --name init

# (Optionnel) Insérer les données de démonstration
npx prisma db seed
```

### 5. Lancer le serveur de développement

```bash
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## Structure du projet

```
CESIZen/
├── app/
│   ├── (auth)/          # Pages login et inscription
│   ├── (dashboard)/     # Pages utilisateur connecté (profil, tracker, historique)
│   ├── (public)/        # Pages publiques (accueil, informations, diagnostic, exercices)
│   ├── admin/           # Interface d'administration
│   └── api/             # Routes API REST (NextAuth, diagnostics, informations, tracker…)
├── components/          # Composants React réutilisables
├── lib/
│   ├── services/        # Logique métier (diagnosticService, userService…)
│   └── validations/     # Schémas Zod
├── prisma/
│   ├── schema.prisma    # Modèle de données
│   └── seed.ts          # Données initiales
└── types/               # Types TypeScript globaux
```

---

## Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| **Visiteur** | Pages publiques, diagnostic, exercices |
| **Utilisateur** | + Profil, tracker d'émotions, historique des diagnostics |
| **Administrateur** | + Gestion des articles, questionnaires et comptes |

---

## Suivi du projet

Les tâches sont suivies via **GitHub Issues** organisées en milestones correspondant aux phases du cahier des charges :

- [Voir les issues](https://github.com/MarinCD/CesiZen/issues)
- [Voir le tableau de bord projet](https://github.com/users/MarinCD/projects/2)

---

## Auteur

**Marin Cadro** — Bachelor CDA CESI  
Projet simulé pour le Ministère de la Santé et de la Prévention
