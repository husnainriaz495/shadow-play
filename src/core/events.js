/**
 * Every event name used on the EventBus, in one place.
 *
 * WHY: CODE_RULES.md 6.2 -- systems announce, others listen. If one file
 * emits 'waxChanged' and another listens for 'wax-changed', nothing happens
 * and there is no error to find. Using these constants makes that impossible.
 *
 * Naming: PAST TENSE for "this happened" (WAX_CHANGED), imperative for
 * "please do this" (REQUEST_PAUSE).
 */
export const EVENTS = {
    // --- The candle / wax timer (emitted by systems/Candle.js) ---
    WAX_CHANGED: 'wax-changed',         // payload: { wax, max }
    WAX_OUT: 'wax-out',                 // the candle died -> curtain + restart
    WAX_LOW: 'wax-low',                 // dropped past the warning threshold
    WAX_PICKED_UP: 'wax-picked-up',

    // --- The player ---
    SIZE_CHANGED: 'size-changed',       // payload: { sizeIndex }
    GROW_BLOCKED: 'grow-blocked',       // no room to grow -> shake + squeeze sfx
    PLAYER_MOVED: 'player-moved',       // payload: { distanceTiles } (tutorial)
    PLAYER_JUMPED: 'player-jumped',
    PLAYER_LANDED: 'player-landed',     // payload: { fallSpeed } (dust + squash)
    PLAYER_HURT: 'player-hurt',         // payload: { amount, source }
    PLAYER_DIED: 'player-died',         // fell through a hole

    // --- Level flow ---
    LEVEL_READY: 'level-ready',         // payload: { act, title }
    ACT_COMPLETE: 'act-complete',       // reached the stage door
    ACT_RESTARTED: 'act-restarted',
    CHECKPOINT_LIT: 'checkpoint-lit',   // payload: { x, y, wax }
    GAME_COMPLETE: 'game-complete',     // finished the final act

    // --- World objects ---
    SWITCH_PRESSED: 'switch-pressed',   // payload: { id }
    SWITCH_RELEASED: 'switch-released',
    CRATE_PUSHED: 'crate-pushed',
    MOTH_SWATTED: 'moth-swatted',
    TILE_IGNITED: 'tile-ignited',       // payload: { col, row }

    // --- Drafts ---
    DRAFT_TELEGRAPH: 'draft-telegraph', // the curtains flutter: gust incoming
    DRAFT_START: 'draft-start',
    DRAFT_END: 'draft-end',

    // --- Screens and developer tools ---
    REQUEST_PAUSE: 'request-pause',
    REQUEST_RESUME: 'request-resume',
    DEBUG_TOGGLED: 'debug-toggled',     // payload: { enabled } (F1)
    MUTE_CHANGED: 'mute-changed'        // payload: { muted } (M, pause menu)
};
