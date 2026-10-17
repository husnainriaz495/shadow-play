import Phaser from 'phaser';

/**
 * The game's message board (Observer pattern -- CODE_RULES.md 6.2).
 *
 * WHY: the wax timer should not know the HUD exists. Instead the Candle
 * system "announces" EVENTS.WAX_CHANGED here, and UIScene listens and
 * redraws. Either one can be rewritten without touching the other.
 *
 * This is one of the ONLY three singletons allowed (CODE_RULES.md 6.5):
 * importing this file anywhere gives you the same single emitter, because
 * ES modules run once and cache their exports.
 *
 * IMPORTANT: unlike a scene's own emitter, this one survives scene restarts.
 * So every listener you add must be removed on shutdown, or after a restart
 * the same handler runs twice. Use core/Listeners.js, which does the cleanup for you.
 */
export const EventBus = new Phaser.Events.EventEmitter();
