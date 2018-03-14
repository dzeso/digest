function runTest_get_reference() {     
  runBlockTests(['getRefSourceById',
                 'getRefRubricIdBySynonym',
                 'getRefTagIdBySynonym',
                 'getRefTagTypeId',
                 'getRefData',
                 'getRefVersion',
                 'getRefCaheName'
               ]);
}

function initRefTables() {
  var insert = doInsert({sql: 'INSERT INTO ref_rubric (idrubric, rubric, description) values (?,?,?)',
                         data: [0, 'Прочее', 'Значение по умолчанию'],
                         types: ['Int','String','String']});
  insert = doInsert({sql: 'INSERT INTO ref_tag_type (idtag_type, tag_type, description) values (?,?,?)',
                     data: [0, 'не определен', 'Значение по умолчанию'],
                     types: ['Int','String','String']});
  insert = doInsert({sql: 'INSERT INTO ref_tag (idtag, tag, description, idtag_type) values (?,?,?,?)',
                     data: [0, 'не определен', 'Значение по умолчанию', 0],
                     types: ['Int','String','String', 'Int']});
  insert = doInsert({sql: 'INSERT INTO ref_source (idsource, source, description, link_web) values (?,?,?,?)',
                     data: [1, 'РИА', 'ria.ru', 'Сетевое издание «РИА Новости»'],
                         types: ['Int','String','String','String']});
  insert = doInsert({sql: 'INSERT INTO ref_status (idstatus, status, description) values (?,?,?)',
                     data: [1, 'загружен', 'данные из внешнего источника записаны в БД'],
                     types: ['Int','String','String']});
}

function getRefCaheName(param) {   


  var qq = CACHE('REF_BY_NAME') + param.name + '_v' + (param.version ? param.version : '') + (param.lastId ? '_id' + param.lastId : '');
  
  
  return CACHE('REF_BY_NAME') + param.name + '_v' + (param.version ? param.version : '') + (param.lastId ? '_id' + param.lastId : '');
}

function getRefCaheName_test() {
return runGroupTests(
    {name: 'getRefCaheName',
     should: ['rfbn_name_v1', 'rfbn_name_v1_id1', 'rfbn_name_v'],
     data: [{name: 'name', version: 1}, {name: 'name', version: 1, lastId: 1}, {name: 'name', lastId: 0}],
     online: 'TEST("STOP_SQL_EXEC")',
     compare: [
       "result === pattern"
     ]
    });
}

function getRefVersion() {    
  return getDataFromTable({
    sql: "SELECT id, v, ref.last_id FROM ref_version, " +  
    "(select MAX(idrubric) last_id, 'rubric' name FROM ref_rubric UNION all SELECT max(idstatus), 'status' name from ref_status " +
    "UNION all SELECT max(idtag), 'tag' name from ref_tag UNION all SELECT max(idsource), 'source' name from ref_source " + 
    "UNION all SELECT max(idtag_type), 'tag_type' name from ref_tag_type UNION all SELECT max(v), 'version' name from ref_version) as ref WHERE id = name",
    resultFields: ['id', 'v', 'last_id'],
    resultTypes: ['String', 'Int', 'Int']
  });
}

function getRefVersion_test() {
return runGroupTests(
    {name: 'getRefVersion',
     should: [1],
     data: [undefined],
     online: 'TEST("STOP_SQL_EXEC")',
     compare: [
       "lengthTest(result) > 0"
     ]
    });
}

function getRefData(param) {  
  //param: {name, id} 
  //result: [{id, nm}]
  if (!param || !param.name) {
    return; /*todo озможно вставка лога проблем*/
  }
  var request = {
    source: {
      sql: "SELECT idsource,source FROM ref_source",
      resultFields: ['id', 'nm'],
      resultTypes: ['Int', 'String'] },
    rubric: {
      sql: "SELECT idrubric,rubric FROM ref_rubric",
      resultFields: ['id', 'nm'],
      resultTypes: ['Int', 'String'] },
    status: {
      sql: "SELECT idstatus,status FROM ref_status",
      resultFields: ['id', 'nm'],
      resultTypes: ['Int', 'String'] },
    tag: {
      sql: "SELECT idtag,tag, idtag_type FROM ref_tag",
      resultFields: ['id', 'nm', 'tp'],
      resultTypes: ['Int', 'String', 'Int'] },
    tag_type: {
      sql: "SELECT idtag_type,tag_type FROM ref_tag_type",
      resultFields: ['id', 'nm'],
      resultTypes: ['Int', 'String'] },
  };
  
  if (param.id) {
    request[param.name].sql += " WHERE id" + param.name + " > ?";
    request[param.name].whereData = [param.id];
    request[param.name].whereTypes = ['Int'];
  }
  
  var result = getDataFromTable(request[param.name]);
  
  return result;
}

