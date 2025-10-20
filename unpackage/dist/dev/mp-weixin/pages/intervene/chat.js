(global["webpackJsonp"] = global["webpackJsonp"] || []).push([["pages/intervene/chat"],{

/***/ 234:
/*!***********************************************************************************!*\
  !*** D:/HBuilderX.4.65.2025051206/翎心/main.js?{"page":"pages%2Fintervene%2Fchat"} ***!
  \***********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(wx, createPage) {

var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
__webpack_require__(/*! uni-pages */ 26);
__webpack_require__(/*! @dcloudio/vue-cli-plugin-uni/packages/uni-cloud/dist/index.js */ 27);
var _vue = _interopRequireDefault(__webpack_require__(/*! vue */ 25));
var _chat = _interopRequireDefault(__webpack_require__(/*! ./pages/intervene/chat.vue */ 235));
// @ts-ignore
wx.__webpack_require_UNI_MP_PLUGIN__ = __webpack_require__;
createPage(_chat.default);
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/wx.js */ 1)["default"], __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2)["createPage"]))

/***/ }),

/***/ 235:
/*!****************************************************************!*\
  !*** D:/HBuilderX.4.65.2025051206/翎心/pages/intervene/chat.vue ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _chat_vue_vue_type_template_id_ccbcd004_scoped_true___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./chat.vue?vue&type=template&id=ccbcd004&scoped=true& */ 236);
/* harmony import */ var _chat_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./chat.vue?vue&type=script&lang=js& */ 238);
/* harmony reexport (unknown) */ for(var __WEBPACK_IMPORT_KEY__ in _chat_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_1__) if(["default"].indexOf(__WEBPACK_IMPORT_KEY__) < 0) (function(key) { __webpack_require__.d(__webpack_exports__, key, function() { return _chat_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_1__[key]; }) }(__WEBPACK_IMPORT_KEY__));
/* harmony import */ var _chat_vue_vue_type_style_index_0_id_ccbcd004_scoped_true_lang_css___WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./chat.vue?vue&type=style&index=0&id=ccbcd004&scoped=true&lang=css& */ 240);
/* harmony import */ var _HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/runtime/componentNormalizer.js */ 48);

var renderjs





/* normalize component */

var component = Object(_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_3__["default"])(
  _chat_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_1__["default"],
  _chat_vue_vue_type_template_id_ccbcd004_scoped_true___WEBPACK_IMPORTED_MODULE_0__["render"],
  _chat_vue_vue_type_template_id_ccbcd004_scoped_true___WEBPACK_IMPORTED_MODULE_0__["staticRenderFns"],
  false,
  null,
  "ccbcd004",
  null,
  false,
  _chat_vue_vue_type_template_id_ccbcd004_scoped_true___WEBPACK_IMPORTED_MODULE_0__["components"],
  renderjs
)

component.options.__file = "pages/intervene/chat.vue"
/* harmony default export */ __webpack_exports__["default"] = (component.exports);

/***/ }),

/***/ 236:
/*!***********************************************************************************************************!*\
  !*** D:/HBuilderX.4.65.2025051206/翎心/pages/intervene/chat.vue?vue&type=template&id=ccbcd004&scoped=true& ***!
  \***********************************************************************************************************/
/*! exports provided: render, staticRenderFns, recyclableRender, components */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_17_0_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_template_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_uni_app_loader_page_meta_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_index_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_style_js_chat_vue_vue_type_template_id_ccbcd004_scoped_true___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!../../../HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--17-0!../../../HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/template.js!../../../HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-uni-app-loader/page-meta.js!../../../HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./chat.vue?vue&type=template&id=ccbcd004&scoped=true& */ 237);
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "render", function() { return _HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_17_0_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_template_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_uni_app_loader_page_meta_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_index_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_style_js_chat_vue_vue_type_template_id_ccbcd004_scoped_true___WEBPACK_IMPORTED_MODULE_0__["render"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "staticRenderFns", function() { return _HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_17_0_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_template_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_uni_app_loader_page_meta_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_index_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_style_js_chat_vue_vue_type_template_id_ccbcd004_scoped_true___WEBPACK_IMPORTED_MODULE_0__["staticRenderFns"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "recyclableRender", function() { return _HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_17_0_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_template_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_uni_app_loader_page_meta_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_index_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_style_js_chat_vue_vue_type_template_id_ccbcd004_scoped_true___WEBPACK_IMPORTED_MODULE_0__["recyclableRender"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "components", function() { return _HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_17_0_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_template_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_uni_app_loader_page_meta_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_index_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_style_js_chat_vue_vue_type_template_id_ccbcd004_scoped_true___WEBPACK_IMPORTED_MODULE_0__["components"]; });



/***/ }),

/***/ 237:
/*!***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--17-0!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/template.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-uni-app-loader/page-meta.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!D:/HBuilderX.4.65.2025051206/翎心/pages/intervene/chat.vue?vue&type=template&id=ccbcd004&scoped=true& ***!
  \***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/*! exports provided: render, staticRenderFns, recyclableRender, components */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "render", function() { return render; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "staticRenderFns", function() { return staticRenderFns; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "recyclableRender", function() { return recyclableRender; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "components", function() { return components; });
var components
try {
  components = {
    uIcon: function () {
      return Promise.all(/*! import() | uni_modules/uview-ui/components/u-icon/u-icon */[__webpack_require__.e("common/vendor"), __webpack_require__.e("uni_modules/uview-ui/components/u-icon/u-icon")]).then(__webpack_require__.bind(null, /*! @/uni_modules/uview-ui/components/u-icon/u-icon.vue */ 443))
    },
    uPopup: function () {
      return Promise.all(/*! import() | uni_modules/uview-ui/components/u-popup/u-popup */[__webpack_require__.e("common/vendor"), __webpack_require__.e("uni_modules/uview-ui/components/u-popup/u-popup")]).then(__webpack_require__.bind(null, /*! @/uni_modules/uview-ui/components/u-popup/u-popup.vue */ 419))
    },
  }
} catch (e) {
  if (
    e.message.indexOf("Cannot find module") !== -1 &&
    e.message.indexOf(".vue") !== -1
  ) {
    console.error(e.message)
    console.error("1. 排查组件名称拼写是否正确")
    console.error(
      "2. 排查组件是否符合 easycom 规范，文档：https://uniapp.dcloud.net.cn/collocation/pages?id=easycom"
    )
    console.error(
      "3. 若组件不符合 easycom 规范，需手动引入，并在 components 中注册该组件"
    )
  } else {
    throw e
  }
}
var render = function () {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  var m0 = _vm.getPersonalityConfig(_vm.currentPersonality)
  var m1 = _vm.getPersonalityConfig(_vm.currentPersonality)
  var l0 = _vm.__map(_vm.sessions, function (session, index) {
    var $orig = _vm.__get_orig(session)
    var m2 = _vm.formatSessionTime(session.lastMessageAt)
    return {
      $orig: $orig,
      m2: m2,
    }
  })
  var g0 = _vm.messages.length
  var l1 = _vm.__map(_vm.messages, function (msg, index) {
    var $orig = _vm.__get_orig(msg)
    var m3 = _vm.getMsgId(index)
    var m4 =
      !msg.isSystem && msg.role === "user"
        ? _vm.canRevoke(msg) && !msg.isRevoked
        : null
    return {
      $orig: $orig,
      m3: m3,
      m4: m4,
    }
  })
  var g1 = _vm.inputText.length
  var g2 = !_vm.inputText.trim() || _vm.isSending
  if (!_vm._isMounted) {
    _vm.e0 = function ($event) {
      _vm.showPersonalityPopup = false
    }
    _vm.e1 = function ($event) {
      _vm.showSessionPopup = false
    }
  }
  _vm.$mp.data = Object.assign(
    {},
    {
      $root: {
        m0: m0,
        m1: m1,
        l0: l0,
        g0: g0,
        l1: l1,
        g1: g1,
        g2: g2,
      },
    }
  )
}
var recyclableRender = false
var staticRenderFns = []
render._withStripped = true



/***/ }),

/***/ 238:
/*!*****************************************************************************************!*\
  !*** D:/HBuilderX.4.65.2025051206/翎心/pages/intervene/chat.vue?vue&type=script&lang=js& ***!
  \*****************************************************************************************/
/*! no static exports found */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _HBuilderX_plugins_uniapp_cli_node_modules_babel_loader_lib_index_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_13_1_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_script_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_index_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_style_js_chat_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../HBuilderX/plugins/uniapp-cli/node_modules/babel-loader/lib!../../../HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--13-1!../../../HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/script.js!../../../HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./chat.vue?vue&type=script&lang=js& */ 239);
/* harmony import */ var _HBuilderX_plugins_uniapp_cli_node_modules_babel_loader_lib_index_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_13_1_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_script_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_index_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_style_js_chat_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_HBuilderX_plugins_uniapp_cli_node_modules_babel_loader_lib_index_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_13_1_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_script_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_index_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_style_js_chat_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__);
/* harmony reexport (unknown) */ for(var __WEBPACK_IMPORT_KEY__ in _HBuilderX_plugins_uniapp_cli_node_modules_babel_loader_lib_index_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_13_1_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_script_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_index_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_style_js_chat_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__) if(["default"].indexOf(__WEBPACK_IMPORT_KEY__) < 0) (function(key) { __webpack_require__.d(__webpack_exports__, key, function() { return _HBuilderX_plugins_uniapp_cli_node_modules_babel_loader_lib_index_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_13_1_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_script_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_index_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_style_js_chat_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__[key]; }) }(__WEBPACK_IMPORT_KEY__));
 /* harmony default export */ __webpack_exports__["default"] = (_HBuilderX_plugins_uniapp_cli_node_modules_babel_loader_lib_index_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_13_1_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_script_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_index_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_style_js_chat_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0___default.a); 

/***/ }),

