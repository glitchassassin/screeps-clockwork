/* tslint:disable */
/* eslint-disable */

/**
 * A wrapper around the `LocalCostMatrix` type from the Screeps API.
 * Instances can be passed between WASM and JS as a pointer, using the
 * methods to get and set values, rather than copying the entire matrix.
 */
export class ClockworkCostMatrix {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Gets the cost of a given position in the cost matrix.
     */
    get(x: number, y: number): number;
    /**
     * Creates a new cost matrix within the WASM module. Optionally, a default value
     * can be provided to initialize all cells in the matrix to that value.
     */
    constructor(_default?: number | null);
    /**
     * Sets the cost of a given position in the cost matrix.
     */
    set(x: number, y: number, value: number): void;
}

/**
 * Translates `COLOR_*` and `COLORS_ALL` constants.
 */
export enum Color {
    Red = 1,
    Purple = 2,
    Blue = 3,
    Cyan = 4,
    Green = 5,
    Yellow = 6,
    Orange = 7,
    Brown = 8,
    Grey = 9,
    White = 10,
}

/**
 * Translates the `DENSITY_*` constants.
 */
export enum Density {
    Low = 1,
    Moderate = 2,
    High = 3,
    Ultra = 4,
}

/**
 * Translates direction constants.
 */
export enum Direction {
    Top = 1,
    TopRight = 2,
    Right = 3,
    BottomRight = 4,
    Bottom = 5,
    BottomLeft = 6,
    Left = 7,
    TopLeft = 8,
}

export enum DirectionOrder {
    CardinalFirst = 0,
    DiagonalFirst = 1,
}

/**
 * Maps a distance value onto individual room tile positions.
 */
export class DistanceMap {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Gets the distance value at a given position.
     */
    get(x: number, y: number): number;
    /**
     * Sets the distance value at a given position.
     */
    set(x: number, y: number, value: number): void;
    /**
     * Converts the distance map into a flat array of distances.
     */
    toArray(): Uint32Array;
}

/**
 * Type used for when the game returns a direction to an exit.
 *
 * Restricted more than `Direction` in that it can't be diagonal. Used as the
 * result of [`Room::find_exit_to`].
 *
 * Can be converted to [`Find`] for immediate use of [`Room::find`]
 * and [`Direction`].
 *
 * [`Room::find`]: crate::objects::Room::find
 * [`Room::find_exit_to`]: crate::objects::Room::find_exit_to
 */
export enum ExitDirection {
    Top = 1,
    Right = 3,
    Bottom = 5,
    Left = 7,
}

/**
 * Translates `FIND_*` constants for interal API calls
 *
 * Unless you're storing the type of find constant to be used for a call, you
 * likely want the constants which implement the `FindConstant` trait to make
 * calls to find methods.
 *
 * This is hidden from the documentation to avoid confusion due to its narrow
 * use case, but wasm_bindgen requires it remain public.
 */
export enum Find {
    /**
     * Find all exit positions at the top of the room
     */
    ExitTop = 1,
    ExitRight = 3,
    ExitBottom = 5,
    ExitLeft = 7,
    Exit = 10,
    Creeps = 101,
    MyCreeps = 102,
    HostileCreeps = 103,
    SourcesActive = 104,
    Sources = 105,
    DroppedResources = 106,
    Structures = 107,
    MyStructures = 108,
    HostileStructures = 109,
    Flags = 110,
    ConstructionSites = 111,
    MySpawns = 112,
    HostileSpawns = 113,
    MyConstructionSites = 114,
    HostileConstructionSites = 115,
    Minerals = 116,
    Nukes = 117,
    Tombstones = 118,
    PowerCreeps = 119,
    MyPowerCreeps = 120,
    HostilePowerCreeps = 121,
    Deposits = 122,
    Ruins = 123,
    ScoreContainers = 10011,
    ScoreCollectors = 10012,
    SymbolContainers = 10021,
    SymbolDecoders = 10022,
    Reactors = 10051,
}

/**
 * A flow field is a 50x50 grid (representing a room), representing viable directions
 * to travel to reach a particular target (or targets). A given tile may have multiple
 * equally valid directions, so we represent this as a bitfield (where each bit in an
 * 8-bit unsigned integer represents a direction that is either viable or not).
 */
