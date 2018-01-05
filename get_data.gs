function runTest_get_data() { 
  
  runBlockTests(['getNewsIdByKey',
                 'getNewsById',
                 'getNewsByDate',
                 'getSkipsDateInNews',
                 'getLastNewsDate'
                ]);
}

function getNews(period) {

  var currentDate = new Date(), 
      result = [],
      periodStart = '',
      periodEnd = '',      
      dayNews;
  
  periodEnd = period.end ?  period.end : getDateShif ({date: currentDate});
  periodStart = period.start ?  period.start : getDateShif ({date: periodEnd, shift: -UPLOAD_PERIOD_MAX});
  
  var listDaysForUploading = getListDaysForUploading(
    {start: {date: periodStart},
     end: {date: periodEnd} });
  for (var i = 0, len_i = listDaysForUploading.length; i < len_i; i++) {
    dayNews = getNewsByDate(listDaysForUploading[i].date);
    for (var j = 0, len_j = dayNews.length; j < len_j; j++) {
      result.push(dayNews[j]);
    }
  }
  return result;
}

function getNews_test() {
return runGroupTests(
    {name: 'getNews',
     should: [7, 8, 12, 6],
     data: [{start: '2018-01-02', end: '2018-01-03'}, {end: '2018-01-03'}, {start: '2018-01-02'}, 
           {start: '2018-01-03', end: '2018-01-02'}],
     online: 'TEST_STOP_SQL_EXEC',
     compare: [
       "pattern === lengthTest(result)"
     ]
    });
}

function getNewsByDate(date) {
  if (!date) return null;
  
  var idNewsList = getCacheObject(CACHE_NEWS_BY_DATE + date);
  if (!idNewsList) {
    idNewsList = getDataFromTable(
      {sql: "SELECT idnews FROM news WHERE date = ?",
       resultTypes: ['Int'],
       whereData: [date],
       whereTypes: ['String']
      });
    if (idNewsList.length > 0) 
      setCacheObject({key: CACHE_NEWS_BY_DATE + date, value: idNewsList, time: CACHE_MAX_TIME});
  }
  
  var result = [];
  
  for (var i = 0, len_i = idNewsList.length; i < len_i; i++) {
    result.push(getNewsById(idNewsList[i]));
  }
    
  return result;
}

function getNewsByDate_test() {
return runGroupTests(
    {name: 'getNewsByDate',
     should: [1, 4],
     data: ['2018-01-01', '2018-01-02'],
     online: 'TEST_STOP_SQL_EXEC',
     compare: [
       "pattern === lengthTest(result)"
     ]
    });
}

function getSkipsDateInNews() {
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

function getSkipsDateInNews_test() {
  //todo написать нормальный тест
return runGroupTests(
    {name: 'getSkipsDateInNews',
     should: [true],
     data: [1],
     online: 'TEST_STOP_SQL_EXEC',
     compare: [
       "pattern"
     ]
    });
}

function getLastNewsDate() {
  var result;
  
  var lastNewsListDate = doSelect(
    {sql: "SELECT MAX(time), date from news where date in (select MAX(date) FROM news) group by date",
     resultTypes: ['String', 'String']
    });
  if (lastNewsListDate.count === 1 && lastNewsListDate.isOk) {
    result = { 
      date: lastNewsListDate.dataset[0][1],
      time: lastNewsListDate.dataset[0][0]
    };
  } else {
    result = { 
      date: getDateInNewsFormat (getDateShif ({date: new Date(), shift: -UPLOAD_PERIOD_MAX})),
      time: '00:00'
    };
  }
  return result;
}

function getLastNewsDate_test() {
return runGroupTests(
    {name: 'getLastNewsDate',
     should: [true],
     data: [1],
     online: 'TEST_STOP_SQL_EXEC',
     compare: [
       "pattern"
     ]
    });
}


function getNewsById(id) {
  if (!id) return null;
  
  var result = getCacheObject(CACHE_NEWS_BY_ID + id);
  if (!result) {
    var news = doSelect(
      {sql: "SELECT title, idsource, rating, date, time, link FROM news WHERE idnews = ?",
       resultTypes: ['String', 'Int', 'Int', 'String', 'String', 'String'],
       whereData: [id],
       whereTypes: ['Int']
      });
    if (news.count != 1 || !news.isOk) return null;

    var tags = getDataFromTable(
      {sql: "SELECT idtags FROM news_tags WHERE idnews = ?",
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
        resultFields: ['id', 'idTo', 'idParagraph', 'type', 'link', 'title'],
        whereData: [id],
        whereTypes: ['Int']
      });
    
    result = {
      title: news.dataset[0][0],
      idsource: news.dataset[0][1],
      rating: news.dataset[0][2],
      date: news.dataset[0][3],
      time: news.dataset[0][3],
      link: news.dataset[0][5],
      tags: tags,
      rubrics: rubrics,
      paragraphs: paragraphs,
      references: references
    };
    setCacheObject({key: CACHE_NEWS_BY_ID + id, value: result, time: CACHE_MAX_TIME});
  }
  return result;
}

function getNewsById_test() {
  var cache = CACHE_MODE;
  CACHE_MODE = 1;

  return runGroupTests(
    {name: 'getNewsById',
     should: ['Книги на январь: новый роман Ханьи Янагихары и продолжение "Тобола" Иванова',
              'В Москве вручили премию "Событие года" по версии THR'],
     data: [534, 1],
     online: 'TEST_STOP_SQL_EXEC',
     cleanAll: 'CACHE_MODE = ' + cache +';',
     compare: [
       "pattern === result.title"
     ]
    });
}

function getNewsIdByKey(key) {
  if ((!key) || (key === '')) return null;
  
  var result = getCacheId(CACHE_NEWS_ID_BY_KEY + key);
  if (!result) {
    result = doSelect(
      {sql: "SELECT idnews FROM news WHERE key_from_source = ?",
       resultTypes: ['Int'],
       whereData: [key],
       whereTypes: ['String']
      });
    if (result.count != 1 || !result.isOk) return null;
    result = result.dataset[0][0];
    setCacheId({key: CACHE_NEWS_ID_BY_KEY + key, value: result});
  }
  return result;
}

//////////

function getNewsIdByKey_test() {
  var cache = CACHE_MODE;
  CACHE_MODE = 0;
  CacheService.getScriptCache().remove(CACHE_NEWS_ID_BY_KEY+"1508776644_test");
  doDelete({sql: "DELETE FROM news WHERE key_from_source = '1508776644_test'"});
  var insertedNews = doInsertTestNews_data({key: '1508776644_test',
                                           title: 'Тест для getNewsIdByKey'});
  return runGroupTests(
    {name: 'getNewsIdByKey',
     should: [insertedNews.generatedKey, null, 1, null ],
     data: ['1508776644_test','1508776644_test_1', '1510378758', null],
     online: 'TEST_STOP_SQL_EXEC',
     cleanAll: 'doDelete({sql: "DELETE FROM news WHERE idnews = ' + insertedNews.generatedKey + '"});CACHE_MODE = ' + cache +';'
    });
}