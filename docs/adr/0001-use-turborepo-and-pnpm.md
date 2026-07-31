# ADR-0001: Use Turborepo and pnpm for the monorepo

- Status: Accepted
- Date: 2026-07-30

## Context

ClpbrdSync consists of a NestJS backend, an Electron desktop application, shared
TypeScript packages, and an Android application written in Kotlin.

The TypeScript applications need a shared workspace that provides consistent
dependency management, task execution, caching, and reusable internal packages.

## Decision

We will use pnpm Workspaces for package and dependency management.

We will use Turborepo to coordinate development, build, test, lint, and type-check
tasks across JavaScript and TypeScript projects.

The Android application will remain a Gradle project inside the same repository.
Its integration with root-level orchestration will be evaluated separately.

## Consequences

### Positive

- TypeScript packages can be shared without publishing them.
- Tasks can run according to the dependency graph.
- Local and CI builds can use Turborepo caching.
- pnpm provides strict and efficient dependency management.
- All product applications remain visible in one repository.

### Negative

- The repository uses two build ecosystems: pnpm and Gradle.
- Contributors must understand workspace dependency boundaries.
- Android tasks may require custom orchestration.
