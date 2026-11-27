# ADR 0001: Rendering Strategy

## Status

Accepted

## Context

CaseFlow is an internal, authenticated tool with no SEO needs. It uses a mock MSW backend and has a 1000-case list.

## Decision

Choose SPA.

## Alternatives

- **SSR:** needs a server, no SEO benefit.
- **SSG:** data is dynamic.

## Consequences

Static hosting is simple, but first load is slower and client-side auth is needed.
