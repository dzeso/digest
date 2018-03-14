function runTest_lib_lodash() { 
  
//  работа со строками
  
  runBlockTests(['validateTextLength'
                ]);
  
//  работа с объектами
  
  runBlockTests(['mergeObjects'
                ]);
}

function validateTextLength(data) {
  if(!data) return data;
  return  _.truncate(data.text, {'length': data.length,'omission': ' [...]'});
}

function validateTextLength_test() {
  return runGroupTests(
    {name: 'validateTextLength',
     should: [undefined ,'', "12 [...]", "1234567890"],
     data: [undefined, {}, {text: "1234567890", length: 8},{text: "1234567890", length: 12}]
    });
}

function mergeObjects(data) {
  if(!data) return data;
  var result = data[0];
  for (var i = 1, len_i = data.length; i < len_i; i++) {
    result = _.merge(result, data[i]);
  }
  return  result;
}

function mergeObjects_test() {
  return runGroupTests(
    {name: 'mergeObjects',
     should: [undefined ,{a:1,b:2,c:3,d:4}, {a:3, b:2, d:4}, {a:1, b:2, d:4}],
     data: [undefined, [{a:1,b:2}, {c:3,d:4}], [{a:1,b:2}, {a:3,d:4}],[{a:1,b:2}, {a:1,d:4}]],
     compare: [
       "_.isEqual(pattern, result)"
     ]
    });
}

function findObject(data) {
  if(!data) return -1;
  var result = _.findIndex(data.data, [data.key, data.value]);
  return  result;
}


