function runTest_save_reference() {     
  runBlockTests(['saveRefVersion'
               ]);
}

function saveRefVersion() {
  var result = getRefVersion();
  var index = findObject({ data: result, key: "id", value: "version"});
  var version = result[index].v;
  cleanCache(getRefCaheName({version: version++}));
  var result = doUpdate({
    sql: 'UPDATE ref_version SET v = ? WHERE id = ?',
    data: [ version, result[index].id],
    types: ['Int','String']
  });   
  return version;
}

function saveRefVersion_test() {
  var result = getRefVersion();
  var index = findObject({ data: result, key: "id", value: "version"});
  var version = result[index].v;
return runGroupTests(
    {name: 'saveRefVersion',
     should: [1],
     data: [undefined],
     cleanAll: 'doUpdate({ sql: "UPDATE ref_version SET v = ? WHERE id = ?", data: [' + version + ', "' + result[index].id + '"], types: ["Int","String"]})',
     online: 'TEST("STOP_SQL_EXEC")',
     compare: [
       "result > 0"
     ]
    });
}

