use std::collections::HashMap;

use screeps::{Position, RoomCoordinate, RoomName, RoomXY};
use screeps_clockwork::bench_support::{ClockworkCostMatrix, PortalIndex};

const ROOM_SIZE: usize = 50;
const ROOM_AREA: usize = ROOM_SIZE * ROOM_SIZE;
const PLAIN_COST: u8 = 1;
const SWAMP_COST: u8 = 5;
const WALL_COST: u8 = 255;

pub struct DistanceMapScenario {
    pub name: &'static str,
    pub start: Position,
    pub target: Position,
    pub target_range: usize,
    pub max_rooms: usize,
    pub max_ops: usize,
    pub max_path_cost: usize,
    cost_matrices: HashMap<RoomName, ClockworkCostMatrix>,
    fallback_cost_matrix: Option<ClockworkCostMatrix>,
}

pub struct PortalDistanceMapScenario {
    pub name: &'static str,
    pub start: Position,
    pub target: Position,
    pub target_range: usize,
    pub max_rooms: usize,
    pub max_ops: usize,
    pub max_path_cost: usize,
    pub portal_index: PortalIndex,
    cost_matrices: HashMap<RoomName, ClockworkCostMatrix>,
    fallback_cost_matrix: Option<ClockworkCostMatrix>,
}

impl DistanceMapScenario {
    pub fn targets(&self) -> Vec<(Position, usize)> {
        vec![(self.target, self.target_range)]
    }

    pub fn cost_matrix(&self, room: RoomName) -> Option<ClockworkCostMatrix> {
        self.cost_matrices
            .get(&room)
            .or(self.fallback_cost_matrix.as_ref())
            .cloned()
    }
}

impl PortalDistanceMapScenario {
    pub fn targets(&self) -> Vec<(Position, usize)> {
        vec![(self.target, self.target_range)]
    }

    pub fn cost_matrix(&self, room: RoomName) -> Option<ClockworkCostMatrix> {
        self.cost_matrices
            .get(&room)
            .or(self.fallback_cost_matrix.as_ref())
            .cloned()
    }
}

pub fn distance_map_scenarios() -> Vec<DistanceMapScenario> {
    vec![
        empty_room_scenario(),
        empty_multiroom_scenario(),
        realistic_w1n1_scenario(),
        realistic_w8n8_scenario(),
        private_server_sector_scenario(),
    ]
}

pub fn portal_distance_map_scenarios() -> Vec<PortalDistanceMapScenario> {
    vec![
        short_single_room_portal_scenario(
            "short_path/single_room/no_portals",
            PortalIndex::default(),
        ),
        short_three_room_portal_scenario(
            "short_path/three_rooms/no_portals",
            PortalIndex::default(),
        ),
        short_three_room_portal_scenario(
            "short_path/three_rooms/paired_portal",
            short_three_room_portals(),
        ),
        private_server_sector_portal_scenario("portal_layout/no_portals", PortalIndex::default()),
        private_server_sector_portal_scenario("portal_layout/single_pair", single_pair_portals()),
        private_server_sector_portal_scenario("portal_layout/highway_wall_wrap", edge_portals()),
    ]
}

fn empty_room_scenario() -> DistanceMapScenario {
    let room_name = room("W1N1");
    DistanceMapScenario {
        name: "empty_room/opposite_corners",
        start: position(5, 5, room_name),
        target: position(45, 45, room_name),
        target_range: 0,
        max_rooms: 1,
        max_ops: ROOM_AREA,
        max_path_cost: 1_000,
        cost_matrices: std::iter::once((room_name, ClockworkCostMatrix::new(Some(PLAIN_COST))))
            .collect(),
        fallback_cost_matrix: None,
    }
}

fn empty_multiroom_scenario() -> DistanceMapScenario {
    DistanceMapScenario {
        name: "empty_multiroom/diagonal_four_rooms",
        start: position(5, 5, room("W1N1")),
        target: position(45, 45, room("W2N2")),
        target_range: 0,
        max_rooms: 4,
        max_ops: ROOM_AREA * 4,
        max_path_cost: 5_000,
        cost_matrices: HashMap::new(),
        fallback_cost_matrix: Some(ClockworkCostMatrix::new(Some(PLAIN_COST))),
    }
}

fn realistic_w1n1_scenario() -> DistanceMapScenario {
    let room_name = room("W1N1");
    let terrain = private_server_room_terrain("W1N1");
    DistanceMapScenario {
        name: "realistic_room/private_server_W1N1",
        start: position(16, 14, room_name),
        target: position(14, 45, room_name),
        target_range: 1,
        max_rooms: 1,
        max_ops: ROOM_AREA,
        max_path_cost: 1_000,
        cost_matrices: std::iter::once((room_name, terrain_cost_matrix(&terrain))).collect(),
        fallback_cost_matrix: None,
    }
}

