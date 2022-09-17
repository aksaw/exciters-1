import { MidiOutSystem, P5RendererSystem } from './scripts/systems.js';
import { MidiContextComponent } from './scripts/components.js';
import { createWorld as createAttractorsWorld } from './attractors2.js'
// import { createWorld as createAttractorsWorld } from './attractors.js'
import { createWorld as createExcitersWorld } from './exciters.js'

let worlds, world;
let lastTime, currTime, delta;

let paused = true;

window.Fonts = {}
window.preload = function () {
    window.Fonts.dudler = loadFont('assets/Dudler-Regular.woff');
    window.Fonts.emeritus = loadFont('assets/Emeritus-Display.woff');
}

window.setup = function () {
    createCanvas(windowWidth, windowHeight)

    WebMidi
        .enable()
        .then(onMidiEnabled)
        .catch(err => alert(err));

    let excitersWorld = createExcitersWorld()
    excitersWorld.stop()

    let attractorsWorld = createAttractorsWorld()
    attractorsWorld.stop()

    worlds = {
        attractors: attractorsWorld,
        exciters: excitersWorld,
    }

    world = worlds.attractors
    // world = worlds.exciters
    world.play()

    // worlds.attractors.worldContext.getMutableComponent(MidiContextComponent).output = "loopMIDI Port 1"

    lastTime = performance.now();
    world.execute(0);
}

window.draw = function () {
    if (!paused) {
        currTime = performance.now();
        delta = currTime - lastTime;
        lastTime = currTime;
        world.execute(delta);
        // worlds.attractors.execute(delta);
        // worlds.exciters.execute(delta);
    }
}

// MIDI ========================================================================

function onMidiEnabled() {
    console.log("WebMidi enabled!")

    // Inputs
    console.log("Input MIDI ports:")
    WebMidi.inputs.forEach(input => console.log(input.manufacturer, input.name));

    // Outputs
    console.log("Output MIDI ports:")
    let midiOutSelect = document.getElementById('midiout-select');
    for (let output of WebMidi.outputs) {
        let opt = document.createElement('option');
        opt.value = output.name;
        opt.innerHTML = output.name;
        midiOutSelect.appendChild(opt);
    }
}

// Browser Events ==============================================================
// TODO: Events should be handled by dedicated systems that process an
// event queue either maintained by the system or is in a global context. These
// event queues can be populated by the appropriate event handlers here.
// This would make sure all application logic (eg. create an entity) lies in
// the respective systems. 
// eg. mouseClicked event handler can set a "mouseClicked" variable in a global
// context component, which then gets handled by a system 

window.mouseClicked = function () {
    if (paused) {
        paused = false
    }
    if (world) {
        world.mouseClicked()
    }
}

window.mouseDragged = function () {
    if (world) {
        world.mouseDragged()
    }
}

window.mousePressed = function () {
    if (world) {
        world.mousePressed()
    }
}

window.windowResized = function () {
    resizeCanvas(windowWidth, windowHeight)
    worlds.attractors.getSystem(ResizeSystem).execute()
    worlds.exciters.getSystem(ResizeSystem).execute()
}

// UI Events ===================================================================

document.getElementById('worlds').onchange = function () {
    // world.getSystem(MidiOutSystem).notesOff()
    // world.stop()
    world.getSystem(P5RendererSystem).stop()
    if (this.value == 'attractors')
        world = worlds.attractors
    if (this.value == 'exciters')
        world = worlds.exciters
    world.getSystem(P5RendererSystem).play()
    // world.play()
};

document.getElementById('midiout-select').onchange = function () {
    worlds.attractors.worldContext.getMutableComponent(MidiContextComponent).output = this.value
    worlds.exciters.worldContext.getMutableComponent(MidiContextComponent).output = this.value
};