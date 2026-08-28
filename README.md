# NOVAWEAR

Boutique streetwear en ligne — catalogue de 329 pièces, paiement par virement
bancaire avec séquestre, suivi de commande public et back-office administrateur.

Implémentation du design `project/Site NOVAWEAR.dc.html`, exporté depuis Claude
Design. Les transcriptions de conception sont conservées dans `chats/`.

## Stack

| Partie   | Technologie                                          |
| -------- | ---------------------------------------------------- |
| `web/`   | React 18 + TypeScript + Vite                          |
| `server/`| Node + Express + SQLite (`better-sqlite3`)            |

Le front-end est une application à vue unique : la navigation se fait par état,
comme dans le design d'origine. Les prix, frais de port et références de commande
sont calculés côté serveur — jamais transmis par le client.

## Démarrage

```bash
npm install
npm run dev      # API sur :4000, front sur :5173 (proxy /api → :4000)
```

Le catalogue est semé automatiquement au premier démarrage (329 articles).

### Production

```bash
npm run build
npm start        # sert l'API et le front construit sur le même port
```

### Variables d'environnement

Voir `.env.example`. En production, `ADMIN_CODE` et `SESSION_SECRET` sont
indispensables : sans eux le code de démonstration `NOVA` reste actif et les
sessions admin sont invalidées à chaque redémarrage. Le serveur l'affiche au
démarrage.

## Parcours client

1. Catalogue → 7 catégories, 33 sous-catégories, filtres sous-catégorie / taille
   / prix, recherche sur nom, référence et sous-catégorie.
2. Fiche produit → galerie, tailles, ajout au panier.
3. Panier → quantités, pays de livraison (FR / BE / CH), port calculé
   (offert dès 60 € en France, 80 € en Belgique).
4. Paiement → coordonnées de livraison, puis IBAN, BIC et **référence de commande
   obligatoire dans le libellé du virement**, avec dépôt de la preuve (image ou PDF).
5. Suivi → bouton « Suivi » de l'en-tête, recherche par référence, timeline en
   5 étapes synchronisée avec l'admin. Les liens des emails ouvrent directement
   la commande (`/?suivi=NW-2026-1041`).

## Emails

| Déclencheur                    | Destinataire | Contenu                                          |
| ------------------------------ | ------------ | ------------------------------------------------ |
| Preuve de virement déposée     | client       | Récapitulatif, IBAN et référence, lien de suivi   |
| Preuve de virement déposée     | `ADMIN_EMAIL`| Nouvelle commande à vérifier                      |
| Paiement validé                | client       | Confirmation, passage en préparation              |
| Commande rejetée               | client       | Motif communiqué par l'admin                      |
| Changement d'étape (2 à 5)     | client       | Étape atteinte, statut du séquestre               |

L'étape 1 n'est pas annoncée séparément : elle coïncide avec la validation du
paiement. Revenir en arrière sur une étape ne renvoie pas d'email.

Sans SMTP configuré, les messages sont **écrits dans `server/data/outbox/`** au
format `.eml` plutôt qu'envoyés — le serveur le signale au démarrage. Chaque
tentative est journalisée dans la table `emails` (statut `sent`, `written` ou
`failed`). Un échec d'envoi ne fait jamais échouer une commande.

Pour de vrais envois, renseigner `SMTP_URL` (ou `SMTP_HOST` et compagnie),
`MAIL_FROM` et `PUBLIC_URL` — voir `.env.example`. Le domaine expéditeur doit
avoir SPF et DKIM configurés, sinon les emails partiront en spam.

## Pages légales

Quatre documents accessibles depuis le pied de page : CGV, rétractation et
retours, politique de confidentialité, mentions légales. Le contenu vit dans
`web/src/legal/content.ts`.

Ce sont des **bases de travail à faire relire par un juriste**, pas des textes
prêts à publier. Aucune information d'identité d'entreprise n'y est inventée :
raison sociale, SIRET, RCS, TVA, hébergeur, médiateur et délais sont laissés en
`[[champs à compléter]]`, affichés en doré sur la page pour qu'un document
incomplet ne passe pas inaperçu. Il en reste 38 au total.

L'article 6 des CGV (conservation des fonds) contient les deux rédactions
possibles selon la décision prise sur le séquestre — il faut en supprimer une.

## Back-office

Lien « Admin » discret en pied de page, protégé par `ADMIN_CODE`.

- **Commandes** — compteurs, détail, preuve de paiement en grand, validation ou
  rejet avec motif obligatoire, remise en attente, pilotage des 5 étapes de
  livraison.
- **Articles** — ajout (nom, catégorie, sous-catégorie, prix, tailles, badge,
  photo) et suppression. Les articles du catalogue d'origine sont masqués et
  restaurables en bloc ; ceux ajoutés depuis l'admin sont supprimés définitivement.
- **Coordonnées bancaires** — titulaire, IBAN, BIC, banque, avec aperçu client en
  direct. Reprises automatiquement à l'étape de paiement.

## API

| Méthode | Route                              | Accès  |
| ------- | ---------------------------------- | ------ |
| GET     | `/api/catalog`                     | public |
| POST    | `/api/checkout`                    | public |
| POST    | `/api/checkout/:id/confirm`        | public |
| GET     | `/api/track?ref=`                  | public |
| POST    | `/api/admin/login` · `/logout`     | public |
| GET     | `/api/admin/orders`                | admin  |
| POST    | `/api/admin/orders/:id/validate`   | admin  |
| POST    | `/api/admin/orders/:id/reject`     | admin  |
| POST    | `/api/admin/orders/:id/reopen`     | admin  |
| POST    | `/api/admin/orders/:id/stage`      | admin  |
| GET     | `/api/admin/orders/:id/proof`      | admin  |
| GET/PUT | `/api/admin/bank`                  | admin  |
| GET     | `/api/admin/products`              | admin  |
| POST    | `/api/admin/products`              | admin  |
| DELETE  | `/api/admin/products/:id`          | admin  |
| POST    | `/api/admin/products/restore`      | admin  |

Les preuves de paiement ne sont jamais servies publiquement : elles passent par
une route admin authentifiée. Le suivi public ne renvoie ni nom, ni adresse, ni
email, ni justificatif — seulement l'état de la commande.

## Données

`server/src/catalogue.ts` reproduit à l'identique le générateur du prototype :
mêmes références, noms, prix, tailles, badges et affectations de photos. Les 329
photos vivent dans `web/public/assets/photos/`, et chaque sous-catégorie n'utilise
que des visuels du bon type de produit (pools vérifiés lors du design).

Base SQLite et fichiers déposés sous `server/data/` (hors dépôt).

## Points à trancher

Deux réserves héritées du design, non résolues à ce jour :

- **Séquestre.** Le site affiche « les fonds sont bloqués en séquestre jusqu'à la
  livraison ». Sur un compte bancaire ordinaire, même dédié, les fonds sont
  juridiquement ceux de la boutique dès réception : détenir l'argent d'un client
  pour le reverser plus tard est une activité réglementée. Le texte est repris tel
  quel du design ; il faudra soit passer par un prestataire agréé, soit reformuler.
- **Suivi par référence seule.** Les références se suivent (`NW-2026-1041`,
  `1042`…) et sont donc devinables. La réponse publique a été réduite aux seules
  informations non nominatives, mais ajouter l'email au formulaire de suivi reste
  recommandé.

Les coordonnées bancaires livrées sont fictives (BNP, IBAN factice) — à remplacer
depuis l'onglet « Coordonnées bancaires » du back-office.
