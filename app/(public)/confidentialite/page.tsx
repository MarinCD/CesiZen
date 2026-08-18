import Link from "next/link"
import { Metadata } from "next"
import { LegalPage } from "@/components/legal/LegalPage"

export const metadata: Metadata = {
  title: "Politique de confidentialité — CESIZen",
  description: "Informations sur l'utilisation et la protection des données dans CESIZen.",
}

export default function ConfidentialitePage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      updatedAt="18 août 2026"
      description="Cette politique explique quelles données sont utilisées par CESIZen, pourquoi elles le sont et comment exercer vos droits. Elle concerne l'environnement de recette du projet pédagogique."
    >
      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement est Marin Cadro, éditeur non professionnel de CESIZen. Pour
        toute question ou demande concernant vos données, écrivez à{" "}
        <a href="mailto:marin.coc22@gmail.com">marin.coc22@gmail.com</a>.
      </p>

      <h2>2. Données utilisées</h2>
      <div className="legal-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Catégorie</th>
              <th>Données concernées</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Compte</td>
              <td>Nom, prénom, adresse e-mail, rôle, dates de création et de dernière activité.</td>
            </tr>
            <tr>
              <td>Authentification</td>
              <td>Mot de passe haché, informations de session et date de changement du mot de passe.</td>
            </tr>
            <tr>
              <td>Questionnaire</td>
              <td>
                Réponses transmises pour calculer le score. Elles ne sont pas enregistrées telles
                quelles. Lorsque l'historique est activé, seuls le score, l'interprétation, la date
                et le diagnostic concerné sont associés au compte.
              </td>
            </tr>
            <tr>
              <td>Sécurité</td>
              <td>
                Actions réalisées, horodatages, identifiants de comptes concernés et références
                pseudonymisées des adresses IP.
              </td>
            </tr>
            <tr>
              <td>Préférences locales</td>
              <td>
                Réglages d'accessibilité et mémorisation de la fermeture du message d'information
                sur les cookies, enregistrés dans le navigateur.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>3. Finalités et bases légales</h2>
      <div className="legal-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Utilisation</th>
              <th>Objectif</th>
              <th>Base légale</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Compte et authentification</td>
              <td>Créer le compte, permettre la connexion et gérer le profil.</td>
              <td>Exécution du service demandé.</td>
            </tr>
            <tr>
              <td>Questionnaire de stress</td>
              <td>Calculer un résultat indicatif et, si la fonction est disponible, l'ajouter à l'historique.</td>
              <td>Consentement explicite donné avant de commencer le questionnaire.</td>
            </tr>
            <tr>
              <td>Sécurité</td>
              <td>Protéger les comptes, limiter les tentatives abusives et rechercher les incidents.</td>
              <td>Intérêt légitime de l'éditeur à sécuriser le service.</td>
            </tr>
            <tr>
              <td>Demandes légales</td>
              <td>Répondre à une demande valable d'une autorité compétente.</td>
              <td>Obligation légale lorsqu'elle s'applique.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        CESIZen ne prend aucune décision produisant un effet juridique à partir du résultat du
        questionnaire.
      </p>

      <h2>4. Caractère obligatoire des informations</h2>
      <p>
        Le nom, le prénom, l'adresse e-mail et le mot de passe sont nécessaires pour créer un
        compte. Sans ces informations, l'inscription ne peut pas aboutir. Le questionnaire reste
        facultatif et peut être utilisé sans compte. La création d'un compte n'impose pas de remplir
        le questionnaire.
      </p>

      <h2>5. Durées de conservation</h2>
      <ul>
        <li>Compte : jusqu'à sa suppression ou après trois ans d'inactivité.</li>
        <li>Résultats enregistrés dans l'historique : vingt-quatre mois.</li>
        <li>Journaux de sécurité : douze mois.</li>
        <li>Compteurs de limitation des tentatives : deux jours au maximum.</li>
        <li>Session de connexion : deux heures, avec renouvellement pendant l'utilisation.</li>
        <li>Préférences locales : jusqu'à leur réinitialisation ou à l'effacement des données du navigateur.</li>
      </ul>
      <p>
        Sur l'environnement de recette actuel, le résultat du questionnaire est calculé mais son
        enregistrement dans l'historique est désactivé.
      </p>

      <h2>6. Destinataires et prestataires</h2>
      <p>
        Les données sont accessibles à l'utilisateur concerné et, lorsque cela est nécessaire à
        l'administration ou à la sécurité, aux administrateurs autorisés de CESIZen.
      </p>
      <ul>
        <li>Le fournisseur du VPS assure l'infrastructure de l'application.</li>
        <li>alwaysdata héberge la base de données.</li>
        <li>Cloudflare fournit les services DNS et de protection réseau.</li>
      </ul>
      <p>
        CESIZen ne vend pas les données et ne les utilise pas à des fins publicitaires. Elles peuvent
        être communiquées à une autorité uniquement lorsqu'une règle de droit l'impose. Les garanties
        contractuelles et les éventuels transferts internationaux dépendent des prestataires retenus
        pour l'environnement concerné.
      </p>

      <h2>7. Vos droits</h2>
      <p>Selon la situation, vous pouvez demander :</p>
      <ul>
        <li><strong>l'accès</strong> aux données vous concernant</li>
        <li><strong>la rectification</strong> d'informations inexactes</li>
        <li><strong>l'effacement</strong> de votre compte et des données associées</li>
        <li><strong>la limitation</strong> temporaire d'un traitement</li>
        <li><strong>l'opposition</strong> à un traitement fondé sur l'intérêt légitime</li>
        <li><strong>la portabilité</strong> des données que vous avez fournies</li>
        <li><strong>le retrait du consentement</strong> pour les traitements qui en dépendent</li>
      </ul>
      <p>
        Le profil permet de rectifier les informations, d'exporter les données au format JSON et de
        supprimer le compte. Une demande peut également être envoyée à{" "}
        <a href="mailto:marin.coc22@gmail.com">marin.coc22@gmail.com</a>. Une réponse sera apportée
        dans un délai maximal d'un mois, sauf prolongation autorisée par le RGPD.
      </p>
      <p>
        Vous pouvez introduire une réclamation auprès de la{" "}
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
          Commission nationale de l'informatique et des libertés (CNIL)
        </a>.
      </p>

      <h2>8. Sécurité</h2>
      <p>CESIZen applique notamment les mesures suivantes :</p>
      <ul>
        <li>hachage des mots de passe avec bcrypt</li>
        <li>communications HTTPS sur l'environnement publié</li>
        <li>contrôles d'accès selon le compte et le rôle</li>
        <li>limitation des tentatives de connexion et des appels sensibles</li>
        <li>journalisation avec pseudonymisation des références réseau</li>
        <li>sauvegardes, mises à jour et contrôles automatisés du code</li>
      </ul>
      <p>
        Aucune mesure ne supprime totalement les risques. En cas d'incident confirmé, les personnes
        concernées seront informées lorsque la réglementation l'exige.
      </p>

      <h2>9. Cookies et stockage local</h2>
      <p>
        CESIZen utilise uniquement un cookie de session nécessaire à l'authentification. Les réglages
        d'accessibilité et la fermeture du message d'information sont mémorisés dans le stockage local
        du navigateur. Aucun traceur publicitaire ni outil tiers de mesure d'audience n'est utilisé.
      </p>
      <p>
        Ces éléments sont nécessaires au service ou enregistrés à la demande de l'utilisateur. Ils ne
        nécessitent donc pas de consentement préalable. Ils peuvent être supprimés depuis les réglages
        du navigateur.
      </p>

      <h2>10. Évolution de la politique</h2>
      <p>
        Cette politique peut être mise à jour pour suivre les évolutions de CESIZen. La date affichée
        en haut de la page permet d'identifier la version applicable. Une modification importante sera
        signalée dans l'application.
      </p>

      <p>
        Pour identifier l'éditeur et les prestataires techniques, consultez les{" "}
        <Link href="/mentions-legales">mentions légales</Link>.
      </p>
    </LegalPage>
  )
}
