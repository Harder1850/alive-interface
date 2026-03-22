# UI Boundary Rules

- Interface DISPLAYS state — does not own it
- Interface RELAYS input to Runtime — does not act on it
- Interface NEVER calls Mind or Body directly
- Interface NEVER enforces rules or makes decisions
- Interface NEVER stores persistent system state

## Allowed
- Reading state snapshots from Runtime
- Sending user commands to Runtime bridge
- Displaying audit logs (read-only)

## Prohibited
- Direct memory reads from Mind
- Direct actuator commands to Body
- Bypassing Runtime for any operation
