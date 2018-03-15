function runTest_user_profile() {     
  runBlockTests(['getUserProfileByPin', 'getUserProfileByKey', 'getUserKey', 'setNewAccessKey'
               ]);
}

function cleanUserProfileCache() {
  var userProfiles = getDataFromTable(
    {sql: "SELECT iduser, access_key, pincode FROM user_profile",
     resultFields: ['id','key', 'pin'],
     resultTypes: ['Int', 'String', 'String']
    });
  for (var i = 0, len_i = userProfiles.length; i < len_i; i++) {
    cleanCache(CACHE('USER_PROFILE_BY_KEY') + userProfiles[i].key);
    cleanCache(CACHE('USER_PROFILE_BY_PIN') + userProfiles[i].pin);
    cleanCache(CACHE('USER_KEY_BY_USERID') + userProfiles[i].id);
    cleanCache(CACHE('USER_ABILITIES_BY_USERID') + userProfiles[i].id);
    
  }
  return;
}

function getUserProfileByPin(userPin) {
  var result = getCacheObject(CACHE('USER_PROFILE_BY_PIN') + userPin);
  var key = Session.getTemporaryActiveUserKey();
  if (result) {
    saveUserLog({
      message: "Пользователь залогинен из кеша",
      obj: result,
      iduser: result.id,
      source: "getUserProfileByPin",
      event: LOG_EVENT("USER_LOGIN")});
    return result;
  }
  var userProfile = getDataFromTable(
    {sql: "SELECT iduser, user_name, config, email, access FROM user_profile WHERE pincode = ? and access_key = ?",
     resultTypes: ['Int', 'String', 'String', 'String', 'String'],
     resultFields: ['id', 'name', 'config', 'email', 'access'],
     whereData: [userPin, key],
     whereTypes: ['String', 'String']
    });
  if ((userProfile.length != 1)) {    
    saveUserLog({
      message: "Запрошен не верный пин код или ключ устарел",
      obj: {key: key, pin: userPin},
      source: "getUserProfileByPin",
      event: LOG_EVENT("USER_USER_NOT_FOUND")});
    return -1; 
  }
  result = {  
    id: userProfile[0].id, 
    key: key,
    name: userProfile[0].name, 
    email: userProfile[0].email, 
    config: JSON.parse(userProfile[0].config),
    access: JSON.parse(userProfile[0].access)
  };
  saveUserLog({
    message: "Пользователь залогинен",
    obj: result,
    iduser: userProfile[0].id,
    source: "getUserProfileByPin",
    event: LOG_EVENT("USER_LOGIN")});
  setCacheObject({key: CACHE('USER_PROFILE_BY_PIN') + userPin, value: result, time: CACHE('MAX_TIME')});
  return result;
}

function getUserProfileByPin_test() {
  return runGroupTests(
    {name: 'getUserProfileByPin',
     should: [false,true],
     data: ['', "1111"],
     compare: [
       '(result < 0 ? false : true) === pattern'
     ],
    });
}

function getUserProfileByKey(userKey) {
  var result = -1;
  var serverKey = Session.getTemporaryActiveUserKey();
  if (userKey != serverKey) { saveUserLog({
      message: "Серверный и переданный с клиента ключи - не совпадают",
      obj: {userKey: userKey, serverKey: serverKey},
      source: "getUserProfileByKey",
      event: LOG_EVENT("USER_SERVER_KEY_DONT_MATCH")});
    return result;
  }
  result = getCacheObject(CACHE('USER_PROFILE_BY_KEY') + userKey);
  if (result) {
    saveUserLog({
      message: "Пользователь залогинен из кеша",
      obj: result,
      iduser: result.id,
      source: "getUserProfileByKey",
      event: LOG_EVENT("USER_LOGIN")});
    return result;
  }
  var userProfile = getDataFromTable(
    {sql: "SELECT iduser, user_name, config, email, access FROM user_profile WHERE access_key = ?",
     resultTypes: ['Int', 'String', 'String', 'String', 'String'],
     resultFields: ['id', 'name', 'config', 'email', 'access'],
     whereData: [userKey],
     whereTypes: ['String']
    });
  if ((userProfile.length != 1)) {    
    var cachedId = getCacheId(userKey); /* проверяем есть ли новый ключ в кеше, если да, то одновляем ключ текущего пользователя*/
    if (cachedId) result = setNewAccessKey ({
      key: userKey,
      id: cachedId
    });
    else saveUserLog({
      message: "Запрошен отсутствующий в базе ключ",
      obj: {key: userKey},
      source: "getUserProfileByKey",
      event: LOG_EVENT("USER_USER_NOT_FOUND")});
    return result; 
  }
  result = {  
    id: userProfile[0].id, 
    key: userKey,
    name: userProfile[0].name, 
    email: userProfile[0].email, 
    config: JSON.parse(userProfile[0].config),
    access: JSON.parse(userProfile[0].access)
  };
  saveUserLog({
    message: "Пользователь залогинен",
    obj: result,
    iduser: userProfile[0].id,
    source: "getUserProfileByKey",
    event: LOG_EVENT("USER_LOGIN")});
  setCacheObject({key: CACHE('USER_PROFILE_BY_KEY') + userKey, value: result, time: CACHE('MAX_TIME')});
  return result;
}

