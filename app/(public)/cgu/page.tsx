import { Metadata } from "next"
import { LegalPage } from "@/components/legal/LegalPage"

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — CESIZen",
  description: "Conditions générales d'utilisation de la plateforme CESIZen.",
}

export default function CguPage() {
  return (
    <LegalPage
      title="Conditions générales d'utilisation"
      updatedAt="18 août 2026"
      description="Ces conditions définissent les règles d'utilisation de CESIZen et les limites du service proposé dans le cadre de ce projet pédagogique."
    >
      <h2>1. Objet</h2>
      <p>
        Les présentes CGU régissent l'utilisation de la plateforme CESIZen, dédiée à la
        sensibilisation à la santé mentale et au bien-être.
      </p>

      <h2>2. Accès au service</h2>
      <p>
        L'accès aux articles et au questionnaire est libre. La gestion du profil et la consultation
        d'un historique, lorsqu'il est disponible, nécessitent un compte. L'utilisateur s'engage à
        fournir des informations exactes lors de son inscription.
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
    </LegalPage>
  )
}
