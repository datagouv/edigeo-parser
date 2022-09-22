import { first, last, tail } from 'lodash-es';
import { booleanClockwise } from '@turf/turf';
import debugFactory from 'debug';
const debug = debugFactory('edigeo-parser');
import { positionIsEqual, getArcPosition, pathIsClosed } from './util.js';

class Ring {
  constructor(face) {
    this.relatedFace = face
    this.coordinates = []
    this.mode = face.topologyMode
  }

  isClosed(maxDistance = 0) {
    return pathIsClosed(this.coordinates, maxDistance)
  }

  pushFirstArc(arc) {
    this.relativePosition = getArcPosition(arc, this.relatedFace)
    this.coordinates = [...arc.coordinates]
  }

  pushArc(arc, reverse = false) {
    const arcRelativePosition = getArcPosition(arc, this.relatedFace)
    const coordinates = [...arc.coordinates]
    if ((!reverse && (arcRelativePosition !== this.relativePosition)) || (reverse && (arcRelativePosition === this.relativePosition))) {
      coordinates.reverse()
    }

    this.coordinates = this.coordinates.concat(tail(coordinates))
  }

  getLastNode() {
    if (this.coordinates.length === 0) {
      throw new Error('Unable to get the last node from an empty ring')
    }

    return last(this.coordinates)
  }

  isConnectable(arc, maxDistance = 0, reverse = false) {
    const arcRelativePosition = getArcPosition(arc, this.relatedFace)
    const nodeToCompare =
      (!reverse && (arcRelativePosition === this.relativePosition)) || (reverse && (arcRelativePosition !== this.relativePosition)) ?
        first(arc.coordinates) :
        last(arc.coordinates)
    return positionIsEqual(nodeToCompare, this.getLastNode(), maxDistance)
  }

  forceClose() {
    debug('force closed ring')
    this.coordinates[this.coordinates.length - 1] = this.coordinates[0]
  }

  toObject() {
    // SPA
    if (this.mode === 'SPA') {
      return {coordinates: this.coordinates}
    }

    // TOP
    const clockwise = booleanClockwise(this.coordinates)
    const isExterior = (booleanClockwise && this.relativePosition === 'right') ||
      (!clockwise && this.relativePosition === 'left')

    return {
      isExterior,
      coordinates: this.coordinates
    }
  }
}

export default Ring;
