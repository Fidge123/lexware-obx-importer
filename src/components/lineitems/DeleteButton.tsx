export function DeleteButton({ index, onDelete }: Props) {
  return (
    <button
      type="button"
      className="bg-red-500 text-white rounded h-7 w-7 text-sm cursor-pointer hover:bg-red-600 transition-colors"
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
