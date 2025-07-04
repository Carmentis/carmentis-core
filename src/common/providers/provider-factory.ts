import {Provider} from "./provider";
import {NullNetworkProvider} from "./nullNetworkProvider";
import {MemoryProvider} from "./memoryProvider";
import {NetworkProvider} from "./networkProvider";
import {PrivateSignatureKey} from "../crypto/signature/signature-interface";
import {KeyedProvider} from "./keyed-provider";

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
        return new Provider(new MemoryProvider(), new NetworkProvider(nodeUrl));
    }


    /**
     * Creates a keyed provider using an external network provider. The provider contains a built-in in-memory provider to handle cache.
     *
     * @param {PrivateSignatureKey} privateKey - The private signature key used for signing or authentication.
     * @param {string} nodeUrl - The URL of the external network node provider.
     * @return {Provider} An instance of a Provider configured with an in-memory provider and the specified external network provider.
     */
    static createKeyedProviderExternalProvider(privateKey: PrivateSignatureKey, nodeUrl: string): Provider {
        return new KeyedProvider(privateKey, new MemoryProvider(), new NetworkProvider(nodeUrl));
    }
}