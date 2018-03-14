function runTest_xml_parsing() { 
  
  runTest('getPartOfTextWithData');
  runTest('getValueNodeAttribute');
  runTest('checkExistenceNodeAttributes');
  runTest('getNodeChildByAttributes');
  runTest('getListOfValueByParsingedOfHtmlPage');
  
}

function getNodeChildByAttributes(data) {
// data {root: узел, attributes [значение атрибутов child, ссылку на который надо вернуть]}
  
  var isOk = false;
  
  for (var i = 0, len_i = data.root.length; i < len_i; i++) { 
    isOk = checkExistenceNodeAttributes(
      {root: data.root[i],
       attributes: data.attributes
      }
    );
    if (isOk) {
      return data.root[i].node;
    };
  }
  return null;
}

function getParsedNodeChildByAttributes(data) {

// Ищет начиная с указанного узла цепочку заданных атрибутов у потомков. Если вся цепочка найдена, то результат - нужный узел  
// data {parsed: стартовый узел, по потомкам которого будет идти поиск условий из attributes: [[]]}
// attributes - [[]], так как первый уровень это список условий для каждого уровня дерева, а второй - 
// список атрибутов для каждого уровня поиска
  
// результат: разобранный узел с нужными атрибутами
  
  var node = null,
      parsed = data.parsed;
  
  for (var i = 0, len_i = data.attributes.length; i < len_i; i++) {     
    node = getNodeChildByAttributes(        
      {root: parsed.children,
       attributes: data.attributes[i]
      }
    );    
    if (node === null) {
      parsed = null;
      break;
    }    
    parsed = getNodeParsed(node);
  }  
  return parsed;
}

function checkExistenceNodeAttributes(data) {
// data {root: узел, attributes [которые надо проверить]}
  var result = true,
      nodeAttributes = {};
  
  for (var i = 0, len_i = data.root.attributes.length; i < len_i; i++) { 
    nodeAttributes[data.root.attributes[i].name] = data.root.attributes[i].value;
  }

  for (var i = 0, len_i = data.attributes.length; i < len_i; i++) { 
    if (!(data.attributes[i].name in nodeAttributes )||
       (nodeAttributes[data.attributes[i].name].indexOf(data.attributes[i].value) < 0)) {
//      если нет имени нужного атрибута или он имеет другое значения, то дальше смотреть нет смысла
      result = false;
      break;
    }
  }
  return result;
}

function getValueNodeAttribute(data) {
// data {root: узел, attribute [значение которого надо вернуть]}
  
  for (var i = 0, len_i = data.root.attributes.length; i < len_i; i++) { 
    if (data.root.attributes[i].name === data.attribute) {
      return data.root.attributes[i].value;
    };
  }
  return '';
}

function getNodeParsed(nodeRoot) {

  var result = {};

  result.node = nodeRoot;
  result.value = result.node.getText();
  result.name = result.node.getName();  
  result.children = getNodeChildren(nodeRoot);
  result.attributes = getNodeAttributes(nodeRoot);
    
  return result; 
}

function getNodeAttributes(nodeRoot) {

  var result = [];    
  var attributesList = nodeRoot.getAttributes();
  
  for (var i = 0, len_i = attributesList.length; i < len_i; i++) {
    result[i] = {};
    result[i].name = attributesList[i].getName();
    result[i].value = attributesList[i].getValue();
  }
  
  return result; 
}

function getNodeChildren(nodeRoot) {

  var result = [];    
  var childrenList = nodeRoot.getChildren();
  
  for (var i = 0, len_i = childrenList.length; i < len_i; i++) {
    result[i] = {};
    result[i].node = childrenList[i];
    result[i].name = childrenList[i].getName();
    result[i].value = childrenList[i].getText();
    result[i].hasChildren = childrenList[i].getChildren().length;
    result[i].attributes = getNodeAttributes(childrenList[i]);
  }
  
  return result; 
}

function getPartOfTextWithData(dataSource) {
  
  var result = '',
      partsText = [],
      firstMark = '',
      lastMark =  '';
 
  if (!dataSource.text || dataSource.text === '') return result;
  if (dataSource.text.indexOf(dataSource.firstMark) >= 0 && 
      dataSource.text.indexOf(dataSource.lastMark) >= 0) {
    
    
    (dataSource.lastMark === '') ? lastMark = 'getPartOfTextWithData' : lastMark = dataSource.lastMark;
    (dataSource.firstMark === '') ? firstMark = 'getPartOfTextWithData' : firstMark = dataSource.firstMark;
    (dataSource.text === null) ? partsText = [''] : partsText = dataSource.text.split(firstMark);
    
    if (partsText.length < 2) partsText[1]=partsText[0];
    partsText = partsText[1].split(lastMark);
    if (partsText.length > 0) result = partsText[0]+dataSource.endMark;
  }
  
  return result;
}

