'use strict';

const BOARD_SIZE = 3 // 3x3 grid
const WIN_CONDITION = 3 // n in a row
const DEFAULT_PLAYER_COLORS = ["rgb(52, 131, 223)", "rgb(255, 240, 109)"];



const gameboard = (function(sideLength) {
    const _tiles = Array(sideLength**2).fill(null);
    const _element = document.querySelector(".js-gameboard");

    const tiles = () => _tiles;
    const element = () => _element;

    const setTileValue = (tileIndex, value) => {
        _tiles[tileIndex] = value;
    };

    const getTileAtIndex = (tileIndex) => {
        return _tiles[tileIndex];
    }

    const getTileAtCoords = (rowIndex, colIndex) => {
        return _tiles[(rowIndex * sideLength) + colIndex];
    }

    const isFilled = () => {
        return !(_tiles.includes(null));
    }

    const resetAllTiles = () => {
        _tiles.forEach((tile, index) => {
            _tiles[index] = null;
        });
    }

    return {
        tiles, 
        element,
        setTileValue,
        isFilled,
        getTileAtIndex,
        getTileAtCoords,
        resetAllTiles
    };

})(BOARD_SIZE);





const playerFactory = (name, marker, color) => {
    return { name, marker, color };
};


const colorFactory = ({r=0, g=0, b=0, a=1.0, fromString=null}) => {
    // console.log("===New Color===");

    const _onInit = () => {
        if (fromString) {
            // console.log(`Making from string: ${fromString}`);
            [r, g, b, a] = _setRGBAFromString(fromString);
            // console.log(`New color is {r:${r}, g:${g}, b:${b}, a:${a}}`)
        } else {
            r = Math.min(Math.max(0, r), 255);
            g = Math.min(Math.max(0, g), 255);
            b = Math.min(Math.max(0, b), 255);
            a = Math.min(Math.max(0, a), 1);
        }
    };

    const _setRGBAFromString = (s) => {
        s = s.trim();
        let rgba = [0, 0, 0, 1.0];
        if (s == "white") {
            rgba = [255, 255, 255, 1.0];
        } else if (s == "black") {
            rgba = [0, 0, 0, 1.0];
        }
        // console.log(`Testing ${s.slice(0,3)} == "rgb" ? ${s.slice(0,1)} == "#" ?`);
        else if (s.slice(0,3) == "rgb") {
            // console.log("Identified rgb(a) string");
            rgba = s.replace(RegExp("\s|rgb(a?)|[\(\)]", "g"), "").split(",");
            if (rgba.length == 3) rgba.push(1.0);
            // console.log(`RGBA values updated to ${rgba}`);
        } else if (s.slice(0,1) == "#") {
            // console.log("Identified hex string");
            let i = 0;
            const chunkLength = s.length < 6 ? 1 : 2;
            const numChunks = (s.length - 1) / chunkLength;
            while (i < numChunks) {
                const startIndex = 1 + i*chunkLength;
                const thisValue = s.slice(startIndex, startIndex + chunkLength);
                rgba[i] = (i != 3) ? parseInt(thisValue, 16) : parseInt(thisValue, 16) / 255;
                i++;
            }
        }

        rgba.forEach((e, index) => {
            rgba[index] = (index != 3) ? parseInt(e) : parseFloat(e)
        });
        return rgba;
    }

    const asRGBString = (withAlpha=true) => {
        return `rgba(${r}, ${g}, ${b}${withAlpha ? ", " + a.toString() : ""})`;
    }

    const asHexString = (withAlpha=false) => {
        // console.log(`Converting color(r: ${r}, g: ${g}, b: ${b}, a: ${a}) to Hex string...`)
        const hexString = `#${_componentToHex(r)}${_componentToHex(g)}${_componentToHex(b)}${withAlpha ? _componentToHex(parseInt(a * 255)) : ""}`;
        // console.log(`Returning hexString: ${hexString}`);
        return hexString;
    }

    const _componentToHex = (c) => {
        let hex = c.toString(16);
        hex = hex.length > 1 ? hex : "0" + hex;
        // console.log(`Component ${c} converted to hex ${hex}`);
        return hex
    }

    const _L = () => {
        return _XYZ().Y;
    }

    const _compandedRGB = () => {
        return [r, g, b].map((c) => {
            const normC = c/255;
            return normC <= 0.04045 ? normC/12.92 : Math.pow((normC + 0.055)/1.055, 2.4);
        });
    }

    const contrastingColor = () => {
        return _L()/100 > 0.179 ? colorFactory({fromString: "black"}) : colorFactory({fromString: "white"});
    }

    const _XYZ = () => {
        const compandedRGB = _compandedRGB();
        return {
            X: 100*(0.4124*compandedRGB[0] + 0.3576*compandedRGB[1] + 0.1805*compandedRGB[2]),
            Y: 100*(0.2126*compandedRGB[0] + 0.7152*compandedRGB[1] + 0.0722*compandedRGB[2]),
            Z: 100*(0.0193*compandedRGB[0] + 0.1192*compandedRGB[1] + 0.9505*compandedRGB[2])
        };
    }

    const CIELab = () => {
        const D65 = { X: 95.0489, Y: 100, Z: 108.8840 };
        const xyz = _XYZ();
        Object.keys(xyz).forEach((key) => {
            const norm = xyz[key] / D65[key];
            xyz[key] = norm > 0.008856 ? Math.pow(norm, 1/3) : (7.787 * norm) + (16/116);
        });

        return {
            L: (116 * xyz.Y) - 16,
            a: 500 * (xyz.X - xyz.Y),
            b: 200 * (xyz.Y - xyz.Z)
        };
    }

    const _dE94 = (otherCol) => {
        const kL = 1;
        const kC = 1;
        const kH = 1;
        const K1 = 0.045;
        const K2 = 0.015;

        const Lab1 = CIELab();
        const Lab2 = otherCol.CIELab();

        const dL = Lab1.L - Lab2.L;
        const da = Lab1.a - Lab2.a;
        const db = Lab1.b - Lab2.b;
        const C1 = Math.sqrt((Lab1.a**2) + (Lab1.b**2));
        const C2 = Math.sqrt((Lab2.a**2) + (Lab2.b**2));
        const dCab = C1 - C2;

        const dHab = Math.sqrt(da**2 + db**2 - dCab**2)
        const SL = 1;
        const SC = 1 + K1*C1;
        const SH = 1 + K2*C1;

        return Math.sqrt(
            (dL/(kL*SL))**2 +
            (dCab/(kC*SC))**2 +
            (dHab/(kH*SH))**2
        );
    }

    const differsSufficientlyFrom = (otherCol) => {
        const THRESHOLD = 10;
        const deltaE = _dE94(otherCol);
        return deltaE > THRESHOLD;
    }

    _onInit();
    return { r, g, b, a, asRGBString, asHexString, contrastingColor, CIELab, differsSufficientlyFrom };
};



