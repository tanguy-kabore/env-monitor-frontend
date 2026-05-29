# Secheinon Burkina — Frontend

> **Version 1.0.0-alpha** · Build 20260513-001

Interface web Next.js 15 pour le système national de surveillance environnementale du Burkina Faso.

---

## Structure

```
frontend/
├── src/
│   ├── app/                        # Pages Next.js (App Router)
│   │   ├── layout.tsx              # Layout racine
│   │   ├── ClientLayout.tsx        # Layout client (Sidebar + contenu)
│   │   ├── page.tsx                # Tableau de bord — carte + résumé villes
│   │   ├── weather/page.tsx        # Météo — prévisions 16 j, historique, ML
│   │   ├── floods/page.tsx         # Inondations — débit, risque, carte, ML
│   │   ├── air-quality/page.tsx    # Qualité air — AQI EAQI, polluants, prévisions
│   │   ├── drought/page.tsx        # Sécheresse — SPI, historique, carte
│   │   ├── climate/page.tsx        # Climat — tendances annuelles / saisonnières
│   │   ├── map/page.tsx            # Carte interactive multi-couches
│   │   ├── alerts/page.tsx         # Alertes — actives, historique, stats
│   │   ├── report/page.tsx         # Rapport de synthèse multi-domaines
│   │   ├── export/page.tsx         # Export CSV / JSON des jeux de données
│   │   ├── about/page.tsx          # Documentation, seuils, unités, APIs
│   │   └── system/page.tsx         # Administration et initialisation
│   ├── components/
│   │   ├── Sidebar.tsx             # Navigation + version badge Alpha
│   │   ├── Card.tsx                # Carte avec titre, icône, headerAction
│   │   ├── MapView.tsx             # Carte Leaflet avec points colorés
│   │   ├── LocationSelect.tsx      # Sélecteur de ville
│   │   ├── LoadingSpinner.tsx      # Indicateur de chargement
│   │   └── ClientLayout.tsx        # Wrapper layout client
│   ├── hooks/
│   │   └── useApi.ts               # Hook générique fetch + loading/error
│   └── lib/
│       ├── api.ts                  # Toutes les méthodes API (fetchApi + endpoints)
│       └── utils.ts                # formatNumber, getAqiLabel, formatDate…
├── .env.local / .env.local.example
├── next.config.ts
├── package.json
├── .gitignore
└── README.md
```

---

## Prérequis

- Node.js **18+**
- Backend Secheinon démarré sur `http://localhost:8000`

---

## Installation

```bash
npm install

cp .env.local.example .env.local
```

### Configuration `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

En production, remplacer par l'URL publique du backend déployé (ex. `https://api.ecowatch.bf`).

---

## Lancement

```bash
npm run dev
# Interface : http://localhost:3000
```

### Build production

```bash
npm run build
npm start
```

---

## Pages disponibles

| Route | Description | Données affichées |
|---|---|---|
| `/` | Tableau de bord | Carte nationale, résumé météo/inondations/AQI par ville |
| `/weather` | Météo | Prévisions 16 j, historique, courbes temp./humidité, prédictions ML |
| `/floods` | Inondations | Débit fluvial, risque, carte, historique, prédictions ML |
| `/air-quality` | Qualité de l'air | AQI EAQI, 6 polluants, historique (7–90 j), prévisions CAMS 5 j |
| `/drought` | Sécheresse | Indice SPI, précipitations, carte nationale, KPIs |
| `/climate` | Climat | Tendances long terme, anomalies température, saisonnalité |
| `/map` | Carte interactive | Multi-couches : météo, inondations, AQI, sécheresse |
| `/alerts` | Alertes | Alertes actives, filtres type/sévérité, historique, stats |
| `/report` | Rapport | Synthèse multi-domaines, exportable PDF/impression |
| `/export` | Export données | Catalogue 9 jeux de données, aperçu, téléchargement CSV/JSON |
| `/about` | À propos | Description app, seuils EAQI/GloFAS/SPI, APIs, standards, changelog |
| `/system` | Système | Statut initialisation, santé DB, logs collecte, modèles ML |

---

## Composants clés

### `Sidebar`
- Navigation complète avec icônes Lucide
- Badge version `v1.0.0` + badge type coloré (`Alpha` / `Beta` / `RC` / `Stable`)
- Version chargée dynamiquement depuis `/api/system/config`
- Mode réduit / développé

### `useApi(fn, deps)`
Hook générique qui gère `loading`, `data`, `error` et re-fetch automatique sur changement de dépendances.

### `api.ts`
Client centralisé — toutes les méthodes API typées, baseURL configurable via `NEXT_PUBLIC_API_URL`.

### `MapView`
Carte React-Leaflet avec points colorés, rayon configurable, popups, centrage auto sur le Burkina Faso.

---

## Technologies

| Lib | Version | Rôle |
|---|---|---|
| **Next.js** | 15 | Framework React (App Router, Turbopack) |
| **React** | 18 | UI |
| **TypeScript** | 5 | Typage statique |
| **TailwindCSS** | v4 | Styling utility-first |
| **Recharts** | 2.x | Graphiques (AreaChart, LineChart, BarChart, RadarChart) |
| **React-Leaflet** | 4.x | Cartes interactives |
| **Leaflet** | 1.9 | Moteur de carte |
| **Lucide React** | latest | Icônes SVG |

---

## Licence

Usage gouvernemental — Burkina Faso
