import { Note } from './types.js';

// TODO: create YAML for note name-value database
export var notes = [
	new Note('A#', 46),
    new Note('F', 53),
    new Note('A', 57),
    new Note('A#', 58),
    new Note('D', 62),
    new Note('A', 45),
    new Note('E', 52),
    new Note('G', 55),
    new Note('A', 57),
    new Note('C#', 61),
]

// TODO: create library to algorithmically generate
// musical objects like chords and scales
export var chord_d_minor = [
    new Note('D', 62),
    new Note('F', 65),
    new Note('A', 69),
    new Note('C', 72),
    new Note('E', 76),
]

export var chord_e_minor = [
    new Note('E', 64),
    new Note('G', 67),
    new Note('A#', 70),
    new Note('D', 74),
    new Note('F', 77),
]