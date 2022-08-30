import { System } from '../node_modules/ecsy/build/ecsy.module.min.js';
import {
    GeometryComponent, CurveComponent, LifetimeComponent, ExciterComponent,
    ResonatorComponent, KinematicsComponent, MidiContextComponent, HistoryComponent,
    RenderableComponent, WorldStateContextComponent, OrbiterComponent, AttractorComponent,
    GravitatorComponent
} from './components.js';
import { Vec2 } from './types.js';

// Main Engine =================================================================

// KinematicsSystem
// TODO: add boundary reflection or wrapping based on global context
// TODO: set gravity value in global context
export class KinematicsSystem extends System {
    execute(delta) {
        let entities = this.queries.entities.results;
        for (let entity of entities) {
            let geometry = entity.getMutableComponent(GeometryComponent)
            let kinematics = entity.getMutableComponent(KinematicsComponent)
            geometry.pos.add(kinematics.vel)
            kinematics.vel.add(kinematics.acc)

            // TODO: Bounce or wrap around horizontal edges based on a global context component
            // Bounce off at the boundary edges
            if (geometry.pos.x < 0 || geometry.pos.x > windowWidth) { // TODO: get windowWidth from singleton context entity rather than hardcoding 
                kinematics.vel.x *= -0.93
            }

        }
    }
}
KinematicsSystem.queries = {
    entities: { components: [GeometryComponent, KinematicsComponent] },
};

// GravitatorSystem
export class GravitatorSystem extends System {
    execute(delta) {
        let entities = this.queries.entities.results;
        for (let entity of entities) {
            let kinematics = entity.getMutableComponent(KinematicsComponent)
            kinematics.acc.set(0, 0.5)
        }
    }
}
GravitatorSystem.queries = {
    entities: { components: [GravitatorComponent, KinematicsComponent] },
};


// LoopSystem
export class LoopSystem extends System {
    execute(delta) {
        let worldStateContext = this.queries.context.results[0].getComponent(WorldStateContextComponent);
        if (mouseIsPressed) { // TODO: Move this section into a separate system
            // TOOD: move mouseX and mouseY into a context component
            if ((mouseX == worldStateContext.clickX) && (mouseY == worldStateContext.clickY)) {
                worldStateContext.mousePressedDuration += 1
            } else {
                worldStateContext.mousePressedDuration = 0
            }

            if (worldStateContext.mousePressedDuration > 20) {
                worldStateContext.loopMode = true
            }
        }

        let entities = this.queries.entities.results;
        for (let entity of entities) {
            let history = entity.getMutableComponent(HistoryComponent)
            if (worldStateContext.loopMode && history.buffer.length == history.length) {
                let geo = entity.getMutableComponent(GeometryComponent)
                let kinematics = entity.getMutableComponent(KinematicsComponent)
                let lifetime = entity.getMutableComponent(LifetimeComponent)

                // Set position and velocity based on history
                geo.pos.copy(history.buffer[history.readPointer][0])
                kinematics.vel.copy(history.buffer[history.readPointer][1])
                lifetime.percentage = history.buffer[history.readPointer][2]

                // Increment timestep
                history.readPointer = (history.readPointer + 1) % history.buffer.length;
            } else {
                // console.log(history.buffer)
                let geo = entity.getComponent(GeometryComponent)
                let kinematics = entity.getComponent(KinematicsComponent)
                let lifetime = entity.getComponent(LifetimeComponent)

                // console.log(history.pointer)
                history.pointer = history.readPointer
                history.buffer[history.pointer] = [geo.pos.clone(), kinematics.vel.clone(), lifetime.percentage];
                history.pointer = (history.pointer + 1) % history.length;
                history.readPointer = history.pointer
            }
        }
    }
}
LoopSystem.queries = {
    entities: { components: [GeometryComponent, KinematicsComponent, LifetimeComponent, HistoryComponent] },
    context: { components: [WorldStateContextComponent] }
};


