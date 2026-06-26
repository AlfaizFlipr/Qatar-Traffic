import {
  createTheme,
  Input,
  Select,
  TextInput,
  Textarea,
  type MantineColorsTuple,
} from "@mantine/core";

// Qatar MOI blue/navy brand palette.
const qatar: MantineColorsTuple = [
  "#e8f0fb",
  "#cddcf2",
  "#9bb6e2",
  "#668fd2",
  "#3d6ec5",
  "#2459bd",
  "#144fb9",
  "#0a43a6",
  "#073a90",
  "#16294e",
];

export const theme = createTheme({
  primaryColor: "qatar",
  primaryShade: 9,
  colors: { qatar },
  fontFamily: 'Inter, "Segoe UI", "Noto Kufi Arabic", Tahoma, sans-serif',
  headings: {
    fontFamily: 'Inter, "Segoe UI", "Noto Kufi Arabic", Tahoma, sans-serif',
  },
  defaultRadius: "md",
  components: {
    TextInput: TextInput.extend({ defaultProps: { size: "md" } }),
    Select: Select.extend({ defaultProps: { size: "md" } }),
    Textarea: Textarea.extend({ defaultProps: { size: "md" } }),
    Input: Input.extend({ defaultProps: { size: "md" } }),
  },
});
