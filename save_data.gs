function runTest_save_data() {   
  runBlockTests(['saveNewsRaw',
                 'saveNewsTags',
                 'saveParagraphReference',
                 'saveNewTagToRef',
                 'saveParagraphs',
                 'saveNewRubricToRef',
                 'saveNewsRubrics'
                ]);
}

function saveParagraphs(save) {  
  var result = {isOk: false};
  for (var i = 0, len_i = save.paragraphs.length; i < len_i; i++) {
    // проверку на тип параграфа и если это только ссылка (6) то его не сохранять
    // а писать только в ссылки
    (save.paragraphs[i].typeText === 6) ? result.isOk = true : result = doInsert(
      {connection: save.connection,
       sql: 'INSERT INTO news_paragraphs (idnews, text, type) values (?,?,?)',
       data: [save.generatedKey, save.paragraphs[i].text, save.paragraphs[i].typeText],
       types: ['Int', 'String', 'String']});
    if (result.isOk && save.paragraphs[i].link.type > 0) {
      if (result.generatedKey) save.paragraphs[i].generatedKeyParagraph = result.generatedKey;
      save.paragraphs[i].generatedKey = save.generatedKey;
      result.isOk = saveParagraphReference({connection: save.connection, paragraphs: save.paragraphs[i]});
    } 
    if (!result.isOk) {
      return result.isOk;
      // todo запись в лог про невозможнось сохранить
    }    
  }  
  return result.isOk;
}

function saveParagraphs_test() {
  doDelete({sql: "DELETE FROM news WHERE key_from_source = '1508776645'"});
  CacheService.getScriptCache().remove(CACHE_NEWS_ID_BY_KEY+"1508776644");
  
  var insertedNews = doInsertTestNews_data({title: 'Тест для saveParagraphs',
                                            link: 'ria.ru/interview/20171114/1508776645.html',
                                            key: '1508776645'}); 
  return runGroupTests(
    {name: 'saveParagraphs',
     should: [ true ],
     data: [{generatedKey: insertedNews.generatedKey,
             paragraphs: [
               {link: {
                 href: 'ria.ru/interview/20171114/1508776644.html', 
                 type: 1,
                 title: "Заголовок новости"
               }, 
                text: 'Читать полностью',
                typeText: 6,
                hyperLink: {words: '', link: ''}},
               {link: '', 
                text: 'Стратегия социально-экономического развития Кубани',
                typeText: 2,
                hyperLink: {words: '', link: ''}},
               {link: '', 
                text: 'Сегодня регион активно развивается',
                typeText: 4,
                hyperLink: {words: '', link: ''}},
               {link: {
                 href: 'ria.ru/interview/20171114/1508776644.html', 
                 type: 1,
                 title: "Заголовок новости"
               },
                text: 'Если говорить о туризме — наша задача уйти от "сезонности"',
                typeText: 1,
                hyperLink: {words: '', link: ''}}]
            }
           ],
     online: 'TEST_STOP_SQL_EXEC',
     cleanAll: 'doDelete({sql: "DELETE FROM news WHERE idnews = ' + insertedNews.generatedKey + '"});'     
    });
}

function saveNews(data) {
  var result = {done: false,
                code: CODE_SAVE_FAILD,
                generatedKey: null},
      conn = getConn(),
      dt = splitDateTime(data.date);
  
  if (!conn.isOk) {
      return result
    }
  startTransaction(conn.jdbc);
  var insertedNews = doInsert(
    {connection: conn.jdbc,
     sql: 'INSERT INTO news (title, idsource, key_from_source, date, time, link) values (?,?,?,?,?,?)',
     data: [data.title, data.sourceId, data.key, dt.date, dt.time, data.link],
     types: ['String', 'Int', 'String', 'String', 'String', 'String']});
  
  switch (insertedNews.isOk) {
    case true:
      if (!saveNewsRaw ({connection: conn.jdbc,
                         generatedKey: insertedNews.generatedKey,
                         zip: data.zip})) {
        insertedNews.isOk = false;
        break;
      }
    case 'Rubrics':
      if (!saveNewsRubrics ({connection: conn.jdbc,
                             generatedKey: insertedNews.generatedKey,
                             rubrics: data.rubrics})) {
        insertedNews.isOk = false;
        break;
      }
    case 'Tags':
      if (!saveNewsTags ({connection: conn.jdbc,
                          generatedKey: insertedNews.generatedKey,
                          tags: data.tags})) {
        insertedNews.isOk = false;
        break;
      }
    case 'Paragraphs':
      if (!saveParagraphs ({connection: conn.jdbc,
                          generatedKey: insertedNews.generatedKey,
                          paragraphs: data.body})) {
        insertedNews.isOk = false;
        break;
      }
  }

  if (insertedNews.isOk) {
    commitTransaction(conn.jdbc);
    result = {done: true,
              code: CODE_SAVE_SUCCESSFULLY,
              generatedKey: insertedNews.generatedKey};
  } else { 
    rollbackTransaction(conn.jdbc);
  }
  closeSqlConnection({conn: conn.jdbc})
  return result;
  
}

