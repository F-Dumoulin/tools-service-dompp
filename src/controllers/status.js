const queue = require("../utils/queue")();

module.exports = {
	up: (req, res) => {
		const responseBody = {
			success: true,
			uptime: process.uptime(),
		};

		res.send(responseBody);
	},

	queue: async (req, res) => {
		const responseBody = {
			success: true,
			message: "",
			data: {
				unassignedRequests: await queue.nonAssignedCount(),
				pendingRequests: await queue.pendingCount(),
			},
		};

		res.send(responseBody);
	},

	timeEstimates: async (req, res) => {
		const responseBody = {
			success: true,
			message: "",
			data: null,
		};

		try {
			const timesByTool = await queue.getAverageProcessingTimes();
			responseBody.data = timesByTool;
		} catch (error) {
			responseBody.success = false;
			responseBody.message = "The average processing times could not be obtained.";
		}

		res.send(responseBody);
	},

	/**
	 * Returns the processing status and progress for a specified URL
	 */
	project: async (req, res) => {
		const responseBody = {
			success: true,
			message: "",
			data: {
				pending: false,
				requestCount: null,
				timeEstimate: null,
			},
		};

		if (typeof req.query.url == "undefined") {
			res.send({
				success: false,
				message: "Missing `url` GET parameter."
			});
			return;
		}

		const projectUrl = req.query.url;
		const pendingRequests = await queue.getRequestsMatchingUrl(projectUrl);
		responseBody.data.pending = pendingRequests.length > 0;
		responseBody.data.requestCount = pendingRequests.length;

		// Check if an estimated time can be calculated
		try {
			const timesByTool = (await queue.getAverageProcessingTimes()).average;
			let estimatedTime = 0;

			for (const request of pendingRequests) {
				const toolEstimates = timesByTool[request.tool] || {};
				let timeEstimateForRequest = toolEstimates.processing_time || 3000;

				if (request.processed_at) {
					const msSinceStart = (new Date()).getTime() - (new Date(request.processed_at)).getTime();
					timeEstimateForRequest -= msSinceStart;
				}

				estimatedTime += Math.max(timeEstimateForRequest, 1000);
			}

			responseBody.data.timeEstimate = estimatedTime;
		} catch (error) {
			responseBody.message = "The estimated processing time could not be obtained.";
		}

		res.send(responseBody);
	}
};