const gameController = (function(nToWin) {
    let players = [];
    let currentPlayerIndex = 0;
    let gameHasStarted = false;


    const _onInit = () => {
        const editPlayersButton = document.querySelector(".js-edit-button");
        editPlayersButton.addEventListener("click", editPlayers);
        const resetButton = document.querySelector(".js-reset-button");
        resetButton.addEventListener("click", resetGame);

        document.addEventListener("mousedown", handleMousedown);

        document.addEventListener("keydown", (e) => _handleKeyboardInput(e));

        _setupPlayers();
    };

    /* Start a new game */
    const _startGame = () => {
        _randomizeCurrentPlayerIndex();
        displayController.hideVictoryMessage();
        gameHasStarted = true;
    };

    /* Reset the current game */
    const resetGame = () => {
        displayController.clearAllTiles();
        gameboard.resetAllTiles();
        _startGame();
    };

    /* End the current game */
    const _endGame = () => {
        gameHasStarted = false;
        displayController.removeHoverColor();
    }

    /* Setup the players before the game */
    const _setupPlayers = () => {
        players = [
            playerFactory("P1", "X", colorFactory({fromString: DEFAULT_PLAYER_COLORS[0]})),
            playerFactory("P2", "O", colorFactory({fromString: DEFAULT_PLAYER_COLORS[1]}))
        ];
    };

    const editPlayers = () => {
        editMenuController.toggleMenu();
    };

    const _setCurrentPlayerIndex = (newIndex) => {
        currentPlayerIndex = newIndex
        displayController.setHoverColor(players[currentPlayerIndex].color);
        displayController.highlightPlayer(currentPlayerIndex);
    }

    const _randomizeCurrentPlayerIndex = () => {
        _setCurrentPlayerIndex(Math.round(Math.random() * (players.length - 1)));
    };

    /* Change the current player to the person whose turn is next */
    const advancePlayerIndex = () => {
        _setCurrentPlayerIndex((players.length - currentPlayerIndex < 2) ? 0 : currentPlayerIndex + 1);
    };

    /* Handle click */
    const handleMousedown = e => {
        if (e.button != 0) {
            return;
        }
        if (editMenuController.editMenuIsOpen()) {
            editMenuController.handleMousedown(e);
        }
        else if (e.target.classList.contains("js-tile") && gameHasStarted) {
            makeMoveAtTileDiv(e.target);
        }
        else if (displayController.victoryMessageIsOpen()) {
            displayController.hideVictoryMessage();
        }
    }

    /* Have the current player place a marker at the given tile */
    const makeMoveAtTileDiv = (tileDiv) => {
        const tileIndex = tileDiv.dataset.tileNumber;
        if (gameboard.getTileAtIndex(tileIndex) == null) {
            gameboard.setTileValue(tileIndex, currentPlayerIndex);
            displayController.markTileDiv(tileDiv, players[currentPlayerIndex].marker, players[currentPlayerIndex].color);
            const outcome = checkGameOutcome();
            switch (outcome) {
                case "Tie":
                case "Win":
                    displayController.showVictoryMessage(players[currentPlayerIndex].name, outcome);
                    _endGame();
                    break;
                default:
                    advancePlayerIndex();
            }
        }
    }

    /* Check whether the game is finished, and if it's a win or tie */
    const checkGameOutcome = () => {
        if (checkNInARow(WIN_CONDITION, Math.sqrt(gameboard.tiles().length))) {
            return "Win";
        } else if (gameboard.isFilled()) {
            return "Tie";
        } else {
            return "None";
        }
    }

    /* Check the win condition (n-in-a-row) */
    const checkNInARow = (n) => {
        // console.log(`Checking for ${n}-in-a-row`)
        const gridSideLength = Math.sqrt(gameboard.tiles().length);
        // Check rows
        // console.log(`Scanning rows...`)
        for (var row = 0; row < gridSideLength; row++) {
            // console.log(`Row ${row}`)
            let hitCounter = 1;
            let lastTile = gameboard.getTileAtCoords(row, 0);
            for (var col = 1; col < gridSideLength; col++) {
                const thisTile = gameboard.getTileAtCoords(row, col);
                hitCounter = ((lastTile || lastTile === 0) && thisTile === lastTile) ? hitCounter + 1 : 1;
                // console.log(`R${row} C${col}: ${thisTile}; last=${lastTile}; hitCounter=>${hitCounter}`);
                if (hitCounter == n) return true;
                if (hitCounter + (gridSideLength - col) < n) break;
                lastTile = thisTile;
            }
        }
        // Check columns
        for (var col = 0; col < gridSideLength; col++) {
            let hitCounter = 1;
            let lastTile = gameboard.getTileAtCoords(0, col);
            for (var row = 1; row < gridSideLength; row++) {
                const thisTile = gameboard.getTileAtCoords(row, col);
                hitCounter = ((lastTile || lastTile === 0) && thisTile === lastTile) ? hitCounter + 1 : 1;
                if (hitCounter == n) return true;
                if (hitCounter + (gridSideLength - row) < n) break;
                lastTile = thisTile;
            }
        }
        // Check diagonals
        // top-left to bottom-right
        // scan along first row
        for (var col = 0; col < (gridSideLength - n) + 1; col++) {
            let hitCounter = 1;
            let lastTile = gameboard.getTileAtCoords(0, col);
            for (var delta = 1; col + delta < gridSideLength; delta++) {
                const thisTile = gameboard.getTileAtCoords(delta, col + delta);
                hitCounter = ((lastTile || lastTile === 0) && thisTile === lastTile) ? hitCounter + 1 : 1;
                if (hitCounter == n) return true;
                if (hitCounter + (gridSideLength - (col + delta)) < n) break;
                lastTile = thisTile;
            }
        }
        // scan down first col
        for (var row = 1; row < (gridSideLength - n) + 1; row++) {
            let hitCounter = 1;
            let lastTile = gameboard.getTileAtCoords(row, 0);
            for (var delta = 1; row + delta < gridSideLength; delta++) {
                const thisTile = gameboard.getTileAtCoords(row + delta, delta);
                hitCounter = ((lastTile || lastTile === 0) && thisTile === lastTile) ? hitCounter + 1 : 1;
                if (hitCounter == n) return true;
                if (hitCounter + (gridSideLength - (row + delta)) < n) break;
                lastTile = thisTile;
            }
        }
        // bottom-left to top-right
        // scan along bottom row
        for (var col = 0; col < (gridSideLength - n) + 1; col++) {
            let hitCounter = 1;
            let lastTile = gameboard.getTileAtCoords(gridSideLength - 1, col);
            for (var delta = 1; col + delta < gridSideLength; delta++) {
                const thisTile = gameboard.getTileAtCoords(gridSideLength - (1 + delta), col + delta);
                hitCounter = ((lastTile || lastTile === 0) && thisTile === lastTile) ? hitCounter + 1 : 1;
                if (hitCounter == n) return true;
                if (hitCounter + (gridSideLength - (col + delta)) < n) break;
                lastTile = thisTile;
            }
        }
        // scan up first col
        for (var row = gridSideLength - 1; row > n - 2; row--) {
            let hitCounter = 1;
            let lastTile = gameboard.getTileAtCoords(row, 0);
            for (var delta = 1; row - delta > -1; delta++) {
                const thisTile = gameboard.getTileAtCoords(row - delta, delta);
                hitCounter = ((lastTile || lastTile === 0) && thisTile === lastTile) ? hitCounter + 1 : 1;
                if (hitCounter == n) return true;
                if (hitCounter + (row - delta) < n) break;
                lastTile = thisTile;
            }
        }
    }

    const updatePlayerColor = (color, playerIndex) => {
        players[playerIndex].color = color;
        displayController.setPlayerIconBorderColor(color, playerIndex);
    }

    const getPlayerColor = (playerIndex) => {
        return players[playerIndex].color;
    }

    const updatePlayerName = (name, playerIndex) => {
        players[playerIndex].name = name;
        displayController.setPlayerName(name, playerIndex);
    }

    const getPlayerName = (playerIndex) => {
        return players[playerIndex].name;
    }

    const _handleKeyboardInput = (e) => {
        if (editMenuController.editMenuIsOpen()) {
            editMenuController.handleKeyboardInput(e);
        }
    }

    const afterLoading = () => {
        players.forEach((player, index) => {
            updatePlayerName(player.name, index);
            updatePlayerColor(player.color, index);
        });
        _startGame();
    }

    _onInit();
    return {
        updatePlayerColor,
        getPlayerColor,
        updatePlayerName,
        getPlayerName,
        resetGame,
        afterLoading
    };
})(WIN_CONDITION);





