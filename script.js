const board = document.getElementById("chessboard");
const hintBox = document.getElementById("hint");

const initialPosition = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  [" ", " ", " ", " ", " ", " ", " ", " "],
  [" ", " ", " ", " ", " ", " ", " ", " "],
  [" ", " ", " ", " ", " ", " ", " ", " "],
  [" ", " ", " ", " ", " ", " ", " ", " "],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
];

const pieces = {
  r: "images/bR.svg",
  n: "images/bN.svg",
  b: "images/bB.svg",
  q: "images/bQ.svg",
  k: "images/bK.svg",
  p: "images/bP.svg",
  R: "images/wR.svg",
  N: "images/wN.svg",
  B: "images/wB.svg",
  Q: "images/wQ.svg",
  K: "images/wK.svg",
  P: "images/wP.svg",
};

const squares = [];

let turn = "white"; // 🟢 Trắng đi trước
let selectedSquare = null;
let validMoves = [];

for (let row = 0; row < 8; row++) {
  for (let col = 0; col < 8; col++) {
    const square = document.createElement("div");
    square.classList.add("square");
    square.dataset.row = row;
    square.dataset.col = col;
    if ((row + col) % 2 === 0) {
      square.classList.add("white");
    } else {
      square.classList.add("black");
    }
    const piece = initialPosition[row][col];
    if (piece !== " ") {
      square.innerHTML = `<img class="piece" src="${pieces[piece]}" alt="${piece}">`;
    }
    board.appendChild(square);
    squares.push(square);
  }
}

squares.forEach((square) => {
  square.addEventListener("click", () => {
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);

    if (selectedSquare) {
      if (square === selectedSquare) {
        clearSelection();
      } else if (
        validMoves.some((move) => move.row === row && move.col === col)
      ) {
        square.innerHTML = selectedSquare.innerHTML;
        selectedSquare.innerHTML = "";
        clearSelection();
        turn = turn === "white" ? "black" : "white"; // 🔥 Đổi lượt sau khi di chuyển
        // hintBox.textContent = ` ${turn === "white" ? "Trắng" : "Đen"}`;
      } else {
        clearSelection();
      }
    } else {
      if (square.querySelector(".piece")) {
        const pieceImg = square.querySelector(".piece");
        if (!pieceImg) return false;
        const pieceType = getPieceType(pieceImg);
        if (!pieceType) return false;

        const isWhitePiece = pieceType === pieceType.toUpperCase();

        // 🛑 Kiểm tra đúng lượt thì mới cho chọn
        // ✅ Kiểm tra đúng lượt và quân có cứu được vua không
        if (
          (turn === "white" && isWhitePiece) ||
          (turn === "black" && !isWhitePiece)
        ) {
          const tempValidMoves = getValidMoves(row, col, pieceType);

          if (isKingInCheck(turn === "white")) {
            // Nếu đang bị chiếu, chỉ cho phép quân cứu vua
            const canSave = tempValidMoves.some((move) => {
              const fromSquare = square;
              const toSquare = getSquare(move.row, move.col);

              const backupPiece = toSquare.innerHTML;
              toSquare.innerHTML = fromSquare.innerHTML;
              fromSquare.innerHTML = "";

              const kingSafe = !isKingInCheck(turn === "white");

              fromSquare.innerHTML = toSquare.innerHTML;
              toSquare.innerHTML = backupPiece;

              return kingSafe;
            });

            if (!canSave) {
              hintBox.textContent = "";
              return;
            }
          }

          // Nếu qua được hết kiểm tra
          selectedSquare = square;
          selectedSquare.classList.add("selected");
          validMoves = tempValidMoves;
          highlightValidMoves(pieceType);
          showHint(row, col, pieceType);
        } else {
          hintBox.textContent = ` ${turn === "white" ? "Trắng" : "Đen"}`;
        }
      }
    }
  });
});

function getPieceTypeFromImage(square) {
  const img = square.querySelector(".piece");
  if (!img) return null;
  const src = img.getAttribute("src");
  for (let key in pieces) {
    if (src.includes(pieces[key])) return key;
    if (src.endsWith(pieces[key].split("/").pop())) return key; // Dự phòng nếu chỉ tên file
  }
  return null;
}

function getPieceType(imgElement) {
  if (!imgElement || !imgElement.src) return null;
  const filename = imgElement.src.split("/").pop(); // Lấy tên file như "wP.svg"
  for (let key in pieces) {
    if (pieces[key].endsWith(filename)) return key;
  }
  return null;
}

