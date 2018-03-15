function runTest_api_get_data() { 

  runBlockTests(
    ['apiGetRef',
     'apiGetNews', 
     'apiGetUserProfile',
     'apiNewsComments']);
}
function apiGetRef(request) {  
/*request { name: "" - имя справочника
            param: {lastId: number - последний загруженый код,
                    version: number - номер версии справочника}
  result [{ id, nm}]
*/  
  //Кеширование версии справочника целиком, или справочник + код с которого
  var result = [];
  if(!request || !request.name) return result; 
  var param = request.param || {};
  var version = param.version || 0;
  var lastId = param.lastId || 0;
  var cacheName = getRefCaheName({name: request.name, version: version, lastId: lastId});
  if(version) {
    result = getCacheObject(cacheName);
    if(result) return result;
  }
              
  switch(request.name) {
    case "version":
      result = getRefVersion();
      break;
    case "tag":
    case "rubric":
    case "source":
    case "tag_type":
    case "status":
      result = getRefData({name: request.name, id:lastId});
      break;
    default:
      Logger.log ("apiGetRef: неизвестный справочник " + request.name); /* todo заменить потом на запись в лог*/
      break;
  }     
  if(result.length && version) setCacheObject({key: cacheName, value: result, time: CACHE('MAX_TIME')});
  return result;
}

function apiGetRef_test() {
  return runGroupTests(
    {name: 'apiGetRef',
     should: [0,1,1,1,0,0],
     data: [{name: "wrongname"},
            {name: "source", param: {lastId: 0}},
            {name: "tag_type", param: {version: 1}},
            {name: "rubric", param: {version: 1, lastId: 1}},
            undefined, {}],
     compare: ["lengthTest(result) > 0 || lengthTest(result) === pattern"]
    });
}

function apiGetNews(request) {  
/*request { command: "" - имя команды на получение (например только драфты)
            param: - параметры вызова 
            {dateLastEdited - дата последней новости}
            }
  result [{ список новостей }]
*/  

  var result = [];
  if(!request || !request.command || !request.param) return result;   

  switch(request.command) {
    case "last":
      result = getListNewsByDateLastEdited(request.param.dateLastEdited);
      break;   
    case "upload server":
      result = uploadCurrentNews();
      break;        
    default:
      Logger.log ("apiGetNews: неизвестная команда " + request.command);
      break;
  }
  
  return result;
}

function apiGetNews_test() {
  return runGroupTests(
    {name: 'apiGetNews',
     should: [0, 0],
     data: [{command: "last", param: {dateLastEdited: dateToChar19(getDateShif ({date: new Date(), shift: -0})) }},
           {command: "upload server", param: {}}],
     compare: ["0 < lengthTest(result)"]
    });
}

function apiGetUserProfile(request) {  
/* { command: get profile - получить по ки профайл без почты
              get key - по почте получить новый ки
     param: - параметры вызова 
            {key,
            email}
            }
            
   return { profile или -1 если не получилось. 
   todo - возможно стоит возвращать коды проблем} 
*/ 
  
  var result = -1;
  if(!request || !request.command || !request.param) return result;   

  switch(request.command) {
    case "get profile":
      if (request.param.key) result = getUserProfileByKey(request.param.key);
      if (request.param.pin) result = getUserProfileByPin(request.param.pin);
      break;   
    case "get key":
      result = getUserKey(request.param.email);
      break;        
    default:
      Logger.log ("apiGetUserProfile: неизвестная команда " + request.command);
      break;
  }
  var qq=1;
  return result;
}

// тест на конкретные ключи которые устаревают со временем
function apiGetUserProfile_test() {
  var key = Session.getTemporaryActiveUserKey();
  return runGroupTests(
    {name: 'apiGetUserProfile',
     should: [false, true, true, false, false, false],
     data: [{command: "get profile", param: {key: "AM2a9xNqfq8MPg0NRfgJ6589pypWRcrNBjXC3ezcoNO0u8sXdiFwZ2pNB4taxCSvPJaLSKS83rlZ" }},
            {command: "get key", param: {email: "verderevsky.eot@gmail.com"}},
            {command: "get profile", param: {key: key }},
            {command: "get profile", param: {pin: "1234"}},
            {command: "get key", param: {email: ""}},
            undefined ],
     compare: [
       '(result < 0 ? false : true) === pattern'
     ],
    });
}

function apiNewsComments(request) {  
/*request { command: "" - имя команды на получение (например только драфты)
            param: - параметры вызова 
  result { done: реузльтат исполнения булеан,
           code: код результата,
           данные: если они есть}
*/  

  var result = {
        done: false,
        code: CODE_RESULT("API_CALL_FAILED")};
  if(!request || !request.command || !request.param) return result;   

  switch(request.command) {
    case "download comments":
      if (request.param.iduser) result = getUserComments(request.param.iduser);
      break;          
    case "set comments mode":
      result = setUserCommentsMode(request.param);
      break;          
    case "upload comments":
      result = setUserComments(request.param);
      break;          
    default:
      Logger.log ("apiNewsComments: неизвестная команда " + request.command);
      break;
  }
  
  
  
  return result;
}

function apiNewsComments_test() {
  var data = dateToChar19();
  var param = {
    iduser: 1,
    comment: [
      {idc: -1, id: 1, idstatus: 0, mode: 2, review: {rating:4,rubrics:[11,2],text:data,user:2,review:""}},
      {idc: 1, id: 1, idstatus: 0, mode: 2, review: {rating:4,rubrics:[11,2],text:"обновлена "+data,user:2,review:""}}
    ]
  };
  return runGroupTests(
    {name: 'apiNewsComments',
     should: [true, true, true, false],
     data: [{command: "download comments", param: {iduser: 1}},
            {command: "set comments mode", param: {iduser: 1, idclist: [1], mode: 4}},
            {command: "upload comments", param: param},
            {command: "download comments", param: {}}],
     compare: ["result.done === pattern"]
    });
}