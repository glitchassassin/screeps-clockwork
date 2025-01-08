use wasm_bindgen::prelude::wasm_bindgen;

use super::types::{Cost, WorldPosition};

#[derive(Debug, Clone)]
pub struct Goal {
    pub range: u32,
    pub pos: WorldPosition,
}

impl Goal {
    pub fn new(pos: WorldPosition, range: u32) -> Self {
        Self { pos, range }
    }
}

#[derive(Debug)]
pub struct PathfindingResult {
    pub path: Vec<WorldPosition>, // Vector of (x,y) coordinates
    pub ops: u32,                 // Number of operations performed
    pub cost: Cost,               // Total path cost
    pub incomplete: bool,         // Whether the path is complete
}

#[wasm_bindgen(getter_with_clone)]
#[derive(Debug, Clone)]
pub struct JsPathfindingResult {
    pub path: Box<[u32]>, // Array of packed positions
    pub ops: u32,         // Number of operations performed
    pub cost: Cost,       // Total path cost
    pub incomplete: bool, // Whether the path is complete
}

impl PathfindingResult {
    pub fn new(path: Vec<WorldPosition>, ops: u32, cost: Cost, incomplete: bool) -> Self {
        Self {
            path,
            ops,
            cost,
            incomplete,
        }
    }

    /// Creates a result indicating no path was found
    pub fn no_path(ops: u32) -> Self {
        Self {
            path: Vec::new(),
            ops,
            cost: 0,
            incomplete: true,
        }
    }

    /// Creates a result for when the path is to the same tile
    pub fn same_tile() -> Self {
        Self {
            path: Vec::new(),
            ops: 0,
            cost: 0,
            incomplete: false,
        }
    }
}

/// Configuration for pathfinding
#[derive(Debug, Clone)]
#[wasm_bindgen]
pub struct PathfindingOptions {
    pub plain_cost: Cost,
    pub swamp_cost: Cost,
    pub max_rooms: u8,
    pub max_ops: u32,
    pub max_cost: u32,
    pub flee: bool,
    pub heuristic_weight: f64,
}

impl Default for PathfindingOptions {
    fn default() -> Self {
        Self {
            plain_cost: 1,
            swamp_cost: 5,
            max_rooms: 16,
            max_ops: 2000,
            max_cost: u32::MAX,
            flee: false,
            heuristic_weight: 1.2,
        }
    }
}
