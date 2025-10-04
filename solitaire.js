// Card colors and suits for checking rules
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const redSuits = ['hearts', 'diamonds'];

// Build a deck of cards
function buildDeck() {
  const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const deck = [];
  for(let suit of suits) {
    for(let val of values) {
      deck.push({value: val, suit: suit, faceUp: false});
    }
  }
  return deck;
}

// Shuffle cards (Fisher-Yates)
function shuffle(deck) {
  for(let i = deck.length-1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

// Globals for piles
let tableau = [[],[],[],[],[],[],[]]; // 7 piles
let stock = []; // draw pile
let waste = []; // waste pile
let selectedCard = null; // {pileIndex, cardIndex} (-1 for waste)
let foundations = {
  hearts: [],
  diamonds: [],
  clubs: [],
  spades: []
};

// Initialize game: deal cards to tableau and reset foundations
function initGame() {
  const deck = buildDeck();
  shuffle(deck);

  tableau = [[],[],[],[],[],[],[]];
  let cardIndex = 0;
  for(let i=0; i<7; i++) {
    for(let j=0; j<=i; j++) {
      tableau[i].push(deck[cardIndex]);
      cardIndex++;
    }
    tableau[i][i].faceUp = true; // last card in pile face up
  }

  stock = deck.slice(cardIndex);
  waste = [];

  // Reset foundations
  foundations = {
    hearts: [],
    diamonds: [],
    clubs: [],
    spades: []
  };

  selectedCard = null;

  renderTableau();
  renderStockAndWaste();
  renderFoundations();
}

// Render the tableau piles and cards
function renderTableau() {
  const container = document.getElementById('tableau');
  container.innerHTML = '';

  for(let i=0; i<7; i++) {
    const pile = tableau[i];
    const pileDiv = document.createElement('div');
    pileDiv.classList.add('pile');
    pileDiv.dataset.pileIndex = i;

    // Allow dropping cards onto this pile
    pileDiv.addEventListener('dragover', (e) => {
      e.preventDefault();
      pileDiv.classList.add('drag-over');
    });
    pileDiv.addEventListener('dragleave', (e) => {
      pileDiv.classList.remove('drag-over');
    });
    pileDiv.addEventListener('drop', (e) => {
      e.preventDefault();
      pileDiv.classList.remove('drag-over');
      const data = e.dataTransfer.getData('text/plain');
      if(!data) return;
      const from = JSON.parse(data);
      tryMove(from, {pileIndex: i});
    });

    pile.forEach((card, idx) => {
      const cardDiv = document.createElement('div');
      cardDiv.classList.add('card');
      if(!card.faceUp) {
        cardDiv.classList.add('face-down');
        cardDiv.textContent = '';
      } else {
        // Color for suits
        if(redSuits.includes(card.suit)) cardDiv.style.color = '#c72c41';
        else cardDiv.style.color = '#274316';
        cardDiv.textContent = card.value + getSuitSymbol(card.suit);
      }
      // Dark background for alternating cards for better visuals
      if(idx % 2 === 1) cardDiv.classList.add('dark');

      // Highlight if selected
      if(selectedCard && selectedCard.pileIndex === i && selectedCard.cardIndex === idx) {
        cardDiv.classList.add('selected');
      }

      // Only face-up cards are draggable
      if(card.faceUp) {
        cardDiv.setAttribute('draggable', 'true');

        // Drag start: store pile and card index
        cardDiv.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', JSON.stringify({pileIndex: i, cardIndex: idx}));
          e.dataTransfer.effectAllowed = 'move';

          // Highlight selected stack during drag
          selectedCard = {pileIndex: i, cardIndex: idx};
          renderTableau();
          renderStockAndWaste();
          renderFoundations();
        });
      } else {
        cardDiv.removeAttribute('draggable');
      }

      // Click handler on cards (only face up cards can be selected)
      cardDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!card.faceUp) return;

        if (selectedCard) {
          // If clicking the same card: deselect
          if (selectedCard.pileIndex === i && selectedCard.cardIndex === idx) {
            selectedCard = null;
            renderTableau();
            renderStockAndWaste();
            renderFoundations();
            return;
          }

          // Otherwise try to move selected cards to this pile
          tryMove(selectedCard, { pileIndex: i });
          selectedCard = null; // clear selection after trying move
          renderTableau();
          renderStockAndWaste();
          renderFoundations();

        } else {
          // No selected card, select this one
          selectedCard = { pileIndex: i, cardIndex: idx };
          renderTableau();
          renderStockAndWaste();
          renderFoundations();
        }
      });

      pileDiv.appendChild(cardDiv);
    });

    // Clicking empty pile to move selected card there
    pileDiv.addEventListener('click', () => {
      if(!selectedCard) return;
      tryMove(selectedCard, {pileIndex: i});
      selectedCard = null;
      renderTableau();
      renderStockAndWaste();
      renderFoundations();
    });

    container.appendChild(pileDiv);
  }
}

