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
    gold: 0xe8b65a,         // logo placeholder, results-card candles, panel borders

    /**
     * Every pop-up in the show (results card, death panel, pause menu,
     * settings) is this dark wine red with a gold border, so a card looks
     * like it belongs to the theatre rather than to the stage behind it.
     * The teal `panel` above stays for things drawn ON the stage.
     */
    stagePanel: 0x2b0910,
    stagePanelAlpha: 0.9,
    buttonRest: 0x3d121c,
    buttonSelected: 0x5e1d2a
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
        fastFallMultiplier: 1.6,  // extra gravity while falling: snappy jumps

        /**
         * TERMINAL VELOCITY, and why it is not optional. Arcade physics
         * checks collisions once a frame: a body moving further in one
         * frame than it can "reach" into a tile passes straight THROUGH
         * the floor. With fastFall the puppet hits ~1770 px/s (30 px a
         * frame) at the bottom of a full-height stage, which tunnels.
         *
         * 1200 px/s is 20 px a frame, caught comfortably by tileBias
         * below, and it is far faster than any real jump -- so nothing in
         * the game feels different, and a long drop can no longer dump the
         * puppet through solid stone (which reads as a fall-to-death bug).
         */
        maxFallSpeed: 1200,

        /**
         * How far INTO a tile Arcade will look when deciding a landing
         * (Phaser's default is 16 px). One whole tile, so the check always
         * covers a frame's worth of falling.
         */
        tileBias: 40
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
        hintDanger: { ...sharp, fontFamily, fontSize: '30px', color: light, align: 'center', shadow: textShadow },
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
        knockbackMs: 220,       // the keys cannot cancel a knockback for this long
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
            // Pushing a crate while Huge (PRD 4.2.1): both arms straight
            // out in front, a shorter stride, leaning into the weight.
            push: { arm: -90, leg: 0, lean: 12, legSwing: 13 },
            // Candle out: everything hangs, on looser springs (higher
            // damping = more swing), and the puppet sags on its rods.
            limp: { arm: 0, leg: 0, lean: 0, damping: 0.95, dropPx: 8 },
            // The ending's bow. A marionette is rigid, so the WHOLE figure
            // is tipped forward on its rods by `lean`; `arm` counter-swings
            // the arms so they still hang towards the floor (ui/
            // BowingPuppet.js). `stand` is the same puppet upright.
            stand: { arm: -4, leg: 0, lean: 0 },
            bow: { arm: -18, leg: 0, lean: 24 }
        }
    },

    wax: {
        start: 100,            // every act starts with a full candle
        max: 100,
        baseDrain: 100 / 120,  // empties in 120 s at Normal (PRD 4.3)
        /**
         * What a `w` pickup gives back, as a percentage of a full candle.
         *
         * It is deliberately SMALL. At 20 a single drop was a fifth of
         * the whole candle, so two of them wiped out whatever the act had
         * cost and the wax stopped being a clock at all -- you ended
         * every act at 100% however long you took. A drop is now a
         * breath, not a refill: the pressure stays on and finding one
         * still matters.
         */
        dropAmount: 8,
        lowThreshold: 30,      // below this the glow dims and the flame panics
        hurtCost: {            // wax lost to each hazard (PRD 4.4)
            fire: 15,
            moth: 10
        },
        knockback: 260,        // horizontal push when burnt
        knockbackUp: 260       // ...and a small hop up, away from the floor
    },

    /** Crates `C` (PRD 4.4): solid, and movable ONLY by a Huge puppet. */
    crate: {
        pushSpeed: 90,         // px/s while a Huge puppet leans on it (Huge walks at 160)
        dragX: 1800,           // px/s² of slowing: stops soon after the push ends
        contactPx: 3,          // how close the puppet's side must be to count as touching

        /**
         * A crate can only slide sideways, never climb. One that lands this
         * many tiles (or more) below where it started cannot get back to its
         * puzzle, so a "stagehand" returns it to its start. Intentional
         * drops in a level must therefore be SHALLOWER than this (Act 2's
         * notch is 1 deep).
         */
        lostDropTiles: 2,
        returnDelayMs: 600,    // let the player see it land before it goes
        returnFadeMs: 250,     // fade out, and back in at the start
        returnRetryMs: 150     // re-check if the puppet is standing on its start
    },

    /**
     * Heavy switches `S` and gates `G` (PRD 4.4, 5.1 "Switch and gate").
     * A switch opens the NEAREST gate; it is pressed by a Huge puppet
     * standing on it or by a crate resting on it.
     */
    switchGate: {
        pressTolerancePx: 4,   // how far off the floor still counts as standing on it
        linkMs: 1000,          // the light line from switch to gate fades over this
        linkWidth: 3,
        openMs: 350,           // the gate rises...
        closeMs: 250,          // ...and drops back faster
        stubPx: 8,             // how much gate still shows when fully raised
        shakeMs: 120,          // a short shake as it opens
        shakeIntensity: 0.004,

        /**
         * THE TIMED GATE (PRD 4.5, Act II). Step off the switch and the
         * gate does not slam at once: it stays open for this long while a
         * ring of light shrinks on the plate and a tick counts it away.
         *
         * That turns one puzzle into a choice. Push the crate onto the
         * switch and the gate is held open for good -- the safe answer.
         * Or press it yourself as Huge, jump out of the notch, shrink
         * (Huge does not fit through the doorway) and run for it. Three
         * seconds is roughly twice what that dash needs, which is the
         * point: it should feel tight and be fair.
         */
        holdSeconds: 3
    },

    /**
     * The shrinking ring of light that shows borrowed time (fx/
     * CountdownRing.js). Used by the timed gate, and by anything else that
     * ever needs to say "you have a few seconds".
     */
    countdownRing: {
        radiusPx: 34,          // at full time; it shrinks towards shrinkTo
        /**
         * How small the ring gets at zero. Kept close to 1 ON PURPOSE: the
         * first version shrank to 0.45 and faded its halo to nothing, so
         * the last second -- the one the player has to read -- was a dot
         * nobody could see. The ARC emptying is what tells the time; the
         * circle only has to stay findable.
         */
        shrinkTo: 0.75,
        widthPx: 4,            // the remaining-time arc
        warnExtraPx: 2,        // ...which thickens once it turns red
        trackWidthPx: 2,       // the full circle behind it, always visible
        trackAlpha: 0.5,
        glowAlpha: 0.55,       // the halo at full time...
        glowFloor: 0.45,       // ...never fading below this much of it
        warnFraction: 0.34,    // below this the ring turns danger red
        tickMs: 1000           // one tick a second
    },

    /**
     * Hints painted on the stage, map symbol `?` (PRD 4.10, 5.1). PRD 5.1
     * says "within 4 tiles"; 3 to show and 4 to hide keeps two neighbouring
     * hints from both being open and overlapping. The gap between the two
     * stops a hint flapping open and shut at the edge.
     */
    hint: {
        showTiles: 3,          // unfolds when the puppet is this close (sideways)...
        hideTiles: 4,          // ...and folds away beyond this
        paddingX: 22,          // paper around the text
        paddingY: 12,

        /** WARNING hints (`{ danger: true }` in a level's hints): PaperPanel.dropIn. */
        danger: {
            y: 118,            // under the act title's plate
            dropPx: 44,        // falls in from this far above...
            dropMs: 420,       // ...with a Back.Out overshoot
            shakePx: 5,        // then a quick shake
            shakeMs: 45,
            shakeTimes: 3,
            pulseScale: 1.04,  // then a gentle pulse until it closes
            pulseMs: 650,
            iconScale: 1.2,    // the flame icon (18x26 texture)
            iconGap: 12
        }
    },

    /**
     * Burning paper (PRD 4.4). Timings are PER TILE: a tile lights its
     * paper neighbours one tile's worth of travel after catching, and
     * becomes a hole burnToHoleSeconds after catching.
     *
     * The fire front SPEEDS UP over the act: speedStart px/s when it starts
     * spreading, easing to speedEnd px/s over rampSeconds, so the chase
     * tightens as it goes. Every size still outruns it (Huge walks 160).
     * TILE_SIZE / speedStart (40 / 67 = 0.6 s) must stay BELOW
     * burnToHoleSeconds, or every tile burns out before it spreads and the
     * fire dies. (PRD's "spread every 2.5 s, hole after 1 s" did exactly that.)
     */
    fire: {
        speedStart: 67,        // px/s the front moves at when it starts spreading...
        speedEnd: 90,          // ...ramping up to this...
        rampSeconds: 6,        // ...over this long: Act 5's paper runs out at ~6.5 s, so it hits speedEnd
        burnToHoleSeconds: 1.4,// catch -> hole: the burning band is ~2 tiles wide
        startDelaySeconds: 2.5,// the map's `f` tiles wait this long first: a head start

        glowRadius: 34,        // each burning tile's soft orange glow, once settled
        glowAlpha: 0.75,
        frontGlowRadius: 72,   // a tile that has JUST caught flares this big and bright,
        frontGlowAlpha: 1,     // then settles over its burn, so the front edge glows
        emberEveryMs: 120,     // every burning tile puffs an ember this often
        emberLifeMs: 900,
        maxEmbers: 220,        // the particle pool's size (CODE_RULES 9)
        frontEmbers: 4,        // a burst of embers rises from each new ignition
        holeEmbers: 6,         // a little burst when a tile burns through

        // As the fire spreads, the candle's light on the paper warms towards
        // this red-orange; at all the act's paper burning or burnt it is
        // heatTintMax of the way there. Eased, never a jump.
        heatTint: palette.flameOuter,
        heatTintMax: 0.6,
        heatEasePerFrame: 0.04,

        // The burnable paper tile: cream with a scorched rim (StageTextures).
        paperTile: {
            scorchRings: 6,        // how far in the scorch reaches, in px
            scorchMix: 0.55,       // warm orange towards shadow: the burnt colour
            scorchMaxAlpha: 0.85,  // at the very edge
            notches: [[6, 1, 3], [27, 2, 2.5], [39, 14, 3], [1, 30, 2.5], [18, 39, 3], [33, 38, 2]]
        }
    },

    /** What a hit looks like (PRD 4.8, 5.1): flash, shake, blink. */
    hit: {
        flashMs: 90,           // the puppet glows white-hot this long
        shakeMs: 160,          // camera shake (strength: anim.shake.hit)
        blinkAlpha: 0.35,      // blinking while invulnerable...
        blinkMs: 100           // ...this fast
    },

    /** Falling out of the bottom of the stage (through a burnt hole). */
    fall: {
        restartDelayMs: 450    // a beat to see the fall, then straight back (PRD 4.8)
    },

    /**
     * The draft (systems/DraftWind.js, PRD 6.4). Always the same three
     * beats -- calm, a second of warning, then the gust -- so it can be
     * planned around rather than dodged by luck.
     */
    draft: {
        intervalSeconds: 6,    // time between gusts
        telegraphSeconds: 1,   // warning before a gust (curtains flutter)
        gustSeconds: 1.5,      // how long the player is held Tiny

        /**
         * The SHOVE. A Tiny shadow has nothing holding it down and is
         * thrown; a bigger one is only leaned on. In the AIR there is
         * nothing to brace against at all, which is what carries a Tiny
         * puppet over the gap in act 4 -- raise pushAirborneScale and
         * the jump gets easier, lower it and the gap becomes impossible.
         */
        pushTiny: 150,         // px/s added to the puppet's own speed
        pushNormal: 45,
        pushAirborneScale: 2.4,
        maxPushSpeed: 420,     // however hard it blows, never more than this

        /** The flame fights the draft, so it burns more wax in the open. */
        openDrainScale: 1.6,

        /** How fast the stage leans into a gust and settles after it. */
        strengthEasePerFrame: 0.12,
        telegraphStrength: 0.35,

        /** The streak texture, baked once in StageTextures. */
        streakWidth: 120,
        streakHeight: 3,

        /** Streaks of moving air crossing the stage (fx/WindEffects.js). */
        streak: {
            topY: 60,
            bottomY: 700,
            speedMin: 620,
            speedMax: 1100,
            drift: 40,
            lifeMs: 2200,
            scaleMin: 0.7,
            scaleMax: 1.8,
            alpha: 0.5,
            maxStreaks: 120,
            telegraphEveryMs: 110,   // a few, as the warning...
            gustEveryMs: 28          // ...then a torrent
        },

        /** The "GUST!" card and the countdown bar (ui/GustWarning.js). */
        warning: {
            barY: 92,          // just under the act title's plate
            barWidth: 360,
            barHeight: 5,
            barAlpha: 0.85,
            trackAlpha: 0.35,
            panelY: 150,
            iconScale: 0.8
        },

        /**
         * The open window drawn at each `^`: where the draft comes in.
         * Without one the wind came from nowhere.
         */
        window: {
            width: 56,
            height: 78,
            frameWidth: 4,
            openAlpha: 0.85,
            curtainHeight: 30,
            curtainAlpha: 0.7,
            flutterDeg: 14,
            flutterMs: 120
        },

        /** The wind icon, drawn in UiTextures. */
        icon: {
            size: 34,
            stroke: 3
        },

        /** Paper scraps blown across the stage (PRD 5.1). */
        scrap: {
            perTelegraph: 4,   // a few, as the warning
            perGust: 18,       // a lot, during the gust itself
            maxScraps: 90,
            speedMin: 150,
            speedMax: 340,
            lift: 70,
            lifeMs: 1600,
            scale: 1.3,
            edgeDivisor: 2     // with no `^` on the map, blow from mid-height
        }
    },

    /**
     * A shelter alcove (objects/Shelter.js): the only place a gust does
     * not reach. Its curtain waves during the telegraph.
     */
    shelter: {
        width: 76,
        height: 112,
        archRadius: 28,
        postWidth: 5,          // the uprights, so it reads as built
        screenAlpha: 0.8,      // lit paper, not a dark hole
        rimAlpha: 0.9,

        curtainHeight: 14,
        curtainDrop: 6,
        curtainAlpha: 0.75,
        flutterDeg: 7,
        flutterMs: 140,

        /** The still air behind it: visible safety from across the room. */
        glowRadius: 92,
        glowMinAlpha: 0.22,
        glowMaxAlpha: 0.4,
        glowPulseMs: 2200
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
        scaleHuge: 1.3,           // candle held close: a wide, bright pool

        // A draft drags the pool downwind of the candle, and a flame
        // bent sideways throws less light forward (CONFIG.draft).
        windLeanPx: 110,
        windDim: 0.3,

        // The "breath" when the puppet changes size (PRD 5.1): the pool
        // swells and settles. A multiplier, so it works at any wax level.
        breathScale: 1.12,
        breathInMs: 110,
        breathOutMs: 260
    },

    /**
     * Landing (fx/DustPuff.js, PRD 5.1). The squash itself is the `land`
     * pose in CONFIG.rig.poses; this is the dust and the camera.
     */
    land: {
        minFallSpeed: 260,  // slower than this and a landing kicks up nothing
        nudgeSpeed: 700,    // ...and only a drop faster than THIS moves the camera
        nudgeMs: 120,

        motes: 7,           // at Normal; scaled by the puppet's size
        maxMotes: 40,
        speedX: 90,         // dust is thrown sideways from under the feet...
        speedY: 70,         // ...and a little up
        gravityY: 260,      // before settling back down
        lifeMs: 420
    },

    /**
     * The size-change afterimage (fx/Afterimage.js, PRD 5.1): stamped
     * copies of the puppet left behind as it grows or shrinks.
     *
     * width/height must hold the puppet at its BIGGEST with its limbs
     * thrown out, or a stamp is clipped at the edges.
     */
    afterimage: {
        count: 3,
        width: 200,
        height: 260,
        gapMs: 55,          // one stamp every this long, so they fade in turn
        startAlpha: 0.4,
        fadeMs: 260,
        risePx: 10          // they drift up a little as they go
    },

    /**
     * Act backdrops (village, castle, forest...): black silhouettes painted
     * faintly on the paper (ASSETS.md "~30% opacity"). Kept faint so the
     * scenery never looks like a platform you could stand on.
     */
    backdrop: {
        alpha: 0.2,            // was 0.3: the puppet and platforms must always read first
        // Multiplied over the art to darken it. Today's backdrops are already
        // near-black silhouettes, so this only matters for art with lighter
        // tones -- it keeps any backdrop from ever out-shining the level.
        tint: palette.frame
    },

    /** Soft dark edges and a whisper of film grain, baked once at boot. */
    vignette: {
        innerRadius: 0.45,        // fraction of the screen left untouched
        edgeAlpha: 0.55,          // darkness in the very corners
        grainAlpha: 0.05          // strength of the grain specks
    },

    /** The gloved hand that points at the exit door as an act begins. */
    pointer: {
        showMs: 3500,          // how long it stays before fading
        slideFromPx: 60,       // slides down from this far above...
        slideMs: 400,          // ...over this long (Back.Out, PRD 5.1)
        bobPx: 6,              // then bobs towards the door (PRD 5.1: +-6 px, 600 ms)
        bobMs: 600,
        gapPx: 8,              // the fingertip stops this far above the door
        fadeMs: 300,
        scale: 0.6,            // the 64 px glove, a little smaller than the door
        glowRadius: 34,
        glowAlpha: 0.5,
        glowLiftPx: 20         // the glow sits behind the hand, not the fingertip
    },

    /** The exit door's glow, so the goal is visible from anywhere (PALETTE.md). */
    door: {
        glowRadius: 80,
        glowMinAlpha: 0.35,
        glowMaxAlpha: 0.8,
        pulseMs: 1400
    },

    /**
     * Moths (objects/Moth.js, PRD 4.4 and 6.4). The two-frame flap alone
     * looks stiff, so everything below layers code-driven motion on top of
     * it. Tune the FEEL here; the act decides where they are.
     */
    moth: {
        waxCost: 10,          // what touching one costs (PRD 4.4)
        bodyWidth: 26,        // smaller than the art: a moth should feel
        bodyHeight: 22,       // dodgeable, not like a flying brick

        // Steering (PRD 6.4: toward the player, sin wobble, max speed 90).
        maxSpeed: 90,
        accel: 260,
        noticeRadius: 420,    // beyond this it drifts back to where it started
        wobbleMs: 1700,       // one slow rise and fall...
        wobble: 420,          // ...this strong

        // Wing-beats. Faster while climbing than while gliding down, and
        // each downbeat lifts it a little, so the bob IS the wing-beat.
        flapFpsClimb: 14,
        flapFpsGlide: 6,
        flapLift: 26,
        flapSquashX: 1.08,    // wings down: wide and flat...
        flapSquashY: 0.9,     // ...back to 1.0 on the upbeat

        // Banking: the same damped spring the puppet's joints use.
        bankStiffness: 120,
        bankDamping: 0.8,
        bankMaxDeg: 20,
        bankPerSpeed: 0.22,   // degrees of lean per px/s sideways
        facingThreshold: 8,   // ignore drift this small, or it flips constantly

        // Flutter, so two moths never move identically.
        jitter: 1.5,          // px (PRD 6.4)
        jitterEveryMinMs: 120,
        jitterEveryMaxMs: 200,
        jitterEase: 0.18,
        jitterPush: 40,       // how hard a nudge pushes the body

        /**
         * How far a lit lantern pulls (Act III). Wide enough that lighting
         * one at the mouth of the corridor reaches the moths inside it,
         * and no wider -- a lure that moved every moth on the stage would
         * make the act a button press.
         */
        lureRadius: 420,

        // Drawn to the flame: nearer the candle it works harder and shakes
        // more, and very close it starts catching embers.
        flameRadius: 260,
        flameFlapBoost: 1.2,
        flameJitterBoost: 2,
        sparkNearness: 0.65,

        // Swatted by a Huge puppet: spin, fall, come apart.
        swatSpinPerSecond: 720,   // degrees (PRD 6.4)
        swatUp: 120,
        swatKeepX: 0.4,
        swatFadeMs: 600,

        /** The paper it bursts into (fx/MothEffects.js). */
        flake: {
            perBurst: 12,
            maxFlakes: 60,
            speedMin: 40,
            speedMax: 140,
            lifeMs: 700,
            scale: 1.4,
            gravityY: 420
        },

        /** Embers caught off the candle. */
        spark: {
            perPuff: 2,
            maxSparks: 24,
            everyMs: 260,
            rise: 50,
            drift: 20,
            lifeMs: 420,
            scale: 0.5
        }
    },

    /**
     * How hard each act is, in the order they are played (PRD 4.5). This
     * is THE difficulty curve, and it is checked rather than trusted:
     * tools/headless/test-curve.mjs reads every map and fails if its
     * contents disagree with the row below, so the table and the levels
     * cannot drift apart.
     *
     * `startWax` is out of CONFIG.wax.max, so an act that starts at 85
     * honestly shows "WAX 85%" from its first frame -- the player can see
     * they have been given less. `drainScale` multiplies the melt on top
     * of the size multiplier: Act I is gentle at 0.8 so a new player can
     * wander and read the hints, and by the finale the candle is already
     * low before the fire is lit.
     *
     * `hints` is zero everywhere but act I on purpose: act I names the
     * keys and no act tells the player its own answer.
     *
     * The rest of the row describes what the MAP must contain:
     * `waxDrops` (`w`), `checkpoints` (`k`), `hints` (`?`), `moths` (`m`)
     * and `vents` (`^`). Change a map and this row changes with it.
     *
     * If an act ever becomes unwinnable, the two numbers at the top are
     * what to move, not the map.
     *
     * STILL TO DO (play-test pass 3): acts II, III and IV are down for a
     * checkpoint lantern each, and act III for lanterns that lure moths.
     * Their rows say `checkpoints: 0` because that is what their maps
     * hold TODAY -- the row is raised in the same change that adds the
     * lantern, so this file never describes a level that does not exist.
     */
    acts: [
        {
            name: 'I - learn your shadow',
            startWax: 100, drainScale: 0.80,
            waxDrops: 3, checkpoints: 2, hints: 3, moths: 0, vents: 0, lures: 0
        },
        {
            name: 'II - The Giant',
            startWax: 100, drainScale: 1.00,
            waxDrops: 3, checkpoints: 0, hints: 0, moths: 0, vents: 0, lures: 0
        },
        {
            name: 'III - Moths to the Flame',
            startWax: 95, drainScale: 1.10,
            waxDrops: 3, checkpoints: 0, hints: 0, moths: 4, vents: 0, lures: 2
        },
        {
            name: 'IV - The Draft',
            startWax: 90, drainScale: 1.20,
            waxDrops: 2, checkpoints: 0, hints: 0, moths: 0, vents: 2, lures: 0
        },
        {
            name: 'V - The Last Act',
            startWax: 85, drainScale: 1.30,
            waxDrops: 3, checkpoints: 0, hints: 0, moths: 0, vents: 1, lures: 0,
            /**
             * The finale borrows ONE idea from Act IV, and borrowing is
             * all it does: a gust every 14 seconds instead of Act IV's 6.
             * The finale already has a fire behind you and a crate to
             * push, and a gust that lands on top of every push would be
             * noise rather than a test. Long enough that a gust is an
             * interruption you shelter from and then carry on.
             */
            draftIntervalSeconds: 14
        }
    ],

    /**
     * The loading screen (ui/LoadingCandle.js). Drawn entirely with
     * Graphics: it runs before any art has loaded.
     */
    loading: {
        minMs: 1100,           // held this long, or a cached load just flashes
        gap: 40,               // candle bottom, above the middle of the screen
        candleWidth: 26,
        candleHeight: 86,
        litSide: 0.4,
        dishWidth: 56,
        dishHeight: 12,
        wickHeight: 7,
        flameWidth: 20,
        flameHeight: 34,
        coreHeight: 0.6,
        flicker: 0.07,
        flickerMs: 140,
        barWidth: 420,
        barHeight: 18,
        barInset: 3,
        barGap: 36,            // below the middle
        labelGap: 86
    },

    /**
     * The title screen (scenes/TitleScene.js). CONTINUE only appears once
     * an act past the first has been reached, so the card is a little
     * taller then.
     */
    title: {
        /** The curtain drawn back at each side, framing the menu. */
        frameScale: 1.05,
        frameWidth: 150,       // how much of each half still shows
        openDelayMs: 500,      // the logo is read on the shut curtain first

        logoY: 148,
        logoScale: 0.58,
        taglineY: 232,

        /** A page of choices (ui/MenuPage.js). */
        menu: {
            y: 480,
            width: 430,
            wideWidth: 580,    // act select and settings need the room
            padY: 40,
            headingGap: 66,    // room above the list for a page heading
            noteGap: 54        // ...and for a line of text under it
        },

        /** A page of reading (ui/TextPage.js). */
        textPage: {
            y: 360,            // centred on the stage: it IS the whole page
            width: 720,
            padX: 48,
            padY: 30,
            headingBlock: 56,  // room the heading takes
            lineGap: 31,
            backGap: 62,
            /**
             * Where the second column of a two-column row starts, measured
             * from the left margin. One value for every reading page, so
             * HOW TO PLAY and CREDITS line up with each other as well as
             * with themselves. Wide enough to clear the longest label on
             * either page ("E / Q or the wheel").
             */
            columnX: 234
        },

        /** The "quit" curtain call (scenes/CurtainCallScene.js). */
        quit: {
            thanksY: 300,
            fadeMs: 700,
            menuY: 430
        },

        /** Read on the HOW TO PLAY page. Keep each line short. */
        howToPlay: [
            'You are a shadow on a paper screen. The candle',
            'behind you decides how big that shadow is.',
            '',
            ['A / D or arrows', 'walk'],
            ['W, Up or Space', 'jump'],
            ['E / Q or the wheel', 'candle closer / further away'],
            ['1 / 2 / 3', 'tiny / normal / huge'],
            ['R', 'start the act again'],
            ['Esc or P', 'pause'],
            '',
            'HUGE jumps higher, pushes crates and swats moths,',
            'but burns the candle twice as fast. TINY fits',
            'where nothing else does, and burns slowest.',
            '',
            'When the wax runs out, the curtain falls.'
        ],

        /** Read on the CREDITS page. The full list is in CREDITS.md. */
        credits: [
            'Created for the NASCON',
            'Vibe Coding Game Dev Competition.',
            '',
            'Ayesha Muzammil',
            'Husnain Riaz',
            'Haziq Haroon',
            'Aiza Kashif',
            '',
            ['Engine', 'Phaser 3 and Vite'],
            '',
            'No code was copied from another game.',
            '',
            'Thank you for watching.'
        ]
    },

    /**
     * The theatre curtain (ui/Curtain.js). The painted halves are 660 px
     * each against a 1280 px stage, so butting them together leaves only
     * 40 px of overlap -- and the art's inner edges fade to transparent,
     * which shows as a seam of stage down the middle. The halves are
     * scaled up until they overlap by this much.
     */
    curtain: {
        overlapPx: 160
    },

    /**
     * The card shown whenever the show stops (systems/Death.js). Every
     * death gets the SAME card; only the reason line differs.
     */
    death: {
        heading: 'THE CURTAIN FALLS',
        width: 520,
        y: 360,
        depth: 95,             // over the shut curtain
        blameMs: 1200,         // a hit this recent is what emptied the wax

        reasons: {
            fell: 'You fell through the stage.',
            wax: 'The candle went out.',
            fire: 'The fire caught you.',
            moth: 'The moths took the last of your wax.'
        }
    },

    /** Game over, when the wax reaches 0 (systems/Death.js). */
    candleOut: {
        limpMs: 700,           // the puppet hangs limp this long before the curtain
        messageFadeMs: 400     // "The candle went out" fades in on the curtain
    },

    /**
     * The results card shown when an act is finished (ui/ResultsCard.js,
     * PRD 4.10, 5.1). It appears on the closed curtain, before the next
     * act is announced.
     */
    results: {
        /**
         * Laid out top to bottom, each block clear of the last: heading,
         * the three numbers, a gap, the rating candles, then the way on.
         * The card is sized from these, so adding a row means raising
         * `height` and nothing else moves on top of anything.
         */
        width: 480,
        height: 430,
        padX: 46,
        padY: 44,
        headingGap: 84,        // heading down to the first number
        rowGap: 42,
        candlesGap: 74,        // last number down to the candles
        promptGap: 64,         // candles down to "Continue"

        countMs: 600,          // the numbers climb from 0 (PRD 5.1)
        promptFadeMs: 320,
        promptPulseAlpha: 0.45,
        promptPulseMs: 900,

        /**
         * One to three candles, from the wax left. A player who restarted
         * this many times or more loses one, however tidy the run they
         * finally managed -- but never below one: finishing counts.
         */
        rating: {
            three: 0.6,
            two: 0.3,
            restartsForPenalty: 3
        },

        candleCount: 3,
        candleGap: 58,
        candleWidth: 14,
        candleTall: 44,
        candleShort: 16,
        flameScale: 0.55,
        candlePopMs: 180,
        candlePopGapMs: 150    // one at a time (PRD 5.1)
    },

    /**
     * The act card shown on the closed curtain between acts
     * (scenes/ActCardScene.js, PRD 5.1). The title ink-writes letter by
     * letter, the story line fades in under it, then the curtain opens on
     * the act already built behind it.
     */
    actCard: {
        ofY: 232,              // "ACT III OF V", above the act's own title
        titleY: 300,           // the two lines, measured down the stage
        storyY: 400,
        storyFadeMs: 500,
        holdMs: 1200,          // how long the finished card stays up
        openDelayMs: 200       // a beat after the new act is built, then open
    },

    /**
     * The ending: the puppet bows, the candle burns out by itself, the
     * curtain closes and the last words are written on it (PRD 4.7, 5.1).
     */
    ending: {
        bowInMs: 900,          // the puppet folds into the bow...
        bowHoldMs: 700,        // ...holds it...
        bowOutMs: 700,         // ...and straightens up
        bows: 2,               // how many times it bows before the lights go
        zoomTo: 1.3,           // the camera creeps in on the bow (PRD 5.1)
        zoomMs: 6000,
        dimStartMs: 2200,      // when the candle starts to go
        dimMs: 3000,           // ...and how long it takes to die
        curtainDelayMs: 600,   // after the light is gone, the curtain closes
        finDelayMs: 500,       // then the last words are written

        /**
         * The last words of the show, written in ink on the shut curtain.
         * Here rather than typed into EndScene so the ending can be said
         * differently without touching the scene (CODE_RULES.md rule 5).
         */
        finalWords: 'The End',
        promptFadeMs: 600,
        /**
         * The way out is written in the MIDDLE of the shut curtain, in
         * the place the last words just left -- not down at the bottom.
         *
         * WHY: the programme scrolls up the curtain and its last lines
         * are still low on the stage when it ends, so a prompt down there
         * sits on top of them. The centre is empty by then, and the line
         * reads as taking the place of the words rather than fighting
         * the credits for the same strip of velvet.
         */
        promptRisePx: 36,      // it starts this far below centre and rises
        /**
         * The programme that scrolls up the shut curtain at the very end
         * (ui/CreditsScroll.js). `speed` is px a second, and the scroll
         * lasts as long as the column is tall -- so adding a name makes
         * it longer, never faster.
         */
        credits: {
            startBelow: 40,    // begins this far under the stage...
            endAbove: 120,     // ...and finishes this far over the top
            speed: 62,
            roleGap: 34,       // under a role, before its name
            nameGap: 54,       // under a name, before the next role
            gapHeight: 40,     // a blank entry
            startDelayMs: 900, // a beat after the last words, before it begins
            /**
             * How long the way out is left on screen before the show
             * returns to the menu on its own.
             *
             * It has to outlast promptFadeMs by enough to READ the line:
             * at 1200 the prompt had barely finished rising into place
             * before the ending left anyway, which made the offer look
             * like a flicker.
             */
            holdMs: 4000
        },

        /**
         * Read as a theatre programme: a role, then who did it. `gap`
         * leaves a blank line. The full list is in CREDITS.md.
         */
        programme: [
            { name: 'SHADOW PLAY' },
            { gap: true },
            { role: 'A SHADOW-PUPPET SHOW IN FIVE ACTS' },
            { gap: true },
            { gap: true },
            { role: 'MADE BY' },
            { name: 'Ayesha Muzammil' },
            { name: 'Husnain Riaz' },
            { name: 'Haziq Haroon' },
            { name: 'Aiza Kashif' },
            { gap: true },
            { role: 'CREATED FOR', name: 'NASCON Vibe Coding Game Dev Competition' },
            { role: 'ENGINE', name: 'Phaser 3 and Vite' },
            { gap: true },
            { gap: true },
            { role: 'NO CODE WAS COPIED FROM ANOTHER GAME' },
            { gap: true },
            { gap: true },
            { name: 'Thank you for watching the show' }
        ],

        groundY: 600,          // where the puppet stands on the stage
        puppetScale: 3.2,      // a curtain call is close up, not a wide shot
        lightAtHeight: 0.55    // the candle it holds, up its own height
    },

    /**
     * The checkpoint lantern `k` (objects/Lantern.js). Lighting one moves
     * where the act restarts AND remembers the wax you had, because
     * respawning with the last drop you arrived on is unwinnable.
     */
    lantern: {
        standOffsetY: 6,       // it sits on its tile, not floating in it
        glowRadius: 110,
        glowMinAlpha: 0.3,
        glowMaxAlpha: 0.5,
        glowPulseMs: 1900,
        /**
         * How long a LURE lantern (`l`, Act III) holds the moths before it
         * gutters out and they come back. Long enough to walk the corridor
         * at a normal pace, short enough that standing still wastes it.
         */
        lureSeconds: 6,
        lureFadeMs: 900,       // the glow dying, so the player sees it end

        flareAlpha: 0.95,      // the moment it catches...
        flareScale: 1.7,
        flareMs: 520,

        /** A lit lantern pulls moths to it for this long (act 3). */
        lureSeconds: 5,
        lureRadius: 320
    },

    /** How a wax drop `w` moves. How much wax it gives is CONFIG.wax.dropAmount. */
    waxDrop: {
        bobPx: 6,              // gentle up-and-down so it reads as a pickup
        bobMs: 900,
        pickupRisePx: 24,      // floats up as it fades when taken...
        pickupMs: 250,         // ...over this long

        // A soft warm halo so a drop reads as a pickup even in the dark
        // (PALETTE.md: flameCore is the "wax pickup sparkle").
        glowRadius: 26,
        glowMinAlpha: 0.3,
        glowMaxAlpha: 0.7,
        glowPulseMs: 1100      // a slow twinkle, never a blink
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
        easeSweep: 'Cubic.InOut',   // long travel: the curtain halves

        panelInMs: 300,        // a paper panel unfolds
        panelOutMs: 200,       // ...and folds away faster
        cardInMs: 400,
        cardOutMs: 200,
        textCps: 40,           // typewriter speed, characters per second

        curtainMs: 700,        // curtain close/open sweep
        curtainOpenMs: 900,
        quickRestartMs: 450,   // the "curtain flick" on R or death...
        flickAmount: 0.4,      // ...which only draws the halves this far across
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
        devNextAct: ['N'],     // only when DEBUG is true (PRD 4.6)
        devPrevAct: ['B'],
        debug: ['F1']
    },

    /**
     * How the HUD candle shows the BURN RATE (PRD 4.3.1): "bigger shadow =
     * faster burn" must be visible in a trailer clip with no voice-over.
     * The rate is the size's waxMultiplier (Tiny 0.75, Normal 1, Huge 2).
     */
    hud: {
        burnTweenMs: 200,          // the flame eases to its new size, like the puppet
        flameScalePerRate: 0.6,    // flame size = 1 + (rate - 1) x this: Tiny 0.85, Huge 1.6
        flickerSpeedPerRate: 1.0,  // flicker speed = 1 + (rate - 1) x this: Huge twice as fast
        dripsPerSecond: 1.0,       // at x1. Grows with rate SQUARED: Tiny 0.56/s, Huge 4/s
        dripFallMs: 2000,          // a drip's run down the candle at x1, divided by the rate
        dripPoolSize: 12,          // drips are made once and reused (CODE_RULES 9)
        actTagX: 360,          // "ACT III / V" in the band, clear of the burn tag
        dripWidth: 4,              // sized for the small candle in the HUD band
        dripHeight: 9,

        /** The HUD candle's shape (ui/WaxCandle.js), small enough for the band. */
        candle: {
            width: 14,
            maxHeight: 32,
            lightSide: 0.4,        // the brightest stripe sits this far across
            poolHeight: 4,         // the melted pool on top
            dishWidth: 26,
            dishHeight: 5,
            baseWidth: 16,
            baseHeight: 4,
            wickHeight: 4,
            flameScale: 0.6,       // of the 18x26 flame texture
            flameLift: 2,
            haloScale: 0.35,       // of the 128 px soft_glow
            haloLift: 9
        },

        /** Its shading, as palette mixes (PALETTE.md: no colour typed elsewhere). */
        candleShade: {
            edgeWarmth: 0.22,      // wax towards flameOuter at the top edges
            baseDim: 0.12,         // wax towards the dark frame at the bottom middle
            edgeDim: 0.4,          // ...and at the bottom edges
            poolGlow: 0.45,        // the melted pool, wax towards flameCore
            dishLit: 0.35,         // the dish's top, shadow towards flameOuter
            dishShine: 0.55,       // the dish's front rim, shadow towards flameCore
            baseLit: 0.18
        },

        /** The wax panel in the HUD band (ui/WaxPanel.js). */
        waxPanel: {
            width: 176,
            height: 56,
            candleX: 24,           // the candle's centre, from the panel's left
            candleBottom: 46,      // where the wax stands, from the panel's top
            labelX: 46             // "WAX 87%" starts here
        },
        windLeanDeg: 32,           // the HUD flame bends when a draft blows
        windHaloDim: 0.45,         // ...and its halo thins

        dangerFraction: 0.25,      // below this much wax, the panel pulses in danger
        dangerPulseAlpha: 0.35,
        dangerPulseMs: 420,
        idleMs: 150,               // no wax news for this long = paused, so no drips
        // The burn-rate tag uses words, not "x2": playtest feedback was that
        // nobody knows what "x1" means. Nothing is shown at Normal.
        burnFastText: 'BURNING FAST',
        burnSlowText: 'BURNING SLOW',

        tagPopScale: 1.7,          // the tag pops from this size...
        tagPopMs: 350,             // ...back to 1 over this long
        tagPulseAlpha: 0.5,        // while Huge the tag throbs down to this alpha...
        tagPulseMs: 420            // ...and back, this fast
    },

    /**
     * Menus and paper panels (PRD 5.1). Shapes only; colours are in palette.
     */
    ui: {
        panelRadius: 10,       // rounded corners of cards and dialogue boxes
        panelEdgePx: 2,        // the panelEdge border
        panelTiltDeg: 2,       // panels land slightly crooked, like paper
        titlePadX: 28,         // the act title's plate: room either side...
        titlePadY: 6,          // ...and above and below the letters
        menuSpacing: 58,       // vertical gap between menu items
        /** The gold rule under a panel's heading (ui/PaperPanel.js). */
        ornament: {
            width: 150,
            gap: 34,
            diamond: 5,
            thickness: 2,
            alpha: 0.85,
            drop: 26           // how far under the heading's baseline
        },

        /** A menu item's own plate, so a choice reads as a button. */
        button: {
            width: 330,
            height: 44,
            radius: 8,
            restAlpha: 0.0,    // invisible until it is the selected one
            selectedAlpha: 1,
            underlineMs: 140,  // the ink line drawing left to right (PRD 5.1)
            underlineDrop: 17, // below the label's centre
            underlineThickness: 2,
            pressScale: 0.95,
            pressMs: 90
        },

        /**
         * A slider row, measured from the card's LEFT edge so every row
         * lines up: label, then the bar, then the - and + at the right.
         */
        dialLabelX: 54,
        dialBarX: 250,
        dialInset: 44,         // the + sits this far in from the right edge
        dialArrowGap: 40,      // and the - this far left of the +

        /** The bar's notches: identical rectangles, not characters. */
        notchWidth: 9,
        notchGap: 6,
        notchHeight: 20,
        notchEmptyAlpha: 0.35,
        handScale: 0.8,        // the pointing hand beside the selected item
        handGap: 18,
        padDeadzone: 0.5,      // how far a stick must move to count as a press
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
        /**
         * Background music on or off. ON. It was switched off during
         * play-testing because it got irritating on repeat -- the fix was
         * the quieter default mix below and a music dial in Settings,
         * not silence. M still mutes everything.
         */
        musicOn: true,

        /**
         * The DESIGN mix: how loud each kind of sound is relative to the
         * others, set by us. The player's own sliders multiply these, so
         * turning music up to 10 still keeps it under the effects.
         */
        masterVolume: 0.8,
        musicVolume: 0.2,      // was 0.4: the theme was far too loud
        sfxVolume: 0.8,
        musicCrossfadeMs: 800,

        /**
         * The player's sliders (Settings). 0-10 as SECURITY.md rule 12
         * requires, saved in the one record. `maxLevel` is what 10 means.
         */
        maxLevel: 10,
        defaultLevels: { master: 8, music: 5, sfx: 8 },

        /**
         * The stand-in sounds made in the browser for files that do not
         * exist yet (systems/SynthSounds.js). Deliberately under the real
         * recordings: they are a floor, not a finish.
         */
        synthVolume: 0.5,
        synthAttack: 0.008,    // seconds; any less and every sound clicks
        synthNoiseSeconds: 1   // the reused white-noise buffer
    }
};
