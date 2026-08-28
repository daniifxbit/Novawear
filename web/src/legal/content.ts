/**
 * Legal texts.
 *
 * Inline markup understood by the renderer:
 *   **gras**       → emphasis
 *   [[à compléter]] → a placeholder the shop owner must fill in. Company
 *                     identifiers are never invented here: an unfilled field
 *                     shows up in gold on the page so it cannot ship unnoticed.
 */

export type Block =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'note'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'table'; head: string[]; rows: string[][] }

export interface Section {
  title: string
  blocks: Block[]
}

export interface LegalDoc {
  id: LegalDocId
  navLabel: string
  eyebrow: string
  title: string
  intro: string
  sections: Section[]
}

export type LegalDocId = 'cgv' | 'mentions' | 'confidentialite' | 'retractation'

const REVIEW_NOTE =
  'Ce texte est une base de travail rédigée pour ce site. Il doit être relu par un professionnel du droit ' +
  'avant la mise en ligne, et tous les champs en surbrillance doivent être renseignés.'

/* ------------------------------------------------------------- mentions */

const mentions: LegalDoc = {
  id: 'mentions',
  navLabel: 'Mentions légales',
  eyebrow: 'Informations légales',
  title: 'Mentions légales',
  intro: "Informations relatives à l'éditeur et à l'hébergeur du site NOVAWEAR.",
  sections: [
    {
      title: '1. Éditeur du site',
      blocks: [
        { type: 'note', text: REVIEW_NOTE },
        {
          type: 'table',
          head: ['Élément', 'Valeur'],
          rows: [
            ['Dénomination sociale', 'NOVAWEAR'],
            ['Forme juridique', '[[forme juridique — SAS, SARL, auto-entrepreneur…]]'],
            ['Capital social', '[[montant du capital]]'],
            ['Siège social', '[[adresse complète du siège]]'],
            ['RCS', '[[ville et numéro d’immatriculation]]'],
            ['SIRET', '[[numéro SIRET]]'],
            ['TVA intracommunautaire', '[[numéro de TVA, ou « non applicable, art. 293 B du CGI »]]'],
            ['Directeur de la publication', '[[nom et prénom]]'],
            ['Email', '[[adresse email de contact]]'],
            ['Téléphone', '[[numéro de téléphone]]'],
          ],
        },
        {
          type: 'p',
          text:
            "Si l'activité est exercée sous le régime de l'auto-entreprise, le capital social et le RCS ne " +
            "s'appliquent pas : il faut alors mentionner le numéro SIREN et, le cas échéant, la chambre de métiers " +
            'de rattachement.',
        },
      ],
    },
    {
      title: '2. Hébergeur',
      blocks: [
        {
          type: 'p',
          text:
            "L'article 6 de la loi pour la confiance dans l'économie numérique impose d'indiquer le nom, la " +
            "dénomination sociale, l'adresse et le numéro de téléphone de l'hébergeur du site.",
        },
        {
          type: 'table',
          head: ['Élément', 'Valeur'],
          rows: [
            ['Hébergeur', '[[nom de l’hébergeur]]'],
            ['Adresse', '[[adresse postale de l’hébergeur]]'],
            ['Téléphone', '[[téléphone de l’hébergeur]]'],
          ],
        },
      ],
    },
    {
      title: '3. Propriété intellectuelle',
      blocks: [
        {
          type: 'p',
          text:
            "La structure du site, sa charte graphique, ses textes et ses photographies sont la propriété de " +
            "NOVAWEAR ou font l'objet d'une autorisation d'usage. Toute reproduction ou représentation, totale ou " +
            'partielle, sans autorisation écrite préalable, est interdite.',
        },
        {
          type: 'p',
          text:
            "Les marques, logos et noms commerciaux des articles revendus restent la propriété de leurs " +
            "titulaires respectifs. NOVAWEAR revend des articles authentiques et n'est ni affilié à ces marques, " +
            'ni mandaté par elles.',
        },
      ],
    },
    {
      title: '4. Médiation de la consommation',
      blocks: [
        {
          type: 'p',
          text:
            "Tout professionnel vendant à des consommateurs en France doit adhérer à un dispositif de médiation " +
            'de la consommation et en communiquer les coordonnées.',
        },
        {
          type: 'table',
          head: ['Élément', 'Valeur'],
          rows: [
            ['Médiateur', '[[nom du médiateur de la consommation]]'],
            ['Adresse', '[[adresse du médiateur]]'],
            ['Site', '[[site web du médiateur]]'],
          ],
        },
        {
          type: 'p',
          text:
            "La plateforme européenne de règlement en ligne des litiges est accessible à l'adresse " +
            'ec.europa.eu/consumers/odr.',
        },
      ],
    },
  ],
}

