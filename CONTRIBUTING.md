# Commit & Release Standards

## Commit Messages — Conventional Commits

Format:
```
<type>(<scope>): <summary>
```

**Types:**
- `feat` – new feature or capability
- `fix` – bug fix
- `refactor` – restructuring/renaming, no behavior change
- `test` – add/update tests
- `docs` – documentation only
- `ci` – CI/CD, workflows, build config
- `chore` – deps, tooling, misc maintenance
- `perf` – performance improvement
- `style` – formatting/whitespace, no logic change

**Rules:**
- Imperative mood ("add", not "added"/"adds")
- Summary line under ~72 chars, no trailing period
- Scope optional, use for larger repos: `feat(kanban): add WIP configuration`
- One logical change per commit; split if the message needs "and"
- Add a body when the "why" isn't obvious from the diff
- Only commit changes that actually happened in that step — don't batch unrelated work into one commit to save time

## Versioning — Semantic Versioning

`MAJOR.MINOR.PATCH` (e.g. `v0.3.0`)

- **MAJOR** – breaking changes
- **MINOR** – new backwards-compatible features
- **PATCH** – bug fixes only
- Pre-1.0 (`v0.x.y`) = still stabilizing, normal for early-stage projects

## Release Notes Template

```
## vX.Y.Z

### Added
- ...

### Fixed
- ...

### Changed
- ...

### Removed
- ...
```

## When helping with git

- Write commit messages in the above format for the actual diff shown
- Suggest splitting a commit if it bundles unrelated concerns
- When asked for a release, draft notes from the real commits since the last tag
- Don't invent commits, dates, or history that didn't happen — only format and describe real changes
