export interface Customer {
    Клиент: string;
    Договор: string;
    Тел?: string;
    Адрес: string;
    Логин: string | null;
    МКУ: string;
    'Территория (участок)': string;
    problem?: string;
}