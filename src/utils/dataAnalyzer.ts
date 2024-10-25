import type {Customer} from "../types/Customer.ts";
import type {AnalysisResult, ProblemCategories, Statistics} from "../types/Analysis.ts";

// Популярные игры и их вариации написания
const POPULAR_GAMES = [
    // Battle Royale & Shooters
    'warzone', 'варзон', 'cod', 'код',
    'fortnite', 'фортнайт', 'pubg', 'пубг',
    'apex', 'апекс', 'apex legends',
    'valorant', 'валорант',
    'cs', 'кс', 'counter', 'strike', 'counter-strike', 'cs:go', 'cs2',

    // MOBAs
    'dota', 'дота', 'дота2', 'dota2',
    'lol', 'лол', 'league of legends',

    // MMOs & Online Games
    'wow', 'вов', 'world of warcraft',
    'lost ark', 'лост арк',
    'gta', 'гта', 'gta online',
    'minecraft', 'майнкрафт',

    // Specific Games
    'tarkov', 'тарков', 'escape from tarkov',
    'rainbow six', 'rainbow 6', 'r6',
    'overwatch', 'овервотч',
    'rocket league', 'рокет лига',
    'fifa', 'фифа',
    'roblox', 'роблокс',

    // Generic Terms
    'battle.net', 'баттлнет',
    'steam', 'стим',
    'epic games', 'епик',
    'origin', 'ориджин'
];

// Шаблоны для определения проблем с интернетом
const INTERNET_PROBLEM_PATTERNS = [
    // Прямые указания на отсутствие интернета
    'нет инет',
    'нет интернет',
    'нет сессии',
    'не работает инт',
    'отсутствует интернет',
    'пропал интернет',
    'отключился интернет',
    // Сокращения и вариации
    'нет инт',
    'нет нет',
    'не раб инт',
    'не работает и',
    // Технические термины
    'нет сессии',
    'нет подключения',
    'отсутствует подключение',
    'нет соединения',
    'отсутствует соединение'
];

export function analyzeData(customers: Customer[]): AnalysisResult {
    const mkuStats: Statistics = {};
    const territoryStats: Statistics = {};

    // Analyze МКУ distribution
    customers.forEach(customer => {
        if (customer.МКУ) {
            const mkus = customer.МКУ.split(';').map(m => m.trim());
            mkus.forEach(mku => {
                mkuStats[mku] = (mkuStats[mku] || 0) + 1;
            });
        }
    });

    // Analyze territories
    customers.forEach(customer => {
        const territory = customer['Территория (участок)'].split(',')[0].trim();
        territoryStats[territory] = (territoryStats[territory] || 0) + 1;
    });

    // Helper function to check if text matches any internet problem pattern
    const hasInternetProblem = (text: string): boolean => {
        text = text.toLowerCase();
        return INTERNET_PROBLEM_PATTERNS.some(pattern => text.includes(pattern)) ||
            // Дополнительная проверка комбинаций слов
            ((text.includes('нет') || text.includes('не работает') || text.includes('отсутствует')) &&
                (text.includes('интернет') || text.includes('инт') || text.includes('инет')));
    };

    // Analyze problems
    const problemCategories: ProblemCategories = {
        'No internet': customers.filter(c => {
            return c.problem && hasInternetProblem(c.problem);
        }),
        'Gaming issues': customers.filter(c => {
            const problem = (c.problem || '').toLowerCase();
            // Проверяем общие игровые термины
            if (problem.includes('игр') || problem.includes('пинг')) return true;

            // Проверяем конкретные игры
            return POPULAR_GAMES.some(game => problem.includes(game));
        }),
        'Speed issues': customers.filter(c => {
            const problem = (c.problem || '').toLowerCase();
            return problem.includes('скорост') ||
                problem.includes('медленн') ||
                problem.includes('тормоз') ||
                (problem.includes('не') && problem.includes('грузит'));
        }),
        'Other issues': customers.filter(c => {
            if (!c.problem) return false;
            const problem = c.problem.toLowerCase();

            return !(
                hasInternetProblem(problem) ||
                problem.includes('игр') ||
                problem.includes('пинг') ||
                POPULAR_GAMES.some(game => problem.includes(game)) ||
                problem.includes('скорост') ||
                problem.includes('медленн') ||
                problem.includes('тормоз') ||
                (problem.includes('не') && problem.includes('грузит'))
            );
        })
    };

    return {
        mkuStats,
        territoryStats,
        problemCategories
    };
}