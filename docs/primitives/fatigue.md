# Fatigue

Each tile may have one of three terrain types: plains, swamp, or wall. Movement on swamps generates 10 fatigue per body part, while movement on plains generates 2. Movement on walls is impossible (unless a road has been built).

All body parts (except `MOVE` and empty `CARRY` parts) [generate fatigue](https://docs.screeps.com/creeps.html#Movement) when the creep moves. When a creep's fatigue level is above 0, it is too tired to move.

- Road: 1 point of fatigue per body part
- Plains: 2 points of fatigue per body part
- Swamps: 10 points of fatigue per body part

Each undamaged `MOVE` part decreases fatigue by 2 points per tick (or 4, 6, or 8 points with T1, T2, and T3 [boosts](https://docs.screeps.com/resources.html#Creep-boosts) respectively).
