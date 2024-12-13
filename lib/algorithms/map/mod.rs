use screeps::{Direction, Position, RoomCoordinate, RoomName};

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

static PREFERRED_DIRECTIONS: [Direction; 8] = [
    Direction::Top,
    Direction::Right,
    Direction::Bottom,
    Direction::Left,
    Direction::TopRight,
    Direction::BottomRight,
    Direction::BottomLeft,
    Direction::TopLeft,
];

/// Adjacency in Screeps is not perfectly euclidean: we need to apply
/// special rules at room edges.
pub fn neighbors(position: Position) -> impl Iterator<Item = Position> {
    PREFERRED_DIRECTIONS
        .iter()
        .filter_map(move |dir| position.checked_add_direction(*dir).ok())
        .map(corresponding_room_edge)
}

/// Adjacency in Screeps is not perfectly euclidean: we need to apply
/// special rules at room edges.
pub fn neighbors_without_edges(position: Position) -> impl Iterator<Item = Position> {
    PREFERRED_DIRECTIONS
        .iter()
        .filter_map(move |dir| position.checked_add_direction(*dir).ok())
}

/// Adjacency in Screeps is not perfectly euclidean: we need to apply
/// special rules at room edges.
pub fn neighbors_with_open_direction<'a>(
    position: Position,
    directions: &'a [Direction],
) -> impl Iterator<Item = Position> + 'a {
    directions
        .into_iter()
        .filter_map(move |dir| position.checked_add_direction(*dir).ok())
        .map(corresponding_room_edge)
}

/// Calculate the Manhattan distance between two rooms.
pub fn manhattan_distance(room1: &RoomName, room2: &RoomName) -> usize {
    (room1.x_coord().abs_diff(room2.x_coord()) + room1.y_coord().abs_diff(room2.y_coord())) as usize
}
