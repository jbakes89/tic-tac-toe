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

    const getTileAt = (rowIndex, colIndex) => {
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
        getTileAt,
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
        let rgba = [0, 0, 0, 1.0];
        // console.log(`Testing ${s.slice(0,3)} == "rgb" ? ${s.slice(0,1)} == "#" ?`);
        if (s.slice(0,3) == "rgb") {
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

    _onInit();
    return { r, g, b, a, asRGBString, asHexString };
};



const gameController = (function(nToWin) {
    let players = [];
    let currentPlayerIndex = 0;


    const _onInit = () => {
        const editPlayersButton = document.querySelector(".js-edit-button");
        editPlayersButton.addEventListener("click", editPlayers);
        const resetButton = document.querySelector(".js-reset-button");
        resetButton.addEventListener("click", resetGame);
        _startGame();
    };

    /* Start a new game */
    const _startGame = () => {
        _setupPlayers();
        document.addEventListener("click", handleClick);
    };

    /* Reset the current game */
    const resetGame = () => {
        displayController.clearAllTiles();
        gameboard.resetAllTiles();
        _randomizeCurrentPlayerIndex();
        _startGame();
    };

    /* End the current game */
    const _endGame = () => {
        document.removeEventListener("click", handleClick);
    }

    /* Setup the players before the game */
    const _setupPlayers = () => {
        players = [
            playerFactory("P1", "X", colorFactory({fromString: DEFAULT_PLAYER_COLORS[0]})),
            playerFactory("P2", "O", colorFactory({fromString: DEFAULT_PLAYER_COLORS[1]}))
        ];
        _randomizeCurrentPlayerIndex();
    };

    const editPlayers = () => {
        editMenuController.toggleMenu();
    };

    const _randomizeCurrentPlayerIndex = () => {
        currentPlayerIndex = Math.round(Math.random() * (players.length - 1));
    };

    /* Change the current player to the person whose turn is next */
    const advancePlayerIndex = () => {
        currentPlayerIndex = (players.length - currentPlayerIndex < 2) ? 0 : currentPlayerIndex + 1;
    };

    /* Handle click on grid tile */
    const handleClick = e => {
        if (editMenuController.editMenuIsOpen()) {
            editMenuController.handleClick(e);
            return;
        }
        else if (e.target.classList.contains("js-tile")) {
            makeMoveAtTileDiv(e.target);
        }
    }

    /* Have the current player place a marker at the given tile */
    const makeMoveAtTileDiv = (tileDiv) => {
        const tileIndex = tileDiv.dataset.tileNumber;
        gameboard.setTileValue(tileIndex, currentPlayerIndex);
        displayController.markTileDiv(tileDiv, players[currentPlayerIndex].marker, players[currentPlayerIndex].color);
        const outcome = checkGameOutcome();
        switch (outcome) {
            case "Tie":
            case "Win":
                // displayController.showMessageForOutcome(outcome);
                _endGame();
                break;
            default:
                advancePlayerIndex();
        }
    }

    /* Check whether the game is finished, and if it's a win or tie */
    const checkGameOutcome = () => {
        if (gameboard.isFilled()) {
            console.log("Tie");
            return "Tie";
        } else if (checkNInARow(WIN_CONDITION, Math.sqrt(gameboard.tiles().length))) {
            console.log(`Win: ${players[currentPlayerIndex].name} with ${players[currentPlayerIndex].marker}`);
            return "Win";
        } else {
            return false;
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
            let lastTile = gameboard.getTileAt(row, 0);
            for (var col = 1; col < gridSideLength; col++) {
                const thisTile = gameboard.getTileAt(row, col);
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
            let lastTile = gameboard.getTileAt(0, col);
            for (var row = 1; row < gridSideLength; row++) {
                const thisTile = gameboard.getTileAt(row, col);
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
            let lastTile = gameboard.getTileAt(0, col);
            for (var delta = 1; col + delta < gridSideLength; delta++) {
                const thisTile = gameboard.getTileAt(delta, col + delta);
                hitCounter = ((lastTile || lastTile === 0) && thisTile === lastTile) ? hitCounter + 1 : 1;
                if (hitCounter == n) return true;
                if (hitCounter + (gridSideLength - (col + delta)) < n) break;
                lastTile = thisTile;
            }
        }
        // scan down first col
        for (var row = 1; row < (gridSideLength - n) + 1; row++) {
            let hitCounter = 1;
            let lastTile = gameboard.getTileAt(row, 0);
            for (var delta = 1; row + delta < gridSideLength; delta++) {
                const thisTile = gameboard.getTileAt(row + delta, delta);
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
            let lastTile = gameboard.getTileAt(gridSideLength - 1, col);
            for (var delta = 1; col + delta < gridSideLength; delta++) {
                const thisTile = gameboard.getTileAt(gridSideLength - (1 + delta), col + delta);
                hitCounter = ((lastTile || lastTile === 0) && thisTile === lastTile) ? hitCounter + 1 : 1;
                if (hitCounter == n) return true;
                if (hitCounter + (gridSideLength - (col + delta)) < n) break;
                lastTile = thisTile;
            }
        }
        // scan up first col
        for (var row = gridSideLength - 1; row > n - 2; row--) {
            let hitCounter = 1;
            let lastTile = gameboard.getTileAt(row, 0);
            for (var delta = 1; row - delta > -1; delta++) {
                const thisTile = gameboard.getTileAt(row - delta, delta);
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

    _onInit();
    return {
        updatePlayerColor,
        getPlayerColor,
        updatePlayerName,
        getPlayerName
    };
})(WIN_CONDITION);





const displayController = (function() {
    const _editMenuWrapper = document.querySelector(".js-edit-menu-wrapper")

    const _onInit = () => {
        _renderBoard();
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
    };

    const clearAllTiles = () => {
        const tileDivs = document.querySelectorAll(".js-tile");
        tileDivs.forEach((tileDiv => {
            tileDiv.textContent = "";
            const defaultTileColor = window.getComputedStyle(document.documentElement).getPropertyValue("--js-tile-bg-col")
            tileDiv.style.backgroundColor = defaultTileColor;
        }))
    }

    const _setupPlayerNameEditing = () => {
        /* Make text editable on hovering */
        const playerInfoWrappers = document.querySelectorAll(".js-player-info-wrapper")
        playerInfoWrappers.forEach((wrapper) => {
            wrapper.addEventListener("mouseenter", (e) => {
                e.target.querySelector(".js-player-name").contentEditable = true;
            })
            wrapper.addEventListener("mouseleave", (e) => {
                e.target.querySelector(".js-player-name").contentEditable = false;
            })
        })
    };

    const setPlayerIconBorderColor = (color, playerIndex) => {
        const playerNameDiv = document.querySelector(`.js-player-name[data-player-index="${playerIndex}"]`);
        playerNameDiv.parentElement.style.borderColor = color.asHexString();
    };

    const setPlayerName = (name, playerIndex) => {
        const playerNameDiv = document.querySelector(`.js-player-name[data-player-index="${playerIndex}"]`);
        playerNameDiv.textContent = name;
    }

    _onInit();

    return {
        markTileDiv,
        clearAllTiles,
        setPlayerIconBorderColor,
        setPlayerName
    };

})();




const editMenuController = (function() {
    const _wrapper = document.querySelector(".js-edit-menu-wrapper");
    const _playerColorPickers = document.querySelectorAll(".js-color-picker");
    const _playerNameInputs = document.querySelectorAll(".js-name-input");
    let lastPlayerNames = [];
    let playerNameBeingEdited = false;

    const _onInit = () => {
        _closeMenu();
        setDefaultsForPlayerInfo();
    };

    const editMenuIsOpen = () => {
        return !(_wrapper.classList.contains("--js-closed"));
    }

    const _closeMenu = () => {
        _wrapper.classList.add("--js-closed");
    };

    const _openMenu = () => {
        _wrapper.classList.remove("--js-closed");
    };

    const toggleMenu = () => {
        _wrapper.classList.toggle("--js-closed");
    };

    const _playerColorChanged = (e) => {
        const playerIndex = e.target.dataset.playerIndex;
        const color = colorFactory({fromString: e.target.value});
        gameController.updatePlayerColor(color, playerIndex);
    }
    
    const _playerNameInputEdited = (e) => {
        const playerIndex = e.target.dataset.playerIndex;
        if (!playerNameBeingEdited) {
            lastPlayerNames[playerIndex] = gameController.getPlayerName(playerIndex);
        }
        playerNameBeingEdited = true;
        console.log(`Last name for player-${playerIndex}: ${lastPlayerNames[playerIndex]}`);
        const name = e.target.value;
        gameController.updatePlayerName(name, playerIndex);
    }

    const _playerNameChanged = (e) => {
        const playerIndex = e.target.dataset.playerIndex;
        const name = _validateNewPlayerName(e.target.value) ? e.target.value : lastPlayerNames[playerIndex];
        e.target.value = name;
        gameController.updatePlayerName(name, playerIndex);
        playerNameBeingEdited = false;
    }

    const _validateNewPlayerName = (name) => {
        if (!name) {
            return false;
        }

        return true;
    }

    const setDefaultsForPlayerInfo = () => {
        _playerColorPickers.forEach((picker, index) => {
            picker.value = gameController.getPlayerColor(index).asHexString();
            picker.addEventListener("input", _playerColorChanged);
        });
        _playerNameInputs.forEach((input, index) => {
            input.addEventListener("input", _playerNameInputEdited);
            input.addEventListener("change", _playerNameChanged);
            input.value = gameController.getPlayerName(index);
        })
    }

    const handleClick = (e) => {
        if (editMenuIsOpen() &&
        !e.target.closest(".js-edit-menu-wrapper") &&
        !e.target.classList.contains("js-edit-button")
        ) {
            _closeMenu();
        }
    }

    _onInit();
    return {
        toggleMenu,
        editMenuIsOpen,
        handleClick
    }

})();