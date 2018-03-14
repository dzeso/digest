function runTest_test() {   
  runBlockTests(['lengthTest',
                 'isOnlineTestBloked']);
}

function isOnlineTestBloked(online) { 
  var result = {message: 'skiped by ' + online,
                isBloked: false};
  switch (online) {
    case 'TEST("STOP_WEB_LOAD")':
      result.isBloked = TEST("STOP_WEB_LOAD");
      break;
    case 'TEST("STOP_SQL_EXEC")':
      result.isBloked = TEST("STOP_SQL_EXEC");
      break;
  }
  return result;  
}

function runGroupTests(test) {

//  test.name - название тестируемой функции. Параметр у нее должен быть один
//  test.should - массив тестовых ответов
//  test.data - массив входных данных. Необязательный параметр
//  test.compare - массив условий для сравнения результатов, по умолчанию pattern === result
//  test.online - разрешение выполнять онлайн операции при тестировании
  
//  TODO решить проблему несовпадения результатов у функции и у тестовых данных. СТоит ли что-то с этим делать?
  
  if (test.online) {
    var onlineTest = isOnlineTestBloked(test.online);
    if (onlineTest.isBloked) {
      Logger.log('         ' + onlineTest.message);
      return null;
    }    
  }

  var doCompare = [],
      testPassed = true,
      isOk = true,
      parameters = '',
      strForEval = '',
      result = '',
      pattern = '';
  
  ("data" in test) ? parameters = '(test.data[i])' : parameters = '';
  ("compare" in test) ? doCompare = test.compare : doCompare = ['pattern === result'];
  
  if (!test.should) {
    Logger.log(test.name +'(): не заданы ожидаемые результаты исполнения');
    return false;
  }
  
  if ((parameters !== '') && (test.data.length < test.should.length)) {
    Logger.log(test.name +'(): недостаточно вариантов входных параметров (задано - %s, ожидается - %s)', test.data.length, test.should.length);
    return false;
  }
  for (var i = 0, len_i = test.should.length; i < len_i; i++) {
    strForEval = test.name + parameters;
    result = eval(test.name + parameters);
    pattern = test.should[i];
    for (var j = 0, len_j = doCompare.length; j < len_j; j++) {
      try {
        eval('(' + doCompare[j] + ') ? isOk = true : isOk = false');
      }
      catch(error){
        isOk = false;
        var message = " Oшибка в doCompare[j] (" + doCompare[j] + ") "+ error.name + ' -> ' + error.message;
        Logger.log(message);
      }
      if (!isOk) {
        testPassed = false;
        Logger.log(test.name +'(): oшибка в тесте № ' + (i + 1) + (("compare" in test) ? ' при условии: ' + doCompare[j] : ''));
      }
    }
    if (test.clean !== undefined) {
      eval(test.clean);
    }
  }
  if (test.cleanAll !== undefined) {
    eval(test.cleanAll);
  }
  return testPassed;
}

function runTest(name) { 
  
  var isOk = true;
  
  try {
    eval('isOk = ' + name + '_test();');
  }
  catch(error){
    isOk = false;
    var message = " Oшибка: " + error.name + ' on line: ' + error.lineNumber + ' -> ' + error.message;
    Logger.log(message);
  }
  Logger.log((isOk ? ' +++++ ' + name + '() - пройден' : ((isOk !== null) ? ' ----- ' + name + '() - провален' : ' ***** ' + name + '() - пропущен')));
  return isOk;
}

function runBlockTests(names) { 
  
  var isOk = true,
      isOkBlock = true;
 
  for (var i = 0, len_i = names.length; i < len_i; i++) {
    eval('isOk = ' + names[i] + '_test();');
    Logger.log((isOk ? ' +++++ ' + names[i] + '() - пройден' : ((isOk !== null) ? ' ----- ' + names[i] + '() - провален' : ' ***** ' + names[i] + '() - пропущен')));
    if (!isOk) { isOkBlock = false };
  }
  return isOkBlock;
}

function lengthTest(data) {
  var result = 0;
  (data === undefined) ? 
    result = undefined : (data === null) ? result = null : result = data.length;
  return result;
}


////////////

function lengthTest_test() {
  return runGroupTests(
    {name: 'lengthTest',
     should: [3,0,undefined, null],
     data: ['123','',undefined, null]
    });
}

function isOnlineTestBloked_test() {
  return runGroupTests(
    {name: 'isOnlineTestBloked',
     should: [{message: 'skiped by TEST("STOP_WEB_LOAD")', isBloked: TEST("STOP_WEB_LOAD")},
              {message: 'skiped by ', isBloked: false},
              {message: 'skiped by undefined', isBloked: false},
              {message: 'skiped by TEST("STOP_SQL_EXEC")', isBloked: TEST("STOP_SQL_EXEC")},
              {message: 'skiped by null', isBloked: false}],
     data: ['TEST("STOP_WEB_LOAD")','',undefined, 'TEST("STOP_SQL_EXEC")', null],
     compare: [
       "pattern.isBloked === result.isBloked",
       "pattern.message === result.message"
     ]
    });
}