const crypto = require("crypto");
const processIdentifier = crypto.randomBytes(20).toString("hex");
const MAX_CONCURRENT_SAME_HOST_REQUESTS = parseInt(process.env.MAX_CONCURRENT_SAME_HOST_REQUESTS ?? "10");

// Singleton
class Queue {
	constructor(pool) {
		if (typeof pool != "object") {
			throw new Error(`The Queue constructor expects a Postgres Pool object, but received ${typeof pool}`);
		}

		this.pool = pool;
	}

	async add({ url, xml, priority }) {
		if (!priority) {
			priority = 1;
		}

		// Handle requests with multiple xml assertions by calling the add method individually for every xml
		if (Array.isArray(xml)) {
			for (const singleXml of xml) {
				await this.add({
					url: url,
					xml: singleXml,
					priority: priority
				});
			}
			return;
		}

		// Handle requests for multiple URLs by calling the add method individually for every requested URL
		if (Array.isArray(url)) {
			for (const singleUrl of url) {
				await this.add({
					url: singleUrl,
					tool: tool,
					priority: priority
				});
			}
			return;
		}

		if (!url || !xml || typeof url != "string" || typeof xml != "string") {
			throw new Error(`Invalid request: missing url and/or tool parameter: ${JSON.stringify({ url, xml, priority })}.`);
		}

		/*
         * If an unprocessed request for this exact URL & tool already exists, there is no need to duplicate it.
         * Just skip this request: both requesters will be notified when the existing is processed.
         */
		const existingRequest = await this.getUnprocessedMatchingRequest(url, xml);
		if (existingRequest) {
			// If the new request has a higher priority than the existing one, update the existing request to bump its priority.
			if (priority > existingRequest.priority) {
				await this.updateRequestPriority(existingRequest.id, priority);
			}

			return;
		}

		// Extract the hostname from the URL
		const hostname = (new URL(url)).hostname;

		// Insert the request in the database
		await this.pool.query(`
            INSERT INTO requests (url, hostname, tool, xml, priority) VALUES ($1, $2, $3, $4, $5)
        `, [url, hostname, "dom-pp", xml, priority]);
	}

	async getUnprocessedMatchingRequest(url, xml) {
		return null; // /!\ temporaire pour le développement
		const res = await this.pool.query(`
            SELECT *
            FROM requests
            WHERE completed_at IS NULL
            AND url = $1
            AND xml = $2
        `, [url, xml]);
		return res.rowCount > 0 ? res.rows[0] : null;
	}

	/**
	 * @param {string} url Base URL of the project. Every request that start with this URL will be returned.
	 * @returns {Promise<object[]>}
	 */
	async getRequestsMatchingUrl(url) {
		const res = await this.pool.query(`
            SELECT *
            FROM requests
            WHERE completed_at IS NULL
            AND url LIKE $1
        `, [url + "%"]);
		return res.rowCount > 0 ? res.rows : [];
	}

	async updateRequestPriority(requestId, newPriority) {
		await this.pool.query(`
            UPDATE requests
            SET priority = $1
            WHERE id = $2
        `, [newPriority, requestId]);
	}

