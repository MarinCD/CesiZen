import { PrismaClient, Role } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Comptes
  const admin = await prisma.utilisateur.upsert({
    where: { email: "admin@cesizen.fr" },
    update: {},
    create: {
      nom: "Admin",
      prenom: "CESIZen",
      email: "admin@cesizen.fr",
      motDePasse: await bcrypt.hash("Admin1234!", 12),
      role: Role.ADMINISTRATEUR,
      consentementRGPD: true,
    },
  })

  const user = await prisma.utilisateur.upsert({
    where: { email: "user@cesizen.fr" },
    update: {},
    create: {
      nom: "Dupont",
      prenom: "Jean",
      email: "user@cesizen.fr",
      motDePasse: await bcrypt.hash("User1234!", 12),
      role: Role.UTILISATEUR,
      consentementRGPD: true,
    },
  })

  // Questionnaire Holmes & Rahe
  const questionnaire = await prisma.questionnaire.create({
    data: {
      titre: "Échelle de Holmes et Rahe",
      description: "Évaluez votre niveau de stress en cochant les événements vécus ces 24 derniers mois.",
      idCreateur: admin.id,
      questions: {
        create: [
          { texte: "Décès du conjoint", pointsAssocies: 100 },
          { texte: "Divorce", pointsAssocies: 73 },
          { texte: "Séparation conjugale", pointsAssocies: 65 },
          { texte: "Emprisonnement", pointsAssocies: 63 },
          { texte: "Décès d'un proche de la famille", pointsAssocies: 63 },
          { texte: "Blessure ou maladie personnelle", pointsAssocies: 53 },
          { texte: "Mariage", pointsAssocies: 50 },
          { texte: "Licenciement", pointsAssocies: 47 },
          { texte: "Réconciliation conjugale", pointsAssocies: 45 },
          { texte: "Retraite", pointsAssocies: 45 },
          { texte: "Changement de santé d'un membre de la famille", pointsAssocies: 44 },
          { texte: "Grossesse", pointsAssocies: 40 },
          { texte: "Difficultés sexuelles", pointsAssocies: 39 },
          { texte: "Arrivée d'un nouveau membre dans la famille", pointsAssocies: 39 },
          { texte: "Réajustement professionnel majeur", pointsAssocies: 39 },
          { texte: "Changement important dans la situation financière", pointsAssocies: 38 },
          { texte: "Décès d'un ami proche", pointsAssocies: 37 },
          { texte: "Changement d'emploi", pointsAssocies: 36 },
          { texte: "Changement important dans les disputes conjugales", pointsAssocies: 35 },
          { texte: "Emprunt ou crédit important", pointsAssocies: 31 },
          { texte: "Saisie hypothécaire ou prêt", pointsAssocies: 30 },
          { texte: "Changement de responsabilités professionnelles", pointsAssocies: 29 },
          { texte: "Départ d'un enfant du foyer", pointsAssocies: 29 },
          { texte: "Problèmes avec la belle-famille", pointsAssocies: 29 },
          { texte: "Succès personnel exceptionnel", pointsAssocies: 28 },
          { texte: "Conjoint commence ou arrête de travailler", pointsAssocies: 26 },
          { texte: "Début ou fin de scolarité", pointsAssocies: 26 },
          { texte: "Changement de conditions de vie", pointsAssocies: 25 },
          { texte: "Changement des habitudes personnelles", pointsAssocies: 24 },
          { texte: "Difficultés avec son responsable", pointsAssocies: 23 },
          { texte: "Changement des heures ou conditions de travail", pointsAssocies: 20 },
          { texte: "Changement de résidence", pointsAssocies: 20 },
          { texte: "Changement d'établissement scolaire", pointsAssocies: 20 },
          { texte: "Changement dans les loisirs", pointsAssocies: 19 },
          { texte: "Changement dans les activités religieuses", pointsAssocies: 19 },
          { texte: "Changement dans les activités sociales", pointsAssocies: 18 },
          { texte: "Emprunt ou crédit mineur", pointsAssocies: 17 },
          { texte: "Changement des habitudes de sommeil", pointsAssocies: 16 },
          { texte: "Changement du nombre de réunions familiales", pointsAssocies: 15 },
          { texte: "Changement des habitudes alimentaires", pointsAssocies: 15 },
          { texte: "Vacances", pointsAssocies: 13 },
          { texte: "Noël ou fêtes de fin d'année", pointsAssocies: 12 },
          { texte: "Infraction mineure à la loi", pointsAssocies: 11 },
        ],
      },
    },
  })

  // Diagnostic lié au questionnaire
  await prisma.diagnostic.create({
    data: {
      nom: "Diagnostic de stress Holmes & Rahe",
      description: "Basé sur l'échelle de stress de Holmes et Rahe (1967).",
      questionnaireId: questionnaire.id,
    },
  })

  // Articles d'information
  await prisma.information.createMany({
    data: [
      {
        titre: "Comprendre le stress et ses effets sur la santé",
        texte: "Le stress est une réponse naturelle de l'organisme face à une situation perçue comme menaçante ou exigeante. À court terme, il peut être bénéfique car il mobilise nos ressources. Mais lorsqu'il devient chronique, il peut avoir des effets négatifs sur la santé physique et mentale. Les symptômes du stress chronique incluent : fatigue persistante, troubles du sommeil, irritabilité, difficultés de concentration, maux de tête et tensions musculaires. Des techniques comme la méditation, l'exercice physique et la respiration profonde peuvent aider à le gérer efficacement.",
        categorie: "Stress",
        datePublication: new Date(),
        idCreateur: admin.id,
      },
      {
        titre: "La cohérence cardiaque : guide pratique",
        texte: "La cohérence cardiaque est une technique de respiration qui permet de réguler le système nerveux autonome. En respirant à un rythme de 6 respirations par minute (5 secondes d'inspiration, 5 secondes d'expiration), on synchronise le cœur et le cerveau. Les bénéfices incluent : réduction du cortisol (hormone du stress), amélioration de la concentration, meilleure qualité de sommeil, et renforcement du système immunitaire. Pratiquer 3 fois par jour pendant 5 minutes suffit pour obtenir des résultats significatifs.",
        categorie: "Respiration",
        datePublication: new Date(),
        idCreateur: admin.id,
      },
      {
        titre: "Santé mentale au travail : reconnaître les signaux d'alerte",
        texte: "Les risques psychosociaux (RPS) au travail sont de plus en plus reconnus comme un enjeu majeur de santé publique. Fatigue chronique, irritabilité, difficultés de concentration, troubles du sommeil, sentiment d'être dépassé par les événements... ces signes méritent attention. Le burn-out, le bore-out et le brown-out sont trois formes d'épuisement professionnel aux mécanismes différents. En parler à un professionnel de santé ou à la médecine du travail est une démarche courageuse et salutaire.",
        categorie: "Travail",
        datePublication: new Date(),
        idCreateur: admin.id,
      },
      {
        titre: "Méditation pleine conscience : débuter facilement",
        texte: "La méditation de pleine conscience (mindfulness) consiste à porter intentionnellement son attention sur le moment présent, sans jugement. Même 10 minutes par jour peuvent réduire le stress et l'anxiété. Pour commencer : installez-vous confortablement, fermez les yeux, concentrez-vous sur votre respiration, et observez vos pensées sans vous y attacher. Des applications comme Petit Bambou ou Headspace peuvent vous accompagner dans cette pratique.",
        categorie: "Bien-être",
        datePublication: new Date(),
        idCreateur: admin.id,
      },
      {
        titre: "Sommeil et santé mentale : une relation essentielle",
        texte: "Le sommeil joue un rôle fondamental dans notre équilibre mental. Un manque de sommeil chronique augmente le risque de dépression, d'anxiété et de troubles cognitifs. Pour améliorer votre sommeil : maintenez des horaires réguliers, évitez les écrans 1h avant le coucher, créez une routine relaxante, et limitez la caféine après 14h. La chambre doit être fraîche, sombre et silencieuse. Si les troubles persistent, consultez un médecin.",
        categorie: "Bien-être",
        datePublication: new Date(),
        idCreateur: admin.id,
      },
    ],
  })

  console.log("Seed terminé avec succès")
  console.log("Admin : admin@cesizen.fr / Admin1234!")
  console.log("User  : user@cesizen.fr / User1234!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
