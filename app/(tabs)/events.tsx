import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { EventCardList } from "../../components/EventCard";
import { useEventColumns } from "../../components/Events/EventColumns";
import { EventsHeader } from "../../components/Events/EventsHeader";
import GlobalTable from "../../components/Table";
import { usePackets } from "../../hooks/usePackets";
import { usePusherEvent } from "../../hooks/usePusher";

type ViewMode = "table" | "card";

export default function Events() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const {
    rows,
    totalRows,
    isLoading,
    eventType,
    paginationParams,
    fetchPackets,
    handleEventTypeChange,
    handlePageChange,
    handleRowsPerPageChange,
    getIsAlert,
    getAlertTimes,
  } = usePackets();

  useFocusEffect(
    useCallback(() => {
      fetchPackets();
    }, [fetchPackets])
  );

  usePusherEvent(fetchPackets);

  const columns = useEventColumns({ rows, getIsAlert, getAlertTimes });

  return (
    <View className="flex-1 bg-white py-3">
      <View className="flex-1">
        <EventsHeader
          eventType={eventType}
          onEventTypeChange={handleEventTypeChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {viewMode === "table" && (
          <View className="p-2">
            <GlobalTable
              columns={columns}
              data={rows}
              defaultRowsPerPage={paginationParams.limit}
              totalRows={totalRows}
              currentPage={paginationParams.currentPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              isLoading={isLoading}
            />
          </View>
        )}

        {viewMode === "card" && (
          <View className="flex-1 px-2">
            <EventCardList
              key={eventType}
              rows={rows}
              totalRows={totalRows}
              currentPage={paginationParams.currentPage}
              rowsPerPage={paginationParams.limit}
              isLoading={isLoading}
              getIsAlert={getIsAlert}
              getAlertTimes={getAlertTimes}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </View>
        )}
      </View>
    </View>
  );
}