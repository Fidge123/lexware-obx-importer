export function MultiplierInput() {
  return (
    <label>
      Aufschlag in %
      <input type="number" autoComplete="off" defaultValue={0} step={0.1} />
    </label>
  );
}
