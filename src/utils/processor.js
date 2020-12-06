const puppeteer = require('puppeteer');
const queue = require('./queue')();
const browserManager = require('./browserManager')();
const validator = new (require('@koalati/results-validator'))();

module.exports = class Processor {
    constructor(processorManager = null) {
        const instance = this;

        this.ready = false;
        this.page = null;
        this.browserContext= null;
        this.previousRequest = null;
        this.activeRequest = null;
        this.consoleMessages = browserManager.getConsoleMessageCollectionTemplate();
        this.manager = processorManager;

        browserManager.launchPage().then(({ page, context }) => {
            instance.init(page, context);
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

        this.activeRequest = request;

        // Mark the request as being processed to prevent other processors from processing it
        await queue.markAsProcessing(request.id);
        const processingStartTime = Date.now();

        // @TODO: Check if the previous request's tool is destructive, and reload the page if it is.
        if (!this.previousRequest || this.previousRequest.url != request.url) {
            // Reset console messages
            this.consoleMessages = browserManager.getConsoleMessageCollectionTemplate();

            // Load the request's page
            await browserManager.loadUrlWithRetries(this.page, request.url);
        }

        // Prepare the data that will be provided to the tool
        const availableData = {
            page: this.page,
            consoleMessages: this.consoleMessages,
            devices: puppeteer.devices
        };

        // Run the tool
        let jsonResults = null;
        try {
            const toolClass = require(request.tool);
            const toolInstance = new toolClass(availableData);
            await toolInstance.run();
            const validationErrors = validator.checkResults(toolInstance.results)

            if (validationErrors.length) {
                return this.failRequest("The tool's results were invalid. This error will be reported to the tool's developer automatically.", validationErrors);
            }

            jsonResults = JSON.stringify(toolInstance.results);
            await toolInstance.cleanup();
        } catch (error) {
            if (!jsonResults) {
                // @TODO: Implement a way to notify the tool's developer without failing the request if an error occurs in the cleanup process
                return this.failRequest("An error has occured while running the tool on your page. This error will be reported to the tool's developer automatically.", error);
            }
        }

        return this.completeRequest(jsonResults, Date.now() - processingStartTime);
    }

    failRequest(errorMessage, errorData = null) {
        const request = Object.assign({}, this.activeRequest);

        this.previousRequest = request;
        this.activeRequest = null;
        queue.markAsCompleted(request.id, null);

        console.error(`Request ${request.id} failed:`, errorData);

        this.processNextRequest();
    }

    completeRequest(jsonResults, processingTime) {
        const request = Object.assign({}, this.activeRequest);

        this.previousRequest = request;
        this.activeRequest = null;
        queue.markAsCompleted(request.id, processingTime);
        this.processNextRequest();

        // @TODO: Submit the results to the websocket server
        console.log(`Request ${this.previousRequest.id} completed successfully!`);
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
}
