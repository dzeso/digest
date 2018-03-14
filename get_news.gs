function runTest_get_news() { 
  
  runBlockTests(['getNewsIdByKey',
                 'getNewsById',
                 'getListNewsIdByDate',
                 'getListPeriodsOfSkipedNewsWithStartEndAndCount',
                 'getDateOfLastNews',
                 'getListNewsForPeriod',
                 'getListNewsIdAfterId',
                 'getListNewsByDateLastEdited',
                 'getListNewsIdLastEditedAndLinkForDay'
                ]);
}

function getListNewsForPeriod(period) {

  var currentDate = new Date(), 
      result = [],
      periodStart = '',
      periodEnd = '',      
      dayNews;
  
  if (!period) period = {};
  periodEnd = period.end ?  period.end : getDateShif ({date: currentDate});
  periodStart = period.start ?  period.start : getDateShif ({date: periodEnd, shift: -CONST("UPLOAD_PERIOD_MAX")});
  
  var listDaysForUploading = getListDaysForUploading(
    { start: periodStart, end: periodEnd });
  for (var i = 0, len_i = listDaysForUploading.length; i < len_i; i++) {
    dayNews = getListNewsIdByDate(listDaysForUploading[i]);
    for (var j = 0, len_j = dayNews.length; j < len_j; j++) {
      result.push(dayNews[j]);
    }
  }
  return result;
}

function getListNewsForPeriod_test() {
return runGroupTests(
    {name: 'getListNewsForPeriod',
     should: [14],
     data: [{start: '2017-01-01', end: '2017-01-02'}],
     online: 'TEST("STOP_SQL_EXEC")',
     compare: [
       "pattern === lengthTest(result)"
     ]
    });
}

function getListNewsByDateLastEdited(last_edited) {
  var result = [],
      lastEdited = last_edited || getDateShif ({date: new Date(), shift: -CONST("UPLOAD_PERIOD_MAX")});
  
  var idNewsList = getDataFromTable(
      {sql: "SELECT idnews FROM news WHERE last_edited > ?",
       resultTypes: ['Int'],
       whereData: [lastEdited],
       whereTypes: ['String']
      });
  
  for (var i = 0, len_i = idNewsList.length; i < len_i; i++) {    
//    cleanCache(CACHE('NEWS_BY_ID') + idNewsList[i]);    /* очистка кеша для отладки*/
    result.push(getNewsById(idNewsList[i]));
  }
    
  return result;
}

function getListNewsByDateLastEdited_test() {
return runGroupTests(
    {name: 'getListNewsByDateLastEdited',
     should: [0],
     data: ['2018-02-13T00:00'],
     online: 'TEST("STOP_SQL_EXEC")',
     compare: [
       "lengthTest(result) > 0"
     ]
    });
}

function getListNewsIdAfterId(id) {
  var result = [];
  
  if (!id) return result;
  
  var idNewsList = getDataFromTable(
      {sql: "SELECT idnews FROM news WHERE idnews > ?",
       resultTypes: ['Int'],
       whereData: [id],
       whereTypes: ['Int']
      });
  
  for (var i = 0, len_i = idNewsList.length; i < len_i; i++) {
    result.push(getNewsById(idNewsList[i]));
  }
    
  return result;
}

function getListNewsIdAfterId_test() {
return runGroupTests(
    {name: 'getListNewsIdAfterId',
     should: [0,0],
     data: [null,undefined],
     online: 'TEST("STOP_SQL_EXEC")',
     compare: [
       "pattern === lengthTest(result)"
     ]
    });
}

