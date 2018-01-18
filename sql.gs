function runTest_sql() {  
  runBlockTests(['getLogin_',
                 'getSqlConnection',
                 'getConn',
                 'setStmtValue',
                 'getResultsetValue',
                 'closeSqlConnection',
                 'doInsert',
                 'doUpdate',
                 'doDelete',
                 'doSelect',
                 'getDataFromTable',
                 'saveCrawlerLog'
                ]);
}

function getDataFromTable(request) {
       
//  Пример запроса данных:
//  
//       sql: "SELECT idnews FROM news WHERE key_from_source = ?",
//       resultTypes: ['Int'],
//       resultFields: ['id'], - eсли поля нет, то результат массив из первого значения резалсета, иначе объект с указанными полями
//       whereData: [key],
//       whereTypes: ['String']
  
  var result = [];
  if (!request) return result;
  
  var  resultSet = doSelect(
      {sql: request.sql,
       resultTypes: request.resultTypes,
       whereData: request.whereData,
       whereTypes: request.whereTypes
      });
  
  if (resultSet.count < 1 || !resultSet.isOk) return result;
  
  var obj = "";
  if (request.resultFields) {
    for (var i = 0, len_i = request.resultFields.length; i < len_i; i++) { 
      obj += request.resultFields[i] + ": resultSet.dataset[i][" + i +"],";
    }
    obj = (obj === "") ? "" : "result.push({" + obj + "})";
  }
  
  for (var i = 0, len_i = resultSet.dataset.length; i < len_i; i++) { 
    (obj === "") ? result.push(resultSet.dataset[i][0]) : eval(obj);
  }
  
  return result;
}

function getDataFromTable_test() {
  // todo переписать этот текст на нормальные тестовые данные. Пока используется затычка
  return runGroupTests(
    {name: 'getDataFromTable',
     should: [7,1],
     data: [
       {sql: "SELECT idparagraph, text, type FROM news_paragraphs WHERE idnews = ?",
        resultTypes: ['Int', 'String', 'Int'],
        resultFields: ['id', 'text', 'type'],
        whereData: [1],
        whereTypes: ['Int']
       },
       { sql: "SELECT idtags FROM news_tags WHERE idnews = ?",
        resultTypes: ['Int'],
        whereData: [1],
        whereTypes: ['Int']
       }],
     online: 'TEST_STOP_SQL_EXEC',
     compare: [
       "pattern === lengthTest(result)"
     ]
    });
}

function closeSqlConnection(сonnection) {
  var isClosed = {};
  isClosed.resultset = closeSqlSessions(сonnection.resultset);
  isClosed.stmt = closeSqlSessions(сonnection.stmt);
  isClosed.conn = closeSqlSessions(сonnection.conn);
  return isClosed
}

function startTransaction(session) {
  if (TEST_STOP_SQL_COMMIT) return false;
  return session.setAutoCommit(false);
}

function commitTransaction(session) {
  if (TEST_STOP_SQL_COMMIT) return false;
  else session.commit();
  return true;
}

function rollbackTransaction(session) {
  if (TEST_STOP_SQL_COMMIT) return false;
  else session.rollback();
  return true;
}

function closeSqlSessions(sessions) {
  var result = {isOk: true,
                error: {}};
  if (sessions === undefined || sessions === null) {return result;}
  try { sessions.close(); }
  
  catch(error){result.isOk = false;
               result.error = error;}
  finally{ return result; }
}

function doDelete(del) {
  
  var result = {isOk: false,
                count: 0,
                error: ''};
  
  var connection = getConn(del.connection);
  if (!connection.isOk) { 
    return result; 
  }
  
  try {    
    var stmt = connection.jdbc.prepareStatement(del.sql);
    eval(setStmtValue({value: 'del.data',
                       types: del.types})
        );
    result.count = stmt.executeUpdate();
    result.isOk = true;
  }
  catch(error){
    result.error = error;
  }
  finally{
    (del.connection === undefined) ? 
      closeSqlConnection({stmt: stmt,
                          conn: connection.jdbc})
    : closeSqlConnection({stmt: stmt})
    return result;
  }
}

function doDelete_test() {
  var insert = doInsert({sql: 'INSERT INTO test (testcol, testcol1) values (?,?)',
                         data: ['test', 1],
                         types: ['String', 'Int']});
  return runGroupTests(
    {name: 'doDelete',
     should: [1],
     data: [{sql: "DELETE FROM test WHERE idtest = ?",
             data: [insert.generatedKey],
             types: ['Int']}
     ],
     compare: [
       '(result.count === pattern)'
     ],
     online: 'TEST_STOP_SQL_EXEC'
    });
}

