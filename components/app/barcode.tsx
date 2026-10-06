// Código de barras Interleaved 2 of 5 (padrão dos boletos FEBRABAN), em SVG.

const PADROES = ["nnwwn", "wnnnw", "nwnnw", "wwnnn", "nnwnw", "wnwnn", "nwwnn", "nnnww", "wnnwn", "nwnwn"];

function barrasItf(digitos: string) {
  const d = digitos.length % 2 ? "0" + digitos : digitos;
  // sequência de larguras alternando barra/espaço, começando por barra
  const larguras: number[] = [1, 1, 1, 1]; // start: n n n n
  for (let i = 0; i < d.length; i += 2) {
    const a = PADROES[Number(d[i])];
    const b = PADROES[Number(d[i + 1])];
    for (let k = 0; k < 5; k++) {
      larguras.push(a[k] === "w" ? 3 : 1, b[k] === "w" ? 3 : 1);
    }
  }
  larguras.push(3, 1, 1); // stop: W n n
  return larguras;
}

export function Barcode({ value, className }: { value: string; className?: string }) {
  const larguras = barrasItf(value.replace(/\D/g, ""));
  const total = larguras.reduce((s, w) => s + w, 0);
  let x = 0;
  const rects: React.ReactNode[] = [];
  larguras.forEach((w, i) => {
    if (i % 2 === 0) rects.push(<rect key={i} x={x} y={0} width={w} height={50} />);
    x += w;
  });
  return (
    <svg
      viewBox={`0 0 ${total} 50`}
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label="Código de barras do boleto"
    >
      <g fill="#111">{rects}</g>
    </svg>
  );
}