export class FlowField {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Add a direction to the list of valid directions for a given coordinate.
     */
    addDirection(x: number, y: number, direction: Direction): void;
    /**
     * Get the internal value for a given coordinate.
     */
    get(x: number, y: number): number;
    /**
     * Get the list of valid directions for a given coordinate.
     */
    getDirections(x: number, y: number): any[];
    /**
     * Set the internal value for a given coordinate.
     */
    set(x: number, y: number, value: number): void;
    /**
     * Set the list of valid directions for a given coordinate.
     */
    setDirections(x: number, y: number, directions: any[]): void;
}

/**
 * A flow field is a 50x50 grid (representing a room), representing viable directions
 * to travel to reach a particular target (or targets). A mono flow field only stores
 * a single direction for each tile, so we represent this as 4 bits of an unsigned
 * integer (0 for no direction, 1 for TOP, etc.).
 */
export class MonoFlowField {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Get the direction for a given coordinate.
     */
    get(x: number, y: number): Direction | undefined;
    /**
     * Set the direction for a given coordinate.
     */
    set(x: number, y: number, value?: Direction | null): void;
}

/**
 * Maps distance values across multiple rooms, storing a DistanceMap for each room
 */
export class MultiroomDistanceMap {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Gets the distance value at a given position
     */
    get(packed_pos: number): number;
    /**
     * Gets the DistanceMap for a given room
     */
    get_room(room_name: number): DistanceMap | undefined;
    /**
     * Gets the list of rooms in the map
     */
    get_rooms(): Uint16Array;
    /**
     * Creates a new empty multiroom distance map (JavaScript constructor)
     */
    constructor();
    /**
     * Sets the distance value at a given position
     */
    set(packed_pos: number, value: number): void;
}

/**
 * Maps flow field values across multiple rooms, storing a FlowField for each room
 */
export class MultiroomFlowField {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Adds a direction to the list of valid directions at a given position (JavaScript)
     */
    addDirection(packed_pos: number, direction: Direction): void;
    /**
     * Gets the flow field value at a given position
     */
    get(packed_pos: number): number;
    /**
     * Gets the list of valid directions at a given position (JavaScript)
     */
    getDirections(packed_pos: number): any[];
    /**
     * Gets the FlowField for a given room
     */
    getRoom(room_name: number): FlowField | undefined;
    /**
     * Gets the list of rooms in the flow field
     */
    getRooms(): Uint16Array;
    /**
     * Creates a new empty multiroom flow field (JavaScript constructor)
     */
    constructor();
    /**
     * Sets the flow field value at a given position
     */
    set(packed_pos: number, value: number): void;
    /**
     * Sets the list of valid directions at a given position (JavaScript)
     */
    setDirections(packed_pos: number, directions: any[]): void;
}

/**
 * Maps monodirectional flow field values across multiple rooms, storing a MonoFlowField for each room
 */
export class MultiroomMonoFlowField {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Gets the direction at a given position
     */
    get(packed_pos: number): Direction | undefined;
    /**
     * Gets the MonoFlowField for a given room
     */
    getRoom(room_name: number): MonoFlowField | undefined;
    /**
     * Gets the list of rooms in the flow field
     */
    getRooms(): Uint16Array;
    /**
     * Creates a new empty multiroom monodirectional flow field (JavaScript constructor)
     */
    constructor();
    /**
     * Sets the direction at a given position
     */
    set(packed_pos: number, direction?: Direction | null): void;
}

/**
 * Translates the `EFFECT_*` constants, which are natural effect types
 */
export enum NaturalEffectType {
    Invulnerability = 1001,
    CollapseTimer = 1002,
}

/**
 * A list of positions representing a path.
 */
export class Path {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    add(packed_position: number): void;
    /**
     * Given a position, find the index of the next adjacent position
     * in the path. If the position is not in the path, the target is
     * the next adjacent position closest to the end of the path. If
     * the position is neither on nor adjacent to the path, return None.
     */
    find_next_index(packed_position: number): number | undefined;
    get(index: number): number | undefined;
    len(): number;
    to_array(): Uint32Array;
    to_array_reversed(): Uint32Array;
}

