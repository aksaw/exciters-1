// let brushStrokes
// let numPoints = 20;
let MIDI_MODE = false

let WAVE_CHAIN_MODE = true

//Fonts
let dudler, emeritus;

let points = []
let exciters = []
let floorTiles = []
let trailLifetime = 400
let excLifetime = 800
// let notes = {'D': 120, 'E': 120, 'F': 120, 'G': 120, 'A': 120, 'A#': 120, 'C'}

let oscillators = []
let audioContextStarted = false

let midiOut = null

let notes = [
	{
		noteName: 'A#',
		val: 46
	},
	{
		noteName: 'F',
		val: 53
	},
	{
		noteName: 'A',
		val: 57
	},
	{
		noteName: 'A#',
		val: 58
	},
	{
		noteName: 'D',
		val: 62
	},
	{
		noteName: 'A',
		val: 45
	},
	{
		noteName: 'E',
		val: 52
	},
	{
		noteName: 'G',
		val: 55
	},
	{
		noteName: 'A',
		val: 57
	},
	{
		noteName: 'C#',
		val: 61
	}
]

let hold_button = null
let hold = false
let exciter_history = createRingBuffer(120);

function createRingBuffer (length) {
  var pointer = 0, buffer = []; 
  return {
    get  : function(){
		return buffer[pointer];
	},
    push : function(item){
      	buffer[pointer] = item;
      	// pointer = (length + pointer +1) % length;
      	pointer = (pointer +1) % length;
    },
	inc : function(item){
      	// pointer = (length + pointer +1) % length;
      	pointer = (pointer +1) % length;
	},
	get_trail: function(trailLength=null){
		if (!trailLength) {
			trailLength = buffer.length / 4
		}
	 	return buffer.slice((pointer - trailLength) % length, pointer)
	},
	get_buffer: function(){
		return buffer
	},
	log_buffer : function(){
		console.log(buffer)
	}
  };
};

function preload() {
	dudler = loadFont('assets/Dudler-Regular.woff');
	emeritus = loadFont('assets/Emeritus-Display.woff');
  }

function setup() {
	let cnv = createCanvas(windowWidth, windowHeight)

	let reverb = null
	if (MIDI_MODE) {
		WebMidi
			.enable()
			.then(onMidiEnabled)
 		 	.catch(err => alert(err));
	} else {
		reverb = new p5.Reverb()
	}

	// for (let i = 0; i < 100; i++) {
	// 	exciters.push(new Exciter(width/2, height/2))
	// }
	
	// brushStrokes = []

	// for (let i = 0; i < numPoints; i++) {
	// 	let point = createVector(width/2, height/2)
	// 	points.push(point)

	// 	console.log(point)
	// }

	for (let i=0; i < notes.length; i++) {
		floorTiles.push(new FloorTile(0 + (width/notes.length * i), notes[i], reverb))
	}

	hold_button = createButton("HOLD");
    hold_button.mouseClicked(holdToggle);
    hold_button.position(10, 10);
	hold_button.style('font-size', '24px');
	hold_button.style('color', '#000000');
	hold_button.style('background-color', '#ffffff');
	hold_button.style('font-family', 'Dudler-Regular')
}

