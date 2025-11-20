import {z} from "zod";

export const NetworksFileSchema = z.record(
    z.string(),
    z.object({
        networkName: z.string().optional(),
        nodes: z.record(
            z.string(),
            z.object({
                nodeName: z.string().optional(),
                hostname: z.string(),
                rpcEndpoint: z.string(),
                p2pEndpoint: z.string(),
                trusted: z.boolean().optional().default(false),
                nodeId: z.string(),
            })
        ),
    })
);

export type NetworksFile = z.infer<typeof NetworksFileSchema>;