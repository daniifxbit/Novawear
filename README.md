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
   5 étapes synchronisée avec l'admin.

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
