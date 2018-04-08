// basic application
var
  Application = (function() {
    var 
      CHAR_CODE_SPACE = 160,
      CHAR_SPACE = String.fromCharCode(CHAR_CODE_SPACE),
      inst = {
        "state": {
          dom: {},
          app: {}
        },
        "configure": {
          "dom": function(obj) {
            var 
              dom = inst.state.dom;
            Object.keys(obj).forEach(function(key) {
              dom[key] = document.getElementById(
                obj[key].replace('#', '')
              );
            });
          },
          "app": function(obj) {
            inst.state.app = obj;
          }
        },
        "init": function(conf) {
          if (typeof conf === "object") {
            Object.keys(conf).forEach(function(key) {
              inst.configure[key](conf[key]);
            });
          }
          // show the root node
          inst.state.dom.root.classList.remove("hidden");
          // pre-calc as much as possible
          inst.setup();
          // start it up
          inst.runApp();
        },
        "getHtml": function(msg) {
          var 
            html = msg.replace(/\\n/g, "<br>")
                      .replace(/%20/g, " ");
          return html;
        },
        "setup": function() {
          var 
            app = inst.state.app;
          
        },
        "runApp": function() {
          var 
            dom = inst.state.dom;

        }
      };
    return inst;
  })();
