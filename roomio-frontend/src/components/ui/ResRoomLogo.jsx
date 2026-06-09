import { Image } from "@chakra-ui/react";
import logoSvg from "../../assets/logo/ResRoomLogo.svg";

export function ResRoomLogo({ h = "32px", ...props }) {
  return (
    <Image src={logoSvg} alt="ResRoom" h={h} w="auto" userSelect="none" draggable={false} {...props} />
  );
}
