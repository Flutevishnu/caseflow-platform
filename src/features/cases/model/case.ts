import { STATUS, PRIORITY, CATEGORY } from "./caseDto"

interface Customer {
    id: string,
    name: string,
    email: string
}
export type Case = {
    id: string, 
    reference: string,
    title: string,
    description: string,
    status: (typeof STATUS)[number],
    priority: (typeof PRIORITY)[number],
    category: (typeof CATEGORY)[number],
    customer: Customer
    assigneeId: string | null,
    tags: string[],
    createdAt: Date,
    updatedAt: Date,
    dueAt: Date | null
}