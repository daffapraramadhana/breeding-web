interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color: string;
}

export function MiniSparkline({ data, width = 40, height = 16, color }: MiniSparklineProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}
