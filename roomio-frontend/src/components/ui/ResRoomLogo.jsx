import { Image } from "@chakra-ui/react";
import logoSvg from "../../assets/logo/ResRoomLogo.svg";

/**
 * ResRoom logo SVG component.
 * @param {string} [h] Logo height (default "40px")
 * @returns {JSX.Element} The logo SVG
 */
export function ResRoomLogo({ h = "32px", ...props }) {
  return (
    <Image src={logoSvg} alt="ResRoom" h={h} w="auto" userSelect="none" draggable={false} {...props} />
  );
}