// Get Unicode symbol for suits
function getSuitSymbol(suit) {
  switch(suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
    default: return '';
  }
}

// Check if two cards are opposite colors
function isOppositeColor(card1, card2) {
  return (redSuits.includes(card1.suit) && !redSuits.includes(card2.suit))
    || (!redSuits.includes(card1.suit) && redSuits.includes(card2.suit));
}

// Card values index for ordering
const cardValueOrder = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
function cardValueIndex(value) {
  return cardValueOrder.indexOf(value);
}

// Attempt to move cards from selected to target pile (tableau or foundation)
function tryMove(from, to) {
  let fromPile, movingCards;

  // Determine cards being moved
  if (from.pileIndex === -1) {
    if (waste.length === 0) return;
    fromPile = waste;
    movingCards = [waste[waste.length - 1]];
  } else if ('pileIndex' in from) {
    fromPile = tableau[from.pileIndex];
    movingCards = fromPile.slice(from.cardIndex);
  } else {
    // Invalid 'from' info
    return;
  }
  if (movingCards.length === 0) return;

  const firstMovingCard = movingCards[0];

  // Moving to tableau pile
  if ('pileIndex' in to) {
    const toPile = tableau[to.pileIndex];
    if (toPile.length === 0) {
      if (firstMovingCard.value === 'K') {
        moveCards(from.pileIndex, from.cardIndex, to.pileIndex);
        selectedCard = null;
      } else {
        alert('Only a King can be moved to an empty pile.');
      }
    } else {
      const topCard = toPile[toPile.length - 1];
      if (
        cardValueIndex(firstMovingCard.value) === cardValueIndex(topCard.value) - 1 &&
        isOppositeColor(firstMovingCard, topCard)
      ) {
        moveCards(from.pileIndex, from.cardIndex, to.pileIndex);
        selectedCard = null;
      } else {
        alert('Cards must be placed in descending order and alternating colors.');
      }
    }

  // Moving to foundation pile
  } else if ('foundationSuit' in to) {
    const foundationPile = foundations[to.foundationSuit];
    if (firstMovingCard.suit !== to.foundationSuit) {
      alert('Cards must be moved to the foundation pile of the same suit.');
      return;
    }
    if (foundationPile.length === 0) {
      // Only Ace can be placed on empty foundation, and only one card at a time
      if (firstMovingCard.value === 'A' && movingCards.length === 1) {
        moveCards(from.pileIndex, from.cardIndex, 'foundation', to.foundationSuit);
        selectedCard = null;
      } else {
        alert('Only an Ace can be placed on an empty foundation pile.');
      }
    } else {
      // Must be ascending order by 1 and only one card at a time
      const topCard = foundationPile[foundationPile.length - 1];
      if (
        movingCards.length === 1 &&
        cardValueIndex(firstMovingCard.value) === cardValueIndex(topCard.value) + 1
      ) {
        moveCards(from.pileIndex, from.cardIndex, 'foundation', to.foundationSuit);
        selectedCard = null;
      } else {
        alert('Cards must be placed in ascending order on the foundation.');
      }
    }
  }

  renderTableau();
  renderStockAndWaste();
  renderFoundations();
}

// Move cards between piles (tableau or foundation)
function moveCards(fromPileIdx, fromCardIdx, toPileType, toPileKey) {
  let movingCards;

  if (fromPileIdx === -1) {
    // From waste, move top card only
    movingCards = waste.splice(waste.length - 1, 1);
  } else {
    movingCards = tableau[fromPileIdx].slice(fromCardIdx);
    tableau[fromPileIdx] = tableau[fromPileIdx].slice(0, fromCardIdx);
  }

  if (toPileType === 'foundation') {
    foundations[toPileKey] = foundations[toPileKey].concat(movingCards);
  } else {
    tableau[toPileType] = tableau[toPileType].concat(movingCards);
  }

  // Flip top card face up in from pile if any cards left and top card face down
  if (fromPileIdx !== -1) {
    const fromPile = tableau[fromPileIdx];
    if (fromPile.length > 0) {
      const top = fromPile[fromPile.length - 1];
      if (!top.faceUp) top.faceUp = true;
    }
  }

  renderTableau();
  renderStockAndWaste();
  renderFoundations();
}

