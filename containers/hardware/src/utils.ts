/**
 *  ██████╗ ███████╗██╗  ██╗███████╗██╗   ██╗██╗ ██████╗
 * ██║   ██║███████╗█████╔╝ █████╗   ╚████╔╝ ██║██║   ██║
 * ██║   ██║╚════██║██╔═██╗ ██╔══╝    ╚██╔╝  ██║██║   ██║
 * ╚██████╔╝███████║██║  ██╗███████╗   ██║██╗██║╚██████╔╝
 *  ╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝╚═╝╚═╝ ╚═════╝
 *
 * @author Greg PFISTER <greg@oskey.io>
 * @since v0.1.0
 * @copyright (c) 2020, OSkey.io. All rights reserved.
 * @license SEE LICENSE IN LICENSE.md
 */

export function toHex(byte: number): string {
  let hex = byte.toString(16);
  for (let i = hex.length; i < 2; i++) hex = "0" + hex;
  return `0x${hex}`;
}

export function toBinary(byte: number): string {
  let binary = byte.toString(2);
  for (let i = binary.length; i < 8; i++) binary = "0" + binary;
  return `0b${binary}`;
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
