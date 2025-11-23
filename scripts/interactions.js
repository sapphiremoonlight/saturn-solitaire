// Hint button logic
document.getElementById("hintBtn").onclick = function () {
  const hint = getHint();
  if (hint && hint.card.element) {
    hint.card.element.classList.add("hint");
    setTimeout(() => hint.card.element.classList.remove("hint"), 1000);
  }
};

// Simple hint system: find any legal move
function getHint() {
  // Tableau → foundation / tableau → tableau
  for (let pile of tableau) {
    for (let card of pile) {
      if (!card.faceUp) continue;
      const moving = getMovingStack(card, pile);

      for (let suit in foundations) {
        if (moveToFoundationPreview(moving, suit)) return { card };
      }

      for (let dest of tableau) {
        if (dest !== pile && moveToTableauPreview(moving, dest)) return { card };
      }
    }
  }

  // Waste → foundation / waste → tableau
  const topWaste = waste[waste.length - 1];
  if (topWaste) {
    const moving = [topWaste];

    for (let suit in foundations) {
      if (moveToFoundationPreview(moving, suit)) return { card: topWaste };
    }

    for (let dest of tableau) {
      if (moveToTableauPreview(moving, dest)) return { card: topWaste };
    }
  }

  return null;
}

// Preview versions of move rules (do not modify state)
function moveToFoundationPreview(cards, dest) {
  if (cards.length !== 1) return false;
  const card = cards[0];
  const pile = foundations[dest];

  if (pile.length === 0 && card.value === 'A') return true;
  if (pile.length > 0 &&
      pile[pile.length - 1].suit === card.suit &&
      cardValueIndex(card.value) === cardValueIndex(pile[pile.length - 1].value) + 1) return true;

  return false;
}

function moveToTableauPreview(cards, destPile) {
  const card = cards[0];
  const last = destPile[destPile.length - 1];

  if (destPile.length === 0 && card.value === 'K') return true;
  if (last && isOppositeColor(card, last) &&
      cardValueIndex(card.value) === cardValueIndex(last.value) - 1) return true;

  return false;
}

// Restart button
document.getElementById("restartBtn").onclick = () => initGame();

// Back to lobby
document.getElementById("backLobbyBtn").onclick = () => {
  window.location.href = "../lobby.html";
};

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === " ") drawFromStock();
  if (e.key === "h") document.getElementById("hintBtn").click();
});

// Start game when loaded
window.onload = () => initGame();
