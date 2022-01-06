const Blockly = require ("blockly");

Blockly.Blocks['c_sameoffsettop'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Same Offset Top");
    this.setInputsInline(false);
    this.setOutput(true, "Condition-2");
    this.setColour(120);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['c_comparetwoelems'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Compare Two Elements");
    this.appendValueInput("property")
        .setCheck("Property")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Property");
    this.appendValueInput("operator")
        .setCheck("Operator")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Operator");
    this.setInputsInline(false);
    this.setOutput(true, "Condition-2");
    this.setColour(120);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['c_comparetovalue'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Compare To Value");
    this.appendValueInput("property")
        .setCheck("Property")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Property");
    this.appendValueInput("operator")
        .setCheck("Operator")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Operator");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Value")
        .appendField(new Blockly.FieldTextInput("0"), "cpt_value");
    this.setInputsInline(false);
    this.setOutput(true, "Condition-1");
    this.setColour(120);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};





Blockly.JavaScript['c_sameoffsettop'] = function(block) {
  var code = 'new dompp.ComposedFunction(\n'
  + 'new dompp.IsEqualTo(),\n'
  + 'new dompp.ComposedFunction(new dompp.PageOffsetTop(), "$x"),\n'
  + 'new dompp.ComposedFunction(new dompp.PageOffsetTop(), "$y")\n'
  + ')';
  return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['c_comparetwoelems'] = function(block) {
  var value_property = Blockly.JavaScript.valueToCode(block, 'property', Blockly.JavaScript.ORDER_ATOMIC);
  var value_operator = Blockly.JavaScript.valueToCode(block, 'operator', Blockly.JavaScript.ORDER_ATOMIC);

  var code = 'new dompp.ComposedFunction(\n' 
    + value_operator + ',\n'
    + 'new dompp.ComposedFunction(' + value_property + ', "$x),\n'
    + 'new dompp.ComposedFunction(' + value_property + ', "$y)\n'
  + ')';
  return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['c_comparetovalue'] = function(block) {
  var value_property = Blockly.JavaScript.valueToCode(block, 'property', Blockly.JavaScript.ORDER_NONE) || 'erreur';
  var value_operator = Blockly.JavaScript.valueToCode(block, 'operator', Blockly.JavaScript.ORDER_NONE) || 'erreur';
  var text_cpt_value = block.getFieldValue('cpt_value');

  var code = 'new dompp.ComposedFunction(\n' 
    + value_operator + ',\n' 
    + 'new dompp.ComposedFunction(' + value_property + ', "$x"),\n' 
    + 'new dompp.ConstantFunction(' + text_cpt_value + ')\n'
  + ')';
  return [code, Blockly.JavaScript.ORDER_NONE];
};