/**
 * Fixed facts about the game that never change while playing.
 *
 * WHY this file exists: CODE_RULES.md rule 5 bans "magic numbers" and raw
 * strings typed in two places. Scene keys, the tile size and render depths
 * live here so there is exactly one spelling of each. Numbers that affect
 * *feel* (speeds, timers, wax) do NOT belong here -- they go in config.js,
 * because the team tweaks those while play-testing.
 */

/** One tile is 40x40 px. A level is 32 tiles wide x 18 tall = 1280x720. */
export const TILE_SIZE = 40;
export const GRID_COLS = 32;
export const GRID_ROWS = 18;

/** The STAGE size, derived from the grid so they can never disagree. */
export const GAME_WIDTH = GRID_COLS * TILE_SIZE;
export const GAME_HEIGHT = GRID_ROWS * TILE_SIZE;

/**
 * The whole canvas: the stage plus a dark frame round it (PALETTE.md
 * `frame`: "border round the stage"). Still exactly 16:9 (1408 x 792).
 *
 * WHY a frame: the HUD needs somewhere to live that is never over the
 * level. The stage sits centred sideways near the top, and the band under
 * it holds the wax panel and the size dots. World coordinates do not
 * change -- the stage is still (0,0)-(1280,720) -- so the frame is simply
 * at negative x, and at y 720 to 784 below the stage.
 */
export const VIEW_WIDTH = 1408;
export const VIEW_HEIGHT = 792;
export const STAGE_X = (VIEW_WIDTH - GAME_WIDTH) / 2;   // 64: the frame's width at each side
export const STAGE_Y = 8;                               // the frame's thin top edge

/** The HUD band under the stage, in world coordinates. */
export const HUD_BAND = {
    left: -STAGE_X,
    right: GAME_WIDTH + STAGE_X,
    top: GAME_HEIGHT,
    bottom: VIEW_HEIGHT - STAGE_Y
};

/**
 * Scene keys. Always import these instead of typing 'GameScene' by hand:
 * a typo in a string is a silent bug, a typo in a constant is an error.
 */
export const SCENES = {
    BOOT: 'BootScene',
    PRELOAD: 'PreloadScene',
    TITLE: 'TitleScene',
    GAME: 'GameScene',
    UI: 'UIScene',
    PAUSE: 'PauseScene',
    ACT_CARD: 'ActCardScene',
    CURTAIN_CALL: 'CurtainCallScene',
    END: 'EndScene'
};

/**
 * Render order, back to front. Phaser draws a higher depth on top.
 * Gaps of 10 leave room to slot something in later without renumbering.
 */
export const DEPTHS = {
    PAPER: 0,        // the paper-screen background texture
    GLOW: 5,         // the candle's warm light, ON the paper and UNDER the
                     // silhouettes -- so every shadow stays pure black
    BACKDROP: 10,    // painted scenery (never scales -- it is "on" the paper)
    TILES: 20,       // walls, floors, burnable paper tiles
    PROPS: 30,       // crates, doors, gates, switches, wax drops
    PLAYER: 40,      // the puppet silhouette
    ENEMIES: 50,     // moths
    PARTICLES: 60,   // embers, smoke
    DIM: 70,         // darkening layer; gets stronger as the wax runs out
    CURTAIN: 80,     // act transitions
    HUD: 90          // UIScene contents
};

/**
 * Tile indexes inside the generated tileset strip (systems/StageTextures.js).
 * Phaser treats -1 as "no tile here", which is why EMPTY is -1 and the real
 * tiles start at 0.
 */
export const TILE_INDEX = {
    EMPTY: -1,
    WALL: 0,      // painted wall/ground, always solid
    PAPER: 1,     // burnable paper: solid until it catches fire
    BURNING: 2,   // on fire; becomes a hole shortly after
    PLATFORM: 3   // one-way shelf: solid from above only
};

/**
 * Tiles that block from EVERY side. One-way platforms are deliberately not
 * in this list: they only block from above (see LevelLoader).
 */
export const SOLID_TILES = [TILE_INDEX.WALL, TILE_INDEX.PAPER, TILE_INDEX.BURNING];

/**
 * Every character a level map may contain (PRD 4.4).
 *
 * WHY they live here rather than in the level loader: the loader turns them
 * into tiles and objects, and the validator checks a map only uses known
 * ones. Both need the same list, and two copies would drift apart.
 */
export const SYMBOLS = {
    EMPTY: '.',
    WALL: '#',
    PAPER: '~',
    FIRE: 'f',
    PLATFORM: '=',
    PLAYER: 'P',
    DOOR: 'D',
    WAX: 'w',
    CRATE: 'C',
    SWITCH: 'S',
    GATE: 'G',
    MOTH: 'm',
    DRAFT: '^',
    SHELTER: '|',
    CHECKPOINT: 'k',
    LANTERN: 'l',
    HINT: '?'
};

/** The same list as a Set, for fast "is this a real symbol?" checks. */
export const KNOWN_SYMBOLS = new Set(Object.values(SYMBOLS));

/** The three player sizes, as names for the indexes used all over the code. */
export const SIZE = {
    TINY: 0,
    NORMAL: 1,
    HUGE: 2
};