/***/ 239:
/*!************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/babel-loader/lib!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--13-1!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/script.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!D:/HBuilderX.4.65.2025051206/翎心/pages/intervene/chat.vue?vue&type=script&lang=js& ***!
  \************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(uni, uniCloud) {

var _interopRequireDefault = __webpack_require__(/*! @babel/runtime/helpers/interopRequireDefault */ 4);
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _regenerator = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/regenerator */ 28));
var _asyncToGenerator2 = _interopRequireDefault(__webpack_require__(/*! @babel/runtime/helpers/asyncToGenerator */ 31));
var _tabbarManager = _interopRequireDefault(__webpack_require__(/*! @/utils/tabbar-manager.js */ 180));
var _chatStorage = _interopRequireDefault(__webpack_require__(/*! @/utils/chat-storage.js */ 581));
var _sensitiveWords = __webpack_require__(/*! @/utils/sensitive-words.js */ 617);
var _aiPersonality = __webpack_require__(/*! @/utils/ai-personality.js */ 618);
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
var _default = {
  data: function data() {
    return {
      messages: [],
      inputText: '',
      isSending: false,
      isTyping: false,
      scrollIntoView: '',
      msgIdPrefix: 'msg-',
      sessionId: 'default',
      // 当前会话ID
      currentSessionName: '默认会话',
      // 当前会话名称
      sessions: [],
      // 会话列表
      showSessionPopup: false,
      // 显示会话列表弹窗
      isLoadingHistory: false,
      favoriteMessages: [],
      // 收藏的消息
      showEmojiPicker: false,
      // 是否显示表情选择器
      // AI人格相关
      currentPersonality: _aiPersonality.PersonalityType.GENTLE,
      // 当前AI人格
      showPersonalityPopup: false,
      // 显示人格选择弹窗
      personalities: (0, _aiPersonality.getAllPersonalities)(),
      // 所有人格配置
      emojiList: ['😊', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '😵', '🤯', '🤠', '🥳', '🥴', '😎', '🤓', '🧐', '👍', '👎', '👏', '🙏', '💪', '❤️', '💔', '💯']
    };
  },
  onLoad: function onLoad() {
    var _this = this;
    return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee() {
      var personalityConfig;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              console.log('[CHAT] AI对话页面加载');

              // 初始化存储
              _context.next = 3;
              return _chatStorage.default.init();
            case 3:
              // 加载用户的AI人格偏好
              _this.currentPersonality = (0, _aiPersonality.getPersonalityPreference)();
              console.log('[CHAT] 当前AI人格:', _this.currentPersonality);

              // 加载会话列表
              _context.next = 7;
              return _this.loadSessions();
            case 7:
              _context.next = 9;
              return _this.loadHistoryMessages();
            case 9:
              // 加载收藏列表
              _this.loadFavorites();

              // 如果没有历史消息，添加欢迎消息
              if (_this.messages.length === 0) {
                personalityConfig = (0, _aiPersonality.getPersonalityConfig)(_this.currentPersonality);
                _this.addAIMessage("\u60A8\u597D\uFF01\u6211\u662F\u60A8\u7684\u5FC3\u7406\u652F\u6301AI\uFF08".concat(personalityConfig.name, "\uFF09\u3002\u65E0\u8BBA\u60A8\u9047\u5230\u4EC0\u4E48\u56F0\u6270\uFF0C\u90FD\u53EF\u4EE5\u548C\u6211\u503E\u8BC9\u3002\u6211\u4F1A\u8BA4\u771F\u503E\u542C\uFF0C\u5E76\u5C3D\u6211\u6240\u80FD\u7ED9\u4E88\u652F\u6301\u548C\u5EFA\u8BAE\u3002"));
              }

              // 清理过期数据（后台执行）
              _chatStorage.default.cleanExpiredData().catch(function (err) {
                console.warn('[CHAT] 清理过期数据失败:', err);
              });
            case 12:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }))();
  },
  onShow: function onShow() {
    // 通知导航栏更新状态
    _tabbarManager.default.setCurrentIndexByPath('/pages/intervene/chat');
  },
  onUnload: function onUnload() {
    // 页面卸载时保存消息
    this.saveAllMessages();
  },
  methods: {
    /**
     * 加载会话列表
     */
    loadSessions: function loadSessions() {
      var _this2 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee2() {
        var sessionsData, currentSession;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                try {
                  sessionsData = uni.getStorageSync('chat_sessions');
                  if (sessionsData) {
                    _this2.sessions = JSON.parse(sessionsData);
                  } else {
                    // 创建默认会话
                    _this2.sessions = [{
                      id: 'default',
                      name: '默认会话',
                      createdAt: Date.now(),
                      lastMessageAt: Date.now(),
                      messageCount: 0
                    }];
                    _this2.saveSessions();
                  }

                  // 更新当前会话名称
                  currentSession = _this2.sessions.find(function (s) {
                    return s.id === _this2.sessionId;
                  });
                  if (currentSession) {
                    _this2.currentSessionName = currentSession.name;
                  }
                  console.log("[CHAT] \u52A0\u8F7D\u4E86 ".concat(_this2.sessions.length, " \u4E2A\u4F1A\u8BDD"));
                } catch (error) {
                  console.error('[CHAT] 加载会话列表失败:', error);
                }
              case 1:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }))();
    },
    /**
     * 保存会话列表
     */
    saveSessions: function saveSessions() {
      try {
        uni.setStorageSync('chat_sessions', JSON.stringify(this.sessions));
        console.log('[CHAT] 会话列表已保存');
      } catch (error) {
        console.error('[CHAT] 保存会话列表失败:', error);
      }
    },
    /**
     * 显示会话列表
     */
    showSessionList: function showSessionList() {
      this.showSessionPopup = true;
    },
    /**
     * 切换会话
     */
    switchSession: function switchSession(session) {
      var _this3 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee3() {
        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!(session.id === _this3.sessionId)) {
                  _context3.next = 3;
                  break;
                }
                _this3.showSessionPopup = false;
                return _context3.abrupt("return");
              case 3:
                _context3.next = 5;
                return _this3.saveAllMessages();
              case 5:
                // 切换会话
                _this3.sessionId = session.id;
                _this3.currentSessionName = session.name;
                _this3.messages = [];

                // 加载新会话的消息
                _context3.next = 10;
                return _this3.loadHistoryMessages();
              case 10:
                // 如果是空会话，添加欢迎消息
                if (_this3.messages.length === 0) {
                  _this3.addAIMessage('您好！我是您的心理支持AI。无论您遇到什么困扰，都可以和我倾诉。我会认真倾听，并尽我所能给予支持和建议。');
                }
                _this3.showSessionPopup = false;
                uni.showToast({
                  title: "\u5DF2\u5207\u6362\u5230\uFF1A".concat(session.name),
                  icon: 'success',
                  duration: 1500
                });
                console.log('[CHAT] 切换到会话:', session.id);
              case 14:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }))();
    },
    /**
     * 创建新会话
     */
    handleNewSession: function handleNewSession() {
      var _this4 = this;
      uni.showModal({
        title: '新建会话',
        content: '请输入会话名称',
        placeholderText: '例如：工作压力、学习困扰等...',
        editable: true,
        confirmText: '创建',
        success: function success(res) {
          if (res.confirm) {
            var _res$content;
            var sessionName = ((_res$content = res.content) === null || _res$content === void 0 ? void 0 : _res$content.trim()) || "\u4F1A\u8BDD".concat(_this4.sessions.length + 1);
            _this4.createNewSession(sessionName);
          }
        }
      });
    },
    /**
     * 创建新会话
     */
    createNewSession: function createNewSession(name) {
      var _this5 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee4() {
        var newSession;
        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                newSession = {
                  id: "session_".concat(Date.now()),
                  name: name,
                  createdAt: Date.now(),
                  lastMessageAt: Date.now(),
                  messageCount: 0
                };
                _this5.sessions.unshift(newSession);
                _this5.saveSessions();

                // 切换到新会话
                _context4.next = 5;
                return _this5.switchSession(newSession);
              case 5:
                console.log('[CHAT] 创建新会话:', newSession);
              case 6:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }))();
    },
    /**
     * 重命名会话
     */
    renameSession: function renameSession(session) {
      var _this6 = this;
      uni.showModal({
        title: '重命名会话',
        content: '请输入新的会话名称',
        placeholderText: session.name,
        editable: true,
        confirmText: '确定',
        success: function success(res) {
          if (res.confirm && res.content) {
            var newName = res.content.trim();
            if (newName) {
              session.name = newName;
              if (session.id === _this6.sessionId) {
                _this6.currentSessionName = newName;
              }
              _this6.saveSessions();
              uni.showToast({
                title: '重命名成功',
                icon: 'success'
              });
              console.log('[CHAT] 会话已重命名:', session.id, newName);
            }
          }
        }
      });
    },
    /**
     * 删除会话
     */
    deleteSession: function deleteSession(session) {
      var _this7 = this;
      uni.showModal({
        title: '删除会话',
        content: "\u786E\u5B9A\u8981\u5220\u9664\u4F1A\u8BDD\"".concat(session.name, "\"\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002"),
        confirmText: '确定删除',
        confirmColor: '#DC3545',
        success: function () {
          var _success = (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee5(res) {
            var index, defaultSession;
            return _regenerator.default.wrap(function _callee5$(_context5) {
              while (1) {
                switch (_context5.prev = _context5.next) {
                  case 0:
                    if (!res.confirm) {
                      _context5.next = 12;
                      break;
                    }
                    // 从列表中移除
                    index = _this7.sessions.findIndex(function (s) {
                      return s.id === session.id;
                    });
                    if (index > -1) {
                      _this7.sessions.splice(index, 1);
                      _this7.saveSessions();
                    }

                    // 删除会话的所有消息
                    _context5.next = 5;
                    return _chatStorage.default.clearSession(session.id);
                  case 5:
                    if (!(session.id === _this7.sessionId)) {
                      _context5.next = 10;
                      break;
                    }
                    defaultSession = _this7.sessions.find(function (s) {
                      return s.id === 'default';
                    }) || _this7.sessions[0];
                    if (!defaultSession) {
                      _context5.next = 10;
                      break;
                    }
                    _context5.next = 10;
                    return _this7.switchSession(defaultSession);
                  case 10:
                    uni.showToast({
                      title: '会话已删除',
                      icon: 'success'
                    });
                    console.log('[CHAT] 会话已删除:', session.id);
                  case 12:
                  case "end":
                    return _context5.stop();
                }
              }
            }, _callee5);
          }));
          function success(_x) {
            return _success.apply(this, arguments);
          }
          return success;
        }()
      });
    },
    /**
     * 格式化会话时间
     */
    formatSessionTime: function formatSessionTime(timestamp) {
      var now = Date.now();
      var diff = now - timestamp;
      var minute = 60 * 1000;
      var hour = 60 * minute;
      var day = 24 * hour;
      if (diff < minute) {
        return '刚刚';
      } else if (diff < hour) {
        return "".concat(Math.floor(diff / minute), "\u5206\u949F\u524D");
      } else if (diff < day) {
        return "".concat(Math.floor(diff / hour), "\u5C0F\u65F6\u524D");
      } else if (diff < 7 * day) {
        return "".concat(Math.floor(diff / day), "\u5929\u524D");
      } else {
        var date = new Date(timestamp);
        return "".concat(date.getMonth() + 1, "/").concat(date.getDate());
      }
    },
    /**
     * 加载历史消息
     */
    loadHistoryMessages: function loadHistoryMessages() {
      var _this8 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee6() {
        var messages;
        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.prev = 0;
                _this8.isLoadingHistory = true;
                _context6.next = 4;
                return _chatStorage.default.getMessages(_this8.sessionId);
              case 4:
                messages = _context6.sent;
                if (messages && messages.length > 0) {
                  // 转换为页面使用的格式
                  _this8.messages = messages.map(function (msg) {
                    return {
                      role: msg.role,
                      content: msg.content,
                      timestamp: msg.timestamp
                    };
                  });
                  console.log("[CHAT] \u5DF2\u52A0\u8F7D ".concat(messages.length, " \u6761\u5386\u53F2\u6D88\u606F"));
                  _this8.scrollToBottom();
                }
                _context6.next = 11;
                break;
              case 8:
                _context6.prev = 8;
                _context6.t0 = _context6["catch"](0);
                console.error('[CHAT] 加载历史消息失败:', _context6.t0);
              case 11:
                _context6.prev = 11;
                _this8.isLoadingHistory = false;
                return _context6.finish(11);
              case 14:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, null, [[0, 8, 11, 14]]);
      }))();
    },
    /**
     * 保存单条消息
     */
    saveMessage: function saveMessage(message) {
      var _this9 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee7() {
        return _regenerator.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.prev = 0;
                _context7.next = 3;
                return _chatStorage.default.saveMessage(_this9.sessionId, {
                  role: message.role,
                  content: message.content,
                  timestamp: message.timestamp || Date.now()
                });
              case 3:
                // 更新会话信息
                _this9.updateSessionInfo();
                _context7.next = 9;
                break;
              case 6:
                _context7.prev = 6;
                _context7.t0 = _context7["catch"](0);
                console.error('[CHAT] 保存消息失败:', _context7.t0);
              case 9:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, null, [[0, 6]]);
      }))();
    },
    /**
     * 更新会话信息
     */
    updateSessionInfo: function updateSessionInfo() {
      var _this10 = this;
      var session = this.sessions.find(function (s) {
        return s.id === _this10.sessionId;
      });
      if (session) {
        session.lastMessageAt = Date.now();
        session.messageCount = this.messages.length;
        this.saveSessions();
      }
    },
    /**
     * 保存所有消息
     */
    saveAllMessages: function saveAllMessages() {
      var _this11 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee8() {
        return _regenerator.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.prev = 0;
                _context8.next = 3;
                return _chatStorage.default.saveMessages(_this11.sessionId, _this11.messages);
              case 3:
                console.log('[CHAT] 所有消息已保存');
                _context8.next = 9;
                break;
              case 6:
                _context8.prev = 6;
                _context8.t0 = _context8["catch"](0);
                console.error('[CHAT] 保存所有消息失败:', _context8.t0);
              case 9:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, null, [[0, 6]]);
      }))();
    },
    /**
     * 清空当前会话
     */
    clearCurrentSession: function clearCurrentSession() {
      var _this12 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee9() {
        return _regenerator.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.prev = 0;
                _context9.next = 3;
                return _chatStorage.default.clearSession(_this12.sessionId);
              case 3:
                _this12.messages = [];

                // 重新添加欢迎消息
                _this12.addAIMessage('您好！我是您的心理支持AI。无论您遇到什么困扰，都可以和我倾诉。我会认真倾听，并尽我所能给予支持和建议。');
                uni.showToast({
                  title: '聊天记录已清空',
                  icon: 'success'
                });
                console.log('[CHAT] 会话已清空');
                _context9.next = 13;
                break;
              case 9:
                _context9.prev = 9;
                _context9.t0 = _context9["catch"](0);
                console.error('[CHAT] 清空会话失败:', _context9.t0);
                uni.showToast({
                  title: '清空失败',
                  icon: 'none'
                });
              case 13:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, null, [[0, 9]]);
      }))();
    },
    /**
     * 处理消息长按
     */
    handleLongPress: function handleLongPress(msg, index) {
      var _this13 = this;
      var isFavorite = msg.isFavorite || false;
      var actions = ['复制消息', isFavorite ? '取消收藏' : '收藏消息', '删除消息'];
      uni.showActionSheet({
        itemList: actions,
        success: function success(res) {
          var actionIndex = res.tapIndex;
          switch (actionIndex) {
            case 0:
              // 复制消息
              _this13.copyMessage(msg);
              break;
            case 1:
              // 收藏/取消收藏消息
              _this13.toggleFavoriteMessage(msg, index);
              break;
            case 2:
              // 删除消息
              _this13.deleteMessage(index);
              break;
          }
        }
      });

      // 震动反馈
      uni.vibrateShort({
        success: function success() {
          console.log('[CHAT] 长按震动反馈');
        }
      });
    },
    /**
     * 复制消息内容
     */
    copyMessage: function copyMessage(msg) {
      uni.setClipboardData({
        data: msg.content,
        success: function success() {
          uni.showToast({
            title: '已复制',
            icon: 'success',
            duration: 1500
          });
          console.log('[CHAT] 消息已复制');
        },
        fail: function fail(err) {
          console.error('[CHAT] 复制失败:', err);
          uni.showToast({
            title: '复制失败',
            icon: 'none'
          });
        }
      });
    },
    /**
     * 切换消息收藏状态
     */
    toggleFavoriteMessage: function toggleFavoriteMessage(msg, index) {
      var isFavorite = msg.isFavorite || false;

      // 更新消息状态
      this.$set(this.messages[index], 'isFavorite', !isFavorite);

      // 更新收藏列表
      if (!isFavorite) {
        // 添加到收藏
        this.favoriteMessages.push({
          content: msg.content,
          role: msg.role,
          timestamp: msg.timestamp || Date.now(),
          sessionId: this.sessionId
        });
        uni.showToast({
          title: '已收藏',
          icon: 'success',
          duration: 1500
        });
        console.log('[CHAT] 消息已收藏');
      } else {
        // 从收藏中移除
        var favIndex = this.favoriteMessages.findIndex(function (fav) {
          return fav.content === msg.content && fav.timestamp === msg.timestamp;
        });
        if (favIndex > -1) {
          this.favoriteMessages.splice(favIndex, 1);
        }
        uni.showToast({
          title: '已取消收藏',
          icon: 'none',
          duration: 1500
        });
        console.log('[CHAT] 已取消收藏');
      }

      // 保存收藏列表到本地
      this.saveFavorites();

      // 保存消息更新
      this.saveAllMessages();
    },
    /**
     * 删除消息
     */
    deleteMessage: function deleteMessage(index) {
      var _this14 = this;
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条消息吗？',
        success: function success(res) {
          if (res.confirm) {
            _this14.messages.splice(index, 1);
            _this14.saveAllMessages();
            uni.showToast({
              title: '已删除',
              icon: 'success',
              duration: 1500
            });
            console.log('[CHAT] 消息已删除');
          }
        }
      });
    },
    /**
     * 保存收藏列表
     */
    saveFavorites: function saveFavorites() {
      try {
        uni.setStorageSync('chat_favorites', JSON.stringify(this.favoriteMessages));
        console.log('[CHAT] 收藏列表已保存');
      } catch (error) {
        console.error('[CHAT] 保存收藏列表失败:', error);
      }
    },
    /**
     * 加载收藏列表
     */
    loadFavorites: function loadFavorites() {
      try {
        var favorites = uni.getStorageSync('chat_favorites');
        if (favorites) {
          this.favoriteMessages = JSON.parse(favorites);
          console.log("[CHAT] \u52A0\u8F7D\u4E86".concat(this.favoriteMessages.length, "\u6761\u6536\u85CF\u6D88\u606F"));
        }
      } catch (error) {
        console.error('[CHAT] 加载收藏列表失败:', error);
      }
    },
    /**
     * 切换表情选择器显示
     */
    toggleEmojiPicker: function toggleEmojiPicker() {
      this.showEmojiPicker = !this.showEmojiPicker;
      console.log("[CHAT] \u8868\u60C5\u9009\u62E9\u5668: ".concat(this.showEmojiPicker ? '显示' : '隐藏'));
    },
    /**
     * 插入表情
     */
    insertEmoji: function insertEmoji(emoji) {
      this.inputText += emoji;
      // 关闭表情选择器（可选）
      // this.showEmojiPicker = false;
      console.log('[CHAT] 插入表情:', emoji);
    },
    // 发送消息
    sendMessage: function sendMessage() {
      var _this15 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee10() {
        var text, sensitiveCheck;
        return _regenerator.default.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                text = _this15.inputText.trim();
                if (!(!text || _this15.isSending)) {
                  _context10.next = 3;
                  break;
                }
                return _context10.abrupt("return");
              case 3:
                // 敏感词检测
                sensitiveCheck = (0, _sensitiveWords.checkSensitiveWords)(text); // 如果包含危机关键词，显示危机干预提示
                if (!sensitiveCheck.isCrisis) {
                  _context10.next = 7;
                  break;
                }
                uni.showModal({
                  title: '⚠️ 重要提示',
                  content: (0, _sensitiveWords.getCrisisWarning)(),
                  confirmText: '我知道了',
                  confirmColor: '#DC3545',
                  showCancel: false,
                  success: function success(res) {
                    // 用户确认后仍然发送消息，但会由后端进行特殊处理
                    _this15.proceedSendMessage(text, sensitiveCheck);
                  }
                });
                return _context10.abrupt("return");
              case 7:
                if (!sensitiveCheck.hasSensitive) {
                  _context10.next = 10;
                  break;
                }
                uni.showModal({
                  title: '敏感内容提示',
                  content: (0, _sensitiveWords.getSensitiveWarning)(sensitiveCheck.matchedWords),
                  confirmText: '继续发送',
                  cancelText: '重新编辑',
                  success: function success(res) {
                    if (res.confirm) {
                      _this15.proceedSendMessage(text, sensitiveCheck);
                    }
                  }
                });
                return _context10.abrupt("return");
              case 10:
                // 正常发送
                _this15.proceedSendMessage(text, null);
              case 11:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10);
      }))();
    },
    /**
     * 执行发送消息（内部方法）
     */
    proceedSendMessage: function proceedSendMessage(text, sensitiveCheck) {
      var _this16 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee11() {
        var userMessage, messageIndex;
        return _regenerator.default.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                // 创建用户消息
                userMessage = {
                  role: 'user',
                  content: text,
                  timestamp: Date.now(),
                  sendStatus: 'sending',
                  // 添加发送状态
                  hasSensitive: (sensitiveCheck === null || sensitiveCheck === void 0 ? void 0 : sensitiveCheck.hasSensitive) || false,
                  isCrisis: (sensitiveCheck === null || sensitiveCheck === void 0 ? void 0 : sensitiveCheck.isCrisis) || false
                }; // 添加到消息列表
                _this16.messages.push(userMessage);
                messageIndex = _this16.messages.length - 1;
                _this16.inputText = '';
                _this16.scrollToBottom();

                // 保存用户消息
                _context11.next = 7;
                return _this16.saveMessage(userMessage);
              case 7:
                _context11.next = 9;
                return _this16.sendToAI(messageIndex);
              case 9:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11);
      }))();
    },
    /**
     * 显示人格选择器
     */
    showPersonalitySelector: function showPersonalitySelector() {
      this.showPersonalityPopup = true;
    },
    /**
     * 选择AI人格
     */
    selectPersonality: function selectPersonality(personalityId) {
      if (personalityId === this.currentPersonality) {
        this.showPersonalityPopup = false;
        return;
      }
      var oldPersonality = (0, _aiPersonality.getPersonalityConfig)(this.currentPersonality);
      var newPersonality = (0, _aiPersonality.getPersonalityConfig)(personalityId);

      // 更新人格
      this.currentPersonality = personalityId;

      // 保存偏好
      (0, _aiPersonality.savePersonalityPreference)(personalityId);

      // 关闭弹窗
      this.showPersonalityPopup = false;

      // 提示用户
      uni.showToast({
        title: "\u5DF2\u5207\u6362\u81F3".concat(newPersonality.name),
        icon: 'success',
        duration: 1500
      });

      // 添加系统提示
      var systemMessage = {
        role: 'system',
        content: "\uFF08\u60A8\u5DF2\u5207\u6362AI\u4EBA\u683C\uFF1A".concat(oldPersonality.name, " \u2192 ").concat(newPersonality.name, "\uFF09"),
        timestamp: Date.now(),
        isSystem: true
      };
      this.messages.push(systemMessage);
      this.scrollToBottom();
      console.log('[CHAT] 切换AI人格:', oldPersonality.name, '→', newPersonality.name);
    },
    /**
     * 发送消息到AI并处理回复
     */
    sendToAI: function sendToAI(messageIndex) {
      var _this17 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee12() {
        var messagesToSend, res, aiContent;
        return _regenerator.default.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                // 显示输入中状态
                _this17.isSending = true;
                _this17.isTyping = true;
                _context12.prev = 2;
                // 准备发送的消息列表（只包含已成功的消息）
                messagesToSend = _this17.messages.filter(function (msg) {
                  return msg.sendStatus !== 'failed' && msg.sendStatus !== 'sending' && !msg.isSystem;
                }).concat([_this17.messages[messageIndex]]); // 调用云函数获取AI回复
                _context12.next = 6;
                return uniCloud.callFunction({
                  name: 'stress-chat',
                  data: {
                    messages: messagesToSend.map(function (m) {
                      return {
                        role: m.role,
                        content: m.content
                      };
                    }),
                    personality: _this17.currentPersonality,
                    // 传入当前人格
                    stream: false
                  }
                });
              case 6:
                res = _context12.sent;
                if (!(res.result && res.result.success && res.result.data)) {
                  _context12.next = 15;
                  break;
                }
                aiContent = res.result.data.content || res.result.data.message; // 标记用户消息发送成功
                _this17.$set(_this17.messages[messageIndex], 'sendStatus', 'success');
                _context12.next = 12;
                return _this17.saveMessage(_this17.messages[messageIndex]);
              case 12:
                // 添加AI回复
                _this17.addAIMessage(aiContent);
                _context12.next = 20;
                break;
              case 15:
                console.error('[CHAT] AI回复异常:', res);
                // 标记消息发送失败
                _this17.$set(_this17.messages[messageIndex], 'sendStatus', 'failed');
                _context12.next = 19;
                return _this17.saveMessage(_this17.messages[messageIndex]);
              case 19:
                uni.showToast({
                  title: 'AI回复异常，点击重发',
                  icon: 'none',
                  duration: 2000
                });
              case 20:
                _context12.next = 29;
                break;
              case 22:
                _context12.prev = 22;
                _context12.t0 = _context12["catch"](2);
                console.error('[CHAT] 发送失败:', _context12.t0);

                // 标记消息发送失败
                _this17.$set(_this17.messages[messageIndex], 'sendStatus', 'failed');
                _context12.next = 28;
                return _this17.saveMessage(_this17.messages[messageIndex]);
              case 28:
                uni.showToast({
                  title: '发送失败，点击重发',
                  icon: 'none',
                  duration: 2000
                });
              case 29:
                _context12.prev = 29;
                _this17.isSending = false;
                _this17.isTyping = false;
                _this17.scrollToBottom();
                return _context12.finish(29);
              case 34:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee12, null, [[2, 22, 29, 34]]);
      }))();
    },
    /**
     * 重发失败的消息
     */
    resendMessage: function resendMessage(messageIndex) {
      var _this18 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee13() {
        var message;
        return _regenerator.default.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                message = _this18.messages[messageIndex];
                if (!(!message || message.role !== 'user')) {
                  _context13.next = 3;
                  break;
                }
                return _context13.abrupt("return");
              case 3:
                // 更新状态为发送中
                _this18.$set(_this18.messages[messageIndex], 'sendStatus', 'sending');

                // 震动反馈
                uni.vibrateShort({
                  success: function success() {
                    console.log('[CHAT] 重发震动反馈');
                  }
                });

                // 重新发送
                _context13.next = 7;
                return _this18.sendToAI(messageIndex);
              case 7:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee13);
      }))();
    },
    // 模拟AI回复（开发阶段使用）
    simulateAIResponse: function simulateAIResponse(userMsg) {
      var _this19 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee14() {
        return _regenerator.default.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                return _context14.abrupt("return", new Promise(function (resolve) {
                  setTimeout(function () {
                    var response = '';
                    if (userMsg.includes('压力') || userMsg.includes('焦虑')) {
                      response = '我理解您现在感到压力很大。压力是生活中很正常的一部分，重要的是学会如何管理它。您可以尝试深呼吸、适度运动，或者找朋友倾诉。记住，您不是一个人在面对这些。';
                    } else if (userMsg.includes('睡不着') || userMsg.includes('失眠')) {
                      response = '睡眠问题确实很困扰人。建议您睡前避免使用手机，保持规律的作息时间。您也可以尝试我们的冥想音疗功能，帮助放松身心，改善睡眠质量。';
                    } else if (userMsg.includes('谢谢') || userMsg.includes('感谢')) {
                      response = '不客气！很高兴能够帮到您。如果还有任何困扰，随时可以和我聊聊。记得照顾好自己！';
                    } else {
                      response = '我听到了您的心声。虽然我只是一个AI，但我真诚地希望能给您一些支持。如果您愿意，可以详细说说您的感受，我会认真倾听。';
                    }
                    _this19.addAIMessage(response);
                    resolve();
                  }, 1500);
                }));
              case 1:
              case "end":
                return _context14.stop();
            }
          }
        }, _callee14);
      }))();
    },
    // 添加AI消息
    addAIMessage: function addAIMessage(content) {
      var _this20 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee15() {
        var aiMessage;
        return _regenerator.default.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                aiMessage = {
                  role: 'assistant',
                  content: content,
                  timestamp: Date.now()
                };
                _this20.messages.push(aiMessage);
                _this20.scrollToBottom();

                // 保存AI消息
                _context15.next = 5;
                return _this20.saveMessage(aiMessage);
              case 5:
              case "end":
                return _context15.stop();
            }
          }
        }, _callee15);
      }))();
    },
    // 滚动到底部
    scrollToBottom: function scrollToBottom() {
      var _this21 = this;
      this.$nextTick(function () {
        _this21.scrollIntoView = _this21.getMsgId(_this21.messages.length - 1);
      });
    },
    // 获取消息ID
    getMsgId: function getMsgId(index) {
      return this.msgIdPrefix + index;
    },
    /**
     * 判断消息是否可以撤回（2分钟内）
     */
    canRevoke: function canRevoke(msg) {
      if (!msg || msg.role !== 'user' || msg.sendStatus !== 'success') {
        return false;
      }
      var now = Date.now();
      var messageTime = msg.timestamp || 0;
      var timeDiff = now - messageTime;

      // 2分钟 = 120000毫秒
      return timeDiff < 120000;
    },
    /**
     * 撤回消息
     */
    revokeMessage: function revokeMessage(index) {
      var _this22 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee17() {
        var message;
        return _regenerator.default.wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                message = _this22.messages[index];
                if (!(!message || !_this22.canRevoke(message))) {
                  _context17.next = 4;
                  break;
                }
                uni.showToast({
                  title: '无法撤回此消息',
                  icon: 'none'
                });
                return _context17.abrupt("return");
              case 4:
                uni.showModal({
                  title: '撤回消息',
                  content: '确定要撤回这条消息吗？',
                  confirmText: '撤回',
                  cancelText: '取消',
                  success: function () {
                    var _success2 = (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee16(res) {
                      return _regenerator.default.wrap(function _callee16$(_context16) {
                        while (1) {
                          switch (_context16.prev = _context16.next) {
                            case 0:
                              if (!res.confirm) {
                                _context16.next = 12;
                                break;
                              }
                              // 标记消息为已撤回
                              _this22.$set(_this22.messages[index], 'isRevoked', true);
                              _this22.$set(_this22.messages[index], 'revokedAt', Date.now());

                              // 保存更新后的消息
                              _context16.next = 5;
                              return _this22.saveMessage(_this22.messages[index]);
                            case 5:
                              // 震动反馈
                              uni.vibrateShort({
                                success: function success() {
                                  console.log('[CHAT] 撤回震动反馈');
                                }
                              });

                              // 同时检查是否有对应的AI回复需要标记
                              // 查找下一条AI消息
                              if (!(index + 1 < _this22.messages.length && _this22.messages[index + 1].role === 'assistant')) {
                                _context16.next = 10;
                                break;
                              }
                              _this22.$set(_this22.messages[index + 1], 'relatedRevoked', true);
                              _context16.next = 10;
                              return _this22.saveMessage(_this22.messages[index + 1]);
                            case 10:
                              uni.showToast({
                                title: '已撤回',
                                icon: 'success',
                                duration: 1500
                              });
                              console.log('[CHAT] 消息已撤回, index:', index);
                            case 12:
                            case "end":
                              return _context16.stop();
                          }
                        }
                      }, _callee16);
                    }));
                    function success(_x2) {
                      return _success2.apply(this, arguments);
                    }
                    return success;
                  }()
                });
              case 5:
              case "end":
                return _context17.stop();
            }
          }
        }, _callee17);
      }))();
    },
    /**
     * 处理清空聊天
     */
    handleClearChat: function handleClearChat() {
      var _this23 = this;
      if (this.messages.length === 0) {
        uni.showToast({
          title: '暂无聊天记录',
          icon: 'none'
        });
        return;
      }
      uni.showModal({
        title: '清空聊天记录',
        content: '确定要清空所有聊天记录吗？此操作不可恢复。',
        confirmText: '确定清空',
        confirmColor: '#DC3545',
        success: function success(res) {
          if (res.confirm) {
            _this23.clearCurrentSession();
          }
        }
      });
    },
    /**
     * 显示评分对话框
     */
    showRatingDialog: function showRatingDialog(msg, index) {
      var _this24 = this;
      uni.showActionSheet({
        itemList: ['👍 很有帮助', '👎 不够满意', '💡 提供反馈'],
        success: function success(res) {
          var tapIndex = res.tapIndex;
          if (tapIndex === 0) {
            // 好评
            _this24.rateMessage(msg, index, 'good');
          } else if (tapIndex === 1) {
            // 差评
            _this24.rateMessage(msg, index, 'bad');
            // 询问是否提供详细反馈
            _this24.askForDetailedFeedback(msg, index);
          } else if (tapIndex === 2) {
            // 直接提供反馈
            _this24.askForDetailedFeedback(msg, index);
          }
        }
      });
    },
    /**
     * 评价消息
     */
    rateMessage: function rateMessage(msg, index, rating) {
      var _this25 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee18() {
        return _regenerator.default.wrap(function _callee18$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                // 更新本地消息状态
                _this25.$set(_this25.messages[index], 'rating', rating);
                _this25.$set(_this25.messages[index], 'ratedAt', Date.now());

                // 保存到本地存储
                _context18.next = 4;
                return _this25.saveMessage(_this25.messages[index]);
              case 4:
                // 提交评分到服务器（异步，不影响用户体验）
                _this25.submitRating(msg, rating).catch(function (err) {
                  console.warn('[CHAT] 评分上传失败:', err);
                });

                // 震动反馈
                uni.vibrateShort({
                  success: function success() {
                    console.log('[CHAT] 评分震动反馈');
                  }
                });

                // 显示感谢提示
                uni.showToast({
                  title: rating === 'good' ? '感谢您的反馈！' : '我们会努力改进',
                  icon: 'success',
                  duration: 1500
                });
                console.log('[CHAT] 消息评分:', rating);
              case 8:
              case "end":
                return _context18.stop();
            }
          }
        }, _callee18);
      }))();
    },
    /**
     * 提交评分到服务器
     */
    submitRating: function submitRating(msg, rating) {
      var _arguments = arguments,
        _this26 = this;
      return (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee19() {
        var feedback, res;
        return _regenerator.default.wrap(function _callee19$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                feedback = _arguments.length > 2 && _arguments[2] !== undefined ? _arguments[2] : '';
                _context19.prev = 1;
                _context19.next = 4;
                return uniCloud.callFunction({
                  name: 'chat-feedback',
                  data: {
                    sessionId: _this26.sessionId,
                    messageContent: msg.content,
                    messageTimestamp: msg.timestamp,
                    rating: rating,
                    feedback: feedback,
                    timestamp: Date.now()
                  }
                });
              case 4:
                res = _context19.sent;
                if (res.result && res.result.success) {
                  console.log('[CHAT] 评分已提交');
                }
                _context19.next = 11;
                break;
              case 8:
                _context19.prev = 8;
                _context19.t0 = _context19["catch"](1);
                console.error('[CHAT] 评分提交失败:', _context19.t0);
                // 失败不影响用户体验，仅记录日志
              case 11:
              case "end":
                return _context19.stop();
            }
          }
        }, _callee19, null, [[1, 8]]);
      }))();
    },
    /**
     * 询问详细反馈
     */
    askForDetailedFeedback: function askForDetailedFeedback(msg, index) {
      var _this27 = this;
      // 延迟显示，避免与评分操作冲突
      setTimeout(function () {
        uni.showModal({
          title: '提供反馈',
          content: '请告诉我们您的想法，帮助我们改进AI回复质量',
          placeholderText: '例如：回复太简短、不够专业等...',
          editable: true,
          confirmText: '提交反馈',
          success: function success(res) {
            if (res.confirm && res.content) {
              // 提交详细反馈
              _this27.submitRating(msg, msg.rating || 'neutral', res.content);
              uni.showToast({
                title: '感谢您的反馈！',
                icon: 'success'
              });
            }
          }
        });
      }, 300);
    }
  }
};
exports.default = _default;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./node_modules/@dcloudio/uni-mp-weixin/dist/index.js */ 2)["default"], __webpack_require__(/*! ./node_modules/@dcloudio/vue-cli-plugin-uni/packages/uni-cloud/dist/index.js */ 27)["uniCloud"]))