function getUserProfileByKey_test() {
  var key = Session.getTemporaryActiveUserKey();
//  key= "AM2a9xNqfq8MPg0NRfgJ6589pypWRcrNBjXC3ezcoNO0u8sXdiFwZ2pNB4taxCSvPJaLSKS83rlZ";
  return runGroupTests(
    {name: 'getUserProfileByKey',
     should: [false,true],
     data: ['', key],
     compare: [
       '(result < 0 ? false : true) === pattern'
     ],
    });
}

function getUserKey(userEmail) {
  var result = -1;
  if (!userEmail) return result;
  var userId = getDataFromTable(
    {sql: "SELECT iduser FROM user_profile WHERE email = ?",
     resultTypes: ['Int'],
     whereData: [userEmail],
     whereTypes: ['String']
    });
  var serverKey = Session.getTemporaryActiveUserKey();
  if ((userId.length != 1)) {
    saveUserLog({
      message: "Запрошен отсутствующий в базе email",
      obj: {email: userEmail, userkey: serverKey},
      source: "getUserKey",
      event: LOG_EVENT("USER_USER_NOT_FOUND")});
    return result;
  }
  if (!getCacheObject(serverKey)) {
    setCache({ key: serverKey, value: userId[0], time: CACHE('EXPIRATION_NEW_KEY_TIME')});
    saveUserLog({
      message: "Отправлен email с новым ключом",
      obj: {email: userEmail, userkey: serverKey},
      source: "getUserKey",
      event: LOG_EVENT("USER_SENT_EMAIL")});
    MailApp.sendEmail({
      to: userEmail,
      subject: "[Digest]: new access key",
      htmlBody: "Новый ключ доступа: " + serverKey + " <br>" +
      "Ключ действителен в течении " + CACHE('EXPIRATION_NEW_KEY_TIME')/60 + " минут после отправления письма"
    });
  }
  result = 1;
  return result;
}

function getUserKey_test() {
  var key = Session.getTemporaryActiveUserKey();
return runGroupTests(
    {name: 'getUserKey',
     should: [true, false],
     data: ["dzeso@mail.ru", undefined],
     compare: [
       '(result < 0 ? false : true) === pattern'
     ],
    });
}

function setNewAccessKey(param) {
  var result = -1;
  if (!param) return result;
  var update = doUpdate({
    sql: 'UPDATE user_profile SET access_key = ? WHERE iduser = ?',
    data: [ param.key, param.id],
    types: ['String', 'Int']
  });
  // todo сделать транзакцию и если count != 1 откатить ее
  if (!update.isOk) {
    saveUserLog({
      message: "Отправлен email с новым ключом",
      iduser: param.id,
      obj: {iduser: param.id, userkey: param.key, error: update.error},
      source: "setNewAccessKey",
      event: LOG_EVENT("USER_SET_NEW_KEY_FAILED")});
    return result;}
  else saveUserLog({
      message: "Установлен новый ключ доступа",
      iduser: param.id,
      obj: {iduser: param.id, userkey: param.key},
      source: "setNewAccessKey",
      event: LOG_EVENT("USER_SET_NEW_KEY")});
  return getUserProfileByKey(param.key);
}

function setNewAccessKey_test() {
  var key = Session.getTemporaryActiveUserKey();
return runGroupTests(
    {name: 'setNewAccessKey',
     should: [true, false],
     data: [{key: key, id: 1}, undefined],
     compare: [
       '(result < 0 ? false : true) === pattern'
     ],
    });
}