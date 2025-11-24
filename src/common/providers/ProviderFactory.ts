import {Provider} from "./Provider";
import {NullNetworkProvider} from "./NullNetworkProvider";
import {MemoryProvider} from "./MemoryProvider";
import {NetworkProvider} from "./NetworkProvider";
import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";

/**
 * Factory class for creating instances of the Provider class with various configurations.
 */
export class ProviderFactory {
    /**
     * Creates and returns an in-memory provider instance. This provider utilizes a memory storage backend
     * without network provider.
     *
     **/
    static createInMemoryProvider(): Provider {
        return new Provider(new MemoryProvider(), new NullNetworkProvider());
    }

    /**
     * Creates an in-memory provider that works in conjunction with an external network provider.
     *
     * @param {string} nodeUrl*/
    static createInMemoryProviderWithExternalProvider(nodeUrl: string): Provider {
        return new Provider(new MemoryProvider(), NetworkProvider.createFromUrl(nodeUrl));
    }
}