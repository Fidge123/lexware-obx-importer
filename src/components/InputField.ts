export interface InputFieldOptions {
  min?: string;
  max?: string;
  step?: string;
  placeholder?: string;
}

export class InputField {
  private container: HTMLElement;
  private input: HTMLInputElement;

  constructor(
    labelText: string,
    type: string,
    initialValue: string,
    options: InputFieldOptions = {},
    onChange: (value: string) => void
  ) {
    this.container = this.createElement(
      labelText,
      type,
      initialValue,
      options,
      onChange
    );
    this.input = this.container.querySelector("input") as HTMLInputElement;
  }

  getElement(): HTMLElement {
    return this.container;
  }

  getValue(): string {
    return this.input.value;
  }

  setValue(value: string): void {
    this.input.value = value;
  }

  private createElement(
    labelText: string,
    type: string,
    initialValue: string,
    options: InputFieldOptions,
    onChange: (value: string) => void
  ): HTMLElement {
    const div = document.createElement("div");
    div.className = "line-item-input";

    const label = document.createElement("label");
    label.textContent = labelText;

    const input = document.createElement("input");
    input.type = type;
    input.value = initialValue;

    // Set additional attributes
    Object.entries(options).forEach(([key, val]) => {
      if (val !== undefined) {
        input.setAttribute(key, val);
      }
    });

    input.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      onChange(target.value);
    });

    div.appendChild(label);
    div.appendChild(input);

    return div;
  }
}