/* ------------------------------------------------------------------ CGV */

const cgv: LegalDoc = {
  id: 'cgv',
  navLabel: 'CGV',
  eyebrow: 'Conditions de vente',
  title: 'Conditions générales de vente',
  intro:
    'Les présentes conditions régissent les ventes conclues sur le site NOVAWEAR entre la boutique et ses ' +
    'clients consommateurs, en France, en Belgique et en Suisse.',
  sections: [
    {
      title: 'Article 1 — Objet et champ d’application',
      blocks: [
        { type: 'note', text: REVIEW_NOTE },
        {
          type: 'p',
          text:
            "Les présentes conditions générales de vente s'appliquent à toute commande passée sur le site " +
            'NOVAWEAR. Elles sont accessibles à tout moment et prévalent sur toute autre condition. Le client ' +
            'reconnaît en avoir pris connaissance et les avoir acceptées avant de valider sa commande.',
        },
        {
          type: 'p',
          text:
            'Version en vigueur : [[date de mise en ligne]]. NOVAWEAR se réserve le droit de les modifier ; les ' +
            'conditions applicables sont celles en vigueur au jour de la commande.',
        },
      ],
    },
    {
      title: 'Article 2 — Produits',
      blocks: [
        {
          type: 'p',
          text:
            "NOVAWEAR revend des vêtements et des sneakers **sourcés à l'unité**. Chaque article est proposé en " +
            'un seul exemplaire, dans la taille indiquée sur sa fiche. Une pièce vendue disparaît du catalogue.',
        },
        {
          type: 'p',
          text:
            "Les photographies sont celles de l'article réellement mis en vente. Elles engagent le vendeur quant " +
            "à l'état du produit, sous réserve des variations d'affichage propres à chaque écran.",
        },
        {
          type: 'p',
          text:
            "L'état de chaque pièce est vérifié avant mise en ligne. [[Préciser ici si les articles sont neufs, " +
            'neufs sans étiquette ou de seconde main, et selon quelle grille d’état.]]',
        },
      ],
    },
    {
      title: 'Article 3 — Prix',
      blocks: [
        {
          type: 'p',
          text:
            'Les prix sont indiqués en euros, **toutes taxes comprises**, hors frais de livraison. Les frais de ' +
            'livraison sont calculés et affichés avant la validation de la commande.',
        },
        {
          type: 'p',
          text:
            "Les montants en francs suisses affichés sous les prix sont **purement indicatifs**, convertis à un " +
            'taux de référence de 1 € ≈ 0,94 CHF. Seul le montant en euros fait foi ; il est le seul montant à ' +
            'virer.',
        },
        {
          type: 'p',
          text:
            'Pour la Suisse, les droits de douane, la TVA à l’importation et les frais de dédouanement restent à ' +
            'la charge du client et ne sont pas inclus dans le prix affiché.',
        },
      ],
    },
    {
      title: 'Article 4 — Commande',
      blocks: [
        {
          type: 'p',
          text:
            'Le client sélectionne ses articles et leur taille, renseigne ses coordonnées de livraison, puis ' +
            'accède aux informations de paiement. Une **référence de commande** au format NW-AAAA-0000 lui est ' +
            'attribuée.',
        },
        {
          type: 'p',
          text:
            "La commande n'est **définitivement acceptée qu'après vérification du virement** par NOVAWEAR. Tant " +
            "que cette vérification n'a pas eu lieu, la commande est enregistrée au statut « en attente » et " +
            "l'article n'est pas réservé de façon irrévocable.",
        },
        {
          type: 'p',
          text:
            "Les articles étant en exemplaire unique, si la pièce n'est plus disponible entre la commande et la " +
            'vérification du paiement, la commande est rejetée et les sommes reçues sont intégralement restituées.',
        },
      ],
    },
    {
      title: 'Article 5 — Paiement par virement bancaire',
      blocks: [
        {
          type: 'p',
          text:
            'Le **virement bancaire est le seul moyen de paiement accepté**. Les coordonnées du compte ' +
            '(titulaire, IBAN, BIC) sont communiquées au client à l’étape de paiement et rappelées par email.',
        },
        {
          type: 'p',
          text:
            'Le client doit impérativement indiquer sa **référence de commande dans le libellé du virement**. ' +
            'À défaut, le paiement ne peut pas être rattaché à la commande et son traitement est retardé.',
        },
        {
          type: 'p',
          text:
            "Après avoir effectué le virement, le client dépose une preuve de paiement (capture d'écran ou PDF de " +
            "l'ordre de virement) et confirme sa commande. NOVAWEAR vérifie la réception effective des fonds, en " +
            'principe sous [[délai de vérification, ex. 24 à 72 heures ouvrées]].',
        },
        {
          type: 'p',
          text:
            "En cas de virement non reçu, de montant incorrect, de preuve illisible ou de référence absente, la " +
            'commande est rejetée. Le motif est communiqué au client par email et les sommes éventuellement ' +
            'reçues lui sont restituées sous [[délai de remboursement]].',
        },
      ],
    },
    {
      title: 'Article 6 — Conservation des fonds',
      blocks: [
        {
          type: 'note',
          text:
            'ARTICLE À TRANCHER AVANT MISE EN LIGNE. Le site annonce actuellement en page d’accueil que les fonds ' +
            'sont « bloqués en séquestre » jusqu’à la livraison. Sur un compte bancaire ordinaire, même dédié, les ' +
            'fonds reçus appartiennent juridiquement au vendeur dès leur réception : détenir l’argent d’un client ' +
            'pour le reverser plus tard est une activité réglementée. Il faut choisir l’une des deux options ' +
            'ci-dessous, supprimer l’autre, et aligner le texte de la page d’accueil en conséquence.',
        },
        {
          type: 'p',
          text:
            '**Option A — séquestre réel.** Les fonds sont reçus et conservés par [[nom du prestataire de ' +
            'paiement agréé]], établissement agréé pour la détention de fonds pour compte de tiers. NOVAWEAR n’y a ' +
            'pas accès avant la confirmation de livraison. En cas d’échec de la livraison, les fonds sont ' +
            'restitués au client par le prestataire.',
        },
        {
          type: 'p',
          text:
            "**Option B — pas de séquestre.** Les fonds sont reçus sur le compte bancaire de NOVAWEAR. NOVAWEAR " +
            "s'engage contractuellement à rembourser intégralement le client en cas de non-livraison, dans un " +
            'délai de [[délai]] à compter du constat. Le client conserve par ailleurs ses garanties légales et son ' +
            'droit de rétractation. **Dans ce cas, le mot « séquestre » doit disparaître du site.**',
        },
      ],
    },
    {
      title: 'Article 7 — Livraison',
      blocks: [
        {
          type: 'p',
          text:
            'Les commandes sont expédiées après validation du paiement, vers la France, la Belgique et la Suisse.',
        },
        {
          type: 'table',
          head: ['Destination', 'Transporteur et délai', 'Frais'],
          rows: [
            ['France', 'Colissimo suivi · 48 h', '4,90 € — offerts dès 60 €'],
            ['Belgique', 'bpost · 2 à 3 jours', '6,90 € — offerts dès 80 €'],
            ['Suisse', 'Poste CH · 3 à 5 jours', '9,90 € · douane à charge du client'],
          ],
        },
        {
          type: 'p',
          text:
            'Les délais courent à compter de la validation du paiement et sont donnés à titre indicatif. Le suivi ' +
            'de la commande est consultable à tout moment depuis la référence de commande.',
        },
        {
          type: 'p',
          text:
            "Le **risque de perte ou d'endommagement est transféré au client** au moment où celui-ci, ou un tiers " +
            'désigné par lui, prend physiquement possession du colis. En cas de colis endommagé, le client est ' +
            'invité à émettre des réserves auprès du transporteur et à contacter NOVAWEAR.',
        },
        {
          type: 'p',
          text:
            "En cas de dépassement de la date de livraison indiquée, le client peut demander la résolution de la " +
            "vente selon les conditions prévues à l'article L216-6 du Code de la consommation.",
        },
      ],
    },
    {
      title: 'Article 8 — Droit de rétractation',
      blocks: [
        {
          type: 'p',
          text:
            "Le client consommateur dispose d'un délai de **quatorze jours** à compter de la réception de sa " +
            'commande pour exercer son droit de rétractation, sans avoir à motiver sa décision.',
        },
        {
          type: 'p',
          text: 'Les modalités et le formulaire type figurent dans la page « Rétractation et retours » du site.',
        },
      ],
    },
    {
      title: 'Article 9 — Garanties légales',
      blocks: [
        {
          type: 'p',
          text:
            'Indépendamment de toute garantie commerciale, le vendeur reste tenu de la **garantie légale de ' +
            'conformité** et de la **garantie des vices cachés**.',
        },
        {
          type: 'list',
          items: [
            'Garantie légale de conformité : articles L217-3 et suivants du Code de la consommation. Le client ' +
              'dispose de deux ans à compter de la délivrance du bien et peut choisir entre la réparation et le ' +
              'remplacement, sous réserve des conditions de coût prévues par la loi.',
            'Garantie des vices cachés : articles 1641 et suivants du Code civil. Le client dispose de deux ans à ' +
              'compter de la découverte du vice et peut choisir entre la résolution de la vente et une réduction ' +
              'du prix.',
            'Pour les biens d’occasion, la durée de présomption d’antériorité du défaut est réduite conformément ' +
              'aux dispositions applicables.',
          ],
        },
        {
          type: 'note',
          text:
            'La loi impose de reproduire un encadré d’information sur les garanties légales dans une forme et des ' +
            'termes fixés par décret, et cette rédaction a évolué depuis la réforme de 2022. Faire vérifier le ' +
            'libellé exact avant publication.',
        },
      ],
    },
    {
      title: 'Article 10 — Données personnelles',
      blocks: [
        {
          type: 'p',
          text:
            'Le traitement des données personnelles des clients est décrit dans la page « Confidentialité » du ' +
            'site.',
        },
      ],
    },
    {
      title: 'Article 11 — Réclamations et médiation',
      blocks: [
        {
          type: 'p',
          text: 'Toute réclamation peut être adressée à [[adresse email de contact]].',
        },
        {
          type: 'p',
          text:
            "À défaut de solution amiable, le client consommateur peut recourir gratuitement au médiateur de la " +
            'consommation dont les coordonnées figurent dans les mentions légales, ou à la plateforme européenne ' +
            'de règlement en ligne des litiges (ec.europa.eu/consumers/odr).',
        },
      ],
    },
    {
      title: 'Article 12 — Droit applicable',
      blocks: [
        {
          type: 'p',
          text:
            'Les présentes conditions sont soumises au droit français. Le consommateur résidant dans un autre ' +
            "État membre de l'Union européenne conserve le bénéfice des dispositions impératives protectrices de " +
            'sa loi de résidence.',
        },
        {
          type: 'p',
          text:
            'Les clients résidant en Suisse sont informés que la vente est conclue avec un vendeur établi en ' +
            '[[pays d’établissement]] et que les règles de protection du consommateur suisses peuvent différer.',
        },
      ],
    },
  ],
}

