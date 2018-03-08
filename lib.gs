// Load JavaScript from Google Drive
function loadJSFromGoogleDrive(id) {
  var rawJS = DriveApp.getFileById(id).getBlob().getDataAsString();
  eval(rawJS);
};

function doGet() {
  return HtmlService
      .createTemplateFromFile('index')
      .evaluate()
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

function includeFromGoogleDrive(id) {
  return "<script>" + DriveApp.getFileById(id).getBlob().getDataAsString() + "</script>";
}

function apiGetNews(param) {
  return ria.apiGetNews(param);
}

function apiGetRef(param) {
  return ria.apiGetRef(param);
}
function apiGetUserProfile(param) {
  return ria.apiGetUserProfile(param);
}