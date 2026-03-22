# ALIVE Interface

## Commitment

This repository provides visibility and control for ALIVE.

It is responsible for:
- displaying system state
- presenting decisions and outputs
- accepting user input
- exposing audit and inspection views

It does not:
- perform cognition
- execute actions
- enforce rules
- bypass runtime

All interaction flows through runtime.

## Architecture Spine

Constitution defines → Runtime governs → Mind thinks → Body acts → Interface displays

## Purpose
User interface for interaction, visibility, and control.

## Responsibilities
- Display system state
- Show logs and audit trails
- Provide controls
- Accept user input

## Rules
- No logic
- No decision-making
- No direct execution

## Interaction Model
```
User → UI → Runtime → Mind/Body
```

## Non-Scope
- No cognition
- No execution
- No rule enforcement
- No bypass of runtime

## Drift Warning
⚠️ If UI bypasses runtime or makes decisions, system integrity is broken.
