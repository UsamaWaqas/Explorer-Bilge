import React, { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  updateDeviceLocationService,
  updateDeviceNameService,
} from "../../services/userDeviceservices";
import { EditableCellProps } from "../../types/UserDevices.types";

export default function EditableCell({
  value,
  fieldKey,
  row,
  onRefetch,
}: EditableCellProps) {
  const [text, setText] = useState(value);
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setText(value);
    setDirty(false);
  }, [value]);

  async function handleSave() {
    const isLocation = fieldKey === "deviceLocation";
    setIsSaving(true);

    const success = isLocation
      ? await updateDeviceLocationService(row.id, text, row.area_id)
      : await updateDeviceNameService(row.id, text, row.site_id);

    if (success) {
      setDirty(false);
      onRefetch();
    }

    setIsSaving(false);
  }

  return (
    <View style={{ gap: 4 }}>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#d1d5db",
          borderRadius: 6,
          paddingHorizontal: 6,
          paddingVertical: 3,
          fontSize: 11,
          color: "#111827",
          width: 130,
        }}
        value={text}
        onChangeText={(v) => {
          setText(v);
          setDirty(true);
        }}
      />
     <Pressable
  onPress={handleSave}
  disabled={!dirty || isSaving}
  style={{
    backgroundColor: dirty && !isSaving ? "#2563eb" : "#93c5fd",
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  }}
>
  <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600" }}>
    {isSaving ? "Save" : "Save"}
  </Text>
</Pressable>
    </View>
  );
}