function draw() {

	background('Black')
	fill(255)
	textSize(48)
	textFont(emeritus)
	text('Exciters', width - 200, 55)

	// brushStrokes.forEach(brushStroke => {
	// 	brushStroke.draw()
	// })

	// if (mouseX !== pmouseX && mouseY !== pmouseY) {
	// 	points.shift()

	// 	let point = createVector(mouseX, mouseY)
	// 	points.push(point)
	// }

	// console.log(points);

	// stroke(255)

	// Trail
	// console.log(trailLifetime)
	trailLifetime -= 1
	// fill(trailLifetime)
	stroke(trailLifetime)
	strokeWeight(2)
	strokeJoin(ROUND)
	noFill()
	beginShape()
	for (let i=0; i<points.length; i++) {
		let pt = points[i]
		curveVertex(pt.x, pt.y)
	}
	endShape()

	// Exciters
	if (!hold) {
		for (let exciter of exciters) {
			gravity = createVector(0, 0.5)
			exciter.applyForce(gravity)
			exciter.update()
			exciter.edges()
			exciter.show()	
		}

		for (let i = exciters.length-1; i >=0; i--) {
			if (exciters[i].finished()) {
				exciters.splice(i, 1)
			}
		}

		// TODO: implement a more efficient way to store history
		exciters_deep_copy = []
		for (let exciter of exciters) {
			exciter_copy = {}
			exciter_copy.pos = exciter.pos.copy()
			exciter_copy.vel = exciter.vel.copy()
			exciter_copy.acc = exciter.acc.copy()
			exciter_copy.lifetime = exciter.lifetime
			exciter_copy.show = exciter.show
			exciter_copy.finished = exciter.finished
			exciter_copy.applyForce = exciter.applyForce
			exciter_copy.edges = exciter.edges
			exciter_copy.update = exciter.update
			exciters_deep_copy.push(exciter_copy)
		}
		exciter_history.push(exciters_deep_copy)
		// exciter_history.push(structuredClone(exciters))
	} else {
		// Draw exciter history 
		exciter_frames = exciter_history.get_trail()
		// exciter_frames = exciter_history.get_buffer()
		for(let exciter_frame of exciter_frames) {
			for (let exciter of exciter_frame) {
				exciter.show(true)
			}
		}
		// Draw current exciter
		exciters = exciter_history.get()
		// console.log(exciters)
		for (let exciter of exciters) {
			exciter.show()	
		}
		exciter_history.inc()
	}

	// Floor tiles
	for (let floorTile in floorTiles) {
		floorTiles[floorTile].show()
	}

	// Check for intersections
	for (let exciter in exciters) {
		for (let floorTile in floorTiles) {
			floorTiles[floorTile].intersects(exciters[exciter])
		}
	}

}

function mouseClicked() {
	if (!MIDI_MODE) {
		if (!audioContextStarted) {
			userStartAudio();
			audioContextStarted = true
			for (osc of oscillators) {
				osc.start()
			}
		}
	}

	exciters.push(new Exciter(mouseX, mouseY, excLifetime))
}

function mouseDragged() {
	// brushStrokes.push(new BrushStroke(mouseX, mouseY))

	trailLifetime = 400

	if (mouseX < windowWidth && mouseY < windowHeight) {
		let point = createVector(mouseX, mouseY)
		points.push(point)

		if (mouseX % 2 == 0) {
			exciters.push(new Exciter(mouseX, mouseY, excLifetime))
		}
	}

	// Causes exciters to fall in a cool, circular pattern
	// for (const point in points) {
	// 	if (mouseX % 10 == 0) {	
	// 		exciters.push(new Exciter(mouseX, mouseY, excLifetime))
	// 	}
	// }

	// console.log(points.length, exciters.length)
}

function mousePressed() {
	if (mouseX < window.width && mouseY < window.height) {
		points = []
	}
}

class Exciter {
	constructor(x, y, lifetime) {
		this.pos = createVector(x, y)
		if (WAVE_CHAIN_MODE) {
			this.vel = createVector(0, 0) 
		} else {
			this.vel = p5.Vector.random2D()
		}
		this.acc = createVector(0, 0)
		this.lifetime = lifetime
	}

	finished() {
		return (this.lifetime <= 0)
	}

	applyForce(force) {
		this.acc = force
	}

	edges() {
		if (this.pos.y >= height - 40) {
			this.pos.y = height - 40
			if (this.vel.y > 2) {
				// this.vel.x = random(5, -5)
				if (WAVE_CHAIN_MODE) {
					this.vel.x = 0
				} else {
					this.vel.x = random(-this.vel.y * 0.5, this.vel.y * 0.5)
				}
			} else {
				this.vel.x = 0
			}
			// this.vel.y *= -1.5
			this.vel.y *= -0.93
		}

		if (this.pos.x < 0 || this.pos.x > width) {
			this.vel.x *= -0.93
		} 

		// console.log(this.pos.y);
	}

