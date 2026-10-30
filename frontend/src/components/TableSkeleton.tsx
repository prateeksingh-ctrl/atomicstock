// UI-02: Staggered shimmer skeleton for table loading states
interface Props {
  rows?: number;
  cols?: number;
}

export default function TableSkeleton({ rows = 5, cols = 5 }: Props) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-[#E5E5EA]">
          {/* First column: avatar + text block */}
          <td className="py-4 px-6">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-full bg-[#E8E8ED] animate-pulse flex-shrink-0"
                style={{ animationDelay: `${rowIdx * 60}ms` }}
              />
              <div className="space-y-1.5">
                <div
                  className="h-3 bg-[#E8E8ED] rounded-full animate-pulse w-28"
                  style={{ animationDelay: `${rowIdx * 60 + 20}ms` }}
                />
                <div
                  className="h-2.5 bg-[#F5F5F7] rounded-full animate-pulse w-36"
                  style={{ animationDelay: `${rowIdx * 60 + 40}ms` }}
                />
              </div>
            </div>
          </td>
          {/* Remaining columns */}
          {Array.from({ length: cols - 1 }).map((_, colIdx) => (
            <td key={colIdx} className="py-4 px-6">
              <div
                className="h-3.5 bg-[#E8E8ED] rounded-full animate-pulse"
                style={{
                  width: colIdx === cols - 2 ? '30%' : '60%',
                  animationDelay: `${(rowIdx * cols + colIdx) * 40}ms`,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

