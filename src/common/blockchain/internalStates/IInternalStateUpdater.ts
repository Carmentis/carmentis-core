import {Microblock} from "../microblock/Microblock";
import {ApplicationLedgerInternalState} from "./ApplicationLedgerInternalState";
import {Section} from "../../type/valibot/blockchain/section/sections";

export interface IInternalStateUpdater<T> {
    updateState(prevState: T, microblock: Microblock): T | Promise<T>;
}

export interface IApplicationLedgerInternalStateUpdater extends IInternalStateUpdater<ApplicationLedgerInternalState> {
    updateStateFromSection(prevState: ApplicationLedgerInternalState, section: Section, mbHeight: number): Promise<ApplicationLedgerInternalState>;
}