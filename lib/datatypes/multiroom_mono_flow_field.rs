use screeps::{Direction, Position, RoomName};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

use super::mono_flow_field::MonoFlowField;

/// Maps monodirectional flow field values across multiple rooms, storing a MonoFlowField for each room
#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct MultiroomMonoFlowField {
    maps: HashMap<RoomName, MonoFlowField>,
}

impl MultiroomMonoFlowField {
    /// Creates a new empty multiroom monodirectional flow field
    pub fn new() -> Self {
        MultiroomMonoFlowField {
            maps: HashMap::new(),
        }
    }

    /// Gets the direction at a given position
    pub fn get(&self, pos: Position) -> Option<Direction> {
        self.maps
            .get(&pos.room_name())
            .and_then(|map| map.get(pos.xy()))
    }

    /// Sets the direction at a given position
    pub fn set(&mut self, pos: Position, direction: Option<Direction>) {
        let room_name = pos.room_name();
        let map = self
            .maps
            .entry(room_name)
            .or_insert_with(MonoFlowField::new);
        map.set(pos.xy(), direction);
    }

    /// Returns whether the flow field contains data for a given room
    pub fn contains_room(&self, room_name: RoomName) -> bool {
        self.maps.contains_key(&room_name)
    }

    /// Gets a reference to the MonoFlowField for a given room, if it exists
    pub fn get_room_map(&self, room_name: RoomName) -> Option<&MonoFlowField> {
        self.maps.get(&room_name)
    }

    /// Gets a mutable reference to the MonoFlowField for a given room, creating it if it doesn't exist
    pub fn get_or_create_room_map(&mut self, room_name: RoomName) -> &mut MonoFlowField {
        self.maps
            .entry(room_name)
            .or_insert_with(MonoFlowField::new)
    }
}

#[wasm_bindgen]
impl MultiroomMonoFlowField {
    /// Creates a new empty multiroom monodirectional flow field (JavaScript constructor)
    #[wasm_bindgen(constructor)]
    pub fn js_new() -> Self {
        Self::new()
    }

    /// Gets the direction at a given position
    #[wasm_bindgen(js_name = get)]
    pub fn js_get(&self, packed_pos: u32) -> Option<Direction> {
        let pos = Position::from_packed(packed_pos);
        self.get(pos)
    }

    /// Sets the direction at a given position
    #[wasm_bindgen(js_name = set)]
    pub fn js_set(&mut self, packed_pos: u32, direction: Option<Direction>) {
        let pos = Position::from_packed(packed_pos);
        self.set(pos, direction);
    }

    /// Gets the list of rooms in the flow field
    #[wasm_bindgen(js_name = getRooms)]
    pub fn js_get_rooms(&self) -> Vec<u16> {
        self.maps.keys().map(|k| k.packed_repr()).collect()
    }

    /// Gets the MonoFlowField for a given room
    #[wasm_bindgen(js_name = getRoom)]
    pub fn js_get_room(&self, room_name: u16) -> Option<MonoFlowField> {
        let room_name = RoomName::from_packed(room_name);
        self.maps.get(&room_name).cloned()
    }
}

impl Default for MultiroomMonoFlowField {
    fn default() -> Self {
        Self::new()
    }
}
