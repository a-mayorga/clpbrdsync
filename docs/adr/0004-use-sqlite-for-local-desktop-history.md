# ADR-0004: Use SQLite for local desktop history

- Status: Accepted
- Date: 2026-08-06

## Context

ClpbrdSync must retain clipboard history across application restarts and provide
fast local access for the dashboard and Quick Paste.

The data is structured, ordered, searchable, and subject to retention policies.
Future versions may also require full-text search, favorites, metadata, and
additional clipboard content types.

Electron 39 embeds Node.js 22, which provides the built-in `node:sqlite` module.

## Decision

The desktop application will store local clipboard history in SQLite.

The initial implementation will use Node.js `node:sqlite` from Electron's main
process. Database access will remain behind repository interfaces so the
implementation can be replaced without changing application services.

The database will live under Electron's user data directory. The initial
retention limit will be 100 items.

## Consequences

### Positive

- History survives application restarts.
- SQLite provides transactions, indexes, migrations, and future full-text search.
- No external database process is required.
- The built-in module avoids an external native dependency and Electron ABI rebuilds.
- Repository boundaries keep the application layer independent of SQLite.

### Negative

- `node:sqlite` remains experimental in the Node.js version embedded by Electron 39.
- Synchronous database operations run in Electron's main process.
- Schema migrations must be maintained.
- Clipboard content is stored locally without encryption in the initial version.