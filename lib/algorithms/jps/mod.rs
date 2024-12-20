use screeps::{Direction, Position, RoomCoordinate};

use crate::datatypes::ClockworkCostMatrix;

use super::map::corresponding_room_edge;

pub fn jump(
    position: Position,
    direction: Direction,
    goals: &[Position],
    cost_matrix: &ClockworkCostMatrix,
) -> Option<Position> {
    if position.x() == RoomCoordinate::new(0).unwrap()
        && [Direction::Left, Direction::TopLeft, Direction::BottomLeft].contains(&direction)
    {
        // cannot move left on a left-edge tile
        return None;
    }
    if position.x() == RoomCoordinate::new(49).unwrap()
        && [
            Direction::Right,
            Direction::TopRight,
            Direction::BottomRight,
        ]
        .contains(&direction)
    {
        // cannot move right on a right-edge tile
        return None;
    }
    if position.y() == RoomCoordinate::new(0).unwrap()
        && [Direction::Top, Direction::TopLeft, Direction::TopRight].contains(&direction)
    {
        // cannot move top on a top-edge tile
        return None;
    }
    if position.y() == RoomCoordinate::new(49).unwrap()
        && [
            Direction::Bottom,
            Direction::BottomLeft,
            Direction::BottomRight,
        ]
        .contains(&direction)
    {
        // cannot move down on a bottom-edge tile
        return None;
    }

    let next_pos = corresponding_room_edge(position.checked_add_direction(direction).ok()?);

    if next_pos.room_name() != position.room_name() {
        return Some(next_pos); // jumped to a different room
    }

    let next_cost = cost_matrix.get(next_pos.xy());

    if next_cost >= 255 {
        // Impassable terrain
        return None;
    }

    if cost_matrix.get(position.xy()) != next_cost {
        // Region has different cost; stop jumping and re-evaluate
        return Some(next_pos);
    }

    if goals.contains(&next_pos) {
        return Some(next_pos);
    }

    // Diagonal movement
    if direction.is_diagonal() {
        let right = position
            .checked_add_direction(direction.multi_rot(3))
            .map(corresponding_room_edge)
            .ok()?;
        let left = position
            .checked_add_direction(direction.multi_rot(-3))
            .map(corresponding_room_edge)
            .ok()?;

        // Check for forced neighbors
        if left.room_name() != position.room_name()
            || cost_matrix.get(left.xy()) != next_cost
            || right.room_name() != position.room_name()
            || cost_matrix.get(right.xy()) != next_cost
        {
            // Found a forced neighbor - stop jumping
            return Some(next_pos);
        }

        // Recursively look in both cardinal and diagonal directions
        if jump(next_pos, direction.multi_rot(1), goals, &cost_matrix).is_some()
            || jump(next_pos, direction.multi_rot(-1), goals, &cost_matrix).is_some()
        {
            return Some(next_pos);
        }
    } else {
        // Cardinal movement - check for forced neighbors
        let left = position
            .checked_add_direction(direction.multi_rot(-2))
            .map(corresponding_room_edge)
            .ok()?;
        let right = position
            .checked_add_direction(direction.multi_rot(2))
            .map(corresponding_room_edge)
            .ok()?;

        if left.room_name() != position.room_name()
            || cost_matrix.get(left.xy()) != next_cost
            || right.room_name() != position.room_name()
            || cost_matrix.get(right.xy()) != next_cost
        {
            // Found a forced neighbor - stop jumping
            return Some(next_pos);
        }
    }

    jump(next_pos, direction, goals, cost_matrix)
}
