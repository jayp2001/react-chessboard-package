import type React from 'react';

import { Draggable } from './Draggable.js';
import { Piece } from './Piece.js';
import { defaultSelectedSparePieceStyle } from './defaults.js';

export type SparePieceProps = {
  /** Piece type identifier, e.g. "wP", "bQ". */
  pieceType: string;
  /** Whether this spare piece is currently selected. */
  isSelected?: boolean;
  /** Style overrides applied when `isSelected` is true. */
  selectedStyle?: React.CSSProperties;
  /** CSS cursor value applied when `isSelected` is true (e.g. a data-URI cursor of the piece SVG). Falls back to `'copy'` if omitted. */
  cursorUrl?: string;
  /** Called when the piece is clicked. Receives the `pieceType`. */
  onSelect?: (pieceType: string) => void;
};

export function SparePiece({
  pieceType,
  isSelected = false,
  selectedStyle,
  cursorUrl,
  onSelect,
}: SparePieceProps) {
  const activeCursor = isSelected
    ? cursorUrl ?? 'copy'
    : 'pointer';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        cursor: activeCursor,
        ...(isSelected
          ? { ...defaultSelectedSparePieceStyle, ...selectedStyle }
          : {}),
      }}
      onClick={() => onSelect?.(pieceType)}
    >
      <Draggable isSparePiece position={pieceType} pieceType={pieceType}>
        <Piece isSparePiece pieceType={pieceType} position={pieceType} />
      </Draggable>
    </div>
  );
}
