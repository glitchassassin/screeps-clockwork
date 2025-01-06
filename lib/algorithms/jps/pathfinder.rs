use std::collections::HashSet;

use screeps::{game, Position, RoomCoordinate, RoomName, RoomTerrain};

use super::{
    collections::{Heap, OpenClosed},
    goal::{Goal, PathfindingOptions, PathfindingResult},
    room::RoomInfo,
    types::{Cost, MapPosition, PosIndex, RoomIndex, WorldPosition, MAX_ROOMS, OBSTACLE},
};

pub struct PathFinder {
    room_table: Vec<RoomInfo>,
    reverse_room_table: Vec<RoomIndex>,
    blocked_rooms: HashSet<MapPosition>,
    parents: Vec<PosIndex>,
    open_closed: OpenClosed,
    heap: Heap,
    goals: Vec<Goal>,
    look_table: [Cost; 4],
    heuristic_weight: f64,
    max_rooms: u8,
    flee: bool,
    in_use: bool,
}

impl PathFinder {
    pub fn new() -> Self {
        let capacity = 2500 * MAX_ROOMS;
        Self {
            room_table: Vec::with_capacity(MAX_ROOMS),
            reverse_room_table: vec![0; 1 << 16], // 2^16 possible room positions
            blocked_rooms: HashSet::new(),
            parents: vec![0; capacity],
            open_closed: OpenClosed::new(capacity),
            heap: Heap::new(capacity),
            goals: Vec::new(),
            look_table: [OBSTACLE; 4],
            heuristic_weight: 1.2,
            max_rooms: 16,
            flee: false,
            in_use: false,
        }
    }

    pub fn get_terrain(&self, pos: MapPosition) -> Option<Vec<u8>> {
        let room_name = RoomName::from_packed(pos.id());
        let terrain = RoomTerrain::new(room_name)?;
        let buffer = terrain.get_raw_buffer().to_vec();

        // Transform from [y * 50 + x] to [x * 50 + y]
        let mut transformed = vec![0; 2500];
        for y in 0..50 {
            for x in 0..50 {
                transformed[x * 50 + y] = buffer[y * 50 + x];
            }
        }

        // Compact to 2 bits per cell
        let compacted = transformed
            .chunks(4)
            .map(|chunk| chunk[0] | chunk[1] << 2 | chunk[2] << 4 | chunk[3] << 6)
            .collect::<Vec<_>>();

        Some(compacted)
    }

    /// Convert a world position to an index in our pathfinding grid
    fn index_from_pos(&mut self, pos: WorldPosition) -> Option<PosIndex> {
        let room_index = self.room_index_from_pos(pos.map_position())?;
        Some((room_index as PosIndex - 1) * 2500 + (pos.xx % 50 * 50 + pos.yy % 50) as PosIndex)
    }

    /// Convert an index back to a world position
    fn pos_from_index(&self, index: PosIndex) -> WorldPosition {
        let room_index = index / 2500;
        let terrain = &self.room_table[room_index as usize];
        let coord = index - room_index * 2500;
        WorldPosition::new(
            coord / 50 + terrain.pos.xx as u32 * 50,
            coord % 50 + terrain.pos.yy as u32 * 50,
        )
    }

    /// Get or create a room index for a map position
    fn room_index_from_pos(&mut self, map_pos: MapPosition) -> Option<RoomIndex> {
        let room_index = self.reverse_room_table[map_pos.id() as usize];
        if room_index != 0 {
            return Some(room_index);
        }

        // Room not found - try to create new entry
        if self.room_table.len() >= MAX_ROOMS {
            return None;
        }

        if self.blocked_rooms.contains(&map_pos) {
            return None;
        }

        // Load terrain data for this room
        let terrain_data = self.get_terrain(map_pos)?;

        // Create new room info
        let room = RoomInfo::new(terrain_data.to_vec(), None, map_pos);

        self.room_table.push(room);
        let new_index = self.room_table.len() as RoomIndex;
        self.reverse_room_table[map_pos.id() as usize] = new_index;

        Some(new_index)
    }

