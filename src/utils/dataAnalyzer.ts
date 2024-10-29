import type { Customer } from "../types/Customer.ts";
import type { AnalysisResult, ProblemCategories, Statistics } from "../types/Analysis.ts";

// Problem category definitions with associated keywords
const PROBLEM_CATEGORIES = {
    TV: {
        terms: new Set([
            'тв', 'tv', 'телевизор', 'телевидение', 'приставк',
            'ресивер', 'stb', 'канал', 'вещание', 'трансляция',
            'смарт', 'smart tv', 'ктв', 'цктв', 'смотрешка',
            'вещани', 'movix', 'мувикс', 'мувих', 'кабельное',
            'dom.ru tv', 'дом.ru tv'
        ]),
        // TV-specific signal problems
        signalPatterns: new Set([
            'нет сигнала на тв',
            'нет сигнала на всех каналах',
            'нет сигнала на канал',
            'пропал сигнал тв',
            'нет сигнала на телевизор'
        ])
    },
    GAMING: {
        games: new Set([
            'warzone', 'варзон', 'cod', 'код', 'fortnite', 'фортнайт',
            'pubg', 'пубг', 'apex', 'апекс', 'apex legends',
            'valorant', 'валорант', 'cs', 'кс', 'counter', 'strike',
            'counter-strike', 'cs:go', 'cs2', 'dota', 'дота', 'дота2',
            'dota2', 'lol', 'лол', 'league of legends', 'wow', 'вов',
            'world of warcraft', 'lost ark', 'лост арк', 'gta', 'гта',
            'minecraft', 'майнкрафт'
        ]),
        platforms: new Set([
            'battle.net', 'баттлнет', 'steam', 'стим',
            'epic games', 'епик', 'origin', 'ориджин'
        ]),
        genericTerms: new Set(['игр', 'пинг', 'game'])
    },
    INTERNET: {
        patterns: new Set([
            'нет инет', 'нет интернет', 'нет сессии', 'не работает инт',
            'отсутствует интернет', 'пропал интернет', 'отключился интернет',
            'нет оптического линка', 'не устанавливает сессию',
            'отсутствует подключение', 'нет инт', 'нет нет', 'не раб инт',
            'по eqm', 'проверка терминала', 'нет подключения', 'нет соединения'
        ]),
        negationWords: new Set(['нет', 'не работает', 'отсутствует']),
        internetTerms: new Set(['интернет', 'инт', 'инет', 'сессии'])
    },
    SPEED: {
        terms: new Set(['скорост', 'медленн', 'тормоз']),
        combinations: [
            { first: 'не', second: 'грузит' }
        ]
    }
};

class ProblemAnalyzer {
    private static normalizeText(text: string | undefined): string {
        return (text || '').toLowerCase().trim();
    }

    private static hasAnyTerm(text: string, terms: Set<string>): boolean {
        return Array.from(terms).some(term => text.includes(term));
    }

    private static hasContractType(customer: Customer, types: string[]): boolean {
        const contract = (customer.Договор || '').toLowerCase();
        return types.some(type => contract.includes(type.toLowerCase()));
    }

    static isTVProblem(problem: string, customer: Customer): boolean {
        const normalizedProblem = problem;

        // Check if it's a TV contract type
        const tvContractTypes = ['кабельное телевидение', 'dom.ru tv', 'дом.ru tv', 'цктв'];
        const isTVContract = this.hasContractType(customer, tvContractTypes);

        // Direct TV term match
        const hasTVTerms = this.hasAnyTerm(normalizedProblem, PROBLEM_CATEGORIES.TV.terms);

        // TV-specific signal patterns
        const hasTVSignalPattern = this.hasAnyTerm(normalizedProblem, PROBLEM_CATEGORIES.TV.signalPatterns);

        // Check for generic signal issues in combination with TV context
        const hasSignalIssue = normalizedProblem.includes('нет сигнала') ||
            normalizedProblem.includes('пропал сигнал');

        // Specific checks for TV signal problems
        const isTVSignalProblem = hasSignalIssue && (
            normalizedProblem.includes('тв') ||
            normalizedProblem.includes('канал') ||
            isTVContract ||
            /на \d+ тв/.test(normalizedProblem) ||  // "на 2 тв", "на 4 тв" etc.
            normalizedProblem.includes('ктв')
        );

        return hasTVTerms || hasTVSignalPattern || isTVSignalProblem;
    }

    static isGamingProblem(problem: string): boolean {
        return this.hasAnyTerm(problem, PROBLEM_CATEGORIES.GAMING.games) ||
            this.hasAnyTerm(problem, PROBLEM_CATEGORIES.GAMING.platforms) ||
            this.hasAnyTerm(problem, PROBLEM_CATEGORIES.GAMING.genericTerms);
    }

    static isInternetProblem(problem: string, customer: Customer): boolean {
        // Skip if it's a TV problem
        if (this.isTVProblem(problem, customer)) {
            return false;
        }

        // Direct pattern match
        if (this.hasAnyTerm(problem, PROBLEM_CATEGORIES.INTERNET.patterns)) {
            return true;
        }

        // Combination match
        return this.hasAnyTerm(problem, PROBLEM_CATEGORIES.INTERNET.negationWords) &&
            this.hasAnyTerm(problem, PROBLEM_CATEGORIES.INTERNET.internetTerms);
    }

    static isSpeedProblem(problem: string): boolean {
        if (this.hasAnyTerm(problem, PROBLEM_CATEGORIES.SPEED.terms)) {
            return true;
        }

        return PROBLEM_CATEGORIES.SPEED.combinations.some(
            ({ first, second }) => problem.includes(first) && problem.includes(second)
        );
    }

    static categorize(customer: Customer): keyof ProblemCategories | null {
        const problem = this.normalizeText(customer.problem);
        if (!problem) return null;

        // Check TV issues first to catch TV-specific signal problems
        if (this.isTVProblem(problem, customer)) return 'TV issues';
        if (this.isInternetProblem(problem, customer)) return 'No internet';
        if (this.isGamingProblem(problem)) return 'Gaming issues';
        if (this.isSpeedProblem(problem)) return 'Speed issues';
        return 'Other issues';
    }
}

class StatsCollector {
    static collectMkuStats(customers: Customer[]): Statistics {
        return customers.reduce((stats: Statistics, customer) => {
            if (customer.МКУ) {
                customer.МКУ.split(';')
                    .map(mku => mku.trim())
                    .forEach(mku => {
                        stats[mku] = (stats[mku] || 0) + 1;
                    });
            }
            return stats;
        }, {});
    }

    static collectTerritoryStats(customers: Customer[]): Statistics {
        return customers.reduce((stats: Statistics, customer) => {
            const territory = customer['Территория (участок)'].split(',')[0].trim();
            stats[territory] = (stats[territory] || 0) + 1;
            return stats;
        }, {});
    }
}

export function analyzeData(customers: Customer[]): AnalysisResult {
    // Initialize problem categories
    const problemCategories = {
        'No internet': [] as Customer[],
        'TV issues': [] as Customer[],
        'Gaming issues': [] as Customer[],
        'Speed issues': [] as Customer[],
        'Other issues': [] as Customer[]
    };

    // Categorize customers
    customers.forEach(customer => {
        const category = ProblemAnalyzer.categorize(customer);
        if (category) {
            problemCategories[category].push(customer);
        }
    });

    return {
        mkuStats: StatsCollector.collectMkuStats(customers),
        territoryStats: StatsCollector.collectTerritoryStats(customers),
        problemCategories
    };
}