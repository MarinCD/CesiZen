import Link from "next/link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mentions légales — CESIZen",
  description: "Informations relatives à l'édition et à l'hébergement de CESIZen.",
}

export default function MentionsLegalesPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-10 prose prose-sm prose-headings:text-gray-900 prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-8 prose-p:text-muted-foreground prose-li:text-muted-foreground">
      <h1>Mentions légales</h1>
      <p className="text-sm">Dernière mise à jour : 18 août 2026</p>

      <h2>1. Édition du site</h2>
      <p>
        CESIZen est un projet pédagogique édité à titre non professionnel par Marin Cadro dans le
        cadre de la formation Concepteur développeur d'applications de CESI.
      </p>
      <p>
        CESIZen n'est pas un service officiel de CESI, du ministère chargé de la Santé ou d'un
        organisme de soins. Les références à ces organismes décrivent uniquement le contexte du
        sujet pédagogique.
      </p>

      <h2>2. Directeur de la publication</h2>
      <p>Marin Cadro.</p>

      <h2>3. Contact</h2>
      <p>
        Pour toute question, demande relative à vos données ou signalement de contenu, vous pouvez
        écrire à <a href="mailto:marin.coc22@gmail.com">marin.coc22@gmail.com</a>.
      </p>

      <h2>4. Hébergement et prestataires techniques</h2>
      <p>
        L'application de recette est déployée sur un serveur VPS administré par l'éditeur avec
        Dokploy. Cloudflare fournit la gestion DNS et la protection du point d'entrée.
      </p>
      <p>
        La base de données est hébergée par alwaysdata, SARL au capital de 200 000 euros,
        immatriculée au RCS de Paris sous le numéro 492 893 490, dont le siège social est situé au
        91 rue du Faubourg Saint-Honoré, 75008 Paris, France. Téléphone : +33 1 84 16 23 49.
      </p>
      <p>
        Site :{" "}
        <a href="https://www.alwaysdata.com" target="_blank" rel="noopener noreferrer">
          www.alwaysdata.com
        </a>
      </p>

      <h2>5. Propriété intellectuelle</h2>
      <p>
        Sauf mention contraire, la structure de l'application, son code et les contenus créés pour
        CESIZen sont protégés par le droit de la propriété intellectuelle. Les marques, ressources
        et contenus provenant de tiers restent la propriété de leurs titulaires respectifs.
      </p>
      <p>
        Toute réutilisation dépassant la consultation du service nécessite l'autorisation du
        titulaire des droits concerné.
      </p>

      <h2>6. Limitation médicale</h2>
      <p>
        Le questionnaire de stress est un outil d'information et d'auto-évaluation. Son résultat
        est indicatif. Il ne constitue pas un diagnostic médical et ne remplace pas l'avis d'un
        professionnel de santé.
      </p>

      <h2>7. Données personnelles</h2>
      <p>
        Les traitements de données, leurs finalités, leurs durées de conservation et les modalités
        d'exercice des droits sont présentés dans la{" "}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
    </article>
  )
}
