/** Connect Four
 *
 * Player 1 and 2 alternate turns. On each turn, a piece is dropped down a
 * column until a player gets four-in-a-row (horiz, vert, or diag) or until
 * board fills (tie)
 */

const WIDTH = 7;
const HEIGHT = 6;

class Game {

  constructor(width, height) {
    const board = document.getElementById('board');

    this.width = width;
    this.height = height;

    this.state = new GameState(width, height);
    this.ui = new GameUI(board, width, height);

    this.ui.addEventListener('topRowClick', this._handleClick.bind(this));
    this.ui.enableUIInteraction();
  }

  _handleClick(e) {
    const x = e.detail;
    const y = this.state.placePiece(x);
    if (y === null) return;

    this.ui.disableUIInteraction();

    const newPiece = this.ui.placeInTable(y, x, this.state.currPlayer);

    newPiece.addEventListener('animFinished', () => {

      const winner = this.state.checkForWin();
      if (winner) {
        return this.endGame(`Player ${winner} won!`);
      }
  
      // check for tie
      if (this.state.checkForTie()) {
        return this.endGame('It\'s a tie!');
      }

      this.state.nextTurn();

      this.ui.updateDisplay(this.state.currPlayer);
      this.ui.enableUIInteraction();
    });
  }

  endGame(msg) {
    window.alert(msg);

    // reset game
    this.state = new GameState(this.width, this.height);
    this.ui.clearHtmlBoard();
    this.ui.updateDisplay(this.state.currPlayer);
    this.ui.enableUIInteraction();
  }
}

/**
 * Class: GameState
 * Maintains state information unrelated to presentation
 * currPlayer: (1|2) represents which player's turn it is
 * width: represents width of board
 * height: represents height of board
 */

class GameState {

  constructor(width, height) {
    this.currPlayer = 1;
    this.width = width;
    this.height = height;
    this.initBoard();
  }

  /** 
   * initBoard: create in-JS board structure:
   * board = array of rows, each row is array of cells  (board[y][x])
   */
  initBoard() {
    const row = new Array(this.width).fill(null);
    this.board = new Array(this.height).fill().map(col => [...row]);
  }

  /**
   * _findSpotForCol: given column x, return top empty y (null if filled)
   */
  _findSpotForCol(x) {
    const y = this.board.findIndex(row => row[x]);
    if (y === 0) return null;
    return y === -1 ? this.height - 1 : y - 1;
  }

  /**
   * placePiece: place piece in board at x, if possible
   * returns y of placed piece, null if unable to place
   */
  placePiece(x) {
    const y = this._findSpotForCol(x);
    if (y === null) return null;
    this.board[y][x] = this.currPlayer;
    return y;
  }

  /**
   * _nextTurn: switch to next player's turn
   */
  nextTurn() {
    this.currPlayer = this.currPlayer === 1 ? 2 : 1;
  }

  /**
   * checkForWin: check board cell-by-cell for "does a win start here?"
   */
  checkForWin() {
    function _win(cells, _this) {
      // Check four cells to see if they're all color of current player
      //  - cells: list of four (y, x) cells
      //  - returns true if all are legal coordinates & all match currPlayer
  
      return cells.every(
        ([y, x]) =>
          y >= 0 &&
          y < _this.height &&
          x >= 0 &&
          x < _this.width &&
          _this.board[y][x] === _this.currPlayer
      );
    }
    
    // start at each cell in the board
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // for each cell, create an array starting at the coordinates for that 
        // cell and go through the next three sequential cells per direction
        const horiz = [[y, x], [y, x + 1], [y, x + 2], [y, x + 3]];
        const vert = [[y, x], [y + 1, x], [y + 2, x], [y + 3, x]];
        const diagDR = [[y, x], [y + 1, x + 1], [y + 2, x + 2], [y + 3, x + 3]];
        const diagDL = [[y, x], [y + 1, x - 1], [y + 2, x - 2], [y + 3, x - 3]];
  
        // if any configuration results in a win condition, return the winning player
        if (_win(horiz, this) || _win(vert, this) || _win(diagDR, this) || _win(diagDL, this)) {
          return this.currPlayer;
        }
      }
    }
  }

  /**
   * checkForTie: what it says on the tin
   */
  checkForTie() {
    return this.board.every(row => row.every(cell => cell));
  }
}

/**
 * Class: GameUI
 * Represents the view of the game
 * board: represents HTML board element
 * top: represents top row of HTML board
 */
class GameUI extends EventTarget {

  constructor(board, width, height) {
    super();
    this.board = board;
    this._makeHtmlBoard(width, height);
    this._boundHandleClick = this._handleClick.bind(this);
  }

  _makeHtmlBoard(width, height) {
    // create top table row where pieces will be dropped from
    const top = document.createElement("tr");
    top.setAttribute("id", "column-top");

    // add WIDTH table cells to row
    for (let x = 0; x < width; x++) {
      const headCell = document.createElement("td");
      headCell.setAttribute("id", x);
      top.append(headCell);
    }
    this.board.append(top);
    this.top = top;

    // generate rest of board
    for (let y = 0; y < height; y++) {
      // create new row
      const row = document.createElement("tr");
      // for each row, add WIDTH table cells
      for (let x = 0; x < WIDTH; x++) {
        const cell = document.createElement("td");
        cell.setAttribute("id", `space-${y}-${x}`);
        row.append(cell);
      }
      // add row to board
      this.board.append(row);
    }
  }

  clearHtmlBoard() {
    this.board.querySelectorAll('.piece').forEach(piece => piece.remove());
  }

  _handleClick(e) {
    const event = new CustomEvent('topRowClick', { detail: +e.target.id });
    this.dispatchEvent(event);
  }

  enableUIInteraction() {
    this.top.classList.add('active');
    this.top.addEventListener('click', this._boundHandleClick);
  }

  disableUIInteraction() {
    this.top.classList.remove('active');
    this.top.removeEventListener('click', this._boundHandleClick);
  }

  updateDisplay(player) {
    const root = document.documentElement;
    const newColor = getComputedStyle(root).getPropertyValue(
      player === 1 ? '--custom-red' : '--custom-blue'
    );
    root.style.setProperty('--player-color', newColor);
  
    document.querySelector('#turn').innerText = `It is Player ${player}'s turn`;
  }

  placeInTable(y, x, player) {
    // make a div and insert into correct table cell
    const space = document.querySelector(`#space-${y}-${x}`);
    const piece = document.createElement('div');
    
    // animation stuffs
    const boardTop = this.board.getBoundingClientRect().top;
    const spacePos = space.getBoundingClientRect().top;
  
    let pos = boardTop - spacePos;
    let rate = 0;
  
    piece.style.transform = `translateY(${pos}px)`;
    piece.classList.add('piece', `p${player}`);
    space.appendChild(piece);
  
    const animFinished = new Event('animFinished');
    const update = () => {
      pos = Math.min(0, pos + (rate += 5));
      piece.style.transform = `translateY(${pos}px)`;
      if (pos < 0) requestAnimationFrame(update);
      else piece.dispatchEvent(animFinished);
    }
    requestAnimationFrame(update);
  
    return piece;
  }
}

new Game(WIDTH, HEIGHT);