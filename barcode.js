import { World, System } from './node_modules/ecsy/build/ecsy.module.min.js';
import {
    GeometryComponent, CurveComponent, LifetimeComponent, ExciterComponent,
    ResonatorComponent, KinematicsComponent, MidiContextComponent, HistoryComponent,
    RenderableComponent, WorldStateContextComponent, OrbiterComponent,
    AttractorComponent, GravitatorComponent, PhysicsContextComponent, TextRenderableComponent
} from './scripts/components.js';
import {
    KinematicsSystem, LifetimeSystem, P5RendererSystem, ExciterResonatorSystem,
    ResizeSystem, MidiOutSystem, LoopSystem, GravitatorSystem
} from './scripts/systems.js';
import { random } from './scripts/util.js';
import { Vec2 } from './scripts/types.js';
import { notes } from './scripts/midi.js';

let world, worldContext;
let resonators;

export function createWorld() {
    world = new World();

    // Register components
    world
        .registerComponent(GeometryComponent)
        .registerComponent(CurveComponent)
        .registerComponent(LifetimeComponent)
        .registerComponent(ExciterComponent)
        .registerComponent(ResonatorComponent)
        .registerComponent(KinematicsComponent)
        .registerComponent(AttractorComponent)
        .registerComponent(GravitatorComponent)
        .registerComponent(OrbiterComponent)
        .registerComponent(HistoryComponent)
        .registerComponent(MidiContextComponent)
        .registerComponent(RenderableComponent)
        .registerComponent(WorldStateContextComponent)
        .registerComponent(PhysicsContextComponent)
        .registerComponent(TextRenderableComponent)

    // Register systems
    world
        .registerSystem(P5RendererSystem)
        .registerSystem(LifetimeSystem)
        .registerSystem(KinematicsSystem)
        .registerSystem(GravitatorSystem)
        .registerSystem(ExciterResonatorSystem)
        .registerSystem(MidiOutSystem)
        .registerSystem(ResizeSystem)
        .registerSystem(LoopSystem)

    // Stop systems that do not need to run continuously
    world.getSystem(ResizeSystem).stop()

    // Create global context singleton entity
    worldContext = world.createEntity()
        .addComponent(MidiContextComponent, {
            output: 'loopMIDI Port 1'
        })
        .addComponent(WorldStateContextComponent)
        .addComponent(PhysicsContextComponent, {
            edgeBounce: true
        })
    world.worldContext = worldContext
    // TODO: Create some kind of InputSystem that populates context based on menu settings?

    // Create resonator entities
    // TODO: parameterize number of resonators, position etc.
    // TODO: yaml + util to set up notes
    // window.N = notes.length
    window.N = 30
    let padding = 300
    let tileHeight = 300
    resonators = []
    for (var i = 0; i < window.N; i++) {
        resonators.push(
            world.createEntity()
                .addComponent(GeometryComponent, {
                    primitive: 'rectangle',
                    width: random(0.1, 1.0) * ((window.width - 2 * padding) / window.N - 50),
                    height: tileHeight,
                    pos: new Vec2(
                        padding + ((window.width - 2 * padding) / window.N * i),
                        (height - tileHeight) / 2
                    )
                })
                .addComponent(ResonatorComponent, {
                    isSolid: false,
                    note: notes[i % notes.length]
                })
                .addComponent(RenderableComponent)
        );
    }

    // Event Handlers
    // TODO: Bruh.
    world.mouseClicked = function () {
        createExciterEntity(mouseX, mouseY, 10, 'ellipse')
    }

    world.mouseDragged = function () {
        createExciterEntity(mouseX, mouseY, 10, 'ellipse')
    }

    world.mousePressed = function () {
        worldContext.getMutableComponent(WorldStateContextComponent).clickX = mouseX
        worldContext.getMutableComponent(WorldStateContextComponent).clickY = mouseY
        worldContext.getMutableComponent(WorldStateContextComponent).mousePressedDuration = 0
    }

    world.windowResized = function () {
        resizeCanvas(windowWidth, windowHeight)
        if (world)
            world.getSystem(ResizeSystem).execute()
    }

    return world
}

// Helper methods to create entities with certain archetypes ==================

function createExciterEntity(x, y, size = 10, primitive = 'ellipse') {
    return world.createEntity()
        .addComponent(GeometryComponent, {
            primitive: primitive,
            width: size,
            height: size,
            pos: new Vec2(x, y)
        })
        .addComponent(KinematicsComponent, {
            vel: new Vec2(random(-2, 2), random(-2, 2))
        })
        .addComponent(GravitatorComponent)
        .addComponent(LifetimeComponent, {
            decayRate: 0.92
        })
        .addComponent(ExciterComponent)
}