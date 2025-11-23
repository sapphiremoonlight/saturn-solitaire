function render() {
  renderTableau();
  renderFoundations();
  renderStockWaste();
}

// Render tableau piles
function renderTableau() {
  const container = document.getElementById("tableau");
  container.innerHTML = "";

  tableau.forEach((pile) => {
    const pileDiv = document.createElement("div");
    pileDiv.className = "pile";

    // Empty pile outline
    if (pile.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.classList.add("empty-pile");
      pileDiv.appendChild(emptyDiv);
    }

    pile.forEach((card, index) => {
      const cardDiv = createCardElement(card);
      cardDiv.style.top = index * 22 + "px";

      // faintly show values of face-up cards not on top
      if (card.faceUp && index < pile.length - 1) {
        const hintDiv = document.createElement("div");
        hintDiv.classList.add("card-hint");
        hintDiv.textContent = card.value;
        cardDiv.appendChild(hintDiv);
      }

      // Click + drag
      cardDiv.onclick = (e) => handleCardClick(card, pile);
      cardDiv.draggable = card.faceUp; 
      cardDiv.addEventListener("dragstart", (e) => {
        selectedCard = card;
        selectedSource = pile;
        highlightCard(card);
      });

      pileDiv.appendChild(cardDiv);
      card.element = cardDiv;
    });

    // Drop area for dragged cards
    pileDiv.ondragover = (e) => e.preventDefault();
    pileDiv.ondrop = (e) => {
      if (selectedCard) tryMove(selectedCard, pile);
    };

    // Clicking empty pile space tries a move
    pileDiv.onclick = (e) => {
      if (e.target === pileDiv) tryMove(null, pile);
    };

    container.appendChild(pileDiv);
  });
}

// Render foundations
function renderFoundations() {
  const container = document.getElementById("foundations");
  container.innerHTML = "";

  Object.keys(foundations).forEach((suit) => {
    const pile = foundations[suit];
    const pileDiv = document.createElement("div");
    pileDiv.className = "foundation-pile";
    pileDiv.dataset.suit = suit;

    if (pile.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.classList.add("empty-pile");
      pileDiv.appendChild(emptyDiv);
    } else {
      const topCard = pile[pile.length - 1];
      const cardDiv = createCardElement(topCard);

      cardDiv.onclick = () => handleCardClick(topCard, suit);
      cardDiv.draggable = true;
      cardDiv.addEventListener("dragstart", (e) => {
        selectedCard = topCard;
        selectedSource = suit;
        highlightCard(topCard);
      });

      pileDiv.appendChild(cardDiv);
      topCard.element = cardDiv;
    }

    // Drop on foundation
    pileDiv.ondragover = (e) => e.preventDefault();
    pileDiv.ondrop = (e) => {
      if (selectedCard) tryMove(selectedCard, { foundationSuit: suit });
    };

    container.appendChild(pileDiv);
  });
}

// Render stock + waste
function renderStockWaste() {
  const stockDiv = document.getElementById("stockPile");
  const wasteDiv = document.getElementById("wastePile");

  stockDiv.onclick = drawFromStock;
  stockDiv.textContent = stock.length ? "🂠" : "";

  wasteDiv.innerHTML = "";
  const topCard = waste[waste.length - 1];
  if (topCard) {
    const cardDiv = createCardElement(topCard);

    // Click + drag
    cardDiv.onclick = (e) => handleCardClick(topCard, "waste");
    cardDiv.draggable = true;
    cardDiv.addEventListener("dragstart", (e) => {
      selectedCard = topCard;
      selectedSource = "waste";
      highlightCard(topCard);
    });

    wasteDiv.appendChild(cardDiv);
    topCard.element = cardDiv;
  }
}

// Create card element with pop-up hover
function createCardElement(card) {
  const div = document.createElement("div");
  div.className = "card " + (card.faceUp ? "front" : "back");

  if (card.faceUp) {
    div.textContent = card.value + getSuitSymbol(card.suit);
    if (redSuits.includes(card.suit)) div.style.color = "#c72c41";
    else div.style.color = "#274316";
  }

  div.addEventListener("mouseenter", () => {
    div.style.transform = "translateY(-10px) scale(1.05)";
    div.style.zIndex = 10;
  });
  div.addEventListener("mouseleave", () => {
    div.style.transform = "";
    div.style.zIndex = "";
  });

  return div;
}

// Theme selector
document.getElementById("themeSelector").onchange = function () {
  document.body.setAttribute("data-theme", this.value);
};

// Help modal
const helpModal = document.getElementById("helpModal");
document.getElementById("helpBtn").onclick = () =>
  (helpModal.style.display = "block");
document.getElementById("closeHelp").onclick = () =>
  (helpModal.style.display = "none");
