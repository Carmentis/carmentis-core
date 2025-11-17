import { getLogger } from "@logtape/logtape";
import { configure, getConsoleSink } from "@logtape/logtape";

export class Logger {
    static getLogger(context: string[] = []) {
        return getLogger(["@cmts-dev/carmentis-sdk", ...context])
    }

    static async enableLogs() {
        await configure({
            sinks: { console: getConsoleSink() },
            loggers: [
                { category: "@cmts-dev/carmentis-sdk", lowestLevel: "debug", sinks: ["console"] }
            ]
        });
    }
}