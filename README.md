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

## Structure

```text
sales-invoices/
├── frontend/
├── backend/
├── package.json
└── README.md
```

## Prérequis
- Node.js 24 ou une version lts compatible
- npm

## Installation

Depuis la racine du projet :

```bash
npm install
```

## Développement
lancer le frontend :
```bash
npm run dev:frontend
```

lancer le backend :
```bash
npm run dev:backend
```

l'API est accessible à l'adresse suivante :
```text
http://localhost:3000
```

la route de vérification est :

```text
GET /api/health
```

## Compilation
```text
npm run build
```

## Intelligence artificielle
Codex a été utilisé comme outil d'accompagnement pour analyser le sujet, discuter de la modélisation et guider certaines étapes du développement. Les choix métier et le code sont relus, compris et validés par le candidat.
Ce README sera complété progressivement avec le modèle métier, les règles de validation, les transitions de statut et la documentation de l'API.

## Modèle métier

une facture contient :

- un identifiant technique ;
- un numéro définitif attribué lors de son émission ;
- un client et son adresse de facturation ;
- une ou plusieurs ligne facturées ;
- une date d'émission et une date d'échéance ;
- un statut ;
- les informations de règlement ;
- une éventuelle référence d'avoir;
- les dates techniques de création et de modification.

les coordonnées du client son conservées comme un instantané dans la facture. Une modification ultérieure du client ne doit pas modifier une facture déjà émise.

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

Les statuts paid et credited sont terminaux dans le périmètre actuel.

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

## Calculs des montants

Les montants monétaires sont enregistrés en centimes afin déviter les imprécisions des nombres décimaux JavaScript.

Pour chaque ligne :

```text
montant HT = quantité × prix unitaire
TVA = arrondi au centime du montant HT × taux de TVA
montant TTC = montant HT + TVA
```

les totaux de la facture correspondent à la somme des montants calculés ligne par ligne.

```text
reste à payer = total TTC - montant déjà réglé
```

