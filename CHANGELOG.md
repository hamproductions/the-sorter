# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.18.1](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.18.0...v1.18.1) (2026-01-26)

# [1.18.0](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.17.2...v1.18.0) (2026-01-14)


### Bug Fixes

* change translation to match test expectation ([053fccc](https://github.com/Tanyawat-Arsaga/the-sorter/commit/053fccccb02bbdf608dd5aced72e8e0e4d8b04fd))
* correct URL for other locations ([ab069ab](https://github.com/Tanyawat-Arsaga/the-sorter/commit/ab069ab49e1ad95457706d0053f8306e3ec744ed))
* **marking mode:** correct URL for back to builder ([e892a9a](https://github.com/Tanyawat-Arsaga/the-sorter/commit/e892a9a56904659c548af3c71c0ac1b5a0352b88))
* remove trailing comma in translation keys file ([9ea3fc6](https://github.com/Tanyawat-Arsaga/the-sorter/commit/9ea3fc6b877795bbc638c3c47e5b0d2903489033))


### Features

* song filters pog, better filters pog ([693d0dd](https://github.com/Tanyawat-Arsaga/the-sorter/commit/693d0dd4721d53538d514cd2662f2c4274107cb0))

## [1.17.2](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.17.1...v1.17.2) (2026-01-13)


### Bug Fixes

* fix lint for test ([17765f2](https://github.com/Tanyawat-Arsaga/the-sorter/commit/17765f238c7e87bcab5af7924d4aad67aaee7e11))
* **marking mode:** fix vite routing error changing from route params to query params ([4d960e6](https://github.com/Tanyawat-Arsaga/the-sorter/commit/4d960e68efd1820c1ef4cf2fe6e79114764582d6))
* **marking mode:** set *all* copies of the same song in predicted or actual setlist yellow if the song is present in the other setlist (or green if exact position match) ([4c720d8](https://github.com/Tanyawat-Arsaga/the-sorter/commit/4c720d864efc876436b5199587a3bce63d047d9d))
* only display color coding when scoring button pressed ([ce51d67](https://github.com/Tanyawat-Arsaga/the-sorter/commit/ce51d67092220eacf6ef613d857a2a395ac21367))
* reduce number of rerenders needed for the marking mode page by removing the useEffect with dependency on setlist ([f0ed5f3](https://github.com/Tanyawat-Arsaga/the-sorter/commit/f0ed5f3809af33112f58b7b769e27e6957ddd86d))
* update scoring algorithm to account for duplicate items ([84a5fdf](https://github.com/Tanyawat-Arsaga/the-sorter/commit/84a5fdfa9275c90914583252ec59bcc00b838567))


### Features

* add back button to marking mode ([c0d039f](https://github.com/Tanyawat-Arsaga/the-sorter/commit/c0d039fb26c60031a233448a20192faaeb1f3d6a))
* CI or pull requests ([698ebef](https://github.com/Tanyawat-Arsaga/the-sorter/commit/698ebef27ad858c5cb39ce714635cb3ed5d04fe2))
* color coded setlist prediction match results ([cf1a684](https://github.com/Tanyawat-Arsaga/the-sorter/commit/cf1a6842a99a4ceac9906f7c5081d93277159dd8))
* data update ([72e6ea4](https://github.com/Tanyawat-Arsaga/the-sorter/commit/72e6ea46a3419461cadfcc28cd826308c63f1ea5))
* **marking mode:** add calculate score button on top that scrolls to bottom ([03c69f3](https://github.com/Tanyawat-Arsaga/the-sorter/commit/03c69f31b93d3b10d2d5277000bc0090117a006e))
* **marking mode:** add performance name to comparison header actual column ([c95c73b](https://github.com/Tanyawat-Arsaga/the-sorter/commit/c95c73b11b8ba9101e5b8dca69b1703e0da4d77c))

## [1.17.1](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.17.0...v1.17.1) (2026-01-11)


### Bug Fixes

* failed test ([a8656f5](https://github.com/Tanyawat-Arsaga/the-sorter/commit/a8656f5a0ec03be183e36c96d15f3d9349b4c313))

# [1.17.0](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.16.1...v1.17.0) (2026-01-11)


### Bug Fixes

* add back reset to PredictionBuilder so that predictions load from url correctly ([fda5129](https://github.com/Tanyawat-Arsaga/the-sorter/commit/fda51292ea3afd7b4b4089ef6589f594166e383a))
* add missing i18n keys for setlist prediction ([2b94aa8](https://github.com/Tanyawat-Arsaga/the-sorter/commit/2b94aa8bfd95820d34cdfa40f115621b1ebe1eeb))
* lint stuff ([76d3a8d](https://github.com/Tanyawat-Arsaga/the-sorter/commit/76d3a8da44c9750e9df8c2b0e9a01731c76932c7))
* my prediction deletion works now ([e4eb894](https://github.com/Tanyawat-Arsaga/the-sorter/commit/e4eb894f2e6edb14015ee741f253c5e89dd5e2f9))
* performance metadata loads correctly on PredictionView components ([0e0d773](https://github.com/Tanyawat-Arsaga/the-sorter/commit/0e0d7735b3132dc7f020b0eead47786c4f35ee5e))
* wondermates typo ([2844892](https://github.com/Tanyawat-Arsaga/the-sorter/commit/2844892e99c62594e98c9cb07d3dd4d801a74a11))


### Features

* add score button to load prediction dialogue, and disable it if performance doesn't have setlist yet ([ba44da7](https://github.com/Tanyawat-Arsaga/the-sorter/commit/ba44da732040542e0aa595846a187b0f35fc5852))
* load prediction button on performance only shows my predictions for that performance ([4fe2047](https://github.com/Tanyawat-Arsaga/the-sorter/commit/4fe204760a0a7eb1d34e543f5c81e6ad094e02a8))

## [1.16.1](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.16.0...v1.16.1) (2026-01-08)


### Bug Fixes

* **data:** correct erroneous English names in song-info.json ([6bf8d04](https://github.com/Tanyawat-Arsaga/the-sorter/commit/6bf8d043508dcafc6eaf80eeb95c08e7d6256282))
* wondermates ([0dcca6e](https://github.com/Tanyawat-Arsaga/the-sorter/commit/0dcca6e9a293ffaaa3e0d69c62a5dfdc51a58956))


### Features

* update viewer ([4b41cce](https://github.com/Tanyawat-Arsaga/the-sorter/commit/4b41cce7bb6d6108efc2501f221c80f87c08cb4c))

# [1.16.0](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.15.0...v1.16.0) (2026-01-07)


### Bug Fixes

* **data:** rename "La la Yuuki no Uta" to "Daisuki no Uta" ([1297a7e](https://github.com/Tanyawat-Arsaga/the-sorter/commit/1297a7e0e996d29f493f4db9efa41aaabf30c93d))
* remove log ([5855510](https://github.com/Tanyawat-Arsaga/the-sorter/commit/5855510d4d9304458a953a43e9cafce745b40dc7))


### Features

* history viewer ([a6f0714](https://github.com/Tanyawat-Arsaga/the-sorter/commit/a6f0714cb55f457d2fb06d9dea3887a5fcdb86c3))

# [1.15.0](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.14.0...v1.15.0) (2026-01-06)


### Features

* Feature update, localization fixes, small bug fixes, etc. ([#27](https://github.com/Tanyawat-Arsaga/the-sorter/issues/27)) ([9efea40](https://github.com/Tanyawat-Arsaga/the-sorter/commit/9efea4033169ca25607413e5c6314181f0acd1c5))

# [1.14.0](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.13.4...v1.14.0) (2026-01-06)


### Bug Fixes

* add 50 limit to sort history ([91c9bb4](https://github.com/Tanyawat-Arsaga/the-sorter/commit/91c9bb41d4f902ef6a82d3dd57a8861928c1d788))
* lockfile ([81238cc](https://github.com/Tanyawat-Arsaga/the-sorter/commit/81238cc020fddd706dfd4d35c4793838a5c679a9))
* typo what the fuck ([7d9351b](https://github.com/Tanyawat-Arsaga/the-sorter/commit/7d9351bb05355e841377e235e1e3d4271f1b8ad5))


### Features

* add year filter, data update ([#26](https://github.com/Tanyawat-Arsaga/the-sorter/issues/26)) ([601a573](https://github.com/Tanyawat-Arsaga/the-sorter/commit/601a5735e12c855ad3bda4c9d846b3cc1b223e62)), closes [#25](https://github.com/Tanyawat-Arsaga/the-sorter/issues/25)
* data update ([1a9d808](https://github.com/Tanyawat-Arsaga/the-sorter/commit/1a9d80891066cd9c2e06b602ebac2024d9d680e3))

## [1.13.4](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.13.3...v1.13.4) (2025-12-26)


### Features

* data update, fix border styles ([e7a3dd6](https://github.com/Tanyawat-Arsaga/the-sorter/commit/e7a3dd60088d17f35017bfa91eda148cd0d2fa29))

## [1.13.3](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.13.2...v1.13.3) (2025-12-23)


### Bug Fixes

* wrong version zzz ([0bd26e4](https://github.com/Tanyawat-Arsaga/the-sorter/commit/0bd26e455c3ce52dcfcdbc1f8a22104b747b4660))

## [1.13.2](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.13.1...v1.13.2) (2025-12-23)


### Bug Fixes

* release flow ([7385652](https://github.com/Tanyawat-Arsaga/the-sorter/commit/7385652f0ab4efc107eec0f739b2c89c3c7f9786))

## [1.13.1](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.13.0...v1.13.1) (2025-12-23)


### Bug Fixes

* release ([22436b5](https://github.com/Tanyawat-Arsaga/the-sorter/commit/22436b59549f0be35228a730a125504c8e369067))

# [1.13.0](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.12.0...v1.13.0) (2025-12-23)


### Bug Fixes

* failed test ([5941bd7](https://github.com/Tanyawat-Arsaga/the-sorter/commit/5941bd70e3e94b32661305d59dd12553324c39fa))
* remove tracking ([3d32863](https://github.com/Tanyawat-Arsaga/the-sorter/commit/3d32863ce71597234bb5b4f467aa905ec6579ffd))


### Features

* add deploy thing ([324c6a4](https://github.com/Tanyawat-Arsaga/the-sorter/commit/324c6a4fbab32a7fa636e9d4450bf84630b72c26))
* reduce setlist-prediction bundle, add date to footer ([00fddcb](https://github.com/Tanyawat-Arsaga/the-sorter/commit/00fddcbfedada8dc69745d9e2d020e78facaea17))
* separate cross group option ([dab3adb](https://github.com/Tanyawat-Arsaga/the-sorter/commit/dab3adbdf8e33cf99377afe6f96f9f6d55d2b2cf))

# [1.12.0](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.11.1...v1.12.0) (2025-12-19)


### Bug Fixes

* missing prerender ([0662a54](https://github.com/Tanyawat-Arsaga/the-sorter/commit/0662a54b1b76d1e6c28b32762ee2c9116c64b7e8))

## [1.11.1](/compare/v1.11.0...v1.11.1) (2025-12-16)


### Bug Fixes

* toaster not working 9e30eee


### Features

* filter sharing for hasu sorter (#18) 3b3a5ba, closes #18

# [1.11.0](/compare/v1.10.1...v1.11.0) (2025-12-16)


### Bug Fixes

* english name zzz 66445a9
* princess, rulittle, izumi, ceras ID eaa04b7
* song Info ???? 132c39d


### Features

* add romaji, better localization, duplicate artist fix, pray 6296045

## [1.10.1](/compare/v1.10.0...v1.10.1) (2025-12-16)


### Bug Fixes

* prefetch wrong URL zzz 47af361

# [1.10.0](/compare/v1.9.0...v1.10.0) (2025-12-16)


### Bug Fixes

* quick add id broken 1bb4fff

# [1.9.0](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.8.1...v1.9.0) (2025-12-11)


### Bug Fixes

* gitignore, lint ([934c371](https://github.com/Tanyawat-Arsaga/the-sorter/commit/934c3716804b77dba8353e9e1a147b3b71a2b7e6))
* lint stuff ([8051426](https://github.com/Tanyawat-Arsaga/the-sorter/commit/80514265d48c2a1632ebbf6ebe3132a0db1c23c1))
* **mobile:** improve layout and navigation on small devices ([d31fa6c](https://github.com/Tanyawat-Arsaga/the-sorter/commit/d31fa6c82719088cd52ff332b8d151755b7e69fc))
* some setlist changes, change linter apply lint etc ([0a0202c](https://github.com/Tanyawat-Arsaga/the-sorter/commit/0a0202cb1bada66577c02bf489d76ab4ce2614ad))
* test errors ([ec9d1f0](https://github.com/Tanyawat-Arsaga/the-sorter/commit/ec9d1f041dd0efc302e9950ca7f881e83554b8f3))


### Features

* add prediction management dialogs and refactor view routing ([f11c820](https://github.com/Tanyawat-Arsaga/the-sorter/commit/f11c8202e0a247e4a96d0806dc3cfa534c7a716d))
* data update ([111b0e9](https://github.com/Tanyawat-Arsaga/the-sorter/commit/111b0e9adbbfb7521e85028a086ea421850cffad))
* more test pog ???? ([4806e4b](https://github.com/Tanyawat-Arsaga/the-sorter/commit/4806e4bbf928cf6ed34594edf1ea365147c33a2e))
* more tests pog? ([b676352](https://github.com/Tanyawat-Arsaga/the-sorter/commit/b676352a64f587e3f0faf7a8e1d2e82cac0a947f))

## [1.8.1](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.7.1...v1.8.1) (2025-11-28)


### Bug Fixes

* lint and such ([9b17edb](https://github.com/Tanyawat-Arsaga/the-sorter/commit/9b17edb2466bb9e513ef5b56ecb5aada49c5d60e))
* linting and such ([3b678ad](https://github.com/Tanyawat-Arsaga/the-sorter/commit/3b678adff5aacfac339fb2f8fdb13f3203c31ed3))
* song update ([46b67b6](https://github.com/Tanyawat-Arsaga/the-sorter/commit/46b67b65e10034ecacc185e62fc5dc06a50a4955))
* use proper navigation with BASE_URL prefix for builder link ([9d3b122](https://github.com/Tanyawat-Arsaga/the-sorter/commit/9d3b122c99a8d8ef7ddc6bb60c95ad7a530f365e))


### Features

* Add mobile item drawer, drag preview, and item reordering functionality with responsive header. ([13fc9f6](https://github.com/Tanyawat-Arsaga/the-sorter/commit/13fc9f6bc35a1100fe444a48c5aeef6d33129e73))
* setlist prediction :fire: :fire: :fire: ([#7](https://github.com/Tanyawat-Arsaga/the-sorter/issues/7)) ([e6ca0ea](https://github.com/Tanyawat-Arsaga/the-sorter/commit/e6ca0ea402e1c4e6b91e8dd43f001605aff116be))
* update ([64b8ff7](https://github.com/Tanyawat-Arsaga/the-sorter/commit/64b8ff70d99eb334cc0d02ad7f50fa6f00c4582f))

# [1.8.0](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.7.1...v1.8.0) (2025-11-18)


### Bug Fixes

* song update ([46b67b6](https://github.com/Tanyawat-Arsaga/the-sorter/commit/46b67b65e10034ecacc185e62fc5dc06a50a4955))
* tests ([af3fa9a](https://github.com/Tanyawat-Arsaga/the-sorter/commit/af3fa9a82fd104f2e5ace7ce5916f33f92c58d19))
* tests and shit ([f0ab038](https://github.com/Tanyawat-Arsaga/the-sorter/commit/f0ab038ee8a0b409f1f7741d806fca5f2b9c88e4))


### Features

* docs and shit ([f07fce1](https://github.com/Tanyawat-Arsaga/the-sorter/commit/f07fce1d0bff566a7c3fda723024833f60b82086))
* setlist dnd thing finally gdi ([3a35550](https://github.com/Tanyawat-Arsaga/the-sorter/commit/3a355504f7d662d537a602fbbb679cb8dcc44383))
* slop ([e5d22f2](https://github.com/Tanyawat-Arsaga/the-sorter/commit/e5d22f2d1c228464b23440559aed9d442ec306a3))
* update ([64b8ff7](https://github.com/Tanyawat-Arsaga/the-sorter/commit/64b8ff70d99eb334cc0d02ad7f50fa6f00c4582f))
* update data ([a00698d](https://github.com/Tanyawat-Arsaga/the-sorter/commit/a00698d2b6d2dda7f09e44bbc1035eed83bb2c36))

## [1.7.1](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.7.0...v1.7.1) (2025-08-13)


### Features

* data update ([bd59761](https://github.com/Tanyawat-Arsaga/the-sorter/commit/bd59761a13fb5a40d9a0a157bc71756c3f95751d))
* data update 2025-7-25 ([011d935](https://github.com/Tanyawat-Arsaga/the-sorter/commit/011d935cf993cdca50e63f83081b40c6421e7ede))

# [1.7.0](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.6.0...v1.7.0) (2025-05-12)


### Features

* hasu song update ([d9cbbd2](https://github.com/Tanyawat-Arsaga/the-sorter/commit/d9cbbd246532d2f3354e22da927022f8b82815dd))
* ikizulive update ([a3714a1](https://github.com/Tanyawat-Arsaga/the-sorter/commit/a3714a11defa3a320d8f3c62588131ccf677dc41))

# [1.6.0](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.5.0...v1.6.0) (2025-05-02)


### Features

* Hasu Songs Ranking Share button ([b20301d](https://github.com/Tanyawat-Arsaga/the-sorter/commit/b20301da9396555c45892b3cafc113d4225240af))

# [1.5.0](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.4.0...v1.5.0) (2025-05-02)


### Features

* feslive update ([bf0f53e](https://github.com/Tanyawat-Arsaga/the-sorter/commit/bf0f53e1a428c30eddcad01bc00cc91208206307))

# [1.4.0](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.3.0...v1.4.0) (2025-04-30)


### Features

* update songs data ([16455f1](https://github.com/Tanyawat-Arsaga/the-sorter/commit/16455f1ed3ba3e52bab5261fcec98e146556459d))

# [1.3.0](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.2.0...v1.3.0) (2025-04-10)


### Features

* 105 data update ([dd92896](https://github.com/Tanyawat-Arsaga/the-sorter/commit/dd9289676c58faae919d183393ba7a1656e208a1))

# [1.2.0](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.1.1...v1.2.0) (2025-03-31)

## [1.1.1](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.1.0...v1.1.1) (2025-03-18)


### Features

* song update 3-18-2025 ([785a958](https://github.com/Tanyawat-Arsaga/the-sorter/commit/785a958770c6c2235921ffebb17ece03abba4d28))

# [1.1.0](https://github.com/Tanyawat-Arsaga/the-sorter/compare/v1.0.0...v1.1.0) (2025-03-11)


### Features

* data update 3-11-2025 ([9f6f0d6](https://github.com/Tanyawat-Arsaga/the-sorter/commit/9f6f0d68e75fd6a03bc59c70d88d0aeb2f983e62))

# [1.0.0] 2025-03-04

- Initial Release
