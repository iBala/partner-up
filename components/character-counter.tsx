interface CharacterCounterProps {
  current: number;
  min?: number;
  max?: number;
}

export function CharacterCounter({ current, min, max }: CharacterCounterProps) {
  const getColor = () => {
    if (!min && !max) return "text-gray-500";
    if (min && current < min) return "text-red-500";
    if (max && current > max) return "text-red-500";
    return "text-green-500";
  };

  return (
    <div className={`text-sm ${getColor()} transition-colors duration-200`}>
      {min && current < min && (
        <span>{min - current} more characters needed</span>
      )}
      {max && current > max && (
        <span>{current - max} characters over limit</span>
      )}
      {((!min || current >= min) && (!max || current <= max)) && (
        <span>{current} characters</span>
      )}
    </div>
  );
} 