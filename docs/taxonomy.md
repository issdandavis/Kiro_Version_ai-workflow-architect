# Taxonomy Reference

The Living Document Review system uses a **Number-Letter-Symbol** system to create globally unique identifiers for every research source, patent, paper, or repository.

## ID Format

```
<Major>.<Section><Letter><Symbol>
```

### Components

| Component | Example | Description |
|-----------|---------|-------------|
| **Major** | `1` | Broad domain category (1-5) |
| **Section** | `A` | Sub-category within domain (A-Z) |
| **Letter** | `B` | Individual source position (A-Z) |
| **Symbol** | `†` | Optional granularity marker |

### Full ID Example: `3.CB†`

- `3` → GitHub repos
- `C` → Protocol-related repos
- `B` → Second repo in that list
- `†` → First supplemental asset

## Major Categories

| Major | Description | Section Examples |
|-------|-------------|------------------|
| **1** | Patents & IP filings | A = Space-Debris, B = Quantum-Key-Exchange, C = Swarm-Nav |
| **2** | Academic / Pre-print literature | A = Quantum-Computing, B = Spatial-Routing, C = Crypto-Protocols |
| **3** | GitHub / Open-source projects | A = Spiralverse SDK, B = Space-Tor Router, C = Combat-Network |
| **4** | Industry news & blogs | A = Astroscale, B = Seraphim, C = SpaceX |
| **5** | Internal tooling (Firebase, etc.) | A = Perplexity-Memory, B = Workflow-Architect |

## Symbol Reference

Symbols are used for additional granularity when a source has multiple related items:

| Symbol | Typical Use |
|--------|-------------|
| `†` | Primary document/PDF |
| `‡` | Supplemental video or presentation |
| `*` | Code sample or implementation |
| `✱` | TODO/needs-follow-up marker |

**Note**: If you need deeper nesting, you can double symbols (e.g., `††`, `‡‡`).

## How to Generate an ID

1. **Locate the Major bucket** (1-5) based on the source type
2. **Find the Section letter** (A-Z) based on the topic
3. **Count the source's position** within that section → assign letter (A, B, C...)
4. **Append the first free symbol** if needed for supplemental materials

### Examples

- `1.A†` - First patent in Space-Debris section
- `2.BA` - First quantum computing paper in Spatial-Routing section
- `3.CB‡` - Second protocol-related GitHub repo with supplemental video
- `4.AA` - First Astroscale news article
- `5.BA` - First Workflow-Architect internal tool

## Extension Strategy

The system is designed to scale indefinitely:

- **More sections**: Add letters A-Z within each major category
- **More sources**: Letters A-Z can represent 26 sources per section
- **More depth**: Use multiple letters or symbols for deep nesting
- **More majors**: Add major categories 6, 7, 8... as needed

## Usage in Issues

When creating a GitHub issue for a source review:

1. The ingestion script assigns the ID automatically
2. The issue title includes the ID: `[3.CB†] Protocol Design Repo`
3. Labels are applied: `major-3`, `section-C`
4. The ID is referenced in `docs/living-document.md`

## Cross-Referencing

Use IDs to link related sources:

```markdown
See also: [1.A†], [2.BA], [3.CB†]
```

This creates a knowledge graph across patents, papers, and implementations.
