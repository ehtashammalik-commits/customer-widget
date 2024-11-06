(function (f) { if (typeof exports === "object" && typeof module !== "undefined") { module.exports = f() } else if (typeof define === "function" && define.amd) { define([], f) } else { var g; if (typeof window !== "undefined") { g = window } else if (typeof global !== "undefined") { g = global } else if (typeof self !== "undefined") { g = self } else { g = this } g.EmojiPicker = f() } })(function () {
  var define, module, exports; return (function e(t, n, r) { function s(o, u) { if (!n[o]) { if (!t[o]) { var a = typeof require == "function" && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error("Cannot find module '" + o + "'"); throw f.code = "MODULE_NOT_FOUND", f } var l = n[o] = { exports: {} }; t[o][0].call(l.exports, function (e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r) } return n[o].exports } var i = typeof require == "function" && require; for (var o = 0; o < r.length; o++)s(r[o]); return s })({
    1: [function (require, module, exports) {
      (function (global, factory) {
        if (typeof define === "function" && define.amd) {
          define(["module"], factory);
        } else if (typeof exports !== "undefined") {
          factory(module);
        } else {
          var mod = {
            exports: {}
          };
          factory(mod);
          global.emojiPicker = mod.exports;
        }
      })(this, function (module) {
        "use strict";

        function _classCallCheck(instance, Constructor) {
          if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
          }
        }

        var _createClass = function () {
          function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
              var descriptor = props[i];
              descriptor.enumerable = descriptor.enumerable || false;
              descriptor.configurable = true;
              if ("value" in descriptor) descriptor.writable = true;
              Object.defineProperty(target, descriptor.key, descriptor);
            }
          }

          return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
          };
        }();

      var EmojiPicker = function () {
        function EmojiPicker() {
          _classCallCheck(this, EmojiPicker);

          this.initiate();
        }

        _createClass(EmojiPicker, [{
          key: "initiate",
          value: function initiate() {
            var _this = this;

              var emojiInputs = document.querySelectorAll('[data-emoji-picker="true"]');
              for (var i = 0; i < emojiInputs.length; i++) {
                _this.generateElements(emojiInputs[i]);

              }
            // emojiInputs.forEach(function (element) {
            //   _this.generateElements(element);
            // });
          }
        }, {
          key: "generateElements",
          value: function generateElements(emojiInput) {
            if (document.getElementById("EmojiLink")) {
              return;
            }
            var clickLink = function clickLink(event) {
              event.preventDefault();
              var caretPos = emojiInput.selectionStart;
              emojiInput.value = emojiInput.value.substring(0, caretPos) + " " + event.target.innerHTML + emojiInput.value.substring(caretPos);
              emojiPicker.style.display = "none";
              emojiInput.focus();

              //trigger ng-change for angular
              if (typeof angular !== "undefined") {
                angular.element(emojiInput).triggerHandler("change");
              }
            };

            emojiInput.style.width = "100%";

            var emojiContainer = document.createElement("div");
            emojiContainer.style.width = "100%";

            var parent = emojiInput.parentNode;
            parent.replaceChild(emojiContainer, emojiInput);
            emojiContainer.appendChild(emojiInput);

            var emojiPicker = document.createElement("div");
            emojiPicker.tabIndex = 0;

            emojiPicker.addEventListener("blur", function (event) {
              emojiPicker.style.display = "none";
            }, false);

              emojiPicker.id = "EmojiLink";
              emojiPicker.style.position = "absolute";
              emojiPicker.style.left = "2px";
              emojiPicker.style.outline = "none";
              emojiPicker.style.top = "-200px";
              emojiPicker.style.zIndex = "99";
              emojiPicker.style.display = "none";
              emojiPicker.style.width = "232px";
              emojiPicker.style.padding = "7px 7px 7px 7px";
              emojiPicker.style.marginTop = "5px";
              emojiPicker.style.overflow = "hidden";
              emojiPicker.style.background = "#fff";
              emojiPicker.style.height = "200px";
              emojiPicker.style.overflowY = "auto";
              emojiPicker.style.boxShadow = "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)";
              emojiPicker.style.borderRadius = "2px;";

              var emojiTrigger = document.createElement("a");
              emojiTrigger.style.position = "absolute";
              emojiTrigger.style.bottom = "10px";
              emojiTrigger.style.fontSize = "20px";
              emojiTrigger.style.left = "15px";
              emojiTrigger.style.zIndex = "99";
              

              // emojiTrigger.style.position = "absolute";
              // emojiTrigger.style.top = "16px";
              // emojiTrigger.style.left = "0";
              // emojiTrigger.style.textDecoration = "none";
              emojiTrigger.style.cursor = "pointer";
              // emojiTrigger.setAttribute("href", "javascript:void(0)");
              // emojiTrigger.innerHTML = '<i class="material-icons">sentiment_satisfied_alt</i>';
              emojiTrigger.innerText = ' add_reaction ';
              emojiTrigger.classList.add('material-symbols-outlined');
              emojiTrigger.classList.add('emoji-btn');
              emojiTrigger.onclick = function () {
                if (emojiPicker.disabled) {
                  return;
                }
                if (emojiPicker.style.display === "none") {
                  emojiPicker.style.display = "block";
                }
                emojiPicker.focus();
              };

            emojiContainer.appendChild(emojiTrigger);

            var emojiList = document.createElement("ul");
            emojiList.style.padding = "0";
            emojiList.style.margin = "0";
            emojiList.style.listStyle = "none";
            emojiList.style.zIndex = "9999999";

              var emojis = [0x1f600, 0x1f603, 0x1f604, 0x1f601, 0x1f606, 0x1f605, 0x1f923, 0x1f602, 0x1f642, 0x1f643, 0x1f609, 0x1f60a, 0x1f607, 0x1f60d, 0x1f929, 0x1f618, 0x1f617, 0x1f61a, 0x1f619, 0x1f60b, 0x1f61b, 0x1f61c, 0x1f92a, 0x1f61d, 0x1f911, 0x1f917, 0x1f92d, 0x1f92b, 0x1f914, 0x1f910, 0x1f928, 0x1f610, 0x1f611, 0x1f636, 0x1f60f, 0x1f612, 0x1f607, 0x1f62c, 0x1f925, 0x1f60c, 0x1f614, 0x1f62a, 0x1f924, 0x1f634, 0x1f615, 0x1f61F, 0x1f641, 0x1f62e, 0x1f62f, 0x1f632, 0x1f633, 0x1f626, 0x1f627, 0x1f628, 0x1f630, 0x1f625, 0x1f622, 0x1f62d, 0x1f631, 0x1f616, 0x1f623, 0x1f61e];

            emojis.map(function (item) {
              var emojiLi = document.createElement("li");
              emojiLi.style.display = "inline-block";
              emojiLi.style.margin = "5px";

                var emojiLink = document.createElement("a");
                emojiLink.style.textDecoration = "none";
                emojiLink.style.margin = "5px";
                emojiLink.style.position = "initial";
                emojiLink.style.fontSize = "24px";
                emojiLink.style.width = "30px";
                emojiLink.style.display = "inline-block";
                emojiLink.style.textAlign = "center";
                emojiLink.style.cursor = "pointer";
                // emojiLink.setAttribute("href", "javascript:void(0)");
                emojiLink.innerHTML = String.fromCodePoint(item);
                emojiLink.onmousedown = clickLink;

              emojiList.appendChild(emojiLink);
            });

            emojiPicker.appendChild(emojiList);
            emojiContainer.appendChild(emojiPicker);
          }
        }]);

        return EmojiPicker;
      }();

      module.exports = EmojiPicker;
    });

  },{}]},{},[1])(1)
});
