function runTest_reference() {     
  runBlockTests(['getRefSourceById',
                 'getRefRubricIdBySynonym',
                 'getRefTagIdBySynonym',
                 'getRefTagTypeId',
//                 'isRefTagTypeExists'
               ]);
}

function initRefTables() {
  var insert = doInsert({sql: 'INSERT INTO ref_rubric (idrubric, rubric, description) values (?,?,?)',
                         data: [0, 'Прочее', 'Значение по умолчанию'],
                         types: ['Int','String','String']});
  insert = doInsert({sql: 'INSERT INTO ref_tag_type (idtag_type, tag_type, description) values (?,?,?)',
                     data: [0, 'не определен', 'Значение по умолчанию'],
                     types: ['Int','String','String']});
  insert = doInsert({sql: 'INSERT INTO ref_tag (idtags, tag, description, idtag_type) values (?,?,?,?)',
                     data: [0, 'не определен', 'Значение по умолчанию', 0],
                     types: ['Int','String','String', 'Int']});
  insert = doInsert({sql: 'INSERT INTO ref_source (idsource, source, description, link_web) values (?,?,?,?)',
                     data: [1, 'РИА', 'ria.ru', 'Сетевое издание «РИА Новости»'],
                         types: ['Int','String','String','String']});
  insert = doInsert({sql: 'INSERT INTO ref_status (idstatus, status, description) values (?,?,?)',
                     data: [1, 'загружен', 'данные из внешнего источника записаны в БД'],
                     types: ['Int','String','String']});
}

function getRefTagIdBySynonym(tag) {
  var result = {isOk: true,
                id: getCacheId(CACHE_TAG_BY_SYNONYM + tag.name)};
  
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
      setCacheId({key: CACHE_TAG_BY_SYNONYM + tag.name, value: result.id});
    }
  }
  return result;
}

function getRefTagTypeId(type) {

  if (!type) return 0;
  var idType = REFERENCE_TAG_TYPES.indexOf(type);
  if (idType < 0) idType = 0;
  
  return idType; 
}

function getRefSourceById(id) {
  return ((id > 0) ? REFERENCE_SOURCE[id - 1] : '');
}

function getRefRubricIdBySynonym(rubric) {
  var result = {isOk: true,
                id: getCacheId(CACHE_RUBRIC_BY_SYNONYM + rubric)};
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
    setCacheId({key: CACHE_RUBRIC_BY_SYNONYM + rubric, value: result.id});
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
     online: 'TEST_STOP_SQL_EXEC',
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
     online: 'TEST_STOP_SQL_EXEC'
    });
}

function getRefTagTypeId_test() {
  return runGroupTests(
    {name: 'getRefTagTypeId',
     should: [0, 0, 1],
     data: [0, 'test2', 'event']
    });
}