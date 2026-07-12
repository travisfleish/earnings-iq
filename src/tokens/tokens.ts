export const colors = {
  navy: "#0D1226",
  blue: "#0000DC",
  lightBlue: "#95ECFD",
  brightGreen: "#E1FF67",
  lightGreen: "#18C971",
  green: "#047C40",
  lightPurple: "#C2D1FF",
  purple: "#4337A8",
  lightOrange: "#FFEBAF",
  orange: "#FA5D00",
  lightRed: "#F76B6A",
  red: "#C20000",
  black: "#000000",
  lightGrey: "#F6F7F9",
  lavenderGrey: "#E7E7E9",
  white: "#ffffff",
  snow: "#FAFAFA",
} as const;

export const fontFamily = {
  heading: "KlarheitKurrent",
  body: "RedHatText",
} as const;

export type ColorName = keyof typeof colors;