function saveNewsRaw(save) {  
  var result = doInsert(
    {connection: save.connection,
     sql: 'INSERT INTO news_raw (idnews, html_zip) values (?,?)',
     data: [save.generatedKey, save.zip],
     types: ['Int', 'Blob']});
  return result.isOk;
}

function saveNewsRubrics(save) {  
  var rubric, 
      result = {isOk: false};
  for (var i = 0, len_i = save.rubrics.length; i < len_i; i++) {
    rubric = getRefRubricIdBySynonym(save.rubrics[i]);
    if (!rubric.isOk) {
      rubric = saveNewRubricToRef({connection: save.connection, name: save.rubrics[i]});
    }
    result = doInsert(
      {connection: save.connection,
       sql: 'INSERT INTO news_rubrics (idnews, idrubric) values (?,?)',
       data: [save.generatedKey, rubric.id],
       types: ['Int', 'Int']});
    if (!result.isOk) {
      // todo запись в лог об проблеме
    }
  } 
  return result.isOk;
}

function saveNewRubricToRef(save) {  
  var result = {isOk: false,
                id: null};
  var insert = doInsert({connection: save.connection,
                         sql: 'INSERT INTO ref_rubric (rubric) values (?)',
                         data: [save.name],
                         types: ['String']});

  if (insert.isOk) {
    result.id = insert.generatedKey;
    insert = doInsert({connection: save.connection,
                       sql: 'INSERT INTO ref_rubric_synonyms (idrubric, synonym) values (?,?)',
                       data: [insert.generatedKey, save.name],
                       types: ['Int','String']});
    if (insert.isOk) {
      result.isOk = true; 
      setCacheId({key: CACHE_RUBRIC_BY_SYNONYM + save.name, value: result.id});
    }
  }
  return result;
}

function saveNewRubricToRef_test() {
  doDelete({sql: "DELETE FROM ref_rubric WHERE rubric LIKE 'saveNewRubricToRef_test%'"});

  return runGroupTests(
    {name: 'saveNewRubricToRef',
     should: [ true, false ],
     data: [{name: 'saveNewRubricToRef_test'},
            {name: 'saveNewRubricToRef_test'}
           ],
     compare: [
       'result.isOk === pattern'
     ],
     cleanAll: 'doDelete({sql: "DELETE FROM ref_rubric WHERE rubric LIKE \'saveNewRubricToRef_test%\'"})',
     online: 'TEST_STOP_SQL_EXEC'
    });
}

function saveNewsTags(save) {  
  var tag, 
      result = {isOk: false};
  for (var i = 0, len_i = save.tags.length; i < len_i; i++) {
    tag = getRefTagIdBySynonym(save.tags[i]);
    if (!tag.isOk) {
      tag = saveNewTagToRef({connection: save.connection, tag: save.tags[i]});
    }
    result = doInsert(
      {connection: save.connection,
       sql: 'INSERT INTO news_tags (idnews, idtags) values (?,?)',
       data: [save.generatedKey, tag.id],
       types: ['Int', 'Int']});
    if (!result.isOk) {
      // todo запись в лог об проблеме проверить на дубликат, если так, то все ок
    }
  } 
  return result.isOk;
}

