import type { Meta, StoryObj } from '@storybook/react';
import { Chess, Color, PieceSymbol, Square } from 'chess.js';
import { useCallback, useEffect, useRef, useState } from 'react';

import defaultMeta from './Default.stories.js';
import {
  Chessboard,
  ChessboardProvider,
  defaultPieces,
  generateCursorFromElement,
  generateCursorFromMarkup,
  PieceDropHandlerArgs,
  SparePiece,
} from '../../../src/index.js';

const meta: Meta<typeof Chessboard> = {
  ...defaultMeta,
  title: 'stories/SelectableSparePieces',
} satisfies Meta<typeof Chessboard>;

export default meta;

type Story = StoryObj<typeof meta>;

const BLACK_PIECE_TYPES = Object.keys(defaultPieces).filter(
  (pt) => pt[0] === 'b',
);
const WHITE_PIECE_TYPES = Object.keys(defaultPieces).filter(
  (pt) => pt[0] === 'w',
);

const DELETE_SVG_MARKUP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M 10 2 L 9 3 L 3 3 L 3 5 L 4.109375 5 L 5.8925781 20.255859 L 5.8925781 20.263672 C 6.023602 21.250335 6.8803207 22 7.875 22 L 16.123047 22 C 17.117726 22 17.974445 21.250322 18.105469 20.263672 L 18.107422 20.255859 L 19.890625 5 L 21 5 L 21 3 L 15 3 L 14 2 L 10 2 z M 6.125 5 L 17.875 5 L 16.123047 20 L 7.875 20 L 6.125 5 z" fill="#dc3545"/></svg>`;

function usePieceCursor(
  boardId: string,
  selectedPiece: string | null,
): string | null {
  const [cursorUrl, setCursorUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPiece) {
      setCursorUrl(null);
      return;
    }

    if (selectedPiece === 'DELETE') {
      setCursorUrl(generateCursorFromMarkup(DELETE_SVG_MARKUP, 32));
      return;
    }

    const pieceEl = document.querySelector(
      `#${boardId}-piece-${selectedPiece}-${selectedPiece}`,
    );
    const cursor = generateCursorFromElement(pieceEl, 40);
    setCursorUrl(cursor);
  }, [boardId, selectedPiece]);

  return cursorUrl;
}

function useClickOutside(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onClickOutside: () => void,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;

    function handler(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClickOutside();
      }
    }

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [containerRef, onClickOutside, active]);
}

