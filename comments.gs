function runTest_comments() {     
  runBlockTests(['commentFromJSON', 'commentToJSON', 'getUserComments', 'setUserComments', 'setUserCommentsMode']);
}

function commentToJSON(comment) {
  var result = JSON.stringify(comment);
  return result;
}

function commentFromJSON(json) {
  var result = JSON.parse(decodeURIComponent(escape(json)));
  return result;
}

function commentToJSON_test() {
  var commnet = {rating:4, rubrics:[11, 2], tags:[12, 13], topics:[3, 5], text:"", user:2, grade:3, review:""}
  var result  = JSON.stringify(commnet);
  return runGroupTests(
    {name: 'commentToJSON',
     should: [result,'""'],
     data: [commnet, ""],
    });
}

function commentFromJSON_test() {
  var commnet = '{"rating":4,"rubrics":[11,2],"tags":[12,13],"topics":[3,5],"text":"","user":2,"grade":3,"review":""}';
  var result  = JSON.parse(commnet);
  return runGroupTests(
    {name: 'commentFromJSON',
     should: [result],
     data: [commnet],
     compare: [
       'result.rating === pattern.rating'
     ],
    });
}

//    saveUserLog({
//      message: "Запрошен не верный пин код или ключ устарел",
//      obj: {key: key, pin: userPin},
//      source: "getUserProfileByPin",
//      event: LOG_EVENT("USER_USER_NOT_FOUND")});

function setUserComments(param) {
  var conn = getConn(),
      result = {
        done: false,
        code: CODE_RESULT("SAVE_FAILED"),
        uploaded: []},
      date = "",
      saveComments = {},
      review = "",
      idreview = 0;
  if (!param || !param.iduser || !param.comments) return {
        done: false,
        code: "каого-то из параметров нехватает" + JSON.stringify(param),
        uploaded: []};
  if (!checkUserAbilities ({iduser: param.iduser, can: "comment", source: "setUserComments"})) return {
        done: false,
        code: "не прошел авторизацию" + JSON.stringify(param),
        uploaded: []};;
  if (!conn.isOk) return result;
  else startTransaction(conn.jdbc);
  
  for (var i = 0, len_i = param.comments.length; i < len_i; i++) {
    date = dateToChar19();
    review = commentToJSON(param.comments[i].review);
    idreview = param.comments[i].idc;
    if (idreview < 0) saveComments = doInsert(
        {connection: conn.jdbc,
         sql: 'INSERT INTO user_news_review (iduser, idnews, review, idstatus, mode, created, last_edited) values (?,?,?,?,?,?,?)',
         data: [param.iduser, param.comments[i].id, review, param.comments[i].idstatus, param.comments[i].mode, date, date],
         types: ['Int', 'Int', 'String', 'Int', 'String', 'String', 'String']});
    else saveComments = doUpdate(
        {connection: conn.jdbc,
         sql: 'UPDATE user_news_review SET review = ?, idstatus = ?, mode = ?, last_edited = ? WHERE idreview = ?',
         data: [ review, param.comments[i].idstatus, param.comments[i].mode, date, idreview],
         types: ['String', 'Int', 'String', 'String', 'Int']
        });
    if (saveComments.generatedKey) idreview = saveComments.generatedKey;
    result.done = saveComments.isOk;
    if (result.done) result.uploaded.push(idreview);
    else break;
  }
  
  if (result.done) {
    commitTransaction(conn.jdbc);
    result.code = CODE_RESULT("SAVE_SUCCESSFULLY");
  }
  else rollbackTransaction(conn.jdbc);
  closeSqlConnection({conn: conn.jdbc});
  return result;
}

function setUserComments_test() {
  var data = dateToChar19();
  var param = {
    iduser: 1,
    comments: [
      {idc: -1, id: 1, idstatus: 0, mode: 2, review: {rating:4,rubrics:[11,2],text:data,user:2,review:""}},
      {idc: 1, id: 1, idstatus: 0, mode: 2, review: {rating:4,rubrics:[11,2],text:"обновлена "+data,user:2,review:""}}
    ]
  };
return runGroupTests(
    {name: 'setUserComments',
     should: [true, false],
     data: [param, {}],
     compare: [
       'result.done === pattern'
     ],
    });
}

function getUserComments(idUser) {
  var result = {
        done: true,
        code: CODE_RESULT("UPLOAD_SUCCESSFULLY"), 
        downloaded: []},
      comments = [],
      review = "";
  if (!idUser || !checkUserAbilities ({iduser: idUser, can: "comment", source: "getUserComments"})) return {
        done: false,
        code: CODE_RESULT("UPLOAD_UNAUTHORIZED"), 
        downloaded: []
      };  
  var comments = getDataFromTable(
    {sql: "SELECT idreview, idnews, review, idstatus, last_edited, mode  FROM user_news_review WHERE iduser = ? AND mode IN (0,3)", /* выбираем только то, что "ARCHIVE" (0) и "DOWNLOAD" (3)*/
     resultTypes: ['Int', 'Int', 'String', 'Int', 'String', 'String'],
     resultFields: ['idc', 'id', 'review', 'state', 'date', 'mode'],
     whereData: [idUser],
     whereTypes: ['Int']
    });
  for (var i = 0, len_i = comments.length; i < len_i; i++){
    review = commentFromJSON(comments[i].review);
    result.downloaded.push({
      idc: comments[i].idc,
      id: comments[i].id,
      state: comments[i].state,
      date: comments[i].date,
      mode: comments[i].mode,
      rubrics: review.rubrics,
      rating: review.rating,
      comment: review.comment,
      review: review.review     
    });
  }
  return result;
}

function getUserComments_test() {
  var key = Session.getTemporaryActiveUserKey();
return runGroupTests(
    {name: 'getUserComments',
     should: [true, false],
     data: [1, {}],
     compare: [
       'result.done === pattern'
     ],
    });
}

function setUserCommentsMode(param) {
  var result = {
        done: false,
        code: CODE_RESULT("SAVE_FAILED")};
  if (!param || !param.iduser || !param.mode || !param.idclist || !param.idclist.length) return result;
  if (!checkUserAbilities ({iduser: param.iduser, can: "comment", source: "setUserCommentsMode"})) return result;
  
  var idcList = '(' + param.idclist.join(',') + ')';
  var date = dateToChar19();
  var updateCommentsMode = doUpdate(
        {sql: 'UPDATE user_news_review SET mode = ?, last_edited = ? WHERE iduser = ? AND idreview in ' + idcList,
         data: [ param.mode, date, param.iduser ],
         types: ['String', 'String', 'Int']
        });
  
  if (updateCommentsMode.isOk) result = {
        done: true,
        code: CODE_RESULT("SAVE_SUCCESSFULLY")};
  return result;
}

function setUserCommentsMode_test() {
  var param = {
    iduser: 1,
    idclist: [1,5],
    mode: 4
  };
return runGroupTests(
    {name: 'setUserCommentsMode',
     should: [true, false],
     data: [param, {}],
     compare: [
       'result.done === pattern'
     ],
    });
}