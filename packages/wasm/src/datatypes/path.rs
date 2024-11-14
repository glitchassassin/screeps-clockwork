use screeps::Position;

pub struct Path {
    data: Vec<Position>,
}

impl Path {
    pub fn new() -> Self {
        Path { data: Vec::new() }
    }

    pub fn add(&mut self, position: Position) {
        self.data.push(position);
    }

    pub fn get(&self, index: usize) -> Option<&Position> {
        self.data.get(index)
    }

    pub fn len(&self) -> usize {
        self.data.len()
    }

    pub fn find_index(&self, position: &Position) -> Option<usize> {
        self.data.iter().position(|p| p == position)
    }
}
