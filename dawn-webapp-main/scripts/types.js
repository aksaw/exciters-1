import { createType, copyCopyable, cloneClonable } from '../node_modules/ecsy/build/ecsy.module.min.js';

// 2D Vector Type
export class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(source) {
    this.x = source.x;
    this.y = source.y;
    return this;
  }

  clone() {
    return new Vec2().set(this.x, this.y);
  }

  add(other) {
    this.x += other.x
    this.y += other.y
  }
}

export const Vec2Type = createType({
  name: "Vec2",
  default: new Vec2(),
  copy: copyCopyable,
  clone: cloneClonable
});

// Note Type
export class Note {
  constructor(name = 0, value = 0) {
    this.name = name;
    this.value = value;
  }

  set(name, value) {
    this.name = name;
    this.value = value;
    return this;
  }

  copy(source) {
    this.name = source.name;
    this.value = source.value;
    return this;
  }

  clone() {
    return new Note().set(this.name, this.value);
  }

}

export const NoteType = createType({
  name: "Note",
  default: new Note(),
  copy: copyCopyable,
  clone: cloneClonable
});