/**
 * Translates the `PWR_*` constants, which are types of powers used by power
 * creeps
 */
export enum PowerType {
    GenerateOps = 1,
    OperateSpawn = 2,
    OperateTower = 3,
    OperateStorage = 4,
    OperateLab = 5,
    OperateExtension = 6,
    OperateObserver = 7,
    OperateTerminal = 8,
    DisruptSpawn = 9,
    DisruptTower = 10,
    Shield = 12,
    RegenSource = 13,
    RegenMineral = 14,
    DisruptTerminal = 15,
    OperatePower = 16,
    Fortify = 17,
    OperateController = 18,
    OperateFactory = 19,
}

export class SearchGoal {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    readonly pos: any;
    readonly range: number;
}

/**
 * A distance map search returns both the distance map (filled out
 * with all tiles explored) and the targets found. These aren't necessarily
 * the same positions specified as targets - if the target range is 5, then
 * this is the first position in range 5 of the target. If multiple targets
 * are specified, and you care about matching the found target with one of
 * the original targets, you can iterate through your list and figure out the
 * ones that are in range of the found target(s).
 */
export class SearchResult {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    readonly distance_map: MultiroomDistanceMap;
    readonly found_targets: Uint32Array;
    readonly ops: number;
}

/**
 * Translates `TERRAIN_*` constants.
 */
export enum Terrain {
    Plain = 0,
    Wall = 1,
    Swamp = 2,
}

/**
 * Exports the global range calculation between two positions.
 */
export function get_range(packed_pos_1: number, packed_pos_2: number): number;

export function get_terrain_cost_matrix(room_name: number, plain_cost?: number | null, swamp_cost?: number | null, wall_cost?: number | null): ClockworkCostMatrix;

export function js_astar_multiroom_distance_map(start_packed: Uint32Array, get_cost_matrix: Function, max_rooms: number, max_ops: number, max_path_cost: number, any_of_destinations?: Uint32Array | null, all_of_destinations?: Uint32Array | null): SearchResult;

/**
 * WASM wrapper for the BFS multiroom distance map function.
 *
 * # Arguments
 * * `start_packed` - Array of packed position integers representing start positions
 * * `get_cost_matrix` - JavaScript function that returns cost matrices for rooms
 * * `max_ops` - Maximum number of tiles to explore
 * * `max_rooms` - Maximum number of rooms to explore
 * * `max_room_distance` - Maximum Manhattan distance in rooms to explore
 * * `max_path_cost` - Maximum distance in tiles to explore
 * * `any_of_destinations` - Array of packed positions to trigger early exit when any are reached
 * * `all_of_destinations` - Array of packed positions to trigger early exit when all are reached
 *
 * # Returns
 * A `MultiroomDistanceMap` containing the distances from the start positions
 */
export function js_bfs_multiroom_distance_map(start_packed: Uint32Array, get_cost_matrix: Function, max_ops: number, max_rooms: number, max_path_cost: number, any_of_destinations?: Uint32Array | null, all_of_destinations?: Uint32Array | null): SearchResult;

export function js_dijkstra_multiroom_distance_map(start_packed: Uint32Array, get_cost_matrix: Function, max_ops: number, max_rooms: number, max_path_cost: number, any_of_destinations?: Uint32Array | null, all_of_destinations?: Uint32Array | null): SearchResult;

export function js_path_to_multiroom_distance_map_origin(start: number, distance_map: MultiroomDistanceMap, direction_order: DirectionOrder): Path;

export function js_path_to_multiroom_flow_field_origin(start: number, flow_field: MultiroomFlowField): Path;

export function js_path_to_multiroom_mono_flow_field_origin(start: number, flow_field: MultiroomMonoFlowField): Path;

/**
 * Creates a flow field for the given distance map.
 */
export function multiroomFlowField(distance_map: MultiroomDistanceMap, direction_order: DirectionOrder): MultiroomFlowField;

/**
 * Creates a monodirectional flow field for the given distance map.
 */
export function multiroomMonoFlowField(distance_map: MultiroomDistanceMap, direction_order: DirectionOrder): MultiroomMonoFlowField;

export function version(): string;
