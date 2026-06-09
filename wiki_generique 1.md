# Wiki — Types de tickets & OpenProject

> **Destinataires :** Stagiaires en développement, projets IA
> **Outil principal :** OpenProject
> **Dernière mise à jour :** Mars 2026

---

## Table des matières

1. [OpenProject — présentation et usage](#1-openproject--présentation-et-usage)
2. [Hiérarchie des types de tickets](#2-hiérarchie-des-types-de-tickets)
3. [Définitions détaillées des types de tickets](#3-définitions-détaillées-des-types-de-tickets)
4. [Workflow Git (Git Flow)](#4-workflow-git-git-flow)
5. [Nommage des branches](#5-nommage-des-branches)
6. [Messages de commit (Conventionnal Commits)](#6-messages-de-commit-conventional-commits)
7. [Lier les commits à OpenProject](#7-lier-les-commits-à-openproject)
8. [Cycle de vie d'une feature](#8-cycle-de-vie-dune-feature)
9. [Quand faire un rebase / pull / merge ?](#9-quand-faire-un-rebase--pull--merge-)
10. [Code review](#10-code-review)
11. [Bonnes pratiques de code](#11-bonnes-pratiques-de-code)
12. [La méthode BMAD — Développement agile piloté par l'IA](#12-la-méthode-bmad--développement-agile-piloté-par-lia)
13. [Techniques de prompting recommandées par Anthropic pour Claude](#13-techniques-de-prompting-recommandées-par-anthropic-pour-claude)
14. [Les outils de Claude Code — Plan, Skills, Agents et MCP](#14-les-outils-de-claude-code--plan-skills-agents-et-mcp)

---

## 1. OpenProject — présentation et usage

### Qu'est-ce qu'OpenProject ?

**OpenProject** est un outil de gestion de projet open source, conçu pour les équipes agiles et les projets complexes. Il supporte nativement Scrum, Kanban, et les roadmaps de projet. Contrairement à Jira (propriétaire), OpenProject peut être auto-hébergé.

**URL de notre instance :** *(à renseigner par le responsable d'équipe)*

### Structure d'un projet dans OpenProject

```
Projet
  ├── Activité
  ├── Feuille de route
  ├── Lots de Travaux
  ├── Diagrammes de Gantt
  ├── Wiki (documentation interne)
  ├── Backlogs
  ├── Temps et coûts
  ├── Référentiel
  ├── Membres
  └── Paramètres du projet
```

### Créer un ticket

1. Accéder au projet concerné
2. Cliquer sur **"+ Créer"** dans le menu ou le backlog
3. Choisir le **type** (Epic, User Story, Feature, Task, Bug)
4. Renseigner les champs obligatoires :
   - **Titre** : clair et actionnable
   - **Description** : contexte, critères d'acceptance, liens utiles
   - **Assigné à** : la personne responsable
   - **Sprint / Version** : le sprint cible
   - **Estimation** : en heures ou en points
   - **Priorité** : faible / normale / haute / urgente
5. Lier au ticket parent (la Feature ou User Story parente)

### Les statuts de tickets dans notre workflow

```
New → In progress → Closed → Specified → To review → Stand-by → To be scheduled → Scheduled

```

| Statut | Signification |
|---|---|
| **New** | Ticket créé, non encore traité |
| **In progress** | En cours de traitement |
| **Closed** | Livré et validé par le PO |
| **Specified** | Spécifié, prêt au développement |
| **Stand-by** | En suspens, en attente d'instructions |
| **To be scheduled** | Validé, en attente de planification |
| **Scheduled** | Planifié avec date, ressource |


---


## 2. Hiérarchie des types de tickets

Dans notre organisation, nous utilisons la hiérarchie suivante, **du niveau le plus haut au plus granulaire** :

```
Epic
  └── User Story
        ├── Feature
        └── Task

Bug (transversal — peut interrompre n'importe quel niveau)
```

> ⚠️ Cette hiérarchie diffère de certains standards : chez nous, **la User Story est le niveau stratégique intermédiaire**, et la Feature est sa déclinaison fonctionnelle livrable.

### Vue d'ensemble

| Type | Niveau | Porté par | Horizon temporel |
|---|---|---|---|
| Epic | Stratégique | Product Owner | Plusieurs sprints / mois |
| User Story | Fonctionnel | PO + équipe | 1 à 2 sprints |
| Feature | Technique | Développeur | 1 sprint |
| Task | Technique | Développeur | Quelques heures à 2 jours |
| Bug | Correctif | Équipe | Priorité variable |

---
### Nommage des tickets

| Type | Format | Exemple |
|---|---|---|
| Epic | `Objectif stratégique` | `Assistant conversationnel interne` |
| User Story | `En tant que X, je veux Y` | `En tant que manager, je veux exporter les KPIs` |
| Feature | Verbe + complément fonctionnel | `Exporter les métriques au format CSV` |
| Task | Verbe technique + complément | `Implémenter l'endpoint GET /metrics/export` |
| Bug | `[Module] Comportement anormal` | `[API] Timeout sur les requêtes > 100 résultats` |

---

## 3. Définitions détaillées des types de tickets

### 🟣 Epic

**Définition**
Une Epic est le niveau le plus élevé de la hiérarchie. Elle représente un **grand objectif fonctionnel ou stratégique**, trop vaste pour être livré en un seul sprint. Elle donne le cap et regroupe une ou plusieurs User Stories.

**Caractéristiques**
- Horizon temporel : plusieurs semaines voire plusieurs mois
- Portée par le Product Owner
- Représente une valeur métier ou utilisateur significative
- N'a pas de critères d'acceptance détaillés à ce stade

**Exemples dans un projet IA**
- *"Mise en place d'un système de recommandation personnalisé"*
- *"Création d'un pipeline d'ingestion et de traitement des données clients"*
- *"Déploiement d'un assistant conversationnel interne"*


---

### 🟦 User Story

**Définition**
La User Story est le **niveau fonctionnel intermédiaire** de notre hiérarchie. Elle décrit un besoin utilisateur significatif, formulé de son point de vue. Elle est plus large qu'une Feature mais plus concrète qu'une Epic.

**Caractéristiques**
- Horizon temporel : 1 à 2 sprints
- Co-construite par le PO et l'équipe lors du Backlog Refinement
- Contient les critères d'acceptance de haut niveau
- Peut regrouper plusieurs Features

**Format standard**
> **En tant que** `[type d'utilisateur]`,
> **je veux** `[action ou capacité]`,
> **afin de** `[bénéfice ou valeur attendue]`.

**Exemples**
- *"En tant qu'administrateur, je veux pouvoir consulter les logs des inférences du modèle, afin de diagnostiquer les erreurs en production."*
- *"En tant qu'utilisateur final, je veux recevoir des recommandations pertinentes sur ma page d'accueil, afin de découvrir des produits correspondant à mes intérêts."*

**Critères d'acceptance**
Chaque User Story doit être accompagnée de critères d'acceptance clairs, formulés en langage naturel ou selon le format Gherkin (`Given / When / Then`) :

```
Given un utilisateur connecté
When il accède à sa page d'accueil
Then il voit au moins 5 recommandations issues du moteur IA
And chaque recommandation affiche un score de confiance
```

---

### 🟩 Feature

**Définition**
Une Feature est une **capacité fonctionnelle précise, livrable et testable**, qui contribue à réaliser une User Story. Elle est concrète, délimitée, et peut être développée au cours d'un seul sprint.

**Caractéristiques**
- Horizon temporel : 1 sprint
- Portée par l'équipe de développement
- Peut être décomposée en Tasks
- Doit correspondre à quelque chose de démontrable lors de la Sprint Review

**Exemples**
- *"Endpoint API `/recommendations` retournant les 10 meilleures suggestions pour un utilisateur donné"*
- *"Interface de visualisation des métriques du modèle (précision, rappel, F1)"*
- *"Intégration du modèle fine-tuné dans le pipeline de prédiction"*


---

### 🟡 Task

**Définition**
Une Task n'a généralement pas de valeur directe pour l'utilisateur final mais est nécessaire pour implémenter une Feature.

**Mémo**
La Feature touche au code, tandis que la Task représente une action à réaliser pour développer la Feature (la Task ne touche pas au code).

**Caractéristiques**
- Horizon temporel : quelques heures à 2 jours max
- Portée par un développeur individuel
- Doit être estimée (en heures ou en points)
- Doit être assignée à une personne

**Exemples**
- *"Écrire les tests unitaires du module de scoring"*
- *"Configurer le bucket S3 pour stocker les embeddings"*
- *"Documenter l'API du service de recommandation (OpenAPI)"*
- *"Mettre en place la pipeline de réentraînement hebdomadaire"*

**Règle des 2 jours**
Si une Task prend plus de 2 jours, c'est souvent le signal qu'elle doit être découpée. Une Task trop large cache de la complexité et rend le suivi difficile.

---

### 🔴 Bug

**Définition**
Un Bug est une **anomalie du comportement du système par rapport à son comportement attendu**. Il ne crée pas de nouvelle valeur — il restaure ce qui est censé fonctionner.

**Caractéristiques**
- Transversal : peut survenir à n'importe quel niveau
- Priorité définie selon la sévérité (critique, majeur, mineur)
- Doit être reproductible et documenté
- Peut interrompre le sprint en cours si critique

**Format d'un bon rapport de bug**

```
Titre : [Module] — Description courte du comportement anormal

Environnement : production / staging / local
Version : v1.3.2

Comportement attendu :
Le modèle doit retourner une liste de 10 recommandations.

Comportement observé :
L'API retourne une liste vide lorsque l'utilisateur n'a pas d'historique d'achat.

Étapes pour reproduire :
1. Créer un nouvel utilisateur sans historique
2. Appeler GET /recommendations?user_id=NEW_USER
3. Observer la réponse

Impact : Tous les nouveaux utilisateurs — bloquant pour l'onboarding
```

---

## 4. Workflow Git (Git Flow)

Nous utilisons le modèle **Git Flow** pour organiser notre travail. Voici les branches principales :

```text
main (production)
 │
 └── develop (développement)
      │
      ├── feature/#1007-ajout-filtre     ← Nouvelles fonctionnalités
      ├── feature/#1008-correction-graph  ← Nouvelles fonctionnalités
      │
      ├── hotfix/#1010-fix-crash          ← Corrections urgentes en prod
      │
      └── release/1.2.0                  ← Préparation d'une mise en prod
```

### Description des branches

<figure class="table op-uc-figure_align-center op-uc-figure"><table class="op-uc-table"><thead class="op-uc-table--head"><tr class="op-uc-table--row"><th class="op-uc-table--cell op-uc-table--cell_head"><p class="op-uc-p">Branche</p></th><th class="op-uc-table--cell op-uc-table--cell_head"><p class="op-uc-p">Rôle</p></th><th class="op-uc-table--cell op-uc-table--cell_head"><p class="op-uc-p">Créée depuis</p></th><th class="op-uc-table--cell op-uc-table--cell_head"><p class="op-uc-p">Fusionnée dans</p></th></tr></thead><tbody><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">main</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Code en <strong>production</strong> (VM serveur). Ne jamais commiter directement dessus.</p></td><td class="op-uc-table--cell"><p class="op-uc-p">-</p></td><td class="op-uc-table--cell"><p class="op-uc-p">-</p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">develop</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Branche de <strong>développement</strong>. Contient les dernières fonctionnalités validées.</p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">main</code> (une seule fois)</p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">main</code> (via release)</p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">feature/*</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Développement d'une <strong>nouvelle fonctionnalité</strong> ou correction non-urgente.</p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">develop</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">develop</code></p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">hotfix/*</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Correction <strong>urgente</strong> d'un bug en production.</p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">main</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">main</code> ET <code class="op-uc-code">develop</code></p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">release/*</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Préparation d'une <strong>mise en production</strong>. Tests finaux, corrections mineures.</p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">develop</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">main</code> ET <code class="op-uc-code">develop</code></p></td></tr></tbody></table></figure>

### Schéma visuel du flux

```text
    main ─────●─────────────────────────●─────────── (production)
              │                         ▲
              │                         │ merge
              ▼                         │
  develop ────●───●───●───●───●────●────●─────────── (développement)
                  │       ▲   │    ▲
                  │       │   │    │ merge (--no-ff)
                  ▼       │   ▼    │
  feature/    ····●···●···●   ●··●·● ·············── (feature branches)
  #1007           commit      commit
```

## 5. Nommage des branches

### Format obligatoire

```text
type/#ISSUE_ID-description-courte
```

### Types de branches

<figure class="table op-uc-figure_align-center op-uc-figure"><table class="op-uc-table"><thead class="op-uc-table--head"><tr class="op-uc-table--row"><th class="op-uc-table--cell op-uc-table--cell_head"><p class="op-uc-p">Type</p></th><th class="op-uc-table--cell op-uc-table--cell_head"><p class="op-uc-p">Usage</p></th><th class="op-uc-table--cell op-uc-table--cell_head"><p class="op-uc-p">Exemple</p></th></tr></thead><tbody><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">feature/</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Nouvelle fonctionnalité</p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">feature/#1007-ajout-filtre-date</code></p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">fix/</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Correction de bug (non-urgent)</p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">fix/#1012-correction-calcul-ca</code></p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">hotfix/</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Correction urgente en prod</p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">hotfix/#1015-crash-page-finance</code></p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">refactor/</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Refactoring sans changement fonctionnel</p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">refactor/#1020-reorganisation-css</code></p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">docs/</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Documentation uniquement</p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">docs/#1025-mise-a-jour-readme</code></p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">style/</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Changements visuels/CSS uniquement</p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">style/#1030-responsive-dashboard</code></p></td></tr></tbody></table></figure>

### Règles de nommage

*   Toujours commencer par le **type** suivi d'un `/`
    
*   Toujours inclure le **numéro d'issue OpenProject** précédé de `#`
    
*   La description est en **minuscules**, mots séparés par des **tirets** `-`
    
*   Pas d'accents, pas d'espaces, pas de caractères spéciaux
    
*   Garder la description **courte** (3-5 mots max)
    

### Exemples

```bash
# ✅ Bon
feature/#1007-ajout-filtre-date
fix/#1012-correction-calcul-marge
hotfix/#1015-fix-crash-dashboard
refactor/#1020-split-fichier-finance

# ❌ Mauvais
feature/ajout_du_filtre           # Pas de numéro d'issue
feature/#1007                     # Pas de description
Feature/#1007-Ajout-Filtre        # Pas de majuscules
feature/#1007 ajout filtre        # Pas d'espaces
```

## 6. Messages de commit (Conventional Commits)

### Format obligatoire

```text
type(scope): description courte en anglais (refs #ISSUE_ID)
```

### Types de commit

<figure class="table op-uc-figure_align-center op-uc-figure"><table class="op-uc-table"><thead class="op-uc-table--head"><tr class="op-uc-table--row"><th class="op-uc-table--cell op-uc-table--cell_head"><p class="op-uc-p">Type</p></th><th class="op-uc-table--cell op-uc-table--cell_head"><p class="op-uc-p">Quand l'utiliser</p></th><th class="op-uc-table--cell op-uc-table--cell_head"><p class="op-uc-p">Exemple</p></th></tr></thead><tbody><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">feat</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Ajout d'une <strong>nouvelle fonctionnalité</strong></p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">feat(finance): add date range filter (refs #1007)</code></p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">fix</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p"><strong>Correction</strong> d'un bug</p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">fix(commerce): fix wrong margin calculation (refs #1012)</code></p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">refactor</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p"><strong>Refactoring</strong> (ni feat, ni fix)</p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">refactor(menu): extract date picker component (refs #1020)</code></p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">style</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Changement de <strong>style CSS</strong> uniquement</p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">style(dashboard): improve card layout on mobile (refs #1030)</code></p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">docs</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Modification de <strong>documentation</strong></p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">docs: update installation guide (refs #1025)</code></p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">chore</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Tâches techniques (config, dépendances...)</p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">chore: update PHPSpreadsheet to 2.0 (refs #1040)</code></p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">test</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Ajout ou modification de <strong>tests</strong></p></td><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">test(finance): add unit tests for CA calculation (refs #1050)</code></p></td></tr></tbody></table></figure>

### Scope (portée)

Le scope correspond au **module** touché. Scopes autorisés :

<figure class="table op-uc-figure_align-center op-uc-figure"><table class="op-uc-table"><thead class="op-uc-table--head"><tr class="op-uc-table--row"><th class="op-uc-table--cell op-uc-table--cell_head"><p class="op-uc-p">Scope</p></th><th class="op-uc-table--cell op-uc-table--cell_head"><p class="op-uc-p">Module</p></th></tr></thead><tbody><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">finance</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Module Finances</p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">commerce</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Module Commerce</p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">projet</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Module Projets</p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">performance</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Module Performance</p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">ressource</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Module Ressources</p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">intercontrat</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Module Intercontrat</p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">dashboard</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Dashboard principal</p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">menu</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Menu / Navigation</p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">config</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Configuration</p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">db</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Base de données</p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><i>(vide)</i></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Si le changement est global</p></td></tr></tbody></table></figure>

### Règles

1.  La description est en **anglais**
    
2.  Commence par un **verbe à l'infinitif** (add, fix, update, remove, refactor...)
    
3.  **Pas de point** à la fin
    
4.  **Première lettre en minuscule**
    
5.  **Maximum 72 caractères** pour la première ligne
    
6.  Le `refs #ID` est **toujours à la fin, entre ()** de la première ligne
    

### Exemples complets

```bash
# Feature simple
git commit -m "feat(finance): add BU filter dropdown (refs #1007)"

# Bug fix
git commit -m "fix(commerce): fix NaN display when no data (refs #1012)"

# Refactoring
git commit -m "refactor(dashboard): split dashboard sections into components (refs #1020)"

# Style
git commit -m "style(menu): align navigation items on mobile (refs #1030)"

# Documentation
git commit -m "docs: add developer setup instructions (refs #1025)"

# Avec un corps de message détaillé (si nécessaire)
git commit -m "feat(finance): add year-over-year comparison (refs #1007)

Add A-1 column showing same month from previous year.
Compare current values with last year to show growth trend.
New SQL query added: finance/ca_a1.sql"
```

## 7. Lier les commits à OpenProject

### Mots-clés reconnus par OpenProject

Pour que vos commits apparaissent automatiquement dans les issues OpenProject, utilisez ces mots-clés **dans le message de commit** :

<figure class="table op-uc-figure_align-center op-uc-figure"><table class="op-uc-table"><thead class="op-uc-table--head"><tr class="op-uc-table--row"><th class="op-uc-table--cell op-uc-table--cell_head"><p class="op-uc-p">Mot-clé</p></th><th class="op-uc-table--cell op-uc-table--cell_head"><p class="op-uc-p">Effet</p></th></tr></thead><tbody><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">refs #ID</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Lie le commit à l'issue (le plus courant)</p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">references #ID</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Idem que refs</p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><code class="op-uc-code">IssueID #ID</code></p></td><td class="op-uc-table--cell"><p class="op-uc-p">Idem que refs</p></td></tr></tbody></table></figure>

### Usage recommandé

```bash
# ✅ Recommandé : refs en fin de première ligne
git commit -m "feat(finance): add export button (refs #1007)"

# ✅ OK : références multiples
git commit -m "fix(dashboard): fix layout and data loading  (refs #1007)  (refs #1008)"

# ✅ ACCEPTE : dans le corps du message
git commit -m "feat(commerce): redesign pipeline view

Complete redesign of the commerce pipeline visualization.
(refs #1007)
(references #1008)"

# ❌ Mauvais : pas de lien avec l'issue
git commit -m "feat(finance): add export button"
```

### Vérification

Après avoir poussé ton commit, va sur l'issue dans OpenProject : tu devrais voir le commit lié dans l'onglet **&quot;Repository&quot;** ou **&quot;Activity&quot;** de l'issue.

## 8. Cycle de vie d'une feature

Voici le workflow complet, étape par étape, pour développer une fonctionnalité :

### Étape 1 : Prendre une issue dans OpenProject

1.  Va sur le **Board** ou la **liste des Work Packages** dans OpenProject
    
2.  Assigne-toi l'issue (ou vérifie qu'elle t'est assignée)
    
3.  Passe le statut de l'issue à **&quot;In Progress&quot;**
    
4.  Note le **numéro de l'issue** (ex: `#1007`)
    

### Étape 2 : Créer ta branche

```bash
# 1. Se placer sur develop et récupérer les dernières modifications
git checkout develop
git pull origin develop

# 2. Créer ta branche feature
git checkout -b feature/#1007-ajout-filtre-date
```

### Étape 3 : Développer

*   Fais tes modifications
    
*   Commite **régulièrement** (au moins 1 commit par sous-tâche logique)
    
*   Chaque commit doit contenir `refs #1007`
    

```bash
# Ajouter les fichiers modifiés
git add dashboard/section_dashbord/section_finance.php
git add dashboard/style/section_finance.css

# Commiter
git commit -m "feat(finance): add date filter UI  (refs #1007)"

# ... continue de travailler ...

git add dashboard/requete_php/finance.php
git commit -m "feat(finance): apply date filter to SQL queries  (refs #1007)"
```

### Étape 4 : Pousser ta branche

```bash
# Pousser ta branche sur le dépôt distant
git push origin feature/#1007-ajout-filtre-date
```

### Étape 5 : Synchroniser avec develop (si nécessaire)

Si d'autres modifications ont été faites sur `develop` pendant que tu travaillais :

```bash
# Récupérer les dernières modifications de develop
git checkout develop
git pull origin develop

# Revenir sur ta branche et merger develop dedans
git checkout feature/#1007-ajout-filtre-date
git merge develop

# Résoudre les conflits s'il y en a, puis :
git push origin feature/#1007-ajout-filtre-date
```

### Étape 6 : Demander un merge (ou merger)

**Si review requise :**

1.  Crée une **merge request** dans OpenProject/Git
    
2.  Décris les changements effectués
    
3.  Attends la validation de ton tuteur
    

**Si pas de review (feature simple) :**

```bash
# Se placer sur develop
git checkout develop

# Merger la feature avec un commit de merge
git merge --no-ff feature/#1007-ajout-filtre-date

# Pousser develop
git push origin develop
```

> L'option `--no-ff` (no fast-forward) est **obligatoire**. Elle crée un commit de merge qui conserve l'historique de la branche.

### Étape 7 : Nettoyer (si demandé par le tuteur)

```bash
# Supprimer la branche locale
git branch -d feature/#1007-ajout-filtre-date

# Supprimer la branche distante
git push origin --delete feature/#1007-ajout-filtre-date
```

### Étape 8 : Mettre à jour OpenProject

1.  Passe le statut de l'issue à **&quot;Resolved&quot;** ou **&quot;Closed&quot;**
    
2.  Vérifie que les commits sont bien liés à l'issue
    

## 9. Quand faire un rebase / pull / merge ?

### `git pull` — Récupérer les modifications distantes

**Quand :** Avant de commencer à travailler, chaque matin, ou avant de créer une branche.

```bash
# Sur develop, récupérer les dernières modifications
git checkout develop
git pull origin develop
```

> **Règle :** Toujours faire un `git pull` sur `develop` AVANT de créer une nouvelle branche feature.

### `git merge` — Fusionner une branche dans une autre

**Quand :**

*   Pour intégrer `develop` dans ta feature branch (se synchroniser)
    
*   Pour intégrer ta feature branch dans `develop` (quand la feature est terminée)
    

```bash
# Intégrer develop dans ta feature (synchronisation)
git checkout feature/#1007-ajout-filtre-date
git merge develop

# Intégrer ta feature dans develop (finalisation)
git checkout develop
git merge --no-ff feature/#1007-ajout-filtre-date
```

> **Toujours utiliser** `**--no-ff**` quand tu merges une feature dans develop.

### `git rebase` — Réécrire l'historique

**Quand :** Le rebase est **à éviter au début**. Il réécrit l'historique des commits et peut causer des problèmes si mal utilisé.

**Cas exceptionnels où on peut l'utiliser :**

*   Pour nettoyer tes commits AVANT de faire un merge (squash interactif)
    
*   Si ton tuteur te le demande explicitement
    

> ⚠️ **Règle d'or :** Ne JAMAIS faire un rebase sur une branche partagée (`main` ou `develop`). Le rebase ne doit être fait que sur ta propre branche feature, et uniquement si elle n'a pas été partagée.

### Résumé

```text
Situation                              Action recommandée
─────────────────────────────────────────────────────────
Début de journée                    →  git pull origin develop
Créer une nouvelle feature          →  git checkout -b feature/...
Develop a avancé pendant mon dev    →  git merge develop (dans ta feature)
Ma feature est terminée             →  git merge --no-ff (dans develop)
Correction urgente en prod          →  hotfix depuis main
```

## 10. Code review

### Politique de review

La review est **obligatoire pour les fonctionnalités critiques** et **recommandée pour le reste**.

<figure class="table op-uc-figure_align-center op-uc-figure"><table class="op-uc-table"><thead class="op-uc-table--head"><tr class="op-uc-table--row"><th class="op-uc-table--cell op-uc-table--cell_head"><p class="op-uc-p">Type de modification</p></th><th class="op-uc-table--cell op-uc-table--cell_head"><p class="op-uc-p">Review obligatoire ?</p></th></tr></thead><tbody><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p">Nouvelle fonctionnalité majeure</p></td><td class="op-uc-table--cell"><p class="op-uc-p"><strong>Oui</strong></p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p">Modification de requêtes SQL</p></td><td class="op-uc-table--cell"><p class="op-uc-p"><strong>Oui</strong></p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p">Modification de la configuration/connexion</p></td><td class="op-uc-table--cell"><p class="op-uc-p"><strong>Oui</strong></p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p">Correction de bug simple</p></td><td class="op-uc-table--cell"><p class="op-uc-p">Non (mais recommandée)</p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p">Changement CSS/style mineur</p></td><td class="op-uc-table--cell"><p class="op-uc-p">Non</p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p">Documentation</p></td><td class="op-uc-table--cell"><p class="op-uc-p">Non</p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p">Nouvelle fonctionnalité mineure</p></td><td class="op-uc-table--cell"><p class="op-uc-p">Non</p></td></tr></tbody></table></figure>

### Comment demander une review

1.  Pousse ta branche sur le dépôt distant
    
2.  Préviens ton tuteur en indiquant :
    
    *   Le **numéro de l'issue** OpenProject
        
    *   Le **nom de la branche**
        
    *   Un **résumé des modifications**
        
3.  Attends son retour avant de merger dans `develop`
    

### Checklist de review

Avant de demander une review (ou avant de merger toi-même), vérifie :

*   [ ] Le code fonctionne en local
*   [ ] Les requêtes SQL sont correctes (pas d'injection, paramètres bien remplacés)
*   [ ] L'affichage est correct sur le navigateur
*   [ ] Les messages de commit suivent le format Conventional Commits
*   [ ] Tous les commits contiennent `refs #ID`
*   [ ] Pas de fichier sensible (config\_info\_connection.php, mots de passe)
*   [ ] Pas de `console.log()` ou `var_dump()` oublié dans le code

## 11. Bonnes pratiques de code

### PHP

```php
// ✅ Bon : nommage clair, commentaire utile
$chiffre_affaires = getCA($start_date, $end_date, $bu);

// ❌ Mauvais : nommage obscur, pas de contexte
$x = f($a, $b, $c);
```

*   Utiliser des **noms de variables explicites** en français ou anglais (cohérent)
    
*   **Indenter avec 4 espaces** (pas de tabulations)
    
*   Ne pas laisser de `var_dump()`, `print_r()` ou `echo` de debug
    
*   Fermer les connexions BDD quand elles ne sont plus nécessaires
    

### SQL

```sql
-- ✅ Bon : requête lisible et indentée
SELECT
    ca.montant,
    ca.date_facturation,
    bu.nom
FROM chiffre_affaires ca
INNER JOIN business_unit bu ON ca.bu_id = bu.id
WHERE ca.date_facturation BETWEEN '{start_date}' AND '{end_date}'
    AND bu.code = '{bu}'
ORDER BY ca.date_facturation;

-- ❌ Mauvais : tout sur une ligne
SELECT ca.montant,ca.date_facturation,bu.nom FROM chiffre_affaires ca INNER JOIN business_unit bu ON ca.bu_id=bu.id WHERE ca.date_facturation BETWEEN '{start_date}' AND '{end_date}' AND bu.code='{bu}' ORDER BY ca.date_facturation;
```

*   **Mots-clés SQL en majuscules** (SELECT, FROM, WHERE, etc.)
    
*   **Indenter** les clauses pour la lisibilité
    
*   **Commenter** les requêtes complexes (en haut du fichier .sql)
    
*   Un fichier `.sql` = une requête = un objectif clair
    

### JavaScript

```javascript
// ✅ Bon : fonction nommée avec son rôle
function updateFinanceSection(data) {
    document.getElementById('ca-value').textContent = data.ca;
}

// ❌ Mauvais : fonction anonyme, nommage flou
var f = function(d) {
    document.getElementById('x').innerHTML = d.a;
}
```

*   Utiliser `const` et `let` (jamais `var`)
    
*   Préférer `textContent` à `innerHTML` (sécurité XSS)
    
*   Nommer les fonctions clairement en **camelCase**
    
*   Ne pas laisser de `console.log()` en production
    

### CSS

```css
/* ✅ Bon : sélecteur explicite, commentaire de section */
/* --- Section Finance --- */
.finance-card {
    display: flex;
    align-items: center;
    gap: 1rem;
}

/* ❌ Mauvais : sélecteur trop générique */
div {
    margin: 10px;
}
```

*   Utiliser des **classes CSS** (pas d'IDs pour le style)
    
*   Nommer les classes en **kebab-case** (ex: `finance-card`)
    
*   Organiser le CSS par **section/module**
    
*   Commenter les grandes sections du fichier
    

### Fichiers

*   **1 fichier = 1 responsabilité**
    
*   Respecter l'arborescence existante du projet
    
*   Mettre les requêtes SQL dans `all_requete_sql/{module}/`
    
*   Mettre le CSS dans le fichier CSS du module correspondant
    
*   Ne pas créer de fichiers &quot;fourre-tout&quot;
    

### Sécurité

*   **Ne JAMAIS commiter** `config_info_connection.php` ou tout fichier contenant des mots de passe
    
*   Vérifier le `.gitignore` avant chaque push
    
*   Être vigilant avec les requêtes SQL (risque d'injection)
    
*   Ne pas exposer de données sensibles dans les logs
    

*Ce wiki est un document vivant. Toute suggestion d'amélioration est la bienvenue — ouvrir un ticket de type Task dans OpenProject avec le tag `wiki`.*
---
## 12. La méthode BMAD — Développement agile piloté par l'IA

### Qu'est-ce que BMAD ?

**BMAD** (*Breakthrough Method for Agile AI-Driven Development*) est un framework open source qui structure le développement logiciel assisté par IA en s'appuyant sur des **agents spécialisés**, des **workflows guidés**, et une approche **documentation-first**.

Là où l'utilisation non structurée de l'IA produit des résultats imprévisibles, BMAD transforme Claude Code en une équipe de développement organisée, avec 21 agents spécialisés, plus de 50 workflows guidés, et une approche documentation-first qui réduit drastiquement les hallucinations. 

L'idée centrale : au lieu de vibe-coder en espérant un bon résultat, **BMAD force l'IA à suivre une spécification documentée** — exactement comme on travaille avec une équipe humaine en Scrum.

---

### Les agents disponibles

Chaque agent incarne un rôle précis du cycle de développement :

| Agent | Rôle |
|---|---|
| **Analyst** | Exploration du problème, hypothèses, recherche |
| **Product Manager** | PRD, vision produit, épics |
| **Architect** | Choix techniques, design système |
| **Scrum Master** | Sprint planning, découpage en stories |
| **Developer** | Implémentation des stories |
| **QA** | Tests, validation, critères de qualité |
| **UX Designer** | Expérience utilisateur |
| **Builder** | Création d'agents et workflows personnalisés |

Le **Party Mode** permet de convoquer plusieurs agents dans une même session pour collaborer, débattre d'une décision d'architecture ou planifier une feature ensemble. 

---

### Le workflow type

BMAD sépare deux phases distinctes :

**1. Phase de planification** *(dans claude.ai ou une interface web)*
```
/product-brief   → Définir le problème et le périmètre MVP
/prd             → Rédiger le PRD complet
/architecture    → Concevoir l'architecture technique
/solutioning-gate-check  → Validation qualité (seuil 90%)
```

**2. Phase de développement** *(dans Claude Code / IDE)*
```
/sprint-planning → Organiser le sprint
/create-story    → Créer les stories atomiques
/dev-story       → Implémenter story par story
```

> Chaque story est un fichier Markdown autonome contenant tout ce dont l'agent Dev a besoin : contexte, critères d'acceptance, notes de l'architecte. C'est ce mécanisme qui garantit la continuité entre sessions.

---

### Modes d'utilisation

**Option A — Terminal + Claude Code**
Installation via npm, utilisation en ligne de commande. Idéal pour automatiser les workflows et intégrer BMAD dans des pipelines CI/CD.
```bash
npx bmad-method install
# puis dans ton projet :
claude  # ouvre Claude Code dans le terminal
```

**Option B — VS Code + Claude Code**
L'installation intègre BMAD avec les environnements de développement populaires incluant VS Code, Cursor, et Claude Code. L'installateur détecte automatiquement la plateforme et configure le framework en conséquence — l'ensemble du processus prend environ 30 secondes. 
Le plugin apparaît directement dans le panneau Claude Code de VS Code, avec accès aux slash commands depuis l'éditeur.

**Option C — Claude Code (plugin natif)**
Installation directe comme plugin Claude Code, sans passer par npm :
```bash
claude plugin install bmad@bmad-method
# Initialiser dans le projet :
/bmad:init
```
C'est le mode le plus intégré : les agents, skills et commandes sont gérés nativement par Claude Code.

**Option D — Directement dans claude.ai**
Pour la phase de planification uniquement (PRD, architecture). On copie les fichiers d'agents dans le contexte de la conversation et on interagit sans aucun outil installé. Utile pour démarrer un projet ou explorer BMAD sans setup technique.

---

### Lien avec notre workflow agile

BMAD s'articule naturellement avec les types de tickets OpenProject vus plus haut :

| BMAD | OpenProject |
|---|---|
| `/product-brief` | → génère des **Epics** |
| `/prd` | → détaille les **User Stories** |
| `/create-story` | → crée des **Features** et **Tasks** |
| Story files | → liés aux tickets via référence `#ID` |

> 📎 Ressources : [github.com/bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) · [docs.bmad-method.org](https://docs.bmad-method.org)

---

## 13. Techniques de prompting recommandées par Anthropic pour Claude

> Ce bloc est basé sur la documentation officielle d'Anthropic :
> [docs.anthropic.com/prompt-engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

Claude n'est pas une boîte noire magique. La qualité de ce qu'il produit dépend directement de la qualité de ce qu'on lui demande. Maîtriser le prompting, c'est une compétence à part entière — et dans nos projets IA, elle est aussi importante que savoir coder.

---

### Principe fondamental : traiter Claude comme un collaborateur expert, pas comme un moteur de recherche

Pense au prompt engineering comme à donner des instructions à un brillant nouvel employé qui n'a aucun contexte sur ton projet. Plus tu es clair, meilleures seront ses performances. 

Claude n'infère pas ce que tu veux dire. Il exécute ce que tu lui demandes. La majorité des résultats décevants viennent d'un manque de clarté, pas d'une limite du modèle.


---

### Être clair et direct

Claude répond bien à des instructions claires et explicites. Être précis sur ce que tu attends peut significativement améliorer les résultats. Si tu veux un comportement "au-delà de l'attendu", demande-le explicitement plutôt que d'espérer que le modèle l'infère depuis des prompts vagues. 

**Ce qu'il faut faire :**

- Utiliser des verbes d'action précis : *"Rédige"*, *"Liste"*, *"Compare"*, *"Résume en 3 points"*
- Spécifier le format de sortie attendu : JSON, markdown, tableau, liste numérotée
- Préciser la longueur : *"en 2 paragraphes"*, *"en moins de 200 mots"*
- Préciser le public : *"pour un développeur junior"*, *"pour un client non technique"*

**Exemples :**
```
❌ "Parle-moi de ce bug"

✅ "Analyse ce stack trace Python et explique en 3 points :
   1. La cause racine probable
   2. Les fichiers impactés
   3. Une stratégie de correction"
```

---

### Donner du contexte et expliquer le "pourquoi"

Fournir du contexte ou la motivation derrière tes instructions — expliquer à Claude *pourquoi* un comportement est important — aide les modèles Claude à mieux comprendre tes objectifs et à délivrer des réponses plus ciblées. 

Claude est suffisamment intelligent pour généraliser à partir d'une explication. Lui dire le contexte d'usage change profondément la qualité de la réponse.
```
❌ "Ne mets pas de gras dans ta réponse."

✅ "Ne mets pas de gras dans ta réponse, car ce texte sera
   lu par un moteur de synthèse vocale qui ne sait pas
   interpréter le formatage Markdown."
```

---

### Le multishot prompting (donner des exemples)

Les exemples sont ton raccourci secret pour obtenir de Claude exactement ce dont tu as besoin. En fournissant quelques exemples bien construits dans ton prompt, tu peux améliorer considérablement la précision, la cohérence et la qualité des sorties. Cette technique, connue sous le nom de few-shot ou multishot prompting, est particulièrement efficace pour les tâches qui nécessitent des sorties structurées ou le respect de formats spécifiques. 

**Structure type :**
```
Voici comment je veux que tu formattes les résultats :

<examples>
  <example>
    <input>Erreur : KeyError sur la ligne 42 du module auth.py</input>
    <output>
    Type: Bug
    Module: auth
    Priorité: Haute
    Action: Vérifier l'existence de la clé avant accès
    </output>
  </example>
  <example>
    <input>Ajouter un bouton d'export CSV sur le tableau de bord</input>
    <output>
    Type: Feature
    Module: dashboard
    Priorité: Normale
    Action: Créer ticket Feature dans OpenProject
    </output>
  </example>
</examples>

Maintenant, traite ce nouveau cas :
<input>L'API /predict timeout après 30 secondes sous forte charge</input>
```

**Règles d'or du multishot :**
- 2 à 5 exemples suffisent généralement
- Les exemples doivent couvrir les cas limites ou ambigus
- Les exemples négatifs (ce qu'il ne faut pas faire) sont aussi utiles

---

### La chaîne de pensée (Chain of Thought)

Encourager le modèle à raisonner étape par étape améliore la précision, en particulier pour les tâches complexes. Les balises `<thinking>` et `<answer>` aident à structurer le raisonnement interne du modèle et la réponse finale. 

Cette technique est particulièrement utile pour nos projets IA sur des tâches de : diagnostic de modèle, choix d'architecture, analyse de résultats d'expériences, debugging.

**Application simple :**
```
Avant de me donner ta réponse finale, raisonne étape par étape
dans des balises <thinking>, puis donne ta conclusion dans <answer>.

Problème : notre modèle de classification atteint 94% d'accuracy
sur le jeu de validation, mais seulement 71% en production.
Quelles sont les causes probables et comment les investiguer ?
```

**Quand l'utiliser :**
- Problèmes multi-étapes (debugging, architecture, stratégie)
- Tâches mathématiques ou logiques
- Décisions impliquant plusieurs facteurs contradictoires
- Quand tu veux pouvoir auditer le raisonnement de Claude

---

### Assigner un rôle (Role Prompting)

Utiliser le role prompting avec Claude peut grandement améliorer ses performances en lui donnant un rôle spécifique via le paramètre système. Cette technique transforme Claude d'un assistant généraliste en un expert virtuel adapté à la tâche. 

En pratique, définir un rôle précis dans le system prompt (ou en début de conversation) change le registre, le niveau de technicité et le style des réponses.

**Exemples de rôles utiles dans nos projets :**
```
"Tu es un ingénieur ML senior spécialisé en NLP,
avec une expertise particulière sur les transformers
et les pipelines de fine-tuning. Tes réponses sont
précises, techniques, et tu signales systématiquement
les risques et limites de chaque approche."
```
```
"Tu es un Product Owner expérimenté en méthodes agiles.
Tu aides à rédiger des User Stories selon le format standard,
avec des critères d'acceptance en format Gherkin.
Tu challenges les demandes trop vagues."
```

**Bonnes pratiques :**
- Préciser le domaine d'expertise et le niveau
- Indiquer le style de communication souhaité
- Mentionner les comportements attendus (ex : "toujours signaler les limites")

---

### Le prompt chaining (décomposer les tâches complexes)

Quand on travaille sur des tâches complexes, Claude peut parfois rater si on essaie de tout gérer dans un seul prompt. La chaîne de prompts consiste à décomposer des tâches complexes en sous-tâches plus petites et gérables. 

Le prompt chaining permet d'itérer sur un prompt en plusieurs étapes. Chaque nouveau prompt peut inclure les paires prompt-réponse précédentes pour construire sur le contexte. Cette technique te permet de guider Claude à travers un processus en le sollicitant, en recevant une réponse, et en enrichissant le prompt à chaque interaction. 

**Exemple en contexte IA :**

Au lieu d'un seul prompt "analyse ces données et entraîne un modèle", découper en :
```
Étape 1 → "Analyse la distribution de ces données et identifie
           les problèmes de qualité potentiels"

Étape 2 → [en incluant la réponse de l'étape 1]
           "Sur la base de cette analyse, propose 3 stratégies
           de preprocessing et compare leurs avantages"

Étape 3 → [en incluant les réponses précédentes]
           "Pour la stratégie X retenue, génère le code Python
           de preprocessing avec sklearn"
```

**Quand chaîner :**
- Tâches avec des étapes naturellement séquentielles
- Quand chaque étape dépend du résultat de la précédente
- Pour valider humainement entre les étapes (recommandé pour le code en production)

---

> 💡 **Règle pratique :** avant de conclure qu'un résultat est insuffisant, montre ton prompt à un collègue. S'il est lui-même confus sur ce que tu demandes, Claude l'est aussi. Corriger cette ambiguïté résout la majorité des problèmes — sans aucun coût supplémentaire.

---

*Documentation de référence complète : [docs.anthropic.com/prompt-engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)*

---

## 14. Les outils de Claude Code — Plan, Skills, Agents et MCP

> Claude Code n'est pas seulement un assistant de génération de code. C'est un environnement complet qui expose des outils permettant de structurer, automatiser et étendre ton workflow de développement. Cette section présente les quatre outils les plus puissants à connaître.

---

### Le mode Plan

Le **mode Plan** permet à Claude de réfléchir à une tâche complexe *avant* de l'exécuter. Au lieu de générer du code immédiatement, Claude formule une stratégie, identifie les fichiers impliqués, liste les étapes et anticipe les points de friction — puis soumet ce plan pour validation.

**Quand l'utiliser :**
- Avant de démarrer une feature qui touche plusieurs fichiers
- Quand la tâche est ambiguë ou comporte des risques (migrations, refactoring)
- Pour aligner Claude sur une architecture avant qu'il commence à écrire

**Comment l'activer :**

Dans Claude Code, utilise la commande `/plan` ou active le mode via le menu :
```
/plan  →  Claude décrit ce qu'il va faire, étape par étape, sans modifier de fichier
```

> La valeur du mode Plan vient précisément du fait que **Claude ne touche rien** tant que tu n'as pas validé. C'est la barrière de sécurité la plus simple pour éviter les modifications non souhaitées sur une base de code existante.

**Exemple de sortie typique :**
```
Mode Plan activé.

Tâche : Ajouter l'authentification JWT à l'API Flask.

Étapes prévues :
1. Lire auth.py et app.py pour comprendre la structure actuelle
2. Ajouter la dépendance flask-jwt-extended dans requirements.txt
3. Créer un endpoint /login qui retourne un token signé
4. Ajouter un décorateur @jwt_required sur les routes protégées
5. Mettre à jour les tests unitaires dans tests/test_auth.py

Fichiers impactés : auth.py, app.py, requirements.txt, tests/test_auth.py
Risques identifiés : casser les sessions existantes → migration à documenter

Valider pour continuer ?
```

---

### Les Skills (commandes personnalisées)

Les **Skills** sont des commandes réutilisables, déclenchées par un slash command (`/nom-du-skill`), qui encapsulent un comportement ou une expertise spécifique. Ils permettent de transformer des tâches répétitives en une seule invocation.

**Skills natifs courants :**

| Commande | Ce qu'elle fait |
|---|---|
| `/commit` | Génère un commit conventionnel en analysant le diff |
| `/review-pr` | Analyse une Pull Request et liste les points d'amélioration |
| `/simplify` | Relit le code modifié et suggère des simplifications |
| `/pdf` | Traite un fichier PDF (extraction, résumé, conversion) |
| `/docx` | Génère ou manipule un document Word |

**Créer un skill personnalisé :**

Un skill est un fichier Markdown stocké dans `~/.claude/skills/` ou `.claude/skills/` (niveau projet). Il contient un prompt système + des instructions de déclenchement.

```markdown
---
name: code-review-fr
description: Revue de code en français avec focus sécurité et lisibilité
trigger: /review
---

Tu effectues une revue de code en français.
Tu identifies systématiquement :
1. Les problèmes de sécurité (injections, exposition de données)
2. Les violations des bonnes pratiques du projet
3. Les opportunités de simplification

Format de sortie : liste numérotée, par ordre de priorité.
```

> Les skills sont particulièrement utiles en équipe : un skill défini dans `.claude/skills/` du repo est partagé avec tous les contributeurs dès le clone.

---

### Les sous-agents (mode multi-agents)

Claude Code peut lancer des **sous-agents** — des instances parallèles de Claude auxquelles il délègue des sous-tâches indépendantes. Chaque agent travaille dans son propre contexte, puis renvoie son résultat à l'agent principal.

**Cas d'usage typiques :**

- Explorer plusieurs parties d'un codebase simultanément
- Exécuter des recherches en parallèle (documentation, fichiers de config, tests)
- Séparer la phase d'exploration (lecture de fichiers) de la phase d'écriture

**Types d'agents disponibles :**

| Agent | Spécialité |
|---|---|
| `general-purpose` | Tâches multi-étapes, recherche de code, exploration |
| `Explore` | Recherche rapide dans la base de code (fichiers, patterns, mots-clés) |
| `Plan` | Conception d'une stratégie d'implémentation |
| `claude-code-guide` | Questions sur Claude Code lui-même (features, réglages, API) |

**Ce que ça change en pratique :**

Sans agents, Claude lit les fichiers séquentiellement. Avec des sous-agents, il peut analyser `auth.py`, `models.py` et `tests/` en parallèle — ce qui réduit le temps de traitement et préserve la fenêtre de contexte principale pour l'essentiel.

> En mode autonome étendu (quand tu autorises Claude à agir sans confirmation), les sous-agents permettent de traiter des tâches complexes de bout en bout : exploration → plan → implémentation → validation.

---

### Les MCP — Model Context Protocol

Le **MCP** (Model Context Protocol) est le mécanisme par lequel Claude peut se connecter à des **outils et services externes** : bases de données, APIs tierces, navigateurs, systèmes de fichiers distants, outils métiers.

**Principe :**

Un serveur MCP expose des "outils" (tools) que Claude peut invoquer comme il invoque ses outils natifs. Tu déclares les serveurs MCP dans la configuration de Claude Code (`~/.claude/mcp_servers.json` ou dans `.claude/settings.json`), et ils deviennent immédiatement disponibles dans la conversation.

**Exemples de serveurs MCP utiles :**

| Serveur MCP | Ce qu'il apporte |
|---|---|
| `mcp-server-figma` | Lire les designs Figma directement dans Claude |
| `mcp-server-postgres` | Interroger une base PostgreSQL en langage naturel |
| `mcp-server-github` | Créer des issues, lire des PRs, gérer des branches |
| `mcp-server-slack` | Envoyer des messages, lire des canaux |
| `mcp-server-filesystem` | Accéder à des répertoires hors du projet courant |

**Configuration type (dans `.claude/settings.json`) :**
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://localhost/monprojet"
      }
    }
  }
}
```

**Intérêt dans nos projets IA :**

Les MCP permettent de connecter Claude directement à nos sources de données (bases MySQL, APIs internes, dashboards) pour passer d'une IA qui *écrit du code d'accès aux données* à une IA qui *interroge directement les données* pour analyser, valider, ou générer des rapports.

> Le MCP est le pont entre Claude et ton écosystème technique. Bien configuré, il évite le copier-coller manuel de résultats entre outils et permet des workflows entièrement automatisés.

---

> 💡 **Récapitulatif pratique**
>
> | Outil | Quand l'utiliser |
> |---|---|
> | **Mode Plan** | Avant toute tâche risquée ou multi-fichiers |
> | **Skills** | Pour standardiser des tâches répétitives en équipe |
> | **Sous-agents** | Pour explorer ou traiter plusieurs contextes en parallèle |
> | **MCP** | Pour connecter Claude à tes outils et données existants |

---

*Documentation de référence : [docs.anthropic.com/claude-code](https://docs.anthropic.com/en/docs/claude-code/overview)*

