declare class AgentQStatusUpdater {
    private apiKey;
    private baseUrl;
    private testRunId;
    private tcidToIdCache;
    private client;
    constructor(apiKey: string, projectId: string, testRunId: string);
    populateTestCases(): Promise<Record<string, string>>;
    populateTestCasesByTitle(): Promise<Record<string, string>>;
    getRunDetails(): Promise<any>;
    getCasesDetails(page?: number, limit?: number): Promise<any>;
    getSummary(): Promise<any>;
    patchResult(testInfo: any): Promise<any>;
    private fetchJson;
}
export default AgentQStatusUpdater;