function getPartOfTextWithData_test() {
  var textBlock = 
      'хвост <div class="b-article__main">' +
        '<div>текст блока'+
          '<div class="b-comments> хвост';
  return runGroupTests(
    {name: 'getPartOfTextWithData',
     should: [
       'хвост <div class="b-article__main"><div>текст блока</div>',
       '','','ёё','',
       '<div>\текст блока\</div>'
     ],
     data: [
       {text: textBlock, firstMark: '', lastMark: '<div class="b-comments', endMark: '</div>'},
       {text: '', firstMark: '<div class="b-article__main">',lastMark: '<div class="b-comments',endMark: '</div>'},
       {text: '',firstMark: '', lastMark: '', endMark: ''},
       {text: 'ёё', firstMark: 'ёё', lastMark: 'ёё', endMark: 'ёё'},
       {text: null, firstMark: null, lastMark: null, endMark: ''},
       {text: textBlock, firstMark: '<div class="b-article__main">', lastMark: '<div class="b-comments', endMark: '</div>'}
     ]
    });
}

function getParsedPartOfHtmlPage(dataSource) {
  var nodeText = getPartOfTextWithData(dataSource); 
  var parsed = null;
  if (nodeText === '') return parsed;
  try {
    var xml = XmlService.parse(nodeText);
    parsed = getNodeParsed(xml.getRootElement());
  }
  catch(error){
    var message = " Oшибка: " + error.name + ' on line: ' + error.lineNumber + ' -> ' + error.message;
    var qq = message;
    // todo писать в лог про ошибку парсинга
  }
  finally return parsed; 
}

function getListOfValueByParsingedOfHtmlPage(param) {
  
//  Сдеално на безе примера "Пример: поиск последовательных сопоставлений" 
//  https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec

// params - regex: '/\\w+/20170102/\\d+', flag: 'g', text: text

  var regex = new RegExp(param.regex,param.flag);
  var m;
  var i = 0,
      list = [];
  while ((m = regex.exec(param.text)) !== null) {
    if (m[0] === 'undefined'){
      break;
    }
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    list[i++]=m[0];
  } 
  return list;
}
//////////////////////////////

function getListOfValueByParsingedOfHtmlPage_test() {
  var page = include('ria.ru/culture/20170101');
  return runGroupTests(
    {name: 'getListOfValueByParsingedOfHtmlPage',
     should: [0,0,6,0],
     data: [
       {},
       {text: "page",
        day: "day"},
       {regex: '/\\w+/20170101/\\d+',
        flag: 'g',
        text: page},
       {regex: '/\\w+/20170102/\\d+',
        flag: 'g',
        text: page}
     ],
     compare: [
       "pattern === lengthTest(result)"
     ]
    });
}

function getValueNodeAttribute_test() {      
  return runGroupTests(
    {name: 'getValueNodeAttribute',
     should: [
       'b-article__title',
       '',
       'href'
     ],
     data: [
       {root: {
         attributes: [
           {name:"class", value:"b-article__title"},
           {name:"itemprop", value:"name"}
         ]},
        attribute: 'class'
       },
       {root: {
         attributes: [
           {name:"class", value:"b-article__body js-mediator-article mia-analytics"},
           {name:"itemprop", value:"articleBody"}
         ]},
        attribute: 'href'
       },
       {root: {
         attributes: [
           {name:"href", value:"href"}
         ]},
        attribute: 'href'
       }
     ],
     compare: [
       '(result === pattern)'
     ]
    });
}

function checkExistenceNodeAttributes_test() {      
  return runGroupTests(
    {name: 'checkExistenceNodeAttributes',
     should: [
       false,
       true,
       false,
       true
     ],
     data: [
       {root: {
         attributes: [
           {name:"class", value:"b-article__title"},
           {name:"itemprop", value:"name"}
         ]},
        attributes: [
          {name: 'itemprop', value: 'b-article__title'}]
       },
       {root: {
         attributes: [
           {name:'class', value:'b-article__body js-mediator-article mia-analytics'},
           {name:'itemprop', value:'articleBody'}
         ]},
        attributes: [
          {name: 'itemprop', value: 'article'}]
       },
       {root: {
         attributes: []},
        attributes: [
          {name: '1', value: '2'}]
       },
       {root: {
         attributes: []},
        attributes: []
       }
     ],
     compare: [
       '(result === pattern)'
     ]
    });
}

function getNodeChildByAttributes_test() {      
  return runGroupTests(
    {name: 'getNodeChildByAttributes',
     should: [
       2,
       null
     ],
     data: [
       {root: [
         {node: 1,
          attributes: [
            {name:"class", value:"b-article__title"},
            {name:"itemprop", value:"name"}
          ]
         },
         {node: 2,
          attributes: [
            {name:"class", value:"b-article__body js-mediator-article mia-analytics"},
            {name:"itemprop", value:"articleBody"}
          ]
         }
       ],
        attributes: [{name: 'itemprop', value: 'articleBody'}]
       },
       {root: [
         {node: 3,
          attributes: [
            {name:"class", value:"b-article__title"},
            {name:"itemprop", value:"name"}
          ]
         },
         {node: 4,
          attributes: [
            {name:"class", value:"b-article__body js-mediator-article mia-analytics"},
            {name:"itemprop", value:"articleBody"}
          ]
         }
       ],
        attributes: [{name: 'itemprop', value: 'no'}]
       }
     ],
     compare: [
       '(result === pattern)'
     ]
    });
}

