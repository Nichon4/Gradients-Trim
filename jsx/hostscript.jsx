//#target illustrator
/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global $*/

/*
 * Create a progress window
 * @param  {String}  title           = title
 * @param  {String}  message         = message (updatable)
 * @param  {Boolean} hasCancelButton = add a Cancel button (default: false)
 * @usage w = new createProgressWindow "Title", "Message", true
 */
var createProgressWindow = function(title, message, hasCancelButton) {
  var win;
  if (title == null) {
    title = "Work in progress";
  }
  if (message == null) {
    message = "Please wait...";
  }
  if (hasCancelButton == null) {
    hasCancelButton = false;
  }
  win = new Window("palette", "" + title, undefined);
  win.bar = win.add("progressbar", {
    x: 20,
    y: 12,
    width: 300,
    height: 20
  }, 0, 100);
  win.stMessage = win.add("statictext", {
    x: 10,
    y: 36,
    width: 320,
    height: 20
  }, "" + message);
  win.stMessage.justify = 'center';
  if (hasCancelButton) {
    win.cancelButton = win.add('button', undefined, 'Cancel');
    win.cancelButton.onClick = function() {
      return win.exception = new Error('User canceled the pre-processing!');
    };
  }
  this.reset = function(message) {
    win.bar.value = 0;
    win.stMessage.text = message;
    return win.update();
  };
  this.updateProgress = function(perc, message) {
    if (win.exception) {
      win.close();
      throw win.exception;
    }
    if (perc != null) {
      win.bar.value = perc;
    }
    if (message != null) {
      win.stMessage.text = message;
    }
    return win.update();
  };
  this.close = function() {
    return win.close();
  };
  win.center(win.parent);
  return win.show();
};


function loadpathfindertrim() {
  thisFile = new File($.fileName);
  basePath = thisFile.path;
  app.loadAction( new File(basePath + '/pathfinder.aia'));
}

var progressbar;
/* :: CLEAR ::
// @arg cutLine_position: Number
// @arg horizontal: boolean
*/
function trimSelection(cutLine_position, horizontal) {
  //alert("script started")
  cutmassive = [];
  cutmassive.length = 0;
  if ( activeDocument.selection.length < 1 ) {
    app.executeMenuCommand("selectall");
  }
  sel = activeDocument.selection;
  app.executeMenuCommand("deselectall");
  //alert("Выделено " + sel.length + " объектов");
  geometricBounds= activeDocument.geometricBounds;
  cutLine = new Array(2);
  cutLine = horizontal ? [[geometricBounds[0], cutLine_position], [geometricBounds[2], cutLine_position]] : [[cutLine_position, geometricBounds[1]], [cutLine_position, geometricBounds[3]]];
  result = "inicialization completed";

  //alert(cutLine);
  if ( sel.length < 1) {   // проверка выделения
    alert("Select something");
  } else {
    //alert("перебираем выделенный массив");
    sel = sel.reverse();
    for ( var i = sel.length; i ; i-- ) {
      element = sel.pop();
      $.sleep(10);
      if ( element.typename == "GroupItem" ) { ingroup(element, horizontal, cutLine); }
      else if( predicate(element, horizontal, cutLine) ) { cutmassive.push(element); }
    }
  }
  //alert("отобрано " + cutmassive.length + " элементов");



// запрос подтверждения на резку
//    cut_confirm = confirm(cutmassive.length + " элементов под обрезку. Резать будем?");
//    if ( cut_confirm ) {
  //alert(createProgressWindow);
  progressbar = new createProgressWindow("Trimming pathes", "Trimming of " + cutmassive.length + " elements in progress...");
  progressbarlength = cutmassive.length;
  idx = 0;
  for (  var i = cutmassive.length; i; i-- ) {
    idx++;
    progressbar.updateProgress(Math.floor(idx/progressbarlength*100));
    element = cutmassive.pop();
    trim(element, cutLine);
    $.sleep(20);
    /*if ( idx % 25 === 0 && idx !== 0 ) {
        alert("Выполнено - " + idx);
    }*/
  }

  sel = null;
  cutmassive = null;
  cutLine = null;
  geometricBounds = null;
  i = null;
  idx = null;
  positionX = null;
  positionY = null;
  progressbarlength = null;
  trimpath = null;
  //alert("Готово!");
  $.sleep(500);
  if ( idx === progressbarlength ) {
    result = "trimmed";
  } else {
    result = "something wrong";
  }
  $.sleep(100);
  progressbar.close();
  $.sleep(100);
  if ( progressbar ) {
    progressbar.close();
    progressbar = null;
    return result;
  } else { return result; }

  /* :: CLEAR ::
  // F => boolean
  // @arg isHorizontal: boolean
  // @arg isUpper: boolean
  // @arg cutLine: Array of 2
  */
  function predicate(element, isHorizontal, cutLine){
    if ( isHorizontal ) {
      //объявляем верхнюю точку элемента
      positionY = element.position ? element.position[1] : 0;
      //проверяем тип объекта
      if ( element.typename !== "PathItem" ){ return false }
      //проверяем положение верхней точки нижней относительно линии реза. если выше - нахуй резать?
      //alert("positionY: " + positionY + "; cutLine[1][1]: " + cutLine[1][1] + "; element.height: " + element.height + ";");
      if ( ( positionY > cutLine[1][1] ) && ((positionY - element.height) >= cutLine[1][1])) { return false }
      //если верхняя точка оказалась ниже - нахуй
      if ( positionY <= cutLine[1][1] ) { return false }
    }
    else if ( !isHorizontal ) {
      //объявляем левую точку объекта
      positionX = element.position ? element.position[0] : 0;
      //проверям тип обхекта
      if ( element.typename !== "PathItem" ){ return false }
      //если режем всё что торчит влево - то Y не должен быть больше чем у линии реза. иначе -   нахуй.
      //alert(positionX + " " + cutLine[0][0]);
      if ( positionX >= cutLine[0][0] ) { return false }
      //если режем все что правее - крайняя правая точка должна быть больше чем линия реза.
      if ( ( positionX < cutLine[0][0] ) && (( positionX + element.width ) <= cutLine[0][0])) { return false }
    }
    return true;
  }

  /*
  // функция перебора элементов группы, ищем объекты типа Path
  // :: SIDE EFFECTS ::
  // @arg item: object
  // @arg horizontal: boolean
  // @arg cutLine: Array of 2
  */
  function ingroup(item, horizontal, cutLine) {
    $.sleep(10);
    if ( item.typename == "GroupItem" ) {
      myForEach(item.pageItems, function(element){
        if( predicate(element, horizontal, cutLine ) ){ cutmassive.push(element) }
        else if(element.typename === "GroupItem") { ingroup(element, horizontal, cutLine) }
      })
    } else if ( predicate(item, horizontal, cutLine ) ) { cutmassive.push(item) }
  }

  /*
  // функция обрезки
  // :: SIDE EFFECTS ::
  // @arg path: AI Object
  // @arg cutLine: Array of 2
  */
  function trim(path,cutcutLine) {
    trimpath = path.parent.pathItems.add();
    trimpath.stroked = true;
    trimpath.guides = true;
    trimpath.setEntirePath( cutcutLine );
    app.executeMenuCommand("deselectall");
    trimpath.selected = true;
    path.selected = true;
    app.doScript("Divide", "pathfinder");
  }

} // end of trimSelection()