// Render stock and waste piles
function renderStockAndWaste() {
  const stockPile = document.getElementById('stockPile');
  const wastePile = document.getElementById('wastePile');

  if(stock.length > 0) {
    stockPile.textContent = '🂠';
    stockPile.classList.remove('empty');
    stockPile.style.cursor = 'pointer';
    stockPile.style.borderColor = '#666';
  } else {
    stockPile.textContent = '';
    stockPile.classList.add('empty');
    stockPile.style.cursor = 'default';
    stockPile.style.borderColor = 'transparent';
  }

  if(waste.length > 0) {
    const topCard = waste[waste.length - 1];
    wastePile.textContent = topCard.value + getSuitSymbol(topCard.suit);
    wastePile.style.color = redSuits.includes(topCard.suit) ? '#c72c41' : '#274316';
    wastePile.classList.remove('empty');
    wastePile.style.borderColor = '#666';
    wastePile.style.cursor = 'pointer';
    wastePile.setAttribute('draggable', 'true');
  } else {
    wastePile.textContent = '';
    wastePile.classList.add('empty');
    wastePile.style.borderColor = 'transparent';
    wastePile.style.cursor = 'default';
    wastePile.removeAttribute('draggable');
  }

  // Highlight selected card in waste pile
  if(selectedCard && selectedCard.pileIndex === -1) {
    wastePile.style.borderColor = 'var(--color-highlight)';
    wastePile.style.boxShadow = '0 0 10px var(--color-highlight)';
  } else {
    wastePile.style.boxShadow = 'none';
  }
}

// Clicking stock pile draws a card to waste
document.getElementById('stockPile').addEventListener('click', () => {
  if(stock.length > 0) {
    const card = stock.shift();
    card.faceUp = true;
    waste.push(card);
    selectedCard = null;
    renderTableau();
    renderStockAndWaste();
    renderFoundations();
  } else {
    // Reset stock from waste if empty
    if(waste.length > 0) {
      stock = waste.map(c => ({...c, faceUp: false}));
      waste = [];
      selectedCard = null;
      renderTableau();
      renderStockAndWaste();
      renderFoundations();
    }
  }
});

// Drag start on waste pile top card
document.getElementById('wastePile').addEventListener('dragstart', (e) => {
  if(waste.length === 0) {
    e.preventDefault();
    return;
  }
  e.dataTransfer.setData('text/plain', JSON.stringify({pileIndex: -1}));
  e.dataTransfer.effectAllowed = 'move';
  selectedCard = {pileIndex: -1};
  renderTableau();
  renderStockAndWaste();
  renderFoundations();
});

// Render foundations piles
function renderFoundations() {
  const container = document.getElementById('foundations');
  container.innerHTML = '';

  for (let suit of suits) {
    const pile = foundations[suit];
    const pileDiv = document.createElement('div');
    pileDiv.classList.add('foundation-pile');
    pileDiv.dataset.suit = suit;

    if (pile.length === 0) {
      pileDiv.classList.add('empty');
      pileDiv.textContent = '';
    } else {
      const topCard = pile[pile.length - 1];
      pileDiv.textContent = topCard.value + getSuitSymbol(topCard.suit);
      pileDiv.style.color = redSuits.includes(topCard.suit) ? '#c72c41' : '#274316';
    }

    // Allow dropping cards on foundation
    pileDiv.addEventListener('dragover', (e) => {
      e.preventDefault();
      pileDiv.classList.add('drag-over');
    });
    pileDiv.addEventListener('dragleave', (e) => {
      pileDiv.classList.remove('drag-over');
    });
    pileDiv.addEventListener('drop', (e) => {
      e.preventDefault();
      pileDiv.classList.remove('drag-over');
      const data = e.dataTransfer.getData('text/plain');
      if(!data) return;
      const from = JSON.parse(data);
      tryMove(from, {foundationSuit: suit});
    });

    // Click on foundation pile tries to move selected card there
    pileDiv.addEventListener('click', () => {
      if (!selectedCard) return;
      tryMove(selectedCard, { foundationSuit: suit });
      selectedCard = null;
      renderTableau();
      renderStockAndWaste();
      renderFoundations();
    });

    container.appendChild(pileDiv);
  }
}


// Function to check if the user has won
function checkWinCondition() {
  const foundations = document.querySelectorAll('.foundation-pile');
  let won = true;

  // Check if all foundation piles are correctly filled
  foundations.forEach(foundation => {
    const cards = foundation.querySelectorAll('.card');
    const correctOrder = checkFoundationOrder(cards, foundation);
    if (!correctOrder) {
      won = false;
    }
  });

  if (won) {
    showWinMessage(); // Show a win message if all foundations are complete
  }
}

// Function to check if a foundation is in the correct order (ace to king)
function checkFoundationOrder(cards, foundation) {
  const correctOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const foundationCards = Array.from(cards).map(card => card.textContent); // Get card values
  return correctOrder.every((value, index) => foundationCards[index] === value);
}

