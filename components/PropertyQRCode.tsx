import { QRCodeSVG } from "qrcode.react";

interface PropertyQRCodeProps {
  value: string;
}

export default function PropertyQRCode({ value }: PropertyQRCodeProps) {
  return (
    <QRCodeSVG
      value={value}
      size={140}
      level="M"
      includeMargin={false}
    />
  );
}
