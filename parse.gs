function runTest_parse() { 
  
  runBlockTests(['getDayNewsListFromPage',
                 'getDataFromNewsPage',
                 'getArticleBody',
                 'isSupportedTypeArticle',
                 'getArticleTitle',
                 'getArticleRubrics',
                 'getArticleTags',
                 'extractRefTagType',
                 'getArticleDate',
                 'getArticleUpdateDate',
                 'splitDateTime'
                ]); 
    
  
}

function getDayNewsListFromPage(param) {
  //  param {page & day}
  var result = [],
      text = getPartOfTextWithData(
        {text: param.page,
         firstMark: '<div class="b-lists-wr">',
         lastMark: '<div class="b-list-normal">',
         endMark: ''}
      );  
  var listLinks = getListOfValueByParsingedOfHtmlPage (
    {regex: '/\\w+/'+ cleanDateForLink(param.day) + '/\\d+',
     flag: 'g',
     text: text});
    for (var i = 0, len_i = listLinks.length; i < len_i; i++) { 
      result.push({link: RIA('URL_PREFIX') + listLinks[i] + RIA('URL_POSFIX')});
    }
  return result;
}

  function getDayNewsListFromPage_test() {
  var page = include('ria.ru/culture/20170101');
  var page2 = getDayNewsPage(cleanDateForLink('2017-12-17'));  
  return runGroupTests(
    {name: 'getDayNewsListFromPage',
     should: [6, 0, 6],
     data: [
       {page: page2.text, day: '2017-12-17'},
       {page: "page", day: "day"},
       {page: page, day: '2017-01-01'}
     ],
     compare: [
       "pattern === lengthTest(result)"
     ]
    });
}

function getDataFromNewsPage(page) {
  var text = page,
      data = {
        title: '',
        tags: [],
        rubrics: [],
        date: '',
        body: [],
        isCorrect: false,
        code: LOG_EVENT('UNSUPPORTED_TYPE_ARTICLE')},
      typeArticle = {};
  
  typeArticle = isSupportedTypeArticle(text); 
  
  if (typeArticle.supported && typeArticle.type === 'b-article') {  
    text = prepareArticlePageForParsing (text);
      data = {
        title: getArticleTitle(text),
        tags: getArticleTags(text),
        rubrics: getArticleRubrics(text),
        date: getArticleDate(text),
        dateUpdate: getArticleUpdateDate(text),
        body: getArticleBody(text),
        isCorrect: true,
        code: CODE_RESULT("CORRECT_ARTICLE")};
//    todo ??? сделать проверку функцией в блоке записи данных
    if (data.title === '' ||
        data.date === '' ||
        data.body.length  < 1) {
      data.code = LOG_EVENT('UNCORRECT_ARTICLE'); 
      data.isCorrect = false;
    }
  }
  return data;
}

function prepareArticlePageForParsing (page) {

  var text = getPartOfTextWithData(      
    {text: page,
     firstMark: '<div class="b-article__main">',
     lastMark: '<div class="b-comments',
     endMark: '</div>'});
  text = cleanHtmlForParsing(text);
  return text;
  
}

function getInjectedLink(children) {
  var data = {parsed: children,
              attributes: [
                [{name: 'id', value: 'inject_'}, 
                 {name: 'class', value: 'type-article'}],
                [{name: 'class', value: 'inject__article'}],
                [{name: 'class', value: 'b-inject__article-desc'}],
                [{name: 'class', value: 'b-inject__article-title'}],
                [{name: 'href', value: '.html'}]
              ]
             }; 
  return getLinkFromArticleText(data);
}

function getInjectedFullLink(children) {
  var data = {parsed: children,
              attributes: [[{name: 'href', value: '.html'}]]
             };      
  return getLinkFromArticleText(data);
}

function getLinkFromArticleText(data) {
  var link = null,
      injectParsed = null;
  
  injectParsed = getParsedNodeChildByAttributes(data);      
  if (injectParsed) {
    link = { 
      href: cleanWebLink(
        getValueNodeAttribute(
          {root: injectParsed,
           attribute: 'href'
          }
        )
      ),
      title: (injectParsed.value !== "") ? injectParsed.value : injectParsed.children[0].value
    }
  }
  return link;
}

