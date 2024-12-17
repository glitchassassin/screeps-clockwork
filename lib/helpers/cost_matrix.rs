use screeps::{LocalCostMatrix, LocalRoomTerrain, RoomName, RoomTerrain, Terrain};
use wasm_bindgen::{prelude::*, throw_str};

use crate::datatypes::ClockworkCostMatrix;

#[wasm_bindgen]
pub fn get_terrain_cost_matrix(
    room_name: u16,
    plain_cost: Option<u8>,
    swamp_cost: Option<u8>,
    wall_cost: Option<u8>,
) -> ClockworkCostMatrix {
    let plain_cost = plain_cost.unwrap_or(1);
    let swamp_cost = swamp_cost.unwrap_or(5);
    let wall_cost = wall_cost.unwrap_or(255);
    let room_name = RoomName::from_packed(room_name);
    let terrain = RoomTerrain::new(room_name);
    if terrain.is_none() {
        throw_str(&format!("Invalid room name: {}", room_name));
    }
    let terrain = LocalRoomTerrain::from(terrain.unwrap());
    let mut local_cost_matrix = LocalCostMatrix::new();
    for (xy, val) in local_cost_matrix.iter_mut() {
        *val = match terrain.get_xy(xy) {
            Terrain::Plain => plain_cost,
            Terrain::Wall => wall_cost,
            Terrain::Swamp => swamp_cost,
        };
    }

    ClockworkCostMatrix::from(local_cost_matrix)
}