function getListNewsIdLastEditedAndLinkForDay(date) {
  if (!date) return null;
  
  var idNewsList;
  var qq = !isToday(date);
  if (!isToday(date)) idNewsList = getCacheObject(CACHE('NEWS_LIST_BY_DATE') + date);
  if (!idNewsList) {
    idNewsList = getDataFromTable(
      {sql: "SELECT idnews, last_edited, link FROM news WHERE date = ? ORDER BY time DESC",
       resultTypes: ['Int', 'String', 'String'],
       resultFields: ['id', 'lastEdited', 'link'],
       whereData: [date],
       whereTypes: ['String']
      });
    if (idNewsList.length > 0 && !isToday(date)) 
      setCacheObject({key: CACHE('NEWS_LIST_BY_DATE') + date, value: idNewsList, time: CACHE('MAX_TIME')});
  }
  
  return idNewsList;
}

function getListNewsIdLastEditedAndLinkForDay_test() {
return runGroupTests(
    {name: 'getListNewsIdLastEditedAndLinkForDay',
     should: [5, 0],
     data: ['2017-01-01','2019-01-01'],
     online: 'TEST("STOP_SQL_EXEC")',
     compare: [
       "pattern === lengthTest(result)"
     ]
    });
}

function getListNewsIdByDate(date) {
  if (!date) return [];
  
  var idNewsList;
  if (!isToday(date)) idNewsList = getCacheObject(CACHE('NEWS_BY_DATE') + date);
  if (!idNewsList) {
    idNewsList = getDataFromTable(
      {sql: "SELECT idnews FROM news WHERE date = ?",
       resultTypes: ['Int'],
       whereData: [date],
       whereTypes: ['String']
      });
    if (idNewsList.length > 0 && !isToday(date)) 
      setCacheObject({key: CACHE('NEWS_BY_DATE') + date, value: idNewsList, time: CACHE('MAX_TIME')});
  }
  
  var result = [];
  
  for (var i = 0, len_i = idNewsList.length; i < len_i; i++) {
    result.push(getNewsById(idNewsList[i]));
  }
    
  return result;
}

function getListNewsIdByDate_test() {
return runGroupTests(
    {name: 'getListNewsIdByDate',
     should: [5, 9, 0],
     data: ['2017-01-01', '2017-01-02', null],
     online: 'TEST("STOP_SQL_EXEC")',
     compare: [
       "pattern === lengthTest(result)"
     ]
    });
}

function getListPeriodsOfSkipedNewsWithStartEndAndCount() {
  var result = getDataFromTable(
    {sql: "select "+
     "(select max(Date(t1.date)) from news t1 where t1.date < t.date) as first_date, "+
     "Date(t.date) as last_date, "+
     "datediff(t.date, (select max(t1.date) from news t1 where t1.date < t.date)) as period "+
     "from news t group by t.date having period > 1;",
     resultTypes: ['String', 'String', 'Int'],
     resultFields: ['start', 'end', 'days']
    });
  return result;
}

function getListPeriodsOfSkipedNewsWithStartEndAndCount_test() {
  //todo написать нормальный тест
return runGroupTests(
    {name: 'getListPeriodsOfSkipedNewsWithStartEndAndCount',
     should: [true],
     data: [1],
     online: 'TEST("STOP_SQL_EXEC")',
     compare: [
       "pattern"
     ]
    });
}

function getDateOfLastNews() {
  var result;
  var lastNewsListDate = doSelect(
    {sql: "SELECT MAX(date) from news",
     resultTypes: ['String']
    });
  return (lastNewsListDate.count === 1 && lastNewsListDate.isOk) ? 
    lastNewsListDate.dataset[0][0] : getDateInNewsFormat (getDateShif (
      {date: new Date(), shift: -CONST("UPLOAD_PERIOD_MAX")}));
}

function getDateOfLastNews_test() {
return runGroupTests(
    {name: 'getDateOfLastNews',
     should: [true],
     data: [1],
     online: 'TEST("STOP_SQL_EXEC")',
     compare: [
       "pattern"
     ]
    });
}


