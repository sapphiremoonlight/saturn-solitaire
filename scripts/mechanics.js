// Card selection state
let selectedCard = null;
let selectedSource = null;

// Handle card click
function handleCardClick(card, source) {
  if (!card.faceUp) return;

  if (!selectedCard) {
    // First click selects the card
    selectedCard = card;
    selectedSource = source;
    highlightCard(card);
    return;
  }

  // Clicking same card deselects
  if (selectedCard === card) {
    clearSelection();
    return;
  }

  // Determine destination for tryMove
  let destination = source;
  // If source is a string, it's a foundation
  if (typeof source === "string") destination = { foundationSuit: source };

  tryMove(selectedCard, destination);
}

// Undo / Redo stacks
let undoStack = [];
let redoStack = [];

function snapshotGame() {
  undoStack.push(JSON.stringify({
    tableau, stock, waste, foundations, selectedCard
  }));
  redoStack = [];
}

// Undo / Redo buttons
document.getElementById('undoBtn').addEventListener('click', () => {
  if (undoStack.length === 0) return;
  redoStack.push(JSON.stringify({
    tableau, stock, waste, foundations, selectedCard
  }));
  const prev = JSON.parse(undoStack.pop());
  tableau = prev.tableau;
  stock = prev.stock;
  waste = prev.waste;
  foundations = prev.foundations;
  selectedCard = prev.selectedCard;
  render();
});

document.getElementById('redoBtn').addEventListener('click', () => {
  if (redoStack.length === 0) return;
  undoStack.push(JSON.stringify({
    tableau, stock, waste, foundations, selectedCard
  }));
  const next = JSON.parse(redoStack.pop());
  tableau = next.tableau;
  stock = next.stock;
  waste = next.waste;
  foundations = next.foundations;
  selectedCard = next.selectedCard;
  render();
});

// Try to move selected card
function tryMove(card, dest) {
  if (!selectedCard) return false;
  const movingCards = getMovingStack(selectedCard, selectedSource);
  let success = false;

  if (dest && typeof dest === "object" && dest.foundationSuit) {
    success = moveToFoundation(movingCards, dest.foundationSuit);
  } else if (Array.isArray(dest)) {
    success = moveToTableau(movingCards, dest);
  }

  if (success) {
    snapshotGame(); // store new state for undo
    clearSelection();
    render();
  } else {
    shakeSelection();
  }
}

// Stack of cards for tableau moves
function getMovingStack(card, sourcePile) {
  if (!Array.isArray(sourcePile)) return [card];
  const index = sourcePile.indexOf(card);
  return sourcePile.slice(index);
}

// Foundation move
function moveToFoundation(cards, suit) {
  if (cards.length !== 1) return false;
  const card = cards[0];
  const pile = foundations[suit];

  if (
    (pile.length === 0 && card.value === "A") ||
    (pile.length > 0 &&
      pile[pile.length - 1].suit === card.suit &&
      cardValueIndex(card.value) === cardValueIndex(pile[pile.length - 1].value) + 1)
  ) {
    removeCards(cards, selectedSource);
    pile.push(card);
    return true;
  }
  return false;
}

// Tableau move
function moveToTableau(cards, destPile) {
  if (!Array.isArray(destPile)) return false;
  const card = cards[0];
  const last = destPile[destPile.length - 1];

  if (
    (destPile.length === 0 && card.value === "K") ||
    (last && isOppositeColor(last, card) &&
      cardValueIndex(card.value) === cardValueIndex(last.value) - 1)
  ) {
    removeCards(cards, selectedSource);
    destPile.push(...cards);
    return true;
  }
  return false;
}

// Remove cards from source
function removeCards(cards, source) {
  if (source === "waste") {
    waste.pop();
    return;
  }

  const index = source.indexOf(cards[0]);
  source.splice(index, cards.length);

  const last = source[source.length - 1];
  if (last && !last.faceUp) last.faceUp = true;
}

// Stock → waste
function drawFromStock() {
  if (stock.length === 0) {
    stock = waste.reverse();
    waste = [];
    stock.forEach(c => (c.faceUp = false));
    render();
    return;
  }

  const card = stock.pop();
  card.faceUp = true;
  waste.push(card);
  render();
}

// Visual helpers
function highlightCard(card) {
  card.element.classList.add("selected");
}
function clearSelection() {
  if (selectedCard && selectedCard.element)
    selectedCard.element.classList.remove("selected");
  selectedCard = null;
  selectedSource = null;
}
function shakeSelection() {
  if (!selectedCard || !selectedCard.element) return;
  const el = selectedCard.element;
  el.classList.add("shake");
  setTimeout(() => el.classList.remove("shake"), 300);
}
