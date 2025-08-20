import { z } from "zod";

export const NewBlockEventSchema = z.object({
    jsonrpc: z.literal("2.0"),
    id: z.number(),
    result: z.object({
        query: z.string(),
        data: z.object({
            type: z.literal("tendermint/event/NewBlock"),
            value: z.object({
                block: z.object({
                    header: z.object({
                        version: z.object({
                            block: z.string(),
                            app: z.string().optional(),
                        }),
                        chain_id: z.string(),
                        height: z.string(),
                        time: z.string(),
                        last_block_id: z.object({
                            hash: z.string(),
                            parts: z.object({
                                total: z.number(),
                                hash: z.string(),
                            }),
                        }),
                        last_commit_hash: z.string(),
                        data_hash: z.string(),
                        validators_hash: z.string(),
                        next_validators_hash: z.string(),
                        consensus_hash: z.string(),
                        app_hash: z.string(),
                        last_results_hash: z.string(),
                        evidence_hash: z.string(),
                        proposer_address: z.string(),
                    }),
                    data: z.object({
                        txs: z.array(z.string()),
                    }),
                    evidence: z.object({
                        evidence: z.array(z.any()),
                    }),
                    last_commit: z.object({
                        height: z.string(),
                        round: z.number(),
                        block_id: z.object({
                            hash: z.string(),
                            parts: z.object({
                                total: z.number(),
                                hash: z.string(),
                            }),
                        }),
                        signatures: z.array(
                            z.object({
                                block_id_flag: z.number(),
                                validator_address: z.string(),
                                timestamp: z.string(),
                                signature: z.string(),
                            })
                        ),
                    }),
                }),
                block_id: z.object({
                    hash: z.string(),
                    parts: z.object({
                        total: z.number(),
                        hash: z.string(),
                    }),
                }),
                result_finalize_block: z.object({
                    validator_updates: z.union([z.null(), z.any()]).optional(),
                    app_hash: z.string(),
                }),
            }),
        }),
        events: z.object({
            "tm.event": z.array(z.string()),
        }),
    }),
});

export type NewBlockEventType = z.infer<typeof NewBlockEventSchema>;