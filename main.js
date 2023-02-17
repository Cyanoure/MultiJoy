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

function createRowFromPlayerData(player) {
    const gamepad = player.getGamepad();
    const row = document.createElement("tr");

    const labelElem = document.createElement("td");
    labelElem.innerText = `#${gamepad.index}`;
    row.appendChild(labelElem);

    for (let i = 0; i < gamepad.axes.length; i++) {
        row.appendChild(createInputData(`Axis #${i}`, player.getAxisValue(i), true));
    }

    for (let i = 0; i < gamepad.buttons.length; i++) {
        row.appendChild(createInputData(`BTN #${i}`, player.getButtonValue(i)));
    }

    return row;
}

setInterval(() => {
    const temporaryContainer = document.createElement("tbody");
    MultiJoy.players.forEach(player => {
        const gamepad = player.getGamepad();
        if (gamepad) {
            temporaryContainer.appendChild(createRowFromPlayerData(player));
            if (player.isButtonDown(6) || player.isButtonDown(7)) {
                player.startVibration(200, player.getButtonValue(7), player.getButtonValue(6));
            }
        }
    });
    container.innerHTML = temporaryContainer.innerHTML;
}, 50);

for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
        MultiJoy.players[i].setDetectionZoneOfAxis(j, 0.1, 0.9);
    }
}

window.addEventListener("MultiJoy:Players:0:Buttons:0:Down", e => {
    console.log("Button A down");
});

window.addEventListener("MultiJoy:Players:0:Buttons:0:Up", e => {
    console.log("Button A up");
});

window.addEventListener("MultiJoy:Players:0:Buttons:1:Touch", e => {
    console.log("Button B touch");
});

window.addEventListener("MultiJoy:Players:0:Buttons:1:Release", e => {
    console.log("Button B release");
});

window.addEventListener("MultiJoy:Players:0:Buttons:6:Change", e => {
    console.log("Button LT changed");
});

window.addEventListener("MultiJoy:Players:0:Buttons:any:Down", e => {
    console.log(`Button #${e.inputIndex} pressed`);
});

window.addEventListener("MultiJoy:Players:any:Buttons:3:Down", e => {
    console.log(`Button Y pressed on player #${e.playerIndex}`);
});