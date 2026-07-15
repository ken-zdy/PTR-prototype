
  # PTR管理交互原型

  This is a code bundle for PTR管理交互原型. The original project is available at https://www.figma.com/design/9Bhv6l4mb5qScs7ecfPUyo/%E4%B8%9D%E6%BB%91%E4%BA%A4%E4%BA%92%E5%8E%9F%E5%9E%8B%E5%88%B6%E4%BD%9C.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Shared comments (SQLite, no external DB)

  The prototype now supports shared comments through a local SQLite API.

  - Run `pnpm dev:api` to start the comments API service on `http://localhost:8787`.
  - Run `pnpm dev` to start the frontend.
  - Or run both together with `pnpm dev:all`.

  Comment data is stored in `.local-data/comments.db`.

  ## Versioning convention

  - Default release flow uses patch bump (small version): `pnpm release:patch`.
  - This updates `package.json` version and rebuilds.
  - The UI footer version follows package version automatically.
  - To keep local and remote versions in sync in one step, run `pnpm release:sync`.
  - `release:sync` performs: clean-check -> pull/rebase from `origin/main` -> patch bump -> build -> commit -> push.
  - If major/minor bump is needed, decide manually before release.
  
