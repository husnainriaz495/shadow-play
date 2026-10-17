import { TILE_SIZE } from './core/constants.js';
import { toCssColor, mixColors } from './core/helpers.js';

/**
 * The colour palette: "Midnight Teal" from PALETTE.md, which is the single
 * source of truth for colour. Change PALETTE.md first, then these values.
 *
 * Warm candlelight fading into cold teal darkness, so Fire (warm light)
 * against Shadow (the dark) reads at a glance. Declared before CONFIG so the
 * text styles below can reuse the very same colours.
 */
const palette = {
    frame: 0x061014,        // border round the stage, letterbox, loading screen

    /**
     * The lit paper, from the candle outwards: hot centre, warm, teal, dark.
     * The glow texture is a radial gradient through these four.
     */
    paperStops: [0xffe9c2, 0xf0a25a, 0x2f5a63, 0x0b1c22],

    shadow: 0x05090b,       // every silhouette drawn in code
    rod: mixColors(0x05090b, 0xf0a25a, 0.4), // puppet rods: visible but quiet
    flameCore: 0xffd27a,    // bright flame centre, lit lantern, wax sparkle
    flameOuter: 0xff6a2b,   // flame glow, embers, burning paper edge
    wax: 0xfff1c9,          // candle body, HUD candle, wax drops
    title: 0xf5e6c8,        // titles, menu text, dialogue
    textMuted: 0x9fb3b8,    // hints, secondary and disabled text
    accent: 0xffb35c,       // exit door glow, selected item, active size dot
    panel: 0x0b1c22,        // cards and dialogue boxes...
    panelAlpha: 0.85,       // ...at this opacity
    panelEdge: 0x2f5a63,    // 1-2 px border on cards
    danger: 0xff4d4d,       // hurt flash, wax-low warning pulse
    dotOff: 0x3a4a4f,       // inactive size dots, empty slots
    curtain: [0x7a1424, 0x3a0610], // curtain placeholder, light to dark fold
    gold: 0xe8b65a          // logo placeholder, results-card stars
};

/**
 * The theatre font from ASSETS.md, with the fallback it uses until the
 * .woff2 file exists. Phaser wants this as a CSS font-family string.
 */
const fontFamily = 'Theatre, Georgia, serif';

/**
 * A soft dark shadow under all text (PALETTE.md "Text"). It is what keeps
 * light text readable over the bright centre of the glow AND over black
 * walls, so one set of styles works everywhere on the stage.
 */
const textShadow = { offsetX: 0, offsetY: 2, color: toCssColor(palette.frame), blur: 4, fill: true };

/**
 * How many times sharper than 1280x720 the game is drawn. The camera zooms
 * by the same amount (core/camera.js), so game code never notices. 2 keeps
 * text crisp on 1440p and most laptop screens; drop to 1 if an old machine
 * struggles to hold 60 fps.
 */
const renderScale = 2;
const light = toCssColor(palette.title);

/** Every text style draws its letters at the render scale, so they stay sharp. */
const sharp = { resolution: renderScale };

/**
 * EVERY tunable number and colour in the game.
 *
 * WHY: CODE_RULES.md rule 5 -- the team must be able to change how the game
 * FEELS without hunting through code. If you ever want to type a number
 * inside a class, add it here instead and read it from CONFIG.
 *
 * This is one of the three allowed singletons (CODE_RULES.md 6.5).
 * Values come from PRD.md sections 4.2 - 4.10 and 5.
 */
