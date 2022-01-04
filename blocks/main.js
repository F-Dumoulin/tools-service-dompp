require("./action.js");
require("./condition.js");
require("./operator.js");
require("./other.js");
require("./property.js");
require("./quantifier.js");
require("./selector.js");

module.exports.toolbox = 
`<xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">
  <category name="Quantifier">
    <block type="q_forall"></block>
    <block type="q_exists"></block>
    <block type="q_forallpairs1"></block>
    <block type="q_forallpairs2"></block>
  </category>
  <category name="Selector">
    <block type="s_findbyselector">
      <field name="fbs_selector">#main</field>
    </block>
    <block type="s_findbyclass">
      <field name="fbc_class">navlink</field>
    </block>
    <block type="s_findbyid">
      <field name="fbi_id">main</field>
    </block>
    <block type="s_registered_elements">
      <field name="re_variable">elements</field>
    </block>
  </category>
  <category name="Condition">
    <block type="c_sameheight"></block>
    <block type="c_samewidth"></block>
    <block type="c_sameoffsettop"></block>
    <block type="c_sameoffsetleft"></block>
    <block type="c_horizontallycentered"></block>
    <block type="c_verticallycentered"></block>
    <block type="c_comparetwoelems"></block>
    <block type="c_comparetovalue">
      <field name="cpt_value">0</field>
    </block>
  </category>
  <category name="Property">
    <block type="prop_width"></block>
    <block type="prop_color"></block>
    <block type="prop_height"></block>
    <block type="prop_offsettop"></block>
    <block type="prop_offsetleft"></block>
    <block type="prop_clientoffsettop"></block>
    <block type="prop_clientoffsetleft"></block>
    <block type="prop_fontsize"></block>
    <block type="prop_fontweight"></block>
    <block type="prop_fontfamily"></block>
  </category>
  <category name="Operator">
    <block type="op_equal"></block>
    <block type="op_greatherthan"></block>
    <block type="op_greatherorequal"></block>
    <block type="op_lesserthan"></block>
    <block type="op_lesserorequal"></block>
  </category>
  <category name="Action">
    <block type="a_delay">
      <field name="delay_duration">0</field>
    </block>
    <block type="a_scroll">
      <field name="x_scroll">0</field>
      <field name="y_scroll">0</field>
    </block>
    <block type="a_click">
      <field name="click_selector">#button</field>
    </block>
    <block type="a_hover">
      <field name="hover_selector">#button</field>
    </block>
     <block type="a_resize">
      <field name="x_size">1920</field>
      <field name="y_size">1080</field>
    </block>
  </category>
  <category name="Other">
    <block type="evaluation"></block>
    <block type="evaluation_variable"></block>
    <block type="registerbyselector">
      <field name="rbs_selector">#main</field>
   	</block>
  </category>
</xml>`;