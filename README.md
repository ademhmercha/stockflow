# StockFlow

**StockFlow** est une application SaaS de gestion de stock et de facturation
destinée aux PME/TPE tunisiennes (commerce, distribution, petite industrie —
5 à 20 employés), pensée pour remplacer Excel par un outil simple.

Elle gère nativement les spécificités fiscales tunisiennes :

- **TVA multi-taux** : 19% (taux normal), 13% et 7% (taux réduits), configurable par produit
- **Timbre fiscal** : taxe forfaitaire par facture, montant piloté via la variable
  d'environnement `TIMBRE_FISCAL_MONTANT` (car ce montant change au gré des lois de finances)

## Stack technique

| Domaine | Technologies |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, shadcn/ui, React Router, Zustand |
| Backend | Node.js, Express, TypeScript, Mongoose |
| Base de données | MongoDB |
| Auth | JWT (access + refresh token), rôles `admin` / `vendeur` / `comptable` |
| PDF | Puppeteer (génération des factures) |
| Conteneurisation | Docker, docker-compose |
| Orchestration | Kubernetes (Kustomize, base + overlays staging/production) |
| CI/CD | GitHub Actions → GHCR → webhook n8n |
| Tests | Vitest (frontend), Jest + Supertest (backend) |

## Structure du repo

```
stockflow/
├── apps/
│   ├── frontend/          # React app (Vite)
│   └── backend/           # API Express/TypeScript
├── infra/
│   ├── docker/             # Dockerfiles + config Nginx
│   ├── docker-compose.yml  # Environnement de dev local
│   └── k8s/                # Manifests Kubernetes (base + overlays)
├── .github/workflows/      # CI (tests) + CD (build/push/notify n8n)
├── n8n/workflows/           # Workflow n8n exporté (déploiement + notification)
└── .env.example
```

## 1. Lancer le projet en local (Docker Compose)

Prérequis : Docker Desktop.

```bash
cp .env.example infra/.env
# éditer infra/.env si besoin (secrets JWT, etc.)

cd infra
docker compose up --build
```

Services démarrés :

| Service | URL |
|---|---|
| Frontend (Vite, hot-reload) | http://localhost:5173 |
| Backend (API, hot-reload) | http://localhost:4000/api |
| MongoDB | localhost:27017 |
| n8n | http://localhost:5679 |

Vérifier que tout fonctionne :

```bash
curl http://localhost:4000/api/health
# -> {"status":"ok","db":"connected","uptime":...}
```

Puis ouvrez http://localhost:5173, créez un compte via `/api/auth/register`
(ou ajoutez un formulaire d'inscription — pour l'instant, testez via l'API :
voir la section "Commandes de vérification" ci-dessous) et connectez-vous.

## 2. Lancer sans Docker (dev natif)

```bash
# Backend
cd apps/backend
cp .env.example .env
npm install
npm run dev        # http://localhost:4000

# Frontend (autre terminal)
cd apps/frontend
cp .env.example .env
npm install
npm run dev         # http://localhost:5173
```

Une instance MongoDB locale (ou `docker run -p 27017:27017 mongo:7`) est requise.

## 3. Déploiement Kubernetes

Voir [infra/k8s/README-k8s.md](infra/k8s/README-k8s.md) pour la marche à suivre
détaillée (cluster Minikube local puis cluster cloud), résumé :

```bash
minikube start -p stockflow --driver=docker
kubectl apply -k infra/k8s/overlays/staging
```

## 4. Flux CI/CD → n8n → Kubernetes

```
 Développeur                GitHub Actions                 n8n                  Kubernetes
 ───────────                ──────────────                 ───                  ──────────

  git push main
       │
       ▼
  ┌─────────────┐    PR    ┌──────────────────┐
  │   git push  │─────────▶│   ci.yml          │
  └─────────────┘          │  lint + tests     │
                            │  bloque le merge  │
                            │  si échec         │
                            └──────────────────┘

  merge sur main
       │
       ▼
                            ┌──────────────────────────┐
                            │   deploy.yml              │
                            │  1. build images Docker   │
                            │     (backend + frontend)  │
                            │  2. push vers GHCR         │
                            │     (tag = SHA du commit)  │
                            │  3. POST webhook n8n       │
                            └──────────────┬────────────┘
                                           │ payload JSON
                                           │ {repo, commit, author,
                                           │  backendImage, frontendImage,
                                           │  environment}
                                           ▼
                            ┌──────────────────────────────┐
                            │  n8n : deploy-and-notify.json  │
                            │  1. reçoit le webhook           │
                            │  2. kubectl set image (backend, │
                            │     frontend) sur le namespace  │
                            │     ciblé                       │
                            │  3. attend le rollout            │
                            │  4. notifie (Slack/Webhook)      │
                            │  5. répond à GitHub Actions      │
                            └───────────────┬──────────────────┘
                                            │
                                            ▼
                            ┌──────────────────────────┐
                            │  Cluster Kubernetes         │
                            │  (staging ou production)    │
                            │  → nouvelles images en ligne │
                            └──────────────────────────┘
```

## Commandes de vérification

```bash
# Santé de l'API
curl http://localhost:4000/api/health

# Créer un compte (crée aussi l'entreprise)
curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{}' # 400 attendu (validation zod)

curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mapme.tn",
    "password": "motdepasse123",
    "role": "admin",
    "entreprise": { "nom": "Ma PME", "matriculeFiscal": "1234567A" }
  }'

# Tests backend
cd apps/backend && npm test

# Tests frontend
cd apps/frontend && npm test
```

## Rôles utilisateurs

| Rôle | Accès |
|---|---|
| `admin` | Accès complet |
| `vendeur` | Produits, stock, clients, factures |
| `comptable` | Clients, factures, tableau de bord (lecture seule sur les produits) |