export const SelectableSparePieces: Story = {
  render: () => {
    const boardId = 'selectable-spare-pieces';
    const containerRef = useRef<HTMLDivElement>(null);

    const chessGameRef = useRef(
      new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
    );
    const chessGame = chessGameRef.current;

    const [chessPosition, setChessPosition] = useState(chessGame.fen());
    const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
    const [squareWidth, setSquareWidth] = useState<number | null>(null);

    const cursorUrl = usePieceCursor(boardId, selectedPiece);

    useEffect(() => {
      const square = document
        .querySelector(`[data-column="a"][data-row="1"]`)
        ?.getBoundingClientRect();
      setSquareWidth(square?.width ?? null);
    }, []);

    const clearSelection = useCallback(
      () => setSelectedPiece(null),
      [],
    );

    useClickOutside(containerRef, clearSelection, !!selectedPiece);

    function handleSelect(pieceType: string) {
      setSelectedPiece((prev) => (prev === pieceType ? null : pieceType));
    }

    function handleSelectDelete() {
      setSelectedPiece((prev) => (prev === 'DELETE' ? null : 'DELETE'));
    }

    function onPieceDrop({
      sourceSquare,
      targetSquare,
      piece,
    }: PieceDropHandlerArgs) {
      const color = piece.pieceType[0];
      const type = piece.pieceType[1].toLowerCase();

      if (!targetSquare) {
        chessGame.remove(sourceSquare as Square);
        setChessPosition(chessGame.fen());
        return true;
      }

      if (!piece.isSparePiece) {
        chessGame.remove(sourceSquare as Square);
      }

      const success = chessGame.put(
        { color: color as Color, type: type as PieceSymbol },
        targetSquare as Square,
      );

      if (!success) {
        alert(
          `Cannot place another ${color === 'w' ? 'white' : 'black'} King`,
        );
        return false;
      }

      setChessPosition(chessGame.fen());
      return true;
    }

    function onSquareClick({
      square,
    }: {
      piece: { pieceType: string } | null;
      square: string;
    }) {
      if (!selectedPiece) return;

      if (selectedPiece === 'DELETE') {
        chessGame.remove(square as Square);
        setChessPosition(chessGame.fen());
        return;
      }

      const color = selectedPiece[0];
      const type = selectedPiece[1].toLowerCase();

      chessGame.remove(square as Square);

      const success = chessGame.put(
        { color: color as Color, type: type as PieceSymbol },
        square as Square,
      );

      if (!success) {
        alert(
          `Cannot place another ${color === 'w' ? 'white' : 'black'} King`,
        );
        return;
      }

      setChessPosition(chessGame.fen());
    }

    const chessboardOptions = {
      position: chessPosition,
      onPieceDrop,
      onSquareClick,
      id: boardId,
    };

    function renderDeleteTool() {
      if (!squareWidth) return null;

      const isSelected = selectedPiece === 'DELETE';

      return (
        <button
          type="button"
          onClick={handleSelectDelete}
          style={{
            width: `${squareWidth}px`,
            height: `${squareWidth}px`,
            boxSizing: 'border-box',
            background: isSelected ? 'rgba(220, 53, 69, 0.15)' : 'transparent',
            border: isSelected ? '2px solid #dc3545' : '1px solid #ccc',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isSelected && cursorUrl ? cursorUrl : 'pointer',
            padding: 0,
          }}
          aria-label="Delete pieces tool"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width={squareWidth * 0.6}
            height={squareWidth * 0.6}
          >
            <path d="M 10 2 L 9 3 L 3 3 L 3 5 L 4.109375 5 L 5.8925781 20.255859 L 5.8925781 20.263672 C 6.023602 21.250335 6.8803207 22 7.875 22 L 16.123047 22 C 17.117726 22 17.974445 21.250322 18.105469 20.263672 L 18.107422 20.255859 L 19.890625 5 L 21 5 L 21 3 L 15 3 L 14 2 L 10 2 z M 6.125 5 L 17.875 5 L 16.123047 20 L 7.875 20 L 6.125 5 z" />
          </svg>
        </button>
      );
    }

    function renderSpareTray(pieceTypes: string[]) {
      if (!squareWidth) return null;

      return (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            width: 'fit-content',
            margin: '0 auto',
          }}
        >
          {renderDeleteTool()}
          {pieceTypes.map((pieceType) => (
            <div
              key={pieceType}
              style={{
                width: `${squareWidth}px`,
                height: `${squareWidth}px`,
              }}
            >
              <SparePiece
                pieceType={pieceType}
                isSelected={selectedPiece === pieceType}
                onSelect={handleSelect}
                cursorUrl={
                  selectedPiece === pieceType && cursorUrl
                    ? cursorUrl
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div ref={containerRef}>
        {selectedPiece && cursorUrl && (
          <style>{`
            #${boardId}-board,
            #${boardId}-board * {
              cursor: ${cursorUrl} !important;
            }
          `}</style>
        )}

        <ChessboardProvider options={chessboardOptions}>
          {renderSpareTray(BLACK_PIECE_TYPES)}
          <Chessboard />
          {renderSpareTray(WHITE_PIECE_TYPES)}
        </ChessboardProvider>
      </div>
    );
  },
};

export const EmptyBoardWithSparePieces: Story = {
  render: () => {
    const boardId = 'empty-board-spare-pieces';
    const containerRef = useRef<HTMLDivElement>(null);

    const chessGameRef = useRef(
      new Chess('8/8/8/8/8/8/8/8 w - - 0 1', { skipValidation: true }),
    );
    const chessGame = chessGameRef.current;

    const [chessPosition, setChessPosition] = useState(chessGame.fen());
    const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
    const [squareWidth, setSquareWidth] = useState<number | null>(null);

    const cursorUrl = usePieceCursor(boardId, selectedPiece);

    useEffect(() => {
      const square = document
        .querySelector(`[data-column="a"][data-row="1"]`)
        ?.getBoundingClientRect();
      setSquareWidth(square?.width ?? null);
    }, []);

    const clearSelection = useCallback(
      () => setSelectedPiece(null),
      [],
    );

    useClickOutside(containerRef, clearSelection, !!selectedPiece);

    function handleSelect(pieceType: string) {
      setSelectedPiece((prev) => (prev === pieceType ? null : pieceType));
    }

    function handleSelectDelete() {
      setSelectedPiece((prev) => (prev === 'DELETE' ? null : 'DELETE'));
    }

    function onPieceDrop({
      sourceSquare,
      targetSquare,
      piece,
    }: PieceDropHandlerArgs) {
      const color = piece.pieceType[0];
      const type = piece.pieceType[1].toLowerCase();

      if (!targetSquare) {
        chessGame.remove(sourceSquare as Square);
        setChessPosition(chessGame.fen());
        return true;
      }

      if (!piece.isSparePiece) {
        chessGame.remove(sourceSquare as Square);
      }

      const success = chessGame.put(
        { color: color as Color, type: type as PieceSymbol },
        targetSquare as Square,
      );

      if (!success) {
        alert(
          `Cannot place another ${color === 'w' ? 'white' : 'black'} King`,
        );
        return false;
      }

      setChessPosition(chessGame.fen());
      return true;
    }

    function onSquareClick({
      square,
    }: {
      piece: { pieceType: string } | null;
      square: string;
    }) {
      if (!selectedPiece) return;

      if (selectedPiece === 'DELETE') {
        chessGame.remove(square as Square);
        setChessPosition(chessGame.fen());
        return;
      }

      const color = selectedPiece[0];
      const type = selectedPiece[1].toLowerCase();

      chessGame.remove(square as Square);

      const success = chessGame.put(
        { color: color as Color, type: type as PieceSymbol },
        square as Square,
      );

      if (!success) {
        alert(
          `Cannot place another ${color === 'w' ? 'white' : 'black'} King`,
        );
        return;
      }

      setChessPosition(chessGame.fen());
    }

    const chessboardOptions = {
      position: chessPosition,
      onPieceDrop,
      onSquareClick,
      id: boardId,
    };

    function renderDeleteTool() {
      if (!squareWidth) return null;

      const isSelected = selectedPiece === 'DELETE';

      return (
        <button
          type="button"
          onClick={handleSelectDelete}
          style={{
            width: `${squareWidth}px`,
            height: `${squareWidth}px`,
            boxSizing: 'border-box',
            background: isSelected ? 'rgba(220, 53, 69, 0.15)' : 'transparent',
            border: isSelected ? '2px solid #dc3545' : '1px solid #ccc',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isSelected && cursorUrl ? cursorUrl : 'pointer',
            padding: 0,
          }}
          aria-label="Delete pieces tool"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width={squareWidth * 0.6}
            height={squareWidth * 0.6}
          >
            <path d="M 10 2 L 9 3 L 3 3 L 3 5 L 4.109375 5 L 5.8925781 20.255859 L 5.8925781 20.263672 C 6.023602 21.250335 6.8803207 22 7.875 22 L 16.123047 22 C 17.117726 22 17.974445 21.250322 18.105469 20.263672 L 18.107422 20.255859 L 19.890625 5 L 21 5 L 21 3 L 15 3 L 14 2 L 10 2 z M 6.125 5 L 17.875 5 L 16.123047 20 L 7.875 20 L 6.125 5 z" />
          </svg>
        </button>
      );
    }

    function renderSpareTray(pieceTypes: string[]) {
      if (!squareWidth) return null;

      return (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            width: 'fit-content',
            margin: '0 auto',
          }}
        >
          {renderDeleteTool()}
          {pieceTypes.map((pieceType) => (
            <div
              key={pieceType}
              style={{
                width: `${squareWidth}px`,
                height: `${squareWidth}px`,
              }}
            >
              <SparePiece
                pieceType={pieceType}
                isSelected={selectedPiece === pieceType}
                onSelect={handleSelect}
                cursorUrl={
                  selectedPiece === pieceType && cursorUrl
                    ? cursorUrl
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div ref={containerRef}>
        {selectedPiece && cursorUrl && (
          <style>{`
            #${boardId}-board,
            #${boardId}-board * {
              cursor: ${cursorUrl} !important;
            }
          `}</style>
        )}

        <ChessboardProvider options={chessboardOptions}>
          {renderSpareTray(BLACK_PIECE_TYPES)}
          <Chessboard />
          {renderSpareTray(WHITE_PIECE_TYPES)}
        </ChessboardProvider>
      </div>
    );
  },
};