const displayController = (function() {
    const _victoryMessageWrapper = document.querySelector(".js-victory-message-wrapper");
    let victoryMessageOpenFlag = false;

    const _onInit = () => {
        _renderBoard();

        window.addEventListener("resize", (e) => _windowWasResized());
    }

    /**
     * Renders the game board to the screen by adding elements to the DOM.
     */
    const _renderBoard = () => {
        // Prepare fragment
        const fragment = new DocumentFragment();
        // Find template tile
        const template = document.querySelector(".js-template-tile");
        const boardSideLength = Math.sqrt(gameboard.tiles().length);
        // Set gameboard grid template
        gameboard.element().style.gridTemplate = `repeat(${boardSideLength}, 1fr) / repeat(${boardSideLength}, 1fr)`
        // Cycle over gameboard tiles
        gameboard.tiles().forEach((tile, index) => {
            // Make div for tile
            const tileDiv = template.cloneNode();
            // Remove template class
            tileDiv.classList.remove("js-template-tile");
            // Draw borders depending on tile position
            switch (index % boardSideLength) {
                case 0:
                    tileDiv.classList.add("--js-no-border-left");
                    break;
                case boardSideLength - 1:
                    tileDiv.classList.add("--js-no-border-right");
            }
            switch (Math.floor(index/boardSideLength)) {
                case 0:
                    tileDiv.classList.add("--js-no-border-top");
                    break;
                case boardSideLength - 1:
                    tileDiv.classList.add("--js-no-border-bottom");
            }
            // Assign index
            tileDiv.dataset.tileNumber = index;
            // Append to fragment
            fragment.appendChild(tileDiv)
        })
        // Append fragment to board
        gameboard.element().appendChild(fragment);
    };

    const markTileDiv = (tileDiv, marker, color) => {
        tileDiv.textContent = marker;
        tileDiv.style.backgroundColor = color.asHexString();
        tileDiv.style.color = color.contrastingColor().asHexString();
    };

    const clearAllTiles = () => {
        const tileDivs = document.querySelectorAll(".js-tile");
        tileDivs.forEach((tileDiv => {
            tileDiv.textContent = "";
            tileDiv.style.backgroundColor = "";
        }))
    }

    const setPlayerIconBorderColor = (color, playerIndex) => {
        const playerNameDiv = document.querySelector(`.js-player-name[data-player-index="${playerIndex}"]`);
        playerNameDiv.parentElement.style.borderColor = color.asHexString();
    };

    const setPlayerName = (name, playerIndex) => {
        const playerNameDiv = document.querySelector(`.js-player-name[data-player-index="${playerIndex}"]`);
        playerNameDiv.textContent = name;
        _resizePlayerNames();
    }

    const blurGameboard = () => {
        const gameboardWrapper = document.querySelector(".js-gameboard-wrapper");
        gameboardWrapper.classList.add("js-blur-effect");
    }

    const unblurGameboard = () => {
        const gameboardWrapper = document.querySelector(".js-gameboard-wrapper");
        gameboardWrapper.classList.remove("js-blur-effect");
    }

    const setHoverColor = (color) => {
        document.documentElement.style.setProperty("--js-tile-hover-col", color.asHexString());
    }

    const removeHoverColor = () => {
        const defaultTileColor = colorFactory({fromString: window.getComputedStyle(document.documentElement).getPropertyValue("--js-tiles-bg-col")})
        setHoverColor(defaultTileColor);
    }

    const highlightPlayer = (playerIndex) => {
        const playerNameDivs = document.querySelectorAll(".js-player-name");
        playerNameDivs.forEach((div) => {
            if (div.dataset.playerIndex == playerIndex) {
                div.parentElement.classList.add("--js-highlighted");
            } else {
                div.parentElement.classList.remove("--js-highlighted");
            }
        });
    }

    const _resizePlayerNames = () => {
        const headerWrapper = document.querySelector(".js-header-wrapper");
        const headerWrapperStyle = window.getComputedStyle(headerWrapper);
        const buttonWrapper = document.querySelector(".js-header-buttons-wrapper");

        const headerInnerWidth = (headerWrapper.clientWidth -
            (
                parseFloat(headerWrapperStyle.paddingLeft) +
                parseFloat(headerWrapperStyle.paddingRight)
            ));
        const availableWidth = (headerInnerWidth - buttonWrapper.offsetWidth)/2;
        const availableHeight = (headerWrapper.clientHeight -
            (
                parseFloat(headerWrapperStyle.paddingTop) +
                parseFloat(headerWrapperStyle.paddingBottom)
            ));


        const borderBoxes = document.querySelectorAll(".js-player-info-border");
        
        borderBoxes.forEach((box) => {
            const boxStyle = window.getComputedStyle(box);
            const currentFontSize = parseFloat(boxStyle.fontSize);
            const innerWidth = box.clientWidth - ((
                parseFloat(boxStyle.paddingLeft) +
                parseFloat(boxStyle.paddingRight)
            ));
            const innerHeight = box.clientHeight - ((
                parseFloat(boxStyle.paddingTop) +
                parseFloat(boxStyle.paddingBottom)
            ));
            const extraWidth = box.offsetWidth - innerWidth;
            const extraHeight = box.offsetHeight - innerHeight;
            const heightScaleFactor = (availableHeight - extraHeight)/innerHeight;
            const widthScaleFactor = (availableWidth - extraWidth)/innerWidth;
            const newFontSize = `${Math.min(heightScaleFactor, widthScaleFactor) * currentFontSize}px`;
            box.style.fontSize = newFontSize;
        })
    }

    const _windowWasResized = () => {
        _resizePlayerNames();
    }

    const showVictoryMessage = (playerName, outcome) => {
        const victoryMessageElement = _victoryMessageWrapper.querySelector(".js-victory-message");
        victoryMessageElement.textContent = _getMessageForOutcome(playerName, outcome);
        _victoryMessageWrapper.classList.remove("--js-hidden");
        victoryMessageOpenFlag = true;
    }

    const hideVictoryMessage = () => {
        _victoryMessageWrapper.classList.add("--js-hidden");
        victoryMessageOpenFlag = false;
    }

    const _getMessageForOutcome = (playerName, outcome) => {
        switch (outcome) {
            case "Win":
                return `${playerName} wins!`;
            case "Tie":
                return "It's a tie!";
            default:
                return "ERROR: Undefined outcome";
        }
    }

    const victoryMessageIsOpen = () => {
        return victoryMessageOpenFlag
    }

    _onInit();

    return {
        markTileDiv,
        clearAllTiles,
        setPlayerIconBorderColor,
        setPlayerName,
        blurGameboard,
        unblurGameboard,
        setHoverColor,
        removeHoverColor,
        highlightPlayer,
        showVictoryMessage,
        hideVictoryMessage,
        victoryMessageIsOpen
    };

})();




