use screeps::{Direction, Position, RoomCoordinate, RoomName, RoomXY};

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

/// Adjacency in Screeps is not perfectly euclidean: we need to apply
/// special rules at room edges.
///
/// Currently, we're just excluding room edges from consideration.
pub fn neighbors(position: Position) -> impl Iterator<Item = Position> {
    RoomXY::from(position)
        .neighbors()
        .into_iter()
        .map(move |p| Position::new(p.x, p.y, position.room_name()))
        .map(corresponding_room_edge)
}

/// Calculate the Manhattan distance between two rooms.
pub fn manhattan_distance(room1: &RoomName, room2: &RoomName) -> usize {
    (room1.x_coord().abs_diff(room2.x_coord()) + room1.y_coord().abs_diff(room2.y_coord())) as usize
}