export const CONFIG = {
    /**
     * Developer mode. When true the game shows an FPS counter and the
     * physics bodies, and enables the dev act-skip keys (N / B).
     * F1 toggles it while playing (PRD 6.2). Ship with this false.
     */
    DEBUG: false,

    render: {
        scale: renderScale
    },

    physics: {
        gravity: 1400,
        fastFallMultiplier: 1.6   // extra gravity while falling: snappy jumps
    },

    /** Nothing in the game may hard-code a colour -- read it from here. */
    palette,

    /**
     * Named text styles -- the "variants" from CODE_RULES.md rule 5. Scenes
     * pass CONFIG.text.heading to this.add.text() and never spell out a
     * font size or colour themselves.
     *
     * Every style is light with a soft dark shadow (PALETTE.md "Text"), so
     * the same style reads on the bright glow, the teal dark and black
     * walls alike. Titles are also uppercase and letter-spaced: the caller
     * upper-cases the string, the spacing is here.
     * PRD 4.8 requires text to be at least 24 px.
     */
    text: {
        title:   { ...sharp, fontFamily, fontSize: '88px', color: light, letterSpacing: 10, shadow: textShadow },
        heading: { ...sharp, fontFamily, fontSize: '40px', color: light, letterSpacing: 6, shadow: textShadow },
        body:    { ...sharp, fontFamily, fontSize: '26px', color: light, align: 'center', shadow: textShadow },
        prompt:  { ...sharp, fontFamily, fontSize: '28px', color: light, letterSpacing: 2, shadow: textShadow },
        muted:   { ...sharp, fontFamily, fontSize: '24px', color: toCssColor(palette.textMuted), align: 'center', shadow: textShadow },
        hud:     { ...sharp, fontFamily, fontSize: '24px', color: light, shadow: textShadow },
        debug:   { ...sharp, fontFamily: 'monospace', fontSize: '16px', color: '#9ef' }
    },

    player: {
        /** Body size at Normal: 1 tile wide, 2 tall (PRD 4.2). */
        bodyWidth: TILE_SIZE,          // 40 px
        bodyHeight: TILE_SIZE * 2,     // 80 px

        /**
         * Platformer feel (PRD 4.8). These small mercies are the difference
         * between "tight" and "broken", so they are all tunable.
         */
        /**
         * Trimmed off the body height at every size.
         *
         * WHY: Tiny is exactly one tile tall and a crawl gap is exactly one
         * tile high. Arcade Physics snags on a body that fits with zero
         * clearance, so the puppet would catch on the lip of the very gap
         * it is meant to fit through. Two pixels of slack fixes it and is
         * invisible to the player. (Open question 4 in NOTES.md.)
         */
        bodyClearancePx: 2,

        /** How long a Down + Jump lets you fall through a one-way shelf. */
        dropThroughMs: 250,

        coyoteTimeMs: 80,       // may still jump this long after leaving a ledge
        jumpBufferMs: 100,      // a jump pressed this early still counts on landing
        jumpCutMultiplier: 0.5, // releasing jump early halves upward speed
        accelerationMs: 100,    // time to reach top speed
        frictionMs: 80,         // time to stop
        sizeTweenMs: 200,       // how long growing/shrinking takes
        blockedShakePx: 4,      // nudge when growing is refused
        blockedShakeMs: 250,    // ...for this long, fading out
        blockedShakeSpeed: 0.09, // how fast it shivers (radians per ms)

        /**
         * Corner correction (PRD 4.10, borrowed from Celeste): rather than
         * stopping a jump dead on a corner the player ALMOST cleared, nudge
         * them around it. Players never notice it, they just stop swearing.
         */
        cornerCorrection: {
            ceilingPx: 8,       // head clipping a ceiling corner by up to this
            ledgePx: 6          // feet missing a ledge corner by up to this
        },

        /** Invulnerability after a hit, with a blink (PRD 4.8). */
        invulnerableMs: 800,
        hitStopMs: 80,          // physics pauses this long on damage

        /**
         * The three sizes, indexed by SIZE.TINY / NORMAL / HUGE.
         * states/ reads these -- see CODE_RULES.md 6.4.
         */
        sizes: [
            {
                name: 'Tiny',
                scale: 0.5,
                speed: 260,
                jump: -430,
                waxMultiplier: 0.75,
                canPushCrates: false,
                canSwatMoths: false,
                canPressSwitches: false
            },
            {
                name: 'Normal',
                scale: 1.0,
                speed: 220,
                jump: -540,
                waxMultiplier: 1.0,
                canPushCrates: false,
                canSwatMoths: false,
                canPressSwitches: false
            },
            {
                name: 'Huge',
                scale: 2.0,
                speed: 160,
                jump: -680,
                waxMultiplier: 2.0,
                canPushCrates: true,
                canSwatMoths: true,
                canPressSwitches: true
            }
        ]
    },

    /**
     * The jointed puppet (PRD 4.2.1). The rig is VISUAL ONLY: limbs never
     * collide and never change the hitbox.
     *
     * All pixel values are in the 2x art space from ASSETS.md
     * (body 80x120, arm 24x72, leg 28x64), measured from the body image's
     * top-left corner. When the real art arrives, only `mounts` should need
     * adjusting -- turn DEBUG on to see a dot at each joint.
     */
    rig: {
        /**
         * Where the limbs hang from, in the body image's own pixels,
         * measured from its TOP-LEFT corner (the image is 80x120).
         *
         * These are the numbers to nudge when the joints do not line up
         * with the art: run the game, press F1, and move each value until
         * its dot sits on the shoulder or hip. Four separate points rather
         * than one symmetric offset, because hand-drawn art is rarely
         * perfectly centred in its canvas.
         */
        mounts: {
            shoulderLeft:  { x: 42, y: 66 },  // just under the helmet, where
            shoulderRight: { x: 57, y: 66 },  // the neck widens into shoulders
            hipLeft:       { x: 46, y: 100 }, // inside the tunic, so the leg
            hipRight:      { x: 58, y: 100 }  // joints never show as a seam
        },

        /**
         * The x position of the torso's centre line in the body image. The
         * art is NOT centred in its 80 px canvas -- the cape fills the back
         * of the image -- so this is what gets placed over the middle of the
         * hitbox. Measured from the art: the neck and tunic centre on ~50.
         */
        centreX: 50,

        /**
         * Distance from the body image's top down to the soles of the feet.
         * It decides how tall the whole puppet stands, so if the feet float
         * above the floor or sink into it, this is the number to change.
         */
        footOffsetY: 160,

        /**
         * The puppet art is drawn at TWICE Normal size so it stays crisp
         * when Huge (ASSETS.md). This shrinks it back: Normal shows it at
         * half size, Tiny at a quarter, Huge at full size.
         */
        artScale: 0.5,

        /** The damped spring that moves every joint towards its target. */
        stiffness: 180,
        damping: 0.82,

        /**
         * Walk phase advances with DISTANCE MOVED, not time, so the feet
         * never slide at any speed or size (PRD 4.2.1).
         */
        strideFactor: 0.055,

        /** Joints may never bend past these angles, in degrees. */
        limits: {
            armMin: -160,
            armMax: 60,
            legMin: -50,
            legMax: 50
        },

        /** The puppeteer's rods, drawn in code from each hand upwards. */
        rod: {
            width: 2,
            alpha: 0.6
        },

        turnSquashMs: 60,   // squash when the puppet turns around

        /**
         * Kick given to every joint when the size changes, in degrees per
         * second, so the limbs overshoot and wobble for ~0.3 s (PRD 4.2.1).
         */
        sizeWobble: 260,

        /**
         * Target angles per pose, in degrees (PRD 4.2.1). 0 is hanging
         * straight down; positive swings forward, the way the puppet faces.
         *
         * `swing` values are the size of the walk cycle's swing; the rest
         * are fixed angles held for as long as the pose lasts. Poses for
         * mechanics that do not exist yet (push, squeeze, hurt, swat, gust,
         * death, bow) are added in the milestone that adds the mechanic.
         */
        poses: {
            idle: { arm: -3, leg: 0, lean: 0, armSwing: 3, legSwing: 2, cycleMs: 2600 },
            walk: { arm: 0, leg: 0, lean: 4, armSwing: 15, legSwing: 25 },
            jump: { arm: -140, legNear: 30, legFar: -15, lean: 0, stretch: 1.06 },
            fall: { arm: -80, legNear: 10, legFar: -10, lean: 0, stretch: 1 },
            land: { arm: -10, leg: 6, lean: 2, squash: 0.9, squashMs: 100, minAirMs: 60 },
            // Growing refused: arms pulled in tight while the puppet shivers.
            squeeze: { arm: 12, leg: 0, lean: 0, durationMs: 250 },
            // Candle out: everything hangs, on looser springs (higher
            // damping = more swing), and the puppet sags on its rods.
            limp: { arm: 0, leg: 0, lean: 0, damping: 0.95, dropPx: 8 }
        }
    },

    wax: {
        start: 100,            // every act starts with a full candle
        max: 100,
        baseDrain: 100 / 120,  // empties in 120 s at Normal (PRD 4.3)
        dropAmount: 20,        // a 'w' pickup restores this much
        lowThreshold: 30,      // below this the glow dims and the flame panics
        hurtCost: {            // wax lost to each hazard (PRD 4.4)
            fire: 15,
            moth: 10
        },
        knockback: 260         // horizontal push when burnt
    },

    fire: {
        spreadSeconds: 2.5,    // how often fire jumps to a neighbouring tile
        burnToHoleSeconds: 1,  // burning -> hole (non-solid)
        emberRate: 24          // particles per second per burning tile
    },

    moth: {
        speed: 90,             // max chase speed
        wobbleAmplitude: 28,   // height of the sine path
        wobbleSpeed: 0.004     // how fast the sine advances (per ms)
    },

    draft: {
        intervalSeconds: 6,    // time between gusts
        telegraphSeconds: 1,   // warning before a gust (curtains flutter)
        gustSeconds: 1.5       // how long the player is forced Tiny
    },

    /**
     * The candle's light on the paper (PALETTE.md "Glow from the candle").
     *
     * The candle is held BEHIND the puppet -- that is why bringing it closer
     * makes the shadow bigger -- so the light follows the puppet around the
     * stage, a little behind it, rather than hanging at the top of the
     * screen. Everything out past `radius` fades into the dark teal edge.
     */
    glow: {
        radius: 700,              // px from the candle to the dark edge
        stops: [0, 0.2, 0.62, 1], // where each of palette.paperStops sits
        textureSize: 512,         // drawn small once, scaled up (it is a soft gradient)
        sourceOffsetY: -50,       // the candle sits behind the puppet's chest
        followPerFrame: 0.12,     // how quickly the light catches up (per 60 Hz frame)
        titleSource: { x: 640, y: 470 }, // where the candle stands on the title screen

        flickerAlpha: 0.04,       // how much brightness wanders
        flickerScale: 0.03,       // how much the pool's size wanders
        flickerSpeed: 0.008,
        lowWaxDimming: 0.35,      // brightness left when the wax is gone
        maxDim: 0.55,             // extra darkness over the stage at zero wax
        scaleTiny: 0.8,           // candle held far: a small, weak pool
        scaleNormal: 1.0,
        scaleHuge: 1.3            // candle held close: a wide, bright pool
    },

    /** Soft dark edges and a whisper of film grain, baked once at boot. */
    vignette: {
        innerRadius: 0.45,        // fraction of the screen left untouched
        edgeAlpha: 0.55,          // darkness in the very corners
        grainAlpha: 0.05          // strength of the grain specks
    },

    /** The exit door's glow, so the goal is visible from anywhere (PALETTE.md). */
    door: {
        glowRadius: 80,
        glowMinAlpha: 0.35,
        glowMaxAlpha: 0.8,
        pulseMs: 1400
    },

    /** Game over, when the wax reaches 0 (systems/CandleOut.js). */
    candleOut: {
        limpMs: 700,           // the puppet hangs limp this long before the curtain
        messageFadeMs: 400     // "The candle went out" fades in on the curtain
    },

    /** How a wax drop `w` moves. How much wax it gives is CONFIG.wax.dropAmount. */
    waxDrop: {
        bobPx: 6,              // gentle up-and-down so it reads as a pickup
        bobMs: 900,
        pickupRisePx: 24,      // floats up as it fades when taken...
        pickupMs: 250          // ...over this long
    },

    /**
     * Animation standard (PRD 5.1). Entrances overshoot slightly, exits are
     * always faster than entrances, continuous motion eases both ways.
     */
    anim: {
        easeIn: 'Back.Out',
        easeInSoft: 'Cubic.Out',
        easeOut: 'Cubic.In',
        easeLoop: 'Sine.InOut',

        panelInMs: 300,        // a paper panel unfolds
        panelOutMs: 200,       // ...and folds away faster
        cardInMs: 400,
        cardOutMs: 200,
        textCps: 40,           // typewriter speed, characters per second

        curtainMs: 700,        // curtain close/open sweep
        curtainOpenMs: 900,
        quickRestartMs: 450,   // the "curtain flick" on R or death
        actCardMs: 1600,       // how long an act title stays on screen

        shake: {
            hit: 0.006,        // camera shake strength on damage
            land: 0.002        // ...and on a heavy landing
        },

        /**
         * With "Reduce motion & flicker" on, every animation becomes a
         * simple fade and the flicker calms down (PRD 5.1 accessibility).
         */
        reducedMotionFadeMs: 200
    },

    /**
     * Default key bindings (PRD 4.6). Phaser key names, several per action.
     *
     * They live here so that remappable controls (PRD 7.1) can later load a
     * saved mapping over the top without any scene changing.
     */
    controls: {
        left: ['A', 'LEFT'],
        right: ['D', 'RIGHT'],
        jump: ['W', 'UP', 'SPACE'],
        down: ['S', 'DOWN'],
        grow: ['E'],
        shrink: ['Q'],
        sizeTiny: ['ONE'],
        sizeNormal: ['TWO'],
        sizeHuge: ['THREE'],
        wheelCooldownMs: 180,  // one wheel flick = one size step, not three
        restart: ['R'],
        pause: ['ESC', 'P'],
        mute: ['M'],
        fullscreen: ['F'],
        hideHud: ['H'],
        debug: ['F1']
    },

    /**
     * Menus and paper panels (PRD 5.1). Shapes only; colours are in palette.
     */
    ui: {
        panelRadius: 10,       // rounded corners of cards and dialogue boxes
        panelEdgePx: 2,        // the panelEdge border
        panelTiltDeg: 2,       // panels land slightly crooked, like paper
        menuSpacing: 58,       // vertical gap between menu items
        hoverScale: 1.05,      // a selected item grows this much
        hoverMs: 120,          // ...over this long
        pauseDim: 0.6          // how dark the paused game behind the menu goes
    },

    /** Candle rating on the results card, by wax left (PRD 4.7). */
    ratings: {
        threeCandles: 60,
        twoCandles: 30
    },

    audio: {
        masterVolume: 0.8,
        musicVolume: 0.4,
        sfxVolume: 0.8,
        musicCrossfadeMs: 800
    }
};
