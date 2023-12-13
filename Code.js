// TODO:
// - Create API to set key id
// - Use Spreadsheet as backend

const MANAGEMENT_API_URL = PropertiesService.getScriptProperties().getProperty('API_URL');

function doGet() {
    // Use Session.getActiveUser().getEmail()
    const template = HtmlService.createTemplateFromFile('Index');
    template.email = Session.getActiveUser().getEmail();
    const accessKey = getAccessKey();
    template.accessKey = accessKey?.accessUrl || '';
    template.bytes30d = getBytes30d();
    const htmlContent = template.evaluate();
    htmlContent.addMetaTag('viewport', 'width=device-width, initial-scale=1');
    return htmlContent;
}

// For API details, see https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/Jigsaw-Code/outline-server/master/src/shadowbox/server/api.yml
function apiFetch(path, options) {
  return UrlFetchApp.fetch(`${MANAGEMENT_API_URL}/${path}`, {
    muteHttpExceptions: true,
    headers: {"ngrok-skip-browser-warning": "skip"},
    ...options
  });
}

function getUserId() {
  return PropertiesService.getUserProperties().getProperty('USER_ID');
}

function getAccessKey() {
  const id = getUserId();
  if (!id) {
    return undefined;
  }
  const cache = CacheService.getUserCache();
  let keyStr = cache.get("USER_KEY");
  if (keyStr) {
    try {
      return JSON.parse(keyStr);
    } catch {
      cache.remove("USER_KEY");
    }
  }
  // https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/Jigsaw-Code/outline-server/master/src/shadowbox/server/api.yml#tag/Access-Key/paths/~1access-keys/get
  const response = apiFetch('access-keys', {method: 'get'});
  const responseJson = JSON.parse(response.getContentText());
  for (key of responseJson.accessKeys) {
    if (key.id === id) {
      cache.put("USER_KEY", JSON.stringify(key), 21600);
      return key;
    }    
  }
  return undefined;
}

function getBytes30d() {
    const keyId = getUserId();
    const response = apiFetch('metrics/transfer', {method: 'get'});

    if (response.getResponseCode() != 200) {
      return -1
    }
    const usage = JSON.parse(response.getContentText()).bytesTransferredByUserId;
    return usage[keyId] ?? 0;
}

function deleteUserKey() {
    const keyId = getUserId();
    // https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/Jigsaw-Code/outline-server/master/src/shadowbox/server/api.yml#tag/Access-Key/paths/~1access-keys~1%7Bid%7D/delete
    const response = apiFetch(`access-keys/${keyId}`, {method: 'delete'});
    if (response.getResponseCode() === 200 || response.getResponseCode() === 404) {
      PropertiesService.getUserProperties().deleteProperty('USER_ID');
      CacheService.getUserCache().remove('USER_KEY');
    }
}

function createUserKey() {
    // TODO: Use LockService
    const lock = LockService.getUserLock();
    lock.waitLock(5000);
    try {
      // https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/Jigsaw-Code/outline-server/master/src/shadowbox/server/api.yml#tag/Access-Key/paths/~1access-keys/post
      const response = apiFetch('access-keys', {method: 'post'});
      const keyStr = response.getContentText();
      const keyObj = JSON.parse(keyStr);

      if (keyObj) {
          PropertiesService.getUserProperties().setProperty('USER_ID', keyObj.id);
          CacheService.getUserCache().put("USER_KEY", keyStr, 21600);
          return keyObj.accessUrl;
      } else {
          throw new Error('Failed to create access key');
      }
    } finally {
      lock.releaseLock();
    }
}
