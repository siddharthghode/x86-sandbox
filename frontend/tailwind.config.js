/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        blue: { DEFAULT: "#185FA5", bg: "#E6F1FB", text: "#0C447C" },
        green: { DEFAULT: "#3B6D11", bg: "#EAF3DE", text: "#27500A" },
        amber: { DEFAULT: "#854F0B", bg: "#FAEEDA", text: "#633806" },
        red: { DEFAULT: "#A32D2D", bg: "#FCEBEB", text: "#791F1F" },
        purple: { DEFAULT: "#534AB7", bg: "#EEEDFE", text: "#3C3489" },
        teal: { DEFAULT: "#0F6E56", bg: "#E1F5EE", text: "#085041" },
      },
    },
  },
  plugins: [],
};