function getParagraph(data) {
  
//  Допустимые значения для typeText
//  1 - стандартный текст; 2 - лид (абстракт); 3 - подзаголовок;
//  4 - вопрос; 5 - цитата; 6 - источник
  
//  Допустимые значения для type.link
//  1 - см.также; 2 - полный текст; 3 - гиперлинк
  
  var result = 
      {identified: true,
       type: '',
       paragraph: {
         text: '',
         link: '',
         typeText: 0,
         hyperLink: [{
           words: '',
           link: ''}]
       }},
      link = null;
  
  if (data.name === 'p' && data.value !== '' && !isDialog(data.value)) {      
    result.type = "простой абзац";    
  }  
  else if (data.name === 'p' && data.childrenName === 'em') {
    result.type = "лид (абстракт) новости";        
  }
  else if (data.name[0].toLowerCase() === 'h') {
    result.type = "подзаголовок новости";           
  }
  else if (data.name === 'p' && isDialog(data.value[0]) && data.childrenName === 'strong') {
      result.type = "вопрос в интервью с маркером (-) в блоке <p>";  
    }  
  else if (data.name === 'p' && isDialog(data.childrenValue[0]) && data.childrenName === 'strong') {
      result.type = "вопрос в интервью блок <p> - пуст, но есть <strong>, начинающийся с '—'"; 
    }  
  else if (data.name === 'p' && data.childrenName === 'a') {
    result.type = "ссылка на полный текст";
  }
  else {
    // todo добавить ловлю значимых тегов p h
    result.identified = false;
  }
  
  switch(result.type) {
      
    case "простой абзац":
      result.paragraph.typeText = 1;
      result.paragraph.text = data.value;
      link = getInjectedLink (data.children);
      if (link) {
        result.paragraph.link = link;
        result.paragraph.link.type = 1;
      }
      break;
      
    case "лид (абстракт) новости":
      result.paragraph.typeText = 2;
      result.paragraph.text = data.childrenValue;
      break;
      
    case "подзаголовок новости":
      result.paragraph.typeText = 3;
      result.paragraph.text = data.value;
      break;
      
    case "вопрос в интервью с маркером (-) в блоке <p>":
      result.paragraph.text = '— ' + data.childrenValue;
      result.paragraph.typeText = 4;
      break;
      
    case "вопрос в интервью блок <p> - пуст, но есть <strong>, начинающийся с '—'":
      result.paragraph.text = data.childrenValue;
      result.paragraph.typeText = 4;
      break;
      
    case "ссылка на полный текст":
      link = getInjectedFullLink (data.children);
      result.paragraph.typeText = 6;
      result.paragraph.text = 'читать полный текст';
      if (link) {
        result.paragraph.link = link;
        result.paragraph.link.type = 2;
      }
      else result.identified = false;
      break;
      
    default:
      result.identified = false;
      break;
  }  
  return result;
}

function getArticleTitle(text) {
  var parsed = getParsedPartOfHtmlPage(
    {text: text, 
     firstMark: '<div class="b-article__ind">', 
     lastMark: '</h1>',
     endMark:  '</h1>'
    }
  ); 
  return (parsed !== null) ? parsed.children[0].value : '';
}

function getArticleDate(text) {
  var parsed = getParsedPartOfHtmlPage(
    {text: text, 
     firstMark: '<div class="b-article__info">', 
     lastMark: '</div>',
     endMark: '</div>'
    }
  ); 
  return (parsed !== null) ? 
    getValueNodeAttribute(
    {root: parsed,
     attribute: 'datetime'
    }) : 
  '';
}

function getArticleDate_test() {
  return runGroupTests(
    {name: 'getArticleDate',
     should: ['2017-11-18T10:03', ''],
     data: [   
       prepareArticlePageForParsing(include('простая статья')),
       include('лонгрид')
     ]
    });
}

