export class DescriptionElement {
  private element: HTMLElement;

  constructor(description: string, maxLength: number = 100) {
    this.element = this.createElement(description, maxLength);
  }

  getElement(): HTMLElement {
    return this.element;
  }

  private createElement(description: string, maxLength: number): HTMLElement {
    const descDiv = document.createElement("div");
    descDiv.className = "line-item-description";

    const truncated = this.truncateText(description, maxLength);
    const isTruncated = description.length > maxLength;

    if (isTruncated) {
      descDiv.className += " truncated";
      descDiv.textContent = truncated;

      const tooltip = document.createElement("div");
      tooltip.className = "tooltip";
      tooltip.textContent = description;
      descDiv.appendChild(tooltip);
    } else {
      descDiv.textContent = description;
    }

    return descDiv;
  }

  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength) : text;
  }
}