function doInsert(insert) {
  
//  connection: активный коннект к базе
//  sql: текст sql запроса
//  data: [] - массив переменных для вставки,
//  types: ['String', 'Int', 'Blob'] - массив типов переменных для вставки
        
  var result = {isOk: false,
                count: 0,
                error: '',
                generatedKey: 0};
  
  var connection = getConn(insert.connection);
  if (!connection.isOk) { 
    return result; 
  }   
  try {    
    var stmt = connection.jdbc.prepareStatement(insert.sql, RETURN_GENERATED_KEYS);
    eval(setStmtValue({value: 'insert.data',
                       types: insert.types})
        );
    result.count = stmt.executeUpdate();    
    result.generatedKey = getAutoGeneratedKeys(stmt)[0];
    result.isOk = true;
  }
  catch(error){
    result.error = error;
    Logger.log(error);
  }
  finally{
    (insert.connection === undefined) ? 
      closeSqlConnection({stmt: stmt,
                          conn: connection.jdbc})
    : closeSqlConnection({stmt: stmt})
    return result;
  }
}

function doUpdate(update) {
  
//  connection: активный коннект к базе
//  sql: текст sql запроса
//  data: [] - массив переменных для вставки,
//  types: ['String', 'Int', 'Blob'] - массив типов переменных для вставки
        
  var result = {isOk: false,
                count: 0,
                error: '',
                generatedKey: 0};
  
  var connection = getConn(update.connection);
  if (!connection.isOk) { 
    return result; 
  }   
  try {    
    var stmt = connection.jdbc.prepareStatement(update.sql);
    eval(setStmtValue({value: 'update.data',
                       types: update.types})
        );
    result.count = stmt.executeUpdate();    
    result.isOk = true;
  }
  catch(error){
    result.error = error;
  }
  finally{
    (update.connection === undefined) ? 
      closeSqlConnection({stmt: stmt,
                          conn: connection.jdbc})
    : closeSqlConnection({stmt: stmt})
    return result;
  }
}

function doUpdate_test() {
  var insert1 = doInsert({sql: 'INSERT INTO test (testcol, testcol1) values (?,?)',
                         data: ['test1', 1],
                         types: ['String', 'Int']});
  return runGroupTests(
    {name: 'doUpdate',
     should: [1,0],
     data: [ {sql: 'UPDATE test SET testcol = ? WHERE idtest = ?',
              data: [ 3, insert1.generatedKey],
              types: ['Int', 'Int']},
            {sql: 'UPDATE test SET testcol = ? WHERE idtest = ?',
              data: [ 3, 0],
              types: ['Int', 'Int']}
     ],
     compare: [
       '(result.count === pattern)'
     ],
     online: 'TEST_STOP_SQL_EXEC',
     clean: 'doDelete({sql: "DELETE FROM test WHERE idtest = ' + insert1.generatedKey +'"})'
    });
}

function doSelect(select) {
  
  var result = {isOk: false,
                count: 0,
                dataset: [],
                error: ''};
  
  var connection = getConn(select.connection);
  if (!connection.isOk) { 
    return result; 
  }
  
  try {    
    var stmt = connection.jdbc.prepareStatement(select.sql);
    eval(setStmtValue({value: 'select.whereData',
                       types: select.whereTypes})
        );
    var resultset = stmt.executeQuery();
    var dataResults = getResultsetValue(select.resultTypes);
    while (resultset.next()) {
      result.dataset[result.count++] = eval(dataResults);
    }
    result.isOk = true;
  }
  catch(error){
    result.error = error;
  }
  finally{
    (select.connection === undefined) ? 
      closeSqlConnection({resultset: resultset,
                          stmt: stmt,
                          conn: connection.jdbc})
    : closeSqlConnection({resultset: resultset,
                          stmt: stmt})
    return result;
  }
}

