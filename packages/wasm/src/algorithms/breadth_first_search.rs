use std::collections::HashSet;

use screeps::RoomXY;

use crate::DistanceMap;

/**
 * Creates a distance map for the given start positions, using a breadth-first search.
 * This does not factor in terrain costs, so it's faster but less useful than Dijkstra's
 * algorithm.
 */
pub fn bfs_distance_map(start: Vec<RoomXY>, is_passable: impl Fn(&RoomXY) -> bool) -> DistanceMap {
    // Initialize the frontier with the passable positions surrounding the start positions
    let mut frontier = start.clone();
    let mut visited = start.iter().cloned().collect::<HashSet<_>>();
    let mut distance_map = DistanceMap::new();

    while let Some(position) = frontier.pop() {
        let current_distance = distance_map.get(position.x, position.y);
        for neighbor in position.neighbors() {
            if is_passable(&neighbor) && !visited.contains(&neighbor) {
                distance_map.set(neighbor.x, neighbor.y, current_distance + 1);
                frontier.push(neighbor);
                visited.insert(neighbor);
            }
        }
    }

    distance_map
}