function getArticleUpdateDate(text) {
  var parsed = getParsedPartOfHtmlPage(
    {text: text, 
     firstMark: '<div class="b-article__info-date-update">', 
     lastMark: '</div>',
     endMark: ''
    }
  ); 
  return (parsed) ? 
    getValueNodeAttribute(
    {root: parsed.children[0],
     attribute: 'datetime'
    }) : 
  undefined;
}

function getArticleUpdateDate_test() {
  return runGroupTests(
    {name: 'getArticleUpdateDate',
     should: ["2018-01-15T09:59", undefined, undefined],
     data: [   
       prepareArticlePageForParsing(include('статья с апдейтом')),
       prepareArticlePageForParsing(include('простая статья')),
       include('лонгрид')
     ]
    });
}

function getArticleRubrics(text) {
  var rubric = [];
  var parsed = getParsedPartOfHtmlPage(
    {text: text, 
     firstMark: '<div class="b-article__bottom-rubric">', 
     lastMark: '</a>',
     endMark: '</a>'
    }
  );
  
  if (parsed !== null) {
    for (var i = 0, len_i = parsed.children.length; i < len_i; i++) { 
      rubric[i] = parsed.children[i].value;
    }
  }
  
  return rubric;
}

function getArticleTags(text) {
  var tags = [],
      li,tag;
  var parsed = getParsedPartOfHtmlPage(
    {text: text, 
     firstMark: '<div class="b-article__tags">', 
     lastMark: '</ul>',
     endMark: '</ul>'
    }
  );
  
  if (parsed !== null) {
    for (var i = 0, len_i = parsed.children.length; i < len_i; i++) { 
      tags[i] = {};
      li = getNodeParsed(parsed.children[i].node);
      tag = getNodeParsed(li.children[0].node);
      tags[i].name = tag.children[0].value.replace(/#/g, "");
      tags[i].type = extractRefTagType(tag.attributes[0].value);
    }
  }
  return tags;
}

function splitDateTime(dt) {
  if (!dt) return { 
    date: "",
    time: ""};
  var array = dt.split('T');
  if (!array[1]) array[1]='00:00';
  var result = {date: array[0],
                time: array[1].substring(0,5)};
  return result;
}

function splitDateTime_test() {
  return runGroupTests(
    {name: 'splitDateTime',
     should: [
       {date: '2017-12-12', time: '17:19'},
       {date: '2017-12-12', time: '00:00'},
       {date: 'test', time: '00:00'}
     ],
     data: ['2017-12-12T17:19qq', '2017-12-12', 'test'],
     compare: [
       '(result.time === pattern.time)',
       '(result.date === pattern.date)'
     ]
    });
}

function extractRefTagType(text) {
  
  if (!text) return 0;
  
  for (var i = 0, len_i = REFERENCE ('TAG_TYPES').length; i < len_i; i++) { 
    if (text.indexOf(REFERENCE ('TAG_TYPES')[i]) >= 0) {
      return i;
    }
  }
  
  saveCrawlerLog({
    message: "Тэг ["+text+"] не найден в справочнике",
    obj: REFERENCE ('TAG_TYPES'),
    source: "extractRefTagType",
    event: LOG_EVENT('ERROR_ITEM_DIDNT_FIND_IN_REF')});
  
  return 0; 
}

function extractRefTagType_test() {
  return runGroupTests(
    {name: 'extractRefTagType',
     should: [1,0,0,0],
     data:   ['event','test','',undefined]
    });
}

function getArticleBody(text) {
  var paragraphs = [],
      data = {},
      result = {};
  
  var parsedArticleBody = getParsedPartOfHtmlPage(
    {text: text, 
     firstMark: '', 
     lastMark: '</div><noindex>',
     endMark: '</div></div>'
    }
  );
  
  if (parsedArticleBody === null) {
    return paragraphs;
  }
                
  parsedArticleBody = getParsedNodeChildByAttributes(
    {parsed: parsedArticleBody,
     attributes: [
       [{name: 'itemprop', value: 'articleBody'}]
     ]
    }
  )

  for (var i = 0, len_i = parsedArticleBody.children.length; i < len_i; i++) { 
    data = {
      name: parsedArticleBody.children[i].name.trim(),
      value: parsedArticleBody.children[i].value.trim(),
      children: getNodeParsed(parsedArticleBody.children[i].node),
      childrenName: '',
      childrenValue: ''
    };
    
    if (parsedArticleBody.children[i].hasChildren > 0) {
      data.childrenName = data.children.children[0].name.trim();
      data.childrenValue = data.children.children[0].value.trim();
    }
    
    result = getParagraph(data);
    
    if (result.identified){
      paragraphs.push(result.paragraph);
    }
  }
  return paragraphs;
}

function isSupportedTypeArticle(text) {
  var result = {type: '',
                supported: false};
  if (/class="b-article"/i.test(text)) {
    result.type = "b-article";
    result.supported = true;
  }
  else if (/class="b-longread"/i.test(text)) {
    result.type = "b-longread";
  }       
  return result;
}

//////////////////////////////////

function getDataFromNewsPage_test() {
  var page = getPageByUrl("ria.ru/culture/20180109/1512303740.html");
  var qq = page;
  return runGroupTests(
    {name: 'getDataFromNewsPage',
     should: [
       {tags: [],
        rubrics: [],
        title: '',
        date: '',
        bodyLength: 0,
        linkIndex: 0,
        link: undefined,
        code:  LOG_EVENT('UNSUPPORTED_TYPE_ARTICLE'),
        isCorrect: false
       },
       {tags:
        [{name:'Владимир Мединский',type:3}, 
         {name:"Россия",type:2}],
        rubrics: ['Интервью'],
        title: 'Мединский: Голливуд не обеднеет от небольшой поддержки российского кино',
        date: '2017-11-16T11:00',
        bodyLength: 39,
        linkIndex: 7,
        link: 'ria.ru/society/20171113/1508702752.html',
        code:  CODE_RESULT("CORRECT_ARTICLE"),
        isCorrect: true
       },
       {tags: 
        [{name:'Театральный фестиваль "Золотая Маска"',type:1}, 
         {name:"Дудинка",type:2}, 
         {name:"Норильск",type:2}],
        rubrics: ['Культура'],
        title: 'Сезон региональных проектов "Золотой маски" закроется фестивалем',
        date: '2017-11-18T10:03',
        bodyLength: 5,
        linkIndex: 1,
        link: 'ria.ru/culture/20171102/1508064465.html',
        code:  CODE_RESULT("CORRECT_ARTICLE"),
        isCorrect: true
       },
       {tags: 
        [{name:'Владимир Мединский',type:3}, 
         {name:"Россия",type:2}],
        rubrics: ['Общество'],
        date: '2017-11-16T11:03',
        title: 'Мединский не считает захоронение Ленина насущным вопросом',
        bodyLength: 7,
        linkIndex: 1,
        link: 'ria.ru/society/20171106/1508263080.html',
        code:  CODE_RESULT("CORRECT_ARTICLE"),
        isCorrect: true
       }
     ],
     data: [
       include('лонгрид'),
       include('интервью с вопросами'),
       include('простая статья'),
       include('новость с сылкой на полный текст')
     ],
     compare: [
       '(JSON.stringify(result.tags) === JSON.stringify(pattern.tags))',
       '(JSON.stringify(result.rubrics) === JSON.stringify(pattern.rubrics))',
       '(result.title === pattern.title)',
       '(result.body.length === pattern.bodyLength)', 
       '(((result.body[0] === undefined) ? undefined : result.body[pattern.linkIndex].link.href) === pattern.link)',
       '(result.isCorrect === pattern.isCorrect)',
       '(result.code === pattern.code)',
       '(result.date === pattern.date)'
     ]
    });
}

function getArticleBody_test() {
//  var d = [];
//  var count = 100;
//  var text = prepareArticlePageForParsing(include('простая статья'))
//  d[0] = new Date();
//  for (var i = 0; i < count; i++) {
//    getArticleBody(text)
//  }
//  d[1] = new Date();
//  Logger.log ('Среднее время разбора текста = ' + (d[1]-d[0])/1000/count);
  return runGroupTests(
    {name: 'getArticleBody',
     should: [
       {paragraphsLength: 18,
        linkIndex: 4,
        link: 'ria.ru/interview/20171114/1508776644.html',
        linkFullIndex: 0,
        linkFull: ''
       },
       {paragraphsLength: 28,
        linkIndex: 10,
        link: 'ria.ru/society/20171106/1508256245.html',
        linkFullIndex: 0,
        linkFull: ''
       },
       {paragraphsLength: 39,
        linkIndex: 7,
        link: 'ria.ru/society/20171113/1508702752.html',
        linkFullIndex: 0,
        linkFull: ''
       },
       {paragraphsLength: 7,
        linkIndex: 1,
        link: 'ria.ru/society/20171106/1508263080.html',
        linkFullIndex: 6,
        linkFull: 'ria.ru/interview/20171116/1508888160.html'
       },
       {paragraphsLength: 5,
        linkIndex: 1,
        link: 'ria.ru/culture/20171102/1508064465.html',
        linkFullIndex: 0,
        linkFull: ''
       }
     ],
     data: [ 
       prepareArticlePageForParsing(include('интервью с конечной ссылкой на раздел')),
       prepareArticlePageForParsing(include('интервью с подзаголовками')),
       prepareArticlePageForParsing(include('интервью с вопросами')),
       prepareArticlePageForParsing(include('новость с сылкой на полный текст')),
       prepareArticlePageForParsing(include('простая статья'))
     ],
     compare: [
       '(result.length === pattern.paragraphsLength)',
       '(result[pattern.linkIndex].link.href === pattern.link)',
       '((result[pattern.linkFullIndex].link.href ? result[pattern.linkFullIndex].link.href : "") === pattern.linkFull)'
     ]
    });
}


function isSupportedTypeArticle_test() {
  return runGroupTests(
    {name: 'isSupportedTypeArticle',
     should: [{type: 'b-article', supported: true},
              {type: '', supported: false},
              {type: 'b-longread', supported: false}],
     data: ['<div class="b-article" ',
            '<div class="article" ',
            '<div class="b-longread" '],     
     compare: ['result.type === pattern.type',
               'result.supported === pattern.supported']
    });
}

function getArticleTitle_test() {
  var q = 1;
  return runGroupTests(
    {name: 'getArticleTitle',
     should: ['Сезон региональных проектов "Золотой маски" закроется фестивалем', '', ''],
     data: [ 
       prepareArticlePageForParsing(include('простая статья')),
       include('лонгрид'),
       prepareArticlePageForParsing(include('ria.ru/culture/20170101'))
     ]
    });
}

function getArticleRubrics_test() {
  return runGroupTests(
    {name: 'getArticleRubrics',
     should: [['Культура'], [], []],
     data: [ 
       prepareArticlePageForParsing(include('простая статья')),
       include('лонгрид'),
       prepareArticlePageForParsing(include('ria.ru/culture/20170101'))
     ],
     compare: [
       '(result[0] === pattern[0])',
       '(result.length === pattern.length)'
     ]
    });
}

function getArticleTags_test() {
  return runGroupTests(
    {name: 'getArticleTags',
     should: [
       [{name:'Театральный фестиваль "Золотая Маска"',type:1}, 
        {name:"Дудинка",type:2}, 
        {name:"Норильск",type:2}], 
       [], []],
     data: [ 
       prepareArticlePageForParsing(include('простая статья')),
       include('лонгрид'),
       prepareArticlePageForParsing(include('ria.ru/culture/20170101'))
     ],
     compare: [
       '(JSON.stringify(result) === JSON.stringify(pattern))',
       '(result.length === pattern.length)'
     ]
    });
}

