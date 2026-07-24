const BASE_URL = "https://api.kadanza.io/platform/v1/api/extensions/grafx";

export async function getTemplateTranslationKeys(template, tenant, auth, page = 1) {
    const result = {
        "content": [],
        "currentPage": 0,
        "totalPages": 0,
        "status": 0
    };
    const url = encodeURI(`${BASE_URL}/template-keys?templates.id%5B0%5D=${template}&translations=true&search=&page=${page}&itemsPerPage=100`);

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${auth}`,
            "x-tenant": tenant
        }
    });
    result.status = response.status;
    if (response.ok) {
        const respJson = await response.json();
        result.content = respJson["hydra:member"];
        result.currentPage = respJson["hydra:currentPage"];
        result.totalPages = respJson["hydra:totalPages"];
    }
    return result;
}

export async function patchTranslationKey(keyId, value, tenant, auth, locale = "en-US") {
    const result = {
        "status": 0
    };
    const url = encodeURI(`${BASE_URL}/template-keys/${keyId}`);
    const data = { "translations": {} };
    data.translations[locale] = {
        "locale": locale,
        "value": value
    };

    const response = await fetch(url, {
        method: "PATCH",
        headers: {
            "Authorization": `Bearer ${auth}`,
            "x-tenant": tenant,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    result.status = response.status;

    return result;
}