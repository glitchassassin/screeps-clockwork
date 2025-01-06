#[derive(Debug)]
pub struct PathfindingMetrics {
    pub nodes_visited: usize,
    pub neighbor_checks: usize,
}

impl PathfindingMetrics {
    pub fn new() -> Self {
        Self {
            nodes_visited: 0,
            neighbor_checks: 0,
        }
    }
}
