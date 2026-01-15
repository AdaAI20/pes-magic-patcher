import { loadOptionFile } from "../parsers/optionFileParser.js";

export function createOptionUI(container) {
  const input = document.createElement("input");
  input.type = "file";

  input.onchange = async () => {
    const data = await loadOptionFile(input.files[0]);
    console.log("Option file loaded", data);
  };

  container.appendChild(input);
}
