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
