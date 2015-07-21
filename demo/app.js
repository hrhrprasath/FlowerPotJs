var app = FP.app("test");
app.scope.set("test", "test");
app.scope.watch("test", function (newval) {
	alert(newval);
	app.scope.set("test", "test says hi ");
});
app.factory("f1", [function () {
			return {
				"f1f" : function (frm) {
					alert("f1f called by "+frm)
				}
			}
		}
	]);
app.factory("f2", ["f1", function (f1) {
			return {
				"f2f" : (function () {
					f1.f1f('app1 f2');
				})()
			}
		}
	]);
var app2 = FP.app("test2",["test"]);
app2.factory("f3", ["f1", function (f1) {
			return {
				"f3f" : (function () {
					f1.f1f('app2 f3');
				})()
			}
		}
	]);
app2.scope.set("fptest2", "test2");
app2.scope.watch("fptest2", function (newval) {
	alert(newval);
	app2.scope.set("fptest2", "test2 Says HI");
});