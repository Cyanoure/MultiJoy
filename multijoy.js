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
        exports.players.forEach(player => {
            player.update();
        });
    }, 10);
})(typeof exports === 'undefined' ? (globalThis.MultiJoy = {}) : exports);