	update() {
		// let mouse = createVector(mouseX, mouseY)
		// this.acc = p5.Vector.sub(mouse, this.pos)
		// this.acc.setMag(1)

		this.vel.add(this.acc)
		this.vel.limit(20)
	
		this.pos.add(this.vel)

		this.lifetime -= 1
	}

	show(held=false) {
		// fill(255)
		if (held) {
			stroke(255, 0.5 * this.lifetime);
			strokeWeight(0.1)
		} else {
			stroke(255, this.lifetime);
			strokeWeight(1)
		}
		ellipse(this.pos.x, this.pos.y, 10, 10)
	}
}

class FloorTile {
	constructor(x, note, reverb) {
		this.pos = createVector(x, window.height-40)
		this.width = window.width / notes.length
		this.height = 40
		this.fillVal = 200
		this.note = note
		this.hit = false

		if (!MIDI_MODE) {
			this.env = new p5.Envelope()
		
			this.osc = new p5.Oscillator()
			this.osc.setType('triangle')
			// this.osc.start()
			this.osc.freq(midiToFreq(this.note.val + 12))
			this.osc.amp(this.env, 0)
			oscillators.push(this.osc)

			reverb.process(this.osc)
		}

		this.playing = false
	}

	onHit(other) {
		let velocity = (other.lifetime / excLifetime)**3 // velocity is between 0 and 1

		this.fillVal = 255 * min(1, sqrt(velocity * 5))

		// console.log(velocity)
		
		if (Math.abs(other.vel.y) > 2) {
			// this.env.setADSR(random(0, 0.2), 0.0, 0.1, 0.5) // RANDOM ATTACK

			if (MIDI_MODE) {
				if (midiOut) {
					midiOut.channels[1].playNote(this.note.val, {duration: 100, attack: velocity});
				}
			} else {
				this.env.setADSR(0.2 * max(0, 0.9-velocity), 0.0, 0.1, 0.5) // GRADUAL ATTACK SLOWDOWN
				this.env.setRange(velocity, 0)
				// this.env.setRange(0.1, 0)
				this.env.play()
			}
		}
	}

	intersects(other) {
		this.hit = collideRectCircle(this.pos.x, this.pos.y, this.width, this.height, other.pos.x, other.pos.y, 10)
		// if ((this.pos.y <= other.pos.y + 10) && (this.pos.x <= other.pos.x) && (this.pos.x + this.width >= other.pos.x)) {
		// 	this.hit = true
		// } else {
		// 	this.hit = false
		// }

		if (this.hit == true) {
			// console.log(this.note)
			this.onHit(other)
		} 
	}

	show() {
		// if (this.hit == true) {
		// 	console.log(this.note)
		// } else {
		// 	console.log('Nothing is hit')
		// }
		fill(this.fillVal) //, 10, 100)
		this.fillVal *= 0.8
		noStroke()
		rect(this.pos.x, this.pos.y, this.width, this.height)
		fill(255 - this.fillVal)
		textSize(16)
		textFont((dudler))
		text(this.note.noteName, this.pos.x + 10, this.pos.y + 26)
	}

}

//   class BrushStroke {
// 	constructor(x, y) {
// 		this.x = x
// 		this.y = y
// 	}

// 	draw() {
// 		noStroke()
// 		fill('white')
// 		stroke('white')
// 		strokeWeight(2)
// 		point(this.x, this.y)
// 	}
// }

function onMidiEnabled() {
  console.log("WebMidi enabled!") 

  // Inputs
  console.log("Inputs:") 
  WebMidi.inputs.forEach(input => console.log(input.manufacturer, input.name));
  
  // Outputs
  console.log("Outputs:") 
  WebMidi.outputs.forEach(output => console.log(output.manufacturer, output.name));

  midiOut = WebMidi.getOutputByName("loopMIDI Port");
}

function holdToggle() {
	hold = !hold
	if (hold) {
		hold_button.html("RELEASE")
	} else {
		hold_button.html("HOLD")
	}
}