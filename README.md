# LoveLive! Sorter

Sort your favorite seiyuu, characters inspired by charasort and more...

## Features

- Groups/ Units Filter
- Ties
- Undo
- Photo Export
- Save-able
- Share pic / Links
- \*New\* Tier List

### Ideas

- Timer

## Need Help (If anyone is kind enough...)

- [x] Localized Names
  - [x] Members
  - [x] Seiyuu
  - [x] Schools
  - [x] Units
  - [x] Series
- [ ] School/Unit Icons
  - [ ] LL
  - [ ] LLS
  - [ ] Nijigaku
  - [ ] LLSS
  - [ ] Hasunosora

## Data/ Assets Source

- Data: https://ll-fans.jp/
- Icons: https://idol.st/idols/
- Characters:
  - Muse/Aquours/Niji/Liella: https://lovelive-sif2.bushimo.jp/member/ (Rip SIF2)
  - Musical: https://www.lovelive-anime.jp/special/musical/member.php
  - Hasu: https://www.lovelive-anime.jp/hasunosora/member/
- Seiyuu:
  - Muse: https://love-live.fandom.com/wiki/Main_Page
  - Aqours: https://yohane.net/character/
  - Niji: https://www.lovelive-anime.jp/nijigasaki/about_nijigasaki.php
  - Liella: https://www.lovelive-anime.jp/yuigaoka/member/
  - Musical: https://www.lovelive-anime.jp/special/musical/caststaff.php
  - Hasu: https://www.lovelive-anime.jp/hasunosora/member/
  - Other Cast: Artist Picture/ random pic on Twitter

## The Sorting Algorithm

- The Sorting used Algorithm is based on Merge Sort, adapted to support manually doing the comparisons, support ties and undo-ing.
- Check out `src/utils/sort.ts` and `src/hooks/useSorter.ts` for details of the implementation.
- Technically, just using useSorter alone will suffice for implementing your own sorter.

### Deeper explanation

The sorting algorithm revolves around calling `initSort()` to create initial sort state, to start the sorting process then repeatedly calling `step()` with results of the comparisons ("left"/"right"/"tie") and current state to advance a step until status becomes "end".
Internally `mergeSort()` and `merge()` were used which mimics the actual merge sort algorithm.

The data is stored in 3D array because to support ties. When ties happen, the items in right array will be merged/transferred to the left array (which makes the array empty and skipped in subsequent comparisons). Ties helps reduce manual comparison, and it's safe to flatMap the results (`state.arr`) to get the resulting array

```ts
export interface SortState<I> {
  arr: I[][];
  currentSize: number;
  leftStart: number;
  status?: 'done' | 'waiting' | 'end';
  mergeState?: MergeState<I>;
  ties?: I[][];
}
interface MergeState<I> {
  start: number;
  mid: number;
  end: number;
  leftArr?: I[][];
  rightArr?: I[][];
  leftArrIdx?: number;
  rightArrIdx?: number;
  arrIdx?: number;
}
```


## Versioning

This project uses semantic versioning (MAJOR.MINOR.PATCH):
- MAJOR version for incompatible API changes
- MINOR version for new functionality in a backward compatible manner
- PATCH version for backward compatible bug fixes

### Version and Changelog Management

This project uses [release-it](https://github.com/release-it/release-it) for version and changelog management, optimized for conventional commits.

#### Release Process

```bash
# Automatically determine version type based on conventional commits
bun release

# Or specify version type manually
bun release:patch  # For bug fixes
bun release:minor  # For new features
bun release:major  # For breaking changes
```

These commands will:
1. Analyze commit messages to determine the appropriate version bump (if not specified)
2. Update the version in package.json
3. Update the version.ts file with the new version information
4. Generate changelog entries automatically from conventional commits
5. Commit the changes with a standardized commit message
6. Create a git tag for the release
7. Push the changes and tags to the remote repository (with your confirmation)

The version is displayed in the footer of the application.

#### Dry Run

To see what would happen during a release without making any changes:

```bash
bun release-it --dry-run
```

This will show you the version that would be bumped, the changelog entries that would be generated, and the git operations that would be performed.

#### GitHub Releases

When you push a new version tag (e.g., v1.0.0) to GitHub, a GitHub Actions workflow will automatically:

1. Create a GitHub release for that tag
2. Include the relevant section from the CHANGELOG.md as the release notes

This ensures that GitHub releases are always in sync with your version tags and changelog.

### Conventional Commits

This project uses conventional commits to standardize commit messages and automate versioning and changelog generation.

#### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types

- `feat`: A new feature (minor version bump)
- `fix`: A bug fix (patch version bump)
- `docs`: Documentation changes
- `style`: Changes that don't affect code functionality (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `chore`: Changes to the build process or auxiliary tools
- `revert`: Reverting a previous commit

#### Breaking Changes

Breaking changes should be indicated by:
- Adding an exclamation mark after the type/scope: `feat!: breaking change`
- Or including `BREAKING CHANGE:` in the commit body

Breaking changes trigger a major version bump.

#### Pre-commit Validation

The pre-commit hook checks that your commit message follows the conventional commit format.

### Pre-commit Hook

This project includes a pre-commit hook that ensures commit messages follow the conventional commit format. This standardization is essential for automated versioning and changelog generation with release-it.

The pre-commit hook:
- Validates that commit messages follow the conventional commit format
- Skips validation for merge commits and release commits

If you're setting up the project for the first time or after a fresh clone, run:

```bash
bun install-hooks
```

This will install the pre-commit hook and make it executable.