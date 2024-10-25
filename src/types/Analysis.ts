import type {Customer} from "./Customer.ts";

export interface Statistics {
    [key: string]: number;
}

export interface ProblemCategories {
    'No internet': Customer[];
    'Gaming issues': Customer[];
    'Speed issues': Customer[];
    'Other issues': Customer[];
}

export interface AnalysisResult {
    mkuStats: Statistics;
    territoryStats: Statistics;
    problemCategories: ProblemCategories;
}