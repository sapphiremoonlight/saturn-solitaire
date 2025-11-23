// Game state
let tableau = [[], [], [], [], [], [], []];   // 7 piles
let foundations = {
  hearts: [],
  diamonds: [],
  clubs: [],
  spades: []
};
let stock = [];
let waste = [];

// Initialize a new game
function initGame() {
  const deck = buildDeck();
  shuffle(deck);

  // Deal to tableau
  tableau = [[], [], [], [], [], [], []];
  let deckIndex = 0;
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j <= i; j++) {
      const card = deck[deckIndex++];
      tableau[i].push(card);
      if (j === i) card.faceUp = true; // top card face up
    }
  }

  // Remaining to stock
  stock = deck.slice(deckIndex);
  stock.forEach(c => c.faceUp = false);

  // Reset foundations & waste
  foundations = {
    hearts: [], diamonds: [], clubs: [], spades: []
  };
  waste = [];

  // Initial render
  render();
}
