import {Microblock} from "../microblock/Microblock";
import {ApplicationLedgerLocalState} from "./ApplicationLedgerLocalState";
import {Section} from "../../type/Section";

export interface ILocalStateUpdater<T> {
    updateState(prevState: T, microblock: Microblock): T | Promise<T>;
}

export interface IApplicationLedgerLocalStateUpdater extends ILocalStateUpdater<ApplicationLedgerLocalState> {
    updateStateFromSection(prevState: ApplicationLedgerLocalState, section: Section, mbHeight: number): Promise<ApplicationLedgerLocalState>;
}