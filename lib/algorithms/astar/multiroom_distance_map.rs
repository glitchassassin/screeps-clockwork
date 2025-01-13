use crate::algorithms::map::neighbors_with_open_direction;
use crate::datatypes::ClockworkCostMatrix;
use crate::datatypes::MultiroomDistanceMap;
use crate::utils::set_panic_hook;
use crate::DistanceMap;
use lazy_static::lazy_static;
use screeps::Direction;
use screeps::Position;
use screeps::RoomName;
use std::collections::HashMap;
use std::convert::TryFrom;
use std::ops::Fn;
use std::ops::Index;
use std::ops::IndexMut;
use wasm_bindgen::prelude::*;
use wasm_bindgen::throw_val;

use super::heuristics::range_heuristic;

lazy_static! {
    static ref DIRECTION_LOOKUP: [Vec<Direction>; 9] = [
        // Any direction
        vec![
            Direction::Top,
            Direction::TopRight,
            Direction::Right,
            Direction::BottomRight,
            Direction::Bottom,
            Direction::BottomLeft,
            Direction::Left,
            Direction::TopLeft,
        ],
        // Direction::Top
        vec![Direction::Top, Direction::TopRight, Direction::TopLeft],
        // Direction::TopRight
        vec![
            Direction::TopRight,
            Direction::Top,
            Direction::Right,
            Direction::BottomRight,
            Direction::TopLeft,
        ],
        // Direction::Right
        vec![
            Direction::Right,
            Direction::BottomRight,
            Direction::TopRight,
        ],
        // Direction::BottomRight
        vec![
            Direction::BottomRight,
            Direction::Right,
            Direction::Bottom,
            Direction::TopRight,
            Direction::BottomLeft,
        ],
        // Direction::Bottom
        vec![
            Direction::Bottom,
            Direction::BottomRight,
            Direction::BottomLeft,
        ],
        // Direction::BottomLeft
        vec![
            Direction::BottomLeft,
            Direction::Left,
            Direction::Bottom,
            Direction::TopLeft,
            Direction::BottomRight,
        ],
        // Direction::Left
        vec![Direction::Left, Direction::BottomLeft, Direction::TopLeft],
        // Direction::TopLeft
        vec![
            Direction::TopLeft,
            Direction::Top,
            Direction::Left,
            Direction::BottomLeft,
            Direction::TopRight,
        ],
    ];
}

/// Returns the next directions to consider, based on the direction from which the tile
/// was entered. Lateral directions can be ruled out as an optimization.
fn next_directions(open_direction: Option<Direction>) -> &'static [Direction] {
    &DIRECTION_LOOKUP[open_direction.map(|d| d as usize).unwrap_or(0)]
}

#[derive(Clone)]
struct RoomData {
    cost_matrix: Option<ClockworkCostMatrix>,
    distance_map: DistanceMap,
    room_name: RoomName,
}

struct RoomDataCache<F>
where
    F: Fn(RoomName) -> Option<ClockworkCostMatrix>,
{
    room_data: Vec<RoomData>,
    room_map: HashMap<RoomName, usize>,
    cost_matrix_creator: F,
}

impl<F> RoomDataCache<F>
where
    F: Fn(RoomName) -> Option<ClockworkCostMatrix>,
{
    fn new(cost_matrix_creator: F) -> Self {
        Self {
            room_data: vec![],
            room_map: HashMap::new(),
            cost_matrix_creator,
        }
    }

    fn get_room_key(&mut self, room: RoomName) -> usize {
        if let Some(room_key) = self.room_map.get(&room) {
            return *room_key;
        }
        self.room_data.push(RoomData {
            cost_matrix: (self.cost_matrix_creator)(room),
            distance_map: DistanceMap::new(),
            room_name: room,
        });
        self.room_map.insert(room, self.room_data.len() - 1);
        self.room_data.len() - 1
    }
}

impl<F> Index<usize> for RoomDataCache<F>
where
    F: Fn(RoomName) -> Option<ClockworkCostMatrix>,
{
    type Output = RoomData;

    fn index(&self, index: usize) -> &Self::Output {
        &self.room_data[index]
    }
}

impl<F> IndexMut<usize> for RoomDataCache<F>
where
    F: Fn(RoomName) -> Option<ClockworkCostMatrix>,
{
    fn index_mut(&mut self, index: usize) -> &mut Self::Output {
        &mut self.room_data[index]
    }
}

