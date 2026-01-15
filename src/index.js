import { initCrypto } from "./crypto/pesCrypto.js";
import { createEditBinUI } from "./ui/EditBinView.js";
import { createOptionUI } from "./ui/OptionFileView.js";

await initCrypto();

createEditBinUI(document.getElementById("edit-bin"));
createOptionUI(document.getElementById("option-file"));
