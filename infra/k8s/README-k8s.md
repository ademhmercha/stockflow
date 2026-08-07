# Déploiement Kubernetes de StockFlow

> **Cluster local : Minikube (driver Docker).** Ce projet est prévu pour
> fonctionner avec Minikube en local — c'est l'outil documenté et testé ici.
> La configuration `production` (overlay Kustomize, images GHCR) reste
> inchangée et s'applique telle quelle à un cluster managé cloud (EKS, GKE,
> AKS...) : rien de spécifique à Minikube n'y est codé en dur.

Ce dossier contient les manifests Kubernetes organisés avec **Kustomize** :

```
k8s/
├── base/               # Ressources communes à tous les environnements
└── overlays/
    ├── staging/        # Surcharges pour l'environnement de staging
    └── production/     # Surcharges pour l'environnement de production
```

## 1. Prérequis

- [Minikube](https://minikube.sigs.k8s.io/) v1.38.1+
- `kubectl` v1.34.1+
- `kustomize` (intégré à `kubectl apply -k`)

## 2. Créer un cluster local avec Minikube

```bash
minikube start -p stockflow --driver=docker

# Activer l'addon ingress (installe et configure ingress-nginx pour vous)
minikube addons enable ingress -p stockflow

kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

## 3. Construire les images directement dans le daemon Docker de Minikube

Plutôt que de builder puis charger l'image séparément (`minikube image load`),
la méthode recommandée est de pointer votre `docker build` vers le daemon
Docker interne de Minikube : l'image est alors immédiatement visible du
cluster, sans étape de transfert supplémentaire.

```bash
eval $(minikube docker-env -p stockflow)

docker build -f infra/docker/Dockerfile.backend --target production -t stockflow-backend:local .
docker build -f infra/docker/Dockerfile.frontend --target production -t stockflow-frontend:local .
```

> ⚠️ **`eval $(minikube docker-env -p stockflow)` ne modifie que le terminal
> courant.** Rouvrez un nouveau terminal (ou une nouvelle session) et relancez
> cette commande avant tout nouveau `docker build`, sinon l'image sera
> construite dans votre daemon Docker local habituel et restera invisible du
> cluster Minikube.
>
> Alternative si vous préférez garder votre daemon Docker habituel : builder
> normalement puis charger l'image explicitement avec
> `minikube image load stockflow-backend:local -p stockflow` (et de même pour
> le frontend).

Puis dans `infra/k8s/overlays/staging/kustomization.yaml`, pointez temporairement
les `images:` vers `stockflow-backend:local` / `stockflow-frontend:local`.

## 4. Fournir les secrets

Chaque overlay a besoin d'un fichier `secrets.yaml` (non commité) :

```bash
cp infra/k8s/overlays/staging/secrets.example.yaml infra/k8s/overlays/staging/secrets.yaml
# éditer secrets.yaml avec de vraies valeurs
```

## 5. Déployer

```bash
kubectl apply -k infra/k8s/overlays/staging
```

Vérifier le déploiement :

```bash
kubectl get pods -n stockflow-staging
kubectl get ingress -n stockflow-staging
```

## 6. Accéder à l'application

Récupérez l'IP du cluster Minikube :

```bash
minikube ip -p stockflow
```

Ajoutez une entrée dans `/etc/hosts` (ou l'équivalent Windows
`C:\Windows\System32\drivers\etc\hosts`) pointant vers **cette IP** (pas
forcément `127.0.0.1` avec le driver Docker) :

```
<IP retournée par minikube ip>  staging.stockflow.example.com
```

Puis ouvrez `http://staging.stockflow.example.com`.

> ℹ️ **Si ça ne répond pas** : avec le driver Docker (notamment sous Windows
> et macOS), l'IP de `minikube ip` n'est pas toujours directement routable
> depuis la machine hôte selon la configuration réseau de Docker Desktop.
> Dans ce cas, ouvrez un terminal séparé (droits administrateur requis) et
> laissez tourner :
>
> ```bash
> minikube tunnel -p stockflow
> ```
>
> Cette commande crée une route locale vers les services `LoadBalancer`/`Ingress`
> du cluster. Une fois le tunnel actif, utilisez `127.0.0.1` dans `/etc/hosts`
> au lieu de l'IP de `minikube ip`.

## 7. Déploiement en production (cluster cloud)

Le même overlay `production` s'applique à un cluster managé (EKS, GKE, AKS...) :

1. Pousser les images vers GHCR via le workflow `deploy.yml` (voir la racine du repo).
2. Mettre à jour le tag d'image dans `overlays/production/kustomization.yaml` si vous ne
   suivez pas `latest`.
3. Fournir un vrai `secrets.yaml` (idéalement via un gestionnaire de secrets externe).
4. `kubectl apply -k infra/k8s/overlays/production`

## 8. Nettoyage

```bash
kubectl delete -k infra/k8s/overlays/staging
minikube delete -p stockflow
```
