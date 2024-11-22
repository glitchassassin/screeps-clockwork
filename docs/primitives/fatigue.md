# Fatigue

Each tile may have one of three terrain types: plains, swamp, or wall. Movement on swamps generates 10 fatigue per body part, while movement on plains generates 2. Movement on walls is impossible (unless a road has been built).

All body parts (except `MOVE` and empty `CARRY` parts) [generate fatigue](https://docs.screeps.com/creeps.html#Movement) when the creep moves. When a creep's fatigue level is above 0, it is too tired to move.

- Road: 1 point of fatigue per body part
- Plains: 2 points of fatigue per body part
- Swamps: 10 points of fatigue per body part

Each undamaged `MOVE` part decreases fatigue by 2 points per tick (or 4, 6, or 8 points with T1, T2, and T3 [boosts](https://docs.screeps.com/resources.html#Creep-boosts) respectively).

## Directionality of Paths

Fatigue is generated based on the destination of the move (rather than the origin). So, a creep moving from a plains tile to a swamps tile will incur the fatigue cost of the swamps tile.

This means that the cost of reversed paths aren't _quite_ the same. To pick a simple example:

```
# C = creep, s = swamp, . = plains, X = destination (also swamp)
..sssss..
..sssss..
C.ssXss..
..sssss..
..sssss..
```

Moving from C to X incurs cost for these tiles:

```
# cost 1 for plains, 5 for swamps
C.ssXss..
 ^^^^
 1555 = 16
```

Moving from X to C incurs cost for these tiles:

```
# cost 1 for plains, 5 for swamps
C.ssXss..
^^^^
1155 = 12
```

This distinction may not always be relevant, but if the path cost is critical, it's good to keep in mind before simply reversing paths.