function saveNewTagToRef(save) {  
  var result = {isOk: false,
                id: null};
  var insert = doInsert({connection: save.connection,
                         sql: 'INSERT INTO ref_tag (tag, idtag_type) values (?,?)',
                         data: [save.tag.name, save.tag.type],
                         types: ['String', 'Int']});
  if (insert.isOk) {
    result.id = insert.generatedKey;
    insert = doInsert({connection: save.connection,
                       sql: 'INSERT INTO ref_tag_synonyms (idtag, synonym) values (?,?)',
                       data: [insert.generatedKey, save.tag.name],
                       types: ['Int','String']});
    if (insert.isOk) {
      result.isOk = true; 
      setCacheId({key: CACHE_TAG_BY_SYNONYM + save.tag.name, value: result.id});
    }
  }
  return result;
}

function saveNewTagToRef_test() {
  doDelete({sql: "DELETE FROM ref_tag WHERE tag LIKE 'saveNewTagToRef_test%'"});

  return runGroupTests(
    {name: 'saveNewTagToRef',
     should: [ true, false ],
     data: [{tag: {name: 'saveNewTagToRef_test', type: 1}},
            {tag: {name: 'saveNewTagToRef_test_wrong', type: -1}}
           ],
     compare: [
       'result.isOk === pattern'
     ],
     cleanAll: 'doDelete({sql: "DELETE FROM ref_tag WHERE tag LIKE \'saveNewTagToRef_test%\'"})',
     online: 'TEST_STOP_SQL_EXEC'
    });
}

function saveParagraphReference(save) {  
  
//  todo - нужна отдельная функция которая будет обновлять список idnews_to 
//  возможно это отдельный процесс который будет загружать статьи из ссылок и потом проставлять код ссылки в idnews_from
  
  var result = {isOk: false},
      dataToInset = {connection: save.connection,
                     sql: 'INSERT INTO news_references (idparagraph, idnews_from, type, link, title) values (?,?,?,?,?)',
                     data: [
                       save.paragraphs.generatedKeyParagraph, save.paragraphs.generatedKey, save.paragraphs.link.type, 
                       save.paragraphs.link.href, save.paragraphs.link.title],
                     types: ['Int', 'Int', 'Int', 'String', 'String']};
  var idTo = getNewsIdByKey(getKeyFromLink(save.paragraphs.link.href));
  // todo переписать как универсальную функцию для удаления null значений из запроса
  if (idTo !== null) {
    dataToInset.types.push('Int');
    dataToInset.data.push(idTo);
    dataToInset.sql = dataToInset.sql.replace('?','?,?').replace('title', 'title, idnews_to');
  }
  if (!save.paragraphs.generatedKeyParagraph) {
    dataToInset.types.shift();
    dataToInset.data.shift();
    dataToInset.sql = dataToInset.sql.replace('?,','').replace('idparagraph,', '');
  }
  result = doInsert(dataToInset);
  if (!result.isOk) {
    Logger.log(result)
    // todo запись в лог про невозможнось сохранить
  }     
  return result.isOk;
}

////////////////////////////////

