// TODO: Write the whole damn thing. nothing below is original

import { World, System } from './node_modules/ecsy/build/ecsy.module.min.js';
import {
    GeometryComponent, CurveComponent, LifetimeComponent, ExciterComponent,
    ResonatorComponent, KinematicsComponent, MidiContextComponent, HistoryComponent,
    RenderableComponent, WorldStateContextComponent, OrbiterComponent,
    AttractorComponent, GravitatorComponent, PhysicsContextComponent
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
    let x = windowWidth/2;
    let y = windowHeight/2;
    window.N = notes.length
    for (var i = 0; i < 100; i++) {
        console.log(notes.length)
        circle(x, y, 10); 
        world.createEntity()
            .addComponent(GeometryComponent, {
                primitive: 'ellipse',
                width: 50,
                height: 50,
                pos: new Vec2(x, y)
            })
            .addComponent(ResonatorComponent, {
                isSolid: false,
                note: notes[i]
            })
            .addComponent(RenderableComponent);
    }

    // Event Handlers
    // TODO: Bruh.
    world.mouseClicked = function () {
        if (!worldContext.getMutableComponent(WorldStateContextComponent).loopMode)
            createExciterEntity(mouseX, mouseY, 10, 'ellipse')
        worldContext.getMutableComponent(WorldStateContextComponent).loopMode = false
    }

    world.mouseDragged = function () {
        if (!worldContext.getMutableComponent(WorldStateContextComponent).loopMode) {
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
        trailEntity = createTrailEntity()

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