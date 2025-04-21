type TestCase = {
    id: string;
    testCase: { tcId: string, title: string };
  };
  
  type TestResultsResponse = {
    results: TestCase[];
  };
  
  class AgentQStatusUpdater {
    private apiKey: string;
    private baseUrl: string;
    private testRunId: string;
    private tcidToIdCache: Record<string, string>;
  
    constructor(apiKey: string, projectId: string, testRunId: string) {
      this.apiKey = apiKey;
      this.testRunId = testRunId;
      this.baseUrl = `https://agentq-sdet.mekari.io/api/projects/${projectId}`;
      this.tcidToIdCache = {};
    }
  
    async populateTestCases(): Promise<Record<string, string>> {
      this.tcidToIdCache = {};
      let page = 1;
  
      while (true) {
        try {
          const response = await this.fetchJson(`/test-runs/${this.testRunId}/test-results`, { page, limit: 100 });
  
          const data = (response as TestResultsResponse).results;
          if (!data || data.length === 0) break;
  
          data.forEach(testCase => {
            this.tcidToIdCache[testCase.testCase.tcId] = testCase.id;
          });
  
          page++;
        } catch (error: any) {
          console.error('Error populating cache:', error.message);
          throw error;
        }
      }
  
      console.log(`Cache populated with ${Object.keys(this.tcidToIdCache).length} entries.`);
      return this.tcidToIdCache;
    }
  
    async populateTestCasesByTitle(): Promise<Record<string, string>> {
      this.tcidToIdCache = {};
      let page = 1;
  
      while (true) {
        try {
          const response = await this.fetchJson(`/test-runs/${this.testRunId}/test-results`, { page, limit: 100 });
  
          const data = (response as TestResultsResponse).results;
          if (!data || data.length === 0) break;
  
          data.forEach(testCase => {
            const idFromTitle = testCase.testCase.title.split("#C");
            this.tcidToIdCache[idFromTitle[1]] = testCase.testCase.tcId;
          });
  
          page++;
        } catch (error: any) {
          console.error('Error populating cache:', error.message);
          throw error;
        }
      }
  
      console.log(`Cache populated with ${Object.keys(this.tcidToIdCache).length} entries.`);
      return this.tcidToIdCache;
    }
  
    async getRunDetails(): Promise<any> {
      return this.fetchJson(`/test-runs/${this.testRunId}`);
    }
  
    async getCasesDetails(page = 1, limit = 100): Promise<any> {
      return this.fetchJson(`/test-runs/${this.testRunId}/test-results`, { page, limit });
    }
  
    async getSummary(): Promise<any> {
      return this.fetchJson(`/test-runs/${this.testRunId}/summary`);
    }
  
    async patchResult(testInfo: any): Promise<any> {
      const status = testInfo.status.toLowerCase();
      const data = { "status": status, "actualResult": "", "notes": "" };
      const title = testInfo.title;
      const cases = title.split('-')[0].split(',');
  
      for (const id of cases) {
        try {
          const response = await this.fetchJson(`/test-runs/${this.testRunId}/test-results/tcId/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
          return response;
        } catch (error: any) {
          console.error(`Error patching result ${id}:`, error.message);
        }
      }
    }
  
    private async fetchJson(endpoint: string, params: any = {}, method: string = 'GET'): Promise<any> {
      const url = new URL(endpoint, this.baseUrl);
      if (params) {
        Object.keys(params).forEach(key => url.searchParams.append(key, String(params[key])));
      }
  
      const response = await fetch(url.toString(), {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: method === 'PATCH' ? JSON.stringify(params) : undefined
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
  
      return response.json();
    }
  }
  
  export default AgentQStatusUpdater;
  