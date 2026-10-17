# Shadow Play — instructions for Claude Code

This repo is a 48-hour game-jam game built by two beginners who work in shifts.

- **`PRD.md`** is the spec for the game: gameplay, tech design, milestones. Build milestone by milestone, in order, and tick the boxes in section 9 when an item is done and tested.
- **`ASSETS.md`** is the only list of image, sound, music and font files, with their keys and paths. Code refers to assets by key via `src/assets.js`, never by path. The game must run with no asset files (placeholders drawn in code).
- **`CODE_RULES.md`** is how the code must be organised: folders, one class per file, config-driven numbers, EventBus/Factory/State patterns. Follow it for every file you write.
- **`PALETTE.md`** is the only source of colours. `CONFIG.palette` mirrors its tokens; change PALETTE.md first.
- **`SECURITY.md`** is the safety rules for the repo and the deployed game (no secrets, minimal dependencies, security headers). Follow it in every milestone.
- **`NOTES.md`** is the running tracker and the most important file for continuity: where the project actually is, what to build next, and the gotchas. **Read it before writing any code.**

Rules:
- Keep code simple and commented; the team are beginners.
- All tunable numbers go in `src/config.js`.
- Write all code from scratch. Never copy code from an existing open-source game (jam rule: disqualification).
- After each milestone: run `npm run dev`, check the acceptance items, and stop so the human can play-test and commit.

**Updating `NOTES.md` is part of finishing a feature, not an optional extra.**
Two people build this in shifts, and the next session — possibly on a
different machine — knows nothing except what this file says. So after every
feature you finish, in the same change:

1. Add an entry to the top of the **Build log** (use the template at the
   bottom of the file): what you built, which files, anything surprising.
2. Update **Start here** and remove the finished task from **Next up**.
3. Tick the box in `PRD.md` section 9 if it completes a milestone item.
4. Add anything you had to work out the hard way to **Gotchas**.

A feature is not done until `NOTES.md` says so.
