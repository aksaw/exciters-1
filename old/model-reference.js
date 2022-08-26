class Note { 
    // wrap note name, note value etc.
    // replace this with a  lighterweight abstraction
    constructor() {

    }
}

class Model {
    constructor(notes) {
        this.tiles = 
        this.exciters = 
        this.trail = 
        this.exciter_history = 
        this.observers = []
        this.hold = 
    }

    update() {

    }
    
    // The drawing methods can be decoupled into an observer view class
    draw() {
        for (tile of this.tiles) {
            tile.draw()
        }
        for (exciter of this.exciters) {
            exciter.draw()
        }
        this.trail.draw()
    }
}

class Tile {
    constructor(x, y, note) {

    }

    draw() {

    }
}

class Trail {
    constructor() {

    }

    draw() {

    }
}

class Exciter {
    constructor(x, y, lifetime=400) {
		this.pos = createVector(x, y)
		this.vel = p5.Vector.random2D()
		this.acc = createVector(0, 0)
		this.lifetime = lifetime
    }

    finished() {
        return (this.lifetime <= 0)
    }

    update() {

    }

    // Returns a deep copy of the exciter
    clone() {

    }

    draw() {

    }

}

// Moving window history of all exciters in a ring buffer
class ExciterBuffer {
    constructor(length) { // Maybe specify length in seconds and convert to frames
        this.pointer = 0
        this.buffer = []
    }

    get(){
		return buffer[pointer];
	}

    pushClone(exciters) {
        excitersCloned = []
        for (let exciter of exciters) {
            excitersCloned.push(exciter.clone())
        }
      	this.buffer[this.pointer] = excitersCloned;
      	this.pointer = (this.pointer + 1) % length;
    }

	incrementTimestep() {
      	this.pointer = (this.pointer + 1) % length;
	}

    draw(trailLength=null) { // TODO: finish implementing this
	    if (!trailLength) {
	    	trailLength = this.buffer.length / 4
	    }
	//  	return this.buffer.slice((this.pointer - trailLength) % length, this.pointer)
    }
}