    /// Calculate the cost of moving to a position
    fn look(&self, pos: WorldPosition) -> Cost {
        let map_pos = pos.map_position();
        let room_index = match self.reverse_room_table[map_pos.id() as usize] {
            0 => return OBSTACLE,
            i => i,
        };

        let terrain = &self.room_table[(room_index - 1) as usize];
        let cost_matrix_value = terrain.cost_matrix[pos.xx as usize % 50][pos.yy as usize % 50];

        if cost_matrix_value != 0 {
            if cost_matrix_value == 0xff {
                return OBSTACLE;
            }
            return cost_matrix_value as Cost;
        }

        let terrain_type = terrain.look((pos.xx % 50) as u8, (pos.yy % 50) as u8) as usize;
        self.look_table[terrain_type]
    }

    /// Calculate heuristic cost to nearest goal
    fn heuristic(&self, pos: WorldPosition) -> Cost {
        if self.flee {
            let mut ret = 0;
            for goal in &self.goals {
                let dist = pos.range_to(goal.pos);
                if dist < goal.range {
                    ret = ret.max(goal.range - dist);
                }
            }
            ret
        } else {
            let mut ret = Cost::MAX;
            for goal in &self.goals {
                let dist = pos.range_to(goal.pos);
                if dist > goal.range {
                    ret = ret.min(dist - goal.range);
                } else {
                    ret = 0;
                }
            }
            ret
        }
    }

    /// Push a new node to the heap, or update its cost if it already exists
    fn push_node(
        &mut self,
        parent_index: PosIndex,
        node: WorldPosition,
        g_cost: Cost,
    ) -> Result<(), &'static str> {
        let index = match self.index_from_pos(node) {
            Some(i) => i,
            None => return Ok(()), // Skip invalid positions
        };

        if self.open_closed.is_closed(index as usize) {
            return Ok(());
        }

        let h_cost = (self.heuristic(node) as f64 * self.heuristic_weight) as Cost;
        let f_cost = h_cost + g_cost;

        if self.open_closed.is_open(index as usize) {
            if self.heap.priority(index) > f_cost {
                self.heap.update(index, f_cost);
                self.parents[index as usize] = parent_index;
            }
        } else {
            self.heap.insert(index, f_cost)?;
            self.open_closed.open(index as usize);
            self.parents[index as usize] = parent_index;
        }

