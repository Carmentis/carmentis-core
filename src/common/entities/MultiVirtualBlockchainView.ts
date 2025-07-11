import {AbstractMicroBlock} from "./MicroBlock";
import {Hash} from "../blockchain/types";
import {AbstractVirtualBlockchainView} from "./VirtualBlockchainView";

export class MultiVirtualBlockchainView {
    private states = new Map<Uint8Array, AbstractVirtualBlockchainView<AbstractMicroBlock>>();

    private constructor() {
    }

    static createEmptyView(): MultiVirtualBlockchainView {
        return new MultiVirtualBlockchainView();
    }

    addView(vbId: Hash, view: AbstractVirtualBlockchainView<AbstractMicroBlock>) {
        const vbIdBytes = vbId.toBytes();
        if (this.states.has(vbIdBytes)) {
            const currentView = this.states.get(vbIdBytes);
            if (currentView === undefined) throw new Error("View is registered but is undefined")
            currentView.updateView(view);
        } else {
            this.states.set(vbIdBytes, view);
        }
    }

    getView<T extends AbstractMicroBlock>(vbId: Hash): AbstractVirtualBlockchainView<T> {
        return this.states.get(vbId.toBytes()) as AbstractVirtualBlockchainView<T>;
    }

    getMicroBlock<T extends AbstractMicroBlock>(vbId: Hash, height: number): T {
        const view = this.getView(vbId);
        return view.getMicroBlockAtHeigh(height) as T;
    }

    containsMicroBlockAtHeight(vbId: Hash, height: number) {
        return this.states.has(vbId.toBytes()) && this.getView(vbId).containsMicroBlockAtHeight(height);
    }
}