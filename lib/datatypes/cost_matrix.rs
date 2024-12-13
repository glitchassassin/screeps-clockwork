use std::convert::TryFrom;

use screeps::{LocalCostMatrix, RoomCoordinate, RoomXY};
use wasm_bindgen::__rt::WasmRefCell;
use wasm_bindgen::prelude::*;

/// A wrapper around the `LocalCostMatrix` type from the Screeps API.
/// Instances can be passed between WASM and JS as a pointer, using the
/// methods to get and set values, rather than copying the entire matrix.
#[wasm_bindgen]
#[derive(Clone, Debug)]
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

impl From<LocalCostMatrix> for ClockworkCostMatrix {
    fn from(value: LocalCostMatrix) -> Self {
        ClockworkCostMatrix { internal: value }
    }
}
