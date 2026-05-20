import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — CESIZen",
  description: "Conditions générales d'utilisation de la plateforme CESIZen.",
}

export default function CguPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-10 prose prose-sm prose-headings:text-gray-900 prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-8 prose-p:text-muted-foreground">
      <h1>Conditions générales d'utilisation</h1>

      <h2>1. Objet</h2>
      <p>
        Les présentes CGU régissent l'utilisation de la plateforme CESIZen, dédiée à la
        sensibilisation à la santé mentale et au bien-être.
      </p>

      <h2>2. Accès au service</h2>
      <p>
        L'accès aux articles d'information est libre. La réalisation des diagnostics et la
        consultation de l'historique nécessitent la création d'un compte. L'utilisateur
        s'engage à fournir des informations exactes.
      </p>

      <h2>3. Caractère informatif des diagnostics</h2>
      <p>
        Les outils d'auto-diagnostic proposés ne constituent pas un acte médical. Ils ne se
        substituent pas à une consultation auprès d'un professionnel de santé. En cas de
        détresse, contactez le 3114 (numéro national de prévention du suicide) ou consultez un
        médecin.
      </p>

      <h2>4. Comportement de l'utilisateur</h2>
      <ul>
        <li>Ne pas tenter d'accéder à des comptes tiers.</li>
        <li>Ne pas publier de contenu illicite, diffamatoire ou portant atteinte à autrui.</li>
        <li>Ne pas perturber le fonctionnement du service.</li>
      </ul>

      <h2>5. Responsabilité</h2>
      <p>
        CESIZen est fourni « en l'état » dans le cadre d'un projet pédagogique. L'éditeur ne
        saurait être tenu responsable d'un dommage direct ou indirect résultant de
        l'utilisation du service.
      </p>

      <h2>6. Suspension et résiliation</h2>
      <p>
        L'utilisateur peut supprimer son compte à tout moment depuis la page « Mon profil ».
        L'éditeur se réserve le droit de suspendre un compte en cas de manquement aux présentes
        CGU.
      </p>

      <h2>7. Modifications</h2>
      <p>
        Les présentes CGU peuvent être modifiées. La version applicable est celle en vigueur à
        la date d'utilisation du service.
      </p>
    </article>
  )
}
