use screeps::{Direction, Position, RoomCoordinate, RoomXY};
use wasm_bindgen::prelude::*;

/// If the position is on a room edge, return the corresponding room edge.
/// Otherwise, just return the position.
pub fn corresponding_room_edge(position: Position) -> Position {
    if position.x() == RoomCoordinate::MIN {
        return position.checked_add_direction(Direction::Left).unwrap();
    }

    if position.x() == RoomCoordinate::MAX {
        return position.checked_add_direction(Direction::Right).unwrap();
    }

    if position.y() == RoomCoordinate::MIN {
        return position.checked_add_direction(Direction::Top).unwrap();
    }

    if position.y() == RoomCoordinate::MAX {
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

#[inline(always)]
fn direction_stays_in_room(position: Position, direction: Direction) -> bool {
    match direction {
        Direction::Top => position.y() != RoomCoordinate::MIN,
        Direction::TopRight => {
            position.y() != RoomCoordinate::MIN && position.x() != RoomCoordinate::MAX
        }
        Direction::Right => position.x() != RoomCoordinate::MAX,
        Direction::BottomRight => {
            position.y() != RoomCoordinate::MAX && position.x() != RoomCoordinate::MAX
        }
        Direction::Bottom => position.y() != RoomCoordinate::MAX,
        Direction::BottomLeft => {
            position.y() != RoomCoordinate::MAX && position.x() != RoomCoordinate::MIN
        }
        Direction::Left => position.x() != RoomCoordinate::MIN,
        Direction::TopLeft => {
            position.y() != RoomCoordinate::MIN && position.x() != RoomCoordinate::MIN
        }
    }
}

#[inline(always)]
pub fn same_room_neighbor(position: Position, direction: Direction) -> Option<Position> {
    if !direction_stays_in_room(position, direction) {
        return None;
    }

    position.checked_add_direction(direction).ok()
}

/// Adjacency in Screeps is not perfectly euclidean: we need to apply
/// special rules at room edges.
pub fn neighbors(position: Position, order: DirectionOrder) -> impl Iterator<Item = Position> {
    preferred_directions(order)
        .iter()
        .filter_map(move |dir| same_room_neighbor(position, *dir))
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
        .filter_map(move |dir| same_room_neighbor(position, *dir))
}

pub fn room_xy_neighbors(position: RoomXY, order: DirectionOrder) -> impl Iterator<Item = RoomXY> {
    preferred_directions(order)
        .iter()
        .filter_map(move |dir| position.checked_add_direction(*dir))
}

static ANY_DIRECTIONS: [Direction; 8] = [
    Direction::Top,
    Direction::TopRight,
    Direction::Right,
    Direction::BottomRight,
    Direction::Bottom,
    Direction::BottomLeft,
    Direction::Left,
    Direction::TopLeft,
];

static TOP_DIRECTIONS: [Direction; 3] = [Direction::Top, Direction::TopRight, Direction::TopLeft];

static TOP_RIGHT_DIRECTIONS: [Direction; 5] = [
    Direction::TopRight,
    Direction::Top,
    Direction::Right,
    Direction::BottomRight,
    Direction::TopLeft,
];

static RIGHT_DIRECTIONS: [Direction; 3] = [
    Direction::Right,
    Direction::BottomRight,
    Direction::TopRight,
];

static BOTTOM_RIGHT_DIRECTIONS: [Direction; 5] = [
    Direction::BottomRight,
    Direction::Right,
    Direction::Bottom,
    Direction::TopRight,
    Direction::BottomLeft,
];

static BOTTOM_DIRECTIONS: [Direction; 3] = [
    Direction::Bottom,
    Direction::BottomRight,
    Direction::BottomLeft,
];

static BOTTOM_LEFT_DIRECTIONS: [Direction; 5] = [
    Direction::BottomLeft,
    Direction::Left,
    Direction::Bottom,
    Direction::TopLeft,
    Direction::BottomRight,
];

static LEFT_DIRECTIONS: [Direction; 3] =
    [Direction::Left, Direction::BottomLeft, Direction::TopLeft];

static TOP_LEFT_DIRECTIONS: [Direction; 5] = [
    Direction::TopLeft,
    Direction::Top,
    Direction::Left,
    Direction::BottomLeft,
    Direction::TopRight,
];

static DIRECTION_LOOKUP: [&[Direction]; 9] = [
    &ANY_DIRECTIONS,
    &TOP_DIRECTIONS,
    &TOP_RIGHT_DIRECTIONS,
    &RIGHT_DIRECTIONS,
    &BOTTOM_RIGHT_DIRECTIONS,
    &BOTTOM_DIRECTIONS,
    &BOTTOM_LEFT_DIRECTIONS,
    &LEFT_DIRECTIONS,
    &TOP_LEFT_DIRECTIONS,
];

/// Returns the next directions to consider, based on the direction from which the tile
/// was entered. Lateral directions can be ruled out as an optimization.
pub fn next_directions(open_direction: Option<Direction>) -> &'static [Direction] {
    DIRECTION_LOOKUP[open_direction.map(|d| d as usize).unwrap_or(0)]
}
