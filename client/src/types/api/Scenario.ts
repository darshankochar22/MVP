import type { ScenarioType } from '../entities/Scenario';

export interface ScenarioAPI {
  scenario: {
    create: (data: Partial<ScenarioType>) => Promise<{ success: boolean; scenario: ScenarioType; error?: string }>;
    getAll: (company_id: number) => Promise<{ success: boolean; scenarios: ScenarioType[]; error?: string }>;
    getById: (id: number) => Promise<{ success: boolean; scenario: ScenarioType; error?: string }>;
    update: (data: Partial<ScenarioType>) => Promise<{ success: boolean; scenario: ScenarioType; error?: string }>;
    delete: (id: number) => Promise<{ success: boolean; error?: string }>;
  };
}