/* ------------------------------------------------------- confidentialité */

const confidentialite: LegalDoc = {
  id: 'confidentialite',
  navLabel: 'Confidentialité',
  eyebrow: 'Données personnelles',
  title: 'Politique de confidentialité',
  intro:
    'Comment NOVAWEAR collecte, utilise et conserve les données personnelles de ses clients, conformément au ' +
    'règlement général sur la protection des données.',
  sections: [
    {
      title: '1. Responsable du traitement',
      blocks: [
        { type: 'note', text: REVIEW_NOTE },
        {
          type: 'p',
          text:
            'Le responsable du traitement est NOVAWEAR, [[adresse du siège]]. Pour toute question relative à vos ' +
            'données : [[adresse email de contact]].',
        },
      ],
    },
    {
      title: '2. Données collectées et finalités',
      blocks: [
        {
          type: 'table',
          head: ['Données', 'Finalité', 'Base légale'],
          rows: [
            [
              'Nom, email, téléphone, adresse de livraison',
              'Traitement et expédition de la commande, communication sur son suivi',
              'Exécution du contrat',
            ],
            [
              'Preuve de virement déposée (image ou PDF)',
              'Vérification du paiement et rattachement à la commande',
              'Exécution du contrat',
            ],
            [
              'Contenu de la commande, montant, référence',
              'Suivi commercial, comptabilité, gestion des retours',
              'Exécution du contrat et obligation légale',
            ],
            [
              'Adresse IP lors des tentatives de connexion à l’espace administrateur',
              'Limitation des tentatives, sécurité du back-office',
              'Intérêt légitime',
            ],
          ],
        },
        {
          type: 'p',
          text:
            'Aucune donnée n’est collectée à des fins publicitaires. Le site ne pratique ni profilage, ni ' +
            'décision automatisée, ni revente de données.',
        },
      ],
    },
    {
      title: '3. Preuves de paiement',
      blocks: [
        {
          type: 'p',
          text:
            "Une preuve de virement peut faire apparaître des informations bancaires du client. Ces fichiers ne " +
            "sont **jamais accessibles publiquement** : ils ne sont consultables que depuis l'espace " +
            'administrateur, après authentification.',
        },
        {
          type: 'p',
          text:
            'Ils sont supprimés au plus tard [[durée de conservation des justificatifs, ex. 90 jours]] après la ' +
            'validation ou le rejet de la commande. Il est recommandé de ne pas les conserver au-delà de ce qui ' +
            'est nécessaire à la vérification du paiement et au traitement d’un éventuel litige.',
        },
      ],
    },
    {
      title: '4. Durées de conservation',
      blocks: [
        {
          type: 'table',
          head: ['Donnée', 'Durée'],
          rows: [
            ['Données de commande et de livraison', 'Durée de la relation commerciale, puis archivage légal'],
            ['Pièces comptables', '10 ans (article L123-22 du Code de commerce)'],
            ['Preuves de paiement', '[[durée retenue]] après clôture de la commande'],
            ['Journal des emails envoyés', '[[durée retenue]]'],
          ],
        },
      ],
    },
    {
      title: '5. Destinataires',
      blocks: [
        {
          type: 'p',
          text:
            'Les données sont accessibles au personnel de NOVAWEAR chargé du traitement des commandes. Elles sont ' +
            'transmises aux seuls prestataires nécessaires à l’exécution de la commande :',
        },
        {
          type: 'list',
          items: [
            'le transporteur, pour la livraison (nom et adresse) ;',
            'l’hébergeur du site [[nom de l’hébergeur]], pour le stockage ;',
            'le prestataire d’envoi des emails [[nom du prestataire SMTP]], pour les messages transactionnels ;',
            '[[le cas échéant, le prestataire de paiement retenu]].',
          ],
        },
        {
          type: 'p',
          text: 'Aucune donnée n’est transférée hors de l’Union européenne [[à confirmer selon les prestataires retenus]].',
        },
      ],
    },
    {
      title: '6. Vos droits',
      blocks: [
        {
          type: 'p',
          text:
            'Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de ' +
            'portabilité de vos données. Ces droits s’exercent auprès de [[adresse email de contact]], en ' +
            'justifiant de votre identité.',
        },
        {
          type: 'p',
          text:
            'Vous pouvez introduire une réclamation auprès de la CNIL (www.cnil.fr) ou de l’autorité de contrôle ' +
            'de votre pays de résidence.',
        },
      ],
    },
    {
      title: '7. Cookies et stockage local',
      blocks: [
        {
          type: 'p',
          text:
            'Le site **n’utilise ni cookie publicitaire, ni cookie de mesure d’audience, ni traceur tiers**. ' +
            'Aucune bannière de consentement n’est donc requise.',
        },
        {
          type: 'list',
          items: [
            'Un cookie de session strictement nécessaire est déposé lors de la connexion à l’espace ' +
              'administrateur, et expire après huit heures.',
            'Le panier et le pays de livraison sont conservés dans le stockage local du navigateur du visiteur. ' +
              'Ces informations ne quittent pas son appareil tant qu’aucune commande n’est passée.',
            'Les polices de caractères sont chargées depuis Google Fonts, ce qui transmet l’adresse IP du ' +
              'visiteur à Google. [[Pour éviter ce transfert, héberger les polices sur le domaine du site.]]',
          ],
        },
      ],
    },
    {
      title: '8. Sécurité',
      blocks: [
        {
          type: 'p',
          text:
            'L’accès à l’espace administrateur est protégé par un code d’accès et une session signée, avec ' +
            'limitation du nombre de tentatives. Les justificatifs de paiement sont servis exclusivement par une ' +
            'route authentifiée.',
        },
      ],
    },
  ],
}

