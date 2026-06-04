# Game Card Flow

"Deployment by a game player to the battlefield."
DEPLOY
"Mustered when matching Muster unit added to battlefield."
MUSTER
"Revived by Medic added to battlefield."
REVIVE
"Summoned when matching Avenger unit removed from battlefield."
SUMMON
"Transformed when Mardroeme unit added to battlefield row."
TRANSFORM

```mermaid
---
title: Node with text
---
flowchart TB
  undrawn[Undrawn] --> |Game Start #124; Muster| handUnit
  handUnit[Hand]
  handUnit --> |Deploy #124; Muster #124; Summon | fieldUnit[Field]
  nonDeck[Non-Deck] --> |Summon| fieldUnit[Field]
  fieldUnit --> |Decoy| handUnit
  fieldUnit --> |Scorch #124; Round End| discard[Discard]
  discard --> |Revive #124; Summon| fieldUnit
```
