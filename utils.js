import { readFile, writeFile, appendFile } from "fs/promises";
import { existsSync } from "fs";

// attempt to get the ID of a given key by the value
//  - will return null if keyPath isn't found
export function tryFindKey(keyPath, data) {
    const numPages = data.length;
    let keyEntry = null;
    let isSearching = true;
    let currentPage = 0;
    do {
        keyEntry = data[currentPage].find((item) => item.path === keyPath);
        currentPage++;
        if (keyEntry || currentPage >= numPages) {
            isSearching = false;
        }
    } while (isSearching);
    return keyEntry ? keyEntry.id : null;
}

// format input string to Experience translation key path
//  - i.e. "Country (Impulse)/label" should become "Country+%28Impulse%29/label"
//  - can mostly get there with escape() it seems like, just need to manually replaces " " with "+" first
export function formatToKeyPath(input) {
    let formattedPath = input.replaceAll(" ", "+");
    return escape(formattedPath);
}

// pull all variables out of document JSON, and return their display names
//  - For list variables, also pull out listItem labels for each
export async function getVariableLabels(inputFileName) {
    const templateJSON = JSON.parse(await readFile(`./input/${inputFileName}`, "utf-8"));
    const templateVars = templateJSON.variables;

    const result = [];
    templateVars.forEach(variable => {
        const currentVar = {
            "name": `${formatToKeyPath(variable.name)}/label`,
            "label": variable.label
        };
        result.push(currentVar);
        // if this is a list variable: go through each item as well
        if (variable.type === "list") {
            const listItems = variable.items;

            listItems.forEach(listItem => {
                const currentListItem = {
                    "name": `${formatToKeyPath(variable.name)}/listItems/${listItem.value}`,
                    "label": listItem.displayValue
                };
                result.push(currentListItem);
            });
        }
    });
    return result;
}

export async function writeToErrorLog(errorLogName, content) {
    if(!existsSync(`./out/${errorLogName}`)) {
        await writeFile(`./out/${errorLogName}`, content + '\n');
    } else {
        await appendFile(`./out/${errorLogName}`, content + '\n');
    }
}

export async function cacheTranslationPages(fileName, content) {
    if(!existsSync(`./out/${fileName}`)) {
        const data = {};
        data.items = content;
        await writeFile(`./out/${fileName}`, JSON.stringify(data));
    }
}