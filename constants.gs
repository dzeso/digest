function runTests() { 
  
//  initRefTables();
  runTest_lib();
  runTest_lib_lodash();
  runTest_parse();
  runTest_xml_parsing:
  runTest_scraping();
  runTest_get_reference();
  runTest_save_reference();
  runTest_test();
  runTest_sql();
  runTest_get_news();
  runTest_save_news();
  runTest_api_get_data();
  runTest_user_profile();
  runTest_comments();
  runTest_auth();
}

function RIA(param) {
  switch(param) {
    case "URL_PREFIX": return 'ria.ru';
    case "URL_POSFIX": return '.html';
    case "SOURCE_ID": return 1;
  }     
};

function REFERENCE(param) {
  switch(param) {
    case "TAG_TYPES": return ['undefined', 'event','location', 'person', 'organization', 'product'];
    case "SOURCE": return ['ria'];
    case "STATUS": return ['загружена'];
    case "STATUS_LOADED": return 1;
  }     
};

function CODE_RESULT(param) {
  switch(param) {
    case "CORRECT_ARTICLE": return 200;
    case "SAVE_SUCCESSFULLY": return 300;
    case "SAVE_SKIPED": return 301;
    case "UPDATE_SUCCESSFULLY": return 302;
    case "SAVE_FAILED": return 320;
    case "UPDATE_FAILED": return 321;
  }     
};

function CACHE(param) {
  switch(param) {
    case "EXPIRATION_TIME": return 600;
    case "EXPIRATION_NEW_KEY_TIME": return 60*10;
    case "MAX_TIME": return 2000; // 21600
    case "MODE": return true;
    case "TAG_BY_SYNONYM": return 'tbs_';
    case "RUBRIC_BY_SYNONYM": return 'rbs_';
    case "NEWS_ID_BY_KEY": return 'nbk_';
    case "NEWS_BY_ID": return 'nbi_';
    case "NEWS_BY_DATE": return 'nbd_';
    case "NEWS_LIST_BY_DATE": return 'nlbd_';
    case "REF_BY_NAME": return 'rfbn_';
    case "USER_PROFILE_BY_KEY": return 'upbk_';
    case "USER_KEY_BY_USERID": return 'ukbi_';
    case "USER_PROFILE_BY_PIN": return 'upbp_';
    case "USER_ABILITIES_BY_USERID": return 'uabi_';
      
  }     
};

function CONST(param) {
  switch(param) {
    case "UPLOAD_PERIOD_MAX": return 2; // 50 дней
    case "TIME_ZONE": return getTimeZone();
  }     
};


function TEST(param) {
  switch(param) {
    case "STOP_WEB_LOAD": return false;
    case "STOP_SQL_COMMIT": return false;
    case "STOP_SQL_EXEC": return false;
  }     
};


function SQL_CONST(param) {
  switch(param) {
    case "RETURN_GENERATED_KEYS": return 1;
  }     
};

function  LOG_EVENT(param) {
  switch(param) {
    case "INFO": return 1; // todo пчему этот код не иcпользуется?
    case "UNSUPPORTED_TYPE_ARTICLE": return 2;
    case "UNCORRECT_ARTICLE": return 3;
    case "ERROR_SAVING": return 50;
    case "ERROR_PARSING": return 51; // todo пчему этот код не сипользуется? Где ошибка парсинга?
    case "ERROR_ITEM_DONT_FIND_IN_REF": return 52;
    case "USER_USER_NOT_FOUND": return 1;      
    case "USER_SERVER_KEY_DONT_MATCH": return 2;      
    case "USER_SENT_EMAIL": return 3;
    case "USER_SET_NEW_KEY": return 4;
    case "USER_SET_NEW_KEY_FAILED": return 5;
    case "USER_LOGIN": return 6;   
    case "USER_KEY_DONT_MATCH": return 7;   
    case "USER_UNAUTHORIZED_API_CALL": return 8;   
    case "TEST": return 0;
  }     
};

// Load JavaScript from Google Drive
function loadJSFromGoogleDrive(id) {
  var rawJS = DriveApp.getFileById(id).getBlob().getDataAsString();
  eval(rawJS);
};

var EXTERNAL_LIB = {
  lodash:  "1OCxRQFdnwyiVpzWltvu0IVzHtRRydyBR",
  he: "1ptaGtPmYryqm7Coahgv2LclDNaFo83DS"
};
  
Object.keys(EXTERNAL_LIB).forEach(function(library) {
  newFunc = loadJSFromGoogleDrive(EXTERNAL_LIB[library]);
  eval('var ' + library + ' = ' + newFunc);  
});