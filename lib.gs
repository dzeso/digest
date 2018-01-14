function runTest_lib() { 
  
  runTest('isDialog');
  runTest('getKeyFromLink');
  runTest('getDateInNewsFormat');
  runTest('cleanDateForLink');
  
//  работа с веб
  
  runTest('getPageByUrl');
  runTest('cleanWebLink');
  runTest('cleanHtmlForParsing');
  runTest('removeHttpEntities');
  
//  работа с датами
  
  runTest('getTimeZone');
  runTest('getDaysLag');
  runTest('getDatesListLag');
  runTest('getDateShif');
  runTest('isToday');
  
  //  работа с преобразованием типов
  
  runBlockTests(['isNumber'
                ]); 
  
  //  работа с кешем
  
  runBlockTests(['getCache',
                 'getCacheObject',
                 'getCacheId',
                 'setCache',
                 'setCacheObject',
                 'setCacheId'
                ]); 
}

function getCache(key) {
  if (!CACHE_MODE) {
    return null;
  }
  var cache = CacheService.getScriptCache();
  return cache.get(key);
}

function getCacheId(key) {
  var id = getCache(key);
  if (isNumber(id)) id = +id;
  else id = null;
  return id;
}

function getCacheObject(key) {
  var value = getCache(key);
  try {
    var obj = value ? JSON.parse(value) : null;
    return obj;
  }
  catch(error) {
    return null;
  }
}

function setCacheId(data) {
  if (isNumber(data.value)) setCache(data);
  else return null;
  return +data.value;
}

function setCacheObject(data) {
  // todo в дальнейшем нужен переход на вариант с учетом размера кешируемого значения. Пока 
  // считаем, что оно не больше 100 кб, но для кеша поиска это явно будет мало
  if (typeof data.value === 'object') {
    data.value = JSON.stringify(data.value);
    setCache(data);
  }
  else return null;
  return data.value;
}

function setCache(data) {
  if (!CACHE_MODE) {
    return data;
  }
  var cache = CacheService.getScriptCache(), 
      sec = 0;
  ("time" in data) ? sec = data.time : sec = CACHE_EXPIRATION_TIME;
  cache.put(data.key, data.value, sec);
  return data.value;
}

function getCacheObject_test() {
  CACHE_MODE = 1;
  setCache({key: 'test', value: JSON.stringify({val1: '1', val2: '2'}), time: 100});
  setCache({key: 'test2', value: 'value 2', time: 100});
  setCache({key: 'nbd_2018-01-01', value: JSON.stringify([2,3,4]), time: 100});
  return runGroupTests(
    {name: 'getCacheObject',
     should: [[2,3,4], null ,null, {val1: '1', val2: '2'}],
     data: ['nbd_2018-01-01','test2', 'test3', 'test'],
     clean: 'CacheService.getScriptCache().remove(test.data[i])',
     compare: [
       "JSON.stringify(pattern) === JSON.stringify(result)"
     ]
    });
}

function setCacheObject_test() {
  return runGroupTests(
    {name: 'setCacheObject',
     should: [JSON.stringify({"val1":"1","val2":"2"}), null, JSON.stringify([2,3,4])],
     data: [
       {key: 'test', value: {"val1":"1","val2":"2"}, time: 100}, 
       {key: 'test2', value: 'value 2', time: 100},
       {key: 'test3', value: [2,3,4], time: 100}
     ],
     clean: 'CacheService.getScriptCache().remove(test.data[i].key)',
     compare: [
       "JSON.stringify(pattern) === JSON.stringify(result)"
     ]
    });
}

function getCacheId_test() {
  CACHE_MODE = 1;
  setCache({key: 'test', value: '1', time: 100});
  setCache({key: 'test2', value: 'value 2', time: 100});
  return runGroupTests(
    {name: 'getCacheId',
     should: [null ,null, 1],
     data: ['test3', 'test2', 'test'],
     clean: 'CacheService.getScriptCache().remove(test.data[i])'
    });
}

function setCacheId_test() {
  return runGroupTests(
    {name: 'setCacheId',
     should: [1, null, 2],
     data: [
       {key: 'test', value: 1, time: 100}, 
       {key: 'test2', value: 'value 2', time: 100},
       {key: 'test3', value: '2', time: 100}
     ],
     clean: 'CacheService.getScriptCache().remove(test.data[i].key)'
    });
}

function getCache_test() {
  CACHE_MODE = 1;
  setCache({key: 'test', value: 'value 1', time: 100});
  setCache({key: 'test2', value: 'value 2', time: 100});
  return runGroupTests(
    {name: 'getCache',
     should: ['value 1','value 2', null],
     data: ['test', 'test2', 'value 2'],
     clean: 'CacheService.getScriptCache().remove(test.data[i])'
    });
}

