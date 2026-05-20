import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Politique de confidentialité — CESIZen",
  description: "Politique de protection des données personnelles de CESIZen.",
}

export default function ConfidentialitePage() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-10 prose prose-sm prose-headings:text-gray-900 prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-8 prose-p:text-muted-foreground">
      <h1>Politique de confidentialité</h1>
      <p className="text-sm">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>

      <h2>1. Responsable du traitement</h2>
      <p>
        CESIZen est édité dans le cadre d'un projet pédagogique CESI. Pour toute question relative
        à vos données personnelles, contactez le responsable du traitement à l'adresse indiquée
        dans les mentions légales.
      </p>

      <h2>2. Données collectées</h2>
      <ul>
        <li><strong>Identité :</strong> nom, prénom, adresse e-mail.</li>
        <li><strong>Authentification :</strong> mot de passe (stocké chiffré avec bcrypt).</li>
        <li>
          <strong>Données de santé (article 9 du RGPD) :</strong> résultats des auto-diagnostics
          de stress (score, interprétation, date). Ces données sont sensibles et bénéficient
          d'une protection renforcée.
        </li>
        <li><strong>Données de connexion :</strong> adresse IP, date d'accès (journal d'audit).</li>
      </ul>

      <h2>3. Finalités et base légale</h2>
      <ul>
        <li>Création et gestion du compte utilisateur — <em>exécution contractuelle</em>.</li>
        <li>Réalisation et historisation des diagnostics — <em>consentement explicite</em>.</li>
        <li>Sécurité et prévention des fraudes — <em>intérêt légitime</em>.</li>
        <li>Respect des obligations légales (conservation des journaux) — <em>obligation légale</em>.</li>
      </ul>

      <h2>4. Durée de conservation</h2>
      <ul>
        <li>Compte utilisateur : jusqu'à suppression par l'utilisateur ou inactivité &gt; 3 ans.</li>
        <li>Résultats de diagnostic : 24 mois après la dernière utilisation.</li>
        <li>Journaux d'audit : 12 mois.</li>
      </ul>

      <h2>5. Destinataires</h2>
      <p>
        Vos données ne sont communiquées à aucun tiers commercial. Elles sont accessibles
        uniquement à vous-même et, pour les besoins de l'exploitation, aux administrateurs
        techniques de la plateforme. L'hébergement est assuré par AlwaysData (France).
      </p>
      <p>
        <strong>Avertissement :</strong> dans le cadre de ce projet pédagogique, l'hébergement
        n'est pas certifié HDS (Hébergeur de Données de Santé). Pour une mise en production
        réelle, une migration vers un hébergeur HDS est requise.
      </p>

      <h2>6. Vos droits</h2>
      <p>Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants :</p>
      <ul>
        <li><strong>Accès</strong> : consulter les données vous concernant via votre profil.</li>
        <li><strong>Rectification</strong> : modifier vos informations sur la page « Mon profil ».</li>
        <li>
          <strong>Effacement</strong> (« droit à l'oubli ») : bouton « Supprimer mon compte »
          sur votre profil. La suppression est immédiate et irréversible.
        </li>
        <li>
          <strong>Portabilité</strong> : bouton « Exporter mes données » sur votre profil
          (export JSON).
        </li>
        <li>
          <strong>Opposition / limitation</strong> : contactez-nous via les mentions légales.
        </li>
        <li>
          <strong>Réclamation</strong> auprès de la CNIL (
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>).
        </li>
      </ul>

      <h2>7. Sécurité</h2>
      <ul>
        <li>Mots de passe hashés (bcrypt).</li>
        <li>Communication chiffrée (HTTPS) en production.</li>
        <li>En-têtes HTTP de sécurité (CSP, HSTS, X-Frame-Options…).</li>
        <li>Journalisation des accès aux données sensibles.</li>
        <li>Limitation du nombre de tentatives de connexion.</li>
      </ul>

      <h2>8. Cookies</h2>
      <p>
        Le site utilise uniquement des cookies strictement nécessaires à son fonctionnement
        (session d'authentification). Aucun cookie publicitaire ou de mesure d'audience tierce
        n'est déposé.
      </p>
    </article>
  )
}
