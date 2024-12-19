#[derive(Debug)]
pub struct PathfindingMetrics {
    pub nodes_visited: usize,
    pub neighbor_checks: usize,
    pub jump_attempts: usize, // JPS only
    pub max_jump_distance: usize,
}

impl PathfindingMetrics {
    pub fn new() -> Self {
        Self {
            nodes_visited: 0,
            neighbor_checks: 0,
            jump_attempts: 0,
            max_jump_distance: 0,
        }
    }
}
