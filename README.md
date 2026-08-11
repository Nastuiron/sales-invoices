# Factures de vente

Mini-module ERP permettant de consulter et de gérer des factures de vente.

Ce projet a été réalisé dans le cadre d’un test technique de développement web principalement orienté frontend.

## Fonctionnalités

- consultation de la liste des factures ;
- recherche par numéro, client ou référence de commande ;
- filtrage par statut, combinable avec la recherche ;
- consultation du détail d’une facture ;
- affichage des montants HT, TVA, TTC et du reste à payer ;
- détection dynamique des factures en retard ;
- émission d’un brouillon ;
- marquage d’une facture comme envoyée ;
- enregistrement d’un règlement ;
- émission d’un avoir ;
- gestion des états de chargement, d’erreur et d’absence de résultat ;
- simulation d’une erreur API ;
- interface responsive adaptée aux écrans mobiles, tablettes et ordinateurs ;
- navigation au clavier dans le panneau de détail.

## Technologies

### Frontend

- Vue 3 ;
- TypeScript ;
- Vite ;
- Composition API ;
- Axios ;
- Vitest ;
- Vue Test Utils ;
- jsdom.

### Backend

- Node.js ;
- Express ;
- TypeScript ;
- SQLite avec le module natif `node:sqlite` ;
- Zod ;
- Helmet ;
- Vitest ;
- Supertest.

## Choix d’architecture

Le sujet autorisait l’utilisation d’une API simulée.

J’ai choisi de développer une API REST locale avec Express et SQLite afin de centraliser les règles métier, de valider les transitions de statut côté serveur et de proposer un comportement plus proche d’un véritable module ERP.

Cette API reste volontairement légère et ne nécessite aucun service externe.

Le projet est organisé en deux espaces de travail npm :

```text
sales-invoices/
├── backend/
├── frontend/
├── package.json
└── README.md
```

Le frontend sépare :

- les appels HTTP dans `src/api` ;
- les types dans `src/types` ;
- l’état et les traitements réutilisables dans `src/composables` ;
- les éléments d’interface dans `src/components` ;
- la composition de la page dans `src/pages`.

Le backend sépare notamment :

- le domaine et les règles métier ;
- les services applicatifs ;
- les repositories SQLite ;
- les contrôleurs et routes HTTP ;
- la validation des requêtes ;
- les migrations et les données de démonstration.

## Prérequis

- Node.js 24 ou une version ultérieure compatible ;
- npm.

Aucun serveur de base de données externe n’est nécessaire.

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

La base SQLite est créée localement dans :

```text
backend/data/invoices.db
```

Ce fichier généré n’est pas versionné.

## Configuration

Le frontend utilise par défaut l’API disponible à l’adresse suivante :

```text
http://localhost:3000/api
```

Cette adresse peut être configurée avec la variable d’environnement :

```env
VITE_API_URL=http://localhost:3000/api
```

Un exemple est disponible dans :

```text
frontend/.env.example
```

Le délai artificiel de l’API peut être modifié avec :

```env
API_DELAY_MS=600
```

## Développement

Lancer le backend :

```bash
npm run dev:backend
```

Lancer le frontend dans un second terminal :

```bash
npm run dev:frontend
```

Le frontend est alors accessible à l’adresse indiquée par Vite, généralement :

```text
http://localhost:5173
```

L’API est accessible à l’adresse suivante :

```text
http://localhost:3000
```

Route de vérification :

```http
GET /api/health
```

## Tests

Exécuter les tests du frontend et du backend :

```bash
npm test
```

Les tests backend couvrent notamment :

- les calculs monétaires ;
- les transitions de statut ;
- la détection du retard ;
- la validation métier ;
- les services ;
- les routes HTTP ;
- les réponses d’erreur.

Les tests frontend couvrent notamment :

- les actions disponibles selon le statut ;
- les interactions de recherche et de filtrage ;
- la réinitialisation des filtres ;
- le délai appliqué à la recherche ;
- la combinaison de la recherche et du statut.

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
- une date d’émission et une date d’échéance ;
- un statut ;
- les informations de règlement ;
- une éventuelle référence d’avoir ;
- les dates techniques de création et de modification.

Les coordonnées du client sont conservées comme un instantané dans la facture. Une modification ultérieure du client ne doit donc pas modifier une facture déjà émise.

Les dates sont échangées avec l’API au format ISO.

## Statuts

| Statut technique | Libellé | Signification |
| --- | --- | --- |
| `draft` | Brouillon | Facture en préparation et encore modifiable |
| `issued` | Émise | Facture officielle, numérotée et non modifiable |
| `sent` | Envoyée | Facture transmise au client |
| `paid` | Réglée | Facture intégralement payée |
| `credited` | Avoir émis | Facture neutralisée par un avoir et conservée pour la traçabilité |

Une facture officiellement émise n’est jamais supprimée ni simplement annulée. Sa correction passe par l’émission d’un avoir faisant référence à la facture initiale.

### Transitions autorisées

```text
draft  -> issued
issued -> sent
issued -> credited
sent   -> paid
sent   -> credited
```

Les statuts `paid` et `credited` sont terminaux dans le périmètre actuel.

## Principales règles métier

- seul un brouillon complet peut être émis ;
- une facture doit contenir au moins une ligne valide ;
- la date d’échéance ne peut pas précéder la date d’émission ;
- une facture émise ne peut plus être modifiée librement ;
- une facture doit être envoyée avant d’être marquée comme réglée ;
- le règlement final doit porter le montant déjà réglé au total TTC ;
- une facture émise ou envoyée peut être neutralisée par un avoir ;
- les transitions non autorisées sont refusées par le domaine ;
- une facture envoyée est en retard lorsque son échéance est dépassée et que son solde reste positif.

