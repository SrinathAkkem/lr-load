/** pdf-lib standard fonts only support WinAnsi — strip/replace common Unicode. */
export function pdfText(text: string): string {
  return text
    .replace(/₹/g, "Rs.")
    .replace(/→/g, " to ")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}
