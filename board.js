import testExample from "./testExample.js";

const n_by_n = 4;
const container_size = n_by_n * n_by_n;
const empty = 0;
const undeclared = -1;

// const debug = true;
const debug = false;


const Direction = {
  linear: 0,
  right: 1,
  left: -1,
  up: -n_by_n,
  down: n_by_n,
};

const gameState = {
  hasAnythingMoved: false,
  hasGameEnded: false
}

function convertToCoordinates(cell) {
  return [cell % n_by_n, Math.floor(cell / n_by_n)]
}

function getColorFromValue(value) {
  const max = 14;
  const scale = (max - Math.log2(value)) / max;

  const lightness = 90 * scale ;
  const saturation = 30 * scale

  return `hsl(240, ${70 + saturation}%, ${lightness}%)`;
}

function Tile(value, cellIndex, additionalClass) {
  const container = document.querySelector(".tile-container");
  this.dom = document.querySelector(".tile-template").cloneNode(true);
  this.dom.classList.remove("tile-template");
  this.dom.classList.add(additionalClass);
  container.appendChild(this.dom);


  this.dom.style.backgroundColor = getColorFromValue(value);
  this.dom.innerHTML = value;
  this.setCoordinates(cellIndex);
  this.destination = undeclared;
  this.setCellNumber(cellIndex);
  this.value = value;

  return this;
}

Tile.prototype.setCellNumber = function(cellIndex) {
  this.cell_no = cellIndex;
  this.destination = undeclared;
}

Tile.prototype.setCoordinates = function(cellIndex) {
  const [x, y] = convertToCoordinates(cellIndex);

  this.dom.style.setProperty('--x-pos', `${x}`)
  this.dom.style.setProperty('--y-pos', `${y}`)
}

Tile.prototype.disappear = function() {
  this.dom.remove();
}

Tile.prototype.animate = function() {
  if(this.destination === undeclared) return;

  this.setCoordinates(this.destination);
}

let board_internal 

if(debug) {
  board_internal = Array.from(testExample.initialState);
}
else {
  board_internal = new Array(container_size).fill(empty);
}

const board_state = new Array(container_size)
  .fill()
  .map((_, cell_no) => {
    const value = board_internal[cell_no];

    const tile = (value !== empty)? new Tile(value, cell_no): null;
    
    return {
      isMerged: false,
      tile
    };
  });


const direction_condtions = new Map();
direction_condtions.set(Direction.up, (currentIndex) => ((currentIndex - n_by_n) >= 0))
direction_condtions.set(Direction.down, (currentIndex) => ((currentIndex + n_by_n) < container_size ))
direction_condtions.set(Direction.left, (currentIndex) => ((currentIndex % n_by_n) !== 0))
direction_condtions.set(Direction.right, (currentIndex) => ((currentIndex % n_by_n) !== (n_by_n - 1)))


function findDestinationCell(selectedIndex, direction) {
  const isInBoundary = direction_condtions.get(direction);

  if(!isInBoundary(selectedIndex)) return selectedIndex;

  let currentIndex = selectedIndex + direction;
  
  while(isInBoundary(currentIndex)) {
    if(board_internal[currentIndex] !== empty) break; 
    currentIndex += direction;
  }

  return currentIndex;
}


const mapIndices = new Map();

mapIndices.set(Direction.linear, (index) => index)
mapIndices.set(Direction.up, mapIndices.get(Direction.linear)); 
mapIndices.set(Direction.down, (index) => container_size - index - 1)
mapIndices.set(Direction.left, (index) => ((index % n_by_n) * n_by_n + Math.floor(index / n_by_n)))
mapIndices.set(Direction.right, (index) => (container_size - mapIndices.get(Direction.left)(index) - 1));

function iterateInDirection(direction, callBack) {
  for(let i = 0; i < container_size; i++) {
    callBack(mapIndices.get(direction)(i));
  }
}

function updateBoardState(direction) {
  iterateInDirection(direction, (mappedIndex) => {
    const mappedVal = board_internal[mappedIndex];

    if(mappedVal === empty) return;

    let destinationIndex = findDestinationCell(mappedIndex, direction);
    let destVal = board_internal[destinationIndex];

    const isAlreadyMerged = board_state[destinationIndex].isMerged
    destinationIndex -= ((mappedVal !== destVal && destVal !== empty) || isAlreadyMerged)? direction: 0;
    destVal = board_internal[destinationIndex];

    if(destinationIndex !== mappedIndex) gameState.hasAnythingMoved = true;

    board_internal[mappedIndex] = empty;
    board_internal[destinationIndex] += mappedVal;

    board_state[mappedIndex].tile.destination = destinationIndex;
    board_state[destinationIndex].isMerged = destinationIndex !== mappedIndex && mappedVal === destVal;
  });
}

