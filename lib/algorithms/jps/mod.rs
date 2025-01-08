mod collections;
mod goal;
mod pathfinder;
mod room;
mod types;

pub use goal::{Goal, PathfindingOptions};
pub use pathfinder::PathFinder;
use screeps::{game, Position};
pub use types::*;
use wasm_bindgen::{prelude::wasm_bindgen, throw_str};

use crate::log;

thread_local! {
    static PATHFINDER: std::cell::RefCell<PathFinder> = std::cell::RefCell::new(PathFinder::new());
}

#[wasm_bindgen]
pub fn js_pathfinder(origin: u32, goals: Vec<u32>) -> Vec<u32> {
    let start = game::cpu::get_used();
    PATHFINDER.with(|pf| {
        let mut pf = pf.borrow_mut();
        let origin = Position::from_packed(origin);
        let goals = goals
            .into_iter()
            .map(|g| {
                let pos = Position::from_packed(g);
                Goal::new(WorldPosition::from(pos), 0)
            })
            .collect();
        log(&format!("Rust Pathfinder setup: {}", game::cpu::get_used() - start).to_string());
        let start = game::cpu::get_used();
        let options = PathfindingOptions {
            plain_cost: 1,
            swamp_cost: 5,
            max_rooms: 100,
            flee: false,
            max_cost: 1500,
            max_ops: 50000,
            heuristic_weight: 1.0,
        };
        let result = pf.search(WorldPosition::from(origin), goals, options);
        log(&format!("Rust Pathfinder search: {}", game::cpu::get_used() - start).to_string());
        if let Ok(result) = result {
            log(&format!("Rust Pathfinder ops: {}", result.ops).to_string());
            log(&format!("Rust Pathfinder cost: {}", result.cost).to_string());
            log(&format!("Rust Pathfinder length: {}", result.path.len()).to_string());
            log(&format!("Rust Pathfinder incomplete: {}", result.incomplete).to_string());
            return result
                .path
                .into_iter()
                .map(|p| Position::from(p).packed_repr())
                .collect();
        } else if let Err(e) = result {
            throw_str(e);
        }
        vec![]
    })
}
