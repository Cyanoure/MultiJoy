(function(exports){
    var defaultWidth = 400;
    var defaultHeight = 400;
    var t_selectorPanel = document.createElement("div");
    t_selectorPanel.style.position = "fixed";
    function alignPanel(panel,width = defaultWidth, height = defaultHeight){
        panel.style.position = "fixed";
        panel.style.top = (window.innerHeight/2 - (height || panel.clientHeight)/2)+"px";
        panel.style.left = (window.innerWidth/2 - (width || panel.clientWidth)/2)+"px";
    }

    var t_notification = document.createElement("div");
    t_notification.innerHTML = "⚠ Teszt értesítés";
    t_notification.style.backgroundColor = "#0009";
    t_notification.style.position = "fixed";
    t_notification.style.padding = "10px";
    t_notification.style.fontSize = "20px";
    t_notification.style.color = "#fff";
    t_notification.style.bottom = "10px";
    t_notification.style.right = "10px";
    t_notification.style.lineHeight = "20px";
    t_notification.style.fontFamily = "sans-serif";
    t_notification.style.borderRadius = "5px";

    var t_inputselector = document.createElement("div");
    t_inputselector.style.position = "fixed";
    /*t_inputselector.style.top = "10px";
    t_inputselector.style.left = "10px";*/
    t_inputselector.style.borderRadius = "5px";
    t_inputselector.style.backgroundColor = "#aaa9";

    var t_inputselector_item = document.createElement("div");
    t_inputselector_item.style.borderRadius = "5px";
    t_inputselector_item.style.margin = "5px";
    t_inputselector_item.style.padding = "10px";
    t_inputselector_item.innerHTML = "Controller";
    t_inputselector_item.style.lineHeight = "20px";
    t_inputselector_item.style.fontFamily = "sans-serif";
    t_inputselector_item.style.fontSize = "20px";
    t_inputselector_item.style.transitionDuration = "0.2s";
    //t_inputselector_item.style.backgroundColor = "#fff9";
    var inputSelectorHighlightColor = "#fff9";
    var inputSelectorDefaultColor = "#fff0";
    t_inputselector_item.style.backgroundColor = inputSelectorDefaultColor;

    /*t_inputselector.appendChild(t_inputselector_item);
    document.body.appendChild(t_inputselector);*/
    
    exports.MultiJoy = class{
        version = "0.1.0";
        controllers = [];
        noteQueue = [];
        maxPlayers = 4;
        static Controller = class{
            virtualButtons = {
                default:{
                    value:0,
                    keys:[],
                    gpbuttons:[]
                }
            };
            keyboardButtons = {};
            gamepadButtons = {};
            index = -1;
            updateInterval = null;
            constructor(name = "Controller"){
                this.name = name;
                var self = this;
                this.onKeyEvent = function(e){
                    if (e && e.code) {
                        var value = 0;
                        if (e.type == "keydown") {
                            value = 1;
                        }
                        if (self.keyboardButtons[e.code] != value) {
                            self.setKeyValue(e.code,value);
                        }
                    }
                }
                this.updateInterval = setInterval(function(){
                    self.updateGamepad();
                },1);
            }
            setKeyValue(btn,value){
                if (this.keyboardButtons[btn] != value) {
                    var self = this;
                    self.keyboardButtons[btn] = value;
                    Object.keys(self.virtualButtons).forEach(vbtn => {
                        if (self.virtualButtons[vbtn].keys.indexOf(btn) > -1) {
                            var prevValue = self.virtualButtons[vbtn].value;
                            self.virtualButtons[vbtn].value = value;
                            var event = new CustomEvent("multijoy_input");
                            var event2 = new CustomEvent("multijoy_input:"+vbtn);
                            event.controller = event2.controller = self;
                            event.button = event2.button = vbtn;
                            event.value = event2.value = value;
                            event.controllerType = event2.controllerType = "keyboard";
                            event.prevValue = event2.prevValue = prevValue;
                            window.dispatchEvent(event2);
                            window.dispatchEvent(event);
                        }
                    });
                }
            }
            setGamepadValue(btn,value){
                if (this.gamepadButtons[btn] != value) {
                    var self = this;
                    self.gamepadButtons[btn] = value;
                    Object.keys(self.virtualButtons).forEach(vbtn => {
                        if (self.virtualButtons[vbtn].gpbuttons.indexOf(btn) > -1) {
                            var prevValue = self.virtualButtons[vbtn].value;
                            self.virtualButtons[vbtn].value = value;
                            var event = new CustomEvent("multijoy_input");
                            var event2 = new CustomEvent("multijoy_input:"+vbtn);
                            event.controller = event2.controller = self;
                            event.button = event2.button = vbtn;
                            event.value = event2.value = value;
                            event.controllerType = event2.controllerType = "gamepad";
                            event.prevValue = event2.prevValue = prevValue;
                            window.dispatchEvent(event2);
                            window.dispatchEvent(event);
                        }
                    });
                }
            }
            getGamepad(){
                if(this.index < 0 || this.index > 3) return null;
                return navigator.getGamepads()[this.index];
            }
            updateGamepad(){
                var deadzone1 = 0.1;
                var deadzone2 = 0.1;
                var d1m = deadzone1/(1-deadzone1)+1;
                var d2m = deadzone2/(1-deadzone2)+1;
                var gp = this.getGamepad();
                if (gp) {
                    var btn = gp.buttons;
                    var buttons = {
                        "DPadUp":12,
                        "DPadRight":15,
                        "DPadDown":13,
                        "DPadLeft":14,
                        "Start":9,
                        "Back":8,
                        "Guide":16,
                        "Touchpad":17,
                        "Y":3,
                        "B":1,
                        "A":0,
                        "X":2,
                        "LSB":10,
                        "RSB":11,
                        "LB":4,
                        "RB":5,
                        "LT":6,
                        "RT":7
                    }
                    Object.keys(buttons).forEach((name) => {
                        var index = buttons[name];
                        if(!btn[index] || btn[index].value == null) return;
                        this.setGamepadValue(name,btn[index].value);
                        //console.log(name,index,btn[index].value);
                    });
                    var a1 = gp.axes[0]; // left horizontal
                    var a2 = gp.axes[1]; // left vertical
                    var a3 = gp.axes[2]; // right horizontal
                    var a4 = gp.axes[3]; // right vertical

                    a1 = Math.abs(a1) > deadzone1 ? (Math.abs(a1)-deadzone1)*d1m*Math.sign(a1) : 0;
                    a2 = Math.abs(a2) > deadzone1 ? (Math.abs(a2)-deadzone1)*d1m*Math.sign(a2) : 0;
                    a3 = Math.abs(a3) > deadzone2 ? (Math.abs(a3)-deadzone2)*d2m*Math.sign(a3) : 0;
                    a4 = Math.abs(a4) > deadzone2 ? (Math.abs(a4)-deadzone2)*d2m*Math.sign(a4) : 0;

                    this.setGamepadValue("L1",a1);
                    this.setGamepadValue("L2",a2);
                    this.setGamepadValue("LLeft",-Math.min(0,Math.max(-1,a1)));
                    this.setGamepadValue("LRight",Math.min(1,Math.max(0,a1)));
                    this.setGamepadValue("LDown",Math.min(1,Math.max(0,a2)));
                    this.setGamepadValue("LUp",-Math.min(0,Math.max(-1,a2)));

                    this.setGamepadValue("R1",a3);
                    this.setGamepadValue("R2",a4);
                    this.setGamepadValue("RLeft",-Math.min(0,Math.max(-1,a3)));
                    this.setGamepadValue("RRight",Math.min(1,Math.max(0,a3)));
                    this.setGamepadValue("RDown",Math.min(1,Math.max(0,a4)));
                    this.setGamepadValue("RUp",-Math.min(0,Math.max(-1,a4)));
                }
            }
            getValue(vbtn){
                if (this.virtualButtons[vbtn]) {
                    return this.virtualButtons[vbtn].value;
                }
                return 0;
            }
            kill(){
                clearInterval(this.updateInterval);
                window.removeEventListener("keydown",this.onKeyEvent);
                window.removeEventListener("keyup",this.onKeyEvent);
            }
            registerKeyboard(){
                window.addEventListener("keydown",this.onKeyEvent);
                window.addEventListener("keyup",this.onKeyEvent);
            }
            unregisterKeyboard(){
                window.removeEventListener("keydown",this.onKeyEvent);
                window.removeEventListener("keyup",this.onKeyEvent);
            }
            createInput(vbtn = "default"){
                this.virtualButtons[vbtn] = {
                    value:0,
                    keys:[],
                    gpbuttons:[]
                };
            }
            inputExists(vbtn = "default"){
                return !!this.virtualButtons[vbtn];
            }
            bindKeyboardButton(vbtn = "default",btn = ""){
                if(!this.inputExists(vbtn)) this.createInput(vbtn);
                if (this.virtualButtons[vbtn].keys.indexOf(btn) == -1) {
                    this.virtualButtons[vbtn].keys.push(btn);
                }
            }
            unbindKeyboardButton(vbtn = "default",btn = ""){
                if (this.inputExists(vbtn)) {
                    var index = this.virtualButtons[vbtn].keys.indexOf(btn);
                    if (index > -1) {
                        this.virtualButtons[vbtn].keys.splice(index,1);
                    }
                }
            }
            bindGamepadButton(vbtn = "default",btn = ""){
                if(!this.inputExists(vbtn)) this.createInput(vbtn);
                if (this.virtualButtons[vbtn].gpbuttons.indexOf(btn) == -1) {
                    this.virtualButtons[vbtn].gpbuttons.push(btn);
                }
            }
            unbindGamepadButton(vbtn = "default",btn = ""){
                if (this.inputExists(vbtn)) {
                    var index = this.virtualButtons[vbtn].gpbuttons.indexOf(btn);
                    if (index > -1) {
                        this.virtualButtons[vbtn].gpbuttons.splice(index,1);
                    }
                }
            }
            setSource(index = -1){
                if(index == "keyboard"){

                }else if (index >= 0 && index <= 3) {
                    this.index = index;
                }else{
                    this.index = -1;
                }
            }
            vibrate(duration = 0, power = 1){
                var gpad = this.getGamepad();
                if (gpad) {
                    exports.MultiJoy.vibrateGamepad(gpad.index,duration,power);
                }
            }
        }
        static vibrateGamepad(index = 0,duration,power = 1,power2 = null){
            if (power2 == null) {
                power2 = power;
            }
            if(index < 0 || index > 3) return;
            var gpad = navigator.getGamepads()[index];
            if (gpad.vibrationActuator && gpad.vibrationActuator.playEffect) {
                gpad.vibrationActuator.playEffect("dual-rumble",{
                    duration:duration,
                    strongMagnitude:power,
                    weakMagnitude:power2
                });
            }
        }
        getController(name){
            return this.controllers[name];
        }
        delController(name){
            if(!this.controllers[name]) return;
            this.controllers[name].kill();
            delete this.controllers[name];
        }
        addController(name,index = -1){

        }
        showNotification(msg,callback = function(){}){
            var note = t_notification.cloneNode(true,true);
            note.style.right = "-500px";
            note.innerHTML = "⚠ "+msg;
            document.body.appendChild(note);
            var w = note.clientWidth;
            var showPos = 10;
            var pos = -w;
            var viewTime = 3;
            var c = 10;
            var intv = setInterval(function(){
                if (pos+c < showPos) {
                    note.style.right = (pos+=c)+"px";
                }else{
                    note.style.right = "10px";
                    clearInterval(intv);
                    setTimeout(function(){
                        intv = setInterval(function(){
                            if (pos-c > -w) {
                                note.style.right = (pos-=c)+"px";
                            }else{
                                note.style.right = "-500px";
                                clearInterval(intv);
                                document.body.removeChild(note);
                                callback();
                            }
                        },1000/60);
                    },1000*viewTime);
                }
            },1000/60);
        }
        notify(msg){
            var self = this;
            self.noteQueue.push(msg);
            if (self.noteQueue.length == 1) {
                function show(){
                    if (self.noteQueue.length == 0) return;
                    var msg = self.noteQueue[0];
                    self.showNotification(msg,function(){
                        self.noteQueue.splice(0,1);
                        show();
                    });
                }
                show();
            }
        }
        constructor(){
            var self = this;
            this.gamepadConnection = function(e){
                //console.log(e);
                switch(e.type){
                    case "gamepadconnected":
                        self.notify("Gamepad connected (#"+e.gamepad.index+")");
                        break;
                    case "gamepaddisconnected":
                        self.notify("Gamepad disconnected (#"+e.gamepad.index+")");
                        self.detachGamepad(e.gamepad.index);
                        break;
                }
            }
            window.addEventListener("gamepadconnected",this.gamepadConnection);
            window.addEventListener("gamepaddisconnected",this.gamepadConnection);

            this.controllers.push(new exports.MultiJoy.Controller("Player 1"));
            this.controllers.push(new exports.MultiJoy.Controller("Player 2"));
            this.controllers.push(new exports.MultiJoy.Controller("Player 3"));
            this.controllers.push(new exports.MultiJoy.Controller("Player 4"));
            window.addEventListener("controller_attached",function(e){
                self.notify("Controls attached (#"+self.controllers.indexOf(e.controller)+")");
            });
            window.addEventListener("controller_detached",function(e){
                self.notify("Controls detached (#"+self.controllers.indexOf(e.controller)+")");
            });
            /*this.bindGamepadButton("Input Selector","Back");
            window.addEventListener("multijoy_input:Input Selector",e => {
                
            });*/
            setInterval(function(){
                var gamepads = navigator.getGamepads();
                var m = 0.5;
                m*=100;
                for(var i = 0; i < 4; i++){
                    var gpad = gamepads[i];
                    if(gpad != null){
                        if (gpad.buttons[8] && gpad.buttons[8].pressed) {
                            if(self.inputSelectors[gpad.index] === null){
                                self.inputSelectors[gpad.index] = 0;
                            }else if(typeof(self.inputSelectors[gpad.index]) == "number" && self.inputSelectors[gpad.index] < m){
                                self.inputSelectors[gpad.index]++;
                            }else if (self.inputSelectors[gpad.index] == m) {
                                self.inputSelectors[gpad.index] = "loading";
                                self.openInputSelector(gpad.index);
                            }
                        }else if (typeof(self.inputSelectors[gpad.index]) == "number") {
                            self.inputSelectors[gpad.index] = null;
                        }
                    }
                }
            },10);
        }
        inputSelectors = [null,null,null,null];
        openInputSelector(index){
            var self = this;
            var inputSelector = t_inputselector.cloneNode(true,true);
            this.inputSelectors[index] = inputSelector;
            if (index == 0 || index == 1) {
                inputSelector.style.top = "10px";
            }else{
                inputSelector.style.bottom = "10px";
            }
            if (index == 0 || index == 2) {
                inputSelector.style.left = "10px";
            }else{
                inputSelector.style.right = "10px";
            }
            document.body.appendChild(inputSelector);
            for(var i = 0; i < self.maxPlayers; i++){
                var item = t_inputselector_item.cloneNode();
                item.innerHTML = self.controllers[i].name;
                inputSelector.appendChild(item);
            }
            exports.MultiJoy.vibrateGamepad(index,100,0.6);
            /*console.log("ok");
            setTimeout(function(){self.closeInputSelector(index);console.log("end")},1000);*/
            var c = new exports.MultiJoy.Controller();
            c.index = index;
            c.name = "MultiJoy Controller Selector";
            c.bindGamepadButton("Close","Back");
            c.bindGamepadButton("Close","B");
            c.bindGamepadButton("Up","DPadUp");
            c.bindGamepadButton("Down","DPadDown");
            c.bindGamepadButton("Up","LUp");
            c.bindGamepadButton("Down","LDown");
            c.bindGamepadButton("Enter","A");
            c.updateGamepad();
            c.virtualButtons["Close"].value = 0;
            var activeItem = 0;
            function setActiveItem(index){
                index = (self.maxPlayers+(index))%self.maxPlayers;
                var prevItem = inputSelector.children[activeItem];
                var item = inputSelector.children[index];
                prevItem.style.backgroundColor = inputSelectorDefaultColor;
                item.style.backgroundColor = inputSelectorHighlightColor;
                activeItem = index;
            }
            setActiveItem(0);
            self.detachGamepad(index);
            function onInput(e){
                if (e.controller == c && e.value > 0 && e.prevValue == 0) {
                    exports.MultiJoy.vibrateGamepad(index,75,0,0.5);
                    //console.log(e.button);
                    switch(e.button){
                        case "Up":
                            setActiveItem(activeItem-1);
                            break;
                        case "Down":
                            setActiveItem(activeItem+1);
                            break;
                        case "Enter":
                            self.attachGamepad(activeItem,index);
                            close();
                            break;
                    }
                }
            }
            window.addEventListener("multijoy_input",onInput);
            var intv = setInterval(function(){
                //console.log(c.getValue("Up"));
                var gpad = navigator.getGamepads()[index];
                if (gpad && c.getValue("Close") == 0) {
                    
                }else{
                    close();
                }
            },10);
            function close(){
                clearInterval(intv);
                self.closeInputSelector(index);
                window.removeEventListener("multijoy_input",onInput);
            }
        }
        closeInputSelector(index){
            var selector = this.inputSelectors[index];
            if (selector != null && typeof(selector) == "object") {
                document.body.removeChild(selector);
                this.inputSelectors[index] = null;
            }
        }
        detachControllerFromAll(controller = 0){
            var controller = this.controllers[controller];
            controller.index = -1;
            var event = new CustomEvent("controller_detached");
                event.controller = controller;
            window.dispatchEvent(event);
        }
        detachGamepad(index = 0){
            this.controllers.forEach(controller => {
                if (controller.index == index) {
                    controller.index = -1;
                    var event = new CustomEvent("controller_detached");
                event.controller = controller;
                    window.dispatchEvent(event);
                }
            });
        }
        attachGamepad(controller = 0,index = 0){
            var controller = this.controllers[controller];
            if (controller.index != index) {
                controller.index = index;
                var event = new CustomEvent("controller_attached");
                event.controller = controller;
                window.dispatchEvent(event);
            }
        }
        detachKeyboard(controller = 0){
            var controller = this.controllers[controller];
            controller.unregisterKeyboard();
            if (controller.index <= -1) {
                var event = new CustomEvent("controller_detached");
                event.controller = controller;
                window.dispatchEvent(event);
            }
        }
        attachKeyboard(controller = 0){
            var controller = this.controllers[controller];
            controller.registerKeyboard();
            if (controller.index <= -1) {
                var event = new CustomEvent("controller_attached");
                event.controller = controller;
                window.dispatchEvent(event);
            }
        }
        createInput(vbtn = "default"){
            this.controllers.forEach(controller => {
                controller.createInput(vbtn);
            });
        }
        bindKeyboardButton(vbtn = "default",btn = ""){
            this.controllers.forEach(controller => {
                controller.bindKeyboardButton(vbtn,btn);
            });
        }
        unbindKeyboardButton(vbtn = "default",btn = ""){
            this.controllers.forEach(controller => {
                controller.unbindKeyboardButton(vbtn,btn);
            });
        }
        bindGamepadButton(vbtn = "default",btn = ""){
            this.controllers.forEach(controller => {
                controller.bindGamepadButton(vbtn,btn);
            });
        }
        unbindGamepadButton(vbtn = "default",btn = ""){
            this.controllers.forEach(controller => {
                controller.unbindGamepadButton(vbtn,btn);
            });
        }
    }
})(typeof exports === 'undefined'? this : exports);