function getRefData_test() {
return runGroupTests(
    {name: 'getRefData',
     should: [1,1,1,1,1,1],
     data: [{name: "source"}, {name: "source", id: 0}, {name: "rubric", id: 0}, 
            {name: "tag_type", id: 0}, {name: "tag", id: 0}, {name: "status", id: 0}],
     online: 'TEST("STOP_SQL_EXEC")',
     compare: [
       "lengthTest(result) > 0"
     ]
    });
}

function getRefTagIdBySynonym(tag) {
  var result = {isOk: true,
                id: getCacheId(CACHE('TAG_BY_SYNONYM') + tag.name)};
  
  if (!result.id) {
    var tagId = doSelect(
      {sql: "SELECT idtag FROM ref_tag_synonyms WHERE synonym = ?",
       resultTypes: ['Int'],
       whereData: [tag.name],
       whereTypes: ['String']
      });
    if (tagId.count === 0) result.isOk = false;
    else {
      result.id = tagId.dataset[0][0];
      setCacheId({key: CACHE('TAG_BY_SYNONYM') + tag.name, value: result.id});
    }
  }
  return result;
}

function getRefTagTypeId(type) {

  if (!type) return 0;
  var idType = REFERENCE ('TAG_TYPES').indexOf(type);
  if (idType < 0) idType = 0;
  
  return idType; 
}

function getRefSourceById(id) {
  return ((id > 0) ? REFERENCE ('SOURCE')[id - 1] : '');
}

function getRefRubricIdBySynonym(rubric) {
  var result = {isOk: true,
                id: getCacheId(CACHE('RUBRIC_BY_SYNONYM') + rubric)};
  if (result.id) return result;
  
  var rubricId = doSelect(
    {sql: "SELECT idrubric FROM ref_rubric_synonyms WHERE synonym = ?",
     resultTypes: ['Int'],
     whereData: [rubric],
     whereTypes: ['String']
    });  
  
  if (rubricId.count === 0) result.isOk = false;
  else {
    result.id = rubricId.dataset[0][0];
    setCacheId({key: CACHE('RUBRIC_BY_SYNONYM') + rubric, value: result.id});
  }

  return result;
}

///////////////////////

function getRefRubricIdBySynonym_test() {
  var insert = doInsert({sql: 'INSERT INTO ref_rubric_synonyms (idrubric, synonym) values (?,?)',
                         data: [1, 'test'],
                         types: ['Int','String']});
  return runGroupTests(
    {name: 'getRefRubricIdBySynonym',
     should: [1, null],
     data: ['test', 'test2'],
     compare: [
       '(result.id === pattern)'
     ],
     online: 'TEST("STOP_SQL_EXEC")',
     clean: "doDelete({sql: 'DELETE FROM ref_rubric_synonyms WHERE (synonym = \"test\" AND idrubric = 1) OR (synonym = \"test2\" AND idrubric = 1)'});"
    });
}

function getRefSourceById_test() {
  return runGroupTests(
    {name: 'getRefSourceById',
     should: ['ria',''],
     data:   [1,0]
    });
}

function getRefTagIdBySynonym_test() {
  doDelete({sql: 'DELETE FROM ref_tag_synonyms WHERE synonym = \"test\" OR synonym = \"test1\"'});
  var insert = doInsert({sql: 'INSERT INTO ref_tag_synonyms (idtag, synonym) values (?,?)',
                         data: [3, 'test'],
                         types: ['Int','String']});
  return runGroupTests(
    {name: 'getRefTagIdBySynonym',
     should: [true, false],
     data: [{name: 'test'}, {name: 'test1'}],
     compare: [
       '(result.isOk === pattern)'
     ],
     online: 'TEST("STOP_SQL_EXEC")'
    });
}

function getRefTagTypeId_test() {
  return runGroupTests(
    {name: 'getRefTagTypeId',
     should: [0, 0, 1],
     data: [0, 'test2', 'event']
    });
}