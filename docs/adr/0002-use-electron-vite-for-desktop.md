# ADR-0002: Use Electron and electron-vite for the desktop client

- Status: Accepted
- Date: 2026-08-01

## Context

ClpbrdSync requires continuous access to the operating system clipboard on Windows
and macOS. It also requires background execution, global shortcuts, a system tray,
multiple windows, and a React-based user interface.

The project team has strong TypeScript and React experience but limited experience
with native desktop frameworks.

## Decision

We will build the desktop client with Electron.

We will use electron-vite to build and develop the main process, preload scripts,
and React renderer.

The renderer will remain isolated from Node.js and Electron APIs. Privileged
operations will be exposed through narrow, typed APIs implemented in preload
scripts with contextBridge.

## Consequences

### Positive

- The client can use TypeScript and React.
- Windows and macOS share most of the implementation.
- Electron provides native clipboard, tray, shortcut, window, and notification APIs.
- electron-vite offers a unified development and build configuration.
- Main, preload, and renderer remain explicit architectural boundaries.

### Negative

- Electron applications consume more memory than fully native alternatives.
- The team must understand Electron's process model and security boundaries.
- Installers, code signing, notarization, and automatic updates add platform-specific
  complexity.
- IPC contracts must be carefully maintained and validated.