        Ok(())
    }

    /// Helper to process a potential jump neighbor
    fn jump_neighbor(
        &mut self,
        pos: WorldPosition,
        index: PosIndex,
        neighbor: WorldPosition,
        g_cost: Cost,
        cost: Cost,
        n_cost: Cost,
    ) -> Result<(), &'static str> {
        if n_cost != cost || Self::is_border_pos(neighbor.xx) || Self::is_border_pos(neighbor.yy) {
            if n_cost == OBSTACLE {
                return Ok(());
            }
            self.push_node(index, neighbor, g_cost + n_cost)
        } else {
            // Try to jump from this neighbor
            if let Some(jumped_pos) = self.jump(
                n_cost,
                neighbor,
                (neighbor.xx as i32 - pos.xx as i32).signum(),
                (neighbor.yy as i32 - pos.yy as i32).signum(),
            ) {
                let jump_cost = self.look(jumped_pos);
                self.push_node(
                    index,
                    jumped_pos,
                    g_cost + n_cost * (pos.range_to(neighbor) - 1) as Cost + jump_cost,
                )
            } else {
                Ok(())
            }
        }
    }

    /// JPS search iteration
    fn jps(
        &mut self,
        index: PosIndex,
        pos: WorldPosition,
        g_cost: Cost,
    ) -> Result<(), &'static str> {
        let parent = self.pos_from_index(self.parents[index as usize]);
        let dx = if pos.xx > parent.xx {
            1
        } else if pos.xx < parent.xx {
            -1
        } else {
            0
        };
        let dy = if pos.yy > parent.yy {
            1
        } else if pos.yy < parent.yy {
            -1
        } else {
            0
        };

        // First check if we're jumping to/from a border
        let mut neighbors = Vec::with_capacity(3);
        if pos.xx % 50 == 0 {
            if dx == -1 {
                neighbors.push(WorldPosition::new((pos.xx as i32 - 1) as u32, pos.yy));
            } else if dx == 1 {
                neighbors.extend_from_slice(&[
                    WorldPosition::new(pos.xx + 1, pos.yy.saturating_sub(1)),
                    WorldPosition::new(pos.xx + 1, pos.yy),
                    WorldPosition::new(pos.xx + 1, pos.yy + 1),
                ]);
            }
        } else if pos.xx % 50 == 49 {
            if dx == 1 {
                neighbors.push(WorldPosition::new(pos.xx + 1, pos.yy));
            } else if dx == -1 {
                neighbors.extend_from_slice(&[
                    WorldPosition::new(pos.xx - 1, pos.yy.saturating_sub(1)),
                    WorldPosition::new(pos.xx - 1, pos.yy),
                    WorldPosition::new(pos.xx - 1, pos.yy + 1),
                ]);
            }
        } else if pos.yy % 50 == 0 {
            if dy == -1 {
                neighbors.push(WorldPosition::new(pos.xx, pos.yy.saturating_sub(1)));
            } else if dy == 1 {
                neighbors.extend_from_slice(&[
                    WorldPosition::new(pos.xx.saturating_sub(1), pos.yy + 1),
                    WorldPosition::new(pos.xx, pos.yy + 1),
                    WorldPosition::new(pos.xx + 1, pos.yy + 1),
                ]);
            }
        } else if pos.yy % 50 == 49 {
            if dy == 1 {
                neighbors.push(WorldPosition::new(pos.xx, pos.yy + 1));
            } else if dy == -1 {
                neighbors.extend_from_slice(&[
                    WorldPosition::new(pos.xx.saturating_sub(1), pos.yy - 1),
                    WorldPosition::new(pos.xx, pos.yy - 1),
                    WorldPosition::new(pos.xx + 1, pos.yy - 1),
                ]);
            }
        }

        // Process special border nodes if any
        if !neighbors.is_empty() {
            for neighbor in neighbors {
                let n_cost = self.look(neighbor);
                if n_cost == OBSTACLE {
                    continue;
                }
                self.push_node(index, neighbor, g_cost + n_cost)?;
            }
            return Ok(());
        }

        // Regular JPS iteration follows

        // First check to see if we're close to borders
        let mut border_dx = 0;
        if pos.xx % 50 == 1 {
            border_dx = -1;
        } else if pos.xx % 50 == 48 {
            border_dx = 1;
        }
        let mut border_dy = 0;
        if pos.yy % 50 == 1 {
            border_dy = -1;
        } else if pos.yy % 50 == 48 {
            border_dy = 1;
        }

        // Handle straight moves
        let cost = self.look(pos);
        if dx != 0 {
            let neighbor = WorldPosition::new((pos.xx as i32 + dx) as u32, pos.yy);
            let n_cost = self.look(neighbor);
            if n_cost != OBSTACLE {
                if border_dy == 0 {
                    self.jump_neighbor(pos, index, neighbor, g_cost, cost, n_cost)?;
                } else {
                    self.push_node(index, neighbor, g_cost + n_cost)?;
                }
            }
        }
        if dy != 0 {
            let neighbor = WorldPosition::new(pos.xx, (pos.yy as i32 + dy) as u32);
            let n_cost = self.look(neighbor);
            if n_cost != OBSTACLE {
                if border_dx == 0 {
                    self.jump_neighbor(pos, index, neighbor, g_cost, cost, n_cost)?;
                } else {
                    self.push_node(index, neighbor, g_cost + n_cost)?;
                }
            }
        }

        // Forced neighbor rules
        if dx != 0 {
            if dy != 0 {
                // Jumping diagonally
                let neighbor =
                    WorldPosition::new((pos.xx as i32 + dx) as u32, (pos.yy as i32 + dy) as u32);
                let n_cost = self.look(neighbor);
                if n_cost != OBSTACLE {
                    self.jump_neighbor(pos, index, neighbor, g_cost, cost, n_cost)?;
                }

                // Check forced neighbors
                if self.look(WorldPosition::new((pos.xx as i32 - dx) as u32, pos.yy)) != cost {
                    let forced = WorldPosition::new(
                        (pos.xx as i32 - dx) as u32,
                        (pos.yy as i32 + dy) as u32,
                    );
                    self.jump_neighbor(pos, index, forced, g_cost, cost, self.look(forced))?;
                }
                if self.look(WorldPosition::new(pos.xx, (pos.yy as i32 - dy) as u32)) != cost {
                    let forced = WorldPosition::new(
                        (pos.xx as i32 + dx) as u32,
                        (pos.yy as i32 - dy) as u32,
                    );
                    self.jump_neighbor(pos, index, forced, g_cost, cost, self.look(forced))?;
                }
            } else {
                // Jumping horizontally
                if border_dy == 1 || self.look(WorldPosition::new(pos.xx, pos.yy + 1)) != cost {
                    let neighbor = WorldPosition::new((pos.xx as i32 + dx) as u32, pos.yy + 1);
                    self.jump_neighbor(pos, index, neighbor, g_cost, cost, self.look(neighbor))?;
                }
                if border_dy == -1
                    || self.look(WorldPosition::new(pos.xx, pos.yy.saturating_sub(1))) != cost
                {
                    let neighbor =
                        WorldPosition::new((pos.xx as i32 + dx) as u32, pos.yy.saturating_sub(1));
                    self.jump_neighbor(pos, index, neighbor, g_cost, cost, self.look(neighbor))?;
                }
            }
        } else {
            // Jumping vertically
            if border_dx == 1 || self.look(WorldPosition::new(pos.xx + 1, pos.yy)) != cost {
                let neighbor = WorldPosition::new(pos.xx + 1, (pos.yy as i32 + dy) as u32);
                self.jump_neighbor(pos, index, neighbor, g_cost, cost, self.look(neighbor))?;
            }
            if border_dx == -1
                || self.look(WorldPosition::new(pos.xx.saturating_sub(1), pos.yy)) != cost
            {
                let neighbor =
                    WorldPosition::new(pos.xx.saturating_sub(1), (pos.yy as i32 + dy) as u32);
                self.jump_neighbor(pos, index, neighbor, g_cost, cost, self.look(neighbor))?;
            }
        }

        Ok(())
    }

    /// Search for a path from origin to any of the goals
    pub fn search(
        &mut self,
        origin: WorldPosition,
        goals: Vec<Goal>,
        options: PathfindingOptions,
    ) -> Result<PathfindingResult, &'static str> {
        // Clean up from previous iteration
        for ii in 0..self.room_table.len() {
            self.reverse_room_table[self.room_table[ii].pos.id() as usize] = 0;
        }
        self.room_table.clear();
        self.blocked_rooms.clear();
        self.goals = goals;
        self.open_closed.clear();
        self.heap.clear();

        // Initialize search parameters
        self.look_table[0] = options.plain_cost;
        self.look_table[2] = options.swamp_cost;
        self.max_rooms = options.max_rooms;
        self.heuristic_weight = options.heuristic_weight;
        self.flee = options.flee;
        let mut ops_remaining = options.max_ops;

        // Special case for searching to same node
        if self.heuristic(origin) == 0 {
            return Ok(PathfindingResult::same_tile());
        }

        self.in_use = true;

        // Prime data for index_from_pos
        let start_index = match self.index_from_pos(origin) {
            Some(i) => i,
            None => {
                return Ok(PathfindingResult::no_path(0)); // Initial room is inaccessible
            }
        };

        // Initial JPS iteration
        let mut min_node = start_index;
        let mut min_node_h_cost = Cost::MAX;
        let mut min_node_g_cost = Cost::MAX;

        self.astar(min_node, origin, 0)?;

        // Main search loop
        while !self.heap.is_empty() && ops_remaining > 0 {
            // Pull cheapest open node off heap and close it
            let (current_index, current_cost) = self.heap.pop().unwrap();
            self.open_closed.close(current_index as usize);

            // Calculate costs
            let pos = self.pos_from_index(current_index);
            let h_cost = self.heuristic(pos);
            let g_cost = current_cost - (h_cost as f64 * self.heuristic_weight) as Cost;

            // Check if we've reached a destination
            if h_cost == 0 {
                min_node = current_index;
                min_node_h_cost = 0;
                min_node_g_cost = g_cost;
                break;
            } else if h_cost < min_node_h_cost {
                min_node = current_index;
                min_node_h_cost = h_cost;
                min_node_g_cost = g_cost;
            }

            if g_cost + h_cost > options.max_cost {
                break;
            }

            // Add next neighbors to heap
            self.jps(current_index, pos, g_cost)?;
            ops_remaining -= 1;
        }

        // Reconstruct path
        let mut path = Vec::new();
        let mut index = min_node;
        let mut pos = self.pos_from_index(index);

        while pos != origin {
            path.push(pos);
            index = self.parents[index as usize];
            let next = self.pos_from_index(index);
            if next.range_to(pos) > 1 {
                if let Some(dir) = pos.direction_to(next) {
                    let mut current = pos;
                    while current.range_to(next) > 1 {
                        current = current.position_in_direction(dir);
                        path.push(current);
                    }
                }
            }
            pos = next;
        }

        path.reverse();

        self.in_use = false;

        Ok(PathfindingResult::new(
            path,
            options.max_ops - ops_remaining,
            min_node_g_cost,
            min_node_h_cost != 0,
        ))
    }

    /// Helper function to check if a position is near a border
    fn is_near_border_pos(val: u32) -> bool {
        (val + 2) % 50 < 4
    }

    /// Helper function to check if a position is on a border
    fn is_border_pos(val: u32) -> bool {
        (val + 1) % 50 < 2
    }

    /// Jump in X direction
    fn jump_x(&self, cost: Cost, mut pos: WorldPosition, dx: i32) -> Option<WorldPosition> {
        let mut prev_cost_u = self.look(WorldPosition::new(pos.xx, pos.yy.saturating_sub(1)));
        let mut prev_cost_d = self.look(WorldPosition::new(pos.xx, pos.yy + 1));

        loop {
            if self.heuristic(pos) == 0 || Self::is_near_border_pos(pos.xx) {
                break;
            }

            let cost_u = self.look(WorldPosition::new(
                (pos.xx as i32 + dx) as u32,
                pos.yy.saturating_sub(1),
            ));
            let cost_d = self.look(WorldPosition::new((pos.xx as i32 + dx) as u32, pos.yy + 1));

            if (cost_u != OBSTACLE && prev_cost_u != cost)
                || (cost_d != OBSTACLE && prev_cost_d != cost)
            {
                break;
            }

            prev_cost_u = cost_u;
            prev_cost_d = cost_d;
            pos.xx = (pos.xx as i32 + dx) as u32;

            let jump_cost = self.look(pos);
            if jump_cost == OBSTACLE {
                return None;
            } else if jump_cost != cost {
                break;
            }
        }

        Some(pos)
    }

    /// Jump in Y direction
    fn jump_y(&self, cost: Cost, mut pos: WorldPosition, dy: i32) -> Option<WorldPosition> {
        let mut prev_cost_l = self.look(WorldPosition::new(pos.xx.saturating_sub(1), pos.yy));
        let mut prev_cost_r = self.look(WorldPosition::new(pos.xx + 1, pos.yy));

        loop {
            if self.heuristic(pos) == 0 || Self::is_near_border_pos(pos.yy) {
                break;
            }

            let cost_l = self.look(WorldPosition::new(
                pos.xx.saturating_sub(1),
                (pos.yy as i32 + dy) as u32,
            ));
            let cost_r = self.look(WorldPosition::new(pos.xx + 1, (pos.yy as i32 + dy) as u32));

            if (cost_l != OBSTACLE && prev_cost_l != cost)
                || (cost_r != OBSTACLE && prev_cost_r != cost)
            {
                break;
            }

            prev_cost_l = cost_l;
            prev_cost_r = cost_r;
            pos.yy = (pos.yy as i32 + dy) as u32;

            let jump_cost = self.look(pos);
            if jump_cost == OBSTACLE {
                return None;
            } else if jump_cost != cost {
                break;
            }
        }

        Some(pos)
    }

    /// Jump diagonally
    fn jump_xy(
        &self,
        cost: Cost,
        mut pos: WorldPosition,
        dx: i32,
        dy: i32,
    ) -> Option<WorldPosition> {
        let mut prev_cost_x = self.look(WorldPosition::new((pos.xx as i32 - dx) as u32, pos.yy));
        let mut prev_cost_y = self.look(WorldPosition::new(pos.xx, (pos.yy as i32 - dy) as u32));

        loop {
            if self.heuristic(pos) == 0
                || Self::is_near_border_pos(pos.xx)
                || Self::is_near_border_pos(pos.yy)
            {
                break;
            }

            if self.look(WorldPosition::new(
                (pos.xx as i32 - dx) as u32,
                (pos.yy as i32 + dy) as u32,
            )) != OBSTACLE
                && prev_cost_x != cost
                || self.look(WorldPosition::new(
                    (pos.xx as i32 + dx) as u32,
                    (pos.yy as i32 - dy) as u32,
                )) != OBSTACLE
                    && prev_cost_y != cost
            {
                break;
            }

            prev_cost_x = self.look(WorldPosition::new(pos.xx, (pos.yy as i32 + dy) as u32));
            prev_cost_y = self.look(WorldPosition::new((pos.xx as i32 + dx) as u32, pos.yy));

            if (prev_cost_y != OBSTACLE
                && self
                    .jump_x(
                        cost,
                        WorldPosition::new((pos.xx as i32 + dx) as u32, pos.yy),
                        dx,
                    )
                    .is_some())
                || (prev_cost_x != OBSTACLE
                    && self
                        .jump_y(
                            cost,
                            WorldPosition::new(pos.xx, (pos.yy as i32 + dy) as u32),
                            dy,
                        )
                        .is_some())
            {
                break;
            }

            pos.xx = (pos.xx as i32 + dx) as u32;
            pos.yy = (pos.yy as i32 + dy) as u32;

            let jump_cost = self.look(pos);
            if jump_cost == OBSTACLE {
                return None;
            } else if jump_cost != cost {
                break;
            }
        }

        Some(pos)
    }

    /// Generic jump function that delegates to the appropriate specialized jump function
    fn jump(&self, cost: Cost, pos: WorldPosition, dx: i32, dy: i32) -> Option<WorldPosition> {
        if dx != 0 {
            if dy != 0 {
                self.jump_xy(cost, pos, dx, dy)
            } else {
                self.jump_x(cost, pos, dx)
            }
        } else {
            self.jump_y(cost, pos, dy)
        }
    }

    /// Run an iteration of basic A* to initialize the heap with neighbors
    fn astar(
        &mut self,
        index: PosIndex,
        pos: WorldPosition,
        g_cost: Cost,
    ) -> Result<(), &'static str> {
        // Check all 8 directions
        for dir in 0..8 {
            let neighbor = match dir {
                0 => WorldPosition::new(pos.xx, pos.yy.saturating_sub(1)), // TOP
                1 => WorldPosition::new(pos.xx + 1, pos.yy.saturating_sub(1)), // TOP_RIGHT
                2 => WorldPosition::new(pos.xx + 1, pos.yy),               // RIGHT
                3 => WorldPosition::new(pos.xx + 1, pos.yy + 1),           // BOTTOM_RIGHT
                4 => WorldPosition::new(pos.xx, pos.yy + 1),               // BOTTOM
                5 => WorldPosition::new(pos.xx.saturating_sub(1), pos.yy + 1), // BOTTOM_LEFT
                6 => WorldPosition::new(pos.xx.saturating_sub(1), pos.yy), // LEFT
                7 => WorldPosition::new(pos.xx.saturating_sub(1), pos.yy.saturating_sub(1)), // TOP_LEFT
                _ => unreachable!(),
            };

            // Skip impossible moves at room borders
            if pos.xx % 50 == 0 {
                if neighbor.xx % 50 == 49 && pos.yy != neighbor.yy {
                    continue;
                } else if pos.xx == neighbor.xx {
                    continue;
                }
            } else if pos.xx % 50 == 49 {
                if neighbor.xx % 50 == 0 && pos.yy != neighbor.yy {
                    continue;
                } else if pos.xx == neighbor.xx {
                    continue;
                }
            } else if pos.yy % 50 == 0 {
                if neighbor.yy % 50 == 49 && pos.xx != neighbor.xx {
                    continue;
                } else if pos.yy == neighbor.yy {
                    continue;
                }
            } else if pos.yy % 50 == 49 {
                if neighbor.yy % 50 == 0 && pos.xx != neighbor.xx {
                    continue;
                } else if pos.yy == neighbor.yy {
                    continue;
                }
            }

            // Calculate cost and add to heap if valid
            let n_cost = self.look(neighbor);
            if n_cost == OBSTACLE {
                continue;
            }
            self.push_node(index, neighbor, g_cost + n_cost)?;
        }

        Ok(())
    }
}
