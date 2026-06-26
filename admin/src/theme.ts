import { createTheme } from "@mantine/core";

// Qatar maroon-inspired brand palette.
export const theme = createTheme({
  primaryColor: "brand",
  primaryShade: 6,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  defaultRadius: "md",
  colors: {
    brand: [
      "#fbeaef",
      "#f3c4d1",
      "#e89bb1",
      "#dd7091",
      "#d44d76",
      "#cf3865",
      "#8d1b3d", // 6 — primary (Qatar maroon)
      "#7a1735",
      "#66122c",
      "#520d23",
    ],
  },
});