function renderOnTheScreen() {
  board_state.forEach((cell) => cell.tile?.animate());

  return new Promise((resolve) => setTimeout(() => resolve(), 600));
}

function getMergingTiles() {

  const allMergingTiles = [];

  iterateInDirection(Direction.linear, (index) => {
    const homeCell = board_state[index];
    if(!homeCell.isMerged) return; 
    const cells = board_state.filter((cell) => cell.tile?.destination === index);

    cells.forEach((cell) => {
      cell.tile.disappear();
      allMergingTiles.push(cell.tile);
      cell.tile = null;
    })
    
    homeCell.isMerged = false;
  });

  return allMergingTiles;
}

function moveTheTiles(direction) {
  iterateInDirection(direction, (mappedIndex) => {
    const homeCell = board_state[mappedIndex];

    if(homeCell.tile === null) return;

    const destinationCell = board_state[homeCell.tile.destination];
    const selfReferential = homeCell.tile.destination === homeCell.tile.cell_no;

    destinationCell.tile = homeCell.tile;
    destinationCell.tile.setCellNumber(homeCell.tile.destination);

    homeCell.tile = selfReferential? homeCell.tile: null;
  });
}

function iterateTwoValues(array, callBack) {
  if(array.length % 2 !== 0 && array.length !== 0) return;

  for(let i = 0; i < array.length; i += 2) {
    callBack(array[i], array[i + 1]);
  }
}

function mergeTheTiles(tiles) {
  iterateTwoValues(tiles, (firstTile, SecondTile) => {
    const newTileValue = firstTile.value + SecondTile.value;
    const newCellNumber = firstTile.destination;

    const newTile = new Tile(newTileValue, newCellNumber, "merge-animation");

    board_state[newCellNumber].tile = newTile;
  });
}


function getRandomNumber(n) {
  return Math.floor(Math.random() * (n + 1));
}

function generateRandomTile() {
  const values = [2, 2, 2, 4];

  while(true) {
    let randomIndex = getRandomNumber(container_size - 1);

    if(board_internal[randomIndex] === empty) {
      const randomValue = values[randomIndex % values.length];
      board_internal[randomIndex] = randomValue;
      board_state[randomIndex].tile = new Tile(randomValue, randomIndex, "show-animation")
      break;
    }
  }
}

function checkIntegrity(when) {
  for(let i = 0; i < container_size; i++) {
    if(board_state[i].tile === null) continue;

    if(board_state[i].tile.value !== board_internal[i]){
      console.log(board_internal)
      console.log(when, board_state);
      console.log(when, " didn't match at ", i);
    }
  }

  return true;
}

function updateGameStatus() {

  const anyAdjacentTiles = (value, cellIndex) => {

    const predicate = (direction) => board_internal[cellIndex + direction] === value

    const [x, y] = [cellIndex % n_by_n, Math.floor(cellIndex / n_by_n)];

    if(x !== 0 && predicate(Direction.left)) return true; 

    if(y !== 0 && predicate(Direction.up)) return true; 

    if(x !== 3 && predicate(Direction.right)) return true; 
  
    return predicate(Direction.down);
  }

  for(let i = 0; i < container_size; i++) {
    if(board_internal[i] === empty || anyAdjacentTiles(board_internal[i], i)) {
      gameState.hasGameEnded = false;
      return;
    } 
  }

  gameState.hasGameEnded = true;

 
}

async function testing(direction) {

  if(gameState.hasGameEnded) {
    console.log("game ended.");
    alert("Game ended... you lose.");
    return;
  }

  checkIntegrity("before")

  updateBoardState(direction);
  await renderOnTheScreen(direction);

  const mergingTiles = getMergingTiles();
  moveTheTiles(direction);
  mergeTheTiles(mergingTiles);

  updateGameStatus();
  // console.log({gameState});

  checkIntegrity("before, generating tile")



  if(!debug && !gameState.hasGameEnded && gameState.hasAnythingMoved) generateRandomTile();

  gameState.hasAnythingMoved = false;

  checkIntegrity("after, generating tile")
}

let isTestingRunning = false;

function throttleTesting(direction) {
  if (!isTestingRunning) {
    isTestingRunning = true;
    testing(direction)
    setTimeout(() => {
      isTestingRunning = false;
    }, 700); 
  } 
}


function handleKeyDown(event) {
  switch (event.key) {
    case 'ArrowUp':
      throttleTesting(Direction.up);
      break;
    case 'ArrowDown':
      throttleTesting(Direction.down);
      break;
    case 'ArrowLeft':
      throttleTesting(Direction.left);
      break;
    case 'ArrowRight':
      throttleTesting(Direction.right);
      break;
  }
}

if(!debug) {
  generateRandomTile();
  generateRandomTile();
}

document.addEventListener('keydown', handleKeyDown);
