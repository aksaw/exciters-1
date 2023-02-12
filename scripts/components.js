// import { Component, TagComponent, Types } from '../node_modules/ecsy/build/ecsy.module.min.js';
import { Component, TagComponent, Types } from 'https://ecsyjs.github.io/ecsy/build/ecsy.module.js';
import { Vec2Type, NoteType } from './types.js'

// Geometry Components
export class GeometryComponent extends Component { }
GeometryComponent.schema = {
    // TODO: Separate out position component (entity can have position but no shape, eg. spigot)
    // TODO: Create a separate RenderableTagComponent (entity can have position & geometry but be invisible)
    pos: { type: Vec2Type }, // TODO: make pos the center rather than top left corner of rectangle
    primitive: { type: Types.String, default: 'rectangle' }, // 'rectangle', 'ellipse'
    width: { type: Types.Number },
    height: { type: Types.Number },
}

export class CurveComponent extends Component { }
CurveComponent.schema = {
    vertices: { type: Types.Array },
}

// Movement Components
export class KinematicsComponent extends Component { }
KinematicsComponent.schema = {
    vel: { type: Vec2Type },
    acc: { type: Vec2Type }
}

export class HistoryComponent extends Component {}
HistoryComponent.schema = {
    buffer: { type: Types.Array },
    pointer: { type: Types.Number, default: 0 },
    readPointer: { type: Types.Number, default: 0 },
    length: { type: Types.Number }
}

// export class PhysicsContextComponent extends Component {}
// PhysicsContextComponent.schema = {
//     vel: { type: Vec2Type },
//     acc: { type: Vec2Type }
// }

// Lifetime Component
export class LifetimeComponent extends Component { }
LifetimeComponent.schema = {
    percentage: { type: Types.Number, default: 100 },
    fraction: { type: Types.Number, default: 1 },
    decayRate: { type: Types.Number, default: 0.25 }
}

// Resonation Components
export class ExciterComponent extends Component { }
ExciterComponent.schema = {
    // : { type: Types.Number},
}

export class ResonatorComponent extends Component { }
ResonatorComponent.schema = {
    // TODO: add excitation levels like energy levels of an atom
    // Depending on which energy levels are poopulated, different notes are played
    // Ground state excitation = root note, First excitation state = minor third, etc.
    isExcited: { type: Types.Boolean },
    resonationStrength: { type: Types.Number }, // [0,1]

    // Note related properties could be in a separate component
    note: { type: NoteType },
    durationMillis: { type: Types.Number, default: 100 },
    
    // TODO: Create a separate tag component for Solidness
    isSolid: { type: Types.Boolean, default: false }, 
}

// Spigot component
// export class SpigotComponent extends Component { }
// SpigotComponent.schema = {
//     // rate: { type: Types.Number }
// }

// Attraction components
export class AttractorComponent extends Component { }
AttractorComponent.schema = {
    orbitLockRadius : { type: Types.Number },
    numOrbiters: { type: Types.Number },
    resonationRadius : { type: Types.Number },
    resonators:  { type: Types.Array } // TODO: Make sure it is sound to have entities in a component
}

export class OrbiterComponent extends Component { }
OrbiterComponent.schema = {
    // orbitLocked: { type: Types.Boolean }
}

export class GravitatorComponent extends TagComponent { }

// Context Components
export class PhysicsContextComponent extends Component { }
PhysicsContextComponent.schema = {
    edgeBounce: { type: Types.Boolean },
    edgeWrap: { type: Types.Boolean }
}

export class MidiContextComponent extends Component { }
MidiContextComponent.schema = {
    output: {type: Types.String},
    input: {type: Types.String},
}

export class WorldStateContextComponent extends Component { }
WorldStateContextComponent.schema = {
    loopMode: {type: Types.Boolean, default: false},
    // loopLocked: {type: Types.Boolean, default: false},
    canvasActive: {type: Types.Boolean, default: true}, //set to false when interacting with UI elements etc.
    clickX: {type: Types.Number},
    clickY: {type: Types.Number},
}

// View Components
export class RenderableComponent extends TagComponent {}

export class TextRenderableComponent extends TagComponent {}

// UI Components