/*
// for what? for each...
// :: SIDE EFFECTS ::
// @arg array: Array
// @arg callback: Function
*/
function myForEach(array, callback){
  for ( var i = 0; i < array.length; i++)
    callback(array[i], i, array);
}

/* :: CLEAR ::
// @arg cutLine_position: Number
// @arg horizontal: boolean
// @arg upper: boolean
*/
function removeTrimmed(cutLine_position, horizontal, upper) {
  app.executeMenuCommand("selectall");
  sel = activeDocument.selection;
  geometric = activeDocument.geometricBounds;
  remmassive = [];
  app.executeMenuCommand("deselectall");
  //  alert("Выделено " + sel.length + " объектов");
  cutLine = new Array(2);
  cutLine = horizontal ? [[geometric[0], cutLine_position], [geometric[2], cutLine_position]] : [[cutLine_position, geometric[1]], [cutLine_position, geometric[3]]];


  if ( sel.length < 1) {   // проверка выделения
    alert("Select something");
  } else {
    //  alert("перебираем выделенный массив");
    // noinspection Annotator
    for (var i = sel.length; i; i-- ) {
      element = sel.pop();
      $.sleep(10);
      if ( element.typename == "GroupItem" ) { ingroup_2remove(element) }
      else if( predicate_2remove(element, horizontal, upper, cutLine) ) { remmassive.push(element); }
    }
  }

  // запрос подтверждения на резку
  //   if ( confirm(remmassive.length + " элементов отобранно. Удаляем?") ) {
  if ( progressbar && progressbar.updateProgress ) { progressbar.updateProgress(0, "Removing in progress...") }
  else { progressbar = new createProgressWindow("Removing pathes", "Removing of " + remmassive.length + " in progress...") }
  progressbarlength = remmassive.length;
  idx = 0;
  for (var i = remmassive.length; i; i-- ) {
    element = remmassive.pop();
    element.remove();
    idx++;
    progressbar.updateProgress(Math.floor(idx/progressbarlength*100));
    $.sleep(10);
  }
  sel = 0;
  $.sleep(100);
  result = "trimmed and cleaned";
  $.sleep(100);
  progressbar.close();
  progressbar = null;

  sel = null;
  remmassive = null;
  cutLine = null;
  geometric = null;
  i = null;
  idx = null;
  positionX = null;
  positionY = null;
  progressbarlength = null;

  return result;
  //   } else alert('Отменяю');

  function predicate_2remove(element, isHorizontal, isUpper, cutLine){
    if ( isHorizontal ) {
      //объявляем верхнюю точку элемента
      positionY = element.position[1] ? element.position[1] : 0;
      //проверяем тип объекта
      if ( element.typename !== "PathItem" ){ return false }
      //если удаляем всё что выше, проверяем положение нижней относительно линии реза. если выше - нахуй резать?
      if ( !isUpper && ((positionY - element.height) >= cutLine[1][1])) { return false }
      //если верхняя точка оказалась ниже - нахуй
      if ( isUpper && ( positionY <= cutLine[1][1] )) { return false }
    }
    else if ( !isHorizontal ) {
      //объявляем левую точку объекта
      positionX = element.position ? element.position[0] : 0;
      //проверям тип обхекта
      if ( element.typename !== "PathItem" ){ return false }
      //если режем всё что торчит влево - то Y не должен быть больше чем у линии реза. иначе - нахуй.
      if ( !isUpper && ( positionX >= cutLine[0][0] )) { return false }
      //если режем все что правее - крайняя правая точка должна быть больше чем линия реза.
      if ( isUpper && (( positionX + element.width ) <= cutLine[0][0])) { return false }
    }
    return true
  }

  function ingroup_2remove(item) {
    $.sleep(10);
    if ( item.typename == "GroupItem" ) {
      myForEach(item.pageItems, function(element){
        if( predicate_2remove(element, horizontal, upper, cutLine) ){ remmassive.push(element) }
        else if(element.typename === "GroupItem") { ingroup_2remove(element) }
      })
    } else if ( predicate_2remove(item, horizontal, upper, cutLine) ) { remmassive.push(item) }
  }
}