/***/ }),

/***/ 240:
/*!*************************************************************************************************************************!*\
  !*** D:/HBuilderX.4.65.2025051206/翎心/pages/intervene/chat.vue?vue&type=style&index=0&id=ccbcd004&scoped=true&lang=css& ***!
  \*************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _HBuilderX_plugins_uniapp_cli_node_modules_mini_css_extract_plugin_dist_loader_js_ref_6_oneOf_1_0_HBuilderX_plugins_uniapp_cli_node_modules_css_loader_dist_cjs_js_ref_6_oneOf_1_1_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_loaders_stylePostLoader_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_6_oneOf_1_2_HBuilderX_plugins_uniapp_cli_node_modules_postcss_loader_src_index_js_ref_6_oneOf_1_3_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_index_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_style_js_chat_vue_vue_type_style_index_0_id_ccbcd004_scoped_true_lang_css___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../HBuilderX/plugins/uniapp-cli/node_modules/mini-css-extract-plugin/dist/loader.js??ref--6-oneOf-1-0!../../../HBuilderX/plugins/uniapp-cli/node_modules/css-loader/dist/cjs.js??ref--6-oneOf-1-1!../../../HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/stylePostLoader.js!../../../HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--6-oneOf-1-2!../../../HBuilderX/plugins/uniapp-cli/node_modules/postcss-loader/src??ref--6-oneOf-1-3!../../../HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!../../../HBuilderX/plugins/uniapp-cli/node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!./chat.vue?vue&type=style&index=0&id=ccbcd004&scoped=true&lang=css& */ 241);