/* --------------------------------------------------------- rétractation */

const retractation: LegalDoc = {
  id: 'retractation',
  navLabel: 'Rétractation',
  eyebrow: 'Retours',
  title: 'Rétractation et retours',
  intro:
    'Vous disposez de quatorze jours pour changer d’avis, sans avoir à vous justifier. Voici comment procéder.',
  sections: [
    {
      title: '1. Délai',
      blocks: [
        { type: 'note', text: REVIEW_NOTE },
        {
          type: 'p',
          text:
            'Le délai de rétractation est de **quatorze jours** à compter du jour où vous, ou un tiers désigné ' +
            'par vous, prenez physiquement possession du dernier article de la commande.',
        },
        {
          type: 'p',
          text:
            'Si ce délai expire un samedi, un dimanche ou un jour férié, il est prolongé jusqu’au premier jour ' +
            'ouvrable suivant.',
        },
      ],
    },
    {
      title: '2. Comment exercer ce droit',
      blocks: [
        {
          type: 'p',
          text:
            'Informez-nous de votre décision par une déclaration dénuée d’ambiguïté, adressée à ' +
            '[[adresse email de contact]] ou à [[adresse postale de retour]]. Vous pouvez utiliser le formulaire ' +
            'ci-dessous, sans que ce soit obligatoire.',
        },
        {
          type: 'quote',
          text:
            'À l’attention de NOVAWEAR, [[adresse postale]], [[adresse email]] :\n\n' +
            'Je vous notifie par la présente ma rétractation du contrat portant sur la vente du bien ci-dessous :\n\n' +
            'Commandé le : ……………………  Reçu le : ……………………\n' +
            'Référence de commande : ……………………\n' +
            'Article : ……………………\n' +
            'Nom du consommateur : ……………………\n' +
            'Adresse du consommateur : ……………………\n\n' +
            'Signature (uniquement en cas de notification sur papier) : ……………………\n' +
            'Date : ……………………',
        },
      ],
    },
    {
      title: '3. Renvoi de l’article',
      blocks: [
        {
          type: 'p',
          text:
            'L’article doit nous être renvoyé au plus tard **quatorze jours** après la communication de votre ' +
            'décision, dans son état d’origine, complet et avec ses accessoires (boîte de sneakers, étiquettes).',
        },
        {
          type: 'p',
          text:
            'Les **frais de renvoi sont à votre charge** [[ou préciser si la boutique les prend en charge]]. ' +
            'Nous vous recommandons un envoi suivi : le colis voyage sous votre responsabilité jusqu’à sa ' +
            'réception.',
        },
        {
          type: 'p',
          text:
            'Votre responsabilité peut être engagée en cas de dépréciation de l’article résultant de ' +
            'manipulations autres que celles nécessaires pour en établir la nature, les caractéristiques et le ' +
            'bon fonctionnement.',
        },
      ],
    },
    {
      title: '4. Remboursement',
      blocks: [
        {
          type: 'p',
          text:
            'Nous vous remboursons **au plus tard quatorze jours** après avoir récupéré l’article, ou après ' +
            'réception de la preuve de son expédition si celle-ci intervient plus tôt.',
        },
        {
          type: 'p',
          text:
            'Le remboursement porte sur le prix de l’article et sur les frais de livraison standard initialement ' +
            'payés. Il est effectué par virement sur le compte ayant servi au paiement, sans frais pour vous.',
        },
      ],
    },
    {
      title: '5. Exceptions',
      blocks: [
        {
          type: 'p',
          text:
            'Le droit de rétractation ne s’applique pas aux biens confectionnés sur mesure ou nettement ' +
            'personnalisés, ni aux biens descellés qui ne peuvent être renvoyés pour des raisons d’hygiène.',
        },
        {
          type: 'p',
          text:
            '[[Préciser si certaines catégories du catalogue — sous-vêtements, chaussettes, bijoux — sont ' +
            'concernées par l’exception d’hygiène.]]',
        },
      ],
    },
    {
      title: '6. Article défectueux ou non conforme',
      blocks: [
        {
          type: 'p',
          text:
            'La rétractation est distincte des garanties légales. Si l’article reçu est défectueux ou ne ' +
            'correspond pas à sa description, contactez-nous : les garanties légales de conformité et des vices ' +
            'cachés s’appliquent, et les frais de retour sont alors à notre charge.',
        },
      ],
    },
  ],
}

export const LEGAL_DOCS: LegalDoc[] = [cgv, retractation, confidentialite, mentions]

export const findLegalDoc = (id: LegalDocId): LegalDoc =>
  LEGAL_DOCS.find((doc) => doc.id === id) ?? LEGAL_DOCS[0]
