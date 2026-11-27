import * as z from "zod";

const titleMin = 5;
const titleMax = 120;
const descMax = 4000;
export const STATUS = ['new', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'] as const;
export const PRIORITY = ['low', 'medium', 'high', 'urgent'] as const;
export const CATEGORY = ['bug', 'access', 'question', 'feature_request'] as const;


export const caseDtoSchema = z.object({
    id: z.string(),
    reference: z.string(),
    title: z.string()
        .min(titleMin, `Enter at least ${titleMin}`)
        .max(titleMax, `Use at most ${titleMax}`),
    description: z.string().max(descMax),
    status: z.enum(STATUS, { error: "Invalid status" }),
    priority: z.enum(PRIORITY, { error: "Invalid status" }),
    category: z.enum(CATEGORY, { error: "Invalid status" }),
    customer: z.object({
        id: z.string(),
        name: z.string(),
        email: z.email("Enter a valid email")
    }),
    assignee_id: z.string().nullable(),
    tags: z.array(z.string()),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime(),
    due_at: z.iso.datetime().nullable()
})

export type CaseDto = z.infer<typeof caseDtoSchema>