fn realistic_w8n8_scenario() -> DistanceMapScenario {
    let room_name = room("W8N8");
    let terrain = private_server_room_terrain("W8N8");
    DistanceMapScenario {
        name: "realistic_room/private_server_W8N8",
        start: position(29, 41, room_name),
        target: position(37, 19, room_name),
        target_range: 1,
        max_rooms: 1,
        max_ops: ROOM_AREA,
        max_path_cost: 1_000,
        cost_matrices: std::iter::once((room_name, terrain_cost_matrix(&terrain))).collect(),
        fallback_cost_matrix: None,
    }
}

fn private_server_sector_scenario() -> DistanceMapScenario {
    let sector = private_server_sector();
    DistanceMapScenario {
        name: "private_server_sector/W1N1_to_W9N9",
        start: position(29, 41, room("W1N1")),
        target: position(8, 41, room("W9N9")),
        target_range: 1,
        max_rooms: sector.len(),
        max_ops: ROOM_AREA * sector.len(),
        max_path_cost: 50_000,
        cost_matrices: sector
            .iter()
            .map(|(room_name, terrain)| (room(room_name), terrain_cost_matrix(terrain)))
            .collect(),
        fallback_cost_matrix: None,
    }
}

fn private_server_sector_portal_scenario(
    name: &'static str,
    portal_index: PortalIndex,
) -> PortalDistanceMapScenario {
    let sector = private_server_sector();
    PortalDistanceMapScenario {
        name,
        start: position(29, 41, room("W1N1")),
        target: position(8, 41, room("W9N9")),
        target_range: 1,
        max_rooms: sector.len(),
        max_ops: ROOM_AREA * sector.len(),
        max_path_cost: 50_000,
        portal_index,
        cost_matrices: sector
            .iter()
            .map(|(room_name, terrain)| (room(room_name), terrain_cost_matrix(terrain)))
            .collect(),
        fallback_cost_matrix: None,
    }
}

fn short_single_room_portal_scenario(
    name: &'static str,
    portal_index: PortalIndex,
) -> PortalDistanceMapScenario {
    let room_name = room("W1N1");
    PortalDistanceMapScenario {
        name,
        start: position(20, 20, room_name),
        target: position(25, 25, room_name),
        target_range: 1,
        max_rooms: 1,
        max_ops: ROOM_AREA,
        max_path_cost: 250,
        portal_index,
        cost_matrices: std::iter::once((room_name, ClockworkCostMatrix::new(Some(PLAIN_COST))))
            .collect(),
        fallback_cost_matrix: None,
    }
}

fn short_three_room_portal_scenario(
    name: &'static str,
    portal_index: PortalIndex,
) -> PortalDistanceMapScenario {
    PortalDistanceMapScenario {
        name,
        start: position(20, 25, room("W1N1")),
        target: position(30, 25, room("W3N1")),
        target_range: 1,
        max_rooms: 3,
        max_ops: ROOM_AREA * 3,
        max_path_cost: 1_000,
        portal_index,
        cost_matrices: HashMap::new(),
        fallback_cost_matrix: Some(ClockworkCostMatrix::new(Some(PLAIN_COST))),
    }
}

fn short_three_room_portals() -> PortalIndex {
    let mut portal_index = PortalIndex::default();
    portal_index.add_bidirectional(
        position(25, 25, room("W1N1")),
        position(25, 25, room("W3N1")),
    );
    portal_index
}

fn single_pair_portals() -> PortalIndex {
    let mut portal_index = PortalIndex::default();
    portal_index.add_bidirectional(
        position(25, 25, room("W0N5")),
        position(25, 25, room("W10N5")),
    );
    portal_index
}

fn edge_portals() -> PortalIndex {
    edge_portals_with_stride(1)
}

fn edge_portals_with_stride(stride: usize) -> PortalIndex {
    let sector = private_server_sector();
    let mut portal_index = PortalIndex::default();
    let stride = stride.max(1);
    let mut candidate_index = 0;
    let max_w = sector
        .keys()
        .map(|room_name| display_room_coords(room_name).0)
        .max()
        .unwrap();
    let max_n = sector
        .keys()
        .map(|room_name| display_room_coords(room_name).1)
        .max()
        .unwrap();

    for n in 0..=max_n {
        let left_room_name = format!("W{}N{}", max_w, n);
        let right_room_name = format!("W0N{}", n);
        let Some(left_terrain) = sector.get(&left_room_name) else {
            continue;
        };
        let Some(right_terrain) = sector.get(&right_room_name) else {
            continue;
        };

        for y in 1..(ROOM_SIZE - 1) {
            if let (Some(left), Some(right)) = (
                first_walkable_from_left(&left_room_name, left_terrain, y as u8),
                first_walkable_from_right(&right_room_name, right_terrain, y as u8),
            ) {
                if candidate_index % stride == 0 {
                    portal_index.add_bidirectional(left, right);
                }
                candidate_index += 1;
            }
        }
    }

    for w in 0..=max_w {
        let top_room_name = format!("W{}N{}", w, max_n);
        let bottom_room_name = format!("W{}N0", w);
        let Some(top_terrain) = sector.get(&top_room_name) else {
            continue;
        };
        let Some(bottom_terrain) = sector.get(&bottom_room_name) else {
            continue;
        };

        for x in 1..(ROOM_SIZE - 1) {
            if let (Some(top), Some(bottom)) = (
                first_walkable_from_top(&top_room_name, top_terrain, x as u8),
                first_walkable_from_bottom(&bottom_room_name, bottom_terrain, x as u8),
            ) {
                if candidate_index % stride == 0 {
                    portal_index.add_bidirectional(top, bottom);
                }
                candidate_index += 1;
            }
        }
    }

    portal_index
}

