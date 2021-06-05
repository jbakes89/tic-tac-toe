'use strict';

const BOARD_SIZE = 3 // 3x3 grid
const WIN_CONDITION = 3 // n in a row

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

    return {
        tiles, 
        element,
        setTileValue,
        isFilled,
        getTileAt
    };

})(BOARD_SIZE);


const playerFactory = (name, marker) => {
    return { name, marker };
};


const gameController = (function(nToWin) {
    let players = [];
    let currentPlayerIndex = 0;

    const _onInit = () => {
        _setupPlayers();
        document.addEventListener("click", handleClick);
    }

    const _setupPlayers = () => {
        players = [
            playerFactory("P1", "X"),
            playerFactory("P2", "O")
        ];
        currentPlayerIndex = 0;
    }

    const advancePlayerIndex = () => {
        currentPlayerIndex = (players.length - currentPlayerIndex < 2) ? 0 : currentPlayerIndex + 1;
    }

    const makeMoveAtTile = (tile) => {
        const tileIndex = tile.dataset.tileNumber;
        gameboard.setTileValue(tileIndex, currentPlayerIndex);
        displayController.markTile(tile, players[currentPlayerIndex].marker);
        if (!checkGameOutcome()) advancePlayerIndex();
    }

    const checkGameOutcome = () => {
        if (gameboard.isFilled()) {
            console.log("Tie");
            return true;
        } else if (checkNInARow(WIN_CONDITION, Math.sqrt(gameboard.tiles().length))) {
            console.log(`Win: ${players[currentPlayerIndex].name} with ${players[currentPlayerIndex].marker}`);
            return true;
        } else {
            return false;
        }
    }

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

    const handleClick = e => {
        if (e.target.classList.contains("js-tile")) {
            makeMoveAtTile(e.target);
        }
    }

    _onInit();
    return {};
})(WIN_CONDITION);


const displayController = (function() {
    /**
     * Renders the game board to the screen by adding elements to the DOM.
     */
    const renderBoard = () => {
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
    }

    const markTile = (tile, marker) => {
        tile.textContent = marker;
    }

    return {
        renderBoard,
        markTile
    };

})();


function afterLoading() {
    displayController.renderBoard();
}

afterLoading();