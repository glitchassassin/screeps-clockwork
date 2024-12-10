use screeps::{Direction, Position, RoomName};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

use super::flow_field::FlowField;

/// Maps flow field values across multiple rooms, storing a FlowField for each room
#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct MultiroomFlowField {
    maps: HashMap<RoomName, FlowField>,
}

impl MultiroomFlowField {
    /// Creates a new empty multiroom flow field
    pub fn new() -> Self {
        MultiroomFlowField {
            maps: HashMap::new(),
        }
    }

    /// Gets the flow field value at a given position
    pub fn get(&self, pos: Position) -> u8 {
        self.maps
            .get(&pos.room_name())
            .map(|map| map.get(pos.x(), pos.y()))
            .unwrap_or(0) // Default value if room not present
    }

    /// Sets the flow field value at a given position
    pub fn set(&mut self, pos: Position, value: u8) {
        let room_name = pos.room_name();
        let map = self.maps.entry(room_name).or_insert_with(FlowField::new);
        map.set(pos.x(), pos.y(), value);
    }

    /// Returns whether the flow field contains data for a given room
    pub fn contains_room(&self, room_name: RoomName) -> bool {
        self.maps.contains_key(&room_name)
    }

    /// Gets a reference to the FlowField for a given room, if it exists
    pub fn get_room_map(&self, room_name: RoomName) -> Option<&FlowField> {
        self.maps.get(&room_name)
    }

    /// Gets a mutable reference to the FlowField for a given room, creating it if it doesn't exist
    pub fn get_or_create_room_map(&mut self, room_name: RoomName) -> &mut FlowField {
        self.maps.entry(room_name).or_insert_with(FlowField::new)
    }

    /// Gets the list of valid directions at a given position across rooms
    pub fn get_directions(&self, pos: Position) -> Vec<Direction> {
        self.maps
            .get(&pos.room_name())
            .map(|map| map.get_directions(pos.x(), pos.y()))
            .unwrap_or(Vec::new())
    }

    /// Sets the list of valid directions at a given position across rooms
    pub fn set_directions(&mut self, pos: Position, directions: Vec<Direction>) {
        let room_name = pos.room_name();
        let map = self.maps.entry(room_name).or_insert_with(FlowField::new);
        map.set_directions(pos.x(), pos.y(), directions);
    }

    /// Adds a direction to the list of valid directions at a given position across rooms
    pub fn add_direction(&mut self, pos: Position, direction: Direction) {
        let room_name = pos.room_name();
        let map = self.maps.entry(room_name).or_insert_with(FlowField::new);
        map.add_direction(pos.x(), pos.y(), direction);
    }
}

#[wasm_bindgen]
impl MultiroomFlowField {
    /// Creates a new empty multiroom flow field (JavaScript constructor)
    #[wasm_bindgen(constructor)]
    pub fn js_new() -> Self {
        Self::new()
    }

    /// Gets the flow field value at a given position
    #[wasm_bindgen(js_name = get)]
    pub fn js_get(&self, packed_pos: u32) -> u8 {
        let pos = Position::from_packed(packed_pos);
        self.get(pos)
    }

    /// Sets the flow field value at a given position
    #[wasm_bindgen(js_name = set)]
    pub fn js_set(&mut self, packed_pos: u32, value: u8) {
        let pos = Position::from_packed(packed_pos);
        self.set(pos, value);
    }

    /// Gets the list of rooms in the flow field
    #[wasm_bindgen(js_name = getRooms)]
    pub fn js_get_rooms(&self) -> Vec<u16> {
        self.maps.keys().map(|k| k.packed_repr()).collect()
    }

    /// Gets the FlowField for a given room
    #[wasm_bindgen(js_name = getRoom)]
    pub fn js_get_room(&self, room_name: u16) -> Option<FlowField> {
        let room_name = RoomName::from_packed(room_name);
        self.maps.get(&room_name).cloned()
    }

    /// Gets the list of valid directions at a given position (JavaScript)
    #[wasm_bindgen(js_name = getDirections)]
    pub fn js_get_directions(&self, packed_pos: u32) -> Vec<Direction> {
        let pos = Position::from_packed(packed_pos);
        self.get_directions(pos)
    }

    /// Sets the list of valid directions at a given position (JavaScript)
    #[wasm_bindgen(js_name = setDirections)]
    pub fn js_set_directions(&mut self, packed_pos: u32, directions: Vec<Direction>) {
        let pos = Position::from_packed(packed_pos);
        self.set_directions(pos, directions);
    }

    /// Adds a direction to the list of valid directions at a given position (JavaScript)
    #[wasm_bindgen(js_name = addDirection)]
    pub fn js_add_direction(&mut self, packed_pos: u32, direction: Direction) {
        let pos = Position::from_packed(packed_pos);
        self.add_direction(pos, direction);
    }
}

impl Default for MultiroomFlowField {
    fn default() -> Self {
        Self::new()
    }
}
