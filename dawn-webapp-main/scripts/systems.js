import { System, Not } from '../node_modules/ecsy/build/ecsy.module.min.js';
import {
    GeometryComponent, CurveComponent, LifetimeComponent, ExciterComponent,
    ResonatorComponent, KinematicsComponent, MidiContextComponent, HistoryComponent,
    RenderableComponent, WorldStateContextComponent, OrbiterComponent, AttractorComponent,
    GravitatorComponent, PhysicsContextComponent, TextRenderableComponent
} from './components.js';
import { Vec2 } from './types.js';

// Main Engine =================================================================

// KinematicsSystem
// TODO: add boundary reflection or wrapping based on global context
// TODO: set gravity value in global context
export class KinematicsSystem extends System {
    execute(delta) {
        let entities = this.queries.entities.results;
        let physicsContext = this.queries.context.results[0].getComponent(PhysicsContextComponent);
        for (let entity of entities) {
            let geometry = entity.getMutableComponent(GeometryComponent)
            let kinematics = entity.getMutableComponent(KinematicsComponent)
            geometry.pos.add(kinematics.vel)
            kinematics.vel.add(kinematics.acc)

            // Bounce off at the boundary edges
            if (physicsContext.edgeBounce) {
                if (geometry.pos.x < 0 || geometry.pos.x > windowWidth) { // TODO: get windowWidth from singleton context entity rather than hardcoding 
                    kinematics.vel.x *= -0.93
                }
            }
        }
    }
}
KinematicsSystem.queries = {
    entities: { components: [GeometryComponent, KinematicsComponent] },
    context: { components: [PhysicsContextComponent] }
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
                let intersecting = false

                if (resonator_geo.primitive == 'rectangle') {
                    intersecting = collideRectCircle(
                        resonator_geo.pos.x, resonator_geo.pos.y, resonator_geo.width, resonator_geo.height,
                        exciter_geo.pos.x, exciter_geo.pos.y, exciter_geo.width)
                } else if (resonator_geo.primitive == 'ellipse') {
                    // Assumes both resonator_geo and exciter_geo are circles, i.e. height = width
                    let distance = Math.sqrt((resonator_geo.pos.x - exciter_geo.pos.x) ** 2 + (resonator_geo.pos.y - exciter_geo.pos.y) ** 2)
                    if (distance < resonator_geo.height + exciter_geo.height) {
                        intersecting = true
                    }
                }

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
export class OrbiterAttractorSystem extends System {
    execute(delta) {
        let orbiters = this.queries.orbiters.results;
        let attractors = this.queries.attractors.results;

        // Determine orbits
        for (let orbiter of orbiters) {
            let orbiter_geo = orbiter.getMutableComponent(GeometryComponent);
            let orbiter_orb = orbiter.getMutableComponent(OrbiterComponent);
            let orbiter_kin = orbiter.getMutableComponent(KinematicsComponent);
            orbiter_orb.orbitLocked = false

            let speed = this.norm(orbiter_kin.vel)
            let prevDirection = this.normalized(orbiter_kin.vel)
            let nextDirection = this.normalized(orbiter_kin.vel)

            // single attractor orbit
            for (let attractor of attractors) {
                let attractor_geo = attractor.getComponent(GeometryComponent);
                let attractor_att = attractor.getComponent(AttractorComponent);

                if (this.distance(orbiter_geo.pos, attractor_geo.pos) <= attractor_att.orbitLockRadius) {
                    let targetDirection = this.normalized(this.rotatedPI(this.subtract(attractor_geo.pos, orbiter_geo.pos), 1, 1))
                    let cosine = (orbiter_kin.vel.x * targetDirection.x + orbiter_kin.vel.y * targetDirection.y) / this.norm(orbiter_kin.vel)
                    let sine = Math.sqrt(1 - cosine ** 2)
                    if (cosine < 0) {
                        targetDirection.x *= -1
                        targetDirection.y *= -1
                    }

                    orbiter_orb.orbitLocked = true
                    if (Math.abs(cosine) > 0.95) {
                        nextDirection.x = targetDirection.x
                        nextDirection.y = targetDirection.y
                    } else {
                        let alpha = 0.03
                        nextDirection.x = alpha * targetDirection.x + (1 - alpha) * prevDirection.x
                        nextDirection.y = alpha * targetDirection.y + (1 - alpha) * prevDirection.y
                        nextDirection = this.normalized(nextDirection)
                    }
                }
            }

            // two attractor orbit
            if (!orbiter_orb.orbitLocked && attractors.length == 2) {
                let attractor01_geo = attractors[0].getComponent(GeometryComponent)
                let attractor02_geo = attractors[1].getComponent(GeometryComponent)
                let centerPos = new Vec2(
                    (attractor01_geo.pos.x + attractor02_geo.pos.x) / 2,
                    (attractor01_geo.pos.y + attractor02_geo.pos.y) / 2)
                let F = this.distance(attractor01_geo.pos, attractor02_geo.pos)
                let b = windowWidth / 6
                let a = Math.sqrt(F ** 2 + b ** 2)
                let targetDirection = this.normalized(this.rotatedPI(this.subtract(centerPos, orbiter_geo.pos), a, b))
                let cosine = (orbiter_kin.vel.x * targetDirection.x + orbiter_kin.vel.y * targetDirection.y) / this.norm(orbiter_kin.vel)
                if (cosine < 0) {
                    targetDirection.x *= -1
                    targetDirection.y *= -1
                }

                if (Math.abs(cosine) > 0.9) {
                    nextDirection.x = targetDirection.x
                    nextDirection.y = targetDirection.y
                } else {
                    let alpha = 0.05
                    nextDirection.x = alpha * targetDirection.x + (1 - alpha) * prevDirection.x
                    nextDirection.y = alpha * targetDirection.y + (1 - alpha) * prevDirection.y
                    nextDirection = this.normalized(nextDirection)
                }
            }

            orbiter_kin.vel.x = speed * nextDirection.x
            orbiter_kin.vel.y = speed * nextDirection.y
        }

        // Set resonation
        for (let attractor of attractors) {
            let attractor_att = attractor.getComponent(AttractorComponent);
            let attractor_geo = attractor.getComponent(GeometryComponent);

            attractor_att.numOrbiters = 0
            for (let orbiter of orbiters) {
                let orbiter_geo = orbiter.getMutableComponent(GeometryComponent);
                if (this.distance(orbiter_geo.pos, attractor_geo.pos) <= attractor_att.resonationRadius) {
                    attractor_att.numOrbiters += 1
                }
            }

            for (let i = 0; i < attractor_att.resonators.length; i++) {
                let res = attractor_att.resonators[i].getComponent(ResonatorComponent)
                if (i < attractor_att.numOrbiters) {
                    if (!res.isExcited) {
                        let resMutable = attractor_att.resonators[i].getMutableComponent(ResonatorComponent)
                        resMutable.isExcited = true
                        resMutable.resonationStrength = 1
                    }
                } else if (i >= attractor_att.numOrbiters) {
                    if (res.isExcited) {
                        let resMutable = attractor_att.resonators[i].getMutableComponent(ResonatorComponent)
                        resMutable.isExcited = false
                    }
                    if (i == 0) {
                        let resMutable = attractor_att.resonators[i].getMutableComponent(ResonatorComponent)
                        resMutable.resonationStrength *= 0.8
                    }
                }
            }
        }
    }

    // TODO: move vector operations into the vector class or a util library
    distance(vec1, vec2) {
        return Math.sqrt((vec2.x - vec1.x) ** 2 + (vec2.y - vec1.y) ** 2)
    }

    subtract(vec1, vec2) {
        return new Vec2(vec1.x - vec2.x, vec1.y - vec2.y)
    }

    norm(vec) {
        return Math.sqrt(vec.x ** 2 + vec.y ** 2)
    }

    normalized(vec) {
        let n = this.norm(vec)
        return new Vec2(vec.x / n, vec.y / n)
    }

    rotatedPI(vec, a, b) {
        return new Vec2(-a * vec.y, b * vec.x)
    }
}
OrbiterAttractorSystem.queries = {
    orbiters: { components: [OrbiterComponent, GeometryComponent, KinematicsComponent] },
    attractors: { components: [AttractorComponent, GeometryComponent] }
};

// // SpigotSystem
// export class SpigotSystem extends System {
//     execute(delta) {
//         let entities = this.queries.entities.results;
//         for (let entity of entities) {
//         //     let kinematics = entity.getMutableComponent(KinematicsComponent)
//         }
//     }
// }
// SpigotSystem.queries = {
//     entities: { components: [GeometryComponent, SpigotComponent] },
// };


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
    entities: { components: [GeometryComponent, Not(ExciterComponent), Not(OrbiterComponent)] },
    // context: {}
};

