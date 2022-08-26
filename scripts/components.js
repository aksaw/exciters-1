import { Component, TagComponent, Types } from '../node_modules/ecsy/build/ecsy.module.min.js';
import { Vec2Type, NoteType } from './types.js'

// Geometry Components
export class GeometryComponent extends Component { }
GeometryComponent.schema = {
    // TODO: Separate out position component (entity can have position but no shape, eg. spigot)
    // TODO: Create a separate RenderableTagComponent (entity can have position & geometry but be invisible)
    pos: { type: Vec2Type },
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
    isExcited: { type: Types.Boolean },
    resonationStrength: { type: Types.Number }, // [0,1]

    // Note related properties could be in a separate component
    note: { type: NoteType },
    durationMillis: { type: Types.Number, default: 100 },
    
    // TODO: Create a separate tag component for Solidness
    isSolid: { type: Types.Boolean, default: false }, 
}

// Spigot component
export class SpigotComponent extends Component { }
SpigotComponent.schema = {
        
}

// Attractor component

// Context Components
export class MidiContextComponent extends Component { }
MidiContextComponent.schema = {
    availableOutputs: {type: Types.Array},
    availableInputs: {type: Types.Array},
    output: {type: Types.String},
    input: {type: Types.String},
}

export class WorldStateContextComponent extends Component { }
WorldStateContextComponent.schema = {
    loopMode: {type: Types.Boolean, default: false},
    // canvasActive: set to false when interacting with UI elements etc.
    clickX: {type: Types.Number},
    clickY: {type: Types.Number},
}

// View Components
export class RenderableComponent extends TagComponent {}