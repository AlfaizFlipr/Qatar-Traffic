/**
 * Generates a CAPTCHA challenge as an SVG data-URI (no native deps).
 * Used by the "simulated" scraper mode so the whole user-assisted CAPTCHA
 * flow is testable without Playwright or the real MOI site.
 */
const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I/L

function rand(max: number): number {
  return Math.floor(Math.random() * max);
}

export interface CaptchaChallenge {
  code: string;
  image: string; // data:image/svg+xml;base64,...
}

export function generateCaptcha(length = 5): CaptchaChallenge {
  let code = "";
  for (let i = 0; i < length; i++) code += CHARS[rand(CHARS.length)];

  const width = 150;
  const height = 50;
  const colors = ["#16294e", "#1c7e90", "#1e4a8a", "#2b3a55"];

  const chars = code
    .split("")
    .map((ch, i) => {
      const x = 18 + i * 26 + rand(6);
      const y = 34 + rand(8) - 4;
      const rot = rand(40) - 20;
      const color = colors[rand(colors.length)];
      return `<text x="${x}" y="${y}" fill="${color}" font-size="28" font-family="monospace" font-weight="bold" transform="rotate(${rot} ${x} ${y})">${ch}</text>`;
    })
    .join("");

  // noise lines
  let noise = "";
  for (let i = 0; i < 5; i++) {
    noise += `<line x1="${rand(width)}" y1="${rand(height)}" x2="${rand(width)}" y2="${rand(height)}" stroke="${colors[rand(colors.length)]}" stroke-width="1" opacity="0.4"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#eef1f5"/>${noise}${chars}</svg>`;

  return {
    code,
    image: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
  };
}
