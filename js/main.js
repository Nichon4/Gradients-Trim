/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global $, window, location, CSInterface, SystemPath, themeManager, console, document*/

//(function () {
//   'use strict';

//TODO: replace console.log to setCallback

var CSI = new CSInterface();


function init() {

  var direction_switcher = document.getElementsByClassName('direction_switcher');
  for (i = 0; i < direction_switcher.length; i++) {
    direction_switcher[i].addEventListener("click", function () { switch_direction(this.id)});
  }

  themeManager.init();

}

function setCallback(callback) {
  document.getElementById('callback').value = callback;
}

var horizontal, upper;

function switch_direction(direction) {
  //    var direction = direction;
  // setCallback(direction);
  switch (direction) {
    case "vertical_upper":
      horizontal = false;
      upper = true;
      break;

    case "vertical_lower":
      horizontal = false;
      upper = false;
      break;

    case "horizontal_upper":
      horizontal = true;
      upper = true;
      break;

    case "horizontal_lower":
      horizontal = true;
      upper = false;
      break;

    default:
      setCallback("incorrect direction");
      return false;
  }
  var svg_object = document.getElementById('direction_selector').contentDocument;
  var reflector = svg_object.getElementsByClassName('reflector');
  var selected = reflector.namedItem(direction);
  for (i = 0; i < reflector.length; i++) {
    reflector[i].setAttribute("fill", "#373737");
  }
  selected.setAttribute("fill", "#f00");
}




//fucntion for reload javascript files without reloading of hostapp
function reloadjs(jsfile) {
  //alert("start reload " + jsfile);
  // var CSI = new CSInterface();
  //alert("var CSI " + CSI);
  var reloadfile = CSI.getSystemPath(SystemPath.EXTENSION) + jsfile;
  //alert("var reloadfile " + reloadfile)
  /*reloadfile = reloadfile.replace("'", "\'");*/
  var evalCode = '$.evalFile("' + reloadfile + '")';
  CSI.evalScript(evalCode, function(result) {
    if (EvalScript_ErrMessage !== result) {
      console.log("reloaded " + result + reloadfile);
    } else {
      setCallback(result);
    }
  });
}


// call jsx function with params from gui
// @param {Number}  cutLine_position    = cutline position in points with decimal point
// @param {Boolean} horizontal          = direction of cutline
function jsx_trimselection() {
  // var CSI = new CSInterface();
  var cutLine_position = document.getElementById("cutLine_position").value;
  cutLine_position = cutLine_position.replace(',', '.');
  if (cutLine_position === undefined || cutLine_position === '' || horizontal === undefined) {
    setCallback("something undefined...");
    return false;
  }
  cutLine_position = horizontal === true ? -cutLine_position : cutLine_position;
  var toEval = 'trimSelection(' + cutLine_position + ', ' + horizontal + ')';
  console.log("to eval: " + toEval);
  CSI.evalScript(toEval, function (result) {
    console.log("trimSelection result: " + result);
    if (result === "trimmed") {
      setCallback(result);
      jsx_removetrimmed();
    } else {
      setCallback("Trimming is crushed");
    }
  });
}

// @param {Number}  cutLine_position    = cutline position in points
// @param {Boolean} horizontal          = direction of cutline
// @param {Boolean} upper               = needed side of cutline for clearing
function jsx_removetrimmed() {
  // var CSI = new CSInterface();
  var cutLine_position = document.getElementById("cutLine_position").value;
  cutLine_position = cutLine_position.replace(',', '.');
  cutLine_position = horizontal === true ? -cutLine_position : cutLine_position;
  var toEval = 'removeTrimmed(' + cutLine_position + ', ' + horizontal + ', ' + upper + ')';
  console.log("to eval: " + toEval);
  CSI.evalScript(toEval, function (result) {
    setCallback(result);
  });
}
function loadpathfinder() {
  // var CSI = new CSInterface();
  CSI.evalScript(loadpathfindertrim(), function (result) {
    console.log(result);
  });
}