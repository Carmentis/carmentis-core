import {Microblock, Section} from "../../blockchain/Microblock";
import {ApplicationLedgerLocalState} from "./ApplicationLedgerLocalState";

export interface ILocalStateUpdater<T> {
    updateState(prevState: T, microblock: Microblock): T | Promise<T>;
}

export interface IApplicationLedgerLocalStateUpdater extends ILocalStateUpdater<ApplicationLedgerLocalState> {
    updateStateFromSection(prevState: ApplicationLedgerLocalState, section: Section, mbHeight: number): Promise<ApplicationLedgerLocalState>;
}