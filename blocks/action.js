const Blockly = require ("blockly");

Blockly.Blocks['a_scroll'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Scroll");
    this.appendDummyInput()
        .appendField("X")
        .appendField(new Blockly.FieldTextInput("0"), "x_scroll")
        .appendField("Y")
        .appendField(new Blockly.FieldTextInput("0"), "y_scroll");
    this.setInputsInline(false);
    this.setPreviousStatement(true, ["Action", "Evaluation"]);
    this.setNextStatement(true, "Action");
    this.setColour(60);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['a_delay'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Delay");
    this.appendDummyInput()
        .appendField("Duration")
        .appendField(new Blockly.FieldTextInput("0"), "delay_duration");
    this.setInputsInline(false);
    this.setPreviousStatement(true, ["Action", "Evaluation"]);
    this.setNextStatement(true, "Action");
    this.setColour(60);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['a_click'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Click On Element");
    this.appendDummyInput()
        .appendField("CSS Selector")
        .appendField(new Blockly.FieldTextInput("#button"), "click_selector");
    this.setInputsInline(false);
    this.setPreviousStatement(true, ["Action", "Evaluation"]);
    this.setNextStatement(true, "Action");
    this.setColour(60);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};






Blockly.JavaScript['a_scroll'] = function(block) {
  var text_x_scroll = block.getFieldValue('x_scroll');
  var text_y_scroll = block.getFieldValue('y_scroll');
  
  var code = 'await mb3dPage.evaluate(function() {window.scroll(' + text_x_scroll + ', ' + text_y_scroll + '); });\n';
  return code;
};

Blockly.JavaScript['a_delay'] = function(block) {
  var text_delay_duration = block.getFieldValue('delay_duration');

  var code = 'await delay(' + text_delay_duration + ');\n';
  return code;
};

Blockly.JavaScript['a_click'] = function(block) {
  var text_click_selector = block.getFieldValue('click_selector');

  var code = 'await mb3dPage.click("' + text_click_selector + '");\n';
  return code;
};