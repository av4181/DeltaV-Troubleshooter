# DeltaV Troubleshooter

A web-based troubleshooting assistant for Emerson DeltaV systems. The application guides operators and engineers through structured diagnostic workflows using a decision-tree based knowledge engine.

---

# Overview

DeltaV Troubleshooter helps users identify and resolve process control and automation issues by following a guided troubleshooting path. The application separates troubleshooting knowledge from application logic, allowing knowledge content to be maintained independently from the software implementation.

## Key Objectives

- Reduce troubleshooting time
- Standardize diagnostic procedures
- Capture operational knowledge
- Provide guided fault resolution
- Support DeltaV operators and maintenance engineers

---

# Features

- Interactive troubleshooting workflow
- Decision-tree based diagnostics
- Structured knowledge base
- Guided question-and-answer navigation
- Recommended corrective actions
- Breadcrumb navigation
- Modular architecture
- Extendable knowledge repository

---

# Technology Stack

| Technology | Purpose |
|------------|---------|
| React | User Interface |
| TypeScript | Type Safety |
| Vite | Build and Development Environment |
| JSON | Knowledge Storage |
| CSS | User Interface Styling |

---

# System Architecture

The application follows an MVP-inspired architecture (Model-View-Presenter).

```text
┌────────────────────┐
│        View        │
│ React Components   │
└──────────┬─────────┘
           │
           ▼
┌────────────────────┐
│     Presenter      │
│  Decision Engine   │
└──────────┬─────────┘
           │
           ▼
┌────────────────────┐
│       Model        │
│ Knowledge Objects  │
└──────────┬─────────┘
           │
           ▼
┌────────────────────┐
│   Knowledge Base   │
│     JSON Files     │
└────────────────────┘
```

---

# Architectural Principles

## Separation of Concerns

The application isolates:

- User interface concerns
- Troubleshooting logic
- Domain models
- Knowledge storage

This improves maintainability and allows independent evolution of each layer.

## Knowledge-Driven Design

Troubleshooting logic is largely defined through structured knowledge files rather than hardcoded logic.

Benefits:

- Faster updates
- Easier maintenance
- Reduced development effort
- Better scalability

## Extensibility

New troubleshooting workflows can be added by extending the knowledge base without redesigning the application architecture.

---

# Project Structure

```text
DeltaV-Troubleshooter/
│
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   │
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   │
│   ├── components/
│   │   ├── Breadcrumb.tsx
│   │   ├── InfoCard.tsx
│   │   └── QuestionCard.tsx
│   │
│   ├── engine/
│   │   └── DecisionEngine.ts
│   │
│   ├── knowledge/
│   │   └── operate.json
│   │
│   ├── models/
│   │   ├── Answer.ts
│   │   └── Node.ts
│   │
│   ├── services/
│   │   └── KnowledgeLoader.ts
│   │
│   ├── types/
│   │   └── KnowledgeBase.ts
│   │
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   ├── main.tsx
│   │
│   └── pages/
│
├── User Stories/
│   ├── US-001.txt
│   ├── US-003.txt
│   └── US-004.txt
│
└── README.md
```

---

# MVP Architecture

## View Layer

Responsible for user interaction and presentation.

### Components

#### Breadcrumb.tsx

Displays the user's navigation path through the troubleshooting workflow.

#### QuestionCard.tsx

Displays troubleshooting questions and available answer options.

#### InfoCard.tsx

Displays informational messages, recommendations and troubleshooting guidance.

---

## Presenter Layer

Responsible for application flow and business logic.

### DecisionEngine.ts

The core application engine.

Responsibilities:

- Evaluates user answers
- Determines the next node
- Controls workflow progression
- Returns recommendations
- Maintains troubleshooting state

The Decision Engine acts as the Presenter within the MVP architecture.

---

## Model Layer

Responsible for representing troubleshooting knowledge and domain objects.

### Node.ts

Represents a troubleshooting node within the decision tree.

Typical properties:

- Node Identifier
- Question
- Answers
- Next Node References
- End State Information

Responsibilities:

- Define troubleshooting flow
- Store diagnostic questions
- Connect workflow paths

### Answer.ts

Represents an answer option.

Responsibilities:

- Store answer text
- Determine workflow transitions
- Link recommendations to outcomes

### KnowledgeBase.ts

Defines the complete knowledge repository structure.

Responsibilities:

- Data validation
- Type enforcement
- Knowledge model consistency

---

# Services

## KnowledgeLoader.ts

Responsible for loading troubleshooting content from JSON files.

Responsibilities:

- Load knowledge definitions
- Parse JSON content
- Validate knowledge structures
- Supply the Decision Engine with data

---

# Knowledge Repository

## operate.json

Contains troubleshooting knowledge used by the application.

Typical content includes:

- Questions
- Answers
- Workflow transitions
- Recommendations
- End states
- Informational content

By separating knowledge from software logic, troubleshooting workflows can be maintained without source code changes.

---

# Application Flow

```text
Application Startup
         │
         ▼
KnowledgeLoader
         │
         ▼
Knowledge Base
         │
         ▼
Decision Engine
         │
         ▼
QuestionCard
         │
         ▼
User Selection
         │
         ▼
Next Decision Node
         │
         ├────────► Additional Question
         │
         └────────► Recommendation
```

---

# User Stories

The functional requirements are documented in:

- US-001
- US-003
- US-004

These stories define:

- User goals
- System behavior
- Troubleshooting flows
- Acceptance criteria

---

# Installation

## Prerequisites

- Node.js 20+
- npm 10+

Verify installation:

```bash
node --version
npm --version
```

---

## Clone Repository

```bash
git clone https://github.com/<username>/deltav-troubleshooter.git
cd deltav-troubleshooter
```

---

## Install Dependencies

```bash
npm install
```

---

## Run Development Environment

```bash
npm run dev
```

Default Vite URL:

```text
http://localhost:5173
```

---

## Build for Production

```bash
npm run build
```

Build output:

```text
dist/
```

---

## Preview Production Build

```bash
npm run preview
```

---

# Development Guidelines

## Coding Standards

- TypeScript strict typing
- Component-based architecture
- Separation of concerns
- Reusable UI components
- Knowledge-driven workflows

## Source Control

Recommended branching strategy:

```text
main
 ├── feature/*
 ├── bugfix/*
 └── release/*
```

Commit messages:

```text
feat: add new troubleshooting branch
fix: resolve navigation issue
docs: update architecture section
```

---

# Future Enhancements

Potential roadmap items:

- AI-assisted diagnostics
- RAG-based document retrieval
- DeltaV alarm integration
- Searchable knowledge base
- Equipment specific workflows
- User authentication
- Session history
- Analytics dashboard
- Knowledge authoring tools
- Multi-language support

---

# License

Specify an appropriate project license before public release.

Example:

```text
MIT License
```

or

```text
Copyright © Andreas Van Loon
All Rights Reserved
```

---

# Author

**Andreas Van Loon**

DeltaV Troubleshooter Project

---

# Acknowledgements

Built using:

- React
- TypeScript
- Vite

to provide a maintainable and extensible troubleshooting platform for Emerson DeltaV environments.