function saveNews_test() {
  var page = include('простая статья');
  var data = getDataFromNewsPage(page);
  data.key = ('test_' + Date.parse(new Date()).toString()).substr(0,14);
  data.zip = zipArticlePage(page).setName('/culture/20171118/1509076610'.replace(/\//ig, '-')+'.html.zip');
  doDelete({sql: "DELETE FROM news WHERE key_from_source LIKE \'" + data.key + "%\'"})
  return runGroupTests(
    {name: 'saveNews',
     should: [
       {done: true, code: CODE_SAVE_SUCCESSFULLY},
       {done: false, code: CODE_SAVE_FAILD}
     ],
     data: [ 
       {title: data.title,
        tags: data.tags,
        rubrics: data.rubrics,
        date: data.date,
        key: data.key,
        link: 'тест',
        sourceId: RIA_SOURCE_ID,
        zip: data.zip,
        body: data.body,
        isCorrect: true,
        code: CODE_CORRECT_ARTICLE},
       {}
     ],
     compare: [
       '(result.done === pattern.done)',
       '(result.code === pattern.code)'
     ],
     online: 'TEST_STOP_SQL_EXEC',
     clean: 'doDelete({sql: "DELETE FROM news WHERE key_from_source LIKE \'' + data.key + '%\'"})'
    });
}

function saveParagraphReference_test() {
  doDelete({sql: "DELETE FROM news WHERE title = 'Тест для saveParagraphReferences'"});
  CacheService.getScriptCache().remove(CACHE_NEWS_ID_BY_KEY+"1508776644");
  var insertedNews = doInsertTestNews_data({title: 'Тест для saveParagraphReferences',
                                            link: 'ria.ru/interview/20171114/1508776644.html',
                                            key: '1508776644'}); 
  var paragraph = doInsert(
    {sql: 'INSERT INTO news_paragraphs (idnews, text, type) values (?,?,?)',
     data: [insertedNews.generatedKey, 'тест saveParagraphReferences', 1],
     types: ['Int', 'String', 'Int']});
  return runGroupTests(
    {name: 'saveParagraphReference',
     should: [ true, true ],
     data: [{paragraphs: 
             {link: {
               href: 'ria.ru/interview/20171114/1508776644.html', 
               type: 1,
               title: "Заголовок новости 1"
             },
              generatedKey: insertedNews.generatedKey,
              generatedKeyParagraph: paragraph.generatedKey}},
            {paragraphs: 
             {link: {
               href: 'ria.ru/interview/20171114/1508776444.html', 
               type: 1,
               title: "Заголовок новости 2"
             },
              generatedKey: insertedNews.generatedKey}}
           ],
     online: 'TEST_STOP_SQL_EXEC',
     clean: 'doDelete({sql: "DELETE FROM news_references WHERE idnews_from = ' + insertedNews.generatedKey + '"});',
     cleanAll: 'doDelete({sql: "DELETE FROM news WHERE title = \'Тест для saveParagraphReferences\'"});'
    });
}

function saveNewsTags_test() {
  doDelete({sql: 'DELETE FROM news WHERE title = "Тест для saveNewsTags"'});
  var insertedNews = doInsertTestNews_data({title: 'Тест для saveNewsTags'}); 
  var insertedNews1 = doInsertTestNews_data({title: 'Тест для saveNewsTags'}); 

  return runGroupTests(
    {name: 'saveNewsTags',
     should: [ true, true ],
     data: [{tags: [{name: 'tag1', type: 1}],
             generatedKey: insertedNews.generatedKey},
            {tags: [{name: 'tag1', type: -1}, {name: 'tag2', type: 1}],
             generatedKey: insertedNews1.generatedKey}
           ],
     online: 'TEST_STOP_SQL_EXEC',
     cleanAll: 'doDelete({sql: \'DELETE FROM news WHERE title = "Тест для saveNewsTags"\'});'
    });
}

function saveNewsRubrics_test() {
  var insertedNews = doInsertTestNews_data(); 
  return runGroupTests(
    {name: 'saveNewsRubrics',
     should: [ true, true ],
     data: [{rubrics: ['rubric1'],
             generatedKey: insertedNews.generatedKey},
            {rubrics: ['rubric1', 'rubric2'],
             generatedKey: insertedNews.generatedKey}
           ],
     online: 'TEST_STOP_SQL_EXEC',
     cleanAll: 'doDelete({sql: "DELETE FROM news WHERE idnews = ' + insertedNews.generatedKey + '"})'
    });
}

function saveNewsRaw_test() {
  var zip = zipArticlePage('test');
  var insertedNews = doInsertTestNews_data(); 
  return runGroupTests(
    {name: 'saveNewsRaw',
     should: [ true ],
     data: [ {generatedKey: insertedNews.generatedKey,
              zip: zip}
     ],
     online: 'TEST_STOP_SQL_EXEC',
     cleanAll: 'doDelete({sql: "DELETE FROM news WHERE idnews = ' + insertedNews.generatedKey + '"})'
    });
}

function doInsertTestNews_data(data) {
  var link, key, title, date, time;
  var test = splitDateTime(new Date().toISOString());
  if (!data) data = {};
  ("link" in data) ? link = data.link : link = Date.parse(new Date()).toString();
  ("key" in data) ? key = data.key : key = new Date().getTime().toString();
  ("date" in data) ? date = data.date : date = test.date;
  ("time" in data) ? time = data.time : time = test.time;
  ("title" in data) ? title = data.title : title = Date.parse(new Date()).toString();
  var insertedNews = doInsert(
    {sql: 'INSERT INTO news (title, idsource, key_from_source, date, time, link) values (?,?,?,?,?,?)',
     data: [title, RIA_SOURCE_ID, key, date, time, link],
     types: ['String', 'Int', 'String', 'String', 'String', 'String']}); 
  return insertedNews;
}