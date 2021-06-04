'use strict';

const BOARD_SIZE = 3 // 3x3 grid
const WIN_CONDITION = 3 // n in a row

const gameboard = (function(sideLength) {
    const _tiles = Array(sideLength**2).fill();
    const _element = document.querySelector(".js-gameboard");

    const tiles = () => _tiles;
    const element = () => _element;

    const setTileValue = (tileIndex, value) => {
        _tiles[tileIndex] = value;
    };

    const isFilled = () => {
        return !(_tiles.includes(undefined));
    }

    return {
        tiles, 
        element,
        setTileValue,
        isFilled
    };

})(BOARD_SIZE);


const playerFactory = (name, marker) => {
    return { name, marker };
};


const gameController = (function(nToWin) {
    let players = [];
    let currentPlayerIndex = 0;

    const onInit = () => {
        setupPlayers();
        document.addEventListener("click", handleClick);
    }

    const setupPlayers = () => {
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
        if (!checkGameOver()) advancePlayerIndex();
    }

    const checkGameOver = () => {
        if (gameboard.isFilled()) {
            console.log("Tie");
            return true;
        } else {
            return checkNInARow();
        }
    }

    const checkNInARow = () => {
        // Check rows
        // Check columns
        // Check diagonals
    }

    const handleClick = e => {
        if (e.target.classList.contains("js-tile")) {
            makeMoveAtTile(e.target);
        }
    }

    onInit();
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