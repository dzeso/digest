var RIA_URL_PREFIX = 'ria.ru',
    RIA_URL_POSFIX = '.html',
    RIA_SOURCE_ID = 1;

var REFERENCE_TAG_TYPES = ['undefined', 'event','location', 'person', 'organization'],
    REFERENCE_SOURCE = ['ria'],
    REFERENCE_STATUS = ['загружена'],
    REFERENCE_STATUS_LOADED = 1;

var CODE_UNSUPPORTED_TYPE_ARTICLE = 100,
    CODE_CORRECT_ARTICLE = 200,
    CODE_UNCORRECT_ARTICLE = 201,
    CODE_SAVE_SUCCESSFULLY = 300,
    CODE_SAVE_FAILD = 301;

var ROW_DELIMITER = '\u0001',
    FIELD_DELIMITER = '\u0002';

var TIME_ZONE = getTimeZone();

var CACHE_EXPIRATION_TIME = 600,
    CACHE_MAX_TIME = 2000, // 21600
    CACHE_MODE = true,
    CACHE_TAG_BY_SYNONYM = 'tbs_',
    CACHE_TAG_TYPE_ID = 'tti_',
    CACHE_RUBRIC_BY_SYNONYM = 'rbs_',
    CACHE_NEWS_ID_BY_KEY = 'nbk_',
    CACHE_NEWS_BY_ID = 'nbi_',
    CACHE_NEWS_BY_DATE = 'nbd_';
    
var UPLOAD_PERIOD_MAX = 2; // 50 дней


var TEST_STOP_WEB_LOAD = false,
    TEST_STOP_SQL_COMMIT = false,
    TEST_STOP_SQL_EXEC = false;

var RETURN_GENERATED_KEYS = 1;

var LOG_EVENT_TEST = 0,
    LOG_EVENT_INFO = 1;

function runTests() { 
  
  initRefTables();
  runTest_lib();
  runTest_parse();
  runTest_xml_parsing:
  runTest_scraping();
  runTest_reference();
  runTest_test();
  runTest_sql();
  runTest_get_data();
  runTest_save_data();
  
}

// TODO сделать либу для подключения либ
// Credit Brian @github
var LIBRARIES = {
  he:  "he",
}

Object.keys(LIBRARIES).forEach(function(library) {
  newFunc = loadJSFromHTMLFile(LIBRARIES[library]);
  eval('var ' + library + ' = ' + newFunc);  
});

function loadJSFromHTMLFile(file) {
  eval(HtmlService.createTemplateFromFile(file).getRawContent());  
 }

//function loadJSFromUrl(url) {
//  return eval(UrlFetchApp.fetch(url).getContentText());
//}