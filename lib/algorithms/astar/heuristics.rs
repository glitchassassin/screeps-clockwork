use screeps::Position;

/// A basic global range heuristic.
pub fn range_heuristic<'a>(goal: &'a [Position]) -> impl Fn(Position) -> usize + 'a {
    move |position| {
        goal.iter()
            .map(|g| position.get_range_to(*g))
            .min()
            .unwrap_or(0) as usize
    }
}
