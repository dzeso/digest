function runTest_scraping() { 
  
  runBlockTests([
    'uploadDayNews', // обработка списка новостей за день
    'uploadCurrentNews', // формирование текущего списка дней и загрузка новостей по ним в базу 
    'getListDaysForUploading', //определение еще не загруженных новостей со страницы новостей за день
    'uploadDataFromNewsPage' // полная обработка вебстраницы с новостью
//    'uploadSkippedNews' //поиск и загрузка пропущенных новостей. закоменчен так как тяжелый процесс. todo придумать как такое тестировать
    ]);
}

function uploadDataFromNewsPage (param) {

  // param = {link:"ria.ru/culture/20170101/1485065256.html", id:946, lastEdited:"16:47", time:"12:44"}   
  
  var page = getPageByUrl(param.link);
  var resultUploading = 
      {url: param.link,
       code: page.code,
       done: false};
  if (page.code !== 200) {
    saveCrawlerLog({
      message: "Проблемы за загрузкой веб страницы " + param.link,
      obj: page,
      source: "uploadDataFromNewsPage",
      event: page.code});
    return resultUploading;
  }  
  var data = getDataFromNewsPage(page.text);
  
  data = mergeObjects([data,{
    key: getKeyFromLink(param.link),
    link: param.link,
    id: param.id,
    lastEdited: param.lastEdited,
    sourceId: RIA('SOURCE_ID')    
  }]);
  resultUploading.code = data.code;
  if (data.isCorrect) {
    var resultSaving = saveNews(data);
    resultUploading.done = resultSaving.done;   
    resultUploading.code = resultSaving.code;
    if (!resultSaving.done || resultSaving.code === CODE_RESULT("UPDATE_SUCCESSFULLY")) 
      saveCrawlerLog({
        message: 'Новость ' + param.link + ((resultSaving.done) ? " обновлена" : " не обновлена"),
        obj: data,
        source: "saveNews",
        event: resultSaving.code});
  } else {
    saveCrawlerLog({
      message: "Новость не удалось распарсить",
      obj: data,
      source: "uploadDataFromNewsPage",
      event: data.code});
  }
  return resultUploading;
}

function uploadCurrentNews(date) {
  var currentDate = new Date(), 
      result = [],
      dayNews;
  if (date) currentDate = (new Date(date)).setHours(0, 0, 0, 0);
  var currentNewsDay = getDateInNewsFormat(currentDate);
  var lastNewsDay = getDateOfLastNews();
  var listDaysForUploading = getListDaysForUploading(
    { start: lastNewsDay, end: currentNewsDay });
  for (var i = 0, len_i = listDaysForUploading.length; i < len_i; i++) {
    dayNews = uploadDayNews(listDaysForUploading[i]);
    for (var j = 0, len_j = dayNews.length; j < len_j; j++) {
      result.push(dayNews[j]);
//      if (dayNews.length > 0) result.push(dayNews[j]); /* qqqq странная проверка в которой нет смысла*/
    }
  }
  // todo что если result = []?
 return result;
}

function uploadSkippedNews() {
  var skippedDate = getListPeriodsOfSkipedNewsWithStartEndAndCount(),
      listDaysForUploading = [];
  
  for (var j = skippedDate.length - 1; j >= 0; j--) {
    listDaysForUploading = getListDaysForUploading(
      { start: skippedDate[j].start, end: skippedDate[j].end });
    for (var i = 0, len_i = listDaysForUploading.length; i < len_i; i++) {
      uploadDayNews(listDaysForUploading[i]);
    }
  }
  return true;
}

function getListDaysForUploading(interval) {
  var result = [];
  if (interval.start > interval.end) {
    return [interval.end];
  }
  var listDays = getDatesListLag({from: interval.start, to: interval.end});  
  for (var i = 0, len_i = listDays.length; i < len_i; i++) result[i] =  listDays[i];
  return result;
}

