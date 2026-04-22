import { Text, type TextStyle } from 'react-native';

interface HighlightedTextProps {
  text: string;
  query: string;
  style?: TextStyle;
  highlightColor?: string;
}

export function HighlightedText({ text, query, style, highlightColor = '#8B5CF6' }: HighlightedTextProps) {
  if (!query.trim()) return <Text style={style}>{text}</Text>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  const lowerQuery = query.toLowerCase();

  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.toLowerCase() === lowerQuery
          ? <Text key={i} style={{ color: highlightColor }}>{part}</Text>
          : <Text key={i}>{part}</Text>
      )}
    </Text>
  );
}
