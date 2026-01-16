import { loadEditBin } from "../parsers/editBinParser";

export function createEditBinUI(container) {
  const input = document.createElement("input");
  input.type = "file";

  input.onchange = async () => {
    const edit = await loadEditBin(input.files[0]);
    console.log("EDIT loaded", edit);
  };

  container.appendChild(input);
}