const editMenuController = (function() {
    const _wrapper = document.querySelector(".js-edit-menu-wrapper");
    const _playerColorPickers = document.querySelectorAll(".js-color-picker");
    const _playerNameInputs = document.querySelectorAll(".js-name-input");
    const _confirmButton = document.querySelector(".js-confirm-edit-button");
    const _cancelButton = document.querySelector(".js-cancel-edit-button");
    const _confirmDialogWrapper = document.querySelector(".js-confirm-dialog-wrapper");
    const _errorList = document.querySelector(".js-error-list");

    const _onInit = () => {
        _closeMenu();
        
        _confirmButton.addEventListener("click", (e) => _confirmChanges(e));
        _cancelButton.addEventListener("click", (e) => _cancelChanges(e));

        _playerColorPickers.forEach((picker) => {
            picker.addEventListener("input", _inputChanged);
        });
        _playerNameInputs.forEach((input) => {
            input.addEventListener("input", _inputChanged);
        })

        _resetPlayerInfo();
    };

    const editMenuIsOpen = () => {
        return !(_wrapper.classList.contains("--js-closed"));
    }

    const _closeMenu = () => {
        _wrapper.classList.add("--js-closed");
        displayController.unblurGameboard();
    };

    const _openMenu = () => {
        _wrapper.classList.remove("--js-closed");
        displayController.blurGameboard();
        // Update error messages
        _validateForm();
        // Update confirm dialog
        _confirmDialogWrapper.classList.add("--js-hidden");
    };

    const toggleMenu = () => {
        editMenuIsOpen() ? _cancelForm() : _openMenu();
    };

    const _inputChanged = (e) => {
        // Hide confirm changes
        _confirmDialogWrapper.classList.add("--js-hidden");

        if (_validateForm()) {
            if (_infoHasChanged()) {
                // Show confirm changes and return
                _confirmDialogWrapper.classList.remove("--js-hidden");
            }
        }
    }

    const _validatePlayerName = (name) => {
        const errorMessage = _errorList.querySelector(".js-error-message.--js-name-length");

        // Check player names (length 0 - 10 characters)
        if ( !name || name.length > 10 ) {
            errorMessage.classList.remove("--js-hidden");
            return false;
        }

        errorMessage.classList.add("--js-hidden");
        return true;
    }

    const _validateAllPlayerNames = () => {
        for (let input of _playerNameInputs) {
            if (!_validatePlayerName(input.value)) return false;
        }
        return true;
    }

    const _validatePlayerColors = () => {
        const errorMessage = _errorList.querySelector(".js-error-message.--js-color-similarity");

        // Check that colors are not too similar
        const playerCols = Array.from(_playerColorPickers, (picker) => {
            return colorFactory({fromString: picker.value});
        })
        if (!playerCols[0].differsSufficientlyFrom(playerCols[1])) {
            errorMessage.classList.remove("--js-hidden");
            return false;
        }

        errorMessage.classList.add("--js-hidden");
        return true
    }

    const _resetPlayerInfo = () => {
        _playerColorPickers.forEach((picker, index) => {
            picker.value = gameController.getPlayerColor(index).asHexString();
        });
        _playerNameInputs.forEach((input, index) => {
            input.value = gameController.getPlayerName(index);
        })
    }

    const handleMousedown = (e) => {
        if (editMenuIsOpen() &&
        !e.target.closest(".js-edit-menu-wrapper") &&
        !e.target.classList.contains("js-edit-button")
        ) {
            _cancelForm();
        }
    }

    const _infoHasChanged = () => {
        for (let input of _playerNameInputs) {
            const currentName = gameController.getPlayerName(input.dataset.playerIndex)
            if (input.value != currentName) return true;
        }
        for (let picker of _playerColorPickers) {
            const currentCol = gameController.getPlayerColor(picker.dataset.playerIndex).asHexString();
            if (picker.value != currentCol) return true;
        }

        return false;
    }

    const _validateForm = () => {
        let valid = true;

        if (!_validateAllPlayerNames()) {
            valid = false;
        }
        if (!_validatePlayerColors()) {
            valid = false;
        }

        return valid;
    }

    const _confirmChanges = (e) => {
        if (e) e.preventDefault();
        // Validate form content
        if (_validateForm()) {
            _submitForm();
        }
    }

    const _cancelChanges = (e) => {
        if (e) e.preventDefault();
        _cancelForm();
    }

    const _submitForm = (e) => {
        if (e) e.preventDefault();

        // Set player names and colors
        _playerNameInputs.forEach((input) => {
            gameController.updatePlayerName(input.value, input.dataset.playerIndex);
        })
        _playerColorPickers.forEach((picker) => {
            gameController.updatePlayerColor(colorFactory({fromString: picker.value}), picker.dataset.playerIndex);
        })
        // Change colors already on grid or reset game?
        gameController.resetGame();
        _closeMenu();
    }

    const _cancelForm = () => {
        _closeMenu();
        _resetPlayerInfo();
    }

    const handleKeyboardInput = (e) => {
        switch (e.key) {
            case "Escape":
            case "Esc":
                _cancelForm();
            case "Enter":
                _confirmChanges();
        }
    }

    _onInit();
    return {
        toggleMenu,
        editMenuIsOpen,
        handleMousedown,
        handleKeyboardInput
    }

})();

gameController.afterLoading();