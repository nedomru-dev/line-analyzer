import type {Customer} from "../types/Customer.ts";
import type {AnalysisResult, ProblemCategories, Statistics} from "../types/Analysis.ts";

// TV-related terms and problems
const TV_RELATED_TERMS = [
    'тв', 'tv', 'телевизор', 'телевидение',
    'приставка', 'ресивер', 'stb', 'set-top box',
    'канал', 'вещание', 'трансляция',
    'смарт тв', 'smart tv'
];

// Network equipment and technical terms
const NETWORK_EQUIPMENT_TERMS = [
    'роутер', 'router', 'ону', 'onu',
    'терминал', 'terminal', 'модем', 'modem',
    'линк', 'link', 'сигнал', 'signal',
    'оптика', 'optical', 'eqm'
];

// Connection status related terms
const CONNECTION_STATUS_TERMS = [
    'сессия', 'session',
    'подключение', 'connection',
    'линк', 'link',
    'соединение',
    'пинг', 'ping'
];

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

    // Generic Terms
    'battle.net', 'баттлнет',
    'steam', 'стим',
    'epic games', 'епик',
    'origin', 'ориджин'
];

// Enhanced patterns for detecting internet problems
const INTERNET_PROBLEM_PATTERNS = [
    // No internet indicators
    'нет инет', 'нет интернет', 'нет сессии',
    'не работает инт', 'отсутствует интернет',
    'пропал интернет', 'отключился интернет',
    // Technical issues
    'нет сигнала', 'нет линка', 'нет оптического линка',
    'не устанавливает сессию', 'отсутствует подключение',
    // Shortened forms
    'нет инт', 'нет нет', 'не раб инт',
    // Status checks
    'по eqm', 'проверка терминала',
    'нет подключения', 'нет соединения'
];

function hasKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

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

    // Helper function for internet problems with enhanced detection
    const hasInternetProblem = (text: string): boolean => {
        if (!text) return false;
        text = text.toLowerCase();

        // Direct pattern matching
        if (INTERNET_PROBLEM_PATTERNS.some(pattern => text.includes(pattern))) {
            return true;
        }

        // Combination matching
        const hasNegation = text.includes('нет') ||
            text.includes('не работает') ||
            text.includes('отсутствует');

        const hasInternetTerm = text.includes('интернет') ||
            text.includes('инт') ||
            text.includes('инет') ||
            text.includes('сессии');

        return hasNegation && hasInternetTerm;
    };

    // Categorize problems
    const problemCategories: ProblemCategories = {
        'No internet': customers.filter(c => {
            return c.problem && hasInternetProblem(c.problem);
        }),
        'TV issues': customers.filter(c => {
            if (!c.problem) return false;
            return hasKeywords(c.problem, TV_RELATED_TERMS);
        }),
        'Gaming issues': customers.filter(c => {
            if (!c.problem) return false;
            const problem = c.problem.toLowerCase();
            return problem.includes('игр') ||
                problem.includes('пинг') ||
                POPULAR_GAMES.some(game => problem.includes(game));
        }),
        'Speed issues': customers.filter(c => {
            if (!c.problem) return false;
            const problem = c.problem.toLowerCase();
            return problem.includes('скорост') ||
                problem.includes('медленн') ||
                problem.includes('тормоз') ||
                (problem.includes('не') && problem.includes('грузит'));
        }),
        'Other issues': customers.filter(c => {
            if (!c.problem) return false;
            const problem = c.problem.toLowerCase();

            // Check if the problem fits any other category
            const isInternetProblem = hasInternetProblem(problem);
            const isTVProblem = hasKeywords(problem, TV_RELATED_TERMS);
            const isGamingProblem = problem.includes('игр') ||
                problem.includes('пинг') ||
                POPULAR_GAMES.some(game => problem.includes(game));
            const isSpeedProblem = problem.includes('скорост') ||
                problem.includes('медленн') ||
                problem.includes('тормоз') ||
                (problem.includes('не') && problem.includes('грузит'));

            // If it doesn't fit any other category, it goes to "Other issues"
            return !(isInternetProblem || isTVProblem || isGamingProblem || isSpeedProblem);
        })
    };

    return {
        mkuStats,
        territoryStats,
        problemCategories
    };
}