fn first_walkable_from_left(room_name: &str, terrain: &str, y: u8) -> Option<Position> {
    (0..ROOM_SIZE)
        .find(|&x| !is_wall_terrain(terrain, x, y as usize))
        .map(|x| position(x as u8, y, room(room_name)))
}

fn first_walkable_from_right(room_name: &str, terrain: &str, y: u8) -> Option<Position> {
    (0..ROOM_SIZE)
        .rev()
        .find(|&x| !is_wall_terrain(terrain, x, y as usize))
        .map(|x| position(x as u8, y, room(room_name)))
}

fn first_walkable_from_top(room_name: &str, terrain: &str, x: u8) -> Option<Position> {
    (0..ROOM_SIZE)
        .find(|&y| !is_wall_terrain(terrain, x as usize, y))
        .map(|y| position(x, y as u8, room(room_name)))
}

fn first_walkable_from_bottom(room_name: &str, terrain: &str, x: u8) -> Option<Position> {
    (0..ROOM_SIZE)
        .rev()
        .find(|&y| !is_wall_terrain(terrain, x as usize, y))
        .map(|y| position(x, y as u8, room(room_name)))
}

fn is_wall_terrain(terrain: &str, x: usize, y: usize) -> bool {
    (terrain.as_bytes()[y * ROOM_SIZE + x] - b'0') & 1 != 0
}

fn display_room_coords(room_name: &str) -> (usize, usize) {
    let rest = room_name
        .strip_prefix('W')
        .unwrap_or_else(|| panic!("Expected west room name, got {}", room_name));
    let (w, n) = rest
        .split_once('N')
        .unwrap_or_else(|| panic!("Expected north room name, got {}", room_name));
    (
        w.parse()
            .unwrap_or_else(|_| panic!("Invalid west coordinate in {}", room_name)),
        n.parse()
            .unwrap_or_else(|_| panic!("Invalid north coordinate in {}", room_name)),
    )
}

fn private_server_room_terrain(room_name: &str) -> String {
    private_server_sector()
        .remove(room_name)
        .unwrap_or_else(|| panic!("Missing private server terrain for {}", room_name))
}

fn private_server_sector() -> HashMap<String, String> {
    let fixture: serde_json::Value =
        serde_json::from_str(include_str!("terrain/private_server_sector.json"))
            .expect("private server sector terrain fixture should be valid JSON");
    fixture["rooms"]
        .as_object()
        .expect("private server sector terrain fixture should contain a rooms object")
        .iter()
        .map(|(room_name, terrain)| {
            (
                room_name.clone(),
                terrain
                    .as_str()
                    .expect("private server terrain value should be a string")
                    .to_string(),
            )
        })
        .collect()
}

fn terrain_cost_matrix(terrain: &str) -> ClockworkCostMatrix {
    assert_eq!(terrain.len(), ROOM_AREA);

    let mut matrix = ClockworkCostMatrix::new(None);
    for y in 0..ROOM_SIZE {
        for x in 0..ROOM_SIZE {
            let terrain_code = terrain.as_bytes()[y * ROOM_SIZE + x] - b'0';
            let cost = if terrain_code & 1 != 0 {
                WALL_COST
            } else if terrain_code & 2 != 0 {
                SWAMP_COST
            } else {
                PLAIN_COST
            };
            matrix.set(room_xy(x as u8, y as u8), cost);
        }
    }
    matrix
}

fn room(name: &str) -> RoomName {
    name.parse().unwrap()
}

fn position(x: u8, y: u8, room_name: RoomName) -> Position {
    Position::new(coordinate(x), coordinate(y), room_name)
}

fn room_xy(x: u8, y: u8) -> RoomXY {
    RoomXY::new(coordinate(x), coordinate(y))
}

fn coordinate(value: u8) -> RoomCoordinate {
    RoomCoordinate::new(value).unwrap()
}