/* harmony import */ var _HBuilderX_plugins_uniapp_cli_node_modules_mini_css_extract_plugin_dist_loader_js_ref_6_oneOf_1_0_HBuilderX_plugins_uniapp_cli_node_modules_css_loader_dist_cjs_js_ref_6_oneOf_1_1_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_loaders_stylePostLoader_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_6_oneOf_1_2_HBuilderX_plugins_uniapp_cli_node_modules_postcss_loader_src_index_js_ref_6_oneOf_1_3_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_index_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_style_js_chat_vue_vue_type_style_index_0_id_ccbcd004_scoped_true_lang_css___WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_HBuilderX_plugins_uniapp_cli_node_modules_mini_css_extract_plugin_dist_loader_js_ref_6_oneOf_1_0_HBuilderX_plugins_uniapp_cli_node_modules_css_loader_dist_cjs_js_ref_6_oneOf_1_1_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_loaders_stylePostLoader_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_6_oneOf_1_2_HBuilderX_plugins_uniapp_cli_node_modules_postcss_loader_src_index_js_ref_6_oneOf_1_3_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_index_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_style_js_chat_vue_vue_type_style_index_0_id_ccbcd004_scoped_true_lang_css___WEBPACK_IMPORTED_MODULE_0__);
/* harmony reexport (unknown) */ for(var __WEBPACK_IMPORT_KEY__ in _HBuilderX_plugins_uniapp_cli_node_modules_mini_css_extract_plugin_dist_loader_js_ref_6_oneOf_1_0_HBuilderX_plugins_uniapp_cli_node_modules_css_loader_dist_cjs_js_ref_6_oneOf_1_1_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_loaders_stylePostLoader_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_6_oneOf_1_2_HBuilderX_plugins_uniapp_cli_node_modules_postcss_loader_src_index_js_ref_6_oneOf_1_3_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_index_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_style_js_chat_vue_vue_type_style_index_0_id_ccbcd004_scoped_true_lang_css___WEBPACK_IMPORTED_MODULE_0__) if(["default"].indexOf(__WEBPACK_IMPORT_KEY__) < 0) (function(key) { __webpack_require__.d(__webpack_exports__, key, function() { return _HBuilderX_plugins_uniapp_cli_node_modules_mini_css_extract_plugin_dist_loader_js_ref_6_oneOf_1_0_HBuilderX_plugins_uniapp_cli_node_modules_css_loader_dist_cjs_js_ref_6_oneOf_1_1_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_loaders_stylePostLoader_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_6_oneOf_1_2_HBuilderX_plugins_uniapp_cli_node_modules_postcss_loader_src_index_js_ref_6_oneOf_1_3_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_index_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_style_js_chat_vue_vue_type_style_index_0_id_ccbcd004_scoped_true_lang_css___WEBPACK_IMPORTED_MODULE_0__[key]; }) }(__WEBPACK_IMPORT_KEY__));
 /* harmony default export */ __webpack_exports__["default"] = (_HBuilderX_plugins_uniapp_cli_node_modules_mini_css_extract_plugin_dist_loader_js_ref_6_oneOf_1_0_HBuilderX_plugins_uniapp_cli_node_modules_css_loader_dist_cjs_js_ref_6_oneOf_1_1_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_loaders_stylePostLoader_js_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_webpack_preprocess_loader_index_js_ref_6_oneOf_1_2_HBuilderX_plugins_uniapp_cli_node_modules_postcss_loader_src_index_js_ref_6_oneOf_1_3_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_vue_cli_plugin_uni_packages_vue_loader_lib_index_js_vue_loader_options_HBuilderX_plugins_uniapp_cli_node_modules_dcloudio_webpack_uni_mp_loader_lib_style_js_chat_vue_vue_type_style_index_0_id_ccbcd004_scoped_true_lang_css___WEBPACK_IMPORTED_MODULE_0___default.a); 

/***/ }),

/***/ 241:
/*!*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/mini-css-extract-plugin/dist/loader.js??ref--6-oneOf-1-0!./node_modules/css-loader/dist/cjs.js??ref--6-oneOf-1-1!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib/loaders/stylePostLoader.js!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/webpack-preprocess-loader??ref--6-oneOf-1-2!./node_modules/postcss-loader/src??ref--6-oneOf-1-3!./node_modules/@dcloudio/vue-cli-plugin-uni/packages/vue-loader/lib??vue-loader-options!./node_modules/@dcloudio/webpack-uni-mp-loader/lib/style.js!D:/HBuilderX.4.65.2025051206/翎心/pages/intervene/chat.vue?vue&type=style&index=0&id=ccbcd004&scoped=true&lang=css& ***!
  \*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin
    if(false) { var cssReload; }
  

/***/ })

},[[234,"common/runtime","common/vendor"]]]);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/intervene/chat.js.map