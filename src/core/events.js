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
    WAX_CHANGED: 'wax-changed',         // payload: { wax, max, rate } (rate = burn speed, x1 at Normal)
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

    HINT_SHOWN: 'hint-shown',           // a `?` hint unfolded (paper rustle)

    // --- Level flow ---
    LEVEL_READY: 'level-ready',         // payload: { act, title }
    ACT_COMPLETE: 'act-complete',       // reached the stage door
    ACT_RESTARTED: 'act-restarted',
    CHECKPOINT_LIT: 'checkpoint-lit',   // payload: { x, y, wax }
    GAME_COMPLETE: 'game-complete',     // finished the final act

    // --- World objects ---
    SWITCH_PRESSED: 'switch-pressed',   // payload: { gateId } (the gate it opens)
    SWITCH_RELEASED: 'switch-released', // payload: { gateId }
    SWITCH_TICK: 'switch-tick',         // a second of the gate's borrowed time went by
    LANTERN_LIT: 'lantern-lit',         // any lantern caught: payload { lure }
    GATE_OPENED: 'gate-opened',
    GATE_CLOSED: 'gate-closed',
    CRATE_PUSHED: 'crate-pushed',
    CRATE_RETURNED: 'crate-returned',   // a lost crate was put back at its start
    MOTH_SWATTED: 'moth-swatted',
    TILE_IGNITED: 'tile-ignited',       // payload: { col, row }

    // --- Drafts ---
    DRAFT_SCHEDULED: 'draft-scheduled', // payload: { seconds } until the next gust
    DRAFT_TELEGRAPH: 'draft-telegraph', // the curtains flutter: gust incoming
    DRAFT_STRENGTH: 'draft-strength',   // payload: { strength } 0 calm, 1 full gust
    DRAFT_START: 'draft-start',
    DRAFT_END: 'draft-end',

    // --- Screens and developer tools ---
    REQUEST_PAUSE: 'request-pause',
    REQUEST_RESUME: 'request-resume',
    HIDE_IN_LEVEL_UI: 'hide-in-level-ui', // a curtain is closing: clear hints/warnings
    DEBUG_TOGGLED: 'debug-toggled',     // payload: { enabled } (F1)
    MUTE_CHANGED: 'mute-changed'        // payload: { muted } (M, pause menu)
};
