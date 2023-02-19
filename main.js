import { ResizeSystem, SynthSystem } from './scripts/systems.js';
import { MidiContextComponent, WorldStateContextComponent } from './scripts/components.js';
import { createWorld as createAttractorsWorld } from './attractors.js'
import { createWorld as createExcitersWorld } from './exciters.js'
import { createWorld as createBarcodeWorld } from './barcode.js'

let worlds, world;
let lastTime, currTime, delta;

window.Fonts = {}
window.preload = function () {
    window.Fonts.dudler = loadFont('assets/Dudler-Regular.woff');
    // window.Fonts.emeritus = loadFont('assets/Emeritus-Display.woff');
}

window.setup = function () {
    canvas = createCanvas(windowWidth, windowHeight)
    canvas.parent('canvas-div');

    WebMidi
        .enable()
        .then(onMidiEnabled)
        // .catch(err => alert(err));

    let excitersWorld = createExcitersWorld()
    excitersWorld.stop()

    let attractorsWorld = createAttractorsWorld()
    attractorsWorld.stop()

    let barcodeWorld = createBarcodeWorld()
    barcodeWorld.stop()

    worlds = {
        attractors: attractorsWorld,
        exciters: excitersWorld,
        barcode: barcodeWorld,
    }

    world = worlds.exciters
    world.play()

    worlds.exciters.worldContext.getMutableComponent(MidiContextComponent).output = 'Bus 1'
    worlds.exciters.worldContext.getMutableComponent(MidiContextComponent).outputChannel = 1
    worlds.attractors.worldContext.getMutableComponent(MidiContextComponent).output = 'Bus 1'
    worlds.attractors.worldContext.getMutableComponent(MidiContextComponent).outputChannel = 2
    worlds.barcode.worldContext.getMutableComponent(MidiContextComponent).output = 'Bus 1'
    worlds.barcode.worldContext.getMutableComponent(MidiContextComponent).outputChannel = 3

    lastTime = performance.now();
}

window.draw = function () {
    currTime = performance.now();
    delta = currTime - lastTime;
    lastTime = currTime;
    world.execute(delta);
}

window.keyPressed = function () {

    if (key == 1) {
        console.log('One');
        const currentlyActive = document.getElementsByClassName('active')[0];
        const exciters = document.getElementsByClassName('Exciters')[0];

        currentlyActive.classList.remove('active');
        exciters.classList.add('active');

        world.stop();
        world = worlds.exciters;
        world.play();
    } else if (key == 2) {
        console.log('Two');
        const currentlyActive = document.getElementsByClassName('active')[0];
        const attractors = document.getElementsByClassName('Attractors')[0];

        currentlyActive.classList.remove('active');
        attractors.classList.add('active');

        world.stop();
        world = worlds.attractors;
        world.play();
    } else if (key == 3) {
        console.log('Three');
        const currentlyActive = document.getElementsByClassName('active')[0];
        const barcode = document.getElementsByClassName('Barcode')[0];

        currentlyActive.classList.remove('active');
        barcode.classList.add('active');

        world.stop();
        world = worlds.barcode;
        world.play();
    }
}

// Go on sketch when user clicks on associated button

const excitersButton = document.getElementsByClassName('Exciters')[0];

excitersButton.addEventListener('click',(event) => {
    const currentlyActive = document.getElementsByClassName('active')[0];

    currentlyActive.classList.remove('active');
    excitersButton.classList.add('active');

    world.stop();
    world = worlds.exciters;
    world.play();
});

const attractorsButton = document.getElementsByClassName('Attractors')[0];

attractorsButton.addEventListener('click',(event) => {
    const currentlyActive = document.getElementsByClassName('active')[0];

    currentlyActive.classList.remove('active');
    attractorsButton.classList.add('active');

    world.stop();
    world = worlds.attractors;
    world.play();
});

const barcodeButton = document.getElementsByClassName('Barcode')[0];

barcodeButton.addEventListener('click',(event) => {
    const currentlyActive = document.getElementsByClassName('active')[0];

    currentlyActive.classList.remove('active');
    barcodeButton.classList.add('active');

    world.stop();
    world = worlds.barcode;
    world.play();
});

// Turn canvas off when you hover over button

const worldSelector = document.getElementsByClassName('world-selector')[0];
const midiSelector = document.getElementById('midiout-select');
const tooltip = document.getElementById('tooltip');

worldSelector.addEventListener("mouseover", mouseOverSelector, false);
worldSelector.addEventListener("mouseout", mouseOutSelector, false);

midiSelector.addEventListener("mouseover", mouseOverSelector, false);
midiSelector.addEventListener("mouseout", mouseOutSelector, false);

tooltip.addEventListener("mouseover", mouseOverSelector, false);
tooltip.addEventListener("mouseout", mouseOutSelector, false);


function mouseOverSelector() {  
    worlds.attractors.worldContext.getMutableComponent(WorldStateContextComponent).canvasActive = false
    worlds.exciters.worldContext.getMutableComponent(WorldStateContextComponent).canvasActive = false
    worlds.barcode.worldContext.getMutableComponent(WorldStateContextComponent).canvasActive = false
}

function mouseOutSelector() {
    worlds.attractors.worldContext.getMutableComponent(WorldStateContextComponent).canvasActive = true
    worlds.exciters.worldContext.getMutableComponent(WorldStateContextComponent).canvasActive = true
    worlds.barcode.worldContext.getMutableComponent(WorldStateContextComponent).canvasActive = true
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
    if (world) {
        world.mouseClicked()
    }

    // let synthSystem = world.getSystem(SynthSystem)
    // if (!synthSystem.audioContextStarted) {
    //     userStartAudio();
    //     synthSystem.audioContextStarted = true
    //     for (let osc of synthSystem.oscillators) {
    //         osc.start()
    //     }
    //     console.log(synthSystem.oscillators)
    // }
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
    if (world) {
        world.getSystem(ResizeSystem).execute()
    }
}

// UI Events ===================================================================

document.getElementById('worlds').onchange = function () {
    world.stop()
    if (this.value == 'attractors')
        world = worlds.attractors
    if (this.value == 'exciters')
        world = worlds.exciters
    if (this.value == 'barcode')
        world = worlds.barcode
    world.play()
};

document.getElementById('midiout-select').onchange = function () {
    if (this.value != '') {
        mixpanel.track('midiout-select');
        worlds.attractors.worldContext.getMutableComponent(MidiContextComponent).output = this.value
        worlds.exciters.worldContext.getMutableComponent(MidiContextComponent).output = this.value
        worlds.barcode.worldContext.getMutableComponent(MidiContextComponent).output = this.value
    }
};

document.getElementById('tooltip').onclick= function () {
    mixpanel.track('tooltip-click');
};