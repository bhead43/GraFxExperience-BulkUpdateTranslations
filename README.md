## Setup
Fill out `config.json` as follows:  
```
{
    "token": {liveExperienceBearerToken},
    "tenant": {experienceTenantName},
    "templateId": {experienceTemplateId},
    "templateName": {templateJSONFileName}
}
```
You can steal a token + the tenant name from outgoing network requests while logged into a GraFx Experience environment. The tenant will be the value of the `x-tenant` request header.  
`templateName` just needs to be the file name (minus the extension) of the GraFx Studio template JSON you want to pull variable display labels from.  

Then, place your template JSON file in the `input` folder.  

## To run
Open a terminal at the folder you downloaded the repo to, then run `node index.js`.
