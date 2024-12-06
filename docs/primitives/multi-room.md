# Multi-Room Nuances

Pathfinding across rooms introduces some extra complications compared to pathfinding within a room.

Exit tiles, for example, have special "adjacency rules." If you move DOWN from `RoomPosition(25, 48, W1N2)` you don't end up at `RoomPosition(25, 49, W1N2)` - you're at `RoomPosition(25, 0, W1N1)`! But if you move UP from `RoomPosition(25, 49, W1N2)`, you arrive at `RoomPosition(25, 48, W1N2)`.

Similarly, moving RIGHT from `RoomPosition(25, 49, W1N2)` takes you to `RoomPosition(26, 49, W1N1)`.

If a creep remains on an exit tile without moving, it switches to the corresponding exit tile of the adjacent room. While pathing, this _usually_ won't be a problem, as there's no fatigue cost to travel through exit tiles. But if the creep's path is blocked, it might find itself "kicked off" its path when it rotates to the other room.

We'll have to account for this when determining if a creep is "adjacent to the path" to find the next point on the path.
