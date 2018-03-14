function runTest_auth() {     
  runBlockTests(['checkUserKey', 'checkUserAbilities']);
}

function checkUserKey(param) {
  if (!param || !param.iduser || !param.source || !isNumber(param.iduser)) return false;
  var key = Session.getTemporaryActiveUserKey();
  var userKey = getCache(CACHE('USER_KEY_BY_USERID') + param.iduser);
  if (!userKey) {     
    var resultSet = getDataFromTable(
      {sql: "SELECT access_key FROM user_profile WHERE iduser = ?",
       resultTypes: ['String'],
       whereData: [param.iduser],
       whereTypes: ['Int']
      });
    if ((resultSet.length === 1)) {    
      userKey = resultSet[0];
      setCache({key: CACHE('USER_KEY_BY_USERID') + param.iduser, value: userKey, time: CACHE('MAX_TIME')});
    } 
  }
  var result = (userKey === key);
  if (!result) saveUserLog({
      message: "Попытка подмены ключа доступа",
      obj: param,
      iduser: param.iduser,
      source: param.source,
      event: LOG_EVENT("USER_KEY_DONT_MATCH")});
  return result;
}


function checkUserKey_test() {
  return runGroupTests(
    {name: 'checkUserKey',
     should: [true, false],
     data: [{iduser: 1, source: "checkUserKey"}, ""],
    });
}

function checkUserAbilities(param) {
  if (!param || !param.iduser || !param.can || !param.source) return false;
  if (!checkUserKey({iduser: param.iduser, source: param.source})) return false;
  var abilities = getCacheObject(CACHE('USER_ABILITIES_BY_USERID') + param.iduser);
  if (!abilities) {     
    var resultSet = getDataFromTable(
      {sql: "select access from user_profile where iduser = ?",
       resultTypes: ['String'],
       whereData: [param.iduser],
       whereTypes: ['Int']
      });
    if ((resultSet.length === 1)) {    
      abilities = JSON.parse(resultSet[0]);
      setCacheObject({key: CACHE('USER_ABILITIES_BY_USERID') + param.iduser, value: abilities, time: CACHE('MAX_TIME')});
    } 
  }
  var result = (abilities[param.can] ? true : false);
  if (!result) saveUserLog({
      message: "Попытка не авторизованного доступа",
      obj: param,
      iduser: param.iduser,
      source: param.source,
      event: LOG_EVENT("USER_UNAUTHORIZED_API_CALL")});
  return result;
}


function checkUserAbilities_test() {
  return runGroupTests(
    {name: 'checkUserAbilities',
     should: [true, false, false],
     data: [
       {iduser: 1, can: "comment", source: "checkUserAbilities"}, 
       {iduser: 1, can: "think", source: "checkUserAbilities"}, 
       {iduser: 1, can: "admin", source: "checkUserAbilities"}],
    });
}