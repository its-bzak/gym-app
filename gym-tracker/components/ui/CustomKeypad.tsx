import { Pressable, StyleSheet, Text, View } from "react-native";

export type CustomKeypadMode = "integer" | "decimal" | "time";

type KeyDescriptor = {
  key: string;
  label: string;
  flex?: number;
  variant?: "default" | "secondary" | "primary";
};

type CustomKeypadProps = {
  mode: CustomKeypadMode;
  value: string;
  onChange: (value: string) => void;
  onDone?: () => void;
};

function splitTimeValue(value: string) {
  const normalizedValue = value.toLowerCase();
  const suffixMatch = normalizedValue.match(/(am|pm)$/);
  const suffix = suffixMatch?.[1] ?? "";
  const body = suffix ? normalizedValue.slice(0, -suffix.length) : normalizedValue;

  return {
    body,
    suffix,
  };
}

function applyNumericKey(value: string, key: string, mode: CustomKeypadMode) {
  if (key === "done") {
    return value;
  }

  if (key === "clear") {
    return "";
  }

  if (key === "backspace") {
    return value.slice(0, -1);
  }

  if (key === ".") {
    if (mode !== "decimal" || value.includes(".")) {
      return value;
    }

    return value ? `${value}.` : "0.";
  }

  return `${value}${key}`;
}

function applyTimeKey(value: string, key: string) {
  const { body, suffix } = splitTimeValue(value);
  const digitCount = body.replace(/[^0-9]/g, "").length;

  if (key === "done") {
    return value;
  }

  if (key === "clear") {
    return "";
  }

  if (key === "backspace") {
    if (suffix) {
      return body;
    }

    return body.slice(0, -1);
  }

  if (key === "am" || key === "pm") {
    if (!body.trim()) {
      return value;
    }

    return `${body}${key}`;
  }

  if (key === ":") {
    if (!body || body.includes(":")) {
      return value;
    }

    return `${body}:${suffix}`;
  }

  if (digitCount >= 4) {
    return value;
  }

  return `${body}${key}${suffix}`;
}

function getRows(mode: CustomKeypadMode): KeyDescriptor[][] {
  const baseRows: KeyDescriptor[][] = [
    [
      { key: "1", label: "1" },
      { key: "2", label: "2" },
      { key: "3", label: "3" },
    ],
    [
      { key: "4", label: "4" },
      { key: "5", label: "5" },
      { key: "6", label: "6" },
    ],
    [
      { key: "7", label: "7" },
      { key: "8", label: "8" },
      { key: "9", label: "9" },
    ],
  ];

  if (mode === "time") {
    return [
      ...baseRows,
      [
        { key: ":", label: ":" },
        { key: "0", label: "0" },
        { key: "backspace", label: "⌫", variant: "secondary" },
      ],
      [
        { key: "am", label: "AM", variant: "secondary" },
        { key: "pm", label: "PM", variant: "secondary" },
        { key: "clear", label: "Clear", variant: "secondary" },
      ],
      [{ key: "done", label: "Done", flex: 3, variant: "primary" }],
    ];
  }

  return [
    ...baseRows,
    [
      { key: mode === "decimal" ? "." : "clear", label: mode === "decimal" ? "." : "Clear", variant: "secondary" },
      { key: "0", label: "0" },
      { key: "backspace", label: "⌫", variant: "secondary" },
    ],
    mode === "decimal"
      ? [
          { key: "clear", label: "Clear", variant: "secondary" },
          { key: "done", label: "Done", flex: 2, variant: "primary" },
        ]
      : [{ key: "done", label: "Done", flex: 3, variant: "primary" }],
  ];
}

export default function CustomKeypad({ mode, value, onChange, onDone }: CustomKeypadProps) {
  const rows = getRows(mode);

  const handleKeyPress = (key: string) => {
    if (key === "done") {
      onDone?.();
      return;
    }

    const nextValue = mode === "time" ? applyTimeKey(value, key) : applyNumericKey(value, key, mode);
    onChange(nextValue);
  };

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={`${mode}-row-${rowIndex}`} style={styles.row}>
          {row.map((descriptor) => (
            <Pressable
              key={`${mode}-${descriptor.key}-${rowIndex}`}
              style={[
                styles.key,
                { flex: descriptor.flex ?? 1 },
                descriptor.variant === "secondary" ? styles.keySecondary : null,
                descriptor.variant === "primary" ? styles.keyPrimary : null,
              ]}
              onPress={() => handleKeyPress(descriptor.key)}>
              <Text
                style={[
                  styles.keyLabel,
                  descriptor.variant === "primary" ? styles.keyLabelPrimary : null,
                ]}>
                {descriptor.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  key: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#202020",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  keySecondary: {
    backgroundColor: "#252525",
  },
  keyPrimary: {
    backgroundColor: "#F4F4F4",
  },
  keyLabel: {
    color: "#F4F4F4",
    fontSize: 18,
    fontWeight: "600",
  },
  keyLabelPrimary: {
    color: "#111111",
  },
});