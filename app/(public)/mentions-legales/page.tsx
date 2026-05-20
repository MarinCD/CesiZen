import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mentions légales — CESIZen",
  description: "Mentions légales et informations éditeur de CESIZen.",
}

export default function MentionsLegalesPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-10 prose prose-sm prose-headings:text-gray-900 prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-8 prose-p:text-muted-foreground">
      <h1>Mentions légales</h1>

      <h2>Éditeur</h2>
      <p>
        CESIZen — projet pédagogique réalisé dans le cadre du cursus CESI (Concepteur
        Développeur d'Applications).
      </p>

      <h2>Directeur de la publication</h2>
      <p>Marin Coc — étudiant CESI.</p>

      <h2>Contact</h2>
      <p>
        E-mail : <a href="mailto:marin.coc22@gmail.com">marin.coc22@gmail.com</a>
      </p>

      <h2>Hébergeur</h2>
      <p>
        AlwaysData SAS — 91 rue du Faubourg Saint-Honoré, 75008 Paris, France —{" "}
        <a href="https://www.alwaysdata.com" target="_blank" rel="noopener noreferrer">
          www.alwaysdata.com
        </a>
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L'ensemble des contenus présents sur ce site (textes, logos, images, code source) est
        protégé par le droit d'auteur. Toute reproduction non autorisée est interdite.
      </p>

      <h2>Avertissement médical</h2>
      <p>
        Les diagnostics proposés sont des outils d'auto-évaluation à visée informative. Ils ne
        constituent en aucun cas un diagnostic médical et ne remplacent pas l'avis d'un
        professionnel de santé.
      </p>
    </article>
  )
}