function setCache_test() {
  return runGroupTests(
    {name: 'setCache',
     should: ['value 1','value 2'],
     data: [
       {key: 'test', value: 'value 1', time: 10}, 
       {key: 'test2', value: 'value 2'}
     ],
     clean: 'CacheService.getScriptCache().remove(test.data[i].key)'
    });
}

function isDialog(sign) {
  
  var result = false;
  if (~'-–—'.indexOf(sign)) {
    result = true;
  }
  return result;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getPageByUrl(url) {
  var result = {text: '',
                code: 0
               },
      httpAnser;
  if (url === '') {
    return result;
  }
  
  httpAnser = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
  result.code = httpAnser.getResponseCode();
  (result.code === 200) ? result.text = httpAnser.getContentText() : result.text = '';
  
  return result;
}

function cleanHtmlForParsing(text) {
  if (!text) return text;
  var result = text.replace(/\r|\n|<br>|&/ig, ' ');
  result = result.replace(/<script.*?<\/script>/mig, '');
  result = result.replace(/<img.*?>/mig, '');
  result = result.replace(/<input.*?>/mig, '');
  result = result.replace(/<meta.*?>/mig, '');
  result = result.replace(/<link.*?>/mig, '');
  return result.trim();
}

function cleanWebLink(link) {
  if (!link) return link;
  var result = link.replace(/\?.*?$/ig, '').trim();
  (result[0] === '\/') ? result = RIA_URL_PREFIX + result : result = result.replace(/http:\/\/|https:\/\//ig, '');
  return result;
}

function removeHttpEntities(text) { 
  var result = he.decode(text);
  return result; 
}

function getKeyFromLink(link) { 
  if (!link) return link;
  var result = link.replace(/\.htm.$/ig, '').match( /\/\d+$/ );
  return (result === null ) ? '' : result[0].replace(/\D/g,''); 
}

function getTimeZone() {     
  var offsetTimeZone = new Date().getTimezoneOffset();
  var result = 'GMT' + ((offsetTimeZone > 0) ? '-' : '+') + Math.abs(offsetTimeZone/60);
  return result
}

function getDateInNewsFormat(date) {     
  var isDate = new Date (date);
  if (!isNaN(isDate.getTime())) {
    var result = 
        {date: Utilities.formatDate(isDate, TIME_ZONE, "yyyy-MM-dd"),
         time: Utilities.formatDate(isDate, TIME_ZONE, "HH:mm")};
    return result
  }
  return '';
}

function cleanDateForLink(date) { 
  return (date === undefined ) ? '' : date.replace(/\D/g,''); 
}

function isToday(date) { 
  return (Utilities.formatDate(new Date (date), TIME_ZONE, "yyyy-MM-dd") === Utilities.formatDate(new Date (), TIME_ZONE, "yyyy-MM-dd") ) ? true : false 
}

function isToday_test() {
  return runGroupTests(
    {name: 'isToday',
     should: [false, true],
     data: [ "2018-01-03", new Date ()]
    });
}

function getDateShif(param) {
  
  if (!param.date) return null;
  
  var result = new Date(param.date),
      shift = +param.shift ? +param.shift : 0;
  result.setDate(result.getDate() + shift);
  result = (isNaN(result.getTime())) ? null : Utilities.formatDate(result, TIME_ZONE, "yyyy-MM-dd"); 
  return result;
}

function getDateShif_test() {
  return runGroupTests(
    {name: 'getDateShif',
     should: ['2018-01-03', '2017-12-30', null, '2018-03-03', null],
     data: [{date: "2018-01-03"},
            {date: "2018-01-03", shift: -4},
            {date: "2018-13-03", shift: 4},
            {date: "2018-03-03", shift: 'q'},
            {}]
    });
}

function getDaysLag(lagDate) {
  
  var dateFrom = new Date(lagDate.from);
  var dateTo = new Date(lagDate.to);
  if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
    return 0;
  }
  var lagDays = Math.ceil(Math.abs(dateTo.getTime() - dateFrom.getTime()) / (1000 * 3600 * 24)) + 1;
  
  return lagDays;
}

function getDatesListLag(lagDate) {
  var lagDays = getDaysLag (lagDate);
  var lagDates = [],
      dayStart;
  (lagDate.from < lagDate.to) ? dayStart = new Date(lagDate.from) : dayStart = new Date(lagDate.to);
  for (var i = 0; i < lagDays; i++) {
    lagDates[i] = Utilities.formatDate(new Date(
      dayStart.getFullYear(),
      dayStart.getMonth(),
      dayStart.getDate() + i),TIME_ZONE, "yyyy-MM-dd");
  }  
  return lagDates;
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function isNumber_test() {
  return runGroupTests(
    {name: 'isNumber',
     should: [true, true, false, false, false, false],
     data: [ '2', 4.2, 'e', null, '', undefined],
    });
}

//////////////////////////////

function getDatesListLag_test() {
  return runGroupTests(
    {name: 'getDatesListLag',
     should: [
       ['2017-12-18', '2017-12-19', '2017-12-20'],
       ['2017-12-16', '2017-12-17', '2017-12-18'],
       ['2017-12-16'],
       []
     ],
     data: [
       {from: '2017-12-18', to: '2017-12-20'}, 
       {from: '2017-12-18', to: '2017-12-16'}, 
       {from: '2017-12-16', to: '2017-12-16'},
       {from: '2017-12-18', to: ''},
       undefined],
     compare: [
       "JSON.stringify(pattern) === JSON.stringify(result)"
     ]
    });
}

function getDaysLag_test() {
  return runGroupTests(
    {name: 'getDaysLag',
     should: [5,3,1,0],
     data: [
       {from: '2017-12-18', to: '2017-12-22'}, 
       {from: '2017-12-18', to: '2017-12-16'}, 
       {from: '2017-12-16', to: '2017-12-16'},
       {from: '2017-12-18', to: ''},
       undefined]
    });
}


function getTimeZone_test() {
  return runGroupTests(
    {name: 'getTimeZone',
     should: ['GMT+3'],
     data: ['']
    });
}

function cleanDateForLink_test() {
  return runGroupTests(
    {name: 'cleanDateForLink',
     should: ['20171218','','20171118', ''],
     data: ['2017-12-18', '', '20171118', undefined]
    });
}

function getDateInNewsFormat_test() {
  return runGroupTests(
    {name: 'getDateInNewsFormat',
     should: [
       '',
       {date: '2017-12-18', time: '00:00'},
       {date: '2017-11-18', time: '10:03'}],
     data: [
       '', 
       new Date(2017,11,18), 
       '2017-11-18T10:03'],
     compare: [
       "JSON.stringify(pattern) === JSON.stringify(result)"
     ]
    });
}

function getKeyFromLink_test() {
  return runGroupTests(
    {name: 'getKeyFromLink',
     should: ['1485067530','1485067530','',''],
     data: ["/culture/20170101/1485067530.html", "/culture/20170101/1485067530", "/culture/20170101/14850буквы66695", '']
    });
}

function isDialog_test() {
  return runGroupTests(
    {name: 'isDialog',
     should: [true,true,true,false],
     data: ["-","–","—","+"]
    });
}

function getPageByUrl_test() {
  return runGroupTests(
    {name: 'getPageByUrl',
     should: [
       {text: '',code: 0},
       {text: '',code: 404},
       {text: '',code: 200}
     ],
     data: [
       '',
       'ria.ru/culture/20171118/0.html',
       'ria.ru/culture/20171118/1509076610.html'
     ],
     compare: [
       'result.code === pattern.code'
     ],
     online: 'TEST_STOP_WEB_LOAD'
    });
}

function cleanWebLink_test() {
  return runGroupTests(
    {name: 'cleanWebLink',
     should: [
       '',
       "www.ru/1508263080.html",
       "http:/Bad/1508263080.html",
       "ria.ru/Bad/1508263080.html",
       "Bad/1508263080.html"],
     data: [
       '',
       "https://www.ru/1508263080.html?inj=1",
       "http:/Bad/1508263080.html?inj=1",
       "/Bad/1508263080.html?inj=1",
       "http://Bad/1508263080.html?inj=1"]
    });
}

function removeHttpEntities_test() {
  return runGroupTests(
    {name: 'removeHttpEntities',
     data: [
       "&nbsp;",
       "&mdash;",
       "&ndash;",
       "test",
       "test &mdash;/n" + '&ndash;'],
     should: [
       " ",
       "—",
       "–",
       "test",
       "test —/n" + '–']
    });
}

function cleanHtmlForParsing_test() {
  return runGroupTests(
    {name: 'cleanHtmlForParsing',
     should: [
       "Entit y:&nbsp;Bad: /1508263080.html",
       "alert('new line?')",
       "alert('new line?')</img><img"],
     data: [
       "Entit&y:&nbsp;Bad:<script>\ralert('new\nline?')</script><br>/1508263080.html",
       "\ralert('new\nline?')",
       "<img что угодно тут/><br>\ralert('new\nline?')</img><img "]
    });
}

