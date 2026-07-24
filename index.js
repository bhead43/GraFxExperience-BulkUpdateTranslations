import { readFile } from "fs/promises";
import { existsSync } from "fs";
import * as web from "./web.js";
import * as utils from "./utils.js";

const main = async () => {
    // read config data
    const config = JSON.parse(await readFile("./config.json", "utf-8"));
    const errorLogName = `${config.templateId}_${new Date(Date.now())}`;
    const cacheTranslationName = `${config.templateId}_translations.json`;

    // gather variable labels from template JSON
    const variableLabels = await utils.getVariableLabels(`${config.templateName}.json`);

    // gather all translation keys associated with input template
    let translationPages = [];

    if(existsSync(`./out/${cacheTranslationName}`)) {
        const cachedData = JSON.parse(await readFile(`./out/${cacheTranslationName}`, "utf-8"));
        translationPages = cachedData.items;
    } else {
        let isRunning = true;
        let currentPage = 0;
        do {
            currentPage++;
            console.log(`Getting page ${currentPage} of template translation keys...`);
            const translationsResponse = await web.getTemplateTranslationKeys(config.templateId, config.tenant, config.token, currentPage);
            if (translationsResponse.status !== 200) {
                throw new Error("Get translation keys request failed!");
            }
            translationPages.push(translationsResponse.content);

            if(currentPage === 1) {
                console.log(`Found ${translationsResponse.totalPages} total pages...`);
            }
            // check if current page is the same as total pages
            if (currentPage >= translationsResponse.totalPages) {
                isRunning = false;
            }
        } while (isRunning);
        console.log("Finished populating translationPages!");

        await utils.cacheTranslationPages(cacheTranslationName, translationPages);
    }

    // for each variableLabel, find the corresponding Experience translation key and patch its value
    //  - using standard for loop to make it much easier to process one variable label at a time
    //      in order to not overwhelm Kadanza servers
    for (let i = 0; i < variableLabels.length; i++) {
        const experienceKeyId = utils.tryFindKey(
            variableLabels[i].name,
            translationPages
        );
        if (experienceKeyId === null) {
            const errorMessage = `Could not find key by name: ${variableLabels[i].name}`;
            await utils.writeToErrorLog(errorLogName, errorMessage);
        } else {
            const translationPatchResponse = await web.patchTranslationKey(experienceKeyId, variableLabels[i].label, config.tenant, config.token);
            if (translationPatchResponse.status !== 200) {
                const errorMessage = `Failed to patch translation key at ID: ${experienceKeyId}\n\tAttempted to patch value to: ${variableLabels[i].label}`;
                await utils.writeToErrorLog(errorLogName, errorMessage);
            }
            // wait half a second between each patch
            await new Promise(r => setTimeout(r, 500));
        }
    }
    console.log("All done!");
};

// test run, where nothing will actually get patched
const dryRun = async () => {
    const BASE_URL = "https://api.kadanza.io/platform/v1/api/extensions/grafx";
    const locale = "en-US";
    // read config data
    const config = JSON.parse(await readFile("./config.json", "utf-8"));
    const errorLogName = `${config.templateId}_${new Date(Date.now())}`;
    const cacheTranslationName = `${config.templateId}_translations.json`;
    // gather variable labels from template JSON
    const variableLabels = await utils.getVariableLabels(`${config.templateName}.json`);

    // gather all translation keys associated with input template
    let translationPages = [];

    if(existsSync(`./out/${cacheTranslationName}`)) {
        const cachedData = JSON.parse(await readFile(`./out/${cacheTranslationName}`, "utf-8"));
        translationPages = cachedData.items;
    } else {
        let isRunning = true;
        let currentPage = 0;
        do {
            currentPage++;
            console.log(`Getting page ${currentPage} of template translation keys...`);
            const translationsResponse = await web.getTemplateTranslationKeys(config.templateId, config.tenant, config.token, currentPage);
            if (translationsResponse.status !== 200) {
                throw new Error("Get translation keys request failed!");
            }
            translationPages.push(translationsResponse.content);

            if(currentPage === 1) {
                console.log(`Found ${translationsResponse.totalPages} total pages...`);
            }
            // check if current page is the same as total pages
            if (currentPage >= translationsResponse.totalPages) {
                isRunning = false;
            }
        } while (isRunning);
        console.log("Finished populating translationPages!");

        await utils.cacheTranslationPages(cacheTranslationName, translationPages);
    }
    for (let i = 0; i < 50; i++) {
        const experienceKeyId = utils.tryFindKey(
            variableLabels[i].name,
            translationPages
        );
        if (experienceKeyId === null) {
            const errorMessage = `Could not find key by name: ${variableLabels[i].name}`;
            await utils.writeToErrorLog(errorLogName, errorMessage);
        } else {
            console.log(`\nMatched ${variableLabels[i].name} to ${experienceKeyId}!`);
            const data = { "translations": {} };
            data.translations[locale] = {
                "locale": locale,
                "value": variableLabels[i].label
            };
            console.log(`Patching with following details:\n\tendpoint: ${BASE_URL}/template-keys/${experienceKeyId}\n\tbody content: ${JSON.stringify(data)}`);
            // wait half a second between each patch
            await new Promise(r => setTimeout(r, 500));
        }
    }

    console.log("\nAll done!");
}

await main()