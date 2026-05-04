export const EXTERNAL_INPUT_MESSAGES: Record<string, string> = {
  "AQUAMAX One": "Leak Detected",
  "BILGEMAX ONE": "High Water Alarm Detected",
  GENMAX: "Generator Running",
  "MAX-SIBERIA": "Alarm Detected",
  "MAXAC-R": "Low Oil Detected",
  "MAXNOTIFI HEAT": "Open Alarm Detected",
  PWRNOTIFI: "Power Loss Detected",
  SMXNOTIFI: "Alarm Detected",
  SMXONEPIR: "Alarm Detected",
  "BATTERY NOTIFI": "Battery Alert",
  "SmartMAX ONE Storage": "Open Alarm",
  "MAX SIBERIA": "Temperature out of range",
};

export const EVENT_TYPE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Alert", value: "1" },
  { label: "Check-in", value: "0" },
];
