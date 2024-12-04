use js_sys::Math::ceil;
use screeps::{
    game::{map::get_room_terrain, rooms},
    look::STRUCTURES,
    Position, RoomXY, StructureProperties, StructureType, Terrain,
};
use wasm_bindgen::{prelude::*, UnwrapThrowExt};

#[repr(u8)]
#[derive(Debug, Clone)]
pub enum Fatigue {
    Exits = 0,
    Roads = 1,
    Plains = 2,
    Swamps = 10,
}

#[derive(Debug, Clone)]
#[wasm_bindgen]
/// A list of positions representing a path.
pub struct Path(Vec<Position>);

#[derive(Debug, Clone)]
#[wasm_bindgen]
/// Tracks fatigue cost for each position in a path. Used to calculate move time
/// for a given creep build.
pub struct PathFatigue(Vec<Fatigue>);

impl Path {
    pub fn new() -> Self {
        Path(Vec::new())
    }

    pub fn add(&mut self, position: Position) {
        self.0.push(position);
    }

    pub fn get(&self, index: usize) -> Option<&Position> {
        self.0.get(index)
    }

    pub fn len(&self) -> usize {
        self.0.len()
    }

    /// Given a position, find the index of the next adjacent position
    /// in the path. If the position is not in the path, the target is
    /// the next adjacent position closest to the end of the path. If
    /// the position is neither on nor adjacent to the path, return None.
    pub fn find_next_index(&self, position: &Position) -> Option<usize> {
        let mut next_adjacent_index = None;
        for (i, p) in self.0.iter().enumerate() {
            if p == position {
                return Some(i + 1);
            } else if p.get_range_to(*position) == 1 {
                next_adjacent_index = Some(i);
            }
        }
        next_adjacent_index
    }
}

#[wasm_bindgen]
impl Path {
    #[wasm_bindgen(js_name = add)]
    pub fn js_add(&mut self, packed_position: u32) {
        let position = Position::from_packed(packed_position);
        self.add(position);
    }

    #[wasm_bindgen(js_name = get)]
    pub fn js_get(&self, index: usize) -> Option<u32> {
        self.get(index).map(|p| p.packed_repr())
    }

    #[wasm_bindgen(js_name = len)]
    pub fn js_len(&self) -> usize {
        self.len()
    }

    /// Given a position, find the index of the next adjacent position
    /// in the path. If the position is not in the path, the target is
    /// the next adjacent position closest to the end of the path. If
    /// the position is neither on nor adjacent to the path, return None.
    #[wasm_bindgen(js_name = find_next_index)]
    pub fn js_find_next_index(&self, packed_position: u32) -> Option<usize> {
        let position = Position::from_packed(packed_position);
        self.find_next_index(&position)
    }

    #[wasm_bindgen(js_name = to_array)]
    pub fn js_to_array(&self) -> Vec<u32> {
        self.0.iter().map(|p| p.packed_repr()).collect()
    }

    #[wasm_bindgen(js_name = to_array_reversed)]
    pub fn js_to_array_reversed(&self) -> Vec<u32> {
        self.0.iter().rev().map(|p| p.packed_repr()).collect()
    }
}

#[wasm_bindgen]
impl PathFatigue {
    #[wasm_bindgen(constructor)]
    pub fn new(path: &Path) -> Self {
        let mut fatigue = PathFatigue(Vec::new());
        fatigue.refresh(path);
        fatigue
    }

    /// Refreshes fatigue cost for each position in the path. If the PathFatigue
    /// has not been initialized yet, every position's fatigue cost will be set,
    /// even if there is no vision in the room, based on terrain costs. If the
    /// list *has* been initialized, only positions with vision will be updated.
    ///
    /// When there is vision, this also accounts for roads at the position.
    #[wasm_bindgen(js_name = refresh)]
    pub fn refresh(&mut self, path: &Path) {
        let initializing = self.0.len() != path.len();
        if initializing {
            self.0.resize(path.len(), Fatigue::Exits);
        }
        for (i, p) in path.0.iter().enumerate() {
            // Only update fatigue if the room is visible (or, optimistically
            // set fatigue based on terrain, if it hasn't been initialized yet)
            if !initializing && !rooms().get(p.room_name()).is_some() {
                continue;
            }
            let mut terrain = get_room_terrain(p.room_name()).unwrap_throw();
            let road = p.look_for(STRUCTURES);
            if let Ok(road) = road {
                // TODO: I've heard that portals cost 0 fatigue, but haven't been able to
                // confirm it yet. Update this once confirmed.
                if road
                    .iter()
                    .any(|s| s.structure_type() == StructureType::Road)
                {
                    self.0[i] = Fatigue::Roads;
                    continue;
                }
            }

            match terrain.get_xy(RoomXY::from(*p)) {
                Terrain::Plain => self.0[i] = Fatigue::Plains,
                Terrain::Swamp => self.0[i] = Fatigue::Swamps,
                _ => self.0[i] = Fatigue::Exits,
            }
        }
    }

    #[wasm_bindgen]
    pub fn len(&self) -> usize {
        self.0.len()
    }

    /// Calculates the total move time for the path, given a fatigue ratio.
    ///
    /// For unboosted creeps, the ratio is `Math.floor(moveParts * 2 / fatigueParts)`
    /// where `fatigue_parts` are any part except MOVE and empty CARRY parts.
    #[wasm_bindgen(js_name = moveTime)]
    pub fn move_time(&self, fatigue_ratio: usize) -> usize {
        self.0
            .iter()
            .map(|f| ceil(f.clone() as u8 as f64 / fatigue_ratio as f64) as usize)
            .sum()
    }
}