function getNewsById(id) {
  if (!id) return null;
  
  var result = getCacheObject(CACHE('NEWS_BY_ID') + id);
  if (!result) {
    var news = doSelect(
      {sql: "SELECT title, idsource, rating, date, time, link, last_edited FROM news WHERE idnews = ?",
       resultTypes: ['String', 'Int', 'Int', 'String', 'String', 'String', 'String'],
       whereData: [id],
       whereTypes: ['Int']
      });
    if (news.count != 1 || !news.isOk) return null;

    var tags = getDataFromTable(
      {sql: "SELECT idtag FROM news_tags WHERE idnews = ?",
       resultTypes: ['Int'],
       whereData: [id],
       whereTypes: ['Int']
      });

    var rubrics = getDataFromTable(
      {sql: "SELECT idrubric FROM news_rubrics WHERE idnews = ?",
       resultTypes: ['Int'],
       whereData: [id],
       whereTypes: ['Int']
      });
    
    var paragraphs = getDataFromTable(
      {sql: "SELECT idparagraph, text, type FROM news_paragraphs WHERE idnews = ?",
        resultTypes: ['Int', 'String', 'Int'],
        resultFields: ['id', 'text', 'type'],
        whereData: [id],
        whereTypes: ['Int']
      });
    
    var references = getDataFromTable(
      {sql: "SELECT idreference, idnews_to, idparagraph, type, link, title FROM news_references WHERE idnews_from = ?",
        resultTypes: ['Int', 'Int', 'Int', 'Int', 'String', 'String'],
        resultFields: ['id', 'id_to', 'id_paragraph', 'type', 'link', 'title'],
        whereData: [id],
        whereTypes: ['Int']
      });
    
    result = {
      id: id,
      title: news.dataset[0][0],
      idsource: news.dataset[0][1],
      rating: news.dataset[0][2],
      date: news.dataset[0][3],
      time: news.dataset[0][4],
      link: news.dataset[0][5],
      last_edited: news.dataset[0][6],
      tags: tags,
      rubrics: rubrics,
      paragraphs: paragraphs,
      references: references
    };
    setCacheObject({key: CACHE('NEWS_BY_ID') + id, value: result, time: CACHE('MAX_TIME')});
  }
  return result;
}

function getNewsById_test() {
  return runGroupTests(
    // todo переписать через новость от 01.01.2017 и проверка ну нул сделать
    {name: 'getNewsById',
     should: ['Роднянский прокомментировал номинацию "Нелюбви" на "Золотой глобус"'],
     data: [1],
     online: 'TEST("STOP_SQL_EXEC")',
      compare: [
       "pattern === (result.title || '')"
     ]
    });
}

function getNewsIdByKey(key) {
  if ((!key) || (key === '')) return null;
  
  var result = getCacheId(CACHE('NEWS_ID_BY_KEY') + key);
  if (!result) {
    result = doSelect(
      {sql: "SELECT idnews FROM news WHERE key_from_source = ?",
       resultTypes: ['Int'],
       whereData: [key],
       whereTypes: ['String']
      });
    if (result.count != 1 || !result.isOk) return null;
    result = result.dataset[0][0];
    setCacheId({key: CACHE('NEWS_ID_BY_KEY') + key, value: result});
  }
  return result;
}

function getNewsIdByKey_test() {
  CacheService.getScriptCache().remove(CACHE('NEWS_ID_BY_KEY')+"1508776644_test");
  doDelete({sql: "DELETE FROM news WHERE key_from_source = '1508776644_test'"});
  var insertedNews = doInsertTestNews_data({key: '1508776644_test',
                                           title: 'Тест для getNewsIdByKey'});
  return runGroupTests(
    {name: 'getNewsIdByKey',
     should: [insertedNews.generatedKey, null, null ],
     data: ['1508776644_test','1508776644_test_1', null],
     online: 'TEST("STOP_SQL_EXEC")',
     cleanAll: 'doDelete({sql: "DELETE FROM news WHERE idnews = ' + insertedNews.generatedKey + '"});'
    });
}