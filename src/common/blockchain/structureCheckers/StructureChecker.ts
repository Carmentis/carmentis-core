import { SECTIONS } from "../../constants/constants";
import {Microblock} from "../microblock/Microblock";

export class StructureChecker {
  microblock: Microblock;
  pointer: any;
  constructor(microblock: Microblock) {
    this.microblock = microblock;
    this.pointer = 0;
  }

  isFirstBlock() {
    return this.microblock.getHeight() == 1;
  }

  expects(constraint: any, type: any) {
    let count = 0;

    while(!this.endOfList() && this.currentSection().type == type) {
      count++;
      this.pointer++;
    }

    if(!this.checkConstraint(constraint, count)) {
      throw `expected ${SECTIONS.CONSTRAINT_NAMES[constraint]} of type ${this.getTypeLabel(type)}, got ${count}`;
    }
  }

  group(groupConstraint: any, list: any) {
    const counts = new Map;
    let groupCount = 0;

    for(const [ constraint, type ] of list) {
      counts.set(type, 0);
    }

    while(!this.endOfList()) {
      const currentType = this.currentSection().type;

      // @ts-expect-error TS(7031): Binding element 'count' implicitly has an 'any' ty... Remove this comment to see the full error message
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
    return this.microblock.getAllSections()[this.pointer];
  }

  endOfList() {
    return !this.currentSection();
  }

  checkConstraint(constraint: number, count: any) {
    switch(constraint) {
      case SECTIONS.ANY         : { return true; }
      case SECTIONS.ZERO        : { return count == 0; }
      case SECTIONS.ONE         : { return count == 1; }
      case SECTIONS.AT_LEAST_ONE: { return count >= 1; }
      case SECTIONS.AT_MOST_ONE : { return count <= 1; }
    }
    return false;
  }

  getTypeLabel(type: any) {
    const section = SECTIONS.DEF[this.microblock.getType()][type];
    return section ? section.label : "unknown";
  }
}
