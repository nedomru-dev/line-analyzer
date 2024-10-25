import type {Customer} from "../types/Customer.ts";

export function parseCustomerData(text: string): Customer[] {
    const customers = text.split('\n\n').filter(block => block.trim());

    const parsed = customers.map(customer => {
        const lines = customer.split('\n');
        const data: Partial<Customer> = {};

        lines.forEach(line => {
            if (line.includes(':')) {
                const [key, value] = line.split(':').map(s => s.trim());
                (data as any)[key] = value;
            }
        });

        // Extract problem description (if any)
        const problemLine = lines.find(line =>
            !line.includes(':') && line.trim().length > 0
        );
        if (problemLine) {
            data.problem = problemLine.trim();
        }

        return data as Customer;
    });

    return parsed.filter((customer): customer is Customer =>
        customer.Клиент !== undefined &&
        customer.Договор !== undefined &&
        customer.Адрес !== undefined &&
        customer['Территория (участок)'] !== undefined
    );
}
