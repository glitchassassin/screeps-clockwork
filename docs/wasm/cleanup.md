# Cleaning Up References

We don't have FinalizationRegistry in the Screeps version of JS, so we have to manually free the Rust objects (cost matrix, distance map, path, etc.) that Clockwork creates once it's done with them.

This can make patterns like this tricky:

```ts
const distanceMap = bfsMultiroomDistanceMap(start, {
  costMatrixCallback: room => {
    return getTerrainCostMatrix(room);
  },
  maxRoomDistance: 2
});
```

Here, the cost matrix is getting created in the callback, but it really needs to be tracked and cleaned up once it's not needed:

```ts
const costMatrixes: ClockworkCostMatrix[] = [];
const distanceMap = bfsMultiroomDistanceMap(start, {
  costMatrixCallback: room => {
    const costMatrix = getTerrainCostMatrix(room);
    costMatrixes.push(costMatrix);
    return costMatrix;
  },
  maxRoomDistance: 2
});
costMatrixes.forEach(cm => cm.free());
```

In other cases, we might _not_ want the cost matrix to be cleaned up right away - we might cache it for multiple ticks, or even indefinitely.

## Cleanup Strategy

We'll provide a helper function to mark data as "ephemeral" and clean it up after each tick.

```ts
const distanceMap = bfsMultiroomDistanceMap(start, {
  costMatrixCallback: room => {
    return ephemeral(getTerrainCostMatrix(room));
  },
  maxRoomDistance: 2
});
```

Maybe you mark things ephemeral by default, but occasionally want to change it back to persisted. You can decide to `persist` an ephemeral object:

```ts
const cachedCostMatrix = persist(getEphemeralCostMatrix(room));
```

If you have a different caching strategy, you can simply make sure you call `.free()` when you're done with the object.
