/**
 * One scene change at a time.
 *
 * WHY this exists: a player whose screen looks stuck presses the key
 * again. Without a latch, two `scene.start()` calls land in the same
 * frame and Phaser tears a scene down while it is still building -- which
 * shows up as a freeze, not an error. Every transition in the game goes
 * through here (CODE_RULES.md rule 4: build it once, reuse it).
 *
 * The latch clears on the scene's own `shutdown`, so the same scene can
 * be left again next time it runs.
 *
 * @param {Phaser.Scene} scene the scene being LEFT
 * @param {string} key the scene to start
 * @param {object} [data] scene data for the new scene
 * @returns {boolean} false if a transition was already under way
 */
export function leaveTo(scene, key, data) {
    if (scene.leavingScene) return false;

    scene.leavingScene = true;
    scene.events.once('shutdown', () => { scene.leavingScene = false; });

    // `data ?? {}`, never `data`: Phaser KEEPS the last data a scene was
    // started with when start() is called without any, so a scene that
    // once received { curtainClosed: true } would receive it again every
    // time afterwards. The title screen replayed its whole curtain-up on
    // every return to the menu because of exactly that.
    scene.scene.start(key, data ?? {});

    return true;
}