// Show a message when the user wins
function showWinMessage() {
  const winMessage = document.createElement('div');
  winMessage.classList.add('win-message');
  winMessage.textContent = 'Congratulations, you won! 🎉';
  document.body.appendChild(winMessage);
  
  // Optionally, disable further moves or restart the game
}


  // THEME SWITCHER
  const themeSelector = document.getElementById('themeSelector');
  themeSelector.addEventListener('change', (e) => {
    document.body.classList.remove('theme-blue', 'theme-pink', 'theme-purple');
    const val = e.target.value;
    if(val === 'blue') document.body.classList.add('theme-blue');
    else if(val === 'pink') document.body.classList.add('theme-pink');
    else if(val === 'purple') document.body.classList.add('theme-purple');
    else {
      document.body.classList.add('theme-green');
    }
  });

// Add the following at the top to store the hint-related state
let hintActive = false;
let hintCards = [];

// Function to show the hint (find a valid move)
function showHint() {
  if (hintActive) return;  // Don't show a new hint if one is already active

  hintActive = true;
  hintCards = [];

  // Try to find a valid move
  for (let i = 0; i < tableau.length; i++) {
    const pile = tableau[i];
    for (let j = pile.length - 1; j >= 0; j--) {
      const card = pile[j];
      if (!card.faceUp) continue;

      // Try moving the card to any tableau or foundation pile
      if (canMoveToFoundation(card)) {
        hintCards.push({ pileIndex: i, cardIndex: j });
        highlightCard(i, j);  // Highlight this card
        return;
      }

      for (let k = 0; k < tableau.length; k++) {
        if (i === k) continue;  // Skip same pile
        const targetPile = tableau[k];
        const topCard = targetPile[targetPile.length - 1];

        // Check if the move is valid (opposite color and descending order)
        if (canMoveToTableau(card, topCard)) {
          hintCards.push({ pileIndex: i, cardIndex: j });
          highlightCard(i, j);  // Highlight this card
          return;
        }
      }
    }
  }

  // If no valid move, show an alert
  if (hintCards.length === 0) {
    alert('No more valid moves! Try shuffling the stock.');
  }
}

// Highlight the card for the hint
function highlightCard(pileIndex, cardIndex) {
  const container = document.getElementById('tableau');
  const piles = container.children;
  const pileDiv = piles[pileIndex];
  const cardDiv = pileDiv.children[cardIndex];

  cardDiv.classList.add('hint-highlight'); // Add a class to highlight the card

  // Remove the highlight after a short delay
  setTimeout(() => {
    cardDiv.classList.remove('hint-highlight');
    hintActive = false;
  }, 2000);
}

// Check if card can move to a foundation
function canMoveToFoundation(card) {
  const foundationPile = foundations[card.suit];
  if (foundationPile.length === 0 && card.value === 'A') return true;  // Ace goes to empty pile
  if (foundationPile.length > 0) {
    const topCard = foundationPile[foundationPile.length - 1];
    return cardValueIndex(card.value) === cardValueIndex(topCard.value) + 1;  // Ascending order
  }
  return false;
}

// Check if card can move to another tableau
function canMoveToTableau(card, topCard) {
  if (!topCard) return true;  // If the pile is empty
  return isOppositeColor(card, topCard) && cardValueIndex(card.value) === cardValueIndex(topCard.value) - 1;
}

// Add an event listener for the hint button
document.getElementById('hintBtn').addEventListener('click', showHint);

  // HELP MODAL
  const helpBtn = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const closeHelp = document.getElementById('closeHelp');

  helpBtn.addEventListener('click', () => {
    helpModal.style.display = 'block';
    helpModal.focus();
  });
  closeHelp.addEventListener('click', () => {
    helpModal.style.display = 'none';
    helpBtn.focus();
  });
  // Close help modal on Escape key
  window.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && helpModal.style.display === 'block') {
      helpModal.style.display = 'none';
      helpBtn.focus();
    }
  });

 // Function to save the game state to localStorage
function saveGameState() {
  const gameState = {
    tableau: tableau,
    stock: stock,
    waste: waste,
    foundations: foundations,
    selectedCard: selectedCard,
  };

  localStorage.setItem('solitaireGameState', JSON.stringify(gameState));
}

// Function to load the game state from localStorage
function loadGameState() {
  const savedState = localStorage.getItem('solitaireGameState');
  if (savedState) {
    const gameState = JSON.parse(savedState);
    tableau = gameState.tableau;
    stock = gameState.stock;
    waste = gameState.waste;
    foundations = gameState.foundations;
    selectedCard = gameState.selectedCard;
    renderTableau();
    renderStockAndWaste();
    renderFoundations();
  } else {
    initGame(); // If no saved state, start a new game
  }
}

document.getElementById('backLobbyBtn').addEventListener('click', () => {
  // Replace with your lobby URL or logic
  window.location.href = '../game.html'; // or '/' or whatever your lobby URL is
});

// On page load start game
// Initialize the game on load
window.onload = () => {
  loadGameState(); // Load saved state or start a new game
};
