"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/AgentQStatusUpdater.ts
const axios_1 = __importDefault(require("axios"));
class AgentQStatusUpdater {
    constructor(apiKey, projectId, testRunId) {
        this.apiKey = apiKey;
        this.testRunId = testRunId;
        this.baseUrl = 'https://agentq-sdet.mekari.io/api/projects/' + projectId;
        this.tcidToIdCache = {};
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: { Authorization: `Bearer ${this.apiKey}` },
            timeout: 10000, // optional timeout
        });
    }
    async populateTestCases() {
        this.tcidToIdCache = {};
        let page = 1;
        while (true) {
            try {
                const response = await this.client.get(`/test-runs/${this.testRunId}/test-results`, { params: { page, limit: 100 } });
                const data = response.data.results;
                if (!data || data.length === 0)
                    break;
                data.forEach(testCase => {
                    this.tcidToIdCache[testCase.testCase.tcId] = testCase.id;
                });
                page++;
            }
            catch (error) {
                console.error('Error populating cache:', error.message);
                throw error;
            }
        }
        console.log(`Cache populated with ${Object.keys(this.tcidToIdCache).length} entries.`);
        return this.tcidToIdCache;
    }
    async populateTestCasesByTitle() {
        this.tcidToIdCache = {};
        let page = 1;
        while (true) {
            try {
                const response = await this.client.get(`/test-runs/${this.testRunId}/test-results`, { params: { page, limit: 100 } });
                const data = response.data.results;
                if (!data || data.length === 0)
                    break;
                data.forEach(testCase => {
                    const idFromTitle = testCase.testCase.title.split("#C");
                    this.tcidToIdCache[idFromTitle[1]] = testCase.testCase.tcId;
                });
                page++;
            }
            catch (error) {
                console.error('Error populating cache:', error.message);
                throw error;
            }
        }
        console.log(`Cache populated with ${Object.keys(this.tcidToIdCache).length} entries.`);
        return this.tcidToIdCache;
    }
    async getRunDetails() {
        return this.fetchJson(`/test-runs/${this.testRunId}`);
    }
    async getCasesDetails(page = 1, limit = 100) {
        return this.fetchJson(`/test-runs/${this.testRunId}/test-results`, { page, limit });
    }
    async getSummary() {
        return this.fetchJson(`/test-runs/${this.testRunId}/summary`);
    }
    async patchResult(testInfo) {
        const status = testInfo.status.toLowerCase();
        const data = { "status": status, "actualResult": "", "notes": "" };
        const title = testInfo.title;
        const cases = title.split('-')[0].split(',');
        for (const id of cases) {
            try {
                const response = await this.client.patch(`/test-runs/${this.testRunId}/test-results/tcId/${id}`, data);
                return response.data;
            }
            catch (error) {
                console.error(`Error patching result ${id}:`, error.message);
            }
        }
    }
    async fetchJson(endpoint, params = {}) {
        try {
            const response = await this.client.get(endpoint, { params });
            return response.data;
        }
        catch (error) {
            console.error(`Error fetching ${endpoint}:`, error.message);
            throw error;
        }
    }
}
exports.default = AgentQStatusUpdater;
