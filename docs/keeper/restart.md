# Restarting streaming.d

How a new session of the keeper takes over:

1. **Read** `README.md`, `CLAUDE.md`, `docs/decisions.md`, `docs/designs.md` and this folder (`agent.json`, `now.md`, `role.md`).
2. **Make a new key** with sgit 0.27.0 (SovereignWebsite__IaC (formerly SovereignWebsite__Factory) `board/workflow/2026-11-20__signing-with-your-key.md`): the signing half in OpenSSH form in a 0600 file outside the repository, never printed; `git config gpg.format ssh`, `user.signingkey <file>`, `commit.gpgsign true`, `gpg.ssh.program ssh-keygen` in this clone only.
3. **Publish the key** in the Factory's `team/keys.json` (SovereignWebsite__IaC) under a new name (one live key per name, for example `streaming.d-2@SovereignWebsite.dinis` or the name Dinis gives), with the new session link; retire the old entry only on Dinis's word. The pipeline's Signers check refuses commits from a key that is not published.
4. **Ask Dinis, in the new session,** to confirm it is keeper: the keeper line in `CLAUDE.md` and `site/policy/abp.json` names this session's agent.
5. **Build and check** as in `README.md` before the first push; run `node .github/ci/signers.mjs <before> <after>` on your commits.
6. **Update this folder** in the first commit, and tell sites.d and conductor.d the new session link.
