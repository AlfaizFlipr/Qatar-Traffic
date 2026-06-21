import { createTheme, Input, Select, TextInput, Textarea, type MantineColorsTuple } from '@mantine/core'

// Qatar maroon brand palette.
const qatar: MantineColorsTuple = [
  '#ffe9ef',
  '#ffcfdb',
  '#f59cb2',
  '#ec6788',
  '#e43d64',
  '#e0244f',
  '#df1545',
  '#c60737',
  '#b10030',
  '#8a1538',
]

export const theme = createTheme({
  primaryColor: 'qatar',
  primaryShade: 9,
  colors: { qatar },
  fontFamily: 'Inter, "Segoe UI", "Noto Kufi Arabic", Tahoma, sans-serif',
  headings: { fontFamily: 'Inter, "Segoe UI", "Noto Kufi Arabic", Tahoma, sans-serif' },
  defaultRadius: 'md',
  components: {
    TextInput: TextInput.extend({ defaultProps: { size: 'md' } }),
    Select: Select.extend({ defaultProps: { size: 'md' } }),
    Textarea: Textarea.extend({ defaultProps: { size: 'md' } }),
    Input: Input.extend({ defaultProps: { size: 'md' } }),
  },
})
