function runTest_scraping() { 
  
  runBlockTests([
    'uploadDayNews', // обработка списка новостей за день
    'uoloadCurrentNews', // формирование текущего списка дней и загрузка новостей по ним в базу 
    'getListDaysForUploading', //определение еще не загруженных новостей со страницы новостей за день
    'uploadDataFromNewsPage' // полная обработка вебстраницы с новостью
//    'uploadSkippedNews' //поиск и загрузка пропущенных новостей. закоменчен так как тяжелый процесс. todo придумать как такое тестировать
    ]);
}

function uploadDataFromNewsPage (param) {

//param {link: "/culture/20171118/1509076610", time: '10:03'}

  var url = RIA_URL_PREFIX + param.link + RIA_URL_POSFIX;
  var page = getPageByUrl(url);
  var resultUploading = 
      {url: url,
       code: page.code,
       done: false};
  if (page.code !== 200) {
    saveCrawlerLog({
      message: "Проблемы за загрузкой веб страницы "+url,
      obj: page,
      source: "uploadDataFromNewsPage",
      event: page.code});
    return resultUploading;
  }  
  var data = getDataFromNewsPage(page.text);
  resultUploading.code = data.code;
  if (data.isCorrect) {
    data.key = getKeyFromLink(param.link);
    data.link = url;
    data.zip = zipArticlePage(page.text).setName(param.link.replace(/\//ig, '-')+'.html.zip');
    data.sourceId = RIA_SOURCE_ID;
    //todo передать сюда код статьи дату ее создания и редактирования
    var resultSaving = saveNews(data);
    resultUploading.done = resultSaving.done;   
    resultUploading.code = resultSaving.code;
    // todo контроль результатов записию если новость не пропущена, то при проблемах запись в лог
    // resultUploading.done - результат операции
//    saveCrawlerLog({
//      message: "Новость не удалось сохранить в БД",
//      obj: url,
//      source: "uploadDataFromNewsPage",
//      event: data.code});
  } else {
    data.link = url;
    data.sourceId = RIA_SOURCE_ID;
    saveCrawlerLog({
      message: "Новость не удалось распарсить",
      obj: data,
      source: "uploadDataFromNewsPage",
      event: data.code});
  }
  return resultUploading;
}

function uoloadCurrentNews(date) {
  var currentDate = new Date(), 
      result = [],
      dayNews;
  if (date) currentDate = (new Date(date)).setHours(0, 0, 0, 0);
  var currentNewsDay = getDateInNewsFormat(currentDate);
  var lastNewsDay = getLastNewsDate();
  var listDaysForUploading = getListDaysForUploading(
    {start: lastNewsDay,
     end: currentNewsDay });
  for (var i = 0, len_i = listDaysForUploading.length; i < len_i; i++) {
    dayNews = uploadDayNews(listDaysForUploading[i]);
    for (var j = 0, len_j = dayNews.length; j < len_j; j++) {
      if (dayNews.length > 0) result.push(dayNews[j]);
    }
  }
 return result;
}

function uploadSkippedNews() {
  var skippedDate = getSkipsDateInNews(),
      listDaysForUploading = [];
  
  for (var j = skippedDate.length - 1; j >= 0; j--) {
    listDaysForUploading = getListDaysForUploading(
      {start: {date: skippedDate[j].start},
       end: {date: skippedDate[j].end }});
    for (var i = 0, len_i = listDaysForUploading.length; i < len_i; i++) {
      uploadDayNews(listDaysForUploading[i]);
    }
  }
  return true;
}

function getListDaysForUploading(interval) {
  var result = [];
  if (interval.start.date > interval.end.date) {
    return [interval.end];
  }
  var listDays = getDatesListLag({from: interval.start.date, to: interval.end.date});  
  for (var i = 0, len_i = listDays.length; i < len_i; i++) {
    result[i] = {
      date: listDays[i],
      time: ((i === 0 && interval.start.time) ? interval.start.time : '00:00')};  
  }
  return result;
}

function uploadDayNews(day) {
  var page = getDayNewsPage(cleanDateForLink(day.date)),
      result = [];
  
  // todo проверка кода возврата
  
  // todo getDayNewsList - получить полный список
  
  var list = getDayNewsList(
    {page: page.text,
     day: day});
     
  // list = {link:"/culture/20170101/1485067530", time:"13:21"}     

// todo считать существующие в базе новости с кодом редактирования
     // добавить данные по ключу и дате обновления и передать в uploadDataFromNewsPage
     // там в заисимости от ситуации: добавлять - обновлять или пропускать
     
  for (var i = 0, len_i = list.length; i < len_i; i++) {
    result[i] = uploadDataFromNewsPage(list[i]);
  }
// result = {code=301.0, done=false, url=ria.ru/culture/20170101/1485067530.html}
  return result;
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
     online: 'TEST_STOP_WEB_LOAD'
    });
}

function uploadDayNews_test() {
  return runGroupTests(
    {name: 'uploadDayNews',
     should: [1],
     data: [{date: "2017-01-01", time:"13:20"}],
     compare: ["pattern === result.length"],
     online: 'TEST_STOP_WEB_LOAD'
    });
}

function getListDaysForUploading_test() {
  return runGroupTests(
    {name: 'getListDaysForUploading',
     should: [
       [{date: '2017-11-18',time: '10:03'},
        {date: '2017-11-19',time: '00:00'},
        {date: '2017-11-20',time: '00:00'}
        ],
       [{date: '2017-11-20',time: '11:03'}],
       []
       ],
     data: 
       [{start: {date: '2017-11-18', time: '10:03'},
       end:     {date: '2017-11-20', time: '11:03'}
       },
        {start: {date: '2017-11-21', time: '10:03'},
       end:     {date: '2017-11-20', time: '11:03'}
       },
       {start: '', end: ''}
       ],
     compare: [
       "JSON.stringify(pattern) === JSON.stringify(result)"
     ]
    });
}

function uoloadCurrentNews_test() {
  return runGroupTests(
    {name: 'uoloadCurrentNews',
     should: [6],
     data: ['2017-12-17'],
     compare: [
       "pattern === lengthTest(result)"
     ],
     online: 'TEST_STOP_WEB_LOAD'
    });
}

function uploadDataFromNewsPage_test() {
  return runGroupTests(
    {name: 'uploadDataFromNewsPage',
     should: [ {done: false, code: 301} ],
     data: [ {link: "/culture/20171118/1509076610", time: '10:03'} ],
     compare: [ "pattern.done === result.done" ],
     online: 'TEST_STOP_WEB_LOAD'
    });
}

function getUploadNews_time() {
  
  var period = [{day: {date: ''}, timing: new Date()},
                {day: {date: '2017-11-28'}, timing: null},
                {day: {date: '2017-11-29'}, timing: null},
                {day: {date: '2017-11-30'}, timing: null},
                {day: {date: '2017-12-01'}, timing: null}],
      result = [],
      count = 0;
  for (var i = 1, len_i = period.length; i < len_i; i++) { 
    result = uploadDayNews(period[i].day);
    count += result.length;
    period[i].timing = new Date();
    Logger.log("Обработка " + result.length + " новостей (" + period[i].day.date + ") = " + ((period[i].timing-period[i-1].timing)/1000).toFixed(2));   
  }
  Logger.log("Средня скорость загрузки новсти = " + (((period[i-1].timing-period[0].timing)/1000)/count).toFixed(2) + " сек.") ;
}