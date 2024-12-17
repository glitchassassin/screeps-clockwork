const cached: Map<string, { visuals: string; until: number }> = new Map();

/**
 * Persist a visualization for a given number of ticks.
 *
 * Useful for debugging test cases.
 *
 * @param room - The room for which to persist the visualization.
 * @param ticks - The number of ticks for which to persist the visualization.
 */
export function persistVisualizations(room: string, ticks: number) {
  cached.set('global', { visuals: Game.map.visual.export(), until: Game.time + ticks });
  cached.set(room, { visuals: new RoomVisual(room).export(), until: Game.time + ticks });
}

/**
 * Render persisted visualizations (run by the main visualization loop)
 * @param room - The room for which to show the persisted visualization.
 */
export function showPersisted() {
  for (const [room, cachedEntry] of cached) {
    if (Game.time > cachedEntry.until) {
      cached.delete(room);
      return;
    }

    if (room === 'global') {
      Game.map.visual.import(cachedEntry.visuals);
    } else {
      new RoomVisual(room).import(cachedEntry.visuals);
    }
  }
}
