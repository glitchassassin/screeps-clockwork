# Scenarios

The most optimal pathfinding strategy varies for different kinds of creeps. Some never leave their parent room; others travel far across the map and through portals.

1. Hauler moving within room (to sources, storage, containers)
2. Hauler moving between rooms to remote source
3. Hauler moving between rooms to plunder a room
4. Hauler moving between rooms to bring back resources from power bank/resource deposit
5. Hauler carrying energy to a new room
6. Hauler carrying energy to an engineer/upgrader creep
7. Hauler dodging harassers (bot or invader)
8. Harvester moving to destination (on container, or adjacent to source) and staying put
9. Harvester fleeing from harasser, then returning to work
10. Miner moving to destination (on container, or adjacent to mineral) and then returning to recycle
11. Engineer moving to a specific structure (perhaps closest), then to energy, then back
12. Engineer moving within ramparts to repair a structure without getting in range of enemy attacks
13. Pulling creeps (especially across room borders)
14. Moving through portals
15. Moving through intershard portals
16. Intercepting an enemy creep
17. Kiting an enemy creep
18. Traffic management for hauler swarms
19. Traffic management edge cases (pulling)
20. Blocking squares for certain creeps (e.g. harvesting squares, fastfiller squares)
21. Different move ratio composition means preferring/ignoring roads
22. Quad/formation movement

---

A harvester spawns and moves to its designated source, following a well-known path (probably with roads). Its preferred destination is the container next to the source; if that is occupied by another harvester, it will move to any position adjacent to the source; if all of those are occupied, it will move to the general area and wait for a free space to open up.

A hauler spawns and moves to a specific source of energy (a resource pile, a container, a tombstone, etc.). The target may be in the same room or a different room. It withdraws the energy and then moves to one of many storage structures to deposit the energy. Sometimes, it is following a well-defined path or moving towards a frequent target (e.g. storage); sometimes, it is moving to a less frequent target (a specific extension).

A hauler moves from a source of energy (a resource pile, container, or storage) to a builder that needs energy. The builder's location may change: it may be keeping position around a construction site, or traveling to the construction site.

A builder moves from a source of energy (a resource pile, container, or storage) to the closest of a set of active construction sites, usually _not_ following a well-defined path.