impl<F> From<RoomDataCache<F>> for MultiroomDistanceMap
where
    F: Fn(RoomName) -> Option<ClockworkCostMatrix>,
{
    fn from(cached_room_data: RoomDataCache<F>) -> Self {
        let mut maps = HashMap::new();
        for room_data in cached_room_data.room_data {
            maps.insert(room_data.room_name, room_data.distance_map);
        }
        MultiroomDistanceMap { maps }
    }
}

#[derive(Copy, Clone)]
struct State {
    g_score: usize,
    position: Position,
    open_direction: Option<Direction>,
    room_key: usize,
}

/// Creates a distance map for the given start positions, using A* to optimize the search and
/// find the shortest path to the given destinations.
pub fn astar_multiroom_distance_map(
    start: Vec<Position>,
    get_cost_matrix: impl Fn(RoomName) -> Option<ClockworkCostMatrix>,
    max_tiles: usize,
    max_tile_distance: usize,
    goal_fn: impl Fn(Position) -> bool,
    heuristic_fn: impl Fn(Position) -> usize,
) -> MultiroomDistanceMap {
    set_panic_hook();
    let mut open: Vec<Vec<State>> = vec![Default::default()];
    let mut min_idx = 0;
    let mut visited = 0;
    let mut cached_room_data = RoomDataCache::new(get_cost_matrix);

    // Initialize with start positions
    for position in start {
        let room_key = cached_room_data.get_room_key(position.room_name());
        open[0].push(State {
            g_score: 0,
            position,
            open_direction: None,
            room_key,
        });
        cached_room_data[room_key].distance_map[position.xy()] = 0;
        visited += 1;
    }

    while min_idx < open.len() {
        while let Some(State {
            g_score,
            position,
            open_direction,
            room_key,
        }) = open[min_idx].pop()
        {
            if g_score >= max_tile_distance {
                continue;
            }

            let current_room_name = cached_room_data[room_key].room_name;

            for neighbor in neighbors_with_open_direction(position, next_directions(open_direction))
            {
                let room_key = if neighbor.room_name() == current_room_name {
                    room_key
                } else {
                    cached_room_data.get_room_key(neighbor.room_name())
                };

                let terrain_cost =
                    if let Some(cost_matrix) = &cached_room_data[room_key].cost_matrix {
                        let terrain_cost = cost_matrix.get(neighbor.xy());
                        if terrain_cost >= 255 {
                            // impassable terrain
                            continue;
                        }
                        terrain_cost
                    } else {
                        // no cost matrix means room is blocked
                        continue;
                    };

                let next_cost = g_score.saturating_add(terrain_cost as usize);

                if cached_room_data[room_key].distance_map[neighbor.xy()] <= next_cost {
                    // already visited and better path found
                    continue;
                }

                let h_score = heuristic_fn(neighbor);
                let f_score = next_cost.saturating_add(h_score);

                while open.len() <= f_score {
                    open.push(Default::default());
                }
                open[f_score].push(State {
                    g_score: next_cost,
                    position: neighbor,
                    open_direction: position.get_direction_to(neighbor),
                    room_key,
                });
                cached_room_data[room_key].distance_map[neighbor.xy()] = next_cost;
                visited += 1;

                min_idx = min_idx.min(f_score);

                if goal_fn(neighbor) || visited >= max_tiles {
                    return cached_room_data.into();
                }
            }
        }
        min_idx += 1;
    }

    cached_room_data.into()
}

#[wasm_bindgen]
pub fn js_astar_multiroom_distance_map(
    start_packed: Vec<u32>,
    get_cost_matrix: &js_sys::Function,
    max_tiles: usize,
    max_tile_distance: usize,
    destinations: Vec<u32>,
) -> MultiroomDistanceMap {
    let start_positions = start_packed
        .iter()
        .map(|pos| Position::from_packed(*pos))
        .collect();

    let destinations: Vec<Position> = destinations
        .iter()
        .map(|pos| Position::from_packed(*pos))
        .collect();

    let heuristic_fn = range_heuristic(&destinations);

    astar_multiroom_distance_map(
        start_positions,
        |room| {
            let result = get_cost_matrix.call1(
                &JsValue::null(),
                &JsValue::from_f64(room.packed_repr() as f64),
            );

            let value = match result {
                Ok(value) => value,
                Err(e) => throw_val(e),
            };

            let cost_matrix = if value.is_undefined() {
                None
            } else {
                Some(
                    ClockworkCostMatrix::try_from(value)
                        .ok()
                        .expect_throw("Invalid ClockworkCostMatrix"),
                )
            };

            cost_matrix
        },
        max_tiles,
        max_tile_distance,
        |pos| destinations.contains(&pos),
        heuristic_fn,
    )
}
