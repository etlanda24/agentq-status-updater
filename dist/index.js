// src/index.ts
class AgentQStatusUpdater {
  apiKey;
  email;
  password;
  baseUrl;
  testRunId;
  tcidToIdCache;
  constructor(email, password, projectId, testRunId) {
    this.apiKey = "";
    this.email = email;
    this.password = password;
    this.testRunId = testRunId;
    this.baseUrl = `https://agentq-sdet.mekari.io/api/projects/${projectId}`;
    this.tcidToIdCache = {};
  }
  async login() {
    const resp = await fetch(`https://agentq-sdet.mekari.io/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: this.email, password: this.password })
    });
    const respJson = await resp.json();
    this.apiKey = respJson.access_token;
  }
  async populateTestCases() {
    await this.login();
    this.tcidToIdCache = {};
    let page = 1;
    while (true) {
      try {
        const response = await this.fetchJson(`/test-runs/${this.testRunId}/test-results`, { page, limit: 100 });
        const data = response.results;
        if (!data || data.length === 0)
          break;
        data.forEach((testCase) => {
          this.tcidToIdCache[testCase.testCase.tcId] = testCase.id;
        });
        page++;
      } catch (error) {
        console.error("Error populating cache:", error.message);
        throw error;
      }
    }
    console.log(`Cache populated with ${Object.keys(this.tcidToIdCache).length} entries.`);
    return this.tcidToIdCache;
  }
  async populateTestCasesByTitle() {
    await this.login();
    this.tcidToIdCache = {};
    let page = 1;
    while (true) {
      try {
        const response = await fetch(`${this.baseUrl}/test-runs/${this.testRunId}/test-results?page=${page}&limit=100`, { headers: { Authorization: `Bearer ${this.apiKey}` } });
        const responseJson = await response.json();
        const data = responseJson.results;
        if (!data || data.length === 0)
          break;
        data.forEach((testCase) => {
          const idFromTitle = testCase.testCase.title.split("#C");
          this.tcidToIdCache[idFromTitle[1]] = testCase.testCase.tcId;
        });
        page++;
      } catch (error) {
        console.error("Error populating cache:", error.message);
        throw error;
      }
    }
    console.log(`Cache populated with ${Object.keys(this.tcidToIdCache).length} entries.`);
    return this.tcidToIdCache;
  }
  async getRunDetails() {
    await this.login();
    return this.fetchJson(`/test-runs/${this.testRunId}`);
  }
  async getCasesDetails(page = 1, limit = 100) {
    await this.login();
    return this.fetchJson(`/test-runs/${this.testRunId}/test-results`, { page, limit });
  }
  async getSummary() {
    await this.login();
    return this.fetchJson(`/test-runs/${this.testRunId}/summary`);
  }
  async patchResult(testInfo) {
    await this.login();
    const status = testInfo.status.toLowerCase();
    const data = { status, actualResult: "", notes: "" };
    const title = testInfo.title;
    const cases = title.split("-")[0].split(",");
    for (const id of cases) {
      try {
        const response = await fetch(`${this.baseUrl}/test-runs/${this.testRunId}/test-results/tcId/${id}`, { method: "PATCH", headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(data) });
        return response;
      } catch (error) {
        console.error(`Error patching result ${id}:`, error.message);
      }
    }
  }
  async fetchJson(endpoint, params = {}, method = "GET") {
    await this.login();
    const url = new URL(endpoint, this.baseUrl);
    if (params) {
      Object.keys(params).forEach((key) => url.searchParams.append(key, String(params[key])));
    }
    const response = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: method === "PATCH" ? JSON.stringify(params) : undefined
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return response.json();
  }
}
var src_default = AgentQStatusUpdater;
export {
  src_default as default
};
