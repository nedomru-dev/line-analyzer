import type {Customer} from "../types/Customer.ts";

export function parseCustomerData(text: string): Customer[] {
    // First, normalize line endings and remove any carriage returns
    const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Split into potential customer blocks by detecting the "Клиент:" pattern
    const customerBlocks = normalizedText
        .split(/(?=Клиент:)/)
        .filter(block => block.trim().length > 0);

    const parsed = customerBlocks.map(customerBlock => {
        // Split block into lines and remove empty lines
        const lines = customerBlock
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        const data: Partial<Customer> = {};

        let currentKey: keyof Customer | null = null;

        lines.forEach(line => {
            if (line.includes(':')) {
                const [key, ...valueParts] = line.split(':');
                const value = valueParts.join(':').trim(); // Rejoin in case value contains colons

                // Map the keys to our Customer interface
                switch (key.trim()) {
                    case 'Клиент':
                        currentKey = 'Клиент';
                        data[currentKey] = value;
                        break;
                    case 'Договор':
                        currentKey = 'Договор';
                        data[currentKey] = value;
                        break;
                    case 'Тел.':
                    case 'Тел':
                        currentKey = 'Тел';
                        data[currentKey] = value;
                        break;
                    case 'Адрес':
                        currentKey = 'Адрес';
                        data[currentKey] = value;
                        break;
                    case 'Логин':
                        currentKey = 'Логин';
                        data[currentKey] = value === 'null' ? null : value;
                        break;
                    case 'МКУ':
                        currentKey = 'МКУ';
                        data[currentKey] = value;
                        break;
                    case 'Территория (участок)':
                        currentKey = 'Территория (участок)';
                        data[currentKey] = value;
                        break;
                    default:
                        // If we have a current key and this line doesn't have a colon,
                        // treat it as a continuation of the previous value
                        if (currentKey && data[currentKey]) {
                            data[currentKey] += ' ' + line;
                        }
                }
            } else if (line.length > 0 && !line.includes(':')) {
                // If line has no colon and isn't empty, it's probably a problem description
                if (!data.problem) {
                    data.problem = line;
                } else {
                    data.problem += ' ' + line;
                }
            }
        });

        return data as Customer;
    });

    // Filter out invalid entries and ensure required fields are present
    return parsed.filter((customer): customer is Customer =>
        customer.Клиент !== undefined &&
        customer.Договор !== undefined &&
        customer.Адрес !== undefined &&
        customer['Территория (участок)'] !== undefined &&
        // Additional validation to ensure it's a real customer entry
        customer.Клиент.length > 0 &&
        customer.Договор.length > 0
    );
}

// Helper function to count customers in a text
export function countCustomersInText(text: string): number {
    return (text.match(/Клиент:/g) || []).length;
}

// Helper function to validate customer entry
export function validateCustomerEntry(customer: Partial<Customer>): boolean {
    return Boolean(
        customer.Клиент &&
        customer.Договор &&
        customer.Адрес &&
        customer['Территория (участок)']
    );
}