function doSelect_test() {
  var insert1 = doInsert({sql: 'INSERT INTO test (testcol, testcol1) values (?,?)',
                         data: ['test1', 1],
                         types: ['String', 'Int']});
  var insert2 = doInsert({sql: 'INSERT INTO test (testcol, testcol1) values (?,?)',
                         data: ['test2', 2],
                         types: ['String', 'Int']});
  return runGroupTests(
    {name: 'doSelect',
     should: [2],
     data: [{sql: "SELECT idtest, testcol, testcol1 FROM test WHERE idtest IN (?,?)",
             resultTypes: ['Int', 'String', 'Int'],
             whereData: [insert1.generatedKey, insert2.generatedKey],
             whereTypes: ['Int', 'Int']
            }
     ],
     compare: [
       '(result.count === pattern)'
     ],
     online: 'TEST_STOP_SQL_EXEC',
     clean: 'doDelete({sql: "DELETE FROM test WHERE idtest IN ('+insert1.generatedKey+','+insert2.generatedKey+')"})'
    });
}

function getAutoGeneratedKeys(stmt) {
//    Не очень понятно как это работает в javascript
//    Примеря взят отсюда https://stackoverflow.com/questions/13543433/google-cloud-sql-return-generated-keys    

  var resultset = stmt.getGeneratedKeys(),
      result = [0],
      i = 0;
  while(resultset.next()) { 
    result[i] = resultset.getInt(RETURN_GENERATED_KEYS);
  }
  resultset.close();
  return result;
}

function getConn(connection) {
  var result = {
    isOk: true,
    jdbc: undefined};
  
  (connection !== undefined) ? result.jdbc = connection : result = getSqlConnection(getLogin_());
  
  return result;
}

function getLogin_(param) {
  
  var login = {};
  
  (param !== undefined) ? login = param : login = 
    {address: '35.193.2.47',
     user: 'user',
     userPwd: 'user9705313',
     db: 'digest',
     dbUrl: 'jdbc:mysql://35.193.2.47/digest'
    };
  
  return login;  
}

function setStmtValue(stmtData) {
  var result = '';
  if (stmtData.types === undefined || stmtData.value === '') {
    return '';
  }
  for (var i = 0, len_i = stmtData.types.length; i < len_i; i++) {
    if (stmtData.types[i] === 'Blob') {
      result += 'var newBlob=connection.jdbc.createBlob();newBlob.setBytes(1,' + stmtData.value +'['+ i + ']);' + stmtData.value +'['+ i + ']=newBlob;';
    }
    result +=  'stmt.set' + stmtData.types[i] + '(' + (i+1) + ',' + stmtData.value +'['+ i + ']);';
  }
  return result;
}

function getResultsetValue(resultsetTypes) {
  var result = [];
  if (resultsetTypes === undefined) {
    return '[]';
  }
  for (var i = 0, len_i = resultsetTypes.length; i < len_i; i++) {
    result[i] = 'resultset.get' + resultsetTypes[i] + '(' + (i+1) + ')';
  }
  return '[' + result.join(',') + ']';
}

function getSqlConnection(login) {     
  var result = {
    jdbc: {},
    isOk: true,
    error: {}
  }
  try {
    result.jdbc = Jdbc.getConnection(login.dbUrl, login.user, login.userPwd);
  }
  catch(error){
    result.isOk = false;
    result.error = error;
  }
  finally{
    return result;
  }
}

function saveCrawlerLog(log) {
  if(!log || !log.message) {
    Logger.log("[saveCrawlerLog]: попытка сохранить пустое собщение");
    return {isOk: false,
            count: 0,
            error: '',
            generatedKey: 0};
  }
  var obj = (typeof log.obj === 'object') ? JSON.stringify(log.obj) : log.obj,
      message = _.truncate(log.message, {'length': 255,'omission': ' [...]'}),
      source = _.truncate(log.source, {'length': 124,'omission': ' [...]'}); 
  obj = _.truncate(obj, {'length': 4096,'omission': ' [...]'});
  
  return doInsert({sql: 'INSERT INTO crawler_logger (source, obj, log, event) values (?,?,?,?)',
                   isCommit: true,
                   data: [source, obj, message, log.event],
                   types: ['String', 'String', 'String', 'Int']});
}

/////////////////////////

