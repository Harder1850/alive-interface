# Interface Architecture

Interface is display + input relay only. It owns no logic.

## Components
- **Views** — read-only displays of system state, memory, decisions, runtime
- **Controls** — user controls relayed to Runtime (overrides, modes, auth)
- **Audit** — read-only audit traces
- **Adapters** — API client and websocket for Runtime communication

## Key Rule
All user actions route through Runtime. Interface never calls Mind or Body directly.
