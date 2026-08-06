# Factures de vente

Mini-module ERP permettant de consulter et de gérer des factures de vente.

Ce projet est réalisé dans le cadre d'un test technique de développement web front-end.

## Technologies

### Frontend

- Vue 3
- TypeScript
- Vite
- Composition API

### Backend

- Node.js
- Express
- TypeScript
- SQLite
- `better-sqlite3`
- Vitest

## Structure du projet

```text
sales-invoices/
├── backend/
├── frontend/
├── package.json
└── README.md
```

## Prérequis

- Node.js 24 ou une version LTS compatible
- npm

## Installation

Depuis la racine du projet, installer les dépendances :

```bash
npm install
```

Créer le schéma de la base de données :

```bash
npm run db:migrate --workspace backend
```

Insérer les données de démonstration :

```bash
npm run db:seed --workspace backend
```

Le seed est idempotent : il peut être exécuté plusieurs fois sans créer de doublons.

## Développement

Lancer le frontend :

```bash
npm run dev:frontend
```

Lancer le backend dans un second terminal :

```bash
npm run dev:backend
```

L'API est accessible à l'adresse suivante :

```text
http://localhost:3000
```

Route de vérification :

```text
GET /api/health
```

## Tests

Exécuter les tests :

```bash
npm test
```

## Compilation

Compiler le frontend et le backend :

```bash
npm run build
```

## Modèle métier

Une facture contient :

- un identifiant technique ;
- un numéro définitif attribué lors de son émission ;
- un client et son adresse de facturation ;
- une ou plusieurs lignes facturées ;
- une date d'émission et une date d'échéance ;
- un statut ;
- les informations de règlement ;
- une éventuelle référence d'avoir ;
- les dates techniques de création et de modification.

Les coordonnées du client sont conservées comme un instantané dans la facture. Une modification ultérieure du client ne doit pas modifier une facture déjà émise.

Les dates sont échangées avec l'API au format ISO.

## Statuts

| Statut technique | Libellé | Signification |
| --- | --- | --- |
| `draft` | Brouillon | Facture en préparation et encore modifiable |
| `issued` | Émise | Facture officielle, numérotée et non modifiable |
| `sent` | Envoyée | Facture transmise au client |
| `paid` | Réglée | Facture intégralement payée |
| `credited` | Avoir émis | Facture neutralisée par un avoir, mais conservée pour la traçabilité |

Une facture officiellement émise n'est jamais supprimée ni simplement annulée. Sa correction passe par l'émission d'un avoir faisant référence à la facture initiale.

### Transitions autorisées

```text
draft -> issued
issued -> sent
issued -> credited
sent -> paid
sent -> credited
```

Les statuts `paid` et `credited` sont terminaux dans le périmètre actuel.

## Principales règles métier

- seul un brouillon complet peut être émis ;
- une facture doit contenir au moins une ligne valide ;
- la date d'échéance ne peut pas précéder la date d'émission ;
- une facture émise ne peut plus être modifiée ;
- une facture doit être envoyée avant d'être marquée comme réglée ;
- le montant réglé doit correspondre exactement au total TTC ;
- une facture émise ou envoyée peut être neutralisée par un avoir ;
- les transitions non autorisées sont refusées par le domaine ;
- une facture envoyée est en retard lorsque son échéance est dépassée et que son solde reste positif.

Le retard est calculé dynamiquement. Il ne constitue pas un statut enregistré.

## Calcul des montants

Les montants monétaires sont enregistrés en centimes afin d'éviter les imprécisions des nombres décimaux JavaScript.

Pour chaque ligne :

```text
montant HT = quantité × prix unitaire
TVA = arrondi au centime du montant HT × taux de TVA
montant TTC = montant HT + TVA
```

Les totaux de la facture correspondent à la somme des montants calculés ligne par ligne.

```text
reste à payer = total TTC - montant déjà réglé
```

## Base de données

Le backend utilise SQLite avec `better-sqlite3`.

La base générée localement n'est pas versionnée. Les migrations déjà exécutées sont enregistrées dans la table `schema_migrations`, ce qui permet de relancer la commande de migration sans recréer les tables.

Le schéma sépare les factures et leurs lignes dans les tables `invoices` et `invoice_lines`.

Les informations du client sont conservées directement dans la facture sous forme d'instantané historique.

## Jeu de données

Le jeu de démonstration contient 10 factures représentant notamment :

- un brouillon complet prêt à être émis ;
- un brouillon invalide ;
- une facture émise ;
- plusieurs factures envoyées ;
- une facture en retard ;
- une facture partiellement réglée ;
- deux factures réglées ;
- une facture neutralisée par un avoir ;
- une facture contenant plusieurs taux de TVA.

## API

### Récupérer les factures

```http
GET /api/invoices
```

Paramètres facultatifs :

| Paramètre | Description |
| --- | --- |
| `search` | Recherche sur le numéro de facture, le client ou la référence de commande |
| `status` | Filtre sur le statut technique |

Les deux paramètres peuvent être utilisés simultanément :

```http
GET /api/invoices?search=nova&status=sent
```

La réponse contient les factures, leurs montants calculés, leur reste à payer et un indicateur de retard.

```json
{
  "data": [],
  "meta": {
    "count": 0
  }
}
```

Les paramètres sont validés avec Zod. Une requête invalide reçoit une réponse HTTP `400`.

## Simulation du réseau

Un délai artificiel de 600 ms est appliqué aux routes de facturation afin de rendre les états de chargement visibles dans l'interface.

Il peut être modifié avec la variable d'environnement `API_DELAY_MS`. Il est désactivé pendant les tests automatisés.

## Sécurité

Les protections actuellement appliquées sont :

- validation des entrées avec Zod ;
- requêtes SQLite paramétrées ;
- en-têtes HTTP configurés avec Helmet ;
- suppression de l'en-tête `X-Powered-By` ;
- limitation du corps JSON à 20 ko ;
- limitation du nombre de requêtes ;
- politique CORS limitée au frontend local ;
- réponses d'erreur sans détails techniques internes.

L'authentification et la gestion des autorisations sont hors du périmètre du test. Elles seraient nécessaires avant une exposition publique de l'API.

### Récupérer le détail d'une facture

```http
GET /api/invoices/:id
```

Exemple :
```http
GET /api/invoices/invoice-overdue
```

la réponse contient :
- les informations générales de la facture ;0
- le client et son adresse de facturation ;
- les lignes facturées ;
- les dates importantes ;
- les informations de règlement ;
- l'éventuelle référence d'avoir ;
- les montants HT, TVA et TTC ;
- le reste à payer ;
- l'indicateur de retard.

Une facture inexistante reçoit une réponse HTTP `404` avec le code `INVOICE_NOT_FOUND`.
 
## Utilisation de l'intelligence artificielle

Codex a été utilisé comme outil d'accompagnement pour analyser le sujet, discuter de la modélisation et guider certaines étapes du développement.

Les choix métier et le code ont été relus, compris et validés par le candidat.