function closeSqlConnection_test() {
  var conn = {jdbc: ''};
  if (!TEST_STOP_SQL_EXEC) {
    var conn = getSqlConnection(getLogin_());
    var stmt = conn.jdbc.createStatement();
    var resultset = stmt.executeQuery('SELECT * FROM ref_source');
  }
  return runGroupTests(
    {name: 'closeSqlConnection',
     should: [
       {resultset: {isOk: true}, stmt: {isOk: true}, conn: {isOk: true}},
       {resultset: {isOk: true}, stmt: {isOk: false}, conn: {isOk: true}},
       {resultset: {isOk: true}, stmt: {isOk: false}, conn: {isOk: true}},
       {resultset: {isOk: true}, stmt: {isOk: true}, conn: {isOk: true}}
     ],
     data: [
       {resultset: resultset,
        stmt: stmt,
        conn: conn.jdbc
       },
       {resultset: resultset,
        stmt: stmt,
        conn: conn.jdbc
       },
       {stmt: stmt,
        conn: conn.jdbc
       },
       {resultset: undefined,
        stmt: null,
        conn: undefined
       }
     ],
     compare: [
       "pattern.resultset.isOk === result.resultset.isOk",
       "pattern.stmt.isOk === result.stmt.isOk",
       "pattern.conn.isOk === result.conn.isOk"
     ],
     online: 'TEST_STOP_SQL_EXEC'
    });
}

function getConn_test() {
  var connection = getSqlConnection(getLogin_());
  return runGroupTests(
    {name: 'getConn',
     should: [
       true, true
     ],
     data: [ 
       connection.jdbc,
       undefined
     ],
     compare: [
       '(result.isOk === pattern)'
     ],
     online: 'TEST_STOP_SQL_EXEC'
    });
}

function doInsert_test() {
  return runGroupTests(
    {name: 'doInsert',
     should: [1],
     data: [ {sql: 'INSERT INTO test (testcol, testcol1) values (?,?)',
              data: ['test', 1],
              types: ['String', 'Int']}
     ],
     compare: [
       '(result.count === pattern)'
     ],
     online: 'TEST_STOP_SQL_EXEC',
     clean: 'doDelete({sql: "DELETE FROM test WHERE idtest = \" + result.generatedKey + \""})'
    });
}



function getLogin__test() {
  return runGroupTests(
    {name: 'getLogin_',
     should: [
       {address: '35.193.2.47',
        user: 'user',
        userPwd: 'user9705313',
        db: 'digest',
        dbUrl: 'jdbc:mysql://35.193.2.47/digest'
       },
       {address: '35.193.2.47',
        user: 'user1',
        userPwd: 'user9705313',
        db: 'digest',
        dbUrl: 'jdbc:mysql://35.193.2.47/digest'
       },
       '', null
     ],
     data: [
       undefined,
       {address: '35.193.2.47',
        user: 'user1',
        userPwd: 'user9705313',
        db: 'digest',
        dbUrl: 'jdbc:mysql://35.193.2.47/digest'
       },
       '', null
     ],
     compare: [
       "JSON.stringify(pattern) === JSON.stringify(result)"
     ],
     online: 'TEST_STOP_SQL_EXEC'
    });
}

function getSqlConnection_test() {
  return runGroupTests(
    {name: 'getSqlConnection',
     should: [true,false,false,false,false],
     data: [
       getLogin_(),
       getLogin_(
         {address: '35.193.2.47',
          user: 'user1',
          userPwd: 'user9705313',
          db: 'digest',
          dbUrl: 'jdbc:mysql://35.193.2.47/digest'
         }),
       '', null, undefined 
     ],
     compare: [
       "pattern === result.isOk"
     ],
     online: 'TEST_STOP_SQL_EXEC'
    });
}

function setStmtValue_test() {
  return runGroupTests(
    {name: 'setStmtValue',
     should: ["var newBlob=connection.jdbc.createBlob();newBlob.setBytes(1,insert.value[0]);insert.value[0]=newBlob;stmt.setBlob(1,insert.value[0]);",
              "stmt.setInt(1,insert.value[0]);stmt.setString(2,insert.value[1]);",
              ""
     ],
     data: [{ value: 'insert.value',
             types: ['Blob']},
            { value: 'insert.value',
             types: ['Int','String']},
            {}
     ]
    });
}

function getResultsetValue_test() {
  return runGroupTests(
    {name: 'getResultsetValue',
     should: ["[resultset.getInt(1),resultset.getString(2)]",
              "[resultset.getInt(1),resultset.get(2)]",
              "[]",
              "[]"
     ],
     data: [['Int','String'],
            ['Int',''],
            '',
            undefined
     ]
    });
}

function saveCrawlerLog_test() {
  return runGroupTests(
    {name: 'saveCrawlerLog',
     should: [1],
     data: [{message: 'Тест работы функции saveCrawlerLog',
              obj: {test: {subtest: 'test'}},
              source: "saveCrawlerLog",
              event: LOG_EVENT_TEST}
     ],
     compare: [
       '(result.count === pattern)'
     ],
     online: 'TEST_STOP_SQL_EXEC'
    });
}
