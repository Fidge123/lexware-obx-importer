export class DeleteButton {
  private element: HTMLButtonElement;

  constructor(index: number, onDelete: (index: number) => void) {
    this.element = this.createElement(index, onDelete);
  }

  getElement(): HTMLButtonElement {
    return this.element;
  }

  private createElement(
    index: number,
    onDelete: (index: number) => void
  ): HTMLButtonElement {
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.innerHTML = "×";
    deleteButton.title = "Position löschen";

    deleteButton.addEventListener("click", () => {
      onDelete(index);
    });

    return deleteButton;
  }
}
