(function (exports) {
    function gamepadConnection(e) {
        //console.log(e);
        switch (e.type) {
            case "gamepadconnected":
                exports.autoAttachGamepad(e.gamepad.index);
                break;
            case "gamepaddisconnected":
                exports.detachGamepad(e.gamepad.index);
                break;
        }
    }
    window.addEventListener("gamepadconnected", gamepadConnection);
    window.addEventListener("gamepaddisconnected", gamepadConnection);

    exports.autoAttachGamepad = (gamepadIndex) => {
        console.log(`Auto attaching gamepad #${gamepadIndex}`);
        for (let i = 0; i < exports.players.length; i++) {
            const player = exports.players[i];
            if (player.gamepadIndex === -1) {
                exports.attachGamepad(i, gamepadIndex);
                return;
            }
        }
    }

    exports.attachGamepad = (playerIndex, gamepadIndex) => {
        const player = exports.players[playerIndex];
        if (player) {
            console.log(`Gamepad #${gamepadIndex} attached to player #${playerIndex}`);
            player.gamepadIndex = gamepadIndex;
        }
    }

    exports.detachGamepad = (gamepadIndex) => {
        exports.players.forEach(player => {
            if (player.gamepadIndex === gamepadIndex) {
                player.gamepadIndex = -1;
            }
        });
    }

    exports.autoConnect = true;

    exports.Player = class {
        gamepadIndex = -1;
        buttonSelectorCallback = null;
        axesDetectionZones = [];

        index = 0;

        getGamepad() {
            if (this.gamepadIndex === -1) {
                return null;
            }
            return navigator.getGamepads()[this.gamepadIndex];
        }
        isConnected() {
            return this.getGamepad() !== null;
        }

        setDetectionZoneOfAxis(index, min, max) {
            this.axesDetectionZones[index] = [min, max];
        }

        requestButtonSelection(callback = () => { }) {
            this.buttonSelectorCallback = callback;
        }

        callButtonSelection(type, index) {
            if (this.buttonSelectorCallback !== null) {
                const cb = this.buttonSelectorCallback;
                this.buttonSelectorCallback = null;
                cb(type, index);
            }
        }

        prevButtonsStatus = [];
        prevAxesStatus = [];
        prevAnyDown = false;

        update() {
            if (this.isConnected()) {
                let gamepad = this.getGamepad();
                if (this.buttonSelectorCallback !== null) {
                    for (let i = 0; i < gamepad.axes.length; i++) {
                        const val = Math.abs(gamepad.axes[i]);
                        if (val >= 0.75) {
                            this.callButtonSelection("axes", i);
                            return;
                        }
                    }
                    for (let i = 0; i < gamepad.buttons.length; i++) {
                        const val = Math.abs(gamepad.buttons[i].value);
                        if (val >= 0.75) {
                            this.callButtonSelection("buttons", i);
                            return;
                        }
                    }
                    return;
                }

                let downButtons = [];
                let upButtons = [];
                let touchButtons = [];
                let releaseButtons = [];
                let changeButtons = [];

                for (let i = 0; i < gamepad.buttons.length; i++) {
                    const data = this.getButtonData(i);
                    const prevData = typeof (this.prevButtonsStatus[i]) !== "undefined" ? this.prevButtonsStatus[i] : false;
                    if (prevData) {
                        if (data.pressed && !prevData.pressed) { // Down Event
                            downButtons.push(i);
                        } else if (!data.pressed && prevData.pressed) { // Up Event
                            upButtons.push(i);
                        }

                        if (data.touched && !prevData.touched) { // Touch Event
                            touchButtons.push(i);
                        } else if (!data.touched && prevData.touched) { // Release Event
                            releaseButtons.push(i);
                        }

                        if (data.value !== prevData.value) { // Change Event
                            changeButtons.push(i);
                        }
                    }
                    this.prevButtonsStatus[i] = data;
                }

                function emitEvent(playerIndex, inputType, inputIndex, inputEvent) {
                    let realPlayerIndex = playerIndex;
                    let realInputIndex = inputIndex;
                    if (typeof (playerIndex) !== "number") {
                        realPlayerIndex = playerIndex[0]
                        playerIndex = playerIndex[1];
                    }
                    if (typeof (inputIndex) !== "number") {
                        realInputIndex = inputIndex[0]
                        playerIndex = inputIndex[1];
                    }
                    const inputTypeUpper = inputType.substr(0, 1).toUpperCase() + inputType.substr(1);
                    const inputEventUpper = inputEvent.substr(0, 1).toUpperCase() + inputEvent.substr(1);
                    function fillEventData(event) {
                        event.player = this;
                        event.playerIndex = realPlayerIndex;
                        event.inputType = inputType;
                        event.inputIndex = realInputIndex;
                        event.inputEvent = inputEvent;
                    }
                    let event = new CustomEvent(`MultiJoy:Players:${playerIndex}:${inputTypeUpper}:${inputIndex}:${inputEventUpper}`);
                    fillEventData.call(this, event);

                    let anyInputEvent = new CustomEvent(`MultiJoy:Players:${playerIndex}:${inputTypeUpper}:any:${inputEventUpper}`);
                    fillEventData.call(this, anyInputEvent);

                    let anyPlayerEvent = new CustomEvent(`MultiJoy:Players:any:${inputTypeUpper}:${inputIndex}:${inputEventUpper}`);
                    fillEventData.call(this, anyPlayerEvent);

                    let anyAnyEvent = new CustomEvent(`MultiJoy:Players:any:${inputTypeUpper}:any:${inputEventUpper}`);
                    fillEventData.call(this, anyAnyEvent);

                    window.dispatchEvent(event);
                    window.dispatchEvent(anyInputEvent);
                    window.dispatchEvent(anyPlayerEvent);
                    window.dispatchEvent(anyAnyEvent);
                }

                /*let downButtons = [];
                let upButtons = [];
                let touchButtons = [];
                let releaseButtons = [];
                let changeButtons = [];*/

                //emitEvent.call(this, this.index, "buttons", 0, "down");

                downButtons.forEach(index => {
                    emitEvent.call(this, this.index, "buttons", index, "down");
                });

                upButtons.forEach(index => {
                    emitEvent.call(this, this.index, "buttons", index, "up");
                });

                touchButtons.forEach(index => {
                    emitEvent.call(this, this.index, "buttons", index, "touch");
                });

                releaseButtons.forEach(index => {
                    emitEvent.call(this, this.index, "buttons", index, "release");
                });

                changeButtons.forEach(index => {
                    emitEvent.call(this, this.index, "buttons", index, "change");
                });
            }
        }

        getButtonData(index) {
            const data = {
                pressed: false,
                touched: false,
                value: 0
            };
            if (!this.isConnected() || index < 0) return data;
            let gamepad = this.getGamepad();
            if (gamepad.buttons.length <= index) return data;
            const realData = gamepad.buttons[index];
            data.pressed = realData.pressed;
            data.touched = realData.touched;
            data.value = realData.value;
            return data;
        }

        getAxisValue(index) {
            if (!this.isConnected() || index < 0) return 0;
            let gamepad = this.getGamepad();
            if (gamepad.axes.length <= index) return 0;

            if (this.axesDetectionZones[index]) {
                const range = this.axesDetectionZones[index];
                const realValue = gamepad.axes[index];
                const absRealValue = Math.abs(realValue);

                let newValue = absRealValue - range[0];
                const maxValue = 1 - range[0] - (1 - range[1]);

                if (newValue > 0) {
                    newValue = newValue / maxValue;
                    newValue *= Math.sign(realValue);
                    return Math.min(Math.max(newValue, -1), 1);
                } else {
                    return 0;
                }
            } else {
                return gamepad.axes[index];
            }
            //return gamepad.axes[index];
        }

        getButtonValue(index) {
            return this.getButtonData(index).value;
        }

        isButtonDown(index) {
            return this.getButtonValue(index) >= 0.5;
        }

        getFirstDownButton() {
            if (!this.isConnected()) return -1;
            let gamepad = this.getGamepad();
            for (let i = 0; i < gamepad.buttons.length; i++) {
                if (this.isButtonDown(i)) {
                    return i;
                }
            }
        }

        isAnyButtonDown() {
            return this.getFirstDownButton() >= 0;
        }

        startVibration(duration = 200, weak = 0, strong) {
            if (strong === undefined) {
                strong = weak;
            }
            const gamepad = this.getGamepad();
            if (gamepad && gamepad.vibrationActuator) {
                gamepad.vibrationActuator.playEffect(gamepad.vibrationActuator.type, {
                    startDelay: 0,
                    duration: duration,
                    weakMagnitude: weak,
                    strongMagnitude: strong,
                });
            }
        }
    }

    exports.players = [];

    exports.increasePlayers = function () {
        exports.players.push(new exports.Player());
    }
    exports.decreasePlayers = function () {
        exports.players.splice(0, 1);
    }
    exports.setMaxPlayers = function (playersCount) {
        if (playersCount < 0) return;
        while (exports.players.length < playersCount) {
            exports.increasePlayers();
        }
        while (exports.players.length > playersCount) {
            exports.decreasePlayers();
        }
    }

    setInterval(() => {
        let i = 0;
        exports.players.forEach(player => {
            player.index = i++;
            player.update();
        });
    }, 10);
})(typeof exports === 'undefined' ? (globalThis.MultiJoy = {}) : exports);