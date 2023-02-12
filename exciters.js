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
    ResizeSystem, MidiOutSystem, LoopSystem, GravitatorSystem, SynthSystem
} from './scripts/systems.js';
import { Vec2 } from './scripts/types.js';
import { notes } from './scripts/midi.js';

let world, worldContext;
let trailEntity;

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
        // .registerSystem(SynthSystem)

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
    window.N = notes.length
    for (var i = 0; i < notes.length; i++) {
        world.createEntity()
            .addComponent(GeometryComponent, {
                primitive: 'rectangle',
                width: window.width / window.N,
                height: 40,
                pos: new Vec2((window.width / N * i), (window.height - 40))
            })
            .addComponent(ResonatorComponent, {
                isSolid: true,
                note: notes[i]
            })
            .addComponent(RenderableComponent)
            .addComponent(TextRenderableComponent);
    }

    // Event Handlers
    // TODO: Bruh.
    world.mouseClicked = function () {
        let worldStateContext = worldContext.getComponent(WorldStateContextComponent)
        if (!worldStateContext.loopMode && worldStateContext.canvasActive)
            createExciterEntity(mouseX, mouseY, 10, 'ellipse')
        worldContext.getMutableComponent(WorldStateContextComponent).loopMode = false
    }

    world.mouseDragged = function () {
        let worldStateContext = worldContext.getComponent(WorldStateContextComponent)
        if (!worldStateContext.loopMode && worldStateContext.canvasActive) {
            if (!trailEntity || !trailEntity.alive) {
                trailEntity = createTrailEntity()
            }

            if (mouseX < windowWidth && mouseY < windowHeight) {
                trailEntity.getMutableComponent(CurveComponent).vertices.push(new Vec2(mouseX, mouseY))
                trailEntity.getMutableComponent(LifetimeComponent).percentage = 100

                if (mouseX % 6 == 0) {
                    createExciterEntity(mouseX, mouseY, 10, 'ellipse')
                }
            }
        }
    }

    world.mousePressed = function () {
        let worldStateContext = worldContext.getComponent(WorldStateContextComponent)
        if (worldStateContext.canvasActive) {
            trailEntity = createTrailEntity()
        }

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

function createExciterEntity(x, y, size = 10, primitive = 'ellipse') {
    return world.createEntity()
        .addComponent(GeometryComponent, {
            primitive: primitive,
            width: size,
            height: size,
            pos: new Vec2(x, y)
        })
        .addComponent(KinematicsComponent, {
        })
        .addComponent(GravitatorComponent)
        .addComponent(LifetimeComponent)
        .addComponent(ExciterComponent)
        .addComponent(RenderableComponent)
        .addComponent(HistoryComponent, {
            length: 120
        })
}