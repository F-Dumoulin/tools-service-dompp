const Blockly = require ("blockly");

Blockly.Blocks['prop_width'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Width");
    this.setOutput(true, "Property");
    this.setColour(290);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['prop_color'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Color");
    this.setOutput(true, "Property");
    this.setColour(290);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['prop_height'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Height");
    this.setOutput(true, "Property");
    this.setColour(290);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['prop_offsettop'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Offset Top");
    this.setOutput(true, "Property");
    this.setColour(290);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};





Blockly.JavaScript['prop_width'] = function(block) {
  var code = 'new dompp.DimensionWidth()';
  return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['prop_color'] = function(block) {
  var code = 'new dompp.Color()';
  return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['prop_height'] = function(block) {
  var code = 'new dompp.DimenseionHeight()';
  return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['prop_offsettop'] = function(block) {
  var code = 'new dompp.PageOffsetTop()';
  return [code, Blockly.JavaScript.ORDER_NONE];
};