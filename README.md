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

- No-Tie mode
  -
- Timer

## Versioning

This project uses semantic versioning (MAJOR.MINOR.PATCH):
- MAJOR version for incompatible API changes
- MINOR version for new functionality in a backward compatible manner
- PATCH version for backward compatible bug fixes

### Version and Changelog Management

This project provides two ways to update versions and is optimized for conventional commits.

#### Basic Version Update

```bash
# For patch updates (bug fixes)
bun version:patch

# For minor updates (new features)
bun version:minor

# For major updates (breaking changes)
bun version:major
```

These commands will:
1. Update the version in package.json
2. Update the version.ts file with the new version information
3. The version is displayed in the footer of the application

#### Complete Release Process

For a more comprehensive release process that includes changelog updates:

```bash
# Automatically determine version type based on conventional commits
bun release

# Or specify version type manually
bun release:patch
bun release:minor
bun release:major
```

These commands will:
1. Update the version in package.json (automatically determining the version type from commits if not specified)
2. Update the version.ts file with the new version information
3. Generate changelog entries automatically from conventional commits
4. Allow you to review and edit the generated changelog entries
5. Provide instructions for committing and tagging the release

#### Manual Changelog Update

You can also update the changelog separately:

```bash
bun update-changelog
```

This will:
1. Automatically categorize your conventional commits into changelog sections
2. Allow you to review and edit the generated entries
3. Update the CHANGELOG.md file with your changes

Note: These commands use npm internally for version bumping since Bun doesn't support the version command yet.

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

The pre-commit hook checks that:
1. Your commit message follows the conventional commit format
2. The version has been updated if non-version files are changed
3. Version-related files are in sync

### Pre-commit Hook

This project includes a pre-commit hook that checks if the version has been updated before allowing a commit. This ensures that version changes are not forgotten when making changes to the codebase.

The pre-commit hook:
- Checks if any non-version files are being committed
- If so, verifies that the version has been updated since the last commit
- Ensures that version-related files are in sync

If you're setting up the project for the first time or after a fresh clone, run:

```bash
bun install-hooks
```

This will install the pre-commit hook and make it executable.

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