// MIDI Systems ================================================================

// MidiOutSystem
export class MidiOutSystem extends System {
    execute(delta) {
        if (!WebMidi.enabled) {
            return
        }

        if (this.queries.context.changed.length > 0) {
            let midiContext = this.queries.context.results[0].getComponent(MidiContextComponent)
            console.log(midiContext.output)
            this.midiOut = WebMidi.getOutputByName(midiContext.output);
            this.channel = midiContext.outputChannel
        }

        if (this.midiOut) {
            let resonatorEntities = this.queries.resonators.changed;
            for (let resonatorEntity of resonatorEntities) {
                let resonator = resonatorEntity.getComponent(ResonatorComponent)
                if (resonator.isSolid) {
                    if (resonator.isExcited) {
                        // Note: Could make channel a property of ResonatorComponent
                        this.midiOut.channels[this.channel].playNote(
                            resonator.note.value,
                            { duration: resonator.durationMillis, attack: resonator.resonationStrength });
                    }
                } else { // Resonator is not solid
                    if (resonator.isExcited) {
                        // console.log("sending note on")
                        this.midiOut.channels[this.channel].sendNoteOn(
                            resonator.note.value, { attack: resonator.resonationStrength });
                    } else {
                        // console.log("sending note off")
                        this.midiOut.channels[this.channel].sendNoteOff(
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


// Synth Engine Systems ========================================================
export class SynthSystem extends System {
    init() {
        this.reverb = new p5.Reverb()
        this.oscillators = []
        this.envelopes = []
        this.audioContextStarted = false
    }

    execute(delta) {
        let resonatorEntities = this.queries.resonators.results; // use changed instead of results
        for (let i = 0; i < resonatorEntities.length; i++) {
            let resonator = resonatorEntities[i].getComponent(ResonatorComponent)

            if (!this.oscillators[i]) {
                this.envelopes[i] = new p5.Envelope()

                this.oscillators[i] = new p5.Oscillator()
                this.oscillators[i].setType('triangle')

                this.oscillators[i].amp(this.envelopes[i], 0)

                // this.oscillators[i].start()
                this.reverb.process(this.oscillators[i])
            }

            this.oscillators[i].freq(midiToFreq(resonator.note.value))

            if (resonator.isSolid) {
                if (resonator.isExcited) {
                    // this.midiOut.channels[1].playNote(
                    //     resonator.note.value,
                    //     { duration: resonator.durationMillis, attack: resonator.resonationStrength });
                    // this.oscillators[i].freq(midiToFreq(resonator.note.value + 12))
                    this.oscillators[i].amp(this.envelopes[i], 0)
                    this.envelopes[i].setADSR(0.2 * max(0, 0.9 - resonator.resonationStrength), 0.0, 0.1, 0.5)
                    this.envelopes[i].setRange(resonator.resonationStrength, 0)
                    this.envelopes[i].play()
                }
            } else { // Resonator is not solid
                if (resonator.isExcited) {
                    // console.log("sending note on")
                    // this.midiOut.channels[1].sendNoteOn(
                    //     resonator.note.value, { attack: resonator.resonationStrength });
                    this.oscillators[i].amp(1, 1.0)
                } else {
                    // console.log("sending note off")
                    // this.midiOut.channels[1].sendNoteOff(
                    //     resonator.note.value, { attack: resonator.resonationStrength });
                    this.oscillators[i].amp(0, 0.5)
                }
            }
        }
    }

    stop() {
        // TODO: Send note off messages, close ports etc.
    }
}
SynthSystem.queries = {
    resonators: {
        components: [ResonatorComponent],
        listen: { changed: [ResonatorComponent] }
    },
};


// Rendering Systems ===========================================================

export class P5RendererSystem extends System {
    execute(delta) {
        noStroke()
        background('Black')

        // fill(255)
        // textSize(48)
        // textFont(window.Fonts.emeritus)
        // text('DAWN', width - 200, 55)

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
        }

        resonators = this.queries.resonatorsText.results;
        for (var i = 0; i < resonators.length; i++) {
            let geo = resonators[i].getComponent(GeometryComponent);
            let res = resonators[i].getComponent(ResonatorComponent);

            fill(255 * (1 - res.resonationStrength))
            textSize(16)
            textFont(window.Fonts.dudler)
            if (geo.primitive == 'ellipse') {
                text(res.note.name, geo.pos.x - 5, geo.pos.y + 8)
            } else {
                text(res.note.name, geo.pos.x + 10, geo.pos.y + 26)
            }
        }

        // Render attractor excitation level
        let attractors = this.queries.attractors.results;
        for (let attractor of attractors) {
            let geo = attractor.getComponent(GeometryComponent)
            let att = attractor.getComponent(AttractorComponent)
            let res = att.resonators

            // noFill()
            // strokeWeight(1)
            // stroke(255)
            // ellipse(geo.pos.x, geo.pos.y, 80, 80)
            // ellipse(geo.pos.x, geo.pos.y, 2 * att.resonationRadius, 2 * att.resonationRadius)

            for (let i = 1; i < res.length; i++) {
                if (res[i].getComponent(ResonatorComponent).isExcited) {
                    let radius = 80 + i * 10
                    noFill()
                    strokeWeight(1)
                    stroke(255)
                    ellipse(geo.pos.x, geo.pos.y, radius, radius)
                }
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
    resonatorsText: { components: [RenderableComponent, TextRenderableComponent, GeometryComponent, ResonatorComponent] },
    attractors: { components: [AttractorComponent, GeometryComponent] },
    context: { components: [WorldStateContextComponent] }
};