	async next(currentUrl = null) {
		const data = [processIdentifier];
		const orderBys = [];
		/**
         * The base query prevents processing more than [MAX_CONCURRENT_SAME_HOST_REQUESTS] requests for the same website at once.
         * This often ends up slowing down the website's server in a very noticeable way, which ends up slowing the service for all.
		 *
		 * It also prevents single instance of the tools service from processing multiple requests to the same host at once, as this
		 * often affects performance as well (both locally on the browser, and remotely on the website's server due to session locks).
		 *
		 * Side note:
		 * Requests that have been "in progress" for more than 3 minutes are considered not started as they likely have failed.
		 * These are brought back in the queue automatically in the request below.
         */
		const baseQuery = `
            SELECT r.*
            FROM requests r
			LEFT JOIN requests sameHostRequest
				ON sameHostRequest.hostname = r.hostname
				AND sameHostRequest.id != r.id
				AND sameHostRequest.processed_at IS NOT NULL
				AND sameHostRequest.processed_at >= (CURRENT_DATE - interval '3 minutes')
				AND sameHostRequest.completed_at IS NULL
			LEFT JOIN requests sameHostSameProcessRequest
				ON sameHostSameProcessRequest.hostname = r.hostname
				AND sameHostSameProcessRequest.id != r.id
				AND sameHostSameProcessRequest.processed_at IS NOT NULL
				AND sameHostSameProcessRequest.processed_at >= (CURRENT_DATE - interval '3 minutes')
				AND sameHostSameProcessRequest.completed_at IS NULL
				AND sameHostSameProcessRequest.processed_by = $1
            WHERE R.processed_at IS NULL
			OR (R.completed_at IS NULL AND R.processed_at < (CURRENT_DATE - interval '3 minutes'))
			GROUP BY r.id
			HAVING COUNT(sameHostRequest.id) <= ${MAX_CONCURRENT_SAME_HOST_REQUESTS - 1}
			AND COUNT(sameHostSameProcessRequest.id) = 0`;

		// To speed up processing, same-page requests are prioritized as they prevent unnecessary page reloads
		if (currentUrl) {
			const urlParamName = "$" + (data.length + 1);
			orderBys.push(`CASE WHEN R.url = ${urlParamName} THEN 0 ELSE 1 END ASC`);
			data.push(currentUrl);
		}

		/**
         * @TODO: implement the queue's priority algorithm for premium/regular users.
         * Higher priority requests should be prioritized (processed first).
         * However, every N high-priority (2+) requests, X low-priority (1) request should be treated.
         * The N and X number for the algorithm should be environment variables, so it can be changed easily without issuing new commits.
         */
		orderBys.push("priority DESC");

		orderBys.push("received_at ASC");

		// Build and run the actual query
		const query = baseQuery + (orderBys ? (" ORDER BY " + orderBys.join(", ")) : "");
		const result = await this.pool.query(query, data);

		return result.rowCount ? result.rows[0] : null;
	}

	async markAsProcessing(requestId) {
		return await this.pool.query(`
            UPDATE requests
            SET processed_at = NOW(),
            processed_by = $1
            WHERE id = $2
        `, [processIdentifier, requestId]);
	}

	async markAsCompleted(requestId, processingTime) {
		return await this.pool.query(`
            UPDATE requests
            SET completed_at = NOW(),
            processing_time = $1
            WHERE id = $2
        `, [processingTime, requestId]);
	}

	async pendingCount() {
		const res = await this.pool.query(`
            SELECT COUNT(*) AS "count"
            FROM requests
            WHERE processed_at IS NOT NULL
            AND completed_at IS NULL
        `);
		return res.rows[0].count;
	}

	async nonAssignedCount() {
		const res = await this.pool.query(`
            SELECT COUNT(*) AS "count"
            FROM requests
            WHERE processed_at IS NULL
        `);
		return res.rows[0].count;
	}

	async getAverageProcessingTimes() {
		const timesByTool = {
			lowPriority: {},
			highPriority: {},
			average: {},
		};
		const lowPriorityResult = await this.pool.query(`
            SELECT tool, ROUND(AVG(processing_time)) AS processing_time, ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - received_at))) * 1000) AS completion_time
            FROM requests
            WHERE completed_at IS NOT NULL
            AND priority = 1
            GROUP BY tool
            LIMIT 10000;
        `);
		const highPriorityResult = await this.pool.query(`
            SELECT tool, ROUND(AVG(processing_time)) AS processing_time, ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - received_at))) * 1000) AS completion_time
            FROM requests
            WHERE completed_at IS NOT NULL
            AND priority > 1
            GROUP BY tool
            LIMIT 10000;
        `);
		const averageResult = await this.pool.query(`
            SELECT tool, ROUND(AVG(processing_time)) AS processing_time, ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - received_at))) * 1000) AS completion_time
            FROM requests
            WHERE completed_at IS NOT NULL
            GROUP BY tool
            LIMIT 10000;
        `);

		for (const row of lowPriorityResult.rows) {
			timesByTool.lowPriority[row.tool] = {
				processing_time: row.processing_time,
				completion_time: row.completion_time
			};
		}

		for (const row of highPriorityResult.rows) {
			timesByTool.highPriority[row.tool] = {
				processing_time: row.processing_time,
				completion_time: row.completion_time
			};
		}

		for (const row of averageResult.rows) {
			timesByTool.average[row.tool] = {
				processing_time: row.processing_time,
				completion_time: row.completion_time
			};
		}

		return timesByTool;
	}
}

let queueInstance = null;
/**
 * @returns {Queue}
 */
module.exports = (pool) => {
	if (!queueInstance) {
		queueInstance = new Queue(pool);
	}
	return queueInstance;
};
