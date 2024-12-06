use screeps::{Direction, Position, RoomCoordinate, RoomName, RoomXY};

/// Adjacency in Screeps is not perfectly euclidean: we need to apply
/// special rules at room edges.
///
/// Currently, we're just excluding room edges from consideration.
pub fn neighbors(position: Position) -> impl Iterator<Item = Position> {
    RoomXY::from(position)
        .neighbors()
        .into_iter()
        .map(move |p| Position::new(p.x, p.y, position.room_name()))
        .map(move |p| {
            if !p.is_room_edge() {
                return p;
            }

            // swamp edge tile with the corresponding tile in the adjacent room
            if p.x() == RoomCoordinate(0) {
                return p.checked_add_direction(Direction::Left).unwrap();
            }

            if p.x() == RoomCoordinate(49) {
                return p.checked_add_direction(Direction::Right).unwrap();
            }

            if p.y() == RoomCoordinate(0) {
                return p.checked_add_direction(Direction::Top).unwrap();
            }

            if p.y() == RoomCoordinate(49) {
                return p.checked_add_direction(Direction::Bottom).unwrap();
            }

            unreachable!()
        })
}

/// Calculate the Manhattan distance between two rooms.
pub fn manhattan_distance(room1: &RoomName, room2: &RoomName) -> usize {
    (room1.x_coord().abs_diff(room2.x_coord()) + room1.y_coord().abs_diff(room2.y_coord())) as usize
}
