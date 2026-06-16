# Contributing to Tellum

Thanks for considering a contribution. Tellum is a learning-in-public project, so contributions of any size are welcome — typo fixes, new pattern-detection signals, UI polish, or entirely new features.

## Getting set up

1. Fork the repository and clone your fork
2. Follow the **Getting Started** steps in the README to install dependencies and set up Supabase
3. Create a branch off `main` for your change

## Branch naming

- `feature/short-description` for new features
- `fix/short-description` for bug fixes
- `docs/short-description` for documentation-only changes

## Commit messages

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add new pattern signal for double-streaks`
- `fix: correct confidence calculation rounding`
- `docs: update setup instructions`
- `chore: bump dependency versions`

## Before opening a pull request

- Run `pnpm dev` and manually verify your change in both Coach Mode and Mirror Mode
- Make sure there are no new TypeScript or ESLint errors
- Keep pull requests focused on one change at a time

## Reporting bugs or suggesting features

Open a GitHub issue describing what happened (or what you'd like to see), with steps to reproduce if it's a bug. Screenshots help.