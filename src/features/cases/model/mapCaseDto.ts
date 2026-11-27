import { caseDtoSchema } from "./caseDto";
import type { Case } from "./case";

export function mapCaseDto(input: unknown): Case| null {
    const result = caseDtoSchema.safeParse(input)
    if(result.success){
        const parsedData = result.data;
        return {
            id: parsedData.id,
            reference: parsedData.reference,
            title: parsedData.title,
            description: parsedData.description,
            status: parsedData.status,
            priority: parsedData.priority,
            category: parsedData.category,
            customer: parsedData.customer,
            assigneeId: parsedData.assignee_id,
            tags: [...parsedData.tags],
            createdAt: new Date(parsedData.created_at),
            updatedAt: new Date(parsedData.updated_at),
            dueAt: parsedData.due_at ? new Date(parsedData.due_at) : null
        }
    }
    else{
        return null
    }
}