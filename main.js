import { World, System } from './node_modules/ecsy/build/ecsy.module.min.js';
import {
	GeometryComponent, CurveComponent, LifetimeComponent, ExciterComponent,
	ResonatorComponent, KinematicsComponent, MidiContextComponent, HistoryComponent,
	RenderableComponent, WorldStateContextComponent
} from './scripts/components.js';
import {
	KinematicsSystem, LifetimeSystem, P5RendererSystem, ExciterResonatorSystem,
	ResizeSystem, MidiOutSystem, LoopSystem
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
		.registerComponent(HistoryComponent)
		.registerComponent(MidiContextComponent)
		.registerComponent(RenderableComponent)
		.registerComponent(WorldStateContextComponent)

	// Register systems
	world
		.registerSystem(P5RendererSystem)
		.registerSystem(LifetimeSystem)
		.registerSystem(KinematicsSystem)
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
			.addComponent(RenderableComponent);
	}

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
		createExciterEntity(mouseX, mouseY, 10, 'ellipse')
	worldContext.getMutableComponent(WorldStateContextComponent).loopMode = false
}

window.mouseDragged = function () {
	if (!worldContext.getMutableComponent(WorldStateContextComponent).loopMode) {
		if (!trailEntity || !trailEntity.alive) {
			trailEntity = createTrailEntity()
		}

		if (mouseX < windowWidth && mouseY < windowHeight) {
			trailEntity.getMutableComponent(CurveComponent).vertices.push(new Vec2(mouseX, mouseY))
			trailEntity.getMutableComponent(LifetimeComponent).percentage = 100

			if (mouseX % 5 == 0) {
				createExciterEntity(mouseX, mouseY, 10, 'ellipse')
			}
		}
	}
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
		.addComponent(LifetimeComponent)
		.addComponent(ExciterComponent)
		.addComponent(RenderableComponent)
		.addComponent(HistoryComponent, {
			length: 120
		})
}