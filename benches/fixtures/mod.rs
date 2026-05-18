use std::collections::HashMap;

use screeps::{Position, RoomCoordinate, RoomName, RoomXY};
use screeps_clockwork::bench_support::ClockworkCostMatrix;

mod realistic_rooms;

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

pub fn distance_map_scenarios() -> Vec<DistanceMapScenario> {
    vec![
        empty_room_scenario(),
        empty_multiroom_scenario(),
        realistic_w1s45_scenario(),
        realistic_w8n31_scenario(),
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

fn realistic_w1s45_scenario() -> DistanceMapScenario {
    let room_name = room("W1S45");
    DistanceMapScenario {
        name: "realistic_room/W1S45_controller_to_source",
        start: position(16, 14, room_name),
        target: position(14, 45, room_name),
        target_range: 1,
        max_rooms: 1,
        max_ops: ROOM_AREA,
        max_path_cost: 1_000,
        cost_matrices: std::iter::once((
            room_name,
            terrain_cost_matrix(realistic_rooms::W1S45_TERRAIN),
        ))
        .collect(),
        fallback_cost_matrix: None,
    }
}

fn realistic_w8n31_scenario() -> DistanceMapScenario {
    let room_name = room("W8N31");
    DistanceMapScenario {
        name: "realistic_room/W8N31_source_to_source",
        start: position(10, 38, room_name),
        target: position(37, 19, room_name),
        target_range: 1,
        max_rooms: 1,
        max_ops: ROOM_AREA,
        max_path_cost: 1_000,
        cost_matrices: std::iter::once((
            room_name,
            terrain_cost_matrix(realistic_rooms::W8N31_TERRAIN),
        ))
        .collect(),
        fallback_cost_matrix: None,
    }
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
