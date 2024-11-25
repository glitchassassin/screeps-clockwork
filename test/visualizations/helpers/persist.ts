const cached: Map<string, { visuals: string; until: number }> = new Map();

/**
 * Persist a visualization for a given number of ticks.
 *
 * Useful for debugging test cases.
 *
 * @param room - The room for which to persist the visualization.
 * @param ticks - The number of ticks for which to persist the visualization.
 */
export function persist(room: string, ticks: number) {
  cached.set(room, { visuals: Game.rooms[room].visual.export(), until: Game.time + ticks });
}

/**
 * Render persisted visualizations (run by the main visualization loop)
 * @param room - The room for which to show the persisted visualization.
 */
export function showPersisted(room: string) {
  const cachedEntry = cached.get(room);
  if (!cachedEntry) return;
  if (Game.time > cachedEntry.until) {
    cached.delete(room);
    return;
  }
  Game.rooms[room].visual.import(cachedEntry.visuals);
}
