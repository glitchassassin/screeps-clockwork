use crate::datatypes::PortalIndex;
use screeps::Position;

/// A basic global range heuristic.
#[allow(dead_code)]
pub fn base_heuristic<'a>(goal: &'a [Position]) -> impl Fn(Position) -> usize + 'a {
    move |position| {
        goal.iter()
            .map(|g| position.get_range_to(*g))
            .min()
            .unwrap_or(0) as usize
    }
}

/// When the goal is to be within a certain range of a position, simply subtract the target
/// range from the actual range to the goal.
#[allow(dead_code)]
pub fn base_heuristic_with_range<'a>(
    goal: &'a [(Position, usize)],
) -> impl Fn(Position) -> usize + 'a {
    move |position| {
        goal.iter()
            .map(|(g, range)| position.get_range_to(*g).saturating_sub(*range as u32))
            .min()
            .unwrap_or(0) as usize
    }
}

pub fn closest_portal_heuristic_cached_with_range<'a>(
    goals: &'a [(Position, usize)],
    portal_index: &'a PortalIndex,
) -> impl Fn(Position) -> usize + 'a {
    let target_portal_range = target_portal_range(goals, portal_index);

    move |position| {
        let direct = direct_goal_range(position, goals);

        if target_portal_range == usize::MAX || portal_index.is_empty() {
            return direct;
        }

        direct.min(
            portal_index
                .nearest_endpoint_cached_range(position)
                .saturating_add(target_portal_range),
        )
    }
}

fn target_portal_range(goals: &[(Position, usize)], portal_index: &PortalIndex) -> usize {
    goals
        .iter()
        .map(|(goal, range)| {
            portal_index
                .nearest_endpoint_range(*goal)
                .saturating_sub(*range)
        })
        .min()
        .unwrap_or(usize::MAX)
}

fn direct_goal_range(position: Position, goals: &[(Position, usize)]) -> usize {
    goals
        .iter()
        .map(|(goal, range)| position.get_range_to(*goal).saturating_sub(*range as u32))
        .min()
        .unwrap_or(0) as usize
}
