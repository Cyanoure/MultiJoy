MultiJoy.setMaxPlayers(4)

const container = document.getElementById("gamepadStatusElements");

function createInputData(label, value, isAxis = false) {
    const inputData = document.createElement("td");
    inputData.classList.add("input-data");

    const inputDataLabel = document.createElement("span");
    inputDataLabel.classList.add("input-label");
    inputDataLabel.innerText = label;

    const inputDataIndicator = document.createElement("div");
    inputDataIndicator.classList.add("input-indicator");

    if (isAxis) {
        if (value < 0) {
            inputDataIndicator.style.left = "unset";
            inputDataIndicator.style.right = "50%";
        } else {
            inputDataIndicator.style.left = "50%";
            inputDataIndicator.style.right = "unset";
        }
        inputDataIndicator.style.width = `${Math.abs(value) * 50}%`;
    } else {
        inputDataIndicator.style.width = `${value * 100}%`;
    }

    inputData.appendChild(inputDataLabel);
    inputData.appendChild(inputDataIndicator);

    return inputData;
}

function createRowFromGamepadData(gamepad) {
    const row = document.createElement("tr");

    const labelElem = document.createElement("td");
    labelElem.innerText = `#${gamepad.index}`;
    row.appendChild(labelElem);

    for (let i = 0; i < gamepad.axes.length; i++) {
        row.appendChild(createInputData(`Axis #${i}`, gamepad.axes[i], true));
    }

    for (let i = 0; i < gamepad.buttons.length; i++) {
        row.appendChild(createInputData(`BTN #${i}`, gamepad.buttons[i].value));
    }

    return row;
}

setInterval(() => {
    const temporaryContainer = document.createElement("tbody");
    MultiJoy.players.forEach(player => {
        const gamepad = player.getGamepad();
        if (gamepad) {
            temporaryContainer.appendChild(createRowFromGamepadData(gamepad));
            if (player.isButtonDown(6) || player.isButtonDown(7)) {
                player.startVibration(200, player.getButtonValue(7), player.getButtonValue(6));
            }
        }
    });
    container.innerHTML = temporaryContainer.innerHTML;
}, 50);