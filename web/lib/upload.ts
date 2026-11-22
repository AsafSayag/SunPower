/* Accept only files whose first bytes match the type their name claims, so a renamed
   program cannot reach the office inbox as an attachment. */
const SIGNATURES: Record<string, number[][]> = {
  ".pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  ".png": [[0x89, 0x50, 0x4e, 0x47]],
  ".jpg": [[0xff, 0xd8, 0xff]],
  ".jpeg": [[0xff, 0xd8, 0xff]],
  ".doc": [[0xd0, 0xcf, 0x11, 0xe0]], // legacy Office
  ".docx": [[0x50, 0x4b, 0x03, 0x04]], // zip container
};

export function fileMatchesType(name: string, data: Buffer): boolean {
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  return (SIGNATURES[ext] ?? []).some((sig) => sig.every((b, i) => data[i] === b));
}
