// Database abstraction layer for Barangay Sibulan
const db = {
    // Helper handle for responses
    async handleResponse(res) {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        return data;
    },

    // --- Authentication ---
    async login(username, password) {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return this.handleResponse(res);
    },

    async register(username, password, role, full_name = "") {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role, full_name })
        });
        return this.handleResponse(res);
    },

    // --- User Management (Para sa CpE Admin) ---
    async getUsers() {
        const res = await fetch('/api/users');
        return this.handleResponse(res);
    },

    async deleteUser(username) {
        const res = await fetch(`/api/users/${username}`, { method: 'DELETE' });
        return this.handleResponse(res);
    },

    async toggleUserRole(username) {
        const res = await fetch(`/api/users/${username}/role`, { method: 'PATCH' });
        return this.handleResponse(res);
    },

    async approveUser(username) {
        const res = await fetch(`/api/users/${username}/approve`, { method: 'PATCH' });
        return this.handleResponse(res);
    },

    // --- Requests ---
    async getRequests() {
        const res = await fetch('/api/requests');
        return this.handleResponse(res);
    },

    async addRequest(request) {
        const res = await fetch('/api/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });
        return this.handleResponse(res);
    },

    async updateRequestStatus(id, status) {
        const res = await fetch(`/api/requests/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        return this.handleResponse(res);
    },

    async deleteRequest(id) {
        const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' });
        return this.handleResponse(res);
    },

    // --- Officials ---
    async getOfficials() {
        const res = await fetch('/api/officials');
        return this.handleResponse(res);
    },

    async addOfficial(official) {
        const res = await fetch('/api/officials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(official)
        });
        return this.handleResponse(res);
    },

    async updateOfficial(id, official) {
        const res = await fetch(`/api/officials/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(official)
        });
        return this.handleResponse(res);
    },

    async deleteOfficial(id) {
        const res = await fetch(`/api/officials/${id}`, { method: 'DELETE' });
        return this.handleResponse(res);
    },

    // --- Settings / Footer ---
    async getFooter() {
        const res = await fetch('/api/settings');
        const data = await this.handleResponse(res);
        return Object.keys(data).length ? data : null;
    },

    async saveFooter(data) {
        const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return this.handleResponse(res);
    }
};