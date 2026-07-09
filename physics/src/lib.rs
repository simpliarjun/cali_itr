use wasm_bindgen::prelude::*;
use js_sys::Float64Array;

const MESH_COLS: usize = 12;
const MESH_ROWS: usize = 16;
const TOTAL_POINTS: usize = MESH_COLS * MESH_ROWS;

// Simulation tuning parameters
const BASE_STIFFNESS: f64 = 0.12;
const STIFFNESS_GRADIENT: f64 = 0.06;
const DAMPING_FACTOR: f64 = 0.72;

pub struct SpringPoint {
    z: f64,
    vz: f64,
}

impl SpringPoint {
    fn new() -> Self {
        SpringPoint { z: 0.0, vz: 0.0 }
    }

    fn step(&mut self, target: f64, k: f64, damping: f64) {
        let f = (target - self.z) * k;
        self.vz = (self.vz + f) * damping;
        self.z += self.vz;
    }
}

#[wasm_bindgen]
pub struct PageMesh {
    points: Vec<SpringPoint>,
    width: f64,
    height: f64,
    flip_progress: f64,
    direction: f64,
}

#[wasm_bindgen]
impl PageMesh {
    #[wasm_bindgen(constructor)]
    pub fn new(width: f64, height: f64) -> PageMesh {
        let mut points = Vec::with_capacity(TOTAL_POINTS);
        for _ in 0..TOTAL_POINTS {
            points.push(SpringPoint::new());
        }
        PageMesh {
            points,
            width,
            height,
            flip_progress: 0.0,
            direction: 1.0,
        }
    }

    pub fn begin_flip(&mut self, forward: bool) {
        self.flip_progress = 0.0;
        self.direction = if forward { 1.0 } else { -1.0 };
    }

    pub fn step(&mut self, dt: f64) -> bool {
        self.flip_progress += dt * 1.8;
        if self.flip_progress > 1.0 {
            self.flip_progress = 1.0;
        }

        let t = self.flip_progress;
        let page_angle = self.direction * t * std::f64::consts::PI;

        for row in 0..MESH_ROWS {
            let v = row as f64 / (MESH_ROWS - 1) as f64;
            for col in 0..MESH_COLS {
                let u = col as f64 / (MESH_COLS - 1) as f64;
                let curl_phase = u + v * 0.3;
                let wave = (curl_phase * std::f64::consts::PI * 2.0 - t * 6.0).sin();
                let lift = (page_angle.sin()).abs();
                let target_z = wave * lift * 0.4 * self.height;
                let stiffness = BASE_STIFFNESS + (1.0 - u) * STIFFNESS_GRADIENT;
                let idx = row * MESH_COLS + col;
                self.points[idx].step(target_z, stiffness, DAMPING_FACTOR);
            }
        }

        self.flip_progress >= 1.0
    }

    pub fn get_positions(&self) -> Float64Array {
        let mut out = vec![0.0f64; TOTAL_POINTS * 3];
        for row in 0..MESH_ROWS {
            let y = (row as f64 / (MESH_ROWS - 1) as f64 - 0.5) * self.height;
            for col in 0..MESH_COLS {
                let x = (col as f64 / (MESH_COLS - 1) as f64 - 0.5) * self.width;
                let idx = row * MESH_COLS + col;
                let base = idx * 3;
                out[base] = x;
                out[base + 1] = y;
                out[base + 2] = self.points[idx].z;
            }
        }
        Float64Array::from(out.as_slice())
    }

    pub fn cols() -> usize {
        MESH_COLS
    }

    pub fn rows() -> usize {
        MESH_ROWS
    }
}
