# ADR 0007: License the project under AGPL-3.0

- Status: Accepted
- Date: 2026-08-06

## Context

The project is intended to become public open-source software while remaining primarily self-hosted and network-accessible. The license should preserve source availability for modified versions offered over a network.

## Decision

Use the GNU Affero General Public License version 3. The canonical unchanged license text is the
repository-root [`LICENSE`](../../LICENSE).

GNU's license overview describes the AGPL's network-use source-availability purpose: [GNU Licenses](https://www.gnu.org/licenses/).

## Consequences

- Future source files and distribution documentation must identify AGPL-3.0 consistently.
- The repository keeps one canonical root license file.
- Dependency and asset license compatibility must be reviewed before adding or distributing those
  dependencies and assets.
