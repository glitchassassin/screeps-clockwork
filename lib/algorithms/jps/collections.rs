use super::types::{Cost, PosIndex, MAX_ROOMS};

/// Simple open-closed list implementation
pub struct OpenClosed {
    list: Vec<u32>,
    marker: u32,
}

impl OpenClosed {
    pub fn new(capacity: usize) -> Self {
        Self {
            list: vec![0; capacity],
            marker: 1,
        }
    }

    pub fn clear(&mut self) {
        if u32::MAX - 2 <= self.marker {
            self.list.fill(0);
            self.marker = 1;
        } else {
            self.marker += 2;
        }
    }

    pub fn is_open(&self, index: usize) -> bool {
        self.list[index] == self.marker
    }

    pub fn is_closed(&self, index: usize) -> bool {
        self.list[index] == self.marker + 1
    }

    pub fn open(&mut self, index: usize) {
        self.list[index] = self.marker;
    }

    pub fn close(&mut self, index: usize) {
        self.list[index] = self.marker + 1;
    }
}

/// Priority queue implementation with support for updating priorities
pub struct Heap {
    priorities: Vec<Cost>,
    heap: Vec<PosIndex>,
    size: usize,
}

impl Heap {
    pub fn new(capacity: usize) -> Self {
        Self {
            priorities: vec![0; capacity],
            // Using theoretical max open nodes calculation from C++ implementation
            heap: vec![0; 2500 * MAX_ROOMS / 8],
            size: 0,
        }
    }

    pub fn is_empty(&self) -> bool {
        self.size == 0
    }

    pub fn priority(&self, index: PosIndex) -> Cost {
        self.priorities[index as usize]
    }

    pub fn pop(&mut self) -> Option<(PosIndex, Cost)> {
        if self.size == 0 {
            return None;
        }

        let ret = (self.heap[1], self.priorities[self.heap[1] as usize]);
        self.heap[1] = self.heap[self.size];
        self.size -= 1;

        let mut vv = 1;
        loop {
            let uu = vv;
            if (uu << 1) + 1 <= self.size {
                if self.priorities[self.heap[uu] as usize]
                    >= self.priorities[self.heap[uu << 1] as usize]
                {
                    vv = uu << 1;
                }
                if self.priorities[self.heap[vv] as usize]
                    >= self.priorities[self.heap[(uu << 1) + 1] as usize]
                {
                    vv = (uu << 1) + 1;
                }
            } else if uu << 1 <= self.size {
                if self.priorities[self.heap[uu] as usize]
                    >= self.priorities[self.heap[uu << 1] as usize]
                {
                    vv = uu << 1;
                }
            }

            if uu != vv {
                self.heap.swap(uu, vv);
            } else {
                break;
            }
        }

        Some(ret)
    }

    pub fn insert(&mut self, index: PosIndex, priority: Cost) -> Result<(), &'static str> {
        if self.size == self.heap.len() - 1 {
            return Err("Max heap size reached");
        }

        self.priorities[index as usize] = priority;
        self.size += 1;
        self.heap[self.size] = index;
        self.bubble_up(self.size);
        Ok(())
    }

    pub fn update(&mut self, index: PosIndex, priority: Cost) {
        for ii in (1..=self.size).rev() {
            if self.heap[ii] == index {
                self.priorities[index as usize] = priority;
                self.bubble_up(ii);
                return;
            }
        }
    }

    fn bubble_up(&mut self, mut ii: usize) {
        while ii != 1 {
            if self.priorities[self.heap[ii] as usize]
                <= self.priorities[self.heap[ii >> 1] as usize]
            {
                self.heap.swap(ii, ii >> 1);
                ii >>= 1;
            } else {
                return;
            }
        }
    }

    pub fn clear(&mut self) {
        self.size = 0;
    }
}
