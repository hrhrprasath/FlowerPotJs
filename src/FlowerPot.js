var FlowerPot=FP= (function () {
	'use strict';
	//utilities
	function mergeObj(obj1,obj2){for (var at in obj2) { obj1[at] = obj2[at]; }};
	//Private Data
	var model={};
	var addDomEvent=function(element,eventName,callback){
			element[window.addEventListener ? 'addEventListener' : 'attachEvent']( window.addEventListener ? eventName : 'on'+eventName, callback, false)
		};
	var removeDomEvent=function(element,eventName,callback){
			element[window.removeEventListener ? 'removeEventListener' : 'detachEvent']( window.removeEventListener ? eventName : 'on'+eventName, callback, false)
		};
	function Module(model_val,constants_val,factory_val,controller_val,controller_dependancy_val){
		var resources = {
		'constants' : { },
		'factory' : { },
		'mode' : null,
		'root' : '/',
		'routes' : [],
		'controller' : { },
		'controller_dependancy':{ },
		'model':''
		};
		var bindings={};
		
			if(constants_val)mergeObj(resources.constants,constants_val);
			if(factory_val)mergeObj(resources.factory,factory_val);
			if(controller_val)resources.controller=controller_val;
			if(controller_dependancy_val)resources.controller_dependancy=controller_dependancy_val;
			resources.model = model_val;
		
		//2 way Data Binding --<
		function getAllElementsWithAttribute(attribute,element){
			var matchingElements = [];
			var allElements;
			if(element)
				allElements = element.getElementsByTagName('*');
			else
				allElements = document.getElementsByTagName('*');
			for (var i = 0, n = allElements.length; i < n; i++)
			{
				if (allElements[i].getAttribute(attribute) !== null)
				{
				  // Element exists with attribute. Add to array.
				  matchingElements.push(allElements[i]);
				}
			}
			return matchingElements;
		};
		
		function bindeElements(){
			var appElements = getAllElementsWithAttribute('fp-app',null);
			for(var j=0,leng=appElements.length;j<leng;j++){
				if(resources.model == appElements[j].getAttribute('fp-app')){
					var bindElementsArray = getAllElementsWithAttribute('fp-bind',appElements[j]);
					for(var i=0,len=bindElementsArray.length;i<len;i++)
					{
						if(bindElementsArray[i].nodeName.toLowerCase() === "input")
						{
							var onchangecb= function(event){
								var key = event.target.getAttribute('fp-bind');
								bindings[key].Value = event.target.value;
								if(bindings[key].WatchList && bindings[key].WatchList.length)
									for (var i = 0, length = bindings[key].WatchList.length; i < length;i++)
										bindings[key].WatchList[i](bindings[key].Value);
							};
							var key = bindElementsArray[i].getAttribute('fp-bind');
							if(!bindings[key])bindings[key]={};
							if(!bindings[key].Elements)bindings[key].Elements = [];
							bindings[key].Elements.push(bindElementsArray[i]);
							bindElementsArray[i].value = bindings[key].Value||'';
							addDomEvent(bindElementsArray[i],'change',onchangecb);
						}
					}
				}
			}
		};
		var onDomLoadCB = function(){
			bindeElements();
			removeDomEvent(window,'load',onDomLoadCB);
		};
		addDomEvent(window,'load',onDomLoadCB);
		var scope={
		'get':function(key){return bindings[key].Value;},
		'set':function(key,value,isFireWatch){ 
				if(!bindings[key])bindings[key]={};
				var domElements = bindings[key].Elements||[];
				for(var x=0,leng = domElements.length;x<leng;x++)
				{
					if (domElements[x].nodeName.toLowerCase() === "input" && domElements[x].value != value)
						domElements[x].value = value;
				}
				if (isFireWatch&&bindings[key].WatchList && bindings[key].WatchList.length)
					for(var i=0,length = bindings[key].WatchList.length;i<length;i++)
						bindings[key].WatchList[i](bindings[key].Value);
				bindings[key].Value = value;
			  },
		'watch':function(key,callback){
					if(!bindings[key]){	console.log('invalid scope variable'+key); }
					else{
						if(!bindings[key].WatchList)bindings[key].WatchList=[];
						bindings[key].WatchList.push(callback);
					}
			  }
		};
		//-->
		//MVC Functions--<
		function loadDependancies(arrayArg){
			var dependancy = [], iter;
			for (iter = 0; iter < arrayArg.length; iter += 1) {
			if (typeof arrayArg[iter] === "string") {
				//look in modules
				//if (resources.hasOwnProperty(arrayArg[iter])){
				//dependancy.push(loadModule(arrayArg[iter]));
				//} else {
					//look in factory
					if (resources.factory.hasOwnProperty(arrayArg[iter])) {
						dependancy.push(resources.factory[arrayArg[iter]]);//loadDependancy(arrayArg[iter])
					} else {
						//look in constants
						if (resources.constants.hasOwnProperty(arrayArg[iter])) {
							dependancy.push(resources.constants[arrayArg[iter]]);//loadConstant(arrayArg[iter]
						} else {
							//if it is $me scope
							if (arrayArg[iter] === "$mi") {
								dependancy.push({});
							} else {
								console.log("Error: " + arrayArg[iter] + " is not Found in constants and Factories");
							}
						}
					//}
					}
				}
			}
			return dependancy;
		};
		function constants(key, val){
				resources.constants[key] = val();
		};
		function routes(route, controller){
			var temp = {'path':route, 'handler':controller };
			resources.routes.push(temp);
		};
		function controller(controllerName, handler){
			var last_index = handler.length-1;
			var dependancies = handler.slice(0, -1);
			if (typeof handler[last_index] === "function") {
				resources.controller[controllerName] = handler[last_index];
				resources.controller_dependancy[controllerName] = dependancies;
			} else {
				console.log("Nan");
			}
		};
		function factory(key, arrayArg){
			var last_index = arrayArg.length-1;
			var dependancies = arrayArg.slice(0, -1);
			if (typeof arrayArg[last_index] === "function") {
				console.log("-"+loadDependancies(dependancies));
				resources.factory[key] = arrayArg[last_index].apply(this, loadDependancies(dependancies)); 
			} else {
				console.log("Nan");
			}
		};
		return {'factory': factory,'routes': routes,'controller': controller,'constants': constants,'scope':scope,'reseource':resources}
	};

	function app(key, arrayArg){
		var dependancies = arrayArg;
		var constantsObj ={}
		var factoryObj ={}
		var controllerObj ={}
		var controller_dependancyObj ={}
		if(dependancies && dependancies.length){
			for(var i=0,len=dependancies.length;i<len;i++){
				if(model[dependancies[i]]){
					mergeObj(constantsObj, model[dependancies[i]].reseource.constants);
					mergeObj(factoryObj, model[dependancies[i]].reseource.factory);
					mergeObj(controllerObj, model[dependancies[i]].reseource.controller);
					mergeObj(controller_dependancyObj, model[dependancies[i]].reseource.controller_dependancy);
				}else{
					throw("Error:"+dependancies[i]+" app not Found");
				}
			}
		}		
		model[key] = new Module(key,constantsObj,factoryObj,controllerObj,controller_dependancyObj);
		return  {'factory': model[key].factory,'routes': model[key].routes,'controller': model[key].controller,'constants': model[key].constants,'scope':model[key].scope}
	};
	return{'app':app,'addEvent':addDomEvent,'removeEvent':removeDomEvent}
	//-->
})();
/*
var Router = {
    routes: [],
    mode: null,
    root: '/',
    config: function(options) {
        this.mode = options && options.mode && options.mode == 'history' 
                    && !!(history.pushState) ? 'history' : 'hash';
        this.root = options && options.root ? '/' + this.clearSlashes(options.root) + '/' : '/';
        return this;
    },
    getFragment: function() {
        var fragment = '';
        if(this.mode === 'history') {
            fragment = this.clearSlashes(decodeURI(location.pathname + location.search));
            fragment = fragment.replace(/\?(.*)$/, '');
            fragment = this.root != '/' ? fragment.replace(this.root, '') : fragment;
        } else {
            var match = window.location.href.match(/#(.*)$/);
            fragment = match ? match[1] : '';
        }
        return this.clearSlashes(fragment);
    },
    clearSlashes: function(path) {
        return path.toString().replace(/\/$/, '').replace(/^\//, '');
    },
    add: function(re, handler) {
        if(typeof re == 'function') {
            handler = re;
            re = '';
        }
        this.routes.push({ re: re, handler: handler});
        return this;
    },
    remove: function(param) {
        for(var i=0, r; i<this.routes.length, r = this.routes[i]; i++) {
            if(r.handler === param || r.re.toString() === param.toString()) {
                this.routes.splice(i, 1); 
                return this;
            }
        }
        return this;
    },
    flush: function() {
        this.routes = [];
        this.mode = null;
        this.root = '/';
        return this;
    },
    check: function(f) {
        var fragment = f || this.getFragment();
        for(var i=0; i<this.routes.length; i++) {
            var match = fragment.match(this.routes[i].re);
            if(match) {
                match.shift();
                this.routes[i].handler.apply({}, match);
                return this;
            }           
        }
        return this;
    },
    listen: function() {
        var self = this;
        var current = self.getFragment();
        var fn = function() {
            if(current !== self.getFragment()) {
                current = self.getFragment();
                self.check(current);
            }
        }
        clearInterval(this.interval);
        this.interval = setInterval(fn, 50);
        return this;
    },
    navigate: function(path) {
        path = path ? path : '';
        if(this.mode === 'history') {
            history.pushState(null, null, this.root + this.clearSlashes(path));
        } else {
            window.location.href.match(/#(.*)$/);
            window.location.href = window.location.href.replace(/#(.*)$/, '') + '#' + path;
        }
        return this;
    }
}

// configuration
Router.config({ mode: 'history'});

// returning the user to the initial state
Router.navigate();

// adding routes
Router
.add(/about/, function() {
    console.log('about');
})
.add(/products\/(.*)\/edit\/(.*)/, function() {
    console.log('products', arguments);
})
.add(function() {
    console.log('default');
})
.check('/products/12/edit/22').listen();

// forwarding
Router.navigate('/about');
*/