#!/usr/bin/env node
import {Cli, Command, Option} from "clipanion";
import {MLDSA65PrivateSignatureKey} from "../common/crypto/signature/ml-dsa-65";
import {PrivateSignatureKey} from "../common/crypto/signature/PrivateSignatureKey";
import {Secp256k1PrivateSignatureKey} from "../common/crypto/signature/secp256k1/Secp256k1PrivateSignatureKey";

interface ExportStrategy {
    export(privateKey: PrivateSignatureKey, filePath: string): void;
}

class JSONExportStrategy implements ExportStrategy {
    export(privateKey: PrivateSignatureKey, filePath: string) {
        // TODO: implémenter la sérialisation et l’écriture fichier
        console.log(`Exporting private key to ${filePath} in JSON format`);
    }
}

function createExportStrategyFromStrategyName(exportStrategyName: string): ExportStrategy {
    switch (exportStrategyName) {
        case "json":
            return new JSONExportStrategy();
        default:
            throw new Error(`Export strategy ${exportStrategyName} is not supported.`);
    }
}

class GenerateSigKeypairCommand extends Command {
    static paths = [["generate-sig-keypair"]];

    scheme = Option.String("Scheme", {
        required: true,

    });

    format = Option.String('Format', {
        required: true
    });

    output = Option.String("output", {
        required: false
    });

    async execute() {
        const outputFilename = this.output || "json";
        const specifiedStrategyName = this.format || 'json';
        const exportStrategy = createExportStrategyFromStrategyName(specifiedStrategyName);

        if (this.scheme === "mldsa") {
            const privateKey = await MLDSA65PrivateSignatureKey.gen();
            exportStrategy.export(privateKey, outputFilename);
        } else if (this.scheme === "secp256k1") {
            const privateKey = Secp256k1PrivateSignatureKey.gen();
            exportStrategy.export(privateKey, outputFilename);
        } else {
            this.context.stderr.write(`Scheme ${this.scheme} is not supported.\n`);
        }
    }
}


const cli = new Cli({
    binaryLabel: `Carmentis CLI`,
    binaryName: `carmentis-cli`,
    binaryVersion: `1.0.0`,
});

cli.register(GenerateSigKeypairCommand);

cli.runExit(process.argv.slice(2), {
    ...Cli.defaultContext,
});