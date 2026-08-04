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