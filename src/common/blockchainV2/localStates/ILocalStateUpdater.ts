import {Microblock} from "../../blockchain/Microblock";

export interface ILocalStateUpdater<T> {
    updateState(prevState: T, microblock: Microblock): T;
}