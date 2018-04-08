// basic application
var
  Application = (function() {
    var 
      CHAR_CODE_SPACE = 160,
      CHAR_SPACE = String.fromCharCode(CHAR_CODE_SPACE),
      inst = {
        "state": {
          dom: {},
          app: {
            "user": null,
            "pass": null
          }
        },
        "configure": {
          "dom": function(obj) {
            var 
              dom = inst.state.dom;
            Object.keys(obj).forEach(function(key) {
              var tmp = $(document.getElementById(
                obj[key].replace('#', '')
              ));
              if (key.indexOf("-template") > -1) {
                key = key.replace("-template", "");
                tmp.attr("id", key);
                tmp.remove();
              }
              dom[key] = tmp;
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
          inst.showDom('loading');
          // pre-calc as much as possible
          inst.setup();
          // start it up
          inst.runApp();
        },
        "setup": function() {
          var 
            app = inst.state.app,
            user = app.user,
            pass = app.pass;
          if (user && pass) {
            inst.loadUser({
              "user": user,
              "pass": pass
            });
          } else {
            inst.showLogin();
          }
        },
        "showLogin": function() {
          var 
            app = inst.state.app,
            users = app.users;
          inst.showDom('signin');
          if (users) {
            inst.showUsers(users);
          } else {
            inst.loadUsers();
          }
        },
        "showDom": function(key) {
          var
            dom = inst.state.dom,
            root = dom.root,
            loading = dom.loading,
            content = dom.content,
            next = dom[key],
            temp;
          if (next) {
            temp = next.clone();
            temp.removeClass("hidden");
            content.empty().append(temp);
            content.removeClass("hidden");
            // show the root node
            root.removeClass("hidden");
          } else {
            console.error("showDom error: no next @ ", key);
          }
        },
        "showUsers": function(users) {
          console.log("showUsers", users);
        },
        "loadUsers": function() {
          inst.request({
            url: "/loadUsers",
            success: function(data){
              console.log("loadUsers successful!");
              console.log(data);
              /*
              var files = data.files;
              var keys = Object.keys(files);
              keys.forEach(function(key) {
                var result = files[key];
                handleData(result);
              });
              */
            }
          });
        },
        "loadUser": function(conf) {
          var formData = new FormData();
          formData.set("user", conf.user);
          formData.set("pass", conf.pass);
          inst.request({
            url: "/loadUser",
            type: "POST",
            data: formData,
            success: function(data){
              console.log("loadUser successful!");
              console.log(data);
              /*
              var files = data.files;
              var keys = Object.keys(files);
              keys.forEach(function(key) {
                var result = files[key];
                handleData(result);
              });
              */
            }
          });
        },
        request: function(options) {
          $.ajax({
            url: options.url,
            type: options.type || "GET",
            data: options.data || {},
            processData: false,
            contentType: false,
            dataType: 'json',
            success: options.success,
            xhr: function() {
              // create an XMLHttpRequest
              var xhr = new XMLHttpRequest();
              // listen to the 'progress' event
              //xhr.upload.addEventListener("progress", updateProgress, false);
              return xhr;
            }
          });
        },
        "runApp": function() {
          var 
            dom = inst.state.dom;

        }
      };
    return inst;
  })();
