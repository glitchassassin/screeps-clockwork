use std::convert::TryFrom;

use screeps::{
    LocalCostMatrix, LocalRoomTerrain, RoomCoordinate, RoomName, RoomTerrain, RoomXY, Terrain,
};
use screeps_utils::room_xy::{GridIter, Order};
use wasm_bindgen::__rt::WasmRefCell;
use wasm_bindgen::{prelude::*, throw_str};

/// A wrapper around the `LocalCostMatrix` type from the Screeps API.
/// Instances can be passed between WASM and JS as a pointer, using the
/// methods to get and set values, rather than copying the entire matrix.
#[wasm_bindgen]
#[derive(Clone)]
pub struct ClockworkCostMatrix {
    internal: LocalCostMatrix,
}

#[wasm_bindgen]
impl ClockworkCostMatrix {
    /// Creates a new cost matrix within the WASM module. Optionally, a default value
    /// can be provided to initialize all cells in the matrix to that value.
    #[wasm_bindgen(constructor)]
    pub fn new(default: Option<u8>) -> ClockworkCostMatrix {
        match default {
            Some(default) => ClockworkCostMatrix {
                internal: LocalCostMatrix::new_with_value(default),
            },
            None => ClockworkCostMatrix {
                internal: LocalCostMatrix::new(),
            },
        }
    }

    /// Gets the cost of a given position in the cost matrix.
    #[wasm_bindgen(js_name = "get")]
    pub fn js_get(&self, x: u8, y: u8) -> u8 {
        let x = RoomCoordinate::new(x)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid x coordinate: {}", x)));
        let y = RoomCoordinate::new(y)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid y coordinate: {}", y)));
        self.internal.get(RoomXY::new(x, y))
    }

    /// Sets the cost of a given position in the cost matrix.
    #[wasm_bindgen(js_name = "set")]
    pub fn js_set(&mut self, x: u8, y: u8, value: u8) {
        let x = RoomCoordinate::new(x)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid x coordinate: {}", x)));
        let y = RoomCoordinate::new(y)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid y coordinate: {}", y)));
        self.internal.set(RoomXY::new(x, y), value);
    }
}

impl ClockworkCostMatrix {
    /// Gets the cost of a given position in the cost matrix.
    pub fn get(&self, xy: RoomXY) -> u8 {
        self.internal.get(xy)
    }

    /// Sets the cost of a given position in the cost matrix.
    pub fn set(&mut self, xy: RoomXY, value: u8) {
        self.internal.set(xy, value);
    }
}

impl ClockworkCostMatrix {
    /// Gets the internal `LocalCostMatrix` instance from the wrapper.
    pub fn get_internal(&self) -> &LocalCostMatrix {
        &self.internal
    }
}

#[wasm_bindgen(inline_js = "
    export function clockworkcostmatrix_get_pointer(value) {
        if (!value || 
            typeof value !== 'object' || 
            !('__wbg_ptr' in value) ||
            value.constructor.name !== 'ClockworkCostMatrix') {
            return 0;
        }
        return value.__wbg_ptr;
    }
")]
extern "C" {
    fn clockworkcostmatrix_get_pointer(value: JsValue) -> u32;
}

impl TryFrom<JsValue> for ClockworkCostMatrix {
    type Error = &'static str;

    fn try_from(value: JsValue) -> Result<Self, Self::Error> {
        let ptr = clockworkcostmatrix_get_pointer(value);
        if ptr == 0 {
            return Err("Invalid ClockworkCostMatrix reference");
        }
        let me = ptr as *mut WasmRefCell<ClockworkCostMatrix>;
        wasm_bindgen::__rt::assert_not_null(me);
        let me = unsafe { &*me };
        Ok(me.borrow().clone())
    }
}

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
    let mut cost_matrix = ClockworkCostMatrix::new(None);
    for xy in GridIter::new(
        RoomXY {
            x: RoomCoordinate::new(0).unwrap(),
            y: RoomCoordinate::new(0).unwrap(),
        },
        RoomXY {
            x: RoomCoordinate::new(49).unwrap(),
            y: RoomCoordinate::new(49).unwrap(),
        },
        Order::XMajor,
    ) {
        cost_matrix.set(
            xy,
            match terrain.get_xy(xy) {
                Terrain::Plain => plain_cost,
                Terrain::Wall => wall_cost,
                Terrain::Swamp => swamp_cost,
            },
        );
    }
    cost_matrix
}
