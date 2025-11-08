export function DeleteButton({ index, onDelete }: Props) {
  return (
    <button
      type="button"
      className="h-7 w-7 cursor-pointer rounded bg-red-500 text-sm text-white transition-colors hover:bg-red-600"
      title="Position löschen"
      onClick={() => onDelete(index)}
    >
      ×
    </button>
  );
}

interface Props {
  index: number;
  onDelete: (index: number) => void;
}
