// Card colors and suits for checking rules
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const redSuits = ['hearts', 'diamonds'];

// Build a deck of cards
function buildDeck() {
  const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const deck = [];
  for (let suit of suits) {
    for (let val of values) {
      deck.push({
        value: val,
        suit: suit,
        faceUp: false,
        color: redSuits.includes(suit) ? 'red' : 'black'
      });
    }
  }
  return deck;
}

// Shuffle cards (Fisher-Yates)
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
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
  return (redSuits.includes(card1.suit) && !redSuits.includes(card2.suit)) ||
         (!redSuits.includes(card1.suit) && redSuits.includes(card2.suit));
}

// Card values index for ordering
const cardValueOrder = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
function cardValueIndex(value) {
  return cardValueOrder.indexOf(value);
}
