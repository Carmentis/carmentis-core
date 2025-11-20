import {configure, getConsoleSink, getLogger} from "@logtape/logtape";

export class Logger {
    static getLogger(context: string[] = []) {
        return getLogger(["@cmts-dev/carmentis-sdk", ...context])
    }

    static getProviderLogger() {
        return this.getLogger()
    }

    static getMemoryProviderLogger() {
        return this.getLogger()
    }

    static async enableLogs() {
        await configure({
            sinks: { console: getConsoleSink() },
            loggers: [
                { category: "@cmts-dev/carmentis-sdk", lowestLevel: "debug", sinks: ["console"] }
            ]
        });
    }

    static getNetworkProviderLogger() {
        return this.getLogger()
    }
}