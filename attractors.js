// import { World, System } from './node_modules/ecsy/build/ecsy.module.min.js';
import { World, System } from 'https://ecsyjs.github.io/ecsy/build/ecsy.module.js';
import {
    GeometryComponent, CurveComponent, LifetimeComponent, ExciterComponent,
    ResonatorComponent, KinematicsComponent, MidiContextComponent, HistoryComponent,
    RenderableComponent, WorldStateContextComponent, OrbiterComponent,
    AttractorComponent, GravitatorComponent, PhysicsContextComponent, TextRenderableComponent
} from './scripts/components.js';
import {
    KinematicsSystem, LifetimeSystem, P5RendererSystem, ExciterResonatorSystem,
    ResizeSystem, MidiOutSystem, LoopSystem, OrbiterAttractorSystem, SynthSystem
} from './scripts/systems.js';
import { Vec2, Note } from './scripts/types.js';
import { random } from './scripts/util.js';
import { chord_d_minor, chord_e_minor } from './scripts/midi.js';

let world, worldContext;

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
        .registerSystem(OrbiterAttractorSystem)
        .registerSystem(MidiOutSystem)
        .registerSystem(ResizeSystem)
        .registerSystem(LoopSystem)
    // .registerSystem(SynthSystem)

    // Stop systems that do not need to run continuously
    world.getSystem(ResizeSystem).stop()

    // Create global context singleton entity
    worldContext = world.createEntity()
        .addComponent(MidiContextComponent, {
            output: 'loopMIDI Port 1'
        })
        .addComponent(PhysicsContextComponent)
        .addComponent(WorldStateContextComponent)
    world.worldContext = worldContext
    // TODO: Create some kind of InputSystem or UISystem that populates context based on menu settings?

    // Create attractor A
    let resonators = []
    for (let i = 0; i < chord_d_minor.length; i++) {
        resonators.push(
            world.createEntity()
                .addComponent(GeometryComponent, {
                    primitive: 'ellipse',
                    width: 80,
                    height: 80,
                    pos: new Vec2((window.width / 3), (window.height / 3))
                })
                .addComponent(ResonatorComponent, {
                    isSolid: false,
                    note: chord_d_minor[i]
                })
        )
    }
    resonators[0]
        .addComponent(RenderableComponent)
        .addComponent(TextRenderableComponent)
    world.createEntity()
        .addComponent(GeometryComponent, {
            primitive: 'ellipse',
            width: 0,
            height: 0,
            pos: new Vec2((window.width / 3), (window.height / 3))
        })
        .addComponent(AttractorComponent, {
            orbitLockRadius: 180,
            resonationRadius: 250,
            resonators: resonators
        })

    // Create attractor B
    resonators = []
    for (let i = 0; i < chord_d_minor.length; i++) {
        resonators.push(
            world.createEntity()
                .addComponent(GeometryComponent, {
                    primitive: 'ellipse',
                    width: 80,
                    height: 80,
                    pos: new Vec2((2 * window.width / 3), (2 * window.height / 3))
                })
                .addComponent(ResonatorComponent, {
                    isSolid: false,
                    note: new Note(chord_e_minor[i].name, chord_e_minor[i].value - 12)
                })
        )
    }
    resonators[0]
        .addComponent(RenderableComponent)
        .addComponent(TextRenderableComponent)
    world.createEntity()
        .addComponent(GeometryComponent, {
            primitive: 'ellipse',
            width: 0,
            height: 0,
            pos: new Vec2((2 * window.width / 3), (2 * window.height / 3))
        })
        .addComponent(AttractorComponent, {
            orbitLockRadius: 150,
            resonationRadius: 250,
            resonators: resonators
        })

    // Events Handlers
    // TODO: Disgusting. Please do this in a better way.
    world.mouseClicked = function () {
        let worldStateContext = worldContext.getComponent(WorldStateContextComponent)
        if (!worldStateContext.loopMode && worldStateContext.canvasActive)
            createOrbiterEntity(mouseX, mouseY, 10, 'ellipse')
        worldContext.getMutableComponent(WorldStateContextComponent).loopMode = false
    }

    world.mouseDragged = function () {
        let worldStateContext = worldContext.getComponent(WorldStateContextComponent)
        if (mouseX % 2 == 0 && mouseY % 2 == 0 && worldStateContext.canvasActive)
            createOrbiterEntity(mouseX, mouseY, 10, 'ellipse')
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

function createTrailEntity() {
    return world.createEntity()
        .addComponent(CurveComponent)
        .addComponent(LifetimeComponent)
        .addComponent(KinematicsComponent)
        .addComponent(RenderableComponent)
}

function createOrbiterEntity(x, y, size = 10, primitive = 'ellipse') {
    return world.createEntity()
        .addComponent(GeometryComponent, {
            primitive: primitive,
            width: size,
            height: size,
            pos: new Vec2(x, y)
        })
        .addComponent(KinematicsComponent, {
            // vel: new Vec2(10 * Math.random() - 5, 10 * Math.random() - 5)
            vel: new Vec2(random(1, 5) * (random(0, 1) < 0.5 ? 1 : -1),
                random(1, 5) * (random(0, 1) < 0.5 ? 1 : -1))
        })
        .addComponent(LifetimeComponent, {
            decayRate: 0.18
        })
        .addComponent(RenderableComponent)
        .addComponent(HistoryComponent, {
            length: 120
        })
        .addComponent(ExciterComponent) // TODO: orbiters don't need to be exciters
        .addComponent(OrbiterComponent)
}