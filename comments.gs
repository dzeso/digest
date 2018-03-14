function runTest_comments() {     
  runBlockTests(['commentFromJSON', 'commentToJSON', 'getUserComments', 'setUserComments']);
}

function commentToJSON(comment) {
  var result = JSON.stringify(comment);
  return result;
}

function commentFromJSON(json) {
  var result = JSON.parse(json);
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

function setUserComments(param) {
  var conn = getConn(),
      result = {
        done: false,
        code: CODE_RESULT("SAVE_FAILED"),
        uploaded: []
      },
      date = "",
      saveComments = {},
      review = "",
      idreview = 0;
  if (!param || !param.iduser || !param.comment) return result;
  if (!checkUserAbilities ({iduser: param.iduser, can: "comment", source: "setUserComments"})) return result;
  if (!conn.isOk) return result;
  else startTransaction(conn.jdbc);
  
  for (var i = 0, len_i = param.comment.length; i < len_i; i++) {
    date = dateToChar19();
    review = commentToJSON(param.comment[i].review);
    idreview = param.comment[i].idc;
    if (idreview < 0) saveComments = doInsert(
        {connection: conn.jdbc,
         sql: 'INSERT INTO user_news_review (iduser, idnews, review, idstatus, mode, created, last_edited) values (?,?,?,?,?,?,?)',
         data: [param.iduser, param.comment[i].id, review, param.comment[i].idstatus, param.comment[i].mode, date, date],
         types: ['Int', 'Int', 'String', 'Int', 'String', 'String', 'String']});
    else saveComments = doUpdate(
        {connection: conn.jdbc,
         sql: 'UPDATE user_news_review SET review = ?, idstatus = ?, mode = ?, last_edited = ? WHERE idreview = ?',
         data: [ review, param.comment[i].idstatus, param.comment[i].mode, date, idreview],
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
    comment: [
      {idc: -1, id: 1, idstatus: 0, mode: 2, review: {rating:4,rubrics:[11,2],text:"",user:2,review:""}}
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
  var result = -1;
  if (!idUser || !checkUserAbilities ({idгser: idUser, can: "comment", source: "getUserComments"})) return result;    
  var userId = getDataFromTable(
    {sql: "SELECT iduser FROM user_profile WHERE email = ?",
     resultTypes: ['Int'],
     whereData: [userEmail],
     whereTypes: ['String']
    });
  if ((userId.length != 1)) {
    saveUserLog({
      message: "Запрошен отсутствующий в базе email",
      obj: {email: userEmail, userkey: serverKey},
      source: "getUserKey",
      event: LOG_EVENT("USER_USER_NOT_FOUND")});
    return result;
  }
  result = 1;
  return result;
}

function getUserComments_test() {
  var key = Session.getTemporaryActiveUserKey();
return runGroupTests(
    {name: 'getUserComments',
     should: [true, false],
     data: ["dzeso@mail.ru", undefined],
     compare: [
       '(result < 0 ? false : true) === pattern'
     ],
    });
}