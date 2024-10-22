# Scenarios

The most optimal pathfinding strategy varies for different kinds of creeps. Some never leave their parent room; others travel far across the map and through portals.

## In-Room Navigation

### Flow-fields to points of interest

Haulers entering a room travel directly to Storage: no need to calculate paths individually when they can just follow the flow-field

### Cached paths to points of interest

Paths between controller, storage, and sources might be static and easily reusable.
