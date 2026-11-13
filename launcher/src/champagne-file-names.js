"use strict";
// Ordinary Windows file names, including Unicode and punctuation used by Forge.
function validateFileName(name) {
  if (typeof name !== "string" || !name || name.length > 255 ||
      /[<>:"/\\|?*\x00-\x1f]/.test(name) || /[. ]$/.test(name) ||
      name === "." || name === "..") {
    throw new Error("Nombre de archivo no válido para Windows.");
  }
  const stem = name.split(".")[0].replace(/ +$/, "");
  if (/^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])$/i.test(stem)) {
    throw new Error("Nombre reservado de Windows: " + name);
  }
  return name;
}
module.exports = { validateFileName };