function getValidMoves(row, col, piece) {
  const moves = [];
  const isWhite = piece === piece.toUpperCase();

  function addMove(r, c) {
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      moves.push({ row: r, col: c });
    }
  }

  function traverse(r, c, dr, dc) {
    r += dr;
    c += dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      if (isEmpty(r, c)) {
        addMove(r, c);
      } else {
        if (isEnemy(r, c, isWhite)) addMove(r, c);
        break;
      }
      r += dr;
      c += dc;
    }
  }

  if (piece.toLowerCase() === "p") {
    const dir = isWhite ? -1 : 1;
    if (isEmpty(row + dir, col)) addMove(row + dir, col);
    if ((isWhite && row === 6) || (!isWhite && row === 1)) {
      if (isEmpty(row + dir, col) && isEmpty(row + dir * 2, col)) {
        addMove(row + dir * 2, col);
      }
    }
    if (isEnemy(row + dir, col - 1, isWhite)) addMove(row + dir, col - 1);
    if (isEnemy(row + dir, col + 1, isWhite)) addMove(row + dir, col + 1);
  }

  if (piece.toLowerCase() === "n") {
    const knightMoves = [
      [2, 1],
      [1, 2],
      [-1, 2],
      [-2, 1],
      [-2, -1],
      [-1, -2],
      [1, -2],
      [2, -1],
    ];
    knightMoves.forEach(([dr, dc]) => {
      if (isEmptyOrEnemy(row + dr, col + dc, isWhite))
        addMove(row + dr, col + dc);
    });
  }

  if (piece.toLowerCase() === "b") {
    [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].forEach(([dr, dc]) => {
      traverse(row, col, dr, dc);
    });
  }

  if (piece.toLowerCase() === "r") {
    [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].forEach(([dr, dc]) => {
      traverse(row, col, dr, dc);
    });
  }

  if (piece.toLowerCase() === "q") {
    [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].forEach(([dr, dc]) => {
      traverse(row, col, dr, dc);
    });
  }

  if (piece.toLowerCase() === "k") {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr !== 0 || dc !== 0) {
          if (isEmptyOrEnemy(row + dr, col + dc, isWhite))
            addMove(row + dr, col + dc);
        }
      }
    }
  }

  return moves;
}

function isEmpty(r, c) {
  const square = getSquare(r, c);
  return square && !square.querySelector(".piece");
}

function isEnemy(r, c, isWhite) {
  const square = getSquare(r, c);
  if (!square) return false;
  const pieceType = getPieceTypeFromImage(square);
  if (!pieceType) return false;
  return (
    (isWhite && pieceType === pieceType.toLowerCase()) ||
    (!isWhite && pieceType === pieceType.toUpperCase())
  );
}

function isEmptyOrEnemy(r, c, isWhite) {
  return isEmpty(r, c) || isEnemy(r, c, isWhite);
}

function getSquare(r, c) {
  return squares.find(
    (sq) => parseInt(sq.dataset.row) === r && parseInt(sq.dataset.col) === c
  );
}

function clearSelection() {
  if (selectedSquare) selectedSquare.classList.remove("selected");
  squares.forEach((sq) => {
    sq.classList.remove("valid-move");
    sq.classList.remove("capture-move");
  });
  selectedSquare = null;
  validMoves = [];
  hintBox.textContent = ` ${turn === "white" ? "Trắng" : "Đen"}`;
}

function highlightValidMoves(pieceType) {
  const isWhite = pieceType === pieceType.toUpperCase();
  validMoves.forEach((move) => {
    const sq = getSquare(move.row, move.col);
    if (isEnemy(move.row, move.col, isWhite)) {
      sq.classList.add("capture-move");
    } else {
      sq.classList.add("valid-move");
    }
  });
}

function showHint(row, col, pieceType) {
  const isWhite = pieceType === pieceType.toUpperCase();

  if (isKingInCheck(isWhite)) {
    highlightCheckedKing(isWhite);

    const canMove = canAnyMoveSaveKing(isWhite);
    if (!canMove) {
      hintBox.textContent = "DEAFEAT";
    }
    return;
  } else {
    squares.forEach((square) => {
      square.classList.remove("checked-king"); // Nếu hết chiếu thì xóa viền đỏ
    });
  }

  if (validMoves.length === 0) {
    hintBox.textContent = "Không có nước đi hợp lệ";
    return;
  }

  const captureMoves = validMoves.filter((move) => {
    return isEnemy(move.row, move.col, isWhite);
  });

  if (captureMoves.length > 0) {
    const best = captureMoves[0];
    hintBox.textContent = ` (${best.row + 1}, ${String.fromCharCode(
      97 + best.col
    )})`;
  } else {
    const randomMove =
      validMoves[Math.floor(Math.random() * validMoves.length)];
    hintBox.textContent = ` (${randomMove.row + 1}, ${String.fromCharCode(
      97 + randomMove.col
    )})`;
  }
}

function isKingInCheck(isWhite) {
  let kingRow = -1;
  let kingCol = -1;

  // Tìm vị trí vua
  squares.forEach((square) => {
    const pieceType = getPieceTypeFromImage(square);
    if (pieceType === (isWhite ? "K" : "k")) {
      kingRow = parseInt(square.dataset.row);
      kingCol = parseInt(square.dataset.col);
    }
  });

  if (kingRow === -1 || kingCol === -1) return false;

  for (let sq of squares) {
    const type = getPieceTypeFromImage(sq);
    if (!type) continue;
    const enemyIsWhite = type === type.toUpperCase();
    if (enemyIsWhite !== isWhite) {
      const enemyMoves = getValidMoves(
        parseInt(sq.dataset.row),
        parseInt(sq.dataset.col),
        type
      );
      if (enemyMoves.some((m) => m.row === kingRow && m.col === kingCol)) {
        return true;
      }
    }
  }
  return false;
}

function highlightCheckedKing(isWhite) {
  squares.forEach((square) => {
    square.classList.remove("checked-king");
  });

  let kingSquare = null;
  squares.forEach((square) => {
    const type = getPieceTypeFromImage(square);
    if (type === (isWhite ? "K" : "k")) {
      kingSquare = square;
    }
  });

  if (kingSquare) {
    kingSquare.classList.add("checked-king");
  }
}
