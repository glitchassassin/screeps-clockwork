use screeps::{Direction, Position, RoomCoordinate, RoomXY};
use wasm_bindgen::prelude::*;

use lazy_static::lazy_static;
/// If the position is on a room edge, return the corresponding room edge.
/// Otherwise, just return the position.
pub fn corresponding_room_edge(position: Position) -> Position {
    if position.x() == RoomCoordinate(0) {
        return position.checked_add_direction(Direction::Left).unwrap();
    }

    if position.x() == RoomCoordinate(49) {
        return position.checked_add_direction(Direction::Right).unwrap();
    }

    if position.y() == RoomCoordinate(0) {
        return position.checked_add_direction(Direction::Top).unwrap();
    }

    if position.y() == RoomCoordinate(49) {
        return position.checked_add_direction(Direction::Bottom).unwrap();
    }

    position
}

#[wasm_bindgen]
#[derive(Debug, Copy, Clone)]
pub enum DirectionOrder {
    CardinalFirst = 0,
    DiagonalFirst = 1,
}

static CARDINAL_FIRST_DIRECTIONS: [Direction; 8] = [
    Direction::Top,
    Direction::Right,
    Direction::Bottom,
    Direction::Left,
    Direction::TopRight,
    Direction::BottomRight,
    Direction::BottomLeft,
    Direction::TopLeft,
];

static DIAGONAL_FIRST_DIRECTIONS: [Direction; 8] = [
    Direction::TopRight,
    Direction::BottomRight,
    Direction::BottomLeft,
    Direction::TopLeft,
    Direction::Top,
    Direction::Right,
    Direction::Bottom,
    Direction::Left,
];

pub fn preferred_directions(order: DirectionOrder) -> &'static [Direction; 8] {
    match order {
        DirectionOrder::CardinalFirst => &CARDINAL_FIRST_DIRECTIONS,
        DirectionOrder::DiagonalFirst => &DIAGONAL_FIRST_DIRECTIONS,
    }
}

/// Adjacency in Screeps is not perfectly euclidean: we need to apply
/// special rules at room edges.
pub fn neighbors(position: Position, order: DirectionOrder) -> impl Iterator<Item = Position> {
    preferred_directions(order)
        .iter()
        .filter_map(move |dir| position.checked_add_direction(*dir).ok())
        .map(corresponding_room_edge)
}

/// Adjacency in Screeps is not perfectly euclidean: we need to apply
/// special rules at room edges.
pub fn neighbors_without_edges(
    position: Position,
    order: DirectionOrder,
) -> impl Iterator<Item = Position> {
    preferred_directions(order)
        .iter()
        .filter_map(move |dir| position.checked_add_direction(*dir).ok())
}

pub fn room_xy_neighbors(position: RoomXY, order: DirectionOrder) -> impl Iterator<Item = RoomXY> {
    preferred_directions(order)
        .iter()
        .filter_map(move |dir| position.checked_add_direction(*dir))
}

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
pub fn next_directions(open_direction: Option<Direction>) -> &'static [Direction] {
    &DIRECTION_LOOKUP[open_direction.map(|d| d as usize).unwrap_or(0)]
}
