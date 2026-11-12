# DeltaV Troubleshooter

Een AI-ondersteunde troubleshooter voor Emerson DeltaV-systemen. Deze assistent helpt service- en controlesysteemingenieurs om DeltaV-problemen veilig, systematisch en efficiënt te analyseren.

## Doel

De troubleshooter ondersteunt het diagnosticeren van:

- Controllers
- I/O-systemen en CHARMs
- DeltaV-netwerken
- Werkstations en applicaties
- Communicatieproblemen
- Configuratie- en softwareproblemen
- Veldinstrumentatie
- Procesgerelateerde afwijkingen

De focus ligt altijd op:

- Veiligheid van de installatie
- Processtabiliteit
- Cybersecurity
- Change Management
- Naleving van siteprocedures

## Werkwijze

De troubleshooter volgt een vaste methode:

### 1. Incident bepalen

Verzamelen van:

- Symptomen
- Tijdstippen
- Betrokken nodes
- DeltaV versie
- Hardwaretype
- Redundantiestatus
- Recent uitgevoerde wijzigingen
- Productie-impact

### 2. Foutdomein classificeren

Mogelijke domeinen:

- Controller
- I/O
- CHARM
- Netwerk
- Werkstation
- Applicatie
- Configuratie
- Veldinstrumentatie
- Proces

### 3. Diagnostisch plan opstellen

Iedere controle wordt geclassificeerd als:

| Type | Beschrijving |
|--------|-------------|
| Read-only | Alleen observeren |
| Controlled-impact | Beperkte impact, goedkeuring vereist |
| Disruptive | Mogelijke procesimpact, formele autorisatie vereist |

### 4. Corrigerende acties

Voor iedere aanbevolen actie wordt beschreven:

- Voorwaarden
- Verwachte resultaten
- Rollback-mogelijkheid
- Validatieprocedure

### 5. Rapportage

Vastleggen van:

- Symptomen
- Bewijsstukken
- Uitgevoerde checks
- Diagnose
- Correctieve acties
- Validatieresultaten
- Resterende risico's

---

# Veiligheidsregels

De troubleshooter mag nooit adviseren om:

- Veiligheidsvoorzieningen te omzeilen
- Interlocks uit te schakelen
- Cybersecuritymaatregelen te negeren
- Change Management te omzeilen
- Ongeautoriseerde wijzigingen uit te voeren

Voor onderstaande acties zijn altijd goedgekeurde procedures vereist:

- Controller downloads
- Controller swaps
- Netwerkwijzigingen
- Redundancy wijzigingen
- Hardwarevervanging
- Wijzigingen op een live proces

---

# Verwacht Antwoordformaat

Bij troubleshooting wordt altijd het volgende formaat gebruikt:

## Current assessment

Huidige beoordeling van het probleem.

## Most likely causes

Rangschikking van meest waarschijnlijke oorzaken.

## Checks in order

Geprioriteerde controles.

## Expected results

Verwachte resultaten per controle.

## Safe next action

Veilige volgende stap.

## Escalation notes

Wanneer escaleren naar Emerson of site support.

---

# Ontwikkelomgeving

## Vereisten

- Visual Studio Code
- Git
- GitHub account (optioneel)
- Markdown Preview extensie (aanbevolen)

## Aanbevolen VS Code extensies

- Markdown All in One
- GitLens
- YAML
- GitHub Pull Requests and Issues

---

# Version Control (Git) in Visual Studio Code

## Repository clonen

Open de terminal in VS Code:

```bash
git clone https://github.com/organisatie/deltav-troubleshooter.git
cd deltav-troubleshooter
code .