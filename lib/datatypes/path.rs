use screeps::Position;
use wasm_bindgen::prelude::*;

#[derive(Debug, Clone)]
#[wasm_bindgen]
/// A list of positions representing a path.
pub struct Path(Vec<Position>);

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

impl From<Vec<Position>> for Path {
    fn from(positions: Vec<Position>) -> Self {
        Path(positions)
    }
}
