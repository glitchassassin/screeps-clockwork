use screeps::{Position, RoomXY};

/// Adjacency in Screeps is not perfectly euclidean: we need to apply
/// special rules at room edges.
///
/// Currently, we're just excluding room edges from consideration.
pub fn neighbors(position: Position) -> impl Iterator<Item = Position> {
    RoomXY::from(position)
        .neighbors()
        .into_iter()
        .filter(move |p| !p.is_room_edge())
        .map(move |p| Position::new(p.x, p.y, position.room_name()))
}
