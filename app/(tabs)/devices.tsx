import GlobalTable from "@/components/Table";
import React, { useMemo } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import SettingsModal from "../../components/devices/SettingsModal";
import GlobalInput from "../../components/Input";
import { getUserDeviceColumns } from "../../constants/userDeviceColumns";
import { useUserDevices } from "../../hooks/useUserDevices";

const UserDevices: React.FC = () => {
  const {
    user,
    rows,
    isFetching,
    isConnected,
    searchText,
    settingsRow,
    setSettingsRow,
    fetchDevices,
    handleSearchChange,
    openMap,
    getDotColor,
  } = useUserDevices();

  const columns = useMemo(
    () =>
      getUserDeviceColumns({
        user,
        fetchDevices,
        openMap,
        getDotColor,
        setSettingsRow,
      }),
    [user, fetchDevices, openMap, getDotColor]
  );

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1">

        {/* Header */}
        <View className="flex-row px-4 py-3 items-center mb-4 justify-between bg-white border-b border-gray-200">
          <View className="flex-row justify-between items-center w-full">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-bold text-[#2C64B3]">
                My Devices
              </Text>
            </View>

            <GlobalInput
              placeholder="Search..."
              value={searchText}
              onChangeText={handleSearchChange}
              containerClassName="w-[200px]"
              inputClassName="text-[13px]"
            />
          </View>
        </View>

        {/* Table — hamesha visible */}
        <GlobalTable
          columns={columns}
          data={rows}
          defaultRowsPerPage={10}
           isLoading={isFetching}
          // emptyText="No data available"
        />

      </View>

      {/* Settings Modal */}
      {settingsRow && (
        <SettingsModal
          row={settingsRow}
          visible={!!settingsRow}
          onClose={() => setSettingsRow(null)}
          onRefetch={fetchDevices}
        />
      )}
    </View>
  );
};

export default UserDevices;