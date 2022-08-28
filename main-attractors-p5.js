import { World, System } from './node_modules/ecsy/build/ecsy.module.min.js';
import {
	GeometryComponent, CurveComponent, LifetimeComponent, ExciterComponent,
	ResonatorComponent, KinematicsComponent, MidiContextComponent, HistoryComponent,
	RenderableComponent, WorldStateContextComponent, OrbiterComponent, AttractorComponent
} from './scripts/components.js';
import {
	KinematicsSystem, LifetimeSystem, P5RendererSystem, ExciterResonatorSystem,
	ResizeSystem, MidiOutSystem, LoopSystem, OrbiterAttractorSystem
} from './scripts/systems.js';
import { Vec2 } from './scripts/types.js';
import { notes } from './scripts/midi.js';

let world, worldContext;
let lastTime, currTime, delta;

let trailEntity;

window.Fonts = {}
window.preload = function () {
	window.Fonts.dudler = loadFont('assets/Dudler-Regular.woff');
	window.Fonts.emeritus = loadFont('assets/Emeritus-Display.woff');
}

window.setup = function () {
	createCanvas(windowWidth, windowHeight)

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
		.registerComponent(OrbiterComponent)
		.registerComponent(HistoryComponent)
		.registerComponent(MidiContextComponent)
		.registerComponent(RenderableComponent)
		.registerComponent(WorldStateContextComponent)

	// Register systems
	world
		.registerSystem(P5RendererSystem)
		.registerSystem(LifetimeSystem)
		.registerSystem(KinematicsSystem)
		.registerSystem(MidiOutSystem)
		.registerSystem(ResizeSystem)
		.registerSystem(LoopSystem)
		.registerSystem(ExciterResonatorSystem)
		.registerSystem(OrbiterAttractorSystem)

	// Stop systems that do not need to run continuously
	world.getSystem(ResizeSystem).stop()

	// Create global context singleton entity
	worldContext = world.createEntity()
		.addComponent(MidiContextComponent, {
			output: 'loopMIDI Port 1'
		})
		.addComponent(WorldStateContextComponent)
	// TODO: Create some kind of InputSystem or UISystem that populates context based on menu settings?

	// Create resonator entities
	let resonators = []
	for (let i = 0; i < 3; i++) {
		resonators.push(
			world.createEntity()
				.addComponent(GeometryComponent, {
					primitive: 'ellipse',
					width: 60,
					height: 60,
					pos: new Vec2((window.width / 2), (window.height / 2))
				})
				.addComponent(ResonatorComponent, {
					isSolid: false,
					note: notes[i]
				})
				.addComponent(AttractorComponent, {
					orbitThreshold: 250
				})
		)
	}
	resonators[0].addComponent(RenderableComponent)
	world.createEntity()
		.addComponent(GeometryComponent, {
			primitive: 'ellipse',
			width: 0,
			height: 0,
			pos: new Vec2((window.width / 2), (window.height / 2))
		})
		.addComponent(AttractorComponent, {
			orbitThreshold: 250,
			resonators: resonators
		})

	lastTime = performance.now();
}

window.draw = function () {
	currTime = performance.now();
	delta = currTime - lastTime;
	lastTime = currTime;
	world.execute(delta);
}

// Browser Events ==============================================================
// TODO: Perhaps events could be handled by dedicated systems that process an
// event queue either maintained by the system or is in a global context. These
// event queues can be populated by the appropriate event handlers here.
// This would make sure all application logic (eg. create an entity) lies in
// the respective systems. 
// eg. mouseClicked event handler can set a "mouseClicked" variable in a global
// context component, which then gets handled by a system 

window.mouseClicked = function () {
	if (!worldContext.getMutableComponent(WorldStateContextComponent).loopMode)
		createOrbiterEntity(mouseX, mouseY, 10, 'ellipse')
	worldContext.getMutableComponent(WorldStateContextComponent).loopMode = false
}

window.mouseDragged = function () {
}

window.mousePressed = function () {
	trailEntity = createTrailEntity()

	worldContext.getMutableComponent(WorldStateContextComponent).clickX = mouseX
	worldContext.getMutableComponent(WorldStateContextComponent).clickY = mouseY
	worldContext.getMutableComponent(WorldStateContextComponent).mousePressedDuration = 0
}

window.windowResized = function () {
	resizeCanvas(windowWidth, windowHeight)
	if (world)
		world.getSystem(ResizeSystem).execute()
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
			vel: new Vec2(5 * Math.random(), 5 * Math.random())
		})
		.addComponent(LifetimeComponent, {
			decayRate: 0.2
		})
		.addComponent(RenderableComponent)
		.addComponent(HistoryComponent, {
			length: 120
		})
		.addComponent(ExciterComponent)
		.addComponent(OrbiterComponent)
}