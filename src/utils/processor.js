const puppeteer = require("puppeteer");
const queue = require("./queue")();
const browserManager = require("./browserManager")();
const Notify = require("./notify");
const validator = new (require("@koalati/results-validator"))();
const Sentry = require("@sentry/node");
const Blockly = require("blockly");
const blocks = require("../../blocks/main.js");
//const dompp = require("@fdmln/dom-pp-test/dist/index.umd.cjs");

module.exports = class Processor {
	constructor(processorManager = null) {
		const instance = this;

		this.ready = false;
		this.page = null;
		this.browserContext = null;
		this.previousRequest = null;
		this.activeRequest = null;
		this.consoleMessages = browserManager.getConsoleMessageCollectionTemplate();
		this.manager = processorManager;

		browserManager.launchPage().then(({ page, context }) => {
			instance.init(page, context);
		}).catch(error => {
			if (error.message.indexOf("maximum load is reached") != -1) {
				console.warn("The browser manager has reached max load.");
				return;
			}

			throw error;
		});
	}

	init(page, context) {
		if (this.ready) {
			return;
		}

		this.ready = true;
		this.page = page;
		this.browserContext = context;
		browserManager.initConsoleMessageCollection(page, this.consoleMessages);
		this.processNextRequest();
	}

	isBusy() {
		return !this.isReady || !!this.activeRequest;
	}

	async processNextRequest() {
		/*
         * Get the next testing request.
         * If none is pending, destroy the processor.
         * Another one will be created when it is needed.
         */
		const request = await queue.next(this.previousRequest ? this.previousRequest.url : null);
		if (!request) {
			this.selfDestroy();
			return;
		}

		const sentryTransaction = Sentry.startTransaction({
			op: "request",
			name: request.tool,
			data: {
				request
			}
		});
		this.activeRequest = request;

		// Mark the request as being processed to prevent other processors from processing it
		await queue.markAsProcessing(request.id);
		const processingStartTime = Date.now();
		console.log(`Request ${request.id} is now being processed... (${request.tool} for ${request.url})`);

		try {
			/**
             * @TODO: Check if the previous request's tool is destructive, and reload the page if it is.
             * The page should also be reloaded if the previous request resulted in an error, as the cleanup process might not have been executed.
             */
			if (!this.previousRequest || this.previousRequest.url != request.url) {
				// Reset console messages
				this.consoleMessages = browserManager.getConsoleMessageCollectionTemplate();

				// Load the request's page
				await browserManager.loadUrlWithRetries(this.page, request.url);
				await this.page.addScriptTag({ path: require.resolve("@fdmln/dom-pp-test/dist/index.umd.js") });
			}
		} catch (error) {
			return this.failRequest(error.message);
		}


		// Prepare the data that will be provided to the tool
		const availableData = {
			page: this.page,
			consoleMessages: this.consoleMessages,
			devices: puppeteer.devices
		};

		var workspace = new Blockly.Workspace();

		var xml = Blockly.Xml.textToDom(request.xml);
		Blockly.Xml.domToWorkspace(xml, workspace);

		var code = Blockly.JavaScript.workspaceToCode(workspace);
		
		console.log("Code : \n" + code);
		eval(code);

		// Run the tool
		let jsonResults = null;

		const successResponse = await this.completeRequest(jsonResults, Date.now() - processingStartTime);
		sentryTransaction.finish();

		return successResponse;
	}

	async failRequest(errorMessage, errorData = null) {
		const request = Object.assign({}, this.activeRequest);

		this.previousRequest = request;
		this.activeRequest = null;

		await queue.markAsCompleted(request.id, null);
		Notify.requestError(request, errorMessage);
		Notify.developerError(request, errorMessage, errorData);

		console.error(`Request ${request.id} failed: ${errorMessage} : ${JSON.stringify(errorData)}\n`);

		this.processNextRequest();
	}

	async completeRequest(jsonResults, processingTime) {
		const request = Object.assign({}, this.activeRequest);

		this.previousRequest = request;
		this.activeRequest = null;

		await queue.markAsCompleted(request.id, processingTime);
		Notify.requestSuccess(request, JSON.parse(jsonResults), processingTime);

		console.log(`Request ${request.id} completed successfully in ${processingTime} ms (${request.tool} for ${request.url})\n`);

		this.processNextRequest();
	}

	selfDestroy() {
		if (this.manager) {
			this.manager.kill(this);
		}
	}

	destroy() {
		if (this.browserContext) {
			this.browserContext.close();
		}
	}
};
