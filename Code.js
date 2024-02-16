// TODO:
// - Create API to set key id
// - Use Spreadsheet as backend

const MANAGEMENT_API_URL = PropertiesService.getScriptProperties().getProperty('API_URL');
const TOKEN_SECRET = PropertiesService.getScriptProperties().getProperty('TOKEN_SECRET');
const SERVER_NAME = PropertiesService.getScriptProperties().getProperty('SERVER_NAME');

function doGet(e) {
    if (e.parameter?.deviceToken) {
      return serveDynamicKey(e.parameter?.deviceToken)
    }
    return serveHome();
}

function serveHome() {
    const template = HtmlService.createTemplateFromFile('Index');
    const htmlContent = template.evaluate();
    htmlContent.addMetaTag('viewport', 'width=device-width, initial-scale=1');
    return htmlContent;
}

function createDeviceKey() {
  const deviceId = Utilities.getUuid();
  const now = new Date();
  const encodedPayload = Utilities.base64EncodeWebSafe(JSON.stringify({
    "sub": deviceId,
    "iat": now.valueOf(),
    "exp": now.setMonth(now.getMonth() + 1).valueOf(),
  }));
  const signature = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(encodedPayload, TOKEN_SECRET)
  );
  const deviceToken = encodedPayload + '.' + signature;
  const deviceKey = `${ScriptApp.getService().getUrl()}?deviceToken=${deviceToken}#${encodeURIComponent(SERVER_NAME)}`.replace(/^https:/, 'ssconf:');
  return deviceKey;
}

function serveDynamicKey(deviceToken) {
  // const token = "eyJzdWIiOiI3Yzc3N2ZjMC0zYTFkLTQ1YTItYWE2NC1hOWYzY2QwM2I1NTUiLCJpYXQiOjE3MDc4OTA1NDIzODMsImV4cCI6MTcxMDM5MjU0MjM4M30=.hgofD3_Nufeb2Pp3_rAvgPxUg-EwxxqTzO6U3wBjU5o=";
  const parts = deviceToken.split('.');
  if (parts.length !== 2) {
    throw new Error('The token is invalid: bad format');
  }
  const [encodedPayload, presentedSignature] = parts;
  const expectedSignature = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(encodedPayload, TOKEN_SECRET)
  );
  if (expectedSignature != presentedSignature) {
    throw new Error('The token is invalid: bad signature');
  }
  const payloadBytes = Utilities.base64DecodeWebSafe(encodedPayload);
  const payload = JSON.parse(Utilities.newBlob(payloadBytes).getDataAsString())
  Logger.log(payload);
  if (Date.now() >= payload.exp) {
    throw new Error('The token is invalid: expired');
  }
  const deviceId = payload.sub;

  // Use lock to make sure deletions + creation is atomic.
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  var responseText
  try {
    try {
      apiFetch('access-keys/' + deviceId, {method: 'delete'});
    } catch {}
    // https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/Jigsaw-Code/outline-server/master/src/shadowbox/server/api.yml#tag/Access-Key/paths/~1access-keys/put
    const response = apiFetch('access-keys/' + deviceId, {method: 'put'});
    responseText = response.getContentText();
  } finally {
    lock.releaseLock();
  }
  const keyObj = JSON.parse(responseText);
  const sessionKey = keyObj.accessUrl;
  return ContentService.createTextOutput(sessionKey).setMimeType(ContentService.MimeType.TEXT);
}

// For API details, see https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/Jigsaw-Code/outline-server/master/src/shadowbox/server/api.yml
function apiFetch(path, options) {
  return UrlFetchApp.fetch(`${MANAGEMENT_API_URL}/${path}`, {
    muteHttpExceptions: true,
    headers: {"ngrok-skip-browser-warning": "skip"},
    ...options
  });
}

