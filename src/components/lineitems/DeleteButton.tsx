import React from "react";

interface DeleteButtonProps {
  index: number;
  onDelete: (index: number) => void;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({
  index,
  onDelete,
}) => {
  const handleClick = () => {
    onDelete(index);
  };

  return (
    <button
      type="button"
      className="delete-button"
      title="Position löschen"
      onClick={handleClick}
    >
      ×
    </button>
  );
};