function uploadDayNews(day) {
  var page = getDayNewsPage(cleanDateForLink(day)),
      result = [];
  
  if (page.code !== 200) {
    saveCrawlerLog({
      message: "Проблемы за загрузкой списка новостей по РИА за дату " + day,
      obj: page,
      source: "uploadDayNews",
      event: page.code});
    return result;
  }  
  
  var listFromBd = getListNewsIdLastEditedAndLinkForDay(day);
  // **** if(!listFromBd[0]) listFromBd[0] = {link: ""}; // чтоб не делать в цикле проверок на существование значений
  // listFromBd = {link:"ria.ru/culture/20170101/1485065256.html", id:946, lastEdited:"2018-01-01T16:47"}  
  
  var listFromPage = getDayNewsListFromPage(
    {page: page.text,
     day: day});     
  // listFromPage = {link:"ria.ru/culture/20170101/1485065256.html"}     

  var j = 0, len_j = listFromBd.length;
  for (var i = 0, len_i = listFromPage.length; i < len_i; i++) {
    if (j < len_j && listFromPage[i].link === listFromBd[j].link) {
      listFromPage[i] = mergeObjects([listFromPage[i], listFromBd[j]]);
      j++;
    }
    result[i] = uploadDataFromNewsPage(listFromPage[i]);
  }
// result = {code=301.0, done=false, url=ria.ru/culture/20170101/1485067530.html}
  return result;
}

function uploadDayNews_test() {
  return runGroupTests(
    {name: 'uploadDayNews',
     should: [10,6],
     data: ["2018-01-17","2017-01-01"],
     compare: ["pattern === lengthTest(result)"],
     online: 'TEST("STOP_WEB_LOAD") && TEST("STOP_SQL_EXEC")'
    });
}

function getDayNewsPage(day) {
  return getPageByUrl('https://ria.ru/culture/' + day);
}



//////////////////////////////

function uploadSkippedNews_test() { // заглушка, призапуске выполняется тяжелый процесс
  return runGroupTests(
    {name: 'uploadSkippedNews',
     should: [true],
     data: [true],
     online: 'TEST("STOP_WEB_LOAD")'
    });
}

function getListDaysForUploading_test() {
  return runGroupTests(
    {name: 'getListDaysForUploading',
     should: [
       ['2017-11-18', '2017-11-19', '2017-11-20'],
       ['2017-11-20'],
       []
     ],
     data: [
       {start: '2017-11-18', end: '2017-11-20'},
       {start: '2017-11-21', end: '2017-11-20'},
       {start: '', end: ''}
     ],
     compare: [
       "JSON.stringify(pattern) === JSON.stringify(result)"
     ]
    });
}

function uploadCurrentNews_test() {
  return runGroupTests(
    {name: 'uploadCurrentNews',
     should: [6],
     data: ['2017-12-17'],
     compare: [
       "pattern === lengthTest(result)"
     ],
     online: 'TEST("STOP_WEB_LOAD")'
    });
}

function uploadDataFromNewsPage_test() {
  return runGroupTests(
    {name: 'uploadDataFromNewsPage',
     should: [ {done: false, code: 301} ],
     data: [ {link: "ria.ru/culture/20171118/1509076610.html", time: '10:03'} ],
     compare: [ "pattern.done === result.done" ],
     online: 'TEST("STOP_WEB_LOAD")'
    });
}

function getUploadNews_time() {
  
  var period = [{day: '', timing: new Date()},
                {day: '2017-11-28', timing: null},
                {day: '2017-11-29', timing: null},
                {day: '2017-11-30', timing: null},
                {day: '2017-12-01', timing: null}],
      result = [],
      count = 0;
  for (var i = 1, len_i = period.length; i < len_i; i++) { 
    result = uploadDayNews(period[i].day);
    count += result.length;
    period[i].timing = new Date();
    Logger.log("Обработка " + result.length + " новостей (" + period[i].day + ") = " + ((period[i].timing-period[i-1].timing)/1000).toFixed(2));   
  }
  Logger.log("Средня скорость загрузки новсти = " + (((period[i-1].timing-period[0].timing)/1000)/count).toFixed(2) + " сек.") ;
}