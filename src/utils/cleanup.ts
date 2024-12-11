const cache = new Set<{ free: () => void }>();
let cacheTick = 0;

/**
 * Mark an item as ephemeral. This means that the item will be freed after the
 * current tick.
 *
 * If you don't use this to clean up your data, you'll need to call `free()`
 * yourself.
 *
 * @param item - The item to be cleaned up.
 * @returns The item.
 */
export function ephemeral<T extends { free: () => void }>(item: T) {
  if (cacheTick !== Game.time) {
    for (const item of cache) {
      item.free();
    }
    cache.clear();
    cacheTick = Game.time;
  }
  cache.add(item);
  return item;
}

/**
 * Persist an ephemeral item. This means that the item will not be freed after
 * the current tick.
 *
 * @param item - The item to be persisted.
 * @returns The item.
 */
export function persist<T extends { free: () => void }>(item: T) {
  cache.delete(item);
  return item;
}
