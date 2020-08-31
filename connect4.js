/** Connect Four
 *
 * Player 1 and 2 alternate turns. On each turn, a piece is dropped down a
 * column until a player gets four-in-a-row (horiz, vert, or diag) or until
 * board fills (tie)
 */

const WIDTH = 7;
const HEIGHT = 6;

let currPlayer = 1; // active player: 1 or 2
let board = []; // array of rows, each row is array of cells  (board[y][x])

/** makeBoard: create in-JS board structure:
 *    board = array of rows, each row is array of cells  (board[y][x])
 */

function makeBoard() {
  // set "board" to empty HEIGHT x WIDTH matrix array
  const row = new Array(WIDTH).fill(null);
  board = new Array(HEIGHT).fill().map(col => [...row]);
}

/** makeHtmlBoard: make HTML table and row of column tops. */

function makeHtmlBoard() {
  // get "htmlBoard" variable from the item in HTML w/ID of "board"
  const htmlBoard = document.querySelector('#board');

  // create top table row where pieces will be dropped from
  const top = document.createElement("tr");
  top.setAttribute("id", "column-top");
  top.classList.add('active');
  top.addEventListener("click", handleClick);

  // add WIDTH table cells to row
  for (let x = 0; x < WIDTH; x++) {
    const headCell = document.createElement("td");
    headCell.setAttribute("id", x);
    top.append(headCell);
  }
  htmlBoard.append(top);

  // generate rest of board
  for (let y = 0; y < HEIGHT; y++) {
    // create new row
    const row = document.createElement("tr");
    // for each row, add WIDTH table cells
    for (let x = 0; x < WIDTH; x++) {
      const cell = document.createElement("td");
      cell.setAttribute("id", `space-${y}-${x}`);
      row.append(cell);
    }
    // add row to board
    htmlBoard.append(row);
  }
}

/** clearHtmlBoard: clear all game pieces from HTML board */

function clearHtmlBoard() {
  const htmlBoard = document.querySelector('#board');
  htmlBoard.querySelectorAll('.piece').forEach(piece => piece.remove());
  const top = document.querySelector('#column-top');
  top.classList.add('active');
  top.addEventListener("click", handleClick);
}

/** findSpotForCol: given column x, return top empty y (null if filled) */

function findSpotForCol(x) {
  let y = board.findIndex(row => row[x]);
  if (y === 0) return null;
  return y === -1 ? HEIGHT - 1 : y - 1;
}

/** placeInTable: update DOM to place piece into HTML table of board */

function placeInTable(y, x) {
  // make a div and insert into correct table cell
  const space = document.querySelector(`#space-${y}-${x}`);
  const piece = document.createElement('div');

  const root = document.documentElement;
  const boardTop = document.querySelector('#board').getBoundingClientRect().top;
  const spacePos = space.getBoundingClientRect().top;

  // animation stuffs
  let pos = boardTop - spacePos;
  let rate = 0;

  piece.style.transform = `translateY(${pos}px)`;
  piece.classList.add('piece', `p${currPlayer}`);
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

/** endGame: announce game end */

function endGame(msg) {
  window.alert(msg);

  // reset game
  makeBoard();
  clearHtmlBoard();
  currPlayer = 1;
  updateDisplay();
}

/** handleClick: handle click of column top to play piece */

function handleClick(evt) {
  // get x from ID of clicked cell
  const x = +evt.target.id;

  // get next spot in column (if none, ignore click)
  const y = findSpotForCol(x);
  if (y === null) {
    return;
  }

  // place piece in board and add to HTML table
  const newPiece = placeInTable(y, x);

  // update in-memory board
  board[y][x] = currPlayer;

  const top = evt.target.parentElement;
  top.removeEventListener('click', handleClick);
  top.classList.toggle('active');

  newPiece.addEventListener('animFinished', () => {
    // check for win
    if (checkForWin()) {
      return endGame(`Player ${currPlayer} won!`);
    }

    // check for tie
    if (board.every(row => row.every(cell => cell))) endGame('It\'s a tie!');

    // switch players
    currPlayer = currPlayer === 1 ? 2 : 1;

    // update display
    updateDisplay();

    // allow interaction again
    top.classList.toggle('active');
    top.addEventListener('click', handleClick);
  });
}

/** updateDisplay: updates GUI elements */
function updateDisplay() {
  const root = document.documentElement;
  const newColor = getComputedStyle(root).getPropertyValue(
    currPlayer === 1 ? '--custom-red' : '--custom-blue'
  )
  root.style.setProperty('--player-color', newColor);

  const boardTop = document.querySelector('#board').getBoundingClientRect().top;

  document.querySelector('#turn').innerText = `It is Player ${currPlayer}'s turn`;
}

/** checkForWin: check board cell-by-cell for "does a win start here?" */

function checkForWin() {
  function _win(cells) {
    // Check four cells to see if they're all color of current player
    //  - cells: list of four (y, x) cells
    //  - returns true if all are legal coordinates & all match currPlayer

    return cells.every(
      ([y, x]) =>
        y >= 0 &&
        y < HEIGHT &&
        x >= 0 &&
        x < WIDTH &&
        board[y][x] === currPlayer
    );
  }

  // TODO: read and understand this code. Add comments to help you.

  // start at each cell in the board
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      // for each cell, create an array starting at the coordinates for that 
      // cell and go through the next three sequential cells per direction
      const horiz = [[y, x], [y, x + 1], [y, x + 2], [y, x + 3]];
      const vert = [[y, x], [y + 1, x], [y + 2, x], [y + 3, x]];
      const diagDR = [[y, x], [y + 1, x + 1], [y + 2, x + 2], [y + 3, x + 3]];
      const diagDL = [[y, x], [y + 1, x - 1], [y + 2, x - 2], [y + 3, x - 3]];

      // if any configuration results in a win condition, return true
      if (_win(horiz) || _win(vert) || _win(diagDR) || _win(diagDL)) {
        return true;
      }
    }
  }
}

makeBoard();
makeHtmlBoard();