Le retard est calculé dynamiquement. Il ne constitue pas un statut enregistré.

## Calcul des montants

Les montants monétaires sont enregistrés en centimes afin d’éviter les imprécisions liées aux nombres décimaux JavaScript.

Pour chaque ligne :

```text
montant HT = quantité × prix unitaire HT
TVA = arrondi au centime du montant HT × taux de TVA
montant TTC = montant HT + TVA
```

Les totaux de la facture correspondent à la somme des montants calculés ligne par ligne.

```text
reste à payer = total TTC - montant déjà réglé
```

Les montants sont convertis en euros uniquement pour l’affichage.

## Base de données

Le backend utilise SQLite via le module `node:sqlite` intégré à Node.js.

Ce choix évite une dépendance native externe et ne nécessite aucun service de base de données supplémentaire.

Les migrations déjà exécutées sont enregistrées dans la table `schema_migrations`. La commande de migration peut ainsi être relancée sans recréer les tables existantes.

Le schéma sépare les factures et leurs lignes dans les tables :

```text
invoices
invoice_lines
```

Les informations du client sont conservées directement dans la facture sous forme d’instantané historique.

Les écritures liées aux changements de statut sont exécutées dans des transactions SQLite.

## Jeu de données

Le jeu de démonstration contient dix factures représentant notamment :

- un brouillon complet prêt à être émis ;
- un brouillon incomplet ;
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

### Récupérer le détail d’une facture

```http
GET /api/invoices/:id
```

Exemple :

```http
GET /api/invoices/invoice-overdue
```

La réponse contient :

- les informations générales de la facture ;
- le client et son adresse de facturation ;
- les lignes facturées ;
- les dates importantes ;
- les informations de règlement ;
- l’éventuelle référence d’avoir ;
- les montants HT, TVA et TTC ;
- le reste à payer ;
- l’indicateur de retard.

Une facture inexistante reçoit une réponse HTTP `404` avec le code `INVOICE_NOT_FOUND`.

### Modifier le statut d’une facture

```http
PATCH /api/invoices/:id/status
```

Les transitions autorisées dépendent du statut actuel de la facture.

#### Émettre un brouillon

```json
{
  "status": "issued"
}
```

Le backend vérifie les données obligatoires et attribue automatiquement un numéro de facture.

#### Envoyer une facture

```json
{
  "status": "sent"
}
```

La date d’envoi est renseignée automatiquement.

#### Marquer une facture comme réglée

```json
{
  "status": "paid",
  "payment": {
    "amountCents": 30000,
    "method": "bank_transfer",
    "reference": "VIR-2026-001"
  }
}
```

Le règlement est ajouté au montant déjà reçu. Le montant cumulé doit alors correspondre exactement au total TTC.

#### Émettre un avoir

```json
{
  "status": "credited",
  "creditNote": {
    "reason": "Prestation annulée avant son démarrage."
  }
}
```

Le backend attribue automatiquement le numéro et la date de l’avoir.

Les transitions interdites reçoivent une réponse HTTP `409`. Les données métier incomplètes ou incohérentes reçoivent une réponse HTTP `422`.

## Simulation du réseau

Un délai artificiel de 600 ms est appliqué aux routes de facturation afin de rendre les états de chargement visibles dans l’interface.

Il peut être modifié avec la variable d’environnement `API_DELAY_MS`. Il est désactivé pendant les tests automatisés.

Une erreur API peut être simulée hors production avec l’en-tête suivant :

```http
x-simulate-api-error: true
```

L’API retourne alors une réponse HTTP `503` avec le code `SIMULATED_API_ERROR`.

En environnement de développement, cette simulation est accessible depuis l’interface.

## Sécurité

Les protections actuellement appliquées sont :

- validation des entrées avec Zod ;
- requêtes SQLite préparées et paramétrées ;
- transactions pour les changements de statut ;
- en-têtes HTTP configurés avec Helmet ;
- suppression de l’en-tête `X-Powered-By` ;
- limitation du corps JSON à 20 ko ;
- limitation du nombre de requêtes ;
- politique CORS limitée au frontend local ;
- réponses d’erreur sans détails techniques internes.

L’authentification et la gestion des autorisations sont hors du périmètre du test. Elles seraient nécessaires avant une exposition publique de l’API.

## Accessibilité et responsive

L’interface prévoit notamment :

- des libellés associés aux champs ;
- des états annoncés avec `aria-live` ;
- des libellés accessibles pour les actions ;
- une navigation au clavier dans le panneau de détail ;
- une fermeture du panneau avec la touche `Échap` ;
- un focus visible ;
- une présentation des factures sous forme de cartes lorsque le tableau ne peut plus être affiché confortablement ;
- un panneau de détail plein écran sur mobile.

## Limites du périmètre

Le projet ne contient volontairement pas :

- d’authentification ;
- de gestion des autorisations ;
- de création ou modification complète d’une facture ;
- d’envoi réel d’e-mail ;
- de génération de document PDF ;
- de synchronisation avec un service comptable externe.

Ces fonctionnalités seraient nécessaires dans un ERP destiné à la production, mais dépassent le périmètre du test technique.

## Utilisation de l’intelligence artificielle

Codex a été utilisé comme outil d’accompagnement pendant le développement, notamment pour :

- analyser le sujet ;
- discuter de la modélisation métier ;
- proposer et revoir l’architecture ;
- suggérer des portions de code ;
- accompagner le diagnostic d’erreurs ;
- préparer certains tests ;
- relire la documentation.

Les propositions ont été intégrées progressivement, testées localement et adaptées au projet par le candidat.