// LifetimeSystem
export class LifetimeSystem extends System {
    execute(delta) {
        let entities = this.queries.entities.results;
        for (let i = entities.length - 1; i >= 0; i--) {
            let lifetime = entities[i].getMutableComponent(LifetimeComponent);
            lifetime.percentage -= lifetime.decayRate
            lifetime.fraction = lifetime.percentage / 100
            if (lifetime.percentage <= 0) {
                entities[i].remove()
            }
        }
    }
}
LifetimeSystem.queries = {
    entities: { components: [LifetimeComponent] },
};

// ExciterResonatorSystem
//      Manages exciter-resonator interactions
//      checks for exciter-resonator collisions and intersections (based on solidness)
//      sets appropriate post collision velocities, positions
//      sets appropriate values in resonator (excited, excitation strength)
//      exponentially dampens resonation if not excited
export class ExciterResonatorSystem extends System {
    execute(delta) {
        let exciters = this.queries.exciters.results;
        let resonators = this.queries.resonators.results;
        for (let resonator of resonators) {
            let resonator_geo = resonator.getComponent(GeometryComponent)
            let resonator_res = resonator.getMutableComponent(ResonatorComponent)
            resonator_res.isExcited = false
            resonator_res.resonationStrength *= 0.8

            // TODO: Move collision detection into a physics system
            for (let exciter of exciters) {
                let exciter_geo = exciter.getMutableComponent(GeometryComponent)
                let intersecting = collideRectCircle(
                    resonator_geo.pos.x, resonator_geo.pos.y, resonator_geo.width, resonator_geo.height,
                    exciter_geo.pos.x, exciter_geo.pos.y, exciter_geo.width)

                if (intersecting) {
                    let exciter_lifetime = exciter.getComponent(LifetimeComponent)
                    let exciter_kinematics = exciter.getMutableComponent(KinematicsComponent)

                    // Mark resonator as excited, set resonation strength
                    if (Math.abs(exciter_kinematics.vel.y) > 2) {
                        resonator_res.isExcited = true
                        resonator_res.resonationStrength = min(1, sqrt(10 * (exciter_lifetime.fraction ** 3)))
                    }

                    // Exciters bounce off if resonator is solid
                    if (resonator_res.isSolid) {
                        // TODO: allow collisions off any side of the resonator
                        if (Math.abs(exciter_kinematics.vel.y) > 2) {
                            exciter_kinematics.vel.x = random(
                                -exciter_kinematics.vel.y * 0.5, exciter_kinematics.vel.y * 0.5)
                        } else {
                            exciter_kinematics.vel.x = 0
                        }
                        exciter_kinematics.vel.y *= -0.93 // TODO: link this to slider
                        exciter_geo.pos.y = resonator_geo.pos.y - exciter_geo.height / 2
                    }
                }
            }
        }
    }
}
ExciterResonatorSystem.queries = {
    exciters: { components: [ExciterComponent, GeometryComponent, KinematicsComponent] },
    resonators: { components: [ResonatorComponent, GeometryComponent] },
};


// ExciterExciterSystem
//      Manages exciter-exciter interactions (eg. collisions, attractor, repeller)


// OrbiterAttractorSystem
//      Manages orbiter-attractor interactions
// TODO: Figure out division of responsibilities between this and ExciterResonatorSystem
//  or consolidate the two sytems. 
export class  OrbiterAttractorSystem extends System {
    execute(delta) {
        let orbiters = this.queries.orbiters.results;
        let attractors = this.queries.attractors.results;
        for (let attractor of attractors) {
            let attractor_geo = attractor.getComponent(GeometryComponent);
            let attractor_att = attractor.getComponent(AttractorComponent);
            attractor_att.numOrbiters = 0
            for (let orbiter of orbiters) {
                let orbiter_geo = orbiter.getMutableComponent(GeometryComponent);
                let orbiter_orb = orbiter.getMutableComponent(OrbiterComponent);
                let orbiter_kin = orbiter.getMutableComponent(KinematicsComponent);
                if (this.distance(orbiter_geo.pos, attractor_geo.pos) <= attractor_att.orbitThreshold) {
                    attractor_att.numOrbiters += 1

                    orbiter_orb.orbitLocked = true
                    let speed = this.norm(orbiter_kin.vel)
                    let direction = this.normalized(this.rotatedPI(this.subtract(attractor_geo.pos, orbiter_geo.pos)))
                    orbiter_kin.vel.x = speed * direction.x
                    orbiter_kin.vel.y = speed * direction.y
                }
            }
            for (let i = 0; i < attractor_att.resonators.length; i++) {
                let res = attractor_att.resonators[i].getMutableComponent(ResonatorComponent)
                if (i < attractor_att.numOrbiters) {
                    res.isExcited = true
                    res.resonationStrength = 1
                } else {
                    res.isExcited = false
                    res.resonationStrength *= 0.8
                }
            }
        }
    }

    // TODO: move vector operations into the vector class or a util library
    distance(vec1, vec2) {
        return Math.sqrt((vec2.x - vec1.x)**2 + (vec2.y - vec1.y)**2)
    }

    subtract(vec1, vec2) {
        return new Vec2(vec1.x - vec2.x, vec1.y - vec2.y)
    }

    norm(vec) {
        return Math.sqrt(vec.x**2 + vec.y**2)
    }

    normalized(vec) {
        let n = this.norm(vec)
        return new Vec2(vec.x/n, vec.y/n)
    }

    rotatedPI(vec) {
        return new Vec2(-vec.y, vec.x)
    }
}
OrbiterAttractorSystem.queries = {
    orbiters: { components: [OrbiterComponent, ExciterComponent, GeometryComponent, KinematicsComponent] },
    attractors: { components: [AttractorComponent, GeometryComponent] }
};



// Event Handling Systems ======================================================

// Resize System
// TODO: Generalize logic. Current implementation is hacky.
//      Save old window dimensions in global context, use that to resize entities, then update the global context 
export class ResizeSystem extends System {
    init() {
        this.prevWindowWidth = windowWidth;
        this.prevWindowHeight = windowHeight;
    }
    execute() {
        let entities = this.queries.entities.results;
        for (let i = 0; i < entities.length; i++) {
            let geometry = entities[i].getMutableComponent(GeometryComponent)
            geometry.pos.x = geometry.pos.x * windowWidth / this.prevWindowWidth
            // TODO: update orbiter position as well
            if (geometry.primitive == 'rectangle')
                geometry.width = geometry.width * windowWidth / this.prevWindowWidth
                geometry.pos.y = (geometry.pos.y + geometry.height) * windowHeight / this.prevWindowHeight - geometry.height // Hacky
            // geometry.height = geometry.height * windowHeight / prevWindowHeight
            // geometry.pos.y = geometry.pos.y * windowWidth / prevWindowWidth
            // geometry.width = window.width / window.N // Note: window.N should be in a context entity; context change should trigger this system
            // geometry.pos.set((window.width / N * i), (window.height - 40))
        }
        this.prevWindowWidth = windowWidth;
        this.prevWindowHeight = windowHeight;
    }
}

ResizeSystem.queries = {
    entities: { components: [GeometryComponent, ResonatorComponent] },
    // context: {}
};

// MIDI Systems ================================================================

// MidiOutSystem
export class MidiOutSystem extends System {
    init() {
        if (!WebMidi.enabled) {
            WebMidi
                .enable()
                .then(this.onMidiEnabled)
                .catch(err => alert(err));
        }
    }

    onMidiEnabled() {
        console.log("WebMidi enabled!")

        // Inputs
        console.log("Inputs:")
        WebMidi.inputs.forEach(input => console.log(input.manufacturer, input.name));

        // Outputs
        console.log("Outputs:")
        WebMidi.outputs.forEach(output => console.log(output.manufacturer, output.name));
    }

    execute(delta) {
        if (!WebMidi.enabled) {
            return
        }

        if (this.queries.context.changed.length > 0 || !this.midiOut) {
            let midiContext = this.queries.context.results[0].getComponent(MidiContextComponent)
            this.midiOut = WebMidi.getOutputByName(midiContext.output);
        }

        if (this.midiOut) {
            let resonatorEntities = this.queries.resonators.changed;
            for (let resonatorEntity of resonatorEntities) {
                let resonator = resonatorEntity.getComponent(ResonatorComponent)
                if (resonator.isSolid) {
                    if (resonator.isExcited) {
                        // Note: Could make channel a property of ResonatorComponent
                        this.midiOut.channels[1].playNote(
                            resonator.note.value,
                            { duration: resonator.durationMillis, attack: resonator.resonationStrength });
                    }
                } else { // Resonator is not solid
                    if (resonator.isExcited) {
                        this.midiOut.channels[1].sendNoteOn(
                            resonator.note.value, { attack: resonator.resonationStrength });
                    } else {
                        // console.log("noteoff")
                        this.midiOut.channels[1].sendNoteOff(
                            resonator.note.value, { attack: resonator.resonationStrength });
                    }
                }
            }
        }
    }

    stop() {
        // TODO: Send note off messages, close ports etc.
    }
}
MidiOutSystem.queries = {
    resonators: {
        components: [ResonatorComponent],
        listen: { changed: [ResonatorComponent] }
    },
    context: {
        components: [MidiContextComponent],
        listen: { changed: [MidiContextComponent] }
    }
};


// Sound

// Rendering Systems ===========================================================

export class P5RendererSystem extends System {
    execute(delta) {
        background('Black')
        fill(255)
        textSize(48)
        textFont(window.Fonts.emeritus)
        text('DAWN', width - 200, 55)

        // Render mouse trails
        strokeWeight(2)
        strokeJoin(ROUND)
        noFill()
        let mouseTrails = this.queries.mouseTrails.results;
        for (var i = 0; i < mouseTrails.length; i++) {
            let curve = mouseTrails[i].getComponent(CurveComponent);
            let lifetime = mouseTrails[i].getComponent(LifetimeComponent);
            stroke(255, 255 * lifetime.fraction)
            beginShape()
            for (vertex of curve.vertices) {
                curveVertex(vertex.x, vertex.y)
            }
            endShape()
        }

        // Render exciters
        strokeWeight(1)
        let exciters = this.queries.exciters.results;
        for (var i = 0; i < exciters.length; i++) {
            let geo = exciters[i].getComponent(GeometryComponent);
            let lifetime = exciters[i].getComponent(LifetimeComponent);
            stroke(255, 255 * lifetime.fraction);
            this.renderGeometry(geo.primitive, geo.pos.x, geo.pos.y, geo.width, geo.height)
        }

        // Render resonators
        noStroke()
        let resonators = this.queries.resonators.results;
        for (var i = 0; i < resonators.length; i++) {
            let geo = resonators[i].getComponent(GeometryComponent);
            let res = resonators[i].getComponent(ResonatorComponent);

            fill(255 * res.resonationStrength)
            this.renderGeometry(geo.primitive, geo.pos.x, geo.pos.y, geo.width, geo.height)

            fill(255 * (1 - res.resonationStrength))
            textSize(16)
            textFont(window.Fonts.dudler)
            if (geo.primitive == 'ellipse') {
                text(res.note.name, geo.pos.x - 5, geo.pos.y + 8) 
            } else {
                text(res.note.name, geo.pos.x + 10, geo.pos.y + 26)
            }
        }

        // Render loop sign if loopMode is activated
        let worldStateContext = this.queries.context.results[0].getComponent(WorldStateContextComponent);
        if (worldStateContext.loopMode) {
            fill(255)
            ellipse(mouseX, mouseY, 60, 60)
            fill(0)
            textSize(20)
            textFont((window.Fonts.dudler))
            text("loop", mouseX - 19, mouseY + 7)
        }
    }

    renderGeometry(primitive, x, y, width, height) {
        if (primitive == 'rectangle') {
            rect(x, y, width, height)
        } else if (primitive == 'ellipse') {
            ellipse(x, y, width, height)
        } else {
            throw ('Invalid primitive: ' + str(primitive))
        }
    }
}

P5RendererSystem.queries = {
    mouseTrails: { components: [RenderableComponent, CurveComponent, LifetimeComponent] },
    exciters: { components: [RenderableComponent, GeometryComponent, ExciterComponent, LifetimeComponent] },
    resonators: { components: [RenderableComponent, GeometryComponent, ResonatorComponent] },
    context: { components: [WorldStateContextComponent] }
};