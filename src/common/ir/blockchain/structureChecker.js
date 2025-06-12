import { SECTIONS } from "../constants/constants.js";

export class StructureChecker {
  constructor(microblock) {
    this.microblock = microblock;
    this.pointer = 0;
  }

  isFirstBlock() {
    return this.microblock.header.height == 1;
  }

  expects(constraint, type) {
    let count = 0;

    while(!this.endOfList() && this.currentSection().type == type) {
      count++;
      this.pointer++;
    }

    if(!this.checkConstraint(constraint, count)) {
      throw `expected ${SECTIONS.CONSTRAINT_NAMES[constraint]} of type ${this.getTypeLabel(type)}, got ${count}`;
    }
  }

  group(groupConstraint, list) {
    const counts = new Map;
    let groupCount = 0;

    for(const [ constraint, type ] of list) {
      counts.set(type, 0);
    }

    while(!this.endOfList()) {
      const currentType = this.currentSection().type;

      if(!list.some(([ count, type ]) => type == currentType)) {
        break;
      }
      counts.set(currentType, counts.get(currentType) + 1);
      groupCount++;
      this.pointer++;
    }

    if(!this.checkConstraint(groupConstraint, groupCount)) {
      throw `expected ${SECTIONS.CONSTRAINT_NAMES[groupConstraint]} in group, got ${groupCount}`;
    }

    for(const [ constraint, type ] of list) {
      const count = counts.get(type);

      if(!this.checkConstraint(constraint, count)) {
        throw `expected ${SECTIONS.CONSTRAINT_NAMES[constraint]} of type ${this.getTypeLabel(type)}, got ${count}`;
      }
    }
  }

  endsHere() {
    if(!this.endOfList()) {
      throw `unexpected section ${this.getTypeLabel(this.currentSection())}`;
    }
  }

  currentSection() {
    return this.microblock.sections[this.pointer];
  }

  endOfList() {
    return !this.currentSection();
  }

  checkConstraint(constraint, count) {
    switch(constraint) {
      case SECTIONS.ANY         : { return true; }
      case SECTIONS.ONE         : { return count == 1; }
      case SECTIONS.AT_LEAST_ONE: { return count >= 1; }
      case SECTIONS.AT_MOST_ONE : { return count <= 1; }
    }
  }

  getTypeLabel(type) {
    const section = SECTIONS.DEF[this.microblock.type][type];
    return section ? section